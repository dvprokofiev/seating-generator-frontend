/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { ref, computed } from 'vue';
const classes = ref([]);
const currentClass = ref(null);
export default function useClasses()
{
    const selectedClassId = ref('');
    const newClassName = ref('');
    const saveClasses = () => {
        localStorage.setItem('Classes', JSON.stringify(classes.value));
    };
    const loadClasses = () => {
        const saved = localStorage.getItem('Classes');
        classes.value = saved ? JSON.parse(saved) : [];
    };
    const addNewClass = (name) => {
        const newClass = { id: Date.now(), name, students: [], preferences: [], forbidden: [], seatings: [], priorities: { medical: 0.8, friends: 0.4, enemies: 0.7, preferences: 0.5, fill: 0.3, }};
        classes.value.push(newClass);
        saveClasses();
    };
   const saveSeating = (classId, serverResponse, clsConfig) => {
      const targetClass = classes.value.find(c => c.id == classId);
      if (!targetClass) return { success: false, reason: 'class_not_found' };
      const seatingArray = serverResponse.Seating || serverResponse;
      
      if (!Array.isArray(seatingArray)) return { success: false, reason: 'invalid_data' };

      const getFingerprint = (arr) => arr.map(s => `${s.row || s.Row}-${s.col || s.Column}-${s.studentId || s.StudentID}`).sort().join('|');
      
      const newFingerprint = getFingerprint(seatingArray);
      const isDuplicate = targetClass.seatings?.some(old => getFingerprint(old.Seating || old) === newFingerprint);

      if (isDuplicate) return { success: false, reason: 'duplicate' };

      const entryToSave = {
        Seating: seatingArray,
        Rows: clsConfig?.rows || clsConfig?.Rows || 0,
        Columns: clsConfig?.columns || clsConfig?.Columns || 0,
        DeskType: clsConfig?.deskType || clsConfig?.DeskType || 'single',
        Date: serverResponse.Date || Math.floor(Date.now() / 1000),
        Fitness: serverResponse.Fitness || 0,
        ID: serverResponse.ID || Date.now().toString()
      };

      if (!targetClass.seatings) targetClass.seatings = [];
      targetClass.seatings.unshift(entryToSave);
      
      saveClasses();
      return { success: true };
    };
    const deleteClass = (id) => {
        const idx = classes.value.findIndex(cls => cls.id === id);
        if (idx !== -1) {
            classes.value.splice(idx, 1);
            saveClasses();
        }
    };
    const addPreference = (cls) => {
        cls.preferences.push(["", ""])
    };
    const checkName = (name, cls) => {
        if (!name) return null;
        return cls.students.some(s => s.name === name);
    };

    const parseCommaSeparated = (str) => {
      if (!str) return [];
      return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    };  
      
    const getValidationErrors = ((targetClass) => {
        const error = []
        if (!targetClass || !targetClass.classConfig) {
          return [];
        }
        const { students, preferences, forbidden, classConfig } = targetClass

        if (classConfig.rows <= 0) {
          error.push('Количество рядов должно быть положительным целым числом')
        }
        if (classConfig.columns <= 0) {
          error.push('Количество парт должно быть положительным целым числом')
        }
    
        const studentsIDs = new Map()
        students.forEach((student) => {
          studentsIDs.set(student.id, student.name)
          parseCommaSeparated(student.preferredRows).forEach((row) => {
            if (row < 0 || row > classConfig.rows) {
              error.push(`Недопустимый ряд ${row} для ученика ${student.name}`)
            }
          })
          parseCommaSeparated(student.preferredColumns).forEach((col) => {
            const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
            if (col < 0 || col > maxCols) {
              error.push(`Недопустимая парта ${col} для ученика ${student.name}`)
            }
          })
          parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
            const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
            if (col < 0 || col > maxCols) {
              error.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`)
            }
          })
          parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
            if (row < 0 || row > classConfig.rows) {
              error.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`)
            }
          })
        })

        targetClass.students.forEach((s, index) => {
        if (!s.name || s.name.trim() === "") {
          error.push(`Ученик №${index + 1} не имеет имени`);
        }
      });

        const checkDuplicates = (pairs, listName) => {
          const seen = new Set()
          pairs.forEach(pair => {
            if (pair[0] !== null && pair[1] !== null) {
              const key = JSON.stringify([...pair].sort())
              if (seen.has(key)) {
                const n1 = studentsIDs.get(pair[0]) || '?'
                const n2 = studentsIDs.get(pair[1]) || '?'
                error.push(`Дублирующаяся пара в ${listName}: ${n1} и ${n2}`)
              }
              seen.add(key)
            }
          })
        }
        checkDuplicates(preferences, 'предпочтениях')
        checkDuplicates(forbidden, 'запретах')
    
        preferences.forEach((pair) => {
          if (pair[0] === pair[1] && pair[0] !== null) {
            error.push(`${studentsIDs.get(pair[0])} не может хотеть сидеть сам с собой`)
          }
          if (pair[0] === null || pair[1] === null || pair[0] === undefined || pair[1] === undefined || pair[0] === '' || pair[1] === '') {
            error.push(`Пара в предпочтениях не может содержать пустые значения`)
          }
        })
    
        forbidden.forEach((pair) => {
          if (pair[0] === pair[1] && pair[0] !== null) {
            error.push(`${studentsIDs.get(pair[0])} не может не сидеть сам с собой`)
          }
        })
    
        const prefKeys = new Set(preferences.map(p => JSON.stringify([...p].sort())))
        forbidden.forEach(pair => {
          const key = JSON.stringify([...pair].sort())
          if (prefKeys.has(key) && pair[0] !== null && pair[1] !== null) {
            const n1 = studentsIDs.get(pair[0])
            const n2 = studentsIDs.get(pair[1])
            error.push(`Противоречие: пара ${n1} и ${n2} есть и в желаемых, и в запрещенных`)
          }
        })

        return error;
    })
    const hasErrors = computed(() => {
      const activeId = window.location.pathname.split('/').pop();
      const currentCls = classes.value.find(c => String(c.id) === String(activeId));
      
      if (!currentCls) return false;
      return getValidationErrors(currentCls).length > 0;
    });
    return {
        classes,
        selectedClassId,
        newClassName,
        currentClass,
        hasErrors,
        saveSeating,
        getValidationErrors,
        saveClasses,
        addNewClass,
        deleteClass,
        loadClasses,
        addPreference,
        checkName,
    };
}
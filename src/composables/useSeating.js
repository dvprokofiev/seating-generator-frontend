/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { ref, computed } from 'vue'
import axios from 'axios'

export function useSeating() {
  const request = ref({
    students: [],
    preferences: [],
    forbidden: [],
    classConfig: {
      rows: 0,
      columns: 0,
      deskType: 'double'
    }
  })
  const priorities = ref({
    medical: 0.8,
    friends: 0.4,
    enemies: 0.7,
    preferences: 0.5,
    fill: 0.3,
  })
  const response = ref([])
  const error = ref('')
  const ignored = ref([])
  const fitness = ref(0)
  const validateErrors = computed(() => {
    const errors = []
    const { students, preferences, forbidden, classConfig } = request.value

    if (classConfig.rows <= 0) {
      errors.push('Количество рядов должно быть положительным целым числом')
    }
    if (classConfig.columns <= 0) {
      errors.push('Количество парт должно быть положительным целым числом')
    }

    const studentsIDs = new Map()
    students.forEach((student) => {
      studentsIDs.set(student.id, student.name)
      parseCommaSeparated(student.preferredRows).forEach((row) => {
        if (row < 0 || row >= classConfig.rows) {
          errors.push(`Недопустимый ряд ${row} для ученика ${student.name}`)
        }
      })
      parseCommaSeparated(student.preferredColumns).forEach((col) => {
        const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
        if (col < 0 || col >= maxCols) {
          errors.push(`Недопустимая парта ${col} для ученика ${student.name}`)
        }
      })
      parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
        const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
        if (col < 0 || col >= maxCols) {
          errors.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`)
        }
      })
      parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
        if (row < 0 || row >= classConfig.rows) {
          errors.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`)
        }
      })
    })

    const checkDuplicates = (pairs, listName) => {
      const seen = new Set()
      pairs.forEach(pair => {
        if (pair[0] !== null && pair[1] !== null) {
          const key = JSON.stringify([...pair].sort())
          if (seen.has(key)) {
            const n1 = studentsIDs.get(pair[0]) || '?'
            const n2 = studentsIDs.get(pair[1]) || '?'
            errors.push(`Дублирующаяся пара в ${listName}: ${n1} и ${n2}`)
          }
          seen.add(key)
        }
      })
    }
    checkDuplicates(preferences, 'предпочтениях')
    checkDuplicates(forbidden, 'запретах')

    preferences.forEach((pair) => {
      if (pair[0] === pair[1] && pair[0] !== null) {
        errors.push(`${studentsIDs.get(pair[0])} не может хотеть сидеть сам с собой`)
      }
    })

    forbidden.forEach((pair) => {
      if (pair[0] === pair[1] && pair[0] !== null) {
        errors.push(`${studentsIDs.get(pair[0])} не может не сидеть сам с собой`)
      }
    })

    const prefKeys = new Set(preferences.map(p => JSON.stringify([...p].sort())))
    forbidden.forEach(pair => {
      const key = JSON.stringify([...pair].sort())
      if (prefKeys.has(key) && pair[0] !== null && pair[1] !== null) {
        const n1 = studentsIDs.get(pair[0])
        const n2 = studentsIDs.get(pair[1])
        errors.push(`Противоречие: пара ${n1} и ${n2} есть и в желаемых, и в запрещенных`)
      }
    })
    return errors
  })

  function getStudentNameById(id) {
    const student = request.value.students.find(s => s.id === id)
    return student ? (student.name || `Ученик ${id}`) : ''
  }

  function getStudentIdByName(name) {
    if (!name) return null
    const student = request.value.students.find(s =>
      (s.name || `Ученик ${s.id}`) === name.trim()
    )
    return student ? student.id : null
  }

  const findIdByName = (name) => {
    const s = request.value.students.find(st => st.name.trim() === name.trim());
    return s ? s.id : null;
  };

  async function generateSeating() {
    response.value = []

    const requestData = {
      students: request.value.students.map((student) => ({
        id: student.id,
        name: student.name,
        preferredRows: parseCommaSeparated(student.preferredRows),
        preferredColumns: parseCommaSeparated(student.preferredColumns),
        medicalPreferredRows: parseCommaSeparated(student.medicalPreferredRow),
        medicalPreferredColumns: parseCommaSeparated(student.medicalPreferredColumn),
      })),
      preferences: request.value.preferences
        .map(pair => [findIdByName(pair[0]), findIdByName(pair[1])])
        .filter(pair => pair[0] !== null && pair[1] !== null),
      forbidden: request.value.forbidden
        .map(pair => [findIdByName(pair[0]), findIdByName(pair[1])])
        .filter(pair => pair[0] !== null && pair[1] !== null),
      classConfig: {
        rows: request.value.classConfig.rows,
        columns: request.value.classConfig.deskType === 'double' ? request.value.classConfig.columns * 2 : request.value.classConfig.columns,
        deskType: request.value.classConfig.deskType,
      },
      PriorityWeights: {
        Medical: priorities.value.medical,
        Friends: priorities.value.friends,
        Enemies: priorities.value.enemies,
        Preferences: priorities.value.preferences,
        Fill: priorities.value.fill,
      },
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/generate-seating'
      const res = await axios.post(apiUrl, requestData, {
        headers: { 'Content-Type': 'application/json' },
      })
      response.value = res.data.Seating || []
      fitness.value = res.data.Fitness || 0
      ignored.value = res.data.Ignored || []
    } catch (err) {
      error.value = err.response?.data || 'Ошибка при генерации рассадки'
    }
  }

  function getStudentName(row, col) {
    const seat = response.value.find((s) => s.Row === row && s.Column === col)
    return seat ? seat.Student : '-'
  }

  function getStudentID(row, col) {
    const seat = response.value.find((s) => s.Row === row && s.Column === col)
    return seat ? seat.StudentID : '-'
  }

  function areAllElementsUnique(arr) {
    if (!arr) return true; 
    return new Set(arr).size === arr.length;
  }

  function parseCommaSeparated(str) {
    if (!str) return []
    return str.split(',').map(Number).filter((n) => !isNaN(n)).map((n) => n - 1)
  }

  return {
    request,
    response,
    error,
    validateErrors,
    ignored,
    priorities,
    fitness,
    getStudentNameById,
    getStudentIdByName,
    parseCommaSeparated,
    generateSeating,
    getStudentName,
    getStudentID,
    areAllElementsUnique,
  }
}

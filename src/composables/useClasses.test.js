/*
 * Copyright (C) 2026 Прокофьев Даниил <d@dvprokofiev.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { describe, it, expect, beforeEach } from 'vitest';
import useClasses from './useClasses.js';

function makeClass(overrides = {}) {
  return {
    id: Date.now(), name: 'Test', students: [], preferences: [], forbidden: [],
    seatings: [], classConfig: { rows: 3, columns: 2, deskType: 'double' },
    priorities: { medical: 0.8, friends: 0.4, enemies: 0.7, preferences: 0.5, fill: 0.3 },
    ...overrides,
  };
}

function makeStudent(overrides = {}) {
  return {
    id: Date.now() + Math.random(), name: 'Student',
    preferredRows: '', preferredColumns: '',
    medicalPreferredRow: '', medicalPreferredColumn: '',
    ...overrides,
  };
}

describe('useClasses', () => {
  beforeEach(() => {
    localStorage.clear();
    const { classes } = useClasses();
    classes.value = [];
  });

  describe('create and persist', () => {
    it('addNewClass saves to localStorage', () => {
      const { classes, addNewClass } = useClasses();
      addNewClass('10 B');

      expect(classes.value).toHaveLength(1);
      expect(classes.value[0].name).toBe('10 B');
      expect(JSON.parse(localStorage.getItem('Classes'))).toHaveLength(1);
    });

    it('addNewClass does not overwrite existing', () => {
      const { classes, addNewClass } = useClasses();
      addNewClass('10 A');
      addNewClass('10 B');

      expect(classes.value).toHaveLength(2);
      expect(classes.value[0].name).toBe('10 A');
      expect(classes.value[1].name).toBe('10 B');
    });
  });

  describe('load from localStorage', () => {
    it('loadClasses restores data', () => {
      localStorage.setItem('Classes', JSON.stringify([makeClass({ name: 'Stored' })]));
      const { classes, loadClasses } = useClasses();
      loadClasses();

      expect(classes.value).toHaveLength(1);
      expect(classes.value[0].name).toBe('Stored');
    });

    it('loadClasses with empty storage returns []', () => {
      const { classes, loadClasses } = useClasses();
      loadClasses();
      expect(classes.value).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deleteClass removes the target', () => {
      const { classes, addNewClass, deleteClass } = useClasses();
      addNewClass('A');
      addNewClass('B');
      deleteClass(classes.value[0].id);

      expect(classes.value).toHaveLength(1);
      expect(classes.value[0].name).toBe('B');
    });

    it('deleteClass leaves other classes intact', () => {
      const { classes, deleteClass } = useClasses();
      classes.value = [
        makeClass({ id: 1, name: 'First' }),
        makeClass({ id: 2, name: 'Second' }),
        makeClass({ id: 3, name: 'Third' }),
      ];
      deleteClass(2);

      expect(classes.value).toHaveLength(2);
      expect(classes.value[0].name).toBe('First');
      expect(classes.value[1].name).toBe('Third');
    });

    it('deleteClass persists to localStorage', () => {
      const { classes, addNewClass, deleteClass } = useClasses();
      addNewClass('X');
      deleteClass(classes.value[0].id);

      expect(JSON.parse(localStorage.getItem('Classes'))).toHaveLength(0);
    });
  });

  describe('validation: students > seats', () => {
    it('double: 8 seats, 9 students -> error', () => {
      const { getValidationErrors } = useClasses();
      const cls = makeClass({
        classConfig: { rows: 2, columns: 2, deskType: 'double' },
        students: Array.from({ length: 9 }, (_, i) => makeStudent({ id: i + 1, name: `S${i + 1}` })),
      });
      expect(getValidationErrors(cls).some(e => e.includes('больше, чем мест'))).toBe(true);
    });

    it('single: 4 seats, 5 students -> error', () => {
      const { getValidationErrors } = useClasses();
      const cls = makeClass({
        classConfig: { rows: 2, columns: 2, deskType: 'single' },
        students: Array.from({ length: 5 }, (_, i) => makeStudent({ id: i + 1, name: `S${i + 1}` })),
      });
      expect(getValidationErrors(cls).some(e => e.includes('больше, чем мест'))).toBe(true);
    });

    it('exact fit -> no error', () => {
      const { getValidationErrors } = useClasses();
      const cls = makeClass({
        classConfig: { rows: 2, columns: 2, deskType: 'double' },
        students: Array.from({ length: 8 }, (_, i) => makeStudent({ id: i + 1, name: `S${i + 1}` })),
      });
      expect(getValidationErrors(cls).some(e => e.includes('больше, чем мест'))).toBe(false);
    });

    it('fewer students -> no error', () => {
      const { getValidationErrors } = useClasses();
      const cls = makeClass({
        classConfig: { rows: 3, columns: 3, deskType: 'double' },
        students: [makeStudent({ id: 1, name: 'One' })],
      });
      expect(getValidationErrors(cls).some(e => e.includes('больше, чем мест'))).toBe(false);
    });
  });

  describe('save seating', () => {
    it('saveSeating stores the seating', () => {
      const { classes, addNewClass, saveSeating } = useClasses();
      addNewClass('C');
      const id = classes.value[0].id;

      const result = saveSeating(id, { Seating: [{ Row: 0, Column: 0, StudentID: 1, Student: 'V' }] }, { rows: 3, columns: 2 });
      expect(result.success).toBe(true);
      expect(classes.value[0].seatings).toHaveLength(1);
    });

    it('saveSeating rejects duplicates', () => {
      const { classes, addNewClass, saveSeating } = useClasses();
      addNewClass('C');
      const id = classes.value[0].id;
      const seating = [{ Row: 0, Column: 0, StudentID: 1, Student: 'V' }];

      saveSeating(id, { Seating: seating }, { rows: 3, columns: 2 });
      const result = saveSeating(id, { Seating: seating }, { rows: 3, columns: 2 });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('duplicate');
      expect(classes.value[0].seatings).toHaveLength(1);
    });

    it('saveSeating with unknown class id', () => {
      const { saveSeating } = useClasses();
      const result = saveSeating(99999, { Seating: [] }, {});

      expect(result.success).toBe(false);
      expect(result.reason).toBe('class_not_found');
    });
  });
});

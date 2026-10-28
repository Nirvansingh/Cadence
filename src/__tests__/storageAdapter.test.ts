import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage/storageAdapter';
import type { TaskItem, Habit, NoteItem } from '../types';

describe('LocalStorageAdapter - Baseline Data Preservation & Serialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves empty state defaults safely without crashing', () => {
    expect(storage.getTasks()).toEqual([]);
    expect(storage.getHabits()).toEqual([]);
    expect(storage.getNotes()).toEqual([]);
    expect(storage.isOnboardingCompleted()).toBe(false);
  });

  it('saves, loads, updates, and deletes tasks accurately', () => {
    const newTask: TaskItem = {
      id: 'task_test_1',
      title: 'Complete physics assignment',
      priority: 'high',
      status: 'todo',
      tags: ['Study'],
      sortOrder: 0,
      subtasks: [
        { id: 'sub_1', title: 'Chapter 4 problems', isDone: false }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save
    storage.setTasks([newTask]);
    let storedTasks = storage.getTasks();
    expect(storedTasks).toHaveLength(1);
    expect(storedTasks[0].title).toBe('Complete physics assignment');
    expect(storedTasks[0].subtasks).toHaveLength(1);

    // Update
    storedTasks[0].status = 'done';
    if (storedTasks[0].subtasks && storedTasks[0].subtasks[0]) {
      storedTasks[0].subtasks[0].isDone = true;
    }
    storage.setTasks(storedTasks);

    const updatedTasks = storage.getTasks();
    expect(updatedTasks[0].status).toBe('done');
    expect(updatedTasks[0].subtasks?.[0].isDone).toBe(true);

    // Delete
    storage.setTasks([]);
    expect(storage.getTasks()).toHaveLength(0);
  });

  it('exports complete backup and imports it faithfully', () => {
    const task: TaskItem = {
      id: 'task_backup_test',
      title: 'Review biology notes',
      priority: 'medium',
      status: 'todo',
      tags: ['Biology'],
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const habit: Habit = {
      id: 'habit_backup_test',
      title: 'Morning stretch',
      category: 'health',
      timeOfDay: 'morning',
      cue: 'Wake up',
      routine: 'Stretch for 10 min',
      reward: 'Fresh feeling',
      targetDaysMask: 127,
      frequency: 'daily',
      sortOrder: 0,
      isArchived: false,
      color: '#10b981',
      icon: 'sparkles',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const note: NoteItem = {
      id: 'note_backup_test',
      title: 'Calculus Theorems',
      content: 'Fundamental theorem of calculus part 1 and 2.',
      tags: ['Math'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.setTasks([task]);
    storage.setHabits([habit]);
    storage.setNotes([note]);

    const backupJson = storage.exportBackup();
    expect(typeof backupJson).toBe('string');

    // Simulate switching devices or wiping storage
    localStorage.clear();
    expect(storage.getTasks()).toHaveLength(0);
    expect(storage.getHabits()).toHaveLength(0);
    expect(storage.getNotes()).toHaveLength(0);

    // Restore from backup
    const importSuccess = storage.importBackup(backupJson);
    expect(importSuccess).toBe(true);

    expect(storage.getTasks()).toHaveLength(1);
    expect(storage.getTasks()[0].title).toBe('Review biology notes');
    expect(storage.getHabits()[0].title).toBe('Morning stretch');
    expect(storage.getNotes()[0].title).toBe('Calculus Theorems');
  });

  it('handles corrupted storage data gracefully without unhandled exceptions', () => {
    localStorage.setItem('cadence_tasks_v1', 'corrupted-invalid-json{[');
    expect(storage.getTasks()).toEqual([]);

    localStorage.setItem('cadence_notes_v1', 'null');
    expect(storage.getNotes()).toEqual([]);

    const badRestore = storage.importBackup('not-json');
    expect(badRestore).toBe(false);
  });
});

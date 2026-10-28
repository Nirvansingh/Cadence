import { describe, it, expect, beforeEach } from 'vitest';
import { syncEngine } from '../storage/syncEngine';
import { storage } from '../storage/storageAdapter';
import type { TaskItem, NoteItem } from '../types';

describe('SyncEngine — Offline Queuing & Reconciler Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('queues task mutations locally when created', () => {
    const task: TaskItem = {
      id: 'task_sync_test_1',
      title: 'Complete Math Problem Set',
      status: 'todo',
      priority: 'high',
      tags: ['Math'],
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.setTasks([task]);

    // Check mutation queue in localStorage
    const rawQueue = localStorage.getItem('cadence_sync_mutation_queue_v1');
    expect(rawQueue).not.toBeNull();
    const queue = JSON.parse(rawQueue!);
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('tasks');
    expect(queue[0].record.id).toBe('task_sync_test_1');
    expect(queue[0].record.title).toBe('Complete Math Problem Set');
  });

  it('generates a tombstone mutation when a task is deleted locally', () => {
    const task: TaskItem = {
      id: 'task_to_delete',
      title: 'Temporary Task',
      status: 'todo',
      priority: 'low',
      tags: [],
      sortOrder: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.setTasks([task]);
    // Now delete it
    storage.setTasks([]);

    const rawQueue = localStorage.getItem('cadence_sync_mutation_queue_v1');
    expect(rawQueue).not.toBeNull();
    const queue = JSON.parse(rawQueue!);
    const tombstone = queue.find((m: any) => m.record.id === 'task_to_delete' && m.record.is_deleted === true);
    expect(tombstone).toBeDefined();
    expect(tombstone.record.is_deleted).toBe(true);
  });

  it('reconciles incoming remote changes using Last-Write-Wins', () => {
    const now = Date.now();
    const localNote: NoteItem = {
      id: 'note_collab',
      title: 'Local Version',
      content: 'Written 10 minutes ago',
      tags: ['Study'],
      isPinned: false,
      createdAt: now - 600000,
      updatedAt: now - 600000
    };
    storage.setNotes([localNote], true);

    const remoteNotes = [
      {
        id: 'note_collab',
        user_id: 'user_123',
        title: 'Updated from Phone',
        content: 'Written 1 minute ago on Android',
        tags: ['Study', 'Mobile'],
        is_pinned: true,
        is_deleted: false,
        created_at: new Date(now - 600000).toISOString(),
        updated_at: new Date(now - 60000).toISOString()
      }
    ];

    // Access private reconciler via reflection for testing
    (syncEngine as any).reconcileNotes(remoteNotes);

    const updated = storage.getNotes();
    expect(updated).toHaveLength(1);
    expect(updated[0].title).toBe('Updated from Phone');
    expect(updated[0].content).toBe('Written 1 minute ago on Android');
    expect(updated[0].isPinned).toBe(true);
  });

  it('deletes local record when a remote tombstone arrives', () => {
    const note: NoteItem = {
      id: 'note_deleted_on_phone',
      title: 'Note to be removed',
      content: 'This note was deleted on phone',
      tags: [],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.setNotes([note], true);
    expect(storage.getNotes()).toHaveLength(1);

    // Incoming tombstone from cloud
    const remoteNotes = [
      {
        id: 'note_deleted_on_phone',
        is_deleted: true,
        updated_at: new Date().toISOString()
      }
    ];

    (syncEngine as any).reconcileNotes(remoteNotes);
    expect(storage.getNotes()).toHaveLength(0);
  });
});

import React, { useState } from 'react';
import type { TaskItem, TaskStatus, TaskPriority } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Plus, 
  Trash2, 
  Clock, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface KanbanModuleProps {
  soundEnabled: boolean;
}

const PRIORITY_META: Record<TaskPriority, { color: string; label: string; bg: string }> = {
  urgent: { color: '#f43f5e', label: 'Urgent', bg: 'rgba(244, 63, 94, 0.12)' },
  high: { color: '#f59e0b', label: 'High', bg: 'rgba(245, 158, 11, 0.12)' },
  medium: { color: '#38bdf8', label: 'Medium', bg: 'rgba(56, 189, 248, 0.12)' },
  low: { color: '#94a3b8', label: 'Low', bg: 'rgba(148, 163, 184, 0.12)' }
};

export const KanbanModule: React.FC<KanbanModuleProps> = ({ soundEnabled }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => storage.getTasks());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');

  const columns: { id: TaskStatus; label: string; count: number; color: string }[] = [
    { id: 'todo', label: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'var(--amber)' },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length, color: 'var(--sky)' },
    { id: 'done', label: 'Completed', count: tasks.filter(t => t.status === 'done').length, color: 'var(--emerald)' }
  ];

  const handleMoveStatus = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t);
    storage.setTasks(updated);
    setTasks(updated);

    if (newStatus === 'done') {
      playSuccessChime(soundEnabled);
    } else {
      playClickSound(soundEnabled);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    storage.setTasks(updated);
    setTasks(updated);
    playClickSound(soundEnabled);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: 'todo',
      priority: newPriority,
      dueDate: newDueDate || undefined,
      tags: tags.length > 0 ? tags : ['General'],
      sortOrder: tasks.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...tasks, newTask];
    storage.setTasks(updated);
    setTasks(updated);
    playClickSound(soundEnabled);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewTagsStr('');
    setNewDueDate('');
  };

  return (
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 28px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-hairline)',
        marginBottom: '28px'
      }}>
        <div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--emerald-subtle)',
            border: '1px solid var(--emerald-border)',
            color: 'var(--emerald)',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '6px'
          }}>
            {tasks.filter(t => t.status === 'done').length} of {tasks.length} items finished
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
            Tasks & Assignments
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--emerald)',
            color: '#090b10',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#34d399'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--emerald)'; }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Task</span>
        </button>
      </div>

      {/* 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-hairline)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '500px'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-hairline)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pure)' }}>
                    {col.label}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
                  {col.count}
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px'
                  }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => {
                    const meta = PRIORITY_META[task.priority];

                    return (
                      <div
                        key={task.id}
                        className="panel-card"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '7px'
                        }}
                      >
                        {/* Top: Priority badge & Due Date */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.color}33`,
                            textTransform: 'uppercase'
                          }} className="mono">
                            {meta.label}
                          </span>

                          {task.dueDate && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10.5px',
                              color: 'var(--text-secondary)'
                            }} className="mono">
                              <Clock size={11} />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-pure)', lineHeight: 1.35 }}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {task.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-hairline)'
                        }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => handleMoveStatus(task.id, col.id === 'done' ? 'in_progress' : 'todo')}
                                title="Move Previous"
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-subtle)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '11px'
                                }}
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                onClick={() => handleMoveStatus(task.id, col.id === 'todo' ? 'in_progress' : 'done')}
                                title="Move Next"
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-subtle)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '11px'
                                }}
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              padding: '4px',
                              borderRadius: 'var(--radius-xs)',
                              color: 'var(--text-muted)',
                              transition: 'var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rose)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '440px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '26px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
              Add Task
            </h3>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Chapter 4 Problem Set"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Notes / Details (Optional)
                </label>
                <textarea
                  placeholder="Add specific questions or notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12.5px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)',
                    fontSize: '12.5px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600
                  }}
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

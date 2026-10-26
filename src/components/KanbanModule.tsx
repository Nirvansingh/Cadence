import React, { useState } from 'react';
import type { TaskItem, TaskStatus, TaskPriority, Subtask } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Plus, 
  Trash2, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  ArrowUpDown,
  Timer
} from 'lucide-react';

interface KanbanModuleProps {
  soundEnabled: boolean;
}

const PRIORITY_META: Record<TaskPriority, { color: string; label: string; bg: string; weight: number }> = {
  urgent: { color: '#f43f5e', label: 'Urgent', bg: 'rgba(244, 63, 94, 0.15)', weight: 4 },
  high: { color: '#f59e0b', label: 'High', bg: 'rgba(245, 158, 11, 0.15)', weight: 3 },
  medium: { color: '#38bdf8', label: 'Medium', bg: 'rgba(56, 189, 248, 0.15)', weight: 2 },
  low: { color: '#94a3b8', label: 'Low', bg: 'rgba(148, 163, 184, 0.15)', weight: 1 }
};

export const KanbanModule: React.FC<KanbanModuleProps> = ({ soundEnabled }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => storage.getTasks());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [sortByUrgency, setSortByUrgency] = useState<boolean>(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [newSubtasksRaw, setNewSubtasksRaw] = useState('');

  const getDueDateMeta = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Overdue (${Math.abs(diffDays)}d ago)`,
        color: 'var(--accent-clay)',
        bg: 'rgba(239, 68, 68, 0.15)',
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'var(--amber)',
        bg: 'rgba(245, 158, 11, 0.15)',
        isOverdue: false
      };
    } else if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        color: 'var(--amber)',
        bg: 'rgba(245, 158, 11, 0.12)',
        isOverdue: false
      };
    } else {
      return {
        label: `In ${diffDays} days`,
        color: 'var(--sky)',
        bg: 'rgba(56, 189, 248, 0.12)',
        isOverdue: false
      };
    }
  };

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

  const handleClearDone = () => {
    const updated = tasks.filter(t => t.status !== 'done');
    storage.setTasks(updated);
    setTasks(updated);
    playClickSound(soundEnabled);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId && t.subtasks) {
        const updatedSubs = t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, isDone: !st.isDone } : st
        );
        return { ...t, subtasks: updatedSubs, updatedAt: Date.now() };
      }
      return t;
    });
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

    const subtasks: Subtask[] = newSubtasksRaw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, idx) => ({
        id: `st_${Date.now()}_${idx}`,
        title: line,
        isDone: false
      }));

    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: 'todo',
      priority: newPriority,
      dueDate: newDueDate || undefined,
      tags: tags.length > 0 ? tags : ['Study'],
      subtasks: subtasks.length > 0 ? subtasks : undefined,
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
    setNewSubtasksRaw('');
  };

  const sortTasks = (taskList: TaskItem[]) => {
    if (!sortByUrgency) return taskList;
    return [...taskList].sort((a, b) => {
      // Overdue first
      const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      
      const pDiff = PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
      if (pDiff !== 0) return pDiff;
      return dueA - dueB;
    });
  };

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'var(--amber)' },
    { id: 'in_progress', label: 'In Progress', color: 'var(--sky)' },
    { id: 'done', label: 'Completed', color: 'var(--emerald)' }
  ];

  return (
    <div className="animate-quiet module-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-hairline)',
        marginBottom: '24px'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }} className="mono">
            Assignment Tracker
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)', marginTop: '4px' }}>
            Homework & Projects
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSortByUrgency(!sortByUrgency)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: sortByUrgency ? 'var(--amber-subtle)' : 'var(--bg-card)',
              border: '1px solid',
              borderColor: sortByUrgency ? 'var(--amber)' : 'var(--border-subtle)',
              color: sortByUrgency ? 'var(--amber)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <ArrowUpDown size={13} />
            <span>Sort: {sortByUrgency ? 'By Urgency' : 'Manual'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--emerald)',
              color: '#090b10',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 3 Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'start' }}>
        {columns.map(col => {
          const colTasks = sortTasks(tasks.filter(t => t.status === col.id));

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => setDragOverCol(col.id)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverCol(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                if (taskId) {
                  handleMoveStatus(taskId, col.id);
                }
                setDragOverCol(null);
                setDraggedTaskId(null);
              }}
              style={{
                backgroundColor: dragOverCol === col.id ? 'rgba(56, 189, 248, 0.06)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: dragOverCol === col.id ? 'var(--sky)' : 'var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '480px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '16px 18px',
                borderBottom: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                    {col.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {col.id === 'done' && colTasks.length > 0 && (
                    <button
                      onClick={handleClearDone}
                      title="Clear all completed tasks"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-clay)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      Clear
                    </button>
                  )}
                  <span className="mono" style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-card)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: 'var(--text-muted)'
                  }}>
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards Column */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px'
                  }}>
                    Drop tasks here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const meta = PRIORITY_META[task.priority];
                    const dueMeta = getDueDateMeta(task.dueDate);
                    const doneSubtasks = task.subtasks?.filter(s => s.isDone).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className="panel-card"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-hairline)',
                          cursor: 'grab',
                          opacity: draggedTaskId === task.id ? 0.4 : 1,
                          transition: 'opacity 0.15s ease, transform 0.15s ease'
                        }}
                      >
                        {/* Top: Priority & Smart Due Date */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.color}44`,
                            textTransform: 'uppercase'
                          }} className="mono">
                            {meta.label}
                          </span>

                          {dueMeta && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: dueMeta.color,
                              backgroundColor: dueMeta.bg,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }} className="mono">
                              <Clock size={10} />
                              {dueMeta.label}
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

                        {/* Interactive Subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div style={{
                            marginTop: '2px',
                            padding: '6px 8px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-hairline)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }} className="mono">
                                Subtasks: {doneSubtasks}/{totalSubtasks}
                              </span>
                              <div style={{
                                width: '60px',
                                height: '4px',
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: '2px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${(doneSubtasks / totalSubtasks) * 100}%`,
                                  height: '100%',
                                  backgroundColor: 'var(--emerald)'
                                }} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {task.subtasks.map(st => (
                                <div
                                  key={st.id}
                                  onClick={() => handleToggleSubtask(task.id, st.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11.5px',
                                    color: st.isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                    textDecoration: st.isDone ? 'line-through' : 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {st.isDone ? (
                                    <CheckSquare size={12} color="var(--emerald)" />
                                  ) : (
                                    <Square size={12} color="var(--text-muted)" />
                                  )}
                                  <span>{st.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {task.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                backgroundColor: 'var(--bg-card)',
                                padding: '1px 6px',
                                borderRadius: '3px'
                              }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions Footer */}
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
                                title="Move Back"
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-hairline)',
                                  cursor: 'pointer'
                                }}
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                onClick={() => handleMoveStatus(task.id, col.id === 'todo' ? 'in_progress' : 'done')}
                                title="Move Forward"
                                style={{
                                  padding: '4px 7px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-hairline)',
                                  cursor: 'pointer'
                                }}
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {col.id !== 'done' && (
                              <button
                                onClick={() => {
                                  playClickSound(soundEnabled);
                                  window.dispatchEvent(new CustomEvent('cadence-start-focus', { detail: { title: task.title } }));
                                }}
                                title="Start 25m Focus session for this task"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--sky-subtle)',
                                  border: '1px solid var(--sky-border)',
                                  color: 'var(--sky)',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                <Timer size={11} />
                                <span>Focus</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rose)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="animate-pop" style={{
            width: '460px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
              Add New Task / Assignment
            </h3>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Calculus Problem Set #4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, chapters, or submission guidelines..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    outline: 'none'
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
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
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
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Subtasks / Checklist (1 per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Read textbook pages 45-60&#10;Complete exercises 1-5"
                  value={newSubtasksRaw}
                  onChange={(e) => setNewSubtasksRaw(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Subject / Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Math, Homework, Midterm"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12.5px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

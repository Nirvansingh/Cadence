import React, { useState } from 'react';
import type { Habit, HabitLog } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Trash2,
  Calendar,
  Flame,
  Zap,
  RotateCcw,
  Gift
} from 'lucide-react';

interface HabitModuleProps {
  soundEnabled: boolean;
}

export const HabitModule: React.FC<HabitModuleProps> = ({ soundEnabled }) => {
  const [habits, setHabits] = useState<Habit[]>(() => storage.getHabits());
  const [logs, setLogs] = useState<HabitLog[]>(() => storage.getHabitLogs());
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Habit form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'study' | 'coding' | 'health' | 'routine'>('study');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newCue, setNewCue] = useState('');
  const [newRoutine, setNewRoutine] = useState('');
  const [newReward, setNewReward] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const isHabitCompleted = (habitId: string, dateStr: string) => {
    return logs.some(l => l.habitId === habitId && l.completedDate === dateStr);
  };

  const handleToggleHabit = (habitId: string) => {
    const isCompletedNow = storage.toggleHabitLog(habitId, todayStr);
    const updatedLogs = storage.getHabitLogs();
    setLogs([...updatedLogs]);

    if (isCompletedNow) {
      playClickSound(soundEnabled);
      const completedToday = habits.filter(h => updatedLogs.some(l => l.habitId === h.id && l.completedDate === todayStr)).length;
      if (completedToday === habits.length && habits.length > 0) {
        playSuccessChime(soundEnabled);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#38bdf8', '#f59e0b']
        });
      }
    } else {
      playClickSound(soundEnabled);
    }
  };

  const calculateStreak = (habitId: string): number => {
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 60; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasLog = logs.some(l => l.habitId === habitId && l.completedDate === dateStr);
      if (hasLog) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const getLast7Days = () => {
    const days: { dateStr: string; label: string }[] = [];
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      days.push({ dateStr: str, label: labels[d.getDay()] });
    }
    return days;
  };
  const weekDays = getLast7Days();

  const filteredHabits = habits.filter(h => {
    if (selectedFilter === 'all') return true;
    return h.category === selectedFilter || h.timeOfDay === selectedFilter;
  });

  const completedTodayCount = habits.filter(h => isHabitCompleted(h.id, todayStr)).length;
  const progressPercent = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      timeOfDay: newTimeOfDay,
      cue: newCue.trim() || 'Trigger context',
      routine: newRoutine.trim() || 'Execute step',
      reward: newReward.trim() || 'Sense of momentum',
      color: newCategory === 'health' ? 'var(--emerald)' : newCategory === 'study' ? 'var(--sky)' : newCategory === 'coding' ? 'var(--violet)' : 'var(--amber)',
      targetDaysMask: 127,
      sortOrder: habits.length + 1,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...habits, newHabit];
    storage.setHabits(updated);
    setHabits(updated);
    setShowAddModal(false);
    setNewTitle('');
    setNewCue('');
    setNewRoutine('');
    setNewReward('');
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    storage.setHabits(updated);
    setHabits(updated);
  };

  return (
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner - Rich Contrast & Depth */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
              fontWeight: 600
            }}>
              <Calendar size={12} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
            Daily Ledger
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completedTodayCount} of {habits.length} routines completed • Atomic behavioral loops
          </p>
        </div>

        {/* Circular Progress & Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '74px', height: '74px' }}>
            <svg width="74" height="74" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="37"
                cy="37"
                r="30"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="37"
                cy="37"
                r="30"
                stroke="var(--emerald)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={188.5}
                strokeDashoffset={188.5 - (188.5 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)' }} className="mono">
                {progressPercent}%
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: 'var(--emerald)',
              color: '#090b10',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#34d399'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--emerald)'; }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Routine</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'All Routines' },
          { id: 'morning', label: 'Morning' },
          { id: 'study', label: 'Study & Academics' },
          { id: 'coding', label: 'Development' },
          { id: 'routine', label: 'Evening' },
        ].map(filter => {
          const isSel = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: isSel ? 600 : 500,
                backgroundColor: isSel ? 'var(--bg-subtle)' : 'transparent',
                color: isSel ? 'var(--text-pure)' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: isSel ? 'var(--border-subtle)' : 'transparent',
                transition: 'var(--transition-fast)'
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Routine Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredHabits.length === 0 ? (
          <div style={{
            padding: '48px 32px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-hairline)',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>No routines scheduled yet.</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>Click "Add Routine" to create your first behavioral loop.</p>
          </div>
        ) : (
          filteredHabits.map(habit => {
          const completed = isHabitCompleted(habit.id, todayStr);
          const streak = calculateStreak(habit.id);
          const isExpanded = expandedHabitId === habit.id;

          return (
            <div
              key={habit.id}
              className="panel-card"
              style={{
                padding: '16px 22px',
                borderColor: completed ? 'var(--emerald-border)' : 'var(--border-hairline)',
                backgroundColor: completed ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card)'
              }}
            >
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* Circular Checkbox */}
                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: completed ? '1px solid var(--emerald)' : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: completed ? 'var(--emerald)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: completed ? 'scale(1.05)' : 'scale(1)',
                      flexShrink: 0
                    }}
                  >
                    {completed && <Check size={14} strokeWidth={3} color="#090b10" />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: completed ? 'var(--text-secondary)' : 'var(--text-pure)',
                        textDecoration: completed ? 'line-through' : 'none',
                        transition: 'var(--transition-fast)'
                      }}>
                        {habit.title}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: habit.category === 'health' ? 'var(--emerald)' : habit.category === 'study' ? 'var(--sky)' : habit.category === 'coding' ? 'var(--violet)' : 'var(--amber)',
                        border: '1px solid var(--border-hairline)',
                        textTransform: 'uppercase'
                      }} className="mono">
                        {habit.category}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {habit.routine}
                    </p>
                  </div>
                </div>

                {/* Right Metadata */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {/* Streak Badge */}
                  {streak > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--amber-subtle)',
                      border: '1px solid var(--amber-border)',
                      fontSize: '11.5px',
                      color: 'var(--amber)',
                      fontWeight: 700
                    }} className="mono">
                      <Flame size={13} strokeWidth={2.5} />
                      <span>{streak}d</span>
                    </div>
                  )}

                  {/* 7-Day Mini Heatmap */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {weekDays.map(day => {
                      const dayDone = isHabitCompleted(habit.id, day.dateStr);
                      return (
                        <div
                          key={day.dateStr}
                          title={`${day.label}: ${dayDone ? 'Completed' : 'Pending'}`}
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '2px',
                            backgroundColor: dayDone ? 'var(--emerald)' : 'var(--bg-subtle)',
                            opacity: dayDone ? 1 : 0.4
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Details Toggle */}
                  <button
                    onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pure)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span>Blueprint</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    style={{
                      padding: '5px',
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

              {/* Habit Loop Drawer Accordion */}
              {isExpanded && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-hairline)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  {/* Step 1: Trigger */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--amber-subtle)',
                    border: '1px solid var(--amber-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Zap size={13} />
                      <span>1. Trigger Cue</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-pure)', marginTop: '4px' }}>
                      {habit.cue}
                    </p>
                  </div>

                  {/* Step 2: Routine */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--sky-subtle)',
                    border: '1px solid var(--sky-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sky)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <RotateCcw size={13} />
                      <span>2. Micro Action</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-pure)', marginTop: '4px' }}>
                      {habit.routine}
                    </p>
                  </div>

                  {/* Step 3: Payoff */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--emerald-subtle)',
                    border: '1px solid var(--emerald-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Gift size={13} />
                      <span>3. Psychological Benefit</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-pure)', marginTop: '4px' }}>
                      {habit.reward}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
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
            width: '450px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '26px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
              Add Daily Routine
            </h3>

            <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Routine Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Practice Set"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px'
                    }}
                  >
                    <option value="study">Study</option>
                    <option value="coding">Development</option>
                    <option value="health">Health</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Time of Day
                  </label>
                  <select
                    value={newTimeOfDay}
                    onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px'
                    }}
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--amber)', display: 'block', marginBottom: '4px' }}>
                  1. The Trigger / Cue
                </label>
                <input
                  type="text"
                  placeholder="e.g. When arriving home from class at 4:30 PM"
                  value={newCue}
                  onChange={(e) => setNewCue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sky)', display: 'block', marginBottom: '4px' }}>
                  2. Micro-Step
                </label>
                <input
                  type="text"
                  placeholder="e.g. Open textbook and solve 5 problems"
                  value={newRoutine}
                  onChange={(e) => setNewRoutine(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--emerald)', display: 'block', marginBottom: '4px' }}>
                  3. Psychological Payoff
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reduced anxiety and peaceful evening"
                  value={newReward}
                  onChange={(e) => setNewReward(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
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
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

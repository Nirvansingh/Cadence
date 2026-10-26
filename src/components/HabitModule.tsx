import React, { useState } from 'react';
import type { Habit, HabitLog } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { getLocalDateString } from '../utils/dateUtils';
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
  Gift,
  LayoutList,
  Grid
} from 'lucide-react';

interface HabitModuleProps {
  soundEnabled: boolean;
}

export const HabitModule: React.FC<HabitModuleProps> = ({ soundEnabled }) => {
  const [habits, setHabits] = useState<Habit[]>(() => storage.getHabits());
  const [logs, setLogs] = useState<HabitLog[]>(() => storage.getHabitLogs());
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Habit form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'study' | 'coding' | 'health' | 'routine'>('study');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekdays'>('daily');
  const [newStackAfterId, setNewStackAfterId] = useState<string>('');
  const [newCue, setNewCue] = useState('');
  const [newRoutine, setNewRoutine] = useState('');
  const [newReward, setNewReward] = useState('');

  const todayStr = getLocalDateString();

  const isHabitCompleted = (habitId: string, dateStr: string) => {
    return logs.some(l => l.habitId === habitId && l.completedDate === dateStr);
  };

  const handleToggleHabitForDate = (habitId: string, dateStr: string) => {
    const isCompletedNow = storage.toggleHabitLog(habitId, dateStr);
    const updatedLogs = storage.getHabitLogs();
    setLogs([...updatedLogs]);

    if (isCompletedNow && dateStr === todayStr) {
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

  const handleToggleHabit = (habitId: string) => {
    handleToggleHabitForDate(habitId, todayStr);
  };

  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 90; i++) {
      const dayOfWeek = checkDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (habit.frequency === 'weekdays' && isWeekend && i > 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      const dateStr = getLocalDateString(checkDate);
      const hasLog = logs.some(l => l.habitId === habit.id && l.completedDate === dateStr);
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
      const str = getLocalDateString(d);
      days.push({ dateStr: str, label: labels[d.getDay()] });
    }
    return days;
  };
  const weekDays = getLast7Days();

  const getLast30Days = () => {
    const days: { dateStr: string; dayNum: number; weekday: string; isToday: boolean }[] = [];
    const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = getLocalDateString(d);
      days.push({ 
        dateStr: str, 
        dayNum: d.getDate(),
        weekday: labels[d.getDay()],
        isToday: i === 0
      });
    }
    return days;
  };
  const monthDays = getLast30Days();

  const filteredHabits = habits.filter(h => {
    if (selectedFilter === 'all') return true;
    return h.category === selectedFilter || h.timeOfDay === selectedFilter;
  });

  const completedTodayCount = habits.filter(h => isHabitCompleted(h.id, todayStr)).length;
  const progressPercent = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  const totalWeeklyCompletions = habits.reduce((acc, h) => {
    return acc + weekDays.filter(day => isHabitCompleted(h.id, day.dateStr)).length;
  }, 0);
  const possibleWeeklyCompletions = (habits.length * 7) || 1;
  const weeklyConsistency = Math.round((totalWeeklyCompletions / possibleWeeklyCompletions) * 100);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      timeOfDay: newTimeOfDay,
      frequency: newFrequency,
      stackAfterHabitId: newStackAfterId || undefined,
      cue: newCue.trim() || 'Trigger context',
      routine: newRoutine.trim() || 'Execute step',
      reward: newReward.trim() || 'Sense of momentum',
      color: newCategory === 'health' ? 'var(--emerald)' : newCategory === 'study' ? 'var(--sky)' : newCategory === 'coding' ? 'var(--violet)' : 'var(--amber)',
      targetDaysMask: newFrequency === 'weekdays' ? 31 : 127,
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
    setNewStackAfterId('');
  };

  const handleDeleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    storage.setHabits(updated);
    setHabits(updated);
  };

  return (
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner - Rich Contrast & Depth */}
      <div className="panel-interactive" style={{
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
            Daily Habits
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completedTodayCount} of {habits.length} habits done today • {weeklyConsistency}% weekly consistency
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
                style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#34d399';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--emerald)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Habits' },
            { id: 'morning', label: 'Morning' },
            { id: 'study', label: 'Study' },
            { id: 'coding', label: 'Coding' },
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

        {/* View Switcher: List vs 30-Day Matrix */}
        <div style={{
          display: 'inline-flex',
          padding: '3px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          gap: '2px'
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: viewMode === 'list' ? 600 : 500,
              backgroundColor: viewMode === 'list' ? 'var(--bg-subtle)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-pure)' : 'var(--text-muted)',
              border: viewMode === 'list' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'var(--transition-fast)',
              cursor: 'pointer'
            }}
          >
            <LayoutList size={13} />
            <span>List & Loop</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: viewMode === 'matrix' ? 600 : 500,
              backgroundColor: viewMode === 'matrix' ? 'var(--bg-subtle)' : 'transparent',
              color: viewMode === 'matrix' ? 'var(--text-pure)' : 'var(--text-muted)',
              border: viewMode === 'matrix' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'var(--transition-fast)',
              cursor: 'pointer'
            }}
          >
            <Grid size={13} />
            <span>30-Day Matrix</span>
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="panel-card animate-quiet" style={{ padding: '22px', overflowX: 'auto', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)' }}>
                30-Day Consistency Matrix
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Interactive monthly heatmap • Click any cell to mark or adjust completion
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--emerald)' }} />
                <span>Done</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-hairline)' }} />
                <span>Missed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--sky)', backgroundColor: 'transparent' }} />
                <span>Today</span>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px', minWidth: '780px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: '200px' }}>
                    HABIT
                  </th>
                  {monthDays.map(d => (
                    <th
                      key={d.dateStr}
                      style={{
                        padding: '4px 2px',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: d.isToday ? 700 : 500,
                        color: d.isToday ? 'var(--sky)' : 'var(--text-muted)',
                        backgroundColor: d.isToday ? 'var(--sky-subtle)' : 'transparent',
                        borderRadius: 'var(--radius-xs)'
                      }}
                      className="mono"
                      title={d.dateStr}
                    >
                      <div style={{ fontSize: '9px', opacity: 0.8 }}>{d.weekday}</div>
                      <div>{d.dayNum}</div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: '70px' }}>
                    30D RATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits.map(habit => {
                  const habitMonthCompletions = monthDays.filter(d => isHabitCompleted(habit.id, d.dateStr)).length;
                  const ratePct = Math.round((habitMonthCompletions / 30) * 100);
                  const streak = calculateStreak(habit);

                  return (
                    <tr key={habit.id}>
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '3px',
                            height: '14px',
                            borderRadius: '2px',
                            backgroundColor: habit.category === 'health' ? 'var(--emerald)' : habit.category === 'study' ? 'var(--sky)' : habit.category === 'coding' ? 'var(--violet)' : 'var(--amber)',
                            flexShrink: 0
                          }} />
                          <span style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: 'var(--text-pure)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '130px'
                          }} title={habit.title}>
                            {habit.title}
                          </span>
                          {streak > 0 && (
                            <span style={{ fontSize: '10px', color: 'var(--amber)', fontWeight: 700 }} className="mono">
                              {streak}d
                            </span>
                          )}
                        </div>
                      </td>

                      {monthDays.map(d => {
                        const done = isHabitCompleted(habit.id, d.dateStr);
                        return (
                          <td key={d.dateStr} style={{ textAlign: 'center', padding: '1px' }}>
                            <button
                              onClick={() => handleToggleHabitForDate(habit.id, d.dateStr)}
                              title={`${habit.title} - ${d.dateStr}: ${done ? 'Completed' : 'Missed'}`}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '3px',
                                border: d.isToday ? '1px solid var(--sky)' : '1px solid transparent',
                                backgroundColor: done ? 'var(--emerald)' : 'var(--bg-subtle)',
                                color: done ? '#090b10' : 'transparent',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease, background-color 0.15s ease',
                                padding: 0
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              {done && <Check size={11} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}

                      <td style={{ textAlign: 'center', padding: '6px 8px', verticalAlign: 'middle' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: ratePct >= 70 ? 'var(--emerald)' : ratePct >= 40 ? 'var(--sky)' : 'var(--text-muted)'
                        }} className="mono">
                          {ratePct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Daily Total
                  </td>
                  {monthDays.map(d => {
                    const countForDay = filteredHabits.filter(h => isHabitCompleted(h.id, d.dateStr)).length;
                    const allDone = countForDay === filteredHabits.length && filteredHabits.length > 0;
                    return (
                      <td
                        key={d.dateStr}
                        style={{
                          textAlign: 'center',
                          fontSize: '10px',
                          fontWeight: allDone ? 700 : 500,
                          color: allDone ? 'var(--emerald)' : countForDay > 0 ? 'var(--text-pure)' : 'var(--text-muted)',
                          padding: '6px 1px'
                        }}
                        className="mono"
                      >
                        {countForDay}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }} className="mono">
                    {weeklyConsistency}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
      /* Routine Cards */
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
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>No habits added yet.</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>Click "New Habit" to start with one simple daily goal.</p>
          </div>
        ) : (
          filteredHabits.map(habit => {
          const completed = isHabitCompleted(habit.id, todayStr);
          const streak = calculateStreak(habit);
          const isExpanded = expandedHabitId === habit.id;
          const parentHabit = habit.stackAfterHabitId ? habits.find(h => h.id === habit.stackAfterHabitId) : null;

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                        fontSize: '10px',
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

                      {habit.frequency === 'weekdays' && (
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: 'var(--sky-subtle)',
                          color: 'var(--sky)',
                          border: '1px solid var(--sky-border)'
                        }} className="mono">
                          Weekdays
                        </span>
                      )}

                      {parentHabit && (
                        <span style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: 'var(--amber-subtle)',
                          color: 'var(--amber)',
                          border: '1px solid var(--amber-border)'
                        }}>
                          After: {parentHabit.title}
                        </span>
                      )}
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
                    <span>Details</span>
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

              {/* Habit Loop Drawer Accordion with Smooth Fade In */}
              {isExpanded && (
                <div className="animate-pop" style={{
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}>
                      <Zap size={13} />
                      <span>1. When (Trigger)</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sky)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}>
                      <RotateCcw size={13} />
                      <span>2. Small Step</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}>
                      <Gift size={13} />
                      <span>3. Why It Helps</span>
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
      )}

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
          <div className="animate-pop" style={{
            width: '450px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '26px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
              Add a New Habit
            </h3>

            <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Habit Name
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
                    <option value="coding">Coding</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Schedule Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="daily">Every Day (7 Days)</option>
                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Stack After (Optional)
                  </label>
                  <select
                    value={newStackAfterId}
                    onChange={(e) => setNewStackAfterId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="">No preceding habit</option>
                    {habits.map(h => (
                      <option key={h.id} value={h.id}>After "{h.title}"</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--amber)', display: 'block', marginBottom: '4px' }}>
                  1. When does this happen? (Trigger)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Right after arriving home from class"
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
                  2. What is the small step?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Open textbook and solve 3 problems"
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
                  3. Why does this help?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Feel ready for exams and relax peacefully"
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
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#34d399'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--emerald)'; }}
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

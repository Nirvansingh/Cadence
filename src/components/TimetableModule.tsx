import React, { useState } from 'react';
import type { TimetableSlot, DayOfWeek, TimetableCategory } from '../types';
import { storage } from '../storage/storageAdapter';
import { downloadICalendarFile } from '../utils/icsExport';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Plus, 
  ArrowDownToLine, 
  Clock, 
  Trash2, 
  Check, 
  AlertTriangle,
  Layers
} from 'lucide-react';

interface TimetableModuleProps {
  soundEnabled: boolean;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Rich, high-contrast jewel palette for timetable
const CATEGORY_PALETTE: Record<TimetableCategory, { hex: string; label: string; text: string; bg: string }> = {
  school: { hex: '#f43f5e', label: 'School', text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  tuition: { hex: '#f59e0b', label: 'Classes / Tuition', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  study: { hex: '#38bdf8', label: 'Study Time', text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  workout: { hex: '#10b981', label: 'Exercise', text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  meals: { hex: '#8b5cf6', label: 'Meals & Break', text: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  sleep: { hex: '#64748b', label: 'Sleep & Rest', text: '#94a3b8', bg: 'rgba(100, 116, 139, 0.15)' },
  other: { hex: '#94a3b8', label: 'Break / Travel', text: '#cbd5e1', bg: 'rgba(148, 163, 184, 0.12)' }
};

export const TimetableModule: React.FC<TimetableModuleProps> = ({ soundEnabled }) => {
  const [slots, setSlots] = useState<TimetableSlot[]>(() => storage.getTimetable());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showCopyModal, setShowCopyModal] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TimetableCategory>('study');
  const [newStart, setNewStart] = useState('16:00');
  const [newEnd, setNewEnd] = useState('17:30');
  const [newNote, setNewNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Target days for multi-day schedule cloning
  const [selectedTargetDays, setSelectedTargetDays] = useState<DayOfWeek[]>([]);

  const daySlots = slots
    .filter(s => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const totalCommittedMinutes = daySlots.reduce((acc, slot) => {
    let dur = toMinutes(slot.endTime) - toMinutes(slot.startTime);
    if (dur < 0) dur += 24 * 60;
    return acc + dur;
  }, 0);

  const freeMinutes = Math.max(0, 24 * 60 - totalCommittedMinutes);
  const freeHours = (freeMinutes / 60).toFixed(1);

  // Logic: Live Conflict / Overlap Detection
  const conflictingSlot = daySlots.find(s => {
    const sStart = toMinutes(s.startTime);
    const sEnd = toMinutes(s.endTime);
    const nStart = toMinutes(newStart);
    const nEnd = toMinutes(newEnd);
    return nStart < sEnd && nEnd > sStart;
  });

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!newTitle.trim()) {
      setValidationError('Please enter an event name.');
      return;
    }

    const startM = toMinutes(newStart);
    const endM = toMinutes(newEnd);
    if (endM <= startM) {
      setValidationError('End time must be later than start time.');
      return;
    }

    const newSlot: TimetableSlot = {
      id: `slot_${Date.now()}`,
      dayOfWeek: selectedDay,
      startTime: newStart,
      endTime: newEnd,
      title: newTitle.trim(),
      category: newCategory,
      note: newNote.trim() || undefined,
      sortOrder: daySlots.length + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...slots, newSlot];
    storage.setTimetable(updated);
    setSlots(updated);
    playClickSound(soundEnabled);
    setShowAddModal(false);
    setNewTitle('');
    setNewNote('');
    setValidationError(null);
  };

  const handleDeleteSlot = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    storage.setTimetable(updated);
    setSlots(updated);
    playClickSound(soundEnabled);
  };

  const handleExportICS = () => {
    downloadICalendarFile(slots, `cadence-${selectedDay.toLowerCase()}-schedule.ics`);
    playSuccessChime(soundEnabled);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3500);
  };

  // Logic: Clone / Copy Current Day to Other Days
  const handleExecuteCopy = () => {
    if (selectedTargetDays.length === 0) return;

    // Filter out existing slots on target days to overwrite with current routine
    const cleanOtherDays = slots.filter(s => !selectedTargetDays.includes(s.dayOfWeek));
    const newDuplicatedSlots: TimetableSlot[] = [];

    selectedTargetDays.forEach(targetDay => {
      daySlots.forEach((sourceSlot, idx) => {
        newDuplicatedSlots.push({
          ...sourceSlot,
          id: `slot_${targetDay}_${Date.now()}_${idx}`,
          dayOfWeek: targetDay,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      });
    });

    const merged = [...cleanOtherDays, ...newDuplicatedSlots];
    storage.setTimetable(merged);
    setSlots(merged);
    playSuccessChime(soundEnabled);
    setShowCopyModal(false);
    setSelectedTargetDays([]);
    setCopyNotice(`Schedule copied to ${selectedTargetDays.join(', ')}`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  // Logic: Smart Travel / Transition Buffer Inserter
  const handleInsertBuffers = () => {
    const sorted = [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const newBuffers: TimetableSlot[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = toMinutes(sorted[i].endTime);
      const nextStart = toMinutes(sorted[i + 1].startTime);
      const gap = nextStart - currentEnd;

      // If gap is between 15m and 60m, insert a transition buffer
      if (gap >= 15 && gap <= 90) {
        const startH = String(Math.floor(currentEnd / 60)).padStart(2, '0');
        const startM = String(currentEnd % 60).padStart(2, '0');
        const endMinutes = Math.min(nextStart, currentEnd + 15);
        const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
        const endM = String(endMinutes % 60).padStart(2, '0');

        newBuffers.push({
          id: `slot_buffer_${Date.now()}_${i}`,
          dayOfWeek: selectedDay,
          startTime: `${startH}:${startM}`,
          endTime: `${endH}:${endM}`,
          title: 'Travel / Transition Buffer',
          category: 'other',
          note: 'Freshen up, pack bag, or travel',
          sortOrder: sorted.length + i + 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }

    if (newBuffers.length === 0) {
      setCopyNotice('No appropriate gaps found for buffers today.');
      setTimeout(() => setCopyNotice(null), 3000);
      return;
    }

    const merged = [...slots, ...newBuffers];
    storage.setTimetable(merged);
    setSlots(merged);
    playClickSound(soundEnabled);
    setCopyNotice(`Added ${newBuffers.length} transition buffer(s).`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  return (
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {copyNotice && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--sky)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          zIndex: 9999
        }}>
          <Check size={14} />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* Header Block */}
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
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--sky-subtle)',
            border: '1px solid var(--sky-border)',
            color: 'var(--sky)',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '6px'
          }}>
            <Clock size={12} />
            {freeHours} hours free time today
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
            Daily Schedule
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Plan your day hour-by-hour • Export directly to Google or Apple Calendar
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleInsertBuffers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <Clock size={13} color="var(--sky)" />
            <span>Add Buffers</span>
          </button>

          <button
            onClick={() => setShowCopyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <Layers size={13} color="var(--sky)" />
            <span>Copy Schedule</span>
          </button>

          <button
            onClick={handleExportICS}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            <ArrowDownToLine size={13} />
            <span>Export Calendar</span>
          </button>

          <button
            onClick={() => {
              setValidationError(null);
              setShowAddModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--sky)',
              color: '#090b10',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Export Notice */}
      {exportNotice && (
        <div className="animate-pop" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--emerald-subtle)',
          border: '1px solid var(--emerald-border)',
          color: 'var(--emerald)',
          fontSize: '12.5px',
          marginBottom: '20px'
        }}>
          <Check size={15} />
          <span>Calendar file downloaded! Import this .ics into Google Calendar, Outlook, or Apple Calendar.</span>
        </div>
      )}

      {/* Day Selector Pill Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: 'var(--bg-surface)',
        padding: '5px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-hairline)',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          const count = slots.filter(s => s.dayOfWeek === day).length;
          return (
            <button
              key={day}
              onClick={() => { setSelectedDay(day); playClickSound(soundEnabled); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isSelected ? 'var(--sky-subtle)' : 'transparent',
                border: '1px solid',
                borderColor: isSelected ? 'var(--sky-border)' : 'transparent',
                color: isSelected ? 'var(--sky)' : 'var(--text-muted)',
                fontWeight: isSelected ? 600 : 500,
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{day.slice(0, 3)}</span>
              {count > 0 && (
                <span className="mono" style={{
                  fontSize: '10px',
                  backgroundColor: isSelected ? 'var(--sky)' : 'var(--bg-card)',
                  color: isSelected ? '#090b10' : 'var(--text-muted)',
                  padding: '1px 5px',
                  borderRadius: '10px'
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 24h Timeline Visual Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-hairline)',
        padding: '18px 24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }} className="mono">
            24-Hour Distribution ({selectedDay})
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {(totalCommittedMinutes / 60).toFixed(1)}h scheduled • {freeHours}h available
          </span>
        </div>

        <div style={{
          height: '14px',
          borderRadius: '7px',
          backgroundColor: 'var(--bg-card)',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid var(--border-hairline)'
        }}>
          {daySlots.map(slot => {
            let dur = toMinutes(slot.endTime) - toMinutes(slot.startTime);
            if (dur < 0) dur += 24 * 60;
            const pct = (dur / (24 * 60)) * 100;
            return (
              <div
                key={slot.id}
                title={`${slot.title} (${slot.startTime} - ${slot.endTime})`}
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: CATEGORY_PALETTE[slot.category].hex,
                  transition: 'width 0.3s ease'
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '12px' }}>
          {(Object.keys(CATEGORY_PALETTE) as TimetableCategory[]).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CATEGORY_PALETTE[cat].hex }} />
              <span>{CATEGORY_PALETTE[cat].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {daySlots.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            <p>No events scheduled for {selectedDay}.</p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                marginTop: '12px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--sky)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + Add First Event
            </button>
          </div>
        ) : (
          daySlots.map(slot => {
            const catInfo = CATEGORY_PALETTE[slot.category];
            let durMin = toMinutes(slot.endTime) - toMinutes(slot.startTime);
            if (durMin < 0) durMin += 24 * 60;
            const durFormatted = durMin >= 60 
              ? `${Math.floor(durMin / 60)}h ${durMin % 60 ? (durMin % 60) + 'm' : ''}`
              : `${durMin}m`;

            return (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-hairline)',
                  borderLeft: `4px solid ${catInfo.hex}`,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ minWidth: '100px' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pure)' }}>
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      {durFormatted}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pure)' }}>
                        {slot.title}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: catInfo.bg,
                        color: catInfo.text,
                        border: `1px solid ${catInfo.hex}33`
                      }} className="mono">
                        {catInfo.label}
                      </span>
                    </div>

                    {slot.note && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {slot.note}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rose)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
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
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '26px'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
              Add Schedule Event ({selectedDay})
            </h3>

            {conflictingSlot && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--amber)',
                fontSize: '11.5px',
                marginBottom: '12px'
              }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>
                  Overlap warning: Conflicts with <strong>{conflictingSlot.title}</strong> ({conflictingSlot.startTime} - {conflictingSlot.endTime})
                </span>
              </div>
            )}

            {validationError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-clay)',
                fontSize: '12px',
                marginBottom: '12px'
              }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics Class or Self Study"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
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
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
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
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TimetableCategory)}
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
                  <option value="school">School</option>
                  <option value="tuition">Classes / Tuition</option>
                  <option value="study">Study Time</option>
                  <option value="workout">Exercise</option>
                  <option value="meals">Meals & Break</option>
                  <option value="sleep">Sleep & Rest</option>
                  <option value="other">Break / Travel</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Notes / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Chapter 3 notes"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
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
                    backgroundColor: 'var(--sky)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.25)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy / Clone Schedule Modal */}
      {showCopyModal && (
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
            width: '440px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '8px' }}>
              Duplicate Schedule ({selectedDay})
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select which days should copy the {daySlots.length} events from {selectedDay}:
            </p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setSelectedTargetDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].filter(d => d !== selectedDay) as DayOfWeek[])}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--sky)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                All Weekdays (Mon-Fri)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTargetDays(DAYS.filter(d => d !== selectedDay))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--emerald)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                All 7 Days
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {DAYS.filter(d => d !== selectedDay).map(day => {
                const isChecked = selectedTargetDays.includes(day);
                return (
                  <label
                    key={day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isChecked ? 'var(--sky-subtle)' : 'var(--bg-card)',
                      border: '1px solid',
                      borderColor: isChecked ? 'var(--sky-border)' : 'var(--border-hairline)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedTargetDays(selectedTargetDays.filter(d => d !== day));
                        } else {
                          setSelectedTargetDays([...selectedTargetDays, day]);
                        }
                      }}
                    />
                    <span style={{ color: isChecked ? 'var(--sky)' : 'var(--text-secondary)' }}>{day}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowCopyModal(false)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCopy}
                disabled={selectedTargetDays.length === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: selectedTargetDays.length === 0 ? 'var(--bg-subtle)' : 'var(--sky)',
                  color: selectedTargetDays.length === 0 ? 'var(--text-muted)' : '#090b10',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: selectedTargetDays.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Apply to {selectedTargetDays.length} Days
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

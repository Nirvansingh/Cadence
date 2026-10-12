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
  Check 
} from 'lucide-react';

interface TimetableModuleProps {
  soundEnabled: boolean;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Rich, high-contrast jewel palette for timetable
const CATEGORY_PALETTE: Record<TimetableCategory, { hex: string; label: string; text: string; bg: string }> = {
  school: { hex: '#f43f5e', label: 'School', text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  tuition: { hex: '#f59e0b', label: 'Tuition', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  study: { hex: '#38bdf8', label: 'Study Block', text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  workout: { hex: '#10b981', label: 'Exercise', text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  meals: { hex: '#8b5cf6', label: 'Meals & Break', text: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  sleep: { hex: '#64748b', label: 'Sleep & Rest', text: '#94a3b8', bg: 'rgba(100, 116, 139, 0.15)' },
  other: { hex: '#94a3b8', label: 'Transit Buffer', text: '#cbd5e1', bg: 'rgba(148, 163, 184, 0.12)' }
};

export const TimetableModule: React.FC<TimetableModuleProps> = ({ soundEnabled }) => {
  const [slots, setSlots] = useState<TimetableSlot[]>(() => storage.getTimetable());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TimetableCategory>('study');
  const [newStart, setNewStart] = useState('16:00');
  const [newEnd, setNewEnd] = useState('17:30');
  const [newNote, setNewNote] = useState('');

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

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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

  return (
    <div className="animate-quiet" style={{ padding: '36px 48px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Block */}
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
            backgroundColor: 'var(--sky-subtle)',
            border: '1px solid var(--sky-border)',
            color: 'var(--sky)',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '6px'
          }}>
            <Clock size={12} />
            Free Time Remaining: {freeHours} hrs
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
            24-Hour Timetable
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Day-by-day schedule with transit buffers & RFC 5545 calendar sync
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportICS}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '12.5px',
              fontWeight: 500,
              border: '1px solid var(--border-subtle)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <ArrowDownToLine size={14} />
            <span>Export .ICS</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
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
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7dd3fc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--sky)'; }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{
          padding: '10px 14px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--emerald-subtle)',
          border: '1px solid var(--emerald-border)',
          color: 'var(--emerald)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12.5px'
        }}>
          <Check size={14} />
          <span>Calendar file (.ics) downloaded. Ready to import into Google, Apple, or Outlook Calendar.</span>
        </div>
      )}

      {/* 24-Hour Visual Bar */}
      <div className="panel" style={{ padding: '22px 26px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>

        {/* Timeline Bar Strip */}
        <div style={{
          height: '20px',
          width: '100%',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-xs)',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          border: '1px solid var(--border-hairline)'
        }}>
          {daySlots.map(slot => {
            const startMin = toMinutes(slot.startTime);
            const endMin = toMinutes(slot.endTime);
            let duration = endMin - startMin;
            if (duration < 0) duration += 24 * 60;
            const widthPercent = (duration / (24 * 60)) * 100;
            const leftPercent = (startMin / (24 * 60)) * 100;

            return (
              <div
                key={slot.id}
                title={`${slot.title}: ${slot.startTime} - ${slot.endTime}`}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: '100%',
                  backgroundColor: CATEGORY_PALETTE[slot.category].hex,
                  opacity: 0.9,
                  transition: 'var(--transition-fast)'
                }}
              />
            );
          })}
        </div>

        {/* Category Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
          {(Object.keys(CATEGORY_PALETTE) as TimetableCategory[]).map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: CATEGORY_PALETTE[cat].hex }} />
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {CATEGORY_PALETTE[cat].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => { setSelectedDay(day); playClickSound(soundEnabled); }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                fontWeight: isSelected ? 600 : 500,
                backgroundColor: isSelected ? 'var(--sky)' : 'var(--bg-surface)',
                color: isSelected ? '#090b10' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--sky)' : 'var(--border-hairline)',
                transition: 'var(--transition-fast)',
                textAlign: 'center'
              }}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Slots List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {daySlots.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-hairline)',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            No scheduled blocks for {selectedDay}.
          </div>
        ) : (
          daySlots.map(slot => {
            const catInfo = CATEGORY_PALETTE[slot.category];
            return (
              <div
                key={slot.id}
                className="panel-card"
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '110px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-pure)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }} className="mono">
                    <Clock size={13} style={{ color: catInfo.text }} />
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    padding: '6px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-muted)',
                    transition: 'var(--transition-fast)'
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
              Add Time Block ({selectedDay})
            </h3>

            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Block Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics Class / Self-Study"
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
                    Start (24h)
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
                      fontSize: '12.5px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    End (24h)
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
                      fontSize: '12.5px'
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
                    fontSize: '12.5px'
                  }}
                >
                  <option value="school">School</option>
                  <option value="tuition">Tuition</option>
                  <option value="study">Study Block</option>
                  <option value="workout">Exercise</option>
                  <option value="meals">Meals & Break</option>
                  <option value="sleep">Sleep & Rest</option>
                  <option value="other">Transit Buffer</option>
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
                    backgroundColor: 'var(--sky)',
                    color: '#090b10',
                    fontSize: '12.5px',
                    fontWeight: 600
                  }}
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

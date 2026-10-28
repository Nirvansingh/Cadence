import React from 'react';
import type { StreakState } from '../types';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { getLocalDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Sparkles, 
  Check, 
  X, 
  PlusCircle, 
  Trophy
} from 'lucide-react';

interface StreakStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onStreakUpdate?: () => void;
}

export const StreakStudioModal: React.FC<StreakStudioModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onStreakUpdate
}) => {
  if (!isOpen) return null;

  const streak: StreakState = storage.getStreakState();
  const todayStr = getLocalDateString();
  const isStudiedToday = streak.lastActiveDate === todayStr;

  const handleRefillFreeze = () => {
    const success = storage.refillStreakFreeze();
    if (success) {
      playSuccessChime(soundEnabled);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0ea5e9', '#bae6fd']
      });
      if (onStreakUpdate) onStreakUpdate();
    } else {
      playClickSound(soundEnabled);
    }
  };

  // Generate last 14 days for the streak track
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const streakDays = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const str = getLocalDateString(d);
    const isToday = i === 0;
    const wasActive = streak.activeDates.includes(str);
    const wasFrozen = streak.freezeDates.includes(str);
    streakDays.push({
      dateStr: str,
      dayNum: d.getDate(),
      dayName: dayNames[d.getDay()],
      isToday,
      wasActive,
      wasFrozen
    });
  }

  // Milestone tiers
  const milestones = [
    { days: 3, name: 'Spark', icon: '✨' },
    { days: 7, name: 'Blaze', icon: '🔥' },
    { days: 14, name: 'Wildfire', icon: '⚡' },
    { days: 30, name: 'Supernova', icon: '🌟' },
    { days: 50, name: 'Titan', icon: '🏆' },
    { days: 100, name: 'Legend', icon: '👑' },
  ];

  const nextMilestone = milestones.find(m => m.days > streak.currentStreak) || milestones[milestones.length - 1];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }} onClick={onClose}>
      <div 
        className="animate-pop"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          position: 'relative',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          aria-label="Close Streak Modal"
        >
          <X size={18} />
        </button>

        {/* Center Hero: Flame & Days */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: isStudiedToday ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: isStudiedToday ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-hairline)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: isStudiedToday ? '0 0 32px rgba(245, 158, 11, 0.25)' : 'none'
          }}>
            <Flame 
              size={44} 
              color={isStudiedToday ? 'var(--amber)' : 'var(--text-muted)'} 
              fill={isStudiedToday ? 'var(--amber)' : 'none'}
              strokeWidth={1.75} 
            />
          </div>

          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-pure)', margin: 0, letterSpacing: '-0.02em' }} className="mono">
            {streak.currentStreak} <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--amber)' }}>Day Streak</span>
          </h2>

          <div style={{ marginTop: '8px' }}>
            {isStudiedToday ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--emerald-subtle)',
                color: 'var(--emerald)',
                border: '1px solid var(--emerald-border)',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Check size={13} strokeWidth={2.5} />
                Studied today! Your flame is burning bright
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--amber-subtle)',
                color: 'var(--amber)',
                border: '1px solid var(--amber-border)',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Sparkles size={13} />
                Complete 1 session or habit to keep your flame today
              </span>
            )}
          </div>
        </div>

        {/* Streak Freeze Card (Duolingo Ice Shield) */}
        <div style={{
          padding: '16px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sky)',
              fontSize: '20px',
              flexShrink: 0
            }}>
              🧊
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-pure)' }}>
                  Streak Freeze
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--sky-subtle)',
                  color: 'var(--sky)',
                  border: '1px solid var(--sky-border)'
                }} className="mono">
                  {streak.freezesAvailable} / 2 Equipped
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                Protects your streak if you miss a day. Auto-activates so your counter never resets.
              </p>
            </div>
          </div>

          {streak.freezesAvailable < 2 && (
            <button
              onClick={handleRefillFreeze}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--sky)',
                color: '#090b10',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-fast)'
              }}
            >
              <PlusCircle size={13} strokeWidth={2.5} />
              <span>Refill</span>
            </button>
          )}
        </div>

        {/* 14-Day Streak Calendar */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              14-Day Activity Track
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
              Best: {streak.bestStreak}d
            </span>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '4px', minWidth: '380px' }}>
              {streakDays.map(d => {
                const bg = d.wasActive 
                  ? 'var(--amber)' 
                  : d.wasFrozen 
                  ? 'var(--sky)' 
                  : d.isToday 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'var(--bg-card)';

                return (
                  <div
                    key={d.dateStr}
                    title={`${d.dateStr}: ${d.wasActive ? 'Studied 🔥' : d.wasFrozen ? 'Freeze Used 🧊' : 'Not completed'}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: d.isToday ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-app)',
                      border: d.isToday ? '1px solid var(--amber-border)' : '1px solid var(--border-hairline)',
                    }}
                  >
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{d.dayName}</span>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      {d.wasActive && '🔥'}
                      {d.wasFrozen && '🧊'}
                    </div>
                    <span style={{ fontSize: '9px', color: d.isToday ? 'var(--amber)' : 'var(--text-muted)', fontWeight: d.isToday ? 700 : 500 }}>
                      {d.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestone Next Goal */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-hairline)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{nextMilestone.icon}</span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                Next Badge: {nextMilestone.name} ({nextMilestone.days} Days)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {Math.max(0, nextMilestone.days - streak.currentStreak)} more days of study to unlock
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', fontSize: '12px', fontWeight: 700 }} className="mono">
            <Trophy size={14} />
            <span>{streak.currentStreak}/{nextMilestone.days}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

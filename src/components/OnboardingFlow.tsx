import React, { useState } from 'react';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  BookOpen, 
  Terminal, 
  Award, 
  Feather,
  Sun,
  Moon
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  soundEnabled: boolean;
}

const FOCUS_PRESETS = [
  {
    id: 'academics',
    title: 'School & Academics',
    description: 'Classes, daily homework, revision, and school subjects.',
    icon: <BookOpen size={20} strokeWidth={2} />,
    color: 'var(--sky)',
    bg: 'var(--sky-subtle)',
    border: 'var(--sky-border)',
  },
  {
    id: 'competitive',
    title: 'Competitive Exam Prep',
    description: 'JEE, NEET, SAT, solving practice sets, and formula review.',
    icon: <Award size={20} strokeWidth={2} />,
    color: 'var(--amber)',
    bg: 'var(--amber-subtle)',
    border: 'var(--amber-border)',
  },
  {
    id: 'software',
    title: 'Coding & Development',
    description: 'Learning programming, building apps, and writing code.',
    icon: <Terminal size={20} strokeWidth={2} />,
    color: 'var(--violet)',
    bg: 'var(--violet-subtle)',
    border: 'var(--violet-border)',
  },
  {
    id: 'scholar',
    title: 'Personal Study & Reading',
    description: 'Self-directed reading, writing, languages, and creative work.',
    icon: <Feather size={20} strokeWidth={2} />,
    color: 'var(--emerald)',
    bg: 'var(--emerald-subtle)',
    border: 'var(--emerald-border)',
  }
];

const WAKE_OPTIONS = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00'];
const SLEEP_OPTIONS = ['21:30', '22:00', '22:30', '23:00', '23:30', '00:00'];

const TRIGGER_SUGGESTIONS = [
  'Right after breakfast',
  'When arriving home from class',
  'When my morning alarm rings',
  'After dinner at 8:00 PM'
];

const ACTION_SUGGESTIONS = [
  'Solve 3 practice problems',
  'Review formula notes for 15 mins',
  'Write 20 lines of clean code',
  'Read 10 pages of my book'
];

const BENEFIT_SUGGESTIONS = [
  'Confidence for upcoming exams',
  'Start the day with a clear mind',
  'Steady progress every day',
  'Guilt-free relaxation in the evening'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onCancel,
  soundEnabled
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [selectedFocus, setSelectedFocus] = useState(FOCUS_PRESETS[0]);
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('23:00');

  // Connected Habit Loop Nodes
  const [cue, setCue] = useState(TRIGGER_SUGGESTIONS[0]);
  const [routine, setRoutine] = useState(ACTION_SUGGESTIONS[0]);
  const [reward, setReward] = useState(BENEFIT_SUGGESTIONS[0]);
  const [habitName, setHabitName] = useState('Daily Problem Practice');

  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getSleepDurationHours = () => {
    const wakeMin = toMinutes(wakeTime);
    const sleepMin = toMinutes(sleepTime);
    let dur = wakeMin - sleepMin;
    if (dur < 0) dur += 24 * 60;
    return (dur / 60).toFixed(1);
  };

  const sleepHours = getSleepDurationHours();
  const awakeHours = (24 - parseFloat(sleepHours)).toFixed(1);

  const handleNext = () => {
    playClickSound(soundEnabled);
    if (currentStep === 1) {
      if (!name.trim()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    playClickSound(soundEnabled);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessChime(soundEnabled);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 }
    });

    storage.initializeFromOnboarding({
      displayName: name.trim() || 'Learner',
      wakeTime,
      sleepTime,
      primaryFocus: selectedFocus.title,
      firstHabitTitle: habitName.trim() || 'Daily Habit',
      firstHabitCue: cue.trim(),
      firstHabitRoutine: routine.trim(),
      firstHabitReward: reward.trim()
    });

    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(7, 9, 13, 0.96)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>

      <div style={{
        width: '660px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 40px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }} className="animate-pop">

        {/* Top Step Dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: 'var(--emerald)'
            }} className="pulse-dot" />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }} className="mono">
              Step {currentStep} of 3
            </span>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i <= currentStep ? 'var(--emerald)' : 'var(--bg-subtle)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Name & Primary Focus */}
        {currentStep === 1 && (
          <div key="step-1" className="animate-pop">
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Let's set up your workspace
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Tell us your name and what you're working on so we can organize your day.
              </p>
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
                What is your name?
              </label>
              <input
                type="text"
                placeholder="e.g. Maya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-pure)',
                  fontSize: '15px',
                  fontWeight: 500
                }}
                autoFocus
              />
            </div>

            {/* Focus Cards with Smooth Hover Animation */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
                What are you studying or working on?
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {FOCUS_PRESETS.map(preset => {
                  const isSelected = selectedFocus.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => { setSelectedFocus(preset); playClickSound(soundEnabled); }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? preset.bg : 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: isSelected ? preset.color : 'var(--border-hairline)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: preset.color, display: 'flex' }}>
                          {preset.icon}
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: preset.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={11} strokeWidth={3} color="#090b10" />
                          </div>
                        )}
                      </div>

                      <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                        {preset.title}
                      </h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {preset.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Back to Home
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!name.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: name.trim() ? 'var(--emerald)' : 'var(--bg-subtle)',
                  color: name.trim() ? '#090b10' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: name.trim() ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <span>Next: Schedule Your Day</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Sleep and Wake Time */}
        {currentStep === 2 && (
          <div key="step-2" className="animate-pop">
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                When do you wake up and sleep?
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                We'll set your 24-hour timeline and calculate how much free time you have each day.
              </p>
            </div>

            {/* Wake Time Pills */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sun size={15} color="var(--amber)" />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                  Wake-Up Time
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
                  ({wakeTime})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {WAKE_OPTIONS.map(time => {
                  const isSel = wakeTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => { setWakeTime(time); playClickSound(soundEnabled); }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12.5px',
                        fontWeight: isSel ? 600 : 400,
                        backgroundColor: isSel ? 'var(--amber)' : 'var(--bg-card)',
                        color: isSel ? '#090b10' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--amber)' : 'var(--border-hairline)',
                        transform: isSel ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isSel ? '0 4px 12px rgba(245, 158, 11, 0.25)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} className="mono"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sleep Time Pills */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Moon size={15} color="var(--sky)" />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
                  Bedtime
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
                  ({sleepTime})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {SLEEP_OPTIONS.map(time => {
                  const isSel = sleepTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => { setSleepTime(time); playClickSound(soundEnabled); }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12.5px',
                        fontWeight: isSel ? 600 : 400,
                        backgroundColor: isSel ? 'var(--sky)' : 'var(--bg-card)',
                        color: isSel ? '#090b10' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--sky)' : 'var(--border-hairline)',
                        transform: isSel ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isSel ? '0 4px 12px rgba(56, 189, 248, 0.25)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} className="mono"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live 24h Day Bar with Smooth Transition */}
            <div className="panel" style={{ padding: '16px 20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }} className="mono">
                <span>Your Day Breakdown</span>
                <span style={{ color: 'var(--text-pure)' }}>{sleepHours} hrs sleep • {awakeHours} hrs awake</span>
              </div>

              {/* Dynamic Animated Bar */}
              <div style={{ height: '14px', borderRadius: '3px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden', display: 'flex' }}>
                <div style={{
                  width: `${(parseFloat(sleepHours) / 24) * 100}%`,
                  height: '100%',
                  backgroundColor: '#64748b',
                  transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }} title="Sleep" />
                <div style={{
                  width: `${(parseFloat(awakeHours) / 24) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--sky)',
                  transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }} title="Awake" />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#64748b' }} />
                  <span>Rest / Sleep ({sleepHours}h)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--sky)' }} />
                  <span>Awake for classes & study ({awakeHours}h)</span>
                </div>
              </div>
            </div>

            {/* Nav Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--emerald)',
                  color: '#090b10',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <span>Next: Add Your First Habit</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Anchor Habit with Connected Flow & Animated Links */}
        {currentStep === 3 && (
          <form onSubmit={handleFinish} key="step-3" className="animate-pop">
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Pick one small habit to start
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Make it so small it takes less than 2 minutes to start. Consistency is what matters.
              </p>
            </div>

            {/* Habit Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }} className="mono">
                Habit Name
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-pure)'
                }}
              />
            </div>

            {/* Connected Node 1: Trigger */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--amber)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)' }}>
                  1. When does it happen? (The Trigger)
                </span>
              </div>
              <input
                type="text"
                value={cue}
                onChange={(e) => setCue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--amber-border)',
                  fontSize: '12.5px',
                  color: 'var(--text-pure)',
                  marginBottom: '6px'
                }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {TRIGGER_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCue(sug)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: cue === sug ? 'var(--amber-subtle)' : 'var(--bg-card)',
                      color: cue === sug ? 'var(--amber)' : 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid',
                      borderColor: cue === sug ? 'var(--amber)' : 'var(--border-hairline)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Node 2: The Action */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--sky)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sky)' }}>
                  2. What is the small step? (The Action)
                </span>
              </div>
              <input
                type="text"
                value={routine}
                onChange={(e) => setRoutine(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--sky-border)',
                  fontSize: '12.5px',
                  color: 'var(--text-pure)',
                  marginBottom: '6px'
                }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {ACTION_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRoutine(sug)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: routine === sug ? 'var(--sky-subtle)' : 'var(--bg-card)',
                      color: routine === sug ? 'var(--sky)' : 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid',
                      borderColor: routine === sug ? 'var(--sky)' : 'var(--border-hairline)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Node 3: The Reward */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--emerald)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--emerald)' }}>
                  3. Why does it help? (The Payoff)
                </span>
              </div>
              <input
                type="text"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--emerald-border)',
                  fontSize: '12.5px',
                  color: 'var(--text-pure)',
                  marginBottom: '6px'
                }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {BENEFIT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReward(sug)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: reward === sug ? 'var(--emerald-subtle)' : 'var(--bg-card)',
                      color: reward === sug ? 'var(--emerald)' : 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid',
                      borderColor: reward === sug ? 'var(--emerald)' : 'var(--border-hairline)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 26px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--emerald)',
                  color: '#090b10',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Sparkles size={16} />
                <span>Finish & Open Workspace</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

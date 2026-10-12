import React, { useState } from 'react';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
import { 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
  soundEnabled: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, soundEnabled }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [primaryFocus, setPrimaryFocus] = useState('Academics & Study');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('23:00');

  // First Habit Loop
  const [habitTitle, setHabitTitle] = useState('Morning Reading & Problem Solving');
  const [habitCue, setHabitCue] = useState('Alarm rings and glass of water');
  const [habitRoutine, setHabitRoutine] = useState('Open textbook and solve 5 problems');
  const [habitReward, setHabitReward] = useState('High confidence and guilt-free evening');

  const handleNextStep = () => {
    playClickSound(soundEnabled);
    if (step === 1) {
      if (!name.trim()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    playClickSound(soundEnabled);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessChime(soundEnabled);

    storage.initializeFromOnboarding({
      displayName: name.trim() || 'Learner',
      wakeTime,
      sleepTime,
      primaryFocus,
      firstHabitTitle: habitTitle,
      firstHabitCue: habitCue,
      firstHabitRoutine: habitRoutine,
      firstHabitReward: habitReward
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
      backgroundColor: 'rgba(5, 7, 10, 0.94)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '24px'
    }}>
      <div style={{
        width: '540px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 40px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        position: 'relative'
      }} className="animate-quiet">
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: 'var(--emerald)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }} className="mono">
              Setup • Step {step} of 3
            </span>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '24px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: i <= step ? 'var(--emerald)' : 'var(--bg-subtle)',
                  transition: 'background-color 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Introduction & Profile */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Welcome to Cadence
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                A quiet, local-first daily workspace built for people learning, studying, and building routines. Everything stays on your disk.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  What should we call you?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-pure)',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  What is your primary focus right now?
                </label>
                <select
                  value={primaryFocus}
                  onChange={(e) => setPrimaryFocus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-pure)',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="High School & Board Exams">High School & Board Exams</option>
                  <option value="Competitive Exam Prep">Competitive Exam Prep (JEE, NEET, SAT)</option>
                  <option value="Self-Taught Software Development">Self-Taught Software Development</option>
                  <option value="University & College Degree">University & College Degree</option>
                  <option value="Independent Knowledge Work">Independent Knowledge Work</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid var(--emerald-border)',
                color: 'var(--emerald)',
                fontSize: '12px'
              }}>
                <ShieldCheck size={16} />
                <span>100% Private & Offline. No account required.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!name.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: name.trim() ? 'var(--emerald)' : 'var(--bg-subtle)',
                  color: name.trim() ? '#090b10' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  transition: 'var(--transition-fast)'
                }}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Daily Rhythm & Scheduling */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Anchor Your Daily Rhythm
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                Setting your waking and resting hours anchors your 24-hour schedule and calculates your real discretionary free time.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                  <Clock size={14} />
                  <span>Wake-Up Time</span>
                </div>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'JetBrains Mono'
                  }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Anchor for morning routines
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sky)', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                  <Clock size={14} />
                  <span>Bedtime</span>
                </div>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'JetBrains Mono'
                  }}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Wind down & recovery window
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--emerald)',
                  color: '#090b10',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: The First Anchor Habit */}
        {step === 3 && (
          <form onSubmit={handleFinish}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Your First Anchor Routine
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                Small routines build lasting momentum. Define your first behavioral loop:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Routine Name
                </label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--amber)', display: 'block', marginBottom: '4px' }}>
                  1. The Trigger / Cue (When or where?)
                </label>
                <input
                  type="text"
                  value={habitCue}
                  onChange={(e) => setHabitCue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sky)', display: 'block', marginBottom: '4px' }}>
                  2. The Micro-Step (Smallest action)
                </label>
                <input
                  type="text"
                  value={habitRoutine}
                  onChange={(e) => setHabitRoutine(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--emerald)', display: 'block', marginBottom: '4px' }}>
                  3. The Benefit (Why it matters to you)
                </label>
                <input
                  type="text"
                  value={habitReward}
                  onChange={(e) => setHabitReward(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-xs)',
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
                  gap: '6px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--emerald)',
                  color: '#090b10',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Sparkles size={15} />
                <span>Build Workspace</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { storage } from '../storage/storageAdapter';
import { playClickSound, playSuccessChime } from '../utils/sound';
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
    title: 'High School & Academics',
    description: 'School classes, revision, homework, physics, chemistry & math.',
    icon: <BookOpen size={20} strokeWidth={2} />,
    color: 'var(--sky)',
    bg: 'var(--sky-subtle)',
    border: 'var(--sky-border)',
    defaultBlock: 'Homework & Revision'
  },
  {
    id: 'competitive',
    title: 'Competitive Exam Sprint',
    description: 'Intense question-solving blocks, mock test analysis & formula retention.',
    icon: <Award size={20} strokeWidth={2} />,
    color: 'var(--amber)',
    bg: 'var(--amber-subtle)',
    border: 'var(--amber-border)',
    defaultBlock: 'NCERT & Problem Solving'
  },
  {
    id: 'software',
    title: 'Software & Code Creation',
    description: 'Building tools, shipping commits, algorithmic problem sets & architecture.',
    icon: <Terminal size={20} strokeWidth={2} />,
    color: 'var(--violet)',
    bg: 'var(--violet-subtle)',
    border: 'var(--violet-border)',
    defaultBlock: 'Coding Sprint'
  },
  {
    id: 'scholar',
    title: 'Independent Learning',
    description: 'Self-directed reading, deep writing, language study & research.',
    icon: <Feather size={20} strokeWidth={2} />,
    color: 'var(--emerald)',
    bg: 'var(--emerald-subtle)',
    border: 'var(--emerald-border)',
    defaultBlock: 'Deep Study Block'
  }
];

const WAKE_OPTIONS = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00'];
const SLEEP_OPTIONS = ['21:30', '22:00', '22:30', '23:00', '23:30', '00:00'];

const TRIGGER_SUGGESTIONS = [
  'Alarm rings & glass of water',
  'When arriving home from classes',
  'Sitting down at desk with coffee',
  'Dinner is finished at 8:00 PM'
];

const ACTION_SUGGESTIONS = [
  'Open notebook and solve 3 problems',
  'Review formula cards for 15 minutes',
  'Write 25 lines of clean code',
  'Read 10 pages of required reading'
];

const BENEFIT_SUGGESTIONS = [
  'High exam confidence & zero guilt',
  'Clear head for the rest of the day',
  'Tangible skill growth and mastery',
  'Peaceful restorative sleep'
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
  const [habitName, setHabitName] = useState('Morning Problem Set');

  // Step 2 Time calculation helpers
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

    storage.initializeFromOnboarding({
      displayName: name.trim() || 'Learner',
      wakeTime,
      sleepTime,
      primaryFocus: selectedFocus.title,
      firstHabitTitle: habitName.trim() || 'Anchor Routine',
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
    }} className="animate-quiet">

      <div style={{
        width: '680px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 44px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>

        {/* Step Progress Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: 'var(--emerald)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }} className="mono">
              Workspace Calibration • {currentStep} of 3
            </span>
          </div>

          <button
            onClick={onCancel}
            style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>

        {/* ========================================================
            STEP 1: IDENTITY & PRIMARY CRAFT TILES (NO DROPDOWNS)
           ======================================================== */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Who is using this workspace?
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Your name and learning craft shape your default schedule blocks.
              </p>
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
                Your Name / Handle
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

            {/* Primary Focus - Interactive Jewel Tiles */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="mono">
                Choose Your Primary Craft
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {FOCUS_PRESETS.map(preset => {
                  const isSelected = selectedFocus.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => { setSelectedFocus(preset); playClickSound(soundEnabled); }}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? preset.bg : 'var(--bg-card)',
                        border: '1px solid',
                        borderColor: isSelected ? preset.color : 'var(--border-hairline)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: preset.color, display: 'flex' }}>
                          {preset.icon}
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '16px',
                            height: '16px',
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

            {/* Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                  transition: 'var(--transition-fast)'
                }}
              >
                <span>Continue to Rhythm</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: TACTILE TIME HORIZON & RHYTHM SELECTOR
           ======================================================== */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Anchor your daily cycle
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Select when your daylight begins and when you wind down for sleep.
              </p>
            </div>

            {/* Morning Rise Selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sun size={14} color="var(--amber)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-pure)' }}>
                  Morning Rise Hour
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
                        padding: '9px 0',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12.5px',
                        fontWeight: isSel ? 600 : 400,
                        backgroundColor: isSel ? 'var(--amber)' : 'var(--bg-card)',
                        color: isSel ? '#090b10' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--amber)' : 'var(--border-hairline)',
                        transition: 'var(--transition-fast)'
                      }} className="mono"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evening Rest Selector */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Moon size={14} color="var(--sky)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-pure)' }}>
                  Evening Slumber Hour
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
                        padding: '9px 0',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12.5px',
                        fontWeight: isSel ? 600 : 400,
                        backgroundColor: isSel ? 'var(--sky)' : 'var(--bg-card)',
                        color: isSel ? '#090b10' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--sky)' : 'var(--border-hairline)',
                        transition: 'var(--transition-fast)'
                      }} className="mono"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual 24-Hour Day Distribution Preview */}
            <div className="panel" style={{ padding: '16px 20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)' }} className="mono">
                <span>Calculated Day Horizon</span>
                <span>{awakeHours}h Waking • {sleepHours}h Sleep</span>
              </div>

              {/* Dynamic Bar */}
              <div style={{ height: '16px', borderRadius: '3px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(parseFloat(sleepHours) / 24) * 100}%`, height: '100%', backgroundColor: '#64748b' }} title="Sleep Block" />
                <div style={{ width: `${(parseFloat(awakeHours) / 24) * 100}%`, height: '100%', backgroundColor: 'var(--sky)' }} title="Daylight & Focus Horizon" />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#64748b' }} />
                  <span>Rest / Sleep ({sleepHours}h)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--sky)' }} />
                  <span>Active Waking Horizon ({awakeHours}h)</span>
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
                  transition: 'var(--transition-fast)'
                }}
              >
                <span>Continue to Anchor Habit</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: THE CONNECTED BEHAVIORAL LOOP ARCHITECT
           ======================================================== */}
        {currentStep === 3 && (
          <form onSubmit={handleFinish}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
                Build your anchor routine
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                The 2-Minute Rule: Connect a physical trigger to a micro-action so small it's impossible to procrastinate.
              </p>
            </div>

            {/* Habit Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }} className="mono">
                Routine Title
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
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--amber)' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--amber)' }}>
                  1. The Trigger (When / Context)
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
                {TRIGGER_SUGGESTIONS.slice(0, 3).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCue(sug)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Node 2: Micro-Step */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--sky)' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sky)' }}>
                  2. The Micro-Step (Small action)
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
                {ACTION_SUGGESTIONS.slice(0, 3).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRoutine(sug)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Node 3: Payoff */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--emerald)' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--emerald)' }}>
                  3. The Psychological Payoff (Why it feels good)
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
                {BENEFIT_SUGGESTIONS.slice(0, 3).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReward(sug)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontSize: '10.5px',
                      border: '1px solid var(--border-hairline)'
                    }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Row */}
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
                  transition: 'var(--transition-fast)'
                }}
              >
                <Sparkles size={16} />
                <span>Initialize My Cadence</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

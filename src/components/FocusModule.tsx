import React, { useState, useEffect, useRef } from 'react';
import type { FocusLog } from '../types';
import { storage } from '../storage/storageAdapter';
import { ambientEngine, playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  Flag,
  Flame,
  Sliders
} from 'lucide-react';

interface FocusModuleProps {
  soundEnabled: boolean;
}

type TimerPreset = { label: string; focusMinutes: number; breakMinutes: number };

const PRESETS: TimerPreset[] = [
  { label: '25 min Focus', focusMinutes: 25, breakMinutes: 5 },
  { label: '45 min Study', focusMinutes: 45, breakMinutes: 15 },
  { label: '90 min Deep Focus', focusMinutes: 90, breakMinutes: 20 },
];

export const FocusModule: React.FC<FocusModuleProps> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(PRESETS[0]);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [autoTransition, setAutoTransition] = useState(false);

  // Custom Duration State
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customFocusMin, setCustomFocusMin] = useState(30);
  const [customBreakMin, setCustomBreakMin] = useState(5);

  // Persistent Session Logging State
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>(() => storage.getFocusLogs());

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Ambient sound state
  const [ambientType, setAmbientType] = useState<'none' | 'brown' | 'white' | 'rain'>('none');
  const [ambientVol, setAmbientVol] = useState(0.2);

  const timerRef = useRef<number | null>(null);
  const stopwatchRef = useRef<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = focusLogs.filter(l => l.dateStr === todayStr);
  const todayMinutes = todayLogs.reduce((acc, l) => acc + l.minutes, 0);
  const todaySessions = todayLogs.length;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playSuccessChime(soundEnabled);
            if (!isBreak) {
              // Log session into storage!
              storage.addFocusLog(selectedPreset.focusMinutes);
              setFocusLogs(storage.getFocusLogs());

              setIsBreak(true);
              if (!autoTransition) {
                setIsRunning(false);
              }
              return selectedPreset.breakMinutes * 60;
            } else {
              setIsBreak(false);
              if (!autoTransition) {
                setIsRunning(false);
              }
              return selectedPreset.focusMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreak, selectedPreset, soundEnabled, autoTransition]);

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = window.setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  const handleAmbientToggle = (type: 'brown' | 'white' | 'rain') => {
    if (ambientType === type) {
      ambientEngine.stopNoise();
      setAmbientType('none');
    } else {
      ambientEngine.startNoise(type, ambientVol);
      setAmbientType(type);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVol(vol);
    ambientEngine.setVolume(vol);
  };

  useEffect(() => {
    return () => {
      ambientEngine.stopNoise();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectPreset = (preset: TimerPreset) => {
    setIsCustomMode(false);
    setSelectedPreset(preset);
    setIsBreak(false);
    setIsRunning(false);
    setTimeLeft(preset.focusMinutes * 60);
    playClickSound(soundEnabled);
  };

  const handleApplyCustom = () => {
    const customPreset: TimerPreset = {
      label: `${customFocusMin} min Custom`,
      focusMinutes: Math.max(1, customFocusMin),
      breakMinutes: Math.max(1, customBreakMin)
    };
    setSelectedPreset(customPreset);
    setIsBreak(false);
    setIsRunning(false);
    setTimeLeft(customPreset.focusMinutes * 60);
    setIsCustomMode(true);
    playClickSound(soundEnabled);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    playClickSound(soundEnabled);
  };

  const toggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
    playClickSound(soundEnabled);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
    setLaps([]);
    playClickSound(soundEnabled);
  };

  const recordLap = () => {
    setLaps([stopwatchSeconds, ...laps]);
    playClickSound(soundEnabled);
  };

  const currentDurationTotal = (isBreak ? selectedPreset.breakMinutes : selectedPreset.focusMinutes) * 60;
  const progressRatio = Math.max(0, Math.min(1, (currentDurationTotal - timeLeft) / currentDurationTotal));
  const strokeDashoffset = 754 - (754 * progressRatio);

  return (
    <div className="animate-quiet" style={{
      padding: isZenMode ? '40px' : '36px 48px',
      maxWidth: isZenMode ? '100vw' : '880px',
      margin: '0 auto',
      minHeight: isZenMode ? '100vh' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: isZenMode ? 'center' : 'flex-start'
    }}>
      {!isZenMode && (
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
              backgroundColor: isBreak ? 'var(--emerald-subtle)' : 'var(--violet-subtle)',
              border: `1px solid ${isBreak ? 'var(--emerald-border)' : 'var(--violet-border)'}`,
              color: isBreak ? 'var(--emerald)' : 'var(--violet)',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '6px'
            }}>
              {isBreak ? 'Break Time • Take a breath' : 'Focus Session • Stay in the zone'}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
              Deep Focus Studio
            </h2>
          </div>

          {/* Today's Focus Stats Metric Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)'
            }}>
              <Flame size={16} color="var(--amber)" />
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }} className="mono">
                  Today's Focus
                </span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-pure)' }}>
                  {todaySessions} {todaySessions === 1 ? 'block' : 'blocks'} • {todayMinutes}m
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => { setActiveTab('pomodoro'); playClickSound(soundEnabled); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12.5px',
                  fontWeight: activeTab === 'pomodoro' ? 600 : 500,
                  backgroundColor: activeTab === 'pomodoro' ? 'var(--violet)' : 'transparent',
                  color: activeTab === 'pomodoro' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                Timer
              </button>
              <button
                onClick={() => { setActiveTab('stopwatch'); playClickSound(soundEnabled); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12.5px',
                  fontWeight: activeTab === 'stopwatch' ? 600 : 500,
                  backgroundColor: activeTab === 'stopwatch' ? 'var(--violet)' : 'transparent',
                  color: activeTab === 'stopwatch' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                Stopwatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Focus Viewport */}
      {activeTab === 'pomodoro' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Preset Buttons & Custom Picker */}
          {!isZenMode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: !isCustomMode && selectedPreset.label === preset.label ? 'var(--violet-subtle)' : 'var(--bg-surface)',
                      border: '1px solid',
                      borderColor: !isCustomMode && selectedPreset.label === preset.label ? 'var(--violet-border)' : 'var(--border-hairline)',
                      color: !isCustomMode && selectedPreset.label === preset.label ? 'var(--violet)' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}

                <button
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: isCustomMode ? 'var(--sky-subtle)' : 'var(--bg-surface)',
                    border: '1px solid',
                    borderColor: isCustomMode ? 'var(--sky-border)' : 'var(--border-hairline)',
                    color: isCustomMode ? 'var(--sky)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sliders size={13} />
                  <span>Custom Block</span>
                </button>
              </div>

              {/* Custom Duration Controls */}
              {isCustomMode && (
                <div className="animate-pop" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Focus:</span>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customFocusMin}
                      onChange={e => setCustomFocusMin(parseInt(e.target.value) || 1)}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>m</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Break:</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customBreakMin}
                      onChange={e => setCustomBreakMin(parseInt(e.target.value) || 1)}
                      style={{
                        width: '50px',
                        padding: '4px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>m</span>
                  </div>

                  <button
                    onClick={handleApplyCustom}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--sky)',
                      color: '#090b10',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Circular Countdown Ring */}
          <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="280" height="280" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="var(--bg-surface)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke={isBreak ? 'var(--emerald)' : 'var(--violet)'}
                strokeWidth="8"
                fill="none"
                strokeDasharray="754"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
              />
            </svg>

            {/* Countdown Text */}
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <span className="mono" style={{ fontSize: '54px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-pure)' }}>
                {formatTime(timeLeft)}
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {isBreak ? 'Rest & Recharge' : `${selectedPreset.focusMinutes}m Study Block`}
              </p>
            </div>
          </div>

          {/* Timer Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '36px' }}>
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(selectedPreset.focusMinutes * 60);
                setIsBreak(false);
                playClickSound(soundEnabled);
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={toggleTimer}
              style={{
                padding: '14px 44px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: isBreak ? 'var(--emerald)' : 'var(--violet)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 6px 20px ${isBreak ? 'rgba(16, 185, 129, 0.35)' : 'rgba(139, 92, 246, 0.35)'}`,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} fill="#ffffff" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={() => setIsZenMode(!isZenMode)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={isZenMode ? 'Exit Zen Mode' : 'Fullscreen Zen Mode'}
            >
              {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {/* Auto-transition switch */}
          {!isZenMode && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoTransition}
                  onChange={() => setAutoTransition(!autoTransition)}
                />
                <span>Auto-start breaks & flow into next block</span>
              </label>
            </div>
          )}
        </div>
      ) : (
        /* Stopwatch Tab */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <span className="mono" style={{ fontSize: '50px', fontWeight: 700, color: 'var(--text-pure)' }}>
              {formatTime(stopwatchSeconds)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={recordLap}
              disabled={!isStopwatchRunning}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                color: isStopwatchRunning ? 'var(--text-secondary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isStopwatchRunning ? 'pointer' : 'not-allowed'
              }}
              title="Record Lap"
            >
              <Flag size={15} />
            </button>

            <button
              onClick={toggleStopwatch}
              style={{
                padding: '12px 38px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--violet)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isStopwatchRunning ? <Pause size={17} /> : <Play size={17} fill="#ffffff" />}
              <span>{isStopwatchRunning ? 'Stop' : 'Start'}</span>
            </button>

            <button
              onClick={resetStopwatch}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Reset Stopwatch"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div style={{
              width: '100%',
              maxWidth: '380px',
              marginTop: '28px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              {laps.map((lapSec, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderBottom: i < laps.length - 1 ? '1px solid var(--border-hairline)' : 'none'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Lap {laps.length - i}</span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {formatTime(lapSec)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline Ambient Sound Controls */}
      {!isZenMode && (
        <div style={{
          marginTop: '48px',
          padding: '20px 24px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pure)' }}>
              Offline Ambient Synthesizer
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Procedural audio generated in real time using Web Audio API — 100% offline.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['brown', 'white', 'rain'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleAmbientToggle(type)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: ambientType === type ? 'var(--violet-subtle)' : 'var(--bg-card)',
                    border: '1px solid',
                    borderColor: ambientType === type ? 'var(--violet-border)' : 'var(--border-hairline)',
                    color: ambientType === type ? 'var(--violet)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {type} Noise
                </button>
              ))}
            </div>

            {ambientType !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={14} color="var(--violet)" />
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={ambientVol}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  style={{ width: '70px', accentColor: 'var(--violet)' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ambientEngine, playClickSound, playSuccessChime } from '../utils/sound';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Flag 
} from 'lucide-react';

interface FocusModuleProps {
  soundEnabled: boolean;
}

type TimerPreset = { label: string; focusMinutes: number; breakMinutes: number };

const PRESETS: TimerPreset[] = [
  { label: '25m Pomodoro', focusMinutes: 25, breakMinutes: 5 },
  { label: '45m Class Block', focusMinutes: 45, breakMinutes: 15 },
  { label: '90m Deep Work', focusMinutes: 90, breakMinutes: 20 },
];

export const FocusModule: React.FC<FocusModuleProps> = ({ soundEnabled }) => {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(PRESETS[0]);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Ambient sound state
  const [ambientType, setAmbientType] = useState<'none' | 'brown' | 'white' | 'rain'>('none');
  const [ambientVol, setAmbientVol] = useState(0.2);

  const timerRef = useRef<number | null>(null);
  const stopwatchRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playSuccessChime(soundEnabled);
            if (!isBreak) {
              setIsBreak(true);
              return selectedPreset.breakMinutes * 60;
            } else {
              setIsBreak(false);
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
  }, [isRunning, isBreak, selectedPreset, soundEnabled]);

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

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedPreset.focusMinutes * 60);
    playClickSound(soundEnabled);
  };

  const selectPreset = (preset: TimerPreset) => {
    setSelectedPreset(preset);
    setIsBreak(false);
    setIsRunning(false);
    setTimeLeft(preset.focusMinutes * 60);
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
              {isBreak ? 'Resting / Buffer Interval' : 'Deep Focus & Flow State'}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
              Focus Studio
            </h2>
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
                transition: 'var(--transition-fast)'
              }}
            >
              Intervals
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
                transition: 'var(--transition-fast)'
              }}
            >
              Stopwatch
            </button>
          </div>
        </div>
      )}

      {/* Main Focus Chamber */}
      <div className="panel" style={{
        padding: isZenMode ? '60px' : '48px 32px',
        textAlign: 'center',
        position: 'relative',
        backgroundColor: 'var(--bg-card)'
      }}>
        {/* Fullscreen Zen Mode Button */}
        <button
          onClick={() => setIsZenMode(!isZenMode)}
          title={isZenMode ? 'Exit Fullscreen' : 'Fullscreen Zen Mode'}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            padding: '7px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pure)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {activeTab === 'pomodoro' ? (
          <div>
            {!isZenMode && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
                {PRESETS.map(preset => {
                  const isSel = selectedPreset.label === preset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => selectPreset(preset)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '12px',
                        fontWeight: isSel ? 600 : 500,
                        backgroundColor: isSel ? 'var(--violet)' : 'var(--bg-subtle)',
                        color: isSel ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--violet)' : 'var(--border-hairline)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Precision Digits */}
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: isZenMode ? '130px' : '96px',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: isBreak ? 'var(--emerald)' : 'var(--text-pure)',
              marginBottom: '20px'
            }}>
              {formatTime(timeLeft)}
            </div>

            <p style={{
              fontSize: '11.5px',
              color: isBreak ? 'var(--emerald)' : 'var(--violet)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '32px'
            }} className="mono">
              {isBreak ? 'Rest & Decompression' : 'Deep Study Sprint'}
            </p>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
              <button
                onClick={resetTimer}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-hairline)',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pure)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={toggleTimer}
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isRunning ? 'var(--rose)' : 'var(--violet)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isRunning ? '0 4px 18px rgba(244, 63, 94, 0.35)' : '0 4px 18px rgba(139, 92, 246, 0.35)',
                  transition: 'var(--transition-fast)'
                }}
              >
                {isRunning ? <Pause size={22} color="#ffffff" /> : <Play size={22} style={{ marginLeft: '2px' }} />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: isZenMode ? '130px' : '96px',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--text-pure)',
              marginBottom: '28px'
            }}>
              {formatTime(stopwatchSeconds)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <button
                onClick={resetStopwatch}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-hairline)'
                }}
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={toggleStopwatch}
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isStopwatchRunning ? 'var(--rose)' : 'var(--violet)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)'
                }}
              >
                {isStopwatchRunning ? <Pause size={22} color="#ffffff" /> : <Play size={22} style={{ marginLeft: '2px' }} />}
              </button>

              {isStopwatchRunning && (
                <button
                  onClick={recordLap}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--sky)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-hairline)'
                  }}
                >
                  <Flag size={16} />
                </button>
              )}
            </div>

            {laps.length > 0 && (
              <div style={{ maxWidth: '300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {laps.map((lap, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    fontSize: '12px'
                  }} className="mono">
                    <span style={{ color: 'var(--text-muted)' }}>Lap {laps.length - i}</span>
                    <span style={{ color: 'var(--text-pure)', fontWeight: 600 }}>{formatTime(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Procedural Offline Ambient Generator */}
      <div className="panel" style={{
        marginTop: '20px',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ color: ambientType !== 'none' ? 'var(--violet)' : 'var(--text-muted)' }}>
            {ambientType !== 'none' ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-pure)' }}>
              Procedural Background Audio
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              100% offline Web Audio synthesizer • Zero streaming lag
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['brown', 'rain', 'white'] as const).map(type => {
            const isSel = ambientType === type;
            return (
              <button
                key={type}
                onClick={() => handleAmbientToggle(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: isSel ? 600 : 500,
                  backgroundColor: isSel ? 'var(--violet)' : 'var(--bg-subtle)',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isSel ? 'var(--violet)' : 'var(--border-hairline)',
                  textTransform: 'capitalize',
                  transition: 'var(--transition-fast)'
                }}
              >
                {type} Noise
              </button>
            );
          })}

          {ambientType !== 'none' && (
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={ambientVol}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ width: '80px', accentColor: 'var(--violet)', marginLeft: '8px' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

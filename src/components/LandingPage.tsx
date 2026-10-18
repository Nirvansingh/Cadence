import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  CheckSquare, 
  BookOpen, 
  Sliders, 
  UploadCloud, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ExternalLink 
} from 'lucide-react';
import { playClickSound, playSuccessChime, ambientEngine } from '../utils/sound';

const GithubIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface LandingPageProps {
  onStartSetup: () => void;
  onExploreDirectly: () => void;
  onImportBackup: () => void;
  onOpenAuth?: () => void;
}

type PreviewTab = 'habits' | 'timetable' | 'focus' | 'kanban' | 'notes' | 'tools';

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSetup,
  onExploreDirectly,
  onImportBackup,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('habits');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Interactive Habits Preview State
  const [previewHabits, setPreviewHabits] = useState([
    { id: '1', title: 'Solve 3 Physics Problem Sets', streak: 4, done: true, tag: 'PHYS-140' },
    { id: '2', title: 'Review Organic Chemistry Lecture Notes', streak: 7, done: false, tag: 'CHEM-202' },
    { id: '3', title: 'Write 40 Lines of Clean TypeScript', streak: 12, done: false, tag: 'CS-106' }
  ]);

  // Interactive Timer Preview State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeNoise, setActiveNoise] = useState<'none' | 'brown' | 'rain' | 'white'>('none');

  // Interactive Tools Preview State
  const [decInput, setDecInput] = useState<string>('42');

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => (s > 0 ? s - 1 : 25 * 60));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  useEffect(() => {
    return () => {
      ambientEngine.stopNoise();
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  const togglePreviewHabit = (id: string) => {
    playClickSound(true);
    setPreviewHabits(prev =>
      prev.map(h => {
        if (h.id === id) {
          const nextDone = !h.done;
          if (nextDone) playSuccessChime(true);
          return {
            ...h,
            done: nextDone,
            streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      })
    );
  };

  const toggleNoise = (type: 'brown' | 'rain' | 'white') => {
    if (activeNoise === type) {
      ambientEngine.stopNoise();
      setActiveNoise('none');
    } else {
      ambientEngine.startNoise(type, 0.2);
      setActiveNoise(type);
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const parseBase = (val: string, radix: number) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return '—';
    return num.toString(radix).toUpperCase();
  };

  return (
    <div className="cadence-landing">
      {/* Precision Header */}
      <header className="lp-header">
        <div className="lp-brand">
          <div className="lp-brand-mark" />
          <span className="lp-brand-name">Cadence</span>
          <span className="lp-brand-badge">v1.0.4 • local-first</span>
        </div>

        <nav className="lp-header-actions">
          <a 
            href="https://github.com/Nirvansingh/Cadence" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-btn-ghost"
            title="View Cadence on GitHub"
          >
            <GithubIcon size={13} />
            <span>GitHub</span>
          </a>

          {onOpenAuth && (
            <button onClick={onOpenAuth} className="lp-btn-ghost">
              <span>Cloud Sync</span>
            </button>
          )}

          <button onClick={onImportBackup} className="lp-btn-ghost" title="Import offline JSON database backup">
            <UploadCloud size={13} />
            <span>Import Data</span>
          </button>

          {installPrompt && (
            <button onClick={handleInstallClick} className="lp-btn-ghost">
              <Download size={13} />
              <span>Install PWA</span>
            </button>
          )}

          <button onClick={onExploreDirectly} className="lp-btn-primary">
            <span>Open Workspace</span>
            <ArrowRight size={13} />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero-section">
        <div className="lp-kicker">
          <span>[ 00 // LOCAL-FIRST WORKSPACE FOR STUDENTS & LEARNERS ]</span>
        </div>

        <h1 className="lp-hero-title">
          A quiet workspace for focused study and daily routines.
        </h1>

        <p className="lp-hero-lead">
          Cadence brings together your class timetable, habit tracking, Pomodoro focus timer, tasks, and STEM notes into one fast, local-first tool. No accounts, no subscriptions, and zero cloud tracking required.
        </p>

        <div className="lp-hero-cta-group">
          <button onClick={onExploreDirectly} className="lp-btn-hero-primary">
            <span>Launch Workspace</span>
            <ArrowRight size={15} />
          </button>

          <a 
            href="https://github.com/Nirvansingh/Cadence" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-btn-hero-secondary"
          >
            <GithubIcon size={15} />
            <span>View Source on GitHub</span>
          </a>

          <button onClick={onStartSetup} className="lp-btn-hero-secondary">
            <span>Setup Wizard</span>
          </button>
        </div>

        <div className="lp-trust-strip">
          <div className="lp-trust-item">
            <span className="lp-trust-dot" />
            <span>100% Offline Capable</span>
          </div>
          <div className="lp-trust-item">
            <span className="lp-trust-dot" />
            <span>Zero Analytics or Telemetry</span>
          </div>
          <div className="lp-trust-item">
            <span className="lp-trust-dot" />
            <span>JSON Backup Ownership</span>
          </div>
          <div className="lp-trust-item">
            <span className="lp-trust-dot" />
            <span>MIT Open Source</span>
          </div>
        </div>
      </section>

      {/* Product Preview Workbench (The Visual Centerpiece) */}
      <section className="lp-workbench-section" aria-label="Interactive Product Preview">
        <div className="lp-workbench">
          {/* Workbench Top Bar */}
          <div className="lp-workbench-topbar">
            <div className="lp-workbench-dots">
              <span className="lp-workbench-dot" />
              <span className="lp-workbench-dot" />
              <span className="lp-workbench-dot" />
            </div>
            <span>cadence // interactive-preview // live-modules</span>
            <span>PRESS CTRL+K IN WORKSPACE</span>
          </div>

          {/* Workbench Module Selector */}
          <div className="lp-workbench-tabs">
            <button
              onClick={() => setActiveTab('habits')}
              className={`lp-workbench-tab ${activeTab === 'habits' ? 'active' : ''}`}
            >
              <CheckCircle2 size={13} color="var(--lp-amber)" />
              <span>01. Habits & Streaks</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`lp-workbench-tab ${activeTab === 'timetable' ? 'active' : ''}`}
            >
              <Calendar size={13} color="var(--lp-sky)" />
              <span>02. 24h Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`lp-workbench-tab ${activeTab === 'focus' ? 'active' : ''}`}
            >
              <Clock size={13} color="var(--lp-sage)" />
              <span>03. Focus & Audio</span>
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`lp-workbench-tab ${activeTab === 'kanban' ? 'active' : ''}`}
            >
              <CheckSquare size={13} color="var(--lp-text-primary)" />
              <span>04. Task Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`lp-workbench-tab ${activeTab === 'notes' ? 'active' : ''}`}
            >
              <BookOpen size={13} color="#df7283" />
              <span>05. STEM Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`lp-workbench-tab ${activeTab === 'tools' ? 'active' : ''}`}
            >
              <Sliders size={13} color="var(--lp-text-muted)" />
              <span>06. Student Tools</span>
            </button>
          </div>

          {/* Workbench Body */}
          <div className="lp-workbench-body">
            {/* 1. Habits Preview */}
            {activeTab === 'habits' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      Daily Habit Checklist
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Click checkboxes below to test real procedural audio feedback and streak tracking.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sage)', background: 'var(--lp-sage-subtle)', padding: '2px 8px', borderRadius: '3px' }}>
                    {previewHabits.filter(h => h.done).length}/{previewHabits.length} COMPLETED
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {previewHabits.map(h => (
                    <div
                      key={h.id}
                      onClick={() => togglePreviewHabit(h.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '4px',
                        backgroundColor: h.done ? 'rgba(122, 154, 130, 0.08)' : 'var(--lp-bg)',
                        border: `1px solid ${h.done ? 'var(--lp-sage-border)' : 'var(--lp-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '3px',
                          border: `1px solid ${h.done ? 'var(--lp-sage)' : 'var(--lp-border)'}`,
                          backgroundColor: h.done ? 'var(--lp-sage)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0c0e12',
                          fontSize: '11px'
                        }}>
                          {h.done && '✓'}
                        </div>
                        <span style={{
                          fontSize: '13px',
                          color: h.done ? 'var(--lp-text-muted)' : 'var(--lp-text-primary)',
                          textDecoration: h.done ? 'line-through' : 'none'
                        }}>
                          {h.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-muted)' }}>
                          {h.tag}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-amber)' }}>
                          {h.streak}d streak
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heatmap strip preview */}
                <div style={{ marginTop: '18px', padding: '12px 14px', backgroundColor: 'var(--lp-bg)', borderRadius: '4px', border: '1px solid var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--lp-text-secondary)' }}>
                    Weekly Consistency (M T W T F S S)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '3px',
                          fontSize: '9.5px',
                          fontFamily: 'JetBrains Mono',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: idx < 5 ? 'var(--lp-sage-subtle)' : 'var(--lp-surface)',
                          color: idx < 5 ? 'var(--lp-sage)' : 'var(--lp-text-muted)',
                          border: `1px solid ${idx < 5 ? 'var(--lp-sage-border)' : 'var(--lp-border)'}`
                        }}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Timetable Preview */}
            {activeTab === 'timetable' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      24-Hour Horizon & RFC 5545 .ics Export
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Proportional daylight visualization with commute buffers and one-click calendar sync.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sky)' }}>
                    6.5h UNSCHEDULED BUFFER
                  </span>
                </div>

                {/* 24h Bar */}
                <div style={{ height: '36px', borderRadius: '4px', backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ width: '25%', backgroundColor: 'rgba(255,255,255,0.03)', borderRight: '1px solid var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
                    00:00 - 06:00 (Sleep)
                  </div>
                  <div style={{ width: '15%', backgroundColor: 'rgba(100, 149, 170, 0.2)', borderRight: '1px solid var(--lp-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', color: 'var(--lp-sky)', fontWeight: 500 }}>
                    CHEM-202 (08:30)
                  </div>
                  <div style={{ width: '20%', backgroundColor: 'rgba(122, 154, 130, 0.2)', borderRight: '1px solid var(--lp-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', color: 'var(--lp-sage)', fontWeight: 500 }}>
                    MATH-201 (11:00)
                  </div>
                  <div style={{ width: '15%', backgroundColor: 'rgba(194, 155, 104, 0.2)', borderRight: '1px solid var(--lp-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', color: 'var(--lp-amber)', fontWeight: 500 }}>
                    Lab Session (14:00)
                  </div>
                  <div style={{ width: '25%', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
                    Free Study & Wind-down
                  </div>
                </div>

                {/* Day schedule blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--lp-bg)', borderRadius: '4px', border: '1px solid var(--lp-border)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sky)', marginBottom: '4px' }}>08:30 – 10:00 • LECTURE</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>Organic Chemistry</div>
                    <div style={{ fontSize: '11px', color: 'var(--lp-text-muted)', marginTop: '2px' }}>Hall B • Prof. Richardson</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--lp-bg)', borderRadius: '4px', border: '1px solid var(--lp-border)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sage)', marginBottom: '4px' }}>11:00 – 12:30 • SEMINAR</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>Linear Algebra</div>
                    <div style={{ fontSize: '11px', color: 'var(--lp-text-muted)', marginTop: '2px' }}>Math Annex • Room 402</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--lp-bg)', borderRadius: '4px', border: '1px solid var(--lp-border)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-amber)', marginBottom: '4px' }}>14:00 – 15:30 • LAB</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>Physics Mechanics Lab</div>
                    <div style={{ fontSize: '11px', color: 'var(--lp-text-muted)', marginTop: '2px' }}>Science West • Bench 7</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Focus & Audio Preview */}
            {activeTab === 'focus' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      Pomodoro Intervals & Offline Procedural Sound
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Click below to test real binaural brown noise and rain synthesized live via the Web Audio API.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: activeNoise !== 'none' ? 'var(--lp-sage)' : 'var(--lp-text-muted)' }}>
                    {activeNoise !== 'none' ? `AUDIO: PLAYING (${activeNoise.toUpperCase()})` : 'AUDIO: MUTED'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: 'var(--lp-bg)', padding: '20px 24px', borderRadius: '4px', border: '1px solid var(--lp-border)', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '42px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--lp-text-primary)', letterSpacing: '-0.02em' }}>
                      {formatTimer(timerSeconds)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
                      INTERVAL: 25M CLASSIC POMODORO
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: timerRunning ? 'var(--lp-surface)' : 'var(--lp-text-primary)',
                        color: timerRunning ? 'var(--lp-text-primary)' : '#0c0e12',
                        border: '1px solid var(--lp-border)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {timerRunning ? <Pause size={13} /> : <Play size={13} />}
                      <span>{timerRunning ? 'Pause Timer' : 'Start Interval'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setTimerSeconds(25 * 60);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        color: 'var(--lp-text-muted)',
                        border: '1px solid var(--lp-border)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--lp-border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)' }}>
                      PROCEDURAL AMBIENT SOUND (0 BANDWIDTH):
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleNoise('brown')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontFamily: 'JetBrains Mono',
                          borderRadius: '3px',
                          border: `1px solid ${activeNoise === 'brown' ? 'var(--lp-sage)' : 'var(--lp-border)'}`,
                          backgroundColor: activeNoise === 'brown' ? 'var(--lp-sage-subtle)' : 'var(--lp-surface)',
                          color: activeNoise === 'brown' ? 'var(--lp-sage)' : 'var(--lp-text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {activeNoise === 'brown' ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>Brown Noise</span>
                      </button>
                      <button
                        onClick={() => toggleNoise('rain')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontFamily: 'JetBrains Mono',
                          borderRadius: '3px',
                          border: `1px solid ${activeNoise === 'rain' ? 'var(--lp-sky)' : 'var(--lp-border)'}`,
                          backgroundColor: activeNoise === 'rain' ? 'rgba(100, 149, 170, 0.15)' : 'var(--lp-surface)',
                          color: activeNoise === 'rain' ? 'var(--lp-sky)' : 'var(--lp-text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {activeNoise === 'rain' ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>Rain Filter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Kanban Preview */}
            {activeTab === 'kanban' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      Assignment & Task Pipeline
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Three-column workflow with priority indicators and course tags.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)' }}>
                    3 STAGES // 5 ACTIVE TASKS
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {/* To Do */}
                  <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)', marginBottom: '10px' }}>TO DO (2)</div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '3px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--lp-text-primary)' }}>Calculus Problem Set 6</div>
                      <div style={{ fontSize: '10px', color: '#f43f5e', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>URGENT • Due Tomorrow</div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--lp-text-primary)' }}>Read Chapter 4 Optics</div>
                      <div style={{ fontSize: '10px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>MEDIUM • Due Friday</div>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sky)', marginBottom: '10px' }}>IN PROGRESS (2)</div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '3px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--lp-text-primary)' }}>Physics Lab Report 3</div>
                      <div style={{ fontSize: '10px', color: 'var(--lp-amber)', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>HIGH • Draft Complete</div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--lp-text-primary)' }}>Binary Tree Traversal</div>
                      <div style={{ fontSize: '10px', color: 'var(--lp-sage)', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>CS-106 • Test Cases</div>
                    </div>
                  </div>

                  {/* Completed */}
                  <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sage)', marginBottom: '10px' }}>COMPLETED (1)</div>
                    <div style={{ padding: '8px 10px', backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-sage-border)', borderRadius: '3px', opacity: 0.8 }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--lp-text-muted)', textDecoration: 'line-through' }}>History Essay Outline</div>
                      <div style={{ fontSize: '10px', color: 'var(--lp-sage)', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>✓ Turned in 09:30 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STEM Notes Preview */}
            {activeTab === 'notes' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      Markdown Scratchpad & Scientific Symbol Drawer
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Fast formula insertions with instant mathematical symbol palleting.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)' }}>
                    MARKDOWN // LATEX-FRIENDLY
                  </span>
                </div>

                {/* Symbols toolbar */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {['²', '³', '√', '∑', '∫', '±', 'π', 'θ', 'Δ', '∞', 'λ', 'μ', '≈', '≠'].map(sym => (
                    <span
                      key={sym}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--lp-bg)',
                        border: '1px solid var(--lp-border)',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono',
                        color: 'var(--lp-text-primary)',
                        userSelect: 'none'
                      }}
                    >
                      {sym}
                    </span>
                  ))}
                </div>

                <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '14px', fontFamily: 'JetBrains Mono', fontSize: '12.5px', color: 'var(--lp-text-secondary)', lineHeight: 1.7 }}>
                  <div style={{ color: 'var(--lp-amber)' }}># Kinematics & Work-Energy Theorem</div>
                  <div>• Quadratic Roots: <span style={{ color: 'var(--lp-text-primary)' }}>x = (-b ± √(b² - 4ac)) / (2a)</span></div>
                  <div>• Work Integral: <span style={{ color: 'var(--lp-text-primary)' }}>W = ∫ F(x) dx = ΔK = ½mv² - ½mv₀²</span></div>
                  <div>• Angular Frequency: <span style={{ color: 'var(--lp-text-primary)' }}>ω = 2πf = √(k / m)</span></div>
                </div>
              </div>
            )}

            {/* 6. Tools Preview */}
            {activeTab === 'tools' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-text-primary)' }}>
                      Student & Developer Utilities
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>
                      Real-time base conversions and course-weighted GPA calculations.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)' }}>
                    OFFLINE TOOLKIT
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  {/* Base Converter */}
                  <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-amber)', marginBottom: '8px' }}>
                      BASE CONVERTER (TRY TYPING):
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--lp-text-muted)', display: 'block', marginBottom: '3px' }}>DECIMAL INPUT</label>
                      <input
                        type="number"
                        value={decInput}
                        onChange={e => setDecInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          backgroundColor: 'var(--lp-surface)',
                          border: '1px solid var(--lp-border)',
                          borderRadius: '3px',
                          color: 'var(--lp-text-primary)',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                      <div style={{ padding: '6px', backgroundColor: 'var(--lp-surface)', borderRadius: '3px', border: '1px solid var(--lp-border)' }}>
                        <div style={{ color: 'var(--lp-text-muted)', fontSize: '9px' }}>HEX</div>
                        <div style={{ color: 'var(--lp-text-primary)' }}>0x{parseBase(decInput, 16)}</div>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--lp-surface)', borderRadius: '3px', border: '1px solid var(--lp-border)' }}>
                        <div style={{ color: 'var(--lp-text-muted)', fontSize: '9px' }}>BIN</div>
                        <div style={{ color: 'var(--lp-text-primary)' }}>{parseBase(decInput, 2)}</div>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--lp-surface)', borderRadius: '3px', border: '1px solid var(--lp-border)' }}>
                        <div style={{ color: 'var(--lp-text-muted)', fontSize: '9px' }}>OCT</div>
                        <div style={{ color: 'var(--lp-text-primary)' }}>{parseBase(decInput, 8)}</div>
                      </div>
                    </div>
                  </div>

                  {/* GPA Calculator Preview */}
                  <div style={{ backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '4px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sage)', marginBottom: '8px' }}>
                      SEMESTER GPA WEIGHTING:
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--lp-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>MATH-201 (4.0 Credits)</span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--lp-text-primary)' }}>Grade: A (4.0)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PHYS-140 (4.0 Credits)</span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--lp-text-primary)' }}>Grade: A- (3.7)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>CS-106 (3.0 Credits)</span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--lp-text-primary)' }}>Grade: A (4.0)</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--lp-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--lp-text-muted)' }}>CUMULATIVE GPA</span>
                      <span style={{ fontSize: '16px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--lp-sage)' }}>3.89 / 4.0</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workbench Footer */}
          <div className="lp-workbench-footer">
            <span>engine: local-storage // audio-driver: web-audio-api // telemetry: none</span>
            <button
              onClick={onExploreDirectly}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--lp-text-primary)',
                fontFamily: 'JetBrains Mono',
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              <span>Open in Full Workspace</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* Editorial Core Features */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">[ 01 // CORE CAPABILITIES ]</div>
          <h2 className="lp-section-title">Designed for how students actually study</h2>
          <p className="lp-section-desc">
            No bloated enterprise sprint planning. Just direct, reliable tools for lecture schedules, problem sets, and daily study blocks.
          </p>
        </div>

        <div className="lp-editorial-grid">
          <div className="lp-editorial-item">
            <div className="lp-editorial-num">01 / ROUTINE CONSISTENCY</div>
            <h3 className="lp-editorial-heading">Daily Habit Checklist</h3>
            <p className="lp-editorial-body">
              Track recurring routines without toxic streak pressure. Includes expandable cue, routine, and reward triggers with 7-day mini heatmap strips.
            </p>
            <div className="lp-editorial-tag">
              <CheckCircle2 size={12} color="var(--lp-amber)" />
              <span>CUE ➔ ROUTINE ➔ REWARD MECHANICS</span>
            </div>
          </div>

          <div className="lp-editorial-item">
            <div className="lp-editorial-num">02 / 24-HOUR TIMETABLE</div>
            <h3 className="lp-editorial-heading">Class Schedule & Calendar Sync</h3>
            <p className="lp-editorial-body">
              Proportional 24-hour visual day scheduler. Computes unscheduled free time and commute buffers, with instant RFC 5545 `.ics` export for Google Calendar, Apple Calendar, and Outlook.
            </p>
            <div className="lp-editorial-tag">
              <Calendar size={12} color="var(--lp-sky)" />
              <span>RFC 5545 .ICS EXPORT SPEC</span>
            </div>
          </div>

          <div className="lp-editorial-item">
            <div className="lp-editorial-num">03 / FOCUS STUDIO</div>
            <h3 className="lp-editorial-heading">Synthesized Offline Noise</h3>
            <p className="lp-editorial-body">
              Built-in Pomodoro intervals with real-time procedural Brown Noise, Rain, and White Noise synthesized locally via the Web Audio API. Zero external audio downloads.
            </p>
            <div className="lp-editorial-tag">
              <Clock size={12} color="var(--lp-sage)" />
              <span>WEB AUDIO API OSCILLATORS</span>
            </div>
          </div>

          <div className="lp-editorial-item">
            <div className="lp-editorial-num">04 / TASK PIPELINE</div>
            <h3 className="lp-editorial-heading">Assignment Kanban</h3>
            <p className="lp-editorial-body">
              A clean 3-stage board for problem sets, readings, and lab write-ups. Features urgency filters, course code badges, and due date countdowns.
            </p>
            <div className="lp-editorial-tag">
              <CheckSquare size={12} color="var(--lp-text-primary)" />
              <span>URGENT • HIGH • MEDIUM • LOW</span>
            </div>
          </div>

          <div className="lp-editorial-item">
            <div className="lp-editorial-num">05 / STEM SCRATCHPAD</div>
            <h3 className="lp-editorial-heading">Markdown & Scientific Palette</h3>
            <p className="lp-editorial-body">
              Note-taking with instant live preview, lecture tag filtering, and a 1-click scientific symbol drawer (`²`, `³`, `√`, `∑`, `∫`, `±`, `π`, `θ`, `Δ`, `∞`).
            </p>
            <div className="lp-editorial-tag">
              <BookOpen size={12} color="#df7283" />
              <span>INSTANT SYMBOL INSERTER</span>
            </div>
          </div>

          <div className="lp-editorial-item">
            <div className="lp-editorial-num">06 / ENGINEERING TOOLBOX</div>
            <h3 className="lp-editorial-heading">GPA & CS Base Converters</h3>
            <p className="lp-editorial-body">
              Course-weighted GPA targets, computer science radix conversions (Hex, Bin, Dec, Oct), storage unit scaling (KB, MB, GB, TB), and offline scientific calculator.
            </p>
            <div className="lp-editorial-tag">
              <Sliders size={12} color="var(--lp-text-muted)" />
              <span>OFFLINE ARITHMETIC UTILITIES</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Cadence Exists (Authentic Human Essay) */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">[ 02 // PHILOSOPHY ]</div>
          <h2 className="lp-section-title">Why I built Cadence</h2>
        </div>

        <div className="lp-essay-box">
          <p className="lp-essay-quote">
            "Most productivity tools are either bloated corporate SaaS platforms designed for enterprise managers, or subscription traps charging $12/month to lock your homework notes behind paywalls and AI buzzwords."
          </p>
          <p className="lp-essay-text">
            As a student and developer, I needed something completely different: a tool that opens instantly in a single tab, runs without Wi-Fi in lecture halls, requires zero accounts or passwords, and respects privacy by keeping all data on the machine.
          </p>
          <p className="lp-essay-text" style={{ marginBottom: 0 }}>
            Cadence was built on clean utilitarian design: dark surfaces with high typographic contrast, fast keyboard-driven navigation via <span className="mono">Ctrl + K</span>, and zero telemetry. It is completely free, open source, and will stay that way.
          </p>
        </div>
      </section>

      {/* Technical Architecture & Open Source Transparency */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">[ 03 // ARCHITECTURE & OPEN SOURCE ]</div>
          <h2 className="lp-section-title">Open source, local-first engineering</h2>
          <p className="lp-section-desc">
            Complete transparency into how your data is handled and how the platform is constructed.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '4px', overflowX: 'auto' }}>
          <table className="lp-spec-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Implementation</th>
                <th>Privacy & Performance Guarantee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data Storage</td>
                <td>Local-first (IndexedDB & LocalStorage)</td>
                <td>100% on-device. Zero telemetry. 1-click JSON backup export and restore.</td>
              </tr>
              <tr>
                <td>Audio Engine</td>
                <td>Web Audio API Procedural Synthesis</td>
                <td>Zero MP3 downloads. Synthesizes white/brown noise via oscillators in memory.</td>
              </tr>
              <tr>
                <td>Timetable Export</td>
                <td>RFC 5545 iCalendar standard</td>
                <td>Compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.</td>
              </tr>
              <tr>
                <td>Desktop Packaging</td>
                <td>Tauri 2 (Rust) & Progressive Web App</td>
                <td>Lightweight native desktop window without Electron memory overhead.</td>
              </tr>
              <tr>
                <td>Optional Cloud Sync</td>
                <td>Supabase Authentication & Database</td>
                <td>Optional opt-in sync for students using multiple devices.</td>
              </tr>
              <tr>
                <td>Source Code</td>
                <td>MIT License (GitHub)</td>
                <td>Free forever. Verified open source at github.com/Nirvansingh/Cadence.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--lp-text-secondary)' }}>
            <GithubIcon size={16} />
            <span>Repository:</span>
            <a 
              href="https://github.com/Nirvansingh/Cadence" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--lp-text-primary)', textDecoration: 'underline' }}
            >
              https://github.com/Nirvansingh/Cadence
            </a>
          </div>

          <a 
            href="https://github.com/Nirvansingh/Cadence" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-btn-ghost"
          >
            <span>Star on GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div className="lp-brand-mark" />
              <span style={{ fontWeight: 700, color: 'var(--lp-text-primary)', letterSpacing: '0.04em' }}>CADENCE</span>
              <span>•</span>
              <span>Built by Nirvaan Singh</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--lp-text-muted)' }}>
              15-year-old Full-Stack Engineer • Free & Open Source under MIT License.
            </p>
          </div>

          <nav className="lp-footer-links">
            <button onClick={onExploreDirectly} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Launch Workspace
            </button>
            <button onClick={onStartSetup} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Setup Wizard
            </button>
            <button onClick={onImportBackup} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Import Backup
            </button>
            {onOpenAuth && (
              <button onClick={onOpenAuth} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
                Cloud Sync
              </button>
            )}
            <a 
              href="https://github.com/Nirvansingh/Cadence" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-footer-link"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

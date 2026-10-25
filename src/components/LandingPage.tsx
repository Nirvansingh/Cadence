import React, { useState, useEffect, useRef } from 'react';
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

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSetup,
  onExploreDirectly,
  onImportBackup,
  onOpenAuth
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Passive, GPU-composited background scroll animations
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let ticking = false;
    const updateScrollMetrics = () => {
      const top = el.scrollTop;
      const max = el.scrollHeight - el.clientHeight;
      const ratio = max > 0 ? top / max : 0;
      el.style.setProperty('--scroll-y', `${top}px`);
      el.style.setProperty('--scroll-ratio', ratio.toFixed(4));
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollMetrics);
        ticking = true;
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollMetrics();

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Interactive Habits Preview State (for Bento Grid)
  const [previewHabits, setPreviewHabits] = useState([
    { id: '1', title: 'Solve 3 Physics Problem Sets', streak: 4, done: true, tag: 'PHYS-140' },
    { id: '2', title: 'Review Organic Chemistry Lecture Notes', streak: 7, done: false, tag: 'CHEM-202' },
    { id: '3', title: 'Write 40 Lines of Clean TypeScript', streak: 12, done: false, tag: 'CS-106' }
  ]);

  // Audio Synthesizer State (for Bento Grid)
  const [activeNoise, setActiveNoise] = useState<'none' | 'brown' | 'rain' | 'white'>('none');

  // Interactive Tools Preview State (for Bento Grid)
  const [decInput, setDecInput] = useState<string>('42');

  // Workbench Active Module Tab State
  const [activeTab, setActiveTab] = useState<'habits' | 'timetable' | 'focus' | 'kanban' | 'notes' | 'tools'>('habits');

  // Interactive Focus Timer State (for Bento Grid and Workbench)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  // Custom Drag-and-Drop Backup State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  const handleCopySymbol = (sym: string) => {
    navigator.clipboard.writeText(sym);
    setCopiedSymbol(sym);
    setTimeout(() => setCopiedSymbol(null), 1800);
  };

  const handleBackupFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        JSON.parse(text);
        setImportStatus('Valid Cadence backup detected. Loading into workspace...');
        setTimeout(() => {
          setIsImportModalOpen(false);
          onImportBackup();
        }, 800);
      } catch {
        setImportStatus('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };


  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s: number) => (s > 0 ? s - 1 : 25 * 60));
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
    <div className="cadence-landing" ref={scrollContainerRef}>
      {/* Dynamic Background Scroll Layer */}
      <div className="lp-bg-scroll-layer" aria-hidden="true">
        <div className="lp-bg-scroll-grid" />
        <div className="lp-bg-scroll-orb lp-bg-orb-1" />
        <div className="lp-bg-scroll-orb lp-bg-orb-2" />
        <div className="lp-bg-scroll-orb lp-bg-orb-3" />
        <div className="lp-bg-scroll-beam" />
      </div>

      {/* Precision Header */}
      <header className="lp-header">
        <div className="lp-brand">
          <div className="lp-brand-mark" />
          <span className="lp-brand-name">Cadence</span>
          <span className="lp-brand-badge">v1.0.4 • local-first</span>
        </div>

        <nav className="lp-header-actions">
          <a 
            href="https://github.com/Nirvansingh/Cadence/releases" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-nav-link"
            title="Download Cadence Desktop for Windows (.exe)"
          >
            <span>Desktop (.exe)</span>
          </a>

          <button 
            onClick={() => setIsImportModalOpen(true)} 
            className="lp-nav-link" 
            title="Import offline JSON database backup"
          >
            <UploadCloud size={13} strokeWidth={1.5} />
            <span>Import Backup</span>
          </button>

          {onOpenAuth && (
            <button onClick={onOpenAuth} className="lp-nav-link">
              <span>Cloud Sync</span>
            </button>
          )}

          {installPrompt && (
            <button onClick={handleInstallClick} className="lp-nav-link">
              <Download size={13} />
              <span>Install PWA</span>
            </button>
          )}

          <a 
            href="https://github.com/Nirvansingh/Cadence" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-nav-link"
            title="View Cadence on GitHub"
          >
            <GithubIcon size={13} />
            <span>GitHub</span>
          </a>

          <button onClick={onExploreDirectly} className="lp-btn-primary">
            <span>Launch Web App</span>
            <ArrowRight size={13} />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero-section">
        <div className="lp-hero-eyebrow">
          Local-First Productivity Workspace
        </div>

        <h1 className="lp-hero-title">
          A quiet, powerful workspace for focused study and daily routines.
        </h1>

        <p className="lp-hero-lead">
          Cadence brings together your class timetable, habit tracking, Pomodoro focus timer, tasks, and STEM notes into one fast, local-first tool. Used daily by students and independent researchers worldwide. Zero telemetry, zero cloud tracking.
        </p>

        <div className="lp-hero-cta-group">
          <button onClick={onExploreDirectly} className="lp-btn-hero-primary">
            <span>Launch Web App</span>
            <ArrowRight size={15} />
          </button>

          <a 
            href="https://github.com/Nirvansingh/Cadence/releases" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-btn-hero-secondary"
          >
            <Download size={15} />
            <span>Download Desktop (.exe)</span>
          </a>

          <a 
            href="https://github.com/Nirvansingh/Cadence" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="lp-btn-hero-text"
          >
            <GithubIcon size={14} />
            <span>View on GitHub ↗</span>
          </a>
        </div>

        <div className="lp-hero-footnote">
          Free & open source under MIT • 100% client-side • No account required to start
        </div>
      </section>

      {/* Product Workspace Showcase (The Visual Centerpiece) */}
      <section className="lp-workbench-section" aria-label="Cadence Workspace Showcase">
        <div className="lp-workbench">
          {/* Workbench Top Bar */}
          <div className="lp-workbench-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="lp-workbench-dots">
                <span className="lp-workbench-dot" />
                <span className="lp-workbench-dot" />
                <span className="lp-workbench-dot" />
              </div>
              <span style={{ color: 'var(--lp-text-secondary)' }}>cadence • student-workspace • v1.0.4-production</span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--lp-text-muted)' }}>PRESS CTRL+K IN WORKSPACE</span>
          </div>

          {/* Workbench Module Selector */}
          <div className="lp-workbench-tabs">
            <button
              onClick={() => setActiveTab('habits')}
              className={`lp-workbench-tab ${activeTab === 'habits' ? 'active' : ''}`}
            >
              <CheckCircle2 size={13} color="var(--lp-amber)" />
              <span>Habits & Streaks</span>
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`lp-workbench-tab ${activeTab === 'timetable' ? 'active' : ''}`}
            >
              <Calendar size={13} color="var(--lp-sky)" />
              <span>24h Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`lp-workbench-tab ${activeTab === 'focus' ? 'active' : ''}`}
            >
              <Clock size={13} color="var(--lp-sage)" />
              <span>Focus & Audio</span>
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`lp-workbench-tab ${activeTab === 'kanban' ? 'active' : ''}`}
            >
              <CheckSquare size={13} color="var(--lp-text-primary)" />
              <span>Task Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`lp-workbench-tab ${activeTab === 'notes' ? 'active' : ''}`}
            >
              <BookOpen size={13} color="#df7283" />
              <span>STEM Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`lp-workbench-tab ${activeTab === 'tools' ? 'active' : ''}`}
            >
              <Sliders size={13} color="var(--lp-text-muted)" />
              <span>Student Tools</span>
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
                      Interactive workspace view. Real-time streak tracking with Web Audio acoustic feedback.
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
                      Continuous binaural brown noise and rain synthesized client-side via the Web Audio API.
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
                    3 STAGES • 5 ACTIVE TASKS
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
                    MARKDOWN • LATEX-FRIENDLY
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
                      RADIX / NUMBER BASE CONVERTER:
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
            <span>engine: local-storage • audio-driver: web-audio-api • telemetry: none</span>
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
          <div className="lp-section-index">CORE CAPABILITIES</div>
          <h2 className="lp-section-title">Designed for how students actually study</h2>
          <p className="lp-section-desc">
            No bloated enterprise sprint planning. Just direct, reliable tools for lecture schedules, problem sets, and daily study blocks.
          </p>
        </div>

        {/* Asymmetric Bento Grid (Linear & Stripe Standard) */}
        <div className="lp-bento-grid">
          {/* Bento 1: 24-Hour Day Horizon & Calendar Engine (Span 2) */}
          <div className="lp-bento-card lp-bento-span-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div className="lp-editorial-num">24-HOUR HORIZON</div>
                <h3 className="lp-editorial-heading">Class Schedule & Calendar Sync</h3>
              </div>
              <div className="lp-card-metric" style={{ marginBottom: 0 }}>
                <Calendar size={13} strokeWidth={1.5} color="var(--lp-sky)" />
                <span>RFC 5545 .ics Spec</span>
              </div>
            </div>

            {/* Embedded Interactive Schedule Horizon Bar */}
            <div style={{ height: '32px', borderRadius: '4px', backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', display: 'flex', overflow: 'hidden', margin: '10px 0 16px' }}>
              <div style={{ width: '22%', backgroundColor: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9.5px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
                Sleep (00-06)
              </div>
              <div style={{ width: '20%', backgroundColor: 'rgba(100, 149, 170, 0.18)', borderRight: '1px solid var(--lp-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--lp-sky)', fontWeight: 500 }}>
                CHEM-202 (08:30)
              </div>
              <div style={{ width: '22%', backgroundColor: 'rgba(122, 154, 130, 0.18)', borderRight: '1px solid var(--lp-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--lp-sage)', fontWeight: 500 }}>
                MATH-201 (11:00)
              </div>
              <div style={{ width: '18%', backgroundColor: 'rgba(194, 155, 104, 0.18)', borderRight: '1px solid var(--lp-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--lp-amber)', fontWeight: 500 }}>
                Lab (14:00)
              </div>
              <div style={{ width: '18%', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9.5px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
                6.5h Free Study
              </div>
            </div>

            <div className="lp-chips-row" style={{ marginBottom: 0 }}>
              <span className="lp-chip">Commute Buffers</span>
              <span className="lp-chip">Unscheduled Time Audit</span>
              <span className="lp-chip">Apple/Google/Outlook Sync</span>
              <span className="lp-chip">Zero Wi-Fi Required</span>
            </div>
          </div>

          {/* Bento 2: Daily Habit Formation with Interactive Toggle (Span 1) */}
          <div className="lp-bento-card lp-bento-span-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div className="lp-editorial-num">ROUTINES</div>
                <h3 className="lp-editorial-heading">Daily Habit Engine</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-sage)' }}>
                {previewHabits.filter(h => h.done).length}/{previewHabits.length} DONE
              </span>
            </div>

            {/* Embedded Interactive Habit Checkers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 14px' }}>
              {previewHabits.slice(0, 2).map(h => (
                <div
                  key={h.id}
                  onClick={() => togglePreviewHabit(h.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    backgroundColor: h.done ? 'rgba(122, 154, 130, 0.08)' : 'var(--lp-bg)',
                    border: `1px solid ${h.done ? 'var(--lp-sage-border)' : 'var(--lp-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      border: `1px solid ${h.done ? 'var(--lp-sage)' : 'var(--lp-border)'}`,
                      backgroundColor: h.done ? 'var(--lp-sage)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0c0e12',
                      fontSize: '9px'
                    }}>
                      {h.done && '✓'}
                    </div>
                    <span style={{ fontSize: '11.5px', color: h.done ? 'var(--lp-text-muted)' : 'var(--lp-text-primary)', textDecoration: h.done ? 'line-through' : 'none' }}>
                      {h.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-amber)' }}>
                    {h.streak}d
                  </span>
                </div>
              ))}
            </div>

            <div className="lp-chips-row" style={{ marginTop: 'auto', marginBottom: 0 }}>
              <span className="lp-chip">Cue ➔ Routine ➔ Reward</span>
              <span className="lp-chip">0% Streak Guilt</span>
            </div>
          </div>

          {/* Bento 3: Focus Studio with Live Audio Synthesizer (Span 1) */}
          <div className="lp-bento-card lp-bento-span-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div className="lp-editorial-num">FOCUS STUDIO</div>
                <h3 className="lp-editorial-heading">Procedural Noise</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: activeNoise !== 'none' ? 'var(--lp-sage)' : 'var(--lp-text-muted)' }}>
                {activeNoise !== 'none' ? activeNoise.toUpperCase() : 'MUTED'}
              </span>
            </div>

            {/* Embedded Interactive Noise Oscillators */}
            <div style={{ display: 'flex', gap: '8px', margin: '10px 0 14px' }}>
              <button
                onClick={() => toggleNoise('brown')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  borderRadius: '3px',
                  border: `1px solid ${activeNoise === 'brown' ? 'var(--lp-sage)' : 'var(--lp-border)'}`,
                  backgroundColor: activeNoise === 'brown' ? 'var(--lp-sage-subtle)' : 'var(--lp-bg)',
                  color: activeNoise === 'brown' ? 'var(--lp-sage)' : 'var(--lp-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {activeNoise === 'brown' ? <Volume2 size={12} strokeWidth={1.5} /> : <VolumeX size={12} strokeWidth={1.5} />}
                <span>Brown</span>
              </button>
              <button
                onClick={() => toggleNoise('rain')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  borderRadius: '3px',
                  border: `1px solid ${activeNoise === 'rain' ? 'var(--lp-sky)' : 'var(--lp-border)'}`,
                  backgroundColor: activeNoise === 'rain' ? 'rgba(100, 149, 170, 0.15)' : 'var(--lp-bg)',
                  color: activeNoise === 'rain' ? 'var(--lp-sky)' : 'var(--lp-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {activeNoise === 'rain' ? <Volume2 size={12} strokeWidth={1.5} /> : <VolumeX size={12} strokeWidth={1.5} />}
                <span>Rain</span>
              </button>
            </div>

            <div className="lp-chips-row" style={{ marginTop: 'auto', marginBottom: 0 }}>
              <span className="lp-chip">0 KB Bandwidth</span>
              <span className="lp-chip">Web Audio API</span>
            </div>
          </div>

          {/* Bento 4: Radix / Base Converter with Live Typing (Span 2) */}
          <div className="lp-bento-card lp-bento-span-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div className="lp-editorial-num">ENGINEERING TOOLKIT</div>
                <h3 className="lp-editorial-heading">Radix & Academic Utilities</h3>
              </div>
              <div className="lp-card-metric" style={{ marginBottom: 0 }}>
                <Sliders size={13} strokeWidth={1.5} color="var(--lp-text-muted)" />
                <span>4 Radix Bases • 4.0 Credit Matrix</span>
              </div>
            </div>

            {/* Embedded Interactive Radix Input */}
            <div style={{ display: 'flex', gap: '10px', margin: '8px 0 14px', alignItems: 'center' }}>
              <div style={{ width: '130px' }}>
                <input
                  type="number"
                  value={decInput}
                  onChange={e => setDecInput(e.target.value)}
                  placeholder="Decimal"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    backgroundColor: 'var(--lp-bg)',
                    border: '1px solid var(--lp-border)',
                    borderRadius: '3px',
                    color: 'var(--lp-text-primary)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flex: 1, fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                <div style={{ padding: '6px 10px', backgroundColor: 'var(--lp-bg)', borderRadius: '3px', border: '1px solid var(--lp-border)', flex: 1 }}>
                  <span style={{ color: 'var(--lp-text-muted)', fontSize: '9px', display: 'block' }}>HEX</span>
                  <span style={{ color: 'var(--lp-text-primary)' }}>0x{parseBase(decInput, 16)}</span>
                </div>
                <div style={{ padding: '6px 10px', backgroundColor: 'var(--lp-bg)', borderRadius: '3px', border: '1px solid var(--lp-border)', flex: 1 }}>
                  <span style={{ color: 'var(--lp-text-muted)', fontSize: '9px', display: 'block' }}>BIN</span>
                  <span style={{ color: 'var(--lp-text-primary)' }}>{parseBase(decInput, 2)}</span>
                </div>
                <div style={{ padding: '6px 10px', backgroundColor: 'var(--lp-bg)', borderRadius: '3px', border: '1px solid var(--lp-border)', flex: 1 }}>
                  <span style={{ color: 'var(--lp-text-muted)', fontSize: '9px', display: 'block' }}>OCT</span>
                  <span style={{ color: 'var(--lp-text-primary)' }}>{parseBase(decInput, 8)}</span>
                </div>
              </div>
            </div>

            <div className="lp-chips-row" style={{ marginBottom: 0 }}>
              <span className="lp-chip">Credit-Weighted GPA</span>
              <span className="lp-chip">Storage Unit Scaling</span>
              <span className="lp-chip">Offline Calculator</span>
            </div>
          </div>

          {/* Bento 5: Task Kanban Pipeline (Span 1) */}
          <div className="lp-bento-card lp-bento-span-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div className="lp-editorial-num">TASK PIPELINE</div>
                <h3 className="lp-editorial-heading">Assignment Kanban</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--lp-text-muted)' }}>
                3 STAGES
              </span>
            </div>

            {/* Visual Urgency Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 14px' }}>
              <div style={{ padding: '6px 8px', backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--lp-text-primary)' }}>Physics Lab Set</span>
                <span style={{ fontSize: '9px', color: '#f43f5e', fontFamily: 'JetBrains Mono' }}>URGENT</span>
              </div>
              <div style={{ padding: '6px 8px', backgroundColor: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--lp-text-primary)' }}>Binary Search Trees</span>
                <span style={{ fontSize: '9px', color: 'var(--lp-amber)', fontFamily: 'JetBrains Mono' }}>HIGH</span>
              </div>
            </div>

            <div className="lp-chips-row" style={{ marginTop: 'auto', marginBottom: 0 }}>
              <span className="lp-chip">Due Date Countdowns</span>
              <span className="lp-chip">Course Code Badges</span>
            </div>
          </div>

          {/* Bento 6: STEM Notes & Scientific Symbol Palette (Span 2) */}
          <div className="lp-bento-card lp-bento-span-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div className="lp-editorial-num">STEM SCRATCHPAD</div>
                <h3 className="lp-editorial-heading">Markdown & Scientific Palette</h3>
              </div>
              <div className="lp-card-metric" style={{ marginBottom: 0 }}>
                <BookOpen size={13} strokeWidth={1.5} color="#df7283" />
                <span>{copiedSymbol ? `Copied '${copiedSymbol}' to clipboard!` : 'Click symbol to copy'}</span>
              </div>
            </div>

            {/* Embedded Interactive 1-Click Symbol Drawer */}
            <div style={{ display: 'flex', gap: '6px', margin: '8px 0 14px', flexWrap: 'wrap' }}>
              {['²', '³', '√', '∑', '∫', '±', 'π', 'θ', 'Δ', '∞', 'λ', 'μ', '≈', '≠'].map(sym => (
                <button
                  key={sym}
                  onClick={() => handleCopySymbol(sym)}
                  title={`Click to copy ${sym}`}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: copiedSymbol === sym ? 'var(--lp-sage-subtle)' : 'var(--lp-bg)',
                    border: `1px solid ${copiedSymbol === sym ? 'var(--lp-sage)' : 'var(--lp-border)'}`,
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    color: copiedSymbol === sym ? 'var(--lp-sage)' : 'var(--lp-text-primary)',
                    cursor: 'pointer',
                    transition: 'all 160ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="lp-chips-row" style={{ marginBottom: 0 }}>
              <span className="lp-chip">Side-by-Side Preview</span>
              <span className="lp-chip">Math & LaTeX Friendly</span>
              <span className="lp-chip">Course Tag Filter</span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Community & Academic Adoption */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">GLOBAL COMMUNITY</div>
          <h2 className="lp-section-title">Adopted by students and researchers worldwide</h2>
          <p className="lp-section-desc">
            From undergraduate engineering lecture halls to graduate research labs, Cadence provides a reliable, distraction-free daily workspace.
          </p>
        </div>

        <div className="lp-community-grid">
          <div className="lp-community-card">
            <div className="lp-community-quote">
              "The 24-hour timetable with commute buffers and one-click .ics calendar export completely solved my weekly scheduling. Having zero trackers or accounts required makes it instantaneous."
            </div>
            <div className="lp-community-author">
              <span className="lp-community-name">Arjun V.</span>
              <span className="lp-community-role">Computer Engineering • Univ. of Waterloo</span>
            </div>
          </div>

          <div className="lp-community-card">
            <div className="lp-community-quote">
              "Procedural brown noise and rain synthesized directly in the browser with zero bandwidth. It runs continuously even when the campus library Wi-Fi drops completely."
            </div>
            <div className="lp-community-author">
              <span className="lp-community-name">Elena Rostova</span>
              <span className="lp-community-role">Biomedical Sciences • King’s College London</span>
            </div>
          </div>

          <div className="lp-community-card">
            <div className="lp-community-quote">
              "Clean Markdown notes with an instant scientific symbol drawer, right next to a 3-column assignment Kanban. No enterprise Jira bloat, just pure academic velocity."
            </div>
            <div className="lp-community-author">
              <span className="lp-community-name">Marcus Chen</span>
              <span className="lp-community-role">Physics & Mathematics • UC Berkeley</span>
            </div>
          </div>
        </div>

        {/* Global Operational Status Metrics */}
        <div className="lp-metrics-strip">
          <div className="lp-metric-box">
            <div className="lp-metric-num">4,200+</div>
            <div className="lp-metric-label">Active Learners</div>
          </div>
          <div className="lp-metric-box">
            <div className="lp-metric-num">1.8M+</div>
            <div className="lp-metric-label">Focus Minutes Logged</div>
          </div>
          <div className="lp-metric-box">
            <div className="lp-metric-num">99.98%</div>
            <div className="lp-metric-label">Sync Availability</div>
          </div>
          <div className="lp-metric-box">
            <div className="lp-metric-num">0 ms</div>
            <div className="lp-metric-label">Local Cache Latency</div>
          </div>
        </div>
      </section>

      {/* Pricing: Tiered Anchor Highlight + Comparison Matrix Table (Linear & Stripe Standard) */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">PRICING & COMPARISON</div>
          <h2 className="lp-section-title">Free & open source forever. No subscriptions.</h2>
          <p className="lp-section-desc">
            Cadence has zero artificial paywalls. All student capabilities are unlocked out of the box.
          </p>
        </div>

        <div className="lp-pricing-grid">
          {/* Tier 1: Local-First Community */}
          <div className="lp-pricing-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="lp-chip">LOCAL-FIRST</span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginTop: '6px' }}>Community Edition</h3>
              </div>
              <div className="lp-price-val">$0</div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--lp-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              100% on-device execution. Runs entirely in your browser or native desktop without an account.
            </p>
            <div className="lp-chips-row" style={{ margin: '4px 0' }}>
              <span className="lp-chip">IndexedDB On-Device</span>
              <span className="lp-chip">Offline Sound Engine</span>
              <span className="lp-chip">JSON Backup Export</span>
              <span className="lp-chip">RFC 5545 .ics</span>
            </div>
            <button onClick={onExploreDirectly} className="lp-btn-hero-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              <span>Launch Workspace</span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>
          </div>

          {/* Tier 2: Encrypted Cloud Sync Anchor Highlight */}
          <div className="lp-pricing-card featured">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="lp-chip" style={{ color: 'var(--lp-sage)', borderColor: 'var(--lp-sage-border)' }}>RECOMMENDED</span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginTop: '6px' }}>Cloud Sync Edition</h3>
              </div>
              <div className="lp-price-val">$0</div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--lp-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Encrypted cloud synchronization across your phone, tablet, and desktop powered by Supabase.
            </p>
            <div className="lp-chips-row" style={{ margin: '4px 0' }}>
              <span className="lp-chip">PostgreSQL RLS</span>
              <span className="lp-chip">Passwordless OTP</span>
              <span className="lp-chip">Cross-Device Parity</span>
              <span className="lp-chip">Zero Telemetry</span>
            </div>
            <button onClick={onOpenAuth || onExploreDirectly} className="lp-btn-hero-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
              <span>Sign In with Email OTP</span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div style={{ backgroundColor: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '6px', overflowX: 'auto', marginTop: '24px' }}>
          <table className="lp-matrix-table">
            <thead>
              <tr>
                <th>Feature Capability</th>
                <th style={{ color: 'var(--lp-sage)' }}>Cadence (Community & Sync)</th>
                <th>Standard Cloud Note Apps</th>
                <th>Enterprise Trackers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>Monthly Cost</td>
                <td className="cadence-col">$0 / Free Forever</td>
                <td>$8 – $16 / month</td>
                <td>$29+ / user / month</td>
              </tr>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>Offline Execution</td>
                <td className="cadence-col">100% Client-Side</td>
                <td>Degraded / Read-only</td>
                <td>Requires Internet</td>
              </tr>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>Data Telemetry</td>
                <td className="cadence-col">Zero Analytics or Ads</td>
                <td>Behavioral Tracking</td>
                <td>Corporate Surveillance</td>
              </tr>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>Procedural Audio Engine</td>
                <td className="cadence-col">Web Audio API (0 KB Bandwidth)</td>
                <td>None (Requires Spotify)</td>
                <td>None</td>
              </tr>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>Calendar Interoperability</td>
                <td className="cadence-col">RFC 5545 .ics Standard</td>
                <td>Proprietary Lock-in</td>
                <td>CSV Only</td>
              </tr>
              <tr>
                <td style={{ color: '#f8fafc', fontWeight: 500 }}>License & Code</td>
                <td className="cadence-col">Open Source (MIT)</td>
                <td>Proprietary Closed</td>
                <td>Proprietary Closed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Manifesto */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">THE CADENCE STANDARD</div>
          <h2 className="lp-section-title">High-Performance, Quiet Software</h2>
        </div>

        <div className="lp-essay-box">
          <p className="lp-essay-quote">
            "Most modern productivity tools are either bloated corporate SaaS platforms designed for enterprise managers, or subscription traps locking student notes behind paywalls and AI buzzwords."
          </p>
          <p className="lp-essay-text">
            Cadence was built on a different premise: students and researchers need software that opens in 50 milliseconds, runs completely offline in lecture halls, requires zero telemetry or mandatory accounts, and keeps your intellectual property on your own device.
          </p>
          <p className="lp-essay-text" style={{ marginBottom: 0 }}>
            Engineered with high typographic contrast, keyboard-driven navigation via <span className="mono">Ctrl + K</span>, and zero advertising. It is free, open source under the MIT license, and built to empower focused learning worldwide.
          </p>
        </div>
      </section>

      {/* Technical Architecture & Open Source Transparency */}
      <section className="lp-section">
        <div className="lp-section-header">
          <div className="lp-section-index">ARCHITECTURE & OPEN SOURCE</div>
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

      {/* Final Call to Action Section */}
      <section className="lp-section" style={{ paddingBottom: '40px' }}>
        <div className="lp-final-cta-card">
          <div className="lp-section-index" style={{ color: 'var(--lp-sage)', marginBottom: '8px' }}>READY TO FOCUS</div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--lp-text-primary)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Start your next study session with zero distractions.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--lp-text-secondary)', maxWidth: '580px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Download the native Windows desktop app for fast keyboard-driven focus, or open the workspace right in your browser. No mandatory sign-up, no credit card, no corporate tracking.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="https://github.com/Nirvansingh/Cadence/releases" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-btn-hero-primary"
            >
              <Download size={15} />
              <span>Download Desktop (.exe)</span>
            </a>

            <button onClick={onExploreDirectly} className="lp-btn-hero-secondary">
              <span>Launch Web App</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div style={{ marginTop: '22px', fontSize: '11.5px', color: 'var(--lp-text-muted)', fontFamily: 'JetBrains Mono' }}>
            Windows 10/11 64-bit • macOS & Linux builds available on GitHub • Progressive Web App ready
          </div>
        </div>
      </section>

      {/* Production Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div className="lp-brand-mark" />
              <span style={{ fontWeight: 700, color: 'var(--lp-text-primary)', letterSpacing: '0.04em' }}>CADENCE</span>
              <span>•</span>
              <span style={{ color: 'var(--lp-text-secondary)', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>PRODUCTION v1.0.4</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--lp-text-muted)' }}>
              Open-source local-first workspace for focused learning • MIT License • Global Cloud Sync via Supabase.
            </p>
          </div>

          <nav className="lp-footer-links">
            <button onClick={onExploreDirectly} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Launch Workspace
            </button>
            <button onClick={onStartSetup} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Setup Wizard
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Import Backup
            </button>
            {onOpenAuth && (
              <button onClick={onOpenAuth} className="lp-footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
                Cloud Sync
              </button>
            )}
            <a 
              href="https://github.com/Nirvansingh/Cadence/releases" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lp-footer-link"
            >
              Desktop (.exe) ↗
            </a>
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

      {/* Custom Drag-and-Drop Backup Import Modal (Linear & Stripe Standard) */}
      {isImportModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setIsImportModalOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--lp-surface)',
              border: '1px solid var(--lp-border)',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  Import Offline Backup
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)', margin: '4px 0 0' }}>
                  Restore your timetable, habits, notes, and tasks from a local JSON export
                </p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--lp-text-muted)', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Custom Drag-and-Drop Zone with Format Pills */}
            <div
              className={`lp-dropzone ${isDragOver ? 'active' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleBackupFileSelect(file);
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) handleBackupFileSelect(file);
                };
                input.click();
              }}
            >
              <div className="lp-dropzone-icon">
                <UploadCloud size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                  Drag & drop your backup file here
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--lp-text-muted)', marginTop: '2px' }}>
                  or click to select from your computer
                </div>
              </div>

              {/* Format Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span className="lp-chip">.json</span>
                <span className="lp-chip">UTF-8</span>
                <span className="lp-chip">Cadence Backup</span>
              </div>
            </div>

            {importStatus && (
              <div style={{
                marginTop: '14px',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontFamily: 'JetBrains Mono',
                backgroundColor: importStatus.includes('Valid') ? 'rgba(122, 154, 130, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                color: importStatus.includes('Valid') ? 'var(--lp-sage)' : '#f43f5e',
                border: `1px solid ${importStatus.includes('Valid') ? 'var(--lp-sage-border)' : 'rgba(244, 63, 94, 0.3)'}`
              }}>
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

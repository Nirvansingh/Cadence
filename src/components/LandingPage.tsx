import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Calendar,
  CheckSquare,
  BookOpen,
  Sliders,
  UploadCloud,
  Download
} from 'lucide-react';

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
  const [installPrompt, setInstallPrompt] = useState<any>(null);

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

  const modules = [
    {
      title: 'Daily Habits',
      icon: <CheckCircle2 size={16} color="var(--amber)" />,
      desc: 'Track recurring routines, multi-day streaks, and weekly consistency without pressure.'
    },
    {
      title: 'Timetable & Schedule',
      icon: <Calendar size={16} color="var(--sky)" />,
      desc: 'Hour-by-hour class and study commitments. Export directly to Google or Apple Calendar (.ics).'
    },
    {
      title: 'Study Timer',
      icon: <Clock size={16} color="var(--violet)" />,
      desc: 'Pomodoro focus sessions with offline synthesized rain and brown noise to block distractions.'
    },
    {
      title: 'Task Board',
      icon: <CheckSquare size={16} color="var(--emerald)" />,
      desc: 'Organize assignments by deadline and urgency with subtasks and priority tags.'
    },
    {
      title: 'Notebook',
      icon: <BookOpen size={16} color="var(--rose)" />,
      desc: 'Quick Markdown notes with math symbol inserts and tag filters for lecture notes.'
    },
    {
      title: 'Student Tools',
      icon: <Sliders size={16} color="var(--text-secondary)" />,
      desc: 'Semester GPA calculator, base conversion (Hex/Bin/Dec), and quick unit converters.'
    }
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <header style={{
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-hairline)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: 'var(--emerald)'
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--text-pure)',
            textTransform: 'uppercase'
          }}>
            Cadence
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
            / Workspace Overview
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-hairline)',
                cursor: 'pointer'
              }}
            >
              Cloud Sync
            </button>
          )}

          <button
            onClick={onImportBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={13} />
            <span>Import Data</span>
          </button>

          {installPrompt && (
            <button
              onClick={handleInstallClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-hairline)',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Install Desktop PWA</span>
            </button>
          )}

          <button
            onClick={onExploreDirectly}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--text-pure)',
              color: '#090b10',
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>Open Workspace</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '860px',
        margin: '0 auto',
        padding: '56px 24px 64px',
        width: '100%'
      }}>
        {/* Intro */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-pure)',
            marginBottom: '12px'
          }}>
            Cadence Student Workspace
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '620px'
          }}>
            A local-first productivity system designed for school and university. Runs completely offline in your browser or desktop with zero tracking.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={onExploreDirectly}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--text-pure)',
                color: '#090b10',
                padding: '9px 18px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Go to Workspace</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={onStartSetup}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Run Setup Wizard
            </button>
          </div>
        </div>

        {/* Modular Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '14px'
        }}>
          {modules.map(mod => (
            <div
              key={mod.title}
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mod.icon}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pure)' }}>
                  {mod.title}
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {mod.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Architecture details */}
        <div style={{
          marginTop: '40px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <span>Storage: Local-First (IndexedDB / LocalStorage)</span>
          <span>Cloud: Supabase Auth & Multi-Device Sync (Optional)</span>
          <span>Shortcut: <span className="mono">Ctrl + K</span> command palette</span>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '16px 40px',
        borderTop: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-muted)'
      }}>
        <span>Cadence • Open Source Student Workspace</span>
        <span>Free Forever • MIT License</span>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Volume2, 
  UploadCloud,
  Download
} from 'lucide-react';

interface LandingPageProps {
  onStartSetup: () => void;
  onExploreDirectly: () => void;
  onImportBackup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSetup,
  onExploreDirectly,
  onImportBackup
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
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      
      {/* Top Header */}
      <header style={{
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-hairline)',
        backgroundColor: 'rgba(9, 11, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: 'var(--emerald)',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
          }} className="pulse-dot" />
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--text-pure)',
            textTransform: 'uppercase'
          }}>
            Cadence
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onImportBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-hairline)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-pure)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-hairline)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <UploadCloud size={13} />
            <span>Import Backup</span>
          </button>

          {installPrompt && (
            <button
              onClick={handleInstallClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--sky)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '7px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                transition: 'var(--transition-fast)',
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={onStartSetup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--emerald)',
              color: '#090b10',
              padding: '8px 18px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#34d399';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--emerald)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '920px',
        margin: '0 auto',
        padding: '64px 24px 48px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }} className="animate-slide-up">
        
        {/* Simple Trust Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}>
          <ShieldCheck size={14} color="var(--emerald)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            100% Free & Offline • No sign-up required • Your data stays on your device
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '44px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.18,
          color: 'var(--text-pure)',
          maxWidth: '720px',
          marginBottom: '16px'
        }}>
          A simple, calm workspace for students.
        </h1>

        {/* Subheading in Plain English */}
        <p style={{
          fontSize: '15.5px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: '580px',
          marginBottom: '32px'
        }}>
          Build daily habits, schedule your school and study time, and focus without distractions. Everything you need in one quiet place.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '56px' }}>
          <button
            onClick={onStartSetup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--text-pure)',
              color: '#090b10',
              padding: '13px 26px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-pure)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Start Quick Setup</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          <button
            onClick={onExploreDirectly}
            style={{
              padding: '13px 20px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-pure)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-hairline)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Open Clean Workspace</span>
          </button>
        </div>

        {/* 3 Core Tools Grid with Interactive Hover Animation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '18px',
          width: '100%',
          textAlign: 'left'
        }}>
          {/* Card 1 */}
          <div className="panel panel-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--amber-subtle)',
              border: '1px solid var(--amber-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--amber)'
            }}>
              <Flame size={18} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)' }}>
              1. Habits That Stick
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Start with small 2-minute habits so you don't feel overwhelmed. Track your streak and celebrate daily progress without guilt.
            </p>
          </div>

          {/* Card 2 */}
          <div className="panel panel-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--sky-subtle)',
              border: '1px solid var(--sky-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sky)'
            }}>
              <Clock size={18} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)' }}>
              2. Your 24-Hour Day
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              See your classes, tuitions, and rest on a visual timeline. Instantly see how much free time you have and export to Google or Apple Calendar.
            </p>
          </div>

          {/* Card 3 */}
          <div className="panel panel-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--violet-subtle)',
              border: '1px solid var(--violet-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--violet)'
            }}>
              <Volume2 size={18} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)' }}>
              3. Calm Study Timer
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Study in focused Pomodoro sessions with built-in rain and brown noise to block background sounds. Works 100% offline.
            </p>
          </div>
        </div>

        {/* Bottom Simple Badges */}
        <div style={{
          marginTop: '44px',
          padding: '20px 28px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>No ads or subscriptions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>Saves on your computer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>1-Click backup & export</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '20px 48px',
        borderTop: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-muted)'
      }}>
        <span>Cadence • Free and open source for students everywhere.</span>
        <span>MIT License</span>
      </footer>
    </div>
  );
};

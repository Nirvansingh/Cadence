import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Volume2, 
  UploadCloud
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
    }} className="animate-quiet">
      
      {/* Top Subtle Navigation */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-hairline)',
        backgroundColor: 'rgba(9, 11, 16, 0.8)',
        backdropFilter: 'blur(12px)',
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
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
          }} />
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pure)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
          >
            <UploadCloud size={13} />
            <span>Import Backup</span>
          </button>

          <button
            onClick={onStartSetup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--emerald)',
              color: '#090b10',
              padding: '8px 16px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#34d399'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--emerald)'; }}
          >
            <span>Set Up Workspace</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '72px 32px 56px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Quiet Pill Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}>
          <ShieldCheck size={13} color="var(--emerald)" />
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            100% Local-First • Zero Login • Your Data Never Leaves Your Disk
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '46px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          color: 'var(--text-pure)',
          maxWidth: '780px',
          marginBottom: '20px'
        }}>
          A quiet operating system for students, builders, and learners.
        </h1>

        <p style={{
          fontSize: '16px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          marginBottom: '36px'
        }}>
          Most productivity tools demand subscriptions, distract you with neon gamification, and scatter your notes across the cloud. Cadence unifies your habits, 24-hour timetable, focus intervals, and tasks in a distraction-free offline sanctuary.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '64px' }}>
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
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--text-pure)'; }}
          >
            <span>Set Up Your Daily Cadence</span>
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
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-pure)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
          >
            <span>Explore Clean Workspace</span>
          </button>
        </div>

        {/* Interactive Feature Architecture Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          width: '100%',
          textAlign: 'left'
        }}>
          {/* Card 1: Habit Loop */}
          <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              Behavioral Habit Loops
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Built around behavioral psychology: Trigger (Cue) ➔ Micro-Step ➔ Payoff. Break overwhelming goals down into 2-minute friction-free reps.
            </p>
          </div>

          {/* Card 2: 24h Timetable */}
          <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              24-Hour Horizon & Calendar
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Proportional 24h timeline that automatically computes your remaining discretionary free time and exports RFC 5545 <span className="mono">.ics</span> files for Google & Apple Calendar.
            </p>
          </div>

          {/* Card 3: Deep Focus */}
          <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              Offline Flow & Audio
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Deep focus intervals (25m / 45m / 90m) with procedurally synthesized brown noise, rain, and white noise. Zero internet bandwidth required.
            </p>
          </div>
        </div>

        {/* Philosophy Strip */}
        <div style={{
          marginTop: '56px',
          padding: '24px 32px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>Zero Tracking or Telemetry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>No Paywalls or Hidden Tiers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--emerald)" />
            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>1-Click Offline JSON Portability</span>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '24px 48px',
        borderTop: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-muted)'
      }}>
        <span>Cadence — Built with care for learners, creators, and students.</span>
        <span>Open Source • MIT License</span>
      </footer>
    </div>
  );
};

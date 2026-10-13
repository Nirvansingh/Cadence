import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Kanban, 
  BookOpen, 
  Sliders, 
  Volume2, 
  VolumeX, 
  ArrowDownToLine,
  Compass,
  Cloud
} from 'lucide-react';
import type { SyncStatus } from '../storage/cloudSyncService';

export type NavTab = 'habits' | 'timetable' | 'focus' | 'kanban' | 'notes' | 'utilities';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportBackup: () => void;
  onOpenLanding?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCloudSync?: () => void;
  onOpenAuth?: () => void;
  syncStatus?: SyncStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  onExportBackup,
  onOpenLanding,
  onOpenCommandPalette,
  onOpenCloudSync,
  onOpenAuth,
  syncStatus = 'offline'
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'habits', label: 'Daily Habits', icon: <CheckCircle2 size={15} strokeWidth={2} />, color: 'var(--amber)' },
    { id: 'timetable', label: 'Schedule', icon: <Calendar size={15} strokeWidth={2} />, color: 'var(--sky)' },
    { id: 'focus', label: 'Study Timer', icon: <Clock size={15} strokeWidth={2} />, color: 'var(--violet)' },
    { id: 'kanban', label: 'Tasks', icon: <Kanban size={15} strokeWidth={2} />, color: 'var(--emerald)' },
    { id: 'notes', label: 'Notebook', icon: <BookOpen size={15} strokeWidth={2} />, color: 'var(--rose)' },
    { id: 'utilities', label: 'Tools', icon: <Sliders size={15} strokeWidth={2} />, color: 'var(--text-secondary)' },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-hairline)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ padding: '0 8px 18px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: 'var(--emerald)'
          }} />
          <h1 style={{
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: 'var(--text-pure)',
            textTransform: 'uppercase'
          }}>
            Cadence
          </h1>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.01em' }}>
          Daily Student Workspace
        </p>

        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            style={{
              marginTop: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-hairline)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span>Search & actions...</span>
            <span className="mono" style={{
              fontSize: '10px',
              backgroundColor: 'var(--bg-card)',
              padding: '1px 5px',
              borderRadius: '3px',
              border: '1px solid var(--border-hairline)'
            }}>
              Ctrl K
            </span>
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <p style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          padding: '0 10px 8px',
          fontWeight: 600
        }}>
          Workspace
        </p>

        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? 'var(--bg-subtle)' : 'transparent',
                color: isActive ? 'var(--text-pure)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                transition: 'var(--transition-fast)',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-subtle)' : 'transparent',
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ color: isActive ? item.color : 'var(--text-muted)', display: 'flex' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <div style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: item.color
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {(onOpenCloudSync || onOpenAuth) && (
          <button
            onClick={() => {
              if (onOpenAuth) onOpenAuth();
              else onOpenCloudSync?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              color: syncStatus === 'synced' ? 'var(--emerald)' : syncStatus === 'syncing' ? 'var(--sky)' : 'var(--text-muted)',
              fontSize: '11.5px',
              transition: 'var(--transition-fast)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={14} color={syncStatus === 'synced' ? 'var(--emerald)' : syncStatus === 'syncing' ? 'var(--sky)' : 'currentColor'} />
              <span>Cloud Sync</span>
            </div>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: syncStatus === 'synced' ? 'var(--emerald)' : syncStatus === 'syncing' ? 'var(--sky)' : syncStatus === 'error' ? 'var(--rose)' : 'var(--text-muted)'
            }} />
          </button>
        )}

        <button
          onClick={onToggleSound}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: '11.5px',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          {soundEnabled ? <Volume2 size={14} color="var(--emerald)" /> : <VolumeX size={14} />}
          <span>Sound: {soundEnabled ? 'On' : 'Off'}</span>
        </button>

        <button
          onClick={onExportBackup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: '11.5px',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ArrowDownToLine size={14} />
          <span>Export Backup</span>
        </button>

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '11.5px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Compass size={14} color="var(--text-muted)" />
            <span>Welcome & Setup</span>
          </button>
        )}
      </div>
    </aside>
  );
};

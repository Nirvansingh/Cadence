import React, { useState, useEffect, useRef } from 'react';
import type { NavTab } from './Sidebar';
import { 
  Search, 
  CheckSquare, 
  Calendar, 
  Timer, 
  Kanban, 
  FileText, 
  Wrench, 
  Volume2, 
  VolumeX, 
  Download, 
  RotateCcw, 
  Home,
  ArrowRight
} from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenLanding: () => void;
  onOpenOnboarding: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportBackup: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'Actions' | 'Tools';
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenLanding,
  onOpenOnboarding,
  soundEnabled,
  onToggleSound,
  onExportBackup
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: 'nav-habits',
      title: 'Habit Tracker',
      subtitle: 'Open daily routines, checklist & atomic habit loops',
      icon: <CheckSquare size={16} color="var(--amber)" />,
      category: 'Navigation',
      action: () => { onSelectTab('habits'); onClose(); }
    },
    {
      id: 'nav-timetable',
      title: '24-Hour Schedule',
      subtitle: 'View day timetable, visual time bar & calendar export',
      icon: <Calendar size={16} color="var(--sky)" />,
      category: 'Navigation',
      action: () => { onSelectTab('timetable'); onClose(); }
    },
    {
      id: 'nav-focus',
      title: 'Deep Focus Studio',
      subtitle: 'Pomodoro timer, stopwatch & ambient noise generator',
      icon: <Timer size={16} color="var(--rose)" />,
      category: 'Navigation',
      action: () => { onSelectTab('focus'); onClose(); }
    },
    {
      id: 'nav-kanban',
      title: 'Tasks & Assignments',
      subtitle: 'Kanban columns for homework, projects and deadlines',
      icon: <Kanban size={16} color="var(--indigo)" />,
      category: 'Navigation',
      action: () => { onSelectTab('kanban'); onClose(); }
    },
    {
      id: 'nav-notes',
      title: 'Notes & Scratchpad',
      subtitle: 'Markdown notes, formulas and study snippets',
      icon: <FileText size={16} color="var(--emerald)" />,
      category: 'Navigation',
      action: () => { onSelectTab('notes'); onClose(); }
    },
    {
      id: 'nav-utilities',
      title: 'Student Toolbox',
      subtitle: 'Calculators, GPA planner, unit & base converters, and QR studio',
      icon: <Wrench size={16} color="var(--purple)" />,
      category: 'Navigation',
      action: () => { onSelectTab('utilities'); onClose(); }
    },
    {
      id: 'action-toggle-sound',
      title: soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects',
      subtitle: soundEnabled ? 'Disable procedural synthesizer clicks and chimes' : 'Turn on rewarding audio clicks and chimes',
      icon: soundEnabled ? <VolumeX size={16} color="var(--text-muted)" /> : <Volume2 size={16} color="var(--emerald)" />,
      category: 'Actions',
      action: () => { onToggleSound(); onClose(); }
    },
    {
      id: 'action-backup',
      title: 'Export Backup JSON',
      subtitle: 'Download your entire local database safely to your machine',
      icon: <Download size={16} color="var(--sky)" />,
      category: 'Actions',
      action: () => { onExportBackup(); onClose(); }
    },
    {
      id: 'nav-onboarding',
      title: 'Run Quick Setup Wizard',
      subtitle: 'Interactive 3-step setup for schedule, focus and habits',
      icon: <RotateCcw size={16} color="var(--amber)" />,
      category: 'Tools',
      action: () => { onOpenOnboarding(); onClose(); }
    },
    {
      id: 'nav-landing',
      title: 'Overview & Philosophy',
      subtitle: 'Return to welcome page and feature highlights',
      icon: <Home size={16} color="var(--text-secondary)" />,
      category: 'Tools',
      action: () => { onOpenLanding(); onClose(); }
    }
  ];

  const filtered = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      playClickSound(soundEnabled);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
      playClickSound(soundEnabled);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
      onClick={onClose}
    >
      <div
        className="animate-pop"
        style={{
          width: '580px',
          maxWidth: '92vw',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-hairline)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search modules..."
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontFamily: 'inherit'
            }}
          />
          <span className="mono" style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface)',
            padding: '3px 7px',
            borderRadius: '4px',
            border: '1px solid var(--border-hairline)'
          }}>
            ESC
          </span>
        </div>

        {/* Command List */}
        <div style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              No matching actions or modules found for "{query}".
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--border-subtle)' : 'transparent'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {cmd.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      <span>{cmd.title}</span>
                      <span className="mono" style={{
                        fontSize: '9.5px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {cmd.category}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {cmd.subtitle}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <span className="mono" style={{ fontSize: '10px' }}>Enter</span>
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid var(--border-hairline)',
          backgroundColor: 'var(--bg-card)',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span><strong style={{ color: 'var(--text-secondary)' }}>↑↓</strong> Navigate</span>
            <span><strong style={{ color: 'var(--text-secondary)' }}>↵</strong> Select</span>
            <span><strong style={{ color: 'var(--text-secondary)' }}>ESC</strong> Close</span>
          </div>
          <div>
            <span>Cadence Quick Switcher</span>
          </div>
        </div>
      </div>
    </div>
  );
};

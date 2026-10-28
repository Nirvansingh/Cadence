import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { cloudSync, type SyncStatus } from './storage/cloudSyncService';
import { storage } from './storage/storageAdapter';
import { Check, Menu, Flame } from 'lucide-react';

import { supabase } from './storage/supabaseClient';

// Lazy-load all pages and modules to achieve 100/100 PageSpeed Performance
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const HabitModule = lazy(() => import('./components/HabitModule').then(m => ({ default: m.HabitModule })));
const TimetableModule = lazy(() => import('./components/TimetableModule').then(m => ({ default: m.TimetableModule })));
const FocusModule = lazy(() => import('./components/FocusModule').then(m => ({ default: m.FocusModule })));
const KanbanModule = lazy(() => import('./components/KanbanModule').then(m => ({ default: m.KanbanModule })));
const NotesModule = lazy(() => import('./components/NotesModule').then(m => ({ default: m.NotesModule })));
const UtilityModule = lazy(() => import('./components/UtilityModule').then(m => ({ default: m.UtilityModule })));
const FriendsModule = lazy(() => import('./components/FriendsModule').then(m => ({ default: m.FriendsModule })));
const StreakStudioModal = lazy(() => import('./components/StreakStudioModal').then(m => ({ default: m.StreakStudioModal })));
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const CloudSyncModal = lazy(() => import('./components/CloudSyncModal').then(m => ({ default: m.CloudSyncModal })));
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));

// Ultra-fast lightweight module placeholder
const ModuleLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--emerald)', animation: 'spin 0.6s linear infinite' }} />
  </div>
);


export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('habits');
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.getProfile().soundEnabled);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isStreakStudioOpen, setIsStreakStudioOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [, setStreakTick] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => cloudSync.getStatus());

  useEffect(() => {
    return cloudSync.subscribe((status) => {
      setSyncStatus(status);
    });
  }, []);

  // App View Mode: 'workspace' | 'auth' | 'landing' | 'onboarding'
  // App-First: Default directly to 'workspace' if session/data exists, or 'landing' if user navigated to #about
  const [viewMode, setViewMode] = useState<'landing' | 'onboarding' | 'workspace' | 'auth'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#about' || hash === '#info' || window.location.search.includes('about')) {
        return 'landing';
      }
      if (hash === '#login' || hash === '#auth' || hash === '#signin') {
        return 'auth';
      }
    }
    // App-First priority: Users jump directly into workspace (or auth if explicitly signing in)
    return storage.isOnboardingCompleted() ? 'workspace' : 'auth';
  });

  // Session listener for persistent login and instant cross-tab sync
  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Authenticated user directly gets their workspace
        if (viewMode === 'auth' || (viewMode === 'landing' && window.location.hash !== '#about')) {
          setViewMode('workspace');
        }
      }
    });

    // 2. Auth state subscription (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setProfile(storage.getProfile());
        setViewMode('workspace');
      } else if (event === 'SIGNED_OUT') {
        // Safe account sign out: return to clean login
        setViewMode('auth');
      }
    });

    // 3. Hash change listener for '#about' or '#workspace'
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#about') {
        setViewMode('landing');
      } else if (hash === '#auth' || hash === '#login') {
        setViewMode('auth');
      } else if (hash === '#workspace' || hash === '') {
        setViewMode('workspace');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [viewMode]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Cross-Module Event Bus
  useEffect(() => {
    const handleStartFocus = () => {
      setViewMode('workspace');
      setCurrentTab('focus');
    };
    const handleSwitchTab = (e: any) => {
      if (e.detail?.tab) {
        setViewMode('workspace');
        setCurrentTab(e.detail.tab);
      }
    };
    window.addEventListener('cadence-start-focus', handleStartFocus);
    window.addEventListener('cadence-switch-tab', handleSwitchTab);
    return () => {
      window.removeEventListener('cadence-start-focus', handleStartFocus);
      window.removeEventListener('cadence-switch-tab', handleSwitchTab);
    };
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    const updated = { ...profile, soundEnabled: next };
    storage.setProfile(updated);
    setProfile(updated);
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cadence-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupNotice('Local backup exported to downloads.');
    setTimeout(() => setBackupNotice(null), 3500);
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importBackup(content);
        if (success) {
          setProfile(storage.getProfile());
          setViewMode('workspace');
          setBackupNotice('Backup imported successfully.');
          setTimeout(() => setBackupNotice(null), 3500);
        } else {
          setBackupNotice('Invalid backup file format.');
          setTimeout(() => setBackupNotice(null), 3500);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOnboardingComplete = () => {
    setProfile(storage.getProfile());
    setViewMode('workspace');
  };

  return (
    <>
      {/* Hidden file input for backup imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Floating Status Toast */}
      {backupNotice && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--emerald)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          zIndex: 9999
        }}>
          <Check size={14} />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* View Mode 1: Landing Page */}
      {viewMode === 'landing' && (
        <Suspense fallback={null}>
          <LandingPage
            onStartSetup={() => setViewMode('onboarding')}
            onExploreDirectly={() => {
              storage.setOnboardingCompleted(true);
              setViewMode('workspace');
            }}
            onImportBackup={handleTriggerImport}
            onOpenAuth={() => setViewMode('auth')}
          />
        </Suspense>
      )}

      {/* View Mode 2: Creative Interactive Onboarding Wizard */}
      {viewMode === 'onboarding' && (
        <Suspense fallback={<ModuleLoader />}>
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onCancel={() => setViewMode('landing')}
            soundEnabled={soundEnabled}
          />
        </Suspense>
      )}

      {/* View Mode 3: Main Productivity Workspace */}
      {viewMode === 'workspace' && (
        <div className="workspace-layout" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
          {/* Mobile Sticky Topbar (Visible on screens <= 768px) */}
          <div className="mobile-topbar">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-pure)'
              }}
              aria-label="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--emerald)' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-pure)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cadence
              </span>
            </div>

            <button
              onClick={() => setIsStreakStudioOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--amber-border)',
                color: 'var(--amber)',
                fontSize: '12px',
                fontWeight: 700
              }}
              className="mono"
              aria-label="View Streak Flame"
            >
              <Flame size={13} fill="var(--amber)" />
              <span>{storage.getStreakState().currentStreak}d</span>
            </button>
          </div>

          {/* Mobile Overlay Backdrop */}
          {isMobileNavOpen && (
            <div 
              className="mobile-overlay" 
              onClick={() => setIsMobileNavOpen(false)} 
            />
          )}

          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onExportBackup={handleExportBackup}
            onOpenLanding={() => setViewMode('landing')}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
            onOpenAuth={() => setViewMode('auth')}
            onOpenStreakStudio={() => setIsStreakStudioOpen(true)}
            syncStatus={syncStatus}
            isOpenMobile={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
          />

          <main key={currentTab} className="animate-pop" style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
            <Suspense fallback={<ModuleLoader />}>
              {currentTab === 'habits' && <HabitModule soundEnabled={soundEnabled} />}
              {currentTab === 'timetable' && <TimetableModule soundEnabled={soundEnabled} />}
              {currentTab === 'focus' && <FocusModule soundEnabled={soundEnabled} />}
              {currentTab === 'kanban' && <KanbanModule soundEnabled={soundEnabled} />}
              {currentTab === 'notes' && <NotesModule soundEnabled={soundEnabled} />}
              {currentTab === 'utilities' && <UtilityModule soundEnabled={soundEnabled} />}
              {currentTab === 'friends' && (
                <FriendsModule 
                  soundEnabled={soundEnabled} 
                  onOpenStreakStudio={() => setIsStreakStudioOpen(true)} 
                />
              )}
            </Suspense>
          </main>
        </div>
      )}

      {/* Duolingo Streak Studio & Freezes Modal */}
      {isStreakStudioOpen && (
        <Suspense fallback={null}>
          <StreakStudioModal
            isOpen={isStreakStudioOpen}
            onClose={() => setIsStreakStudioOpen(false)}
            soundEnabled={soundEnabled}
            onStreakUpdate={() => setStreakTick(t => t + 1)}
          />
        </Suspense>
      )}

      {/* View Mode 4: Dedicated Auth Portal */}
      {viewMode === 'auth' && (
        <Suspense fallback={<ModuleLoader />}>
          <AuthPage
            onBackToWorkspace={() => setViewMode('workspace')}
            onSuccess={() => {
              setProfile(storage.getProfile());
              setViewMode('workspace');
            }}
            onOpenAbout={() => setViewMode('landing')}
          />
        </Suspense>
      )}

      {/* Cloud Sync Modal */}
      {isCloudSyncOpen && (
        <Suspense fallback={null}>
          <CloudSyncModal
            isOpen={isCloudSyncOpen}
            onClose={() => setIsCloudSyncOpen(false)}
            onDataSynced={() => {
              setProfile(storage.getProfile());
            }}
            onOpenFullscreenAuth={() => setViewMode('auth')}
          />
        </Suspense>
      )}

      {/* Global Command Palette (Ctrl + K) */}
      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectTab={(tab) => {
              setViewMode('workspace');
              setCurrentTab(tab);
            }}
            onOpenLanding={() => setViewMode('landing')}
            onOpenOnboarding={() => setViewMode('onboarding')}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onExportBackup={handleExportBackup}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;

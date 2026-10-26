import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { OnboardingFlow } from './components/OnboardingFlow';
import { HabitModule } from './components/HabitModule';
import { TimetableModule } from './components/TimetableModule';
import { FocusModule } from './components/FocusModule';
import { KanbanModule } from './components/KanbanModule';
import { NotesModule } from './components/NotesModule';
import { UtilityModule } from './components/UtilityModule';
import { CommandPalette } from './components/CommandPalette';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AuthPage } from './components/AuthPage';
import { cloudSync, type SyncStatus } from './storage/cloudSyncService';
import { storage } from './storage/storageAdapter';
import { Check } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('habits');
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.getProfile().soundEnabled);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => cloudSync.getStatus());

  useEffect(() => {
    return cloudSync.subscribe((status) => {
      setSyncStatus(status);
    });
  }, []);

  // App View Mode: 'landing' | 'onboarding' | 'workspace' | 'auth'
  const [viewMode, setViewMode] = useState<'landing' | 'onboarding' | 'workspace' | 'auth'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#about' || window.location.search.includes('landing')) {
        return 'landing';
      }
    }
    return storage.isOnboardingCompleted() ? 'workspace' : 'landing';
  });

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
        <LandingPage
          onStartSetup={() => setViewMode('onboarding')}
          onExploreDirectly={() => {
            storage.setOnboardingCompleted(true);
            setViewMode('workspace');
          }}
          onImportBackup={handleTriggerImport}
          onOpenAuth={() => setViewMode('auth')}
        />
      )}

      {/* View Mode 2: Creative Interactive Onboarding Wizard */}
      {viewMode === 'onboarding' && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onCancel={() => setViewMode('landing')}
          soundEnabled={soundEnabled}
        />
      )}

      {/* View Mode 3: Main Productivity Workspace */}
      {viewMode === 'workspace' && (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
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
            syncStatus={syncStatus}
          />

          <main key={currentTab} className="animate-pop" style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
            {currentTab === 'habits' && <HabitModule soundEnabled={soundEnabled} />}
            {currentTab === 'timetable' && <TimetableModule soundEnabled={soundEnabled} />}
            {currentTab === 'focus' && <FocusModule soundEnabled={soundEnabled} />}
            {currentTab === 'kanban' && <KanbanModule soundEnabled={soundEnabled} />}
            {currentTab === 'notes' && <NotesModule soundEnabled={soundEnabled} />}
            {currentTab === 'utilities' && <UtilityModule soundEnabled={soundEnabled} />}
          </main>
        </div>
      )}

      {/* View Mode 4: Dedicated 1/3 Split Cloudflare-Style Auth Portal */}
      {viewMode === 'auth' && (
        <AuthPage
          onBackToWorkspace={() => setViewMode('workspace')}
          onSuccess={() => {
            setProfile(storage.getProfile());
            setViewMode('workspace');
          }}
        />
      )}

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        onDataSynced={() => {
          setProfile(storage.getProfile());
        }}
        onOpenFullscreenAuth={() => setViewMode('auth')}
      />

      {/* Global Command Palette (Ctrl + K) */}
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
    </>
  );
}

export default App;

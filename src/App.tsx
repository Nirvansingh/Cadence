import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { HabitModule } from './components/HabitModule';
import { TimetableModule } from './components/TimetableModule';
import { FocusModule } from './components/FocusModule';
import { KanbanModule } from './components/KanbanModule';
import { NotesModule } from './components/NotesModule';
import { UtilityModule } from './components/UtilityModule';
import { OnboardingModal } from './components/OnboardingModal';
import { storage } from './storage/storageAdapter';
import { Check } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('habits');
  const [profile, setProfile] = useState(() => storage.getProfile());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.getProfile().soundEnabled);
  const [backupNotice, setBackupNotice] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !storage.isOnboardingCompleted());

  useEffect(() => {
    const updated = { ...profile, soundEnabled };
    storage.setProfile(updated);
    setProfile(updated);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
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

    setBackupNotice(true);
    setTimeout(() => setBackupNotice(false), 3500);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setProfile(storage.getProfile());
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Onboarding Wizard - Appears on clean start */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onExportBackup={handleExportBackup}
      />

      {/* Main Viewport */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
        {/* Toast Notice */}
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
            <span>Local JSON backup saved to downloads.</span>
          </div>
        )}

        {/* Workspaces */}
        {currentTab === 'habits' && <HabitModule soundEnabled={soundEnabled} />}
        {currentTab === 'timetable' && <TimetableModule soundEnabled={soundEnabled} />}
        {currentTab === 'focus' && <FocusModule soundEnabled={soundEnabled} />}
        {currentTab === 'kanban' && <KanbanModule soundEnabled={soundEnabled} />}
        {currentTab === 'notes' && <NotesModule soundEnabled={soundEnabled} />}
        {currentTab === 'utilities' && <UtilityModule soundEnabled={soundEnabled} />}
      </main>
    </div>
  );
}

export default App;

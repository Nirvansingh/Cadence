import React, { useState, useEffect } from 'react';
import { supabase } from '../storage/supabaseClient';
import { cloudSync, type SyncStatus } from '../storage/cloudSyncService';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, LogOut, Mail, Lock, X } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced?: () => void;
  onOpenFullscreenAuth?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
  onOpenFullscreenAuth
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    };
    checkUser();

    const unsubscribe = cloudSync.subscribe(status => {
      setSyncStatus(status);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      if (session?.user) {
        cloudSync.pullCloudToLocal();
      }
    });

    return () => {
      unsubscribe();
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        if (data.session) {
          setUserEmail(data.user?.email || null);
          setSuccessMsg('Account created & signed in! Syncing data...');
          await cloudSync.pushLocalToCloud();
          if (onDataSynced) onDataSynced();
        } else {
          setSuccessMsg('Verification email sent! Check your inbox to confirm.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        setUserEmail(data.user?.email || null);
        setSuccessMsg('Signed in successfully! Syncing your data...');
        await cloudSync.pullCloudToLocal();
        if (onDataSynced) onDataSynced();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSyncPush = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await cloudSync.pushLocalToCloud();
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Local data uploaded to cloud successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to sync to cloud.');
    }
  };

  const handleManualSyncPull = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await cloudSync.pullCloudToLocal();
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Data downloaded from cloud!');
      if (onDataSynced) onDataSynced();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to download cloud data.');
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUserEmail(null);
    setLoading(false);
    setSuccessMsg('Signed out. Local-first data remains safe on your device.');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px'
    }}>
      <div 
        className="animate-pop"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--emerald)'
            }}>
              <Cloud size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)' }}>
                Cloud Sync
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Sync your habits, schedule, notes & tasks across devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {errorMsg && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--emerald)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {userEmail ? (
            /* Logged In State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Connected Account
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pure)', marginTop: '2px' }}>
                    {userEmail}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: syncStatus === 'synced' ? 'var(--emerald)' : syncStatus === 'syncing' ? 'var(--sky)' : 'var(--text-muted)',
                  backgroundColor: 'var(--bg-card)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: syncStatus === 'synced' ? 'var(--emerald)' : syncStatus === 'syncing' ? 'var(--sky)' : 'var(--text-muted)'
                  }} />
                  <span style={{ textTransform: 'capitalize' }}>{syncStatus}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleManualSyncPush}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Push Local to Cloud</span>
                </button>

                <button
                  onClick={handleManualSyncPull}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Cloud size={14} />
                  <span>Pull Cloud Data</span>
                </button>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--rose)',
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '8px'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out of Cadence Cloud</span>
              </button>
            </div>
          ) : (
            /* Logged Out / Sign In Form */
            <div>
              <div style={{
                display: 'flex',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-app)',
                padding: '3px',
                marginBottom: '16px',
                border: '1px solid var(--border-hairline)'
              }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: authMode === 'signin' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'signin' ? 'var(--text-pure)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: authMode === 'signup' ? 'var(--bg-card)' : 'transparent',
                    color: authMode === 'signup' ? 'var(--text-pure)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-pure)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-hairline)',
                        color: 'var(--text-pure)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    border: 'none',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{authMode === 'signin' ? 'Sign In & Sync' : 'Register Free Account'}</span>
                </button>
              </form>

              <div style={{
                marginTop: '16px',
                padding: '10px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: '1.4'
              }}>
                <CloudOff size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Cadence remains 100% functional offline without an account. Cloud sync is optional for multi-device synchronization.
                </span>
              </div>

              {onOpenFullscreenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullscreenAuth();
                  }}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--sky)',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  Open Fullscreen Login Portal (with Network Animation) →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

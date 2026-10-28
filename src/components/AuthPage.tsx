import React, { useState, useEffect } from 'react';
import { supabase } from '../storage/supabaseClient';
import { cloudSync } from '../storage/cloudSyncService';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface AuthPageProps {
  onBackToWorkspace: () => void;
  onSuccess: () => void;
  onOpenAbout?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onBackToWorkspace,
  onSuccess,
  onOpenAbout
}) => {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpToken, setOtpToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      setOtpStep('verify');
      setResendTimer(60);
      setSuccessMsg(`We sent a 6-digit one-time code to ${email.trim()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpToken.trim();
    if (!token || token.length < 6) {
      setErrorMsg('Please enter the complete 6-digit code from your email.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email'
      });
      if (error) throw error;
      if (data.session) {
        setSuccessMsg('Code verified! Downloading your cloud workspace...');
        await cloudSync.pullCloudToLocal();
        setTimeout(() => onSuccess(), 1000);
      } else {
        setSuccessMsg('Verified! Opening workspace...');
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        if (data.session) {
          setSuccessMsg('Account created & signed in! Synchronizing your workspace...');
          await cloudSync.pushLocalToCloud();
          setTimeout(() => onSuccess(), 1000);
        } else {
          setSuccessMsg('Account registered! Check your email to verify and sign in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        setSuccessMsg('Signed in! Downloading your latest cloud workspace...');
        await cloudSync.pullCloudToLocal();
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: '#090b10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflowY: 'auto',
      color: 'var(--text-main)',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0f131c',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 36px 32px',
        position: 'relative'
      }}>
        {/* Top Header & Back Button */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: 'var(--emerald)'
              }} />
              <span style={{
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-pure)',
                textTransform: 'uppercase'
              }}>
                Cadence
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onOpenAbout && (
                <button
                  type="button"
                  onClick={onOpenAbout}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-hairline)',
                    color: 'var(--text-muted)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text-pure)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border-hairline)';
                  }}
                >
                  About Cadence
                </button>
              )}

              <button
                type="button"
                onClick={onBackToWorkspace}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--text-pure)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border-hairline)';
                }}
              >
                <ArrowLeft size={13} />
                <span>Guest Workspace</span>
              </button>
            </div>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-pure)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {authMethod === 'otp'
              ? (otpStep === 'verify' ? 'Enter 6-digit code' : 'One-Time Code Login')
              : (mode === 'signin' ? 'Welcome back' : 'Create your account')}
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            lineHeight: 1.5
          }}>
            {authMethod === 'otp'
              ? (otpStep === 'verify'
                ? `Enter the verification code sent to ${email}`
                : 'Instant passwordless access. We will email you a 6-digit login code.')
              : (mode === 'signin'
                ? 'Sign in with your password to sync your schedule and habits.'
                : 'Join with free cloud sync. Zero telemetry, local-first by default.')}
          </p>

          {/* Primary Method Switch Tabs: OTP vs Password */}
          <div style={{
            display: 'flex',
            marginTop: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-xs)',
            padding: '3px',
            border: '1px solid var(--border-hairline)'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: authMethod === 'otp' ? 'var(--bg-card)' : 'transparent',
                color: authMethod === 'otp' ? 'var(--text-pure)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'var(--transition-fast)'
              }}
            >
              <Mail size={13} />
              <span>Email Code (OTP)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: authMethod === 'password' ? 'var(--bg-card)' : 'transparent',
                color: authMethod === 'password' ? 'var(--text-pure)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'var(--transition-fast)'
              }}
            >
              <Lock size={13} />
              <span>Password</span>
            </button>
          </div>

          {/* If Password mode is chosen: signin vs signup tabs */}
          {authMethod === 'password' && (
            <div style={{
              display: 'flex',
              marginTop: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px',
              border: '1px solid var(--border-hairline)'
            }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: mode === 'signin' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: mode === 'signin' ? 'var(--text-pure)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: mode === 'signup' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: mode === 'signup' ? 'var(--text-pure)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--emerald)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============ OTP METHOD FORMS ============ */}
          {authMethod === 'otp' && (
            otpStep === 'request' ? (
              /* Step 1: Request OTP Code */
              <form onSubmit={handleSendOtp} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-pure)',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'var(--transition-fast)'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '6px',
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    border: 'none',
                    color: '#05070e',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  <span>Send Login Code</span>
                </button>
              </form>
            ) : (
              /* Step 2: Enter 6-digit Code */
              <form onSubmit={handleVerifyOtp} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      6-Digit Code
                    </label>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('request'); setOtpToken(''); setErrorMsg(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Change email
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={otpToken}
                      onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-pure)',
                        fontSize: '18px',
                        letterSpacing: '0.3em',
                        fontFamily: 'monospace',
                        outline: 'none',
                        transition: 'var(--transition-fast)'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpToken.length < 6}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--emerald)',
                    border: 'none',
                    color: '#05070e',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    cursor: (loading || otpToken.length < 6) ? 'not-allowed' : 'pointer',
                    opacity: otpToken.length < 6 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>Verify Code & Sign In</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  {resendTimer > 0 ? (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Resend new code in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--emerald)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Resend 6-digit code
                    </button>
                  )}
                </div>
              </form>
            )
          )}

          {/* ============ PASSWORD METHOD FORM ============ */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-pure)',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-pure)',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--emerald)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--emerald)',
                  border: 'none',
                  color: '#05070e',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'var(--transition-fast)'
                }}
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                <span>{mode === 'signin' ? 'Sign In & Sync' : 'Create Free Account'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info & Offline skip */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-hairline)' }}>
          <button
            onClick={onBackToWorkspace}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              marginBottom: '14px'
            }}
          >
            <span>Continue as Guest (Offline Mode)</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <ShieldCheck size={14} color="var(--emerald)" style={{ flexShrink: 0 }} />
            <span>Encrypted cloud sync powered by Supabase. Free forever.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

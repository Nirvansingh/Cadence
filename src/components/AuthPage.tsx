import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';

interface AuthPageProps {
  onBackToWorkspace: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onBackToWorkspace,
  onSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cloudflare-inspired Canvas Network / Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
    }

    const particleCount = 65;
    const particles: Particle[] = [];
    const colors = [
      'rgba(16, 185, 129,',   // Emerald
      'rgba(56, 189, 248,',   // Sky
      'rgba(168, 85, 247,',   // Violet
      'rgba(244, 114, 182,'   // Pink/Rose
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.6 + 0.3
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let angle = 0;

    const render = () => {
      angle += 0.003;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep atmospheric background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      bgGrad.addColorStop(0.5, 'rgba(10, 15, 30, 0.98)');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated luminous orbital glow (Cloudflare style globe / telemetry center)
      const glowGrad = ctx.createRadialGradient(
        width * 0.55 + Math.sin(angle * 2) * 40,
        height * 0.5 + Math.cos(angle * 2) * 30,
        10,
        width * 0.55,
        height * 0.5,
        280
      );
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      glowGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.08)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4. Update and connect particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Boundary wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle mouse push
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 120 && distMouse > 0) {
          p.x -= (dxMouse / distMouse) * 1.5;
          p.y -= (dyMouse / distMouse) * 1.5;
        }

        // Connect particles within distance
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.28;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle dot with glow
        ctx.fillStyle = `${p.color} ${p.baseAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${p.color} 0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      display: 'flex',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#05070e',
      overflow: 'hidden',
      color: 'var(--text-main)',
      fontFamily: 'inherit'
    }}>
      {/* LEFT 1/3 SIDEBAR: AUTHENTICATION PANEL */}
      <div style={{
        width: '38%',
        minWidth: '400px',
        maxWidth: '490px',
        height: '100%',
        backgroundColor: 'rgba(11, 15, 25, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 42px',
        zIndex: 10,
        boxShadow: '10px 0 40px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        {/* Top Header & Back Button */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--emerald)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
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

            <button
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
              <span>Workspace</span>
            </button>
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-pure)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            lineHeight: 1.5
          }}>
            {mode === 'signin'
              ? 'Sign in to sync your schedule, habits, and notes across all your devices.'
              : 'Join with free cloud sync. Zero telemetry, local-first by default.'}
          </p>

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex',
            marginTop: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-xs)',
            padding: '4px',
            border: '1px solid var(--border-hairline)'
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signin' ? 'var(--text-pure)' : 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                backgroundColor: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-pure)' : 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              Create Account
            </button>
          </div>

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

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.3)',
                transition: 'var(--transition-fast)'
              }}
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              <span>{mode === 'signin' ? 'Sign In & Sync' : 'Create Free Account'}</span>
            </button>
          </form>
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

      {/* RIGHT 2/3: CLOUDFLARE-STYLE ANIMATED CANVAS SHOWCASE */}
      <div style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Dynamic HTML5 Background Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

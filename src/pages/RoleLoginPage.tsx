import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Eye, EyeOff, ArrowLeft, Shield, CheckCircle,
  Lock, Mail, User, Zap, BarChart3, Users, Workflow
} from 'lucide-react';
import type { UserRole } from '../lib/types';

const ROLE_HOME: Record<UserRole, string> = {
  admin:    '/admin/dashboard',
  manager:  '/manager/dashboard',
  hr:       '/hr/dashboard',
  employee: '/employee/dashboard',
};

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'At least 6 characters'),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Full name is required'),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match", path: ['confirm'],
});

type LoginForm  = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

/* ── Brand config per portal ────────────────────── */
interface PortalConfig {
  gradient:   string;
  bgGradient: string;
  glow:       string;
  accent:     string;
  tagline:    string;
  bgImage:    string;
  features:   { icon: React.ReactNode; text: string }[];
}

const PORTAL_CONFIG: Record<UserRole, PortalConfig> = {
  admin: {
    gradient:   'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, rgba(239,68,68,0.06) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(185,28,28,0.04) 0%, transparent 60%)',
    glow:       'rgba(239,68,68,0.25)',
    accent:     '#EF4444',
    tagline:    'Full system control and organization-wide visibility.',
    bgImage:    import.meta.env.BASE_URL + 'admin_bg.png',
    features: [
      { icon: <Users size={16} />, text: 'Provision and manage all user accounts' },
      { icon: <BarChart3 size={16} />, text: 'Monitor system-wide workflow metrics' },
      { icon: <Shield size={16} />, text: 'Configure departments and access rules' },
    ],
  },
  manager: {
    gradient:   'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.06) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(29,78,216,0.04) 0%, transparent 60%)',
    glow:       'rgba(59,130,246,0.25)',
    accent:     '#3B82F6',
    tagline:    'Lead your team with full workflow visibility and approval control.',
    bgImage:    import.meta.env.BASE_URL + 'manager_bg.png',
    features: [
      { icon: <Workflow size={16} />, text: 'Review and approve team workflows' },
      { icon: <Users size={16} />, text: 'Manage leave requests and approvals' },
      { icon: <BarChart3 size={16} />, text: 'Track team productivity analytics' },
    ],
  },
  hr: {
    gradient:   'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.06) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(109,40,217,0.04) 0%, transparent 60%)',
    glow:       'rgba(139,92,246,0.25)',
    accent:     '#8B5CF6',
    tagline:    'Manage your people, payroll, and employee development in one place.',
    bgImage:    import.meta.env.BASE_URL + 'hr_bg.png',
    features: [
      { icon: <Users size={16} />, text: 'Access and update employee records' },
      { icon: <CheckCircle size={16} />, text: 'Process final leave approvals' },
      { icon: <BarChart3 size={16} />, text: 'View payroll and HR reports' },
    ],
  },
  employee: {
    gradient:   'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(5,150,105,0.04) 0%, transparent 60%)',
    glow:       'rgba(16,185,129,0.25)',
    accent:     '#10B981',
    tagline:    'Manage your requests, projects, skills, and career goals with ease.',
    bgImage:    import.meta.env.BASE_URL + 'employee_bg.png',
    features: [
      { icon: <Zap size={16} />, text: 'Submit leave and purchase requests' },
      { icon: <BarChart3 size={16} />, text: 'Track project progress and updates' },
      { icon: <Shield size={16} />, text: 'Build your skill profile & career goals' },
    ],
  },
};

export interface RoleLoginPageProps {
  portalRole: UserRole;
  title:      string;
  showSignup?: boolean;
}

/* ── Shared input component ───────────────────── */
const Input: React.FC<{
  icon: React.ReactNode;
  error?: string;
  accent: string;
} & React.InputHTMLAttributes<HTMLInputElement>> = ({ icon, error, accent, ...props }) => (
  <div style={{ position: 'relative' }}>
    <div style={{
      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      color: error ? '#EF4444' : '#94A3B8', pointerEvents: 'none',
      display: 'flex', alignItems: 'center',
    }}>
      {icon}
    </div>
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '13px 14px 13px 44px',
        background: '#F8FAFC',
        border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
        borderRadius: 12, color: '#0F172A', fontSize: 14,
        outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...props.style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}20`;
        e.currentTarget.style.background = 'white';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = error ? '#EF4444' : '#E2E8F0';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = '#F8FAFC';
      }}
    />
    {error && (
      <div style={{ marginTop: 5, fontSize: 12, color: '#EF4444', paddingLeft: 2 }}>{error}</div>
    )}
  </div>
);

export const RoleLoginPage: React.FC<RoleLoginPageProps> = ({
  portalRole, title, showSignup = false,
}) => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const cfg = PORTAL_CONFIG[portalRole];
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const roleLabel = title.replace(' Portal', '');

  /* ── Preload Background Image ── */
  React.useEffect(() => {
    const img = new Image();
    img.src = cfg.bgImage;
    img.onload = () => setImgLoaded(true);
  }, [cfg.bgImage]);

  /* ── Sign-in ─────────────────────────────────── */
  const {
    register: regL, handleSubmit: hsL,
    formState: { errors: errL, isSubmitting: subL },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSignIn = async (data: LoginForm) => {
    setAuthError(null);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email, password: data.password,
      });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from('users').select('role').eq('id', authData.user.id).single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setAuthError('Your account profile was not found. Please contact your administrator.');
        return;
      }

      if (profile.role !== portalRole) {
        await supabase.auth.signOut();
        const label = String(profile.role).charAt(0).toUpperCase() + String(profile.role).slice(1);
        setAuthError(`This account belongs to the ${label} portal. Please sign in there instead.`);
        return;
      }

      await refreshUser();
      navigate(ROLE_HOME[portalRole], { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(msg === 'Invalid login credentials' ? 'Incorrect email or password. Please try again.' : msg);
    }
  };

  /* ── Sign-up ─────────────────────────────────── */
  const {
    register: regS, handleSubmit: hsS,
    formState: { errors: errS, isSubmitting: subS },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSignUp = async (data: SignupForm) => {
    setAuthError(null);
    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email, password: data.password,
        options: { 
          data: { full_name: data.full_name },
          emailRedirectTo: redirectTo
        },
      });
      if (error) throw error;
      if (!authData.user) throw new Error('Sign-up failed. Please try again.');

      await supabase.from('users').upsert({
        id: authData.user.id, email: data.email,
        full_name: data.full_name, role: 'employee', is_active: true,
      });
      setSignupDone(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign-up failed');
    }
  };

  /* ── Render ──────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#F8FAFC',
      backgroundImage: cfg.bgGradient,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="login-left-panel"
        style={{
          flex: '0 0 480px',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${cfg.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: imgLoaded ? 0.55 : 0,
          transition: 'opacity 0.8s ease-in-out',
        }} />
        {/* Themed placeholder while loading */}
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: cfg.accent,
            opacity: 0.1,
          }} />
        )}
        {/* Dark overlay for text legibility, still keeping image visible */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.8) 100%)`,
        }} />
        {/* Coloured vignette at edges */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 20% 80%, ${cfg.glow.replace('0.4','0.22')} 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Content on top of image */}
        <div style={{
          position: 'relative', zIndex: 1,
          height: '100%', padding: '48px 52px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Top row: back + brand */}
          <div>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'white', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s', marginBottom: 52, fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <ArrowLeft size={14} /> All Portals
            </button>

            {/* Branded icon */}
            <div style={{ marginBottom: 32 }}>
              <div style={{
                width: 68, height: 68, borderRadius: 18,
                background: cfg.gradient, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 12px 40px ${cfg.glow.replace('0.25', '0.4')}`,
                marginBottom: 24,
              }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>FS</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
                FirmSync Enterprise
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.8px', lineHeight: 1.2, margin: 0, marginBottom: 14 }}>
                {title}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>
                {cfg.tagline}
              </p>
            </div>

            {/* Feature list — frosted glass card */}
            <div style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
              borderRadius: 14, padding: '18px 20px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {cfg.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cfg.accent,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 13.5, color: 'white', lineHeight: 1.5, fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            marginTop: 48,
          }}>
            <Lock size={14} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: 12, color: 'white' }}>
              Protected by enterprise-grade role-based access control
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Tabs — employee only */}
          {showSignup && (
            <div style={{
              display: 'flex', gap: 4, marginBottom: 32,
              background: '#F1F5F9',
              borderRadius: 14, padding: 4,
              border: '1px solid #E2E8F0',
            }}>
              {(['signin', 'signup'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setAuthError(null); }}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                    cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    background: tab === t ? cfg.gradient : 'transparent',
                    color: tab === t ? 'white' : '#64748B',
                    boxShadow: tab === t ? `0 4px 16px ${cfg.glow}` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {t === 'signin' ? '👤 Sign In' : '✨ Create Account'}
                </button>
              ))}
            </div>
          )}

          {/* Heading */}
          {!signupDone && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.6px', margin: 0, marginBottom: 6 }}>
                {tab === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                {tab === 'signin'
                  ? `Sign in to your ${roleLabel} account to continue`
                  : 'Fill out the form below to get started as an employee'}
              </p>
            </div>
          )}

          {/* Error banner */}
          {authError && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '13px 16px', background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12,
              marginBottom: 20, fontSize: 13.5, color: '#B91C1C', lineHeight: 1.5,
            }}>
              <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {authError}
            </div>
          )}

          {/* Signup success */}
          {signupDone && (
            <div style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '20px', background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16,
              fontSize: 14, color: '#047857', lineHeight: 1.65,
            }}>
              <CheckCircle size={22} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Account created successfully!</strong>
                Check your email to confirm your address, then switch to the Sign In tab to log in.
              </div>
            </div>
          )}

          {/* SIGN-IN FORM */}
          {tab === 'signin' && !signupDone && (
            <form onSubmit={hsL(onSignIn)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>
                  Email Address
                </label>
                <Input
                  {...regL('email')}
                  type="email"
                  icon={<Mail size={15} />}
                  error={errL.email?.message}
                  accent={cfg.accent}
                  placeholder={`${portalRole}@company.com`}
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    {...regL('password')}
                    type={showPass ? 'text' : 'password'}
                    icon={<Lock size={15} />}
                    error={errL.password?.message}
                    accent={cfg.accent}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 14,
                      top: errL.password ? 'calc(50% - 10px)' : '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8', background: 'none',
                      border: 'none', cursor: 'pointer', display: 'flex', padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={subL}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: 12,
                  background: subL ? '#E2E8F0' : cfg.gradient,
                  color: 'white', fontWeight: 700, fontSize: 15, cursor: subL ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit',
                  boxShadow: subL ? 'none' : `0 8px 28px ${cfg.glow}`,
                  transition: 'all 0.2s', marginTop: 4,
                }}
              >
                {subL
                  ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Signing in...</>
                  : `Sign In to ${roleLabel} Portal`}
              </button>

              {!showSignup && (
                <div style={{
                  marginTop: 8, padding: '14px 16px', background: '#F8FAFC',
                  borderRadius: 12, border: '1px solid #E2E8F0',
                  fontSize: 12.5, color: '#64748B', textAlign: 'center', lineHeight: 1.6,
                }}>
                  <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Credentials are provisioned by your IT administrator.
                  Contact support if you need access.
                </div>
              )}
            </form>
          )}

          {/* SIGN-UP FORM */}
          {tab === 'signup' && !signupDone && (
            <form onSubmit={hsS(onSignUp)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>Full Name</label>
                <Input {...regS('full_name')} icon={<User size={15} />} error={errS.full_name?.message} accent={cfg.accent} placeholder="Jane Smith" autoComplete="name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>Email Address</label>
                <Input {...regS('email')} type="email" icon={<Mail size={15} />} error={errS.email?.message} accent={cfg.accent} placeholder="you@company.com" autoComplete="email" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>Password</label>
                <Input {...regS('password')} type="password" icon={<Lock size={15} />} error={errS.password?.message} accent={cfg.accent} placeholder="Minimum 6 characters" autoComplete="new-password" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 7 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Input {...regS('confirm')} type={showConfirm ? 'text' : 'password'} icon={<Lock size={15} />} error={errS.confirm?.message} accent={cfg.accent} placeholder="Repeat password" autoComplete="new-password" style={{ paddingRight: 48 }} />
                  <button
                    type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 14, top: errS.confirm ? 'calc(50% - 10px)' : '50%', transform: 'translateY(-50%)', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={subS}
                style={{
                  width: '100%', padding: '14px', border: 'none', borderRadius: 12,
                  background: subS ? '#E2E8F0' : cfg.gradient,
                  color: 'white', fontWeight: 700, fontSize: 15, cursor: subS ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', boxShadow: subS ? 'none' : `0 8px 28px ${cfg.glow}`,
                  transition: 'all 0.2s', marginTop: 4,
                }}
              >
                {subS
                  ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Creating account...</>
                  : 'Create Employee Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Responsive style for small screens */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: #94A3B8; }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

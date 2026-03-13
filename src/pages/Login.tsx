import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Zap, Shield, BarChart3, Users } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
  { icon: <Zap size={20} />, title: 'Workflow Automation', desc: 'Multi-step approvals with intelligent routing' },
  { icon: <Shield size={20} />, title: 'Role-Based Access', desc: 'Granular permissions for every team member' },
  { icon: <BarChart3 size={20} />, title: 'Advanced Analytics', desc: 'Real-time dashboards and productivity insights' },
  { icon: <Users size={20} />, title: 'Team Collaboration', desc: 'Unified platform for cross-department workflows' },
];

// Role routing is delegated to RoleRedirect at "/".
// Login.tsx does not need to know about role-to-path mapping.

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setAuthError(null);
      await signIn(data.email, data.password);
      // Navigate to root — RoleRedirect will dispatch to the correct portal dashboard
      // (or restore the originally-requested protected URL if one was stored in location.state)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from ?? '/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(message);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
              FS
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>FirmSync</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Enterprise Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 }}>
            Your Business,
            <br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Fully Automated.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 48 }}>
            Streamline your organization's workflows, approvals, and team management in one powerful enterprise platform.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#60A5FA', marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Sign in to your FirmSync account
            </p>
          </div>

          {authError && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <div className="form-error">{errors.email.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: 8 }}
            >
              {isSubmitting ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Demo Accounts
            </div>
            {[
              { role: 'Admin', email: 'admin@firmsync.com' },
              { role: 'Manager', email: 'manager@firmsync.com' },
              { role: 'HR', email: 'hr@firmsync.com' },
              { role: 'Employee', email: 'employee@firmsync.com' },
            ].map((a) => (
              <div key={a.role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 600 }}>{a.role}:</span>
                <span>{a.email} / <code>password123</code></span>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

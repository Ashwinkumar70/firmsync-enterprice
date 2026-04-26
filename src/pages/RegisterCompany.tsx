import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Mail, Lock, User, ArrowLeft, Shield, CheckCircle,
  Zap, BarChart3, Users, Globe, Layout, Hash
} from 'lucide-react';

const registerSchema = z.object({
  company_name: z.string().min(2, 'Company name is too short'),
  company_code: z.string().max(10, 'Code too long').regex(/^[A-Z0-9]*$/i, 'Only letters and numbers allowed').optional(),
  full_name: z.string().min(2, 'Full name is too short'),
  email:         z.string().email('Enter a valid email address'),
  password:      z.string().min(6, 'At least 6 characters'),
  confirm:       z.string(),
  departments:   z.array(z.string()).optional(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match", path: ['confirm'],
});

type RegisterForm = z.infer<typeof registerSchema>;

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
        padding: '14px 14px 14px 44px',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(4px)',
        border: `1.5px solid ${error ? '#EF4444' : 'rgba(255, 255, 255, 0.5)'}`,
        borderRadius: 14, color: '#0F172A', fontSize: 14,
        outline: 'none', fontFamily: 'inherit',
        transition: 'all 0.2s',
        ...props.style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 0 0 4px ${accent}20`;
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = error ? '#EF4444' : 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
      }}
    />
    {error && (
      <div style={{ marginTop: 5, fontSize: 12, color: '#EF4444', paddingLeft: 2 }}>{error}</div>
    )}
  </div>
);

export const RegisterCompany: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isDone, setIsDone] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const accent = '#6366F1'; // Indigo for SaaS branding
  const gradient = 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)';
  const glow = 'rgba(99, 102, 241, 0.25)';

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setAuthError(null);
    try {
      console.log('Attempting registration for:', data.email);
      
      // Ensure redirect URL is absolute and valid
      const baseUrl = import.meta.env.BASE_URL || '/';
      const redirectUrl = new URL(baseUrl, window.location.origin).href;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            company_name: data.company_name,
            company_code: data.company_code ? data.company_code.toUpperCase() : '',
            departments: data.departments && data.departments.length > 0 ? data.departments : null,
            is_company_registration: 'true',
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        throw error;
      }
      
      if (!authData.user) {
        throw new Error('Registration failed: No user returned from server');
      }

      console.log('Registration successful:', authData.user.id);
      setIsDone(true);
    } catch (err: any) {
      console.error('Registration Exception Full Details:', err);
      
      const msg = err?.message || 'Registration failed';
      const detail = err?.details || '';
      const hint = err?.hint || '';
      
      console.error('Registration Error Message:', msg);
      if (detail) console.error('Registration Error Detail:', detail);
      if (hint) console.error('Registration Error Hint:', hint);

      if (msg.includes('Unexpected failure') || msg.includes('Database error')) {
        setAuthError(`Server Error: The registration trigger failed. Details: ${msg} ${detail}`);
      } else {
        setAuthError(msg);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#F8FAFC',
      fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    }}>
      {/* Left Panel - Sales Pitch */}
      <div style={{
        flex: '0 0 520px',
        position: 'relative',
        overflow: 'hidden',
        background: '#0F172A',
        color: 'white',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Abstract Background Design */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'white', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              marginBottom: 60, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <ArrowLeft size={14} /> Back to Login
          </button>

          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: gradient, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 12px 30px ${glow}`,
            marginBottom: 32,
          }}>
            <Building2 size={30} color="white" />
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            Launch your <br />
            <span style={{ color: '#818CF8' }}>Company Workspace</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.6, marginBottom: 40, maxWidth: 380 }}>
            Empower your team with a unified platform for workflows, projects, and people management.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             {[
               { icon: <Globe size={18} />, title: "Global Workspace", desc: "One place for all your departments and teams." },
               { icon: <Zap size={18} />, title: "Automated Workflows", desc: "Streamline approvals and internal processes." },
               { icon: <Layout size={18} />, title: "Project Tracking", desc: "Full visibility into milestones and deliverables." },
             ].map((item, i) => (
               <div key={i} style={{ display: 'flex', gap: 20 }}>
                 <div style={{
                   width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                   background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8'
                 }}>
                   {item.icon}
                 </div>
                 <div>
                   <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px 0' }}>{item.title}</h3>
                   <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{item.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: '#475569', fontSize: 12 }}>
          © 2024 FirmSync Enterprise SaaS. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {isDone ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: '#ECFDF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#059669', margin: '0 auto 24px auto'
              }}>
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Workspace Created!</h2>
              <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>
                We've sent a confirmation email to your inbox. Please verify your email and then you can log in as the System Admin.
              </p>
              <button
                onClick={() => navigate('/login/admin')}
                style={{
                  width: '100%', padding: '14px', background: gradient, color: 'white',
                  border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 8px 24px ${glow}`,
                }}
              >
                Go to Admin Login
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  Create a Workspace
                </h2>
                <p style={{ color: '#64748B' }}>
                  Start your 14-day free trial. No credit card required.
                </p>
              </div>

              {authError && (
                <div style={{
                  padding: '14px', background: '#FEF2F2', border: '1px solid #FEE2E2',
                  borderRadius: 12, color: '#B91C1C', fontSize: 13, marginBottom: 24,
                  display: 'flex', gap: 10, alignItems: 'center'
                }}>
                  <Shield size={16} /> {authError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Company Name</label>
                  <Input {...register('company_name')} icon={<Building2 size={16} />} placeholder="Acme Corp" error={errors.company_name?.message} accent={accent} />
                </div>

                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Company Code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Input 
                        {...register('company_code')} 
                        icon={<Zap size={16} />} 
                        placeholder="e.g. ACME123 (Optional)" 
                        error={errors.company_code?.message} 
                        accent={accent} 
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                        const el = document.querySelector('input[name="company_code"]') as HTMLInputElement;
                        if (el) {
                          el.value = code;
                          // Trigger react-hook-form change
                          el.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                      }}
                      style={{
                        padding: '0 20px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1.5px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '14px',
                        color: accent,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        height: '48.5px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                    >
                      Generate Code
                    </button>
                  </div>
                </div>


                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Admin Full Name</label>
                  <Input {...register('full_name')} icon={<User size={16} />} placeholder="Jane Doe" error={errors.full_name?.message} accent={accent} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Work Email Address</label>
                  <Input {...register('email')} type="email" icon={<Mail size={16} />} placeholder="jane@company.com" error={errors.email?.message} accent={accent} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Password</label>
                    <Input {...register('password')} type="password" icon={<Lock size={16} />} placeholder="••••••••" error={errors.password?.message} accent={accent} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Confirm</label>
                    <Input {...register('confirm')} type="password" icon={<Lock size={16} />} placeholder="••••••••" error={errors.confirm?.message} accent={accent} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
                    Initial Departments
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.4)',
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(255, 255, 255, 0.5)'
                  }}>
                    {['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'IT', 'Operations', 'Customer Support'].map(dept => (
                      <label key={dept} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '13px', 
                        color: '#1E293B',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <input 
                          type="checkbox" 
                          value={dept}
                          {...register('departments')}
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            accentColor: accent,
                            cursor: 'pointer'
                          }}
                        />
                        {dept}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>
                    Select the departments you want to initialize for your workspace.
                  </p>
                </div>


                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '16px', background: isSubmitting ? '#E2E8F0' : gradient,
                    color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: 12,
                    boxShadow: isSubmitting ? 'none' : `0 10px 25px ${glow}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {isSubmitting ? 'Setting up workspace...' : 'Create My Workspace'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 12 }}>
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

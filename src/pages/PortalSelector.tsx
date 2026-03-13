import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Briefcase, UserCheck, ArrowRight, Zap } from 'lucide-react';

const portals = [
  {
    role: 'Admin',
    path: '/login/admin',
    icon: Shield,
    gradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
    glow: 'rgba(239,68,68,0.35)',
    lightBg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.18)',
    tag: 'Full Control',
    desc: 'System configuration, user management, and organization-wide visibility.',
    features: ['User provisioning', 'Dept. management', 'System monitoring'],
  },
  {
    role: 'Manager',
    path: '/login/manager',
    icon: Briefcase,
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    glow: 'rgba(59,130,246,0.35)',
    lightBg: 'rgba(59,130,246,0.07)',
    border: 'rgba(59,130,246,0.18)',
    tag: 'Team Lead',
    desc: 'Review workflows, approve leaves, and monitor your department\'s performance.',
    features: ['Workflow approvals', 'Leave management', 'Team analytics'],
  },
  {
    role: 'HR',
    path: '/login/hr',
    icon: UserCheck,
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    glow: 'rgba(139,92,246,0.35)',
    lightBg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    tag: 'People Ops',
    desc: 'Manage employee records, handle final leave approvals, and oversee payroll.',
    features: ['Employee records', 'Final approvals', 'Payroll view'],
  },
  {
    role: 'Employee',
    path: '/login/employee',
    icon: Users,
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    glow: 'rgba(16,185,129,0.35)',
    lightBg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    tag: 'Self Service',
    desc: 'Submit requests, track projects, manage your skills and career goals.',
    features: ['Leave & projects', 'Skill tracking', 'Self-sign up'],
  },
];

export const PortalSelector: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafId = React.useRef<number>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
      containerRef.current.style.setProperty('--mouse-y', `${clientY}px`);
    });
  };

  React.useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        backgroundImage: 'radial-gradient(ellipse at 20% 10%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(139,92,246,0.06) 0%, transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        // Default values for CSS variables
        '--mouse-x': '50vw',
        '--mouse-y': '50vh',
      } as React.CSSProperties}>
      {/* ── ADVANCED BACKGROUND ANIMATION ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {/* Optimised Blueprint Grid (SVG Pattern) */}
        <div style={{
          position: 'absolute', inset: '-5%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(148,163,184,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
          transform: 'translate3d(calc((var(--mouse-x) - 50vw) * -0.01), calc((var(--mouse-y) - 50vh) * -0.01), 0)',
          willChange: 'transform',
        }} />

        {/* Interactive Cursor Glow (Reduced size and blur) */}
        <div style={{
          position: 'fixed',
          top: 'calc(var(--mouse-y) - 250px)',
          left: 'calc(var(--mouse-x) - 250px)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }} />

        {/* Animated Blobs (Reduced blur radius for performance) */}
        <div className="bg-blob" style={{
          position: 'absolute', top: '5%', left: '10%', width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(50px)', animation: 'float 35s infinite alternate ease-in-out',
          willChange: 'transform'
        }} />
        <div className="bg-blob" style={{
          position: 'absolute', bottom: '10%', right: '5%', width: '35vw', height: '35vw',
          background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(50px)', animation: 'float 30s infinite alternate-reverse ease-in-out',
          willChange: 'transform'
        }} />

        {/* Floating Hexagons (Reduced count) */}
        {[...Array(3)].map((_, i) => (
          <div key={`hex-${i}`} style={{
            position: 'absolute',
            top: `${20 + (i * 25)}%`,
            left: `${15 + (i * 30)}%`,
            width: 100 + (i * 30), height: 100 + (i * 30),
            border: '1px solid rgba(148,163,184,0.06)',
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            animation: `float ${25 + i * 5}s infinite alternate ease-in-out`,
            willChange: 'transform',
            animationDelay: `${i * -3}s`,
            opacity: 0.2,
          }} />
        ))}

        {/* Drifting Particles (Reduced count) */}
        {[...Array(12)].map((_, i) => (
          <div key={`part-${i}`} style={{
            position: 'absolute',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: 2 + Math.random() * 2,
            height: 2 + Math.random() * 2,
            background: i % 2 === 0 ? '#3B82F6' : '#8B5CF6',
            borderRadius: '50%',
            opacity: 0.1 + Math.random() * 0.15,
            animation: `drift ${20 + Math.random() * 20}s infinite linear`,
            willChange: 'transform',
            animationDelay: `${Math.random() * -20}s`,
          }} />
        ))}

        {/* Scanning Light Rays (Reduced frequency/count) */}
        {[...Array(2)].map((_, i) => (
          <div key={`ray-${i}`} style={{
            position: 'absolute',
            top: `${30 + (i * 40)}%`,
            left: '-20%',
            width: '140%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.05), transparent)',
            transform: 'rotate(-5deg)',
            animation: `scan ${15 + (i * 8)}s linear infinite`,
            willChange: 'transform',
            animationDelay: `${i * 5}s`,
          }} />
        ))}

        {/* Data flow lines (Subtle) */}
        {[...Array(4)].map((_, i) => (
          <div key={`stream-${i}`} style={{
            position: 'absolute',
            top: `${10 + (i * 15)}%`,
            left: '-100px',
            width: '240px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? '#3B82F6' : i % 3 === 1 ? '#8B5CF6' : '#10B981'}30, transparent)`,
            animation: `flow ${20 + (i * 7)}s linear infinite`,
            willChange: 'transform',
            animationDelay: `${i * 2.5}s`,
            opacity: 0.15,
          }} />
        ))}
      </div>

      <div className="portal-grid" style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 1080,
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(8px)',
          padding: '8px 20px',
          borderRadius: 20,
          border: '1px solid rgba(226, 232, 240, 0.5)',
          width: 'fit-content',
          margin: '0 auto 20px'
        }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-1px',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}>
            FS
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.8px', lineHeight: 1 }}>FirmSync</div>
            <div style={{ fontSize: 10, color: '#64748B', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>Enterprise Platform</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontSize: 11, color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Cloud-Based Business Workflow Engine</span>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.2px', lineHeight: 1.15, margin: 0, marginBottom: 10 }}>
          Welcome back.{' '}
          <span style={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Select your portal.
          </span>
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', margin: 0 }}>
          Each portal is tailored to your role. Choose below to continue.
        </p>
      </div>

      {/* Portal cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 1080,
      }}>
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.role}
              onClick={() => navigate(p.path)}
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '28px 24px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#0F172A',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.03)',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(-6px) scale(1.01)';
                el.style.boxShadow = `0 24px 60px ${p.glow.replace('0.35', '0.2')}`;
                el.style.borderColor = p.gradient.includes('#EF4444') ? '#EF4444' :
                  p.gradient.includes('#3B82F6') ? '#3B82F6' :
                  p.gradient.includes('#8B5CF6') ? '#8B5CF6' : '#10B981';
                el.style.background = 'white';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform = 'translateY(0) scale(1)';
                el.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.03)';
                el.style.borderColor = '#E2E8F0';
                el.style.background = 'white';
              }}
            >
              {/* Decorative glow blob */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120,
                background: p.glow.replace('0.35', '0.12'),
                borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none',
              }} />

              {/* Role tag */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20, marginBottom: 16,
                background: p.lightBg.replace('0.07', '0.4'),
                border: `1px solid ${p.border.replace('0.18', '0.3')}`,
                fontSize: 10.5, fontWeight: 700, letterSpacing: 1,
                textTransform: 'uppercase', color: p.gradient.includes('#EF4444') ? '#B91C1C' :
                  p.gradient.includes('#3B82F6') ? '#1D4ED8' :
                  p.gradient.includes('#8B5CF6') ? '#6D28D9' : '#047857',
              }}>
                {p.tag}
              </div>

              {/* Icon + role name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: p.gradient, display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${p.glow}`,
                }}>
                  <Icon size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.1 }}>{p.role} Portal</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>Sign in to continue</div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '0 0 18px', minHeight: 42 }}>
                {p.desc}
              </p>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.gradient, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 16px',
                background: '#F8FAFC',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Sign In to {p.role} Portal</span>
                <ArrowRight size={16} color="#64748B" />
              </div>
            </button>
          );
        })}
        </div>
      </div>

      <p style={{ marginTop: 44, fontSize: 12, color: '#94A3B8', letterSpacing: 0.3, position: 'relative', zIndex: 1 }}>
        🔒 Protected by enterprise-grade role-based access control · FirmSync Enterprise
      </p>

      {/* Animation Styles */}
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(-20px, 30px) scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; box-shadow: 0 0 0 0 rgba(59,130,246,0.2); }
          50% { transform: scale(1.5); opacity: 0.4; box-shadow: 0 0 10px 4px rgba(59,130,246,0.1); }
        }
        @keyframes drift {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-100vh) translateX(50px); }
        }
        @keyframes scan {
          0% { transform: translateY(-100px) rotate(-5deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(800px) rotate(-5deg); opacity: 0; }
        }
        @keyframes flow {
          0% { left: -300px; transform: translateX(0); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { left: 100%; transform: translateX(300px); opacity: 0; }
        }
        .portal-grid { position: relative; zIndex: 1; }
      `}</style>
    </div>
  );
};

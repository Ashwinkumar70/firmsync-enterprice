import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  User, Mail, Shield, Building2, Calendar, 
  MapPin, Phone, Briefcase, Globe, Edit2, Save, X
} from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      alert('Failed to update profile: ' + error.message);
    } else {
      await refreshUser();
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <PageWrapper pageTitle="My Profile">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your personal and organizational information</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
            <Edit2 size={14} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ Profile updated successfully!</div>}

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        {/* Left Col: Profile Basic Card */}
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent) 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', margin: '0 auto 20px',
            fontSize: 40, fontWeight: 800,
            boxShadow: '0 12px 32px rgba(59, 130, 246, 0.2)'
          }}>
            {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
          
          {isEditing ? (
            <input 
              className="form-input" 
              style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 10 }}
              value={formData.full_name}
              onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Your full name"
            />
          ) : (
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              {user.full_name || 'Employee Name'}
            </h2>
          )}
          
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1)}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Mail size={16} /> {user.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Building2 size={16} /> {user.department?.name || 'FirmSync Enterprise'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Calendar size={16} /> Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Right Col: Detailed Info Tabs/Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Organization Details */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Organizational Details</div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { label: 'Role', value: user.role, icon: <Shield size={16} /> },
                { label: 'Department', value: user.department?.name || 'FirmSync Enterprise', icon: <Briefcase size={16} /> },
                { label: 'Employee ID', value: user.employee_id_string || user.id.slice(0, 8), icon: <User size={16} /> },
                { label: 'Employment Status', value: user.is_active ? 'Active' : 'Inactive', icon: <CheckCircleIcon size={16} /> },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                    <span style={{ textTransform: item.label === 'Role' ? 'capitalize' : 'none' }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Contact Information</div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Work Email</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  <Mail size={16} style={{ color: 'var(--accent)' }} /> {user.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Contact Number</div>
                {isEditing ? (
                  <input 
                    className="form-input" 
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <Phone size={16} style={{ color: 'var(--accent)' }} /> {user.phone || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Location</div>
                {isEditing ? (
                  <input 
                    className="form-input" 
                    value={formData.location}
                    onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. London, UK"
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                    <MapPin size={16} style={{ color: 'var(--accent)' }} /> {user.location || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Timezone</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  <Globe size={16} style={{ color: 'var(--accent)' }} /> Indian Standard Time (IST)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .check-circle-icon { color: var(--success); }
      `}</style>
    </PageWrapper>
  );
};

const CheckCircleIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className="check-circle-icon"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

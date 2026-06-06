'use client';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export default function AccountSettingsPage() {
  const { user, token, logout } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    address: '',
    city: ''
  });

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/accounts/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.status === 401) {
          logout();
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          address: data.profile?.address || '',
          city: data.profile?.city || ''
        });
        setProfileLoading(false);
      })
      .catch(err => {
        console.error(err);
        setProfileLoading(false);
      });
    }
  }, [token, logout]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/accounts/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        throw new Error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
      }

      setMessage('আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>একাউন্ট সেটিংস</h2>
      
      {profileLoading ? (
        <p>লোড হচ্ছে...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {message && (
            <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: '500' }}>
              {message}
            </div>
          )}
          
          {error && (
            <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">প্রথম নাম</label>
              <input type="text" name="first_name" className="input" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="input-label">শেষ নাম</label>
              <input type="text" name="last_name" className="input" value={formData.last_name} onChange={handleChange} />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
              <input type="text" className="input" value={user.phone} disabled style={{ background: '#f8fafc', color: '#64748b' }} />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">ইমেইল ঠিকানা</label>
              <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">বিস্তারিত ঠিকানা</label>
              <textarea name="address" className="input" rows="3" value={formData.address} onChange={handleChange}></textarea>
            </div>
            
            <div className="input-group">
              <label className="input-label">শহর / জেলা</label>
              <input type="text" name="city" className="input" value={formData.city} onChange={handleChange} />
            </div>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সেভ করুন'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/accounts/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: phone, password })
        });
        
        if (!res.ok) {
          throw new Error('ফোন নম্বর বা পাসওয়ার্ড ভুল।');
        }
        
        const data = await res.json();
        
        // Use user data returned from the backend (includes name, phone, is_staff, is_superuser)
        const user = data.user || { 
          phone, 
          name: 'গ্রাহক',
          is_staff: false,
          is_superuser: false
        };
        login(user, data.access, data.refresh);
        router.push('/account');
        
      } else {
        // Register API Call
        const [firstName, ...lastNameArr] = name.split(' ');
        const lastName = lastNameArr.join(' ');
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/accounts/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password, first_name: firstName, last_name: lastName })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.phone ? errData.phone[0] : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
        }
        
        const data = await res.json();
        login(data.user, data.access, data.refresh);
        router.push('/account');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: '400px', margin: '0 auto', padding: '4rem 1rem' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
          {isLogin ? 'লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
        </h2>
        
        {error && (
          <div className="alert alert-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>আপনার নাম</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>মোবাইল নম্বর</label>
            <input 
              type="tel" 
              className="form-control" 
              required 
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>পাসওয়ার্ড</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'অপেক্ষা করুন...' : (isLogin ? 'লগইন' : 'রেজিস্টার')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {isLogin ? (
            <p>একাউন্ট নেই? <span onClick={() => setIsLogin(false)} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold' }}>রেজিস্টার করুন</span></p>
          ) : (
            <p>আগে থেকেই একাউন্ট আছে? <span onClick={() => setIsLogin(true)} style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold' }}>লগইন করুন</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

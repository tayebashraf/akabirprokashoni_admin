'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { normalizePhone, API_URL } from '@/lib/api';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    const usernameInput = normalizePhone(phone);
    if (!usernameInput) {
      setError(isLogin ? 'মোবাইল নম্বর অথবা ইমেইল আবশ্যক।' : 'মোবাইল নম্বর আবশ্যক।');
      return;
    }
    
    if (isLogin) {
      const isEmail = usernameInput.includes('@');
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(usernameInput)) {
          setError('সঠিক ইমেইল এড্রেস দিন।');
          return;
        }
      } else {
        if (usernameInput.length !== 11 || !/^\d+$/.test(usernameInput)) {
          setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
          return;
        }
      }
    } else {
      if (usernameInput.length !== 11 || !/^\d+$/.test(usernameInput)) {
        setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
        return;
      }
    }

    if (!password || password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('আপনার নাম আবশ্যক।');
      return;
    }

    setPhone(usernameInput);

    setLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const res = await fetch(`${API_URL}/accounts/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password })
        });
        
        if (!res.ok) {
          throw new Error('মোবাইল নম্বর বা পাসওয়ার্ড ভুল।');
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
        
        // Save to localStorage if rememberMe is selected
        if (typeof window !== 'undefined' && rememberMe) {
          localStorage.setItem('remember_phone', phone);
        }
        
        // Admin users go to admin panel on admin domains/localhost, regular users (and admins on main storefront) go to account
        const isClient = typeof window !== 'undefined';
        const isLocalhost = isClient && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const isVercelAdmin = isClient && (window.location.hostname.includes('admin') || window.location.hostname.includes('control') || window.location.hostname.includes('manager'));
        
        if ((user.is_staff || user.is_superuser) && (isVercelAdmin || isLocalhost)) {
          router.push('/tawhid');
        } else {
          router.push('/account');
        }
        
      } else {
        // Register API Call
        const [firstName, ...lastNameArr] = name.split(' ');
        const lastName = lastNameArr.join(' ');
        
        const res = await fetch(`${API_URL}/accounts/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: usernameInput, password, first_name: firstName, last_name: lastName })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.phone ? errData.phone[0] : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। মোবাইল নম্বরটি ইতিমধ্যে ব্যবহৃত হয়ে থাকতে পারে।');
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
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {isLogin ? 'লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
        </h2>
        
        {error && (
          <div className={styles.errorAlert}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>আপনার নাম</label>
              <input 
                type="text" 
                className={styles.formControl} 
                required 
                placeholder="যেমন: আরিয়ান রহমান"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {isLogin ? 'মোবাইল নম্বর অথবা ইমেইল' : 'মোবাইল নম্বর'}
            </label>
            <input 
              type={isLogin ? 'text' : 'tel'} 
              className={styles.formControl} 
              required 
              placeholder={isLogin ? 'যেমন: 01718XXXXXX বা admin@email.com' : 'যেমন: 01718XXXXXX'}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>পাসওয়ার্ড</label>
            <div className={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                className={styles.formControl} 
                required 
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'লুকান' : 'দেখুন'}
              </button>
            </div>
          </div>
          
          {isLogin && (
            <div className={styles.rememberRow}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)} 
                />
                <span>আমাকে মনে রাখুন</span>
              </label>
              <Link href={`/recover${phone.trim() ? `?phone=${normalizePhone(phone)}` : ''}`} className={styles.forgotLink}>
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
          )}
          
          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? 'প্রসেস করা হচ্ছে...' : (isLogin ? 'লগইন' : 'রেজিস্টার')}
          </button>
        </form>
        
        <div className={styles.switchText}>
          {isLogin ? (
            <p>একাউন্ট নেই? <span onClick={() => { setIsLogin(false); setError(''); }} className={styles.switchBtn}>রেজিস্টার করুন</span></p>
          ) : (
            <p>আগে থেকেই একাউন্ট আছে? <span onClick={() => { setIsLogin(true); setError(''); }} className={styles.switchBtn}>লগইন করুন</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

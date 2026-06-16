'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './recover.module.css';
import { normalizePhone, recoverAccount } from '@/lib/api';

export default function RecoverClient() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [orderId, setOrderId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  // Handle auto-populating phone number from URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const phoneParam = searchParams.get('phone');
      if (phoneParam) {
        setPhone(phoneParam);
      }
    }
  }, []);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = normalizePhone(phone);
    
    if (!normalized || normalized.length !== 11) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
      return;
    }

    setLoading(true);
    try {
      const data = await recoverAccount({ action: 'check_phone', phone: normalized });
      if (data.success) {
        setStep(2);
        setPhone(normalized); // Store normalized phone
      }
    } catch (err) {
      setError(err.message || 'এই ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('অ্যাকাউন্টে থাকা আপনার নামটি লিখুন।');
      return;
    }

    setLoading(true);
    try {
      const data = await recoverAccount({ 
        action: 'verify_name', 
        phone: phone, 
        name: name.trim() 
      });
      
      setSuccessMsg(data.message || 'যাচাইকরণ সফল হয়েছে। আপনাকে লগইন করানো হচ্ছে...');
      
      // Direct Login using JWT tokens
      setTimeout(() => {
        login(data.user, data.access, data.refresh);
        router.push('/account');
      }, 1500);

    } catch (err) {
      setError(err.message || 'আপনার প্রদান করা নামের সাথে রেজিস্টার্ড নামের মিল পাওয়া যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!orderId.trim()) {
      setError('সর্বশেষ অর্ডার আইডি দিন।');
      return;
    }

    setLoading(true);
    try {
      const data = await recoverAccount({ 
        action: 'verify_order', 
        phone: phone, 
        order_id: orderId.trim() 
      });
      
      setSuccessMsg(data.message || 'যাচাইকরণ সফল হয়েছে। আপনাকে লগইন করানো হচ্ছে...');
      
      // Direct Login using JWT tokens
      setTimeout(() => {
        login(data.user, data.access, data.refresh);
        router.push('/account');
      }, 1500);

    } catch (err) {
      setError(err.message || 'প্রদানকৃত অর্ডার আইডিটি সঠিক নয় বা এটি আপনার সর্বশেষ অর্ডার নয়।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>অ্যাকাউন্ট পুনরুদ্ধার</h2>
        <p className={styles.subtitle}>ওটিপি বা পাসওয়ার্ড ছাড়াই আপনার তথ্য দিয়ে একাউন্টে প্রবেশ করুন</p>
        
        {/* Progress Tracker */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLine}></div>
          <div 
            className={styles.progressLineActive} 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          ></div>
          
          <div className={`${styles.progressStep} ${step >= 1 ? styles.progressStepActive : ''} ${step > 1 ? styles.progressStepDone : ''}`}>
            {step > 1 ? '✓' : '১'}
          </div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.progressStepActive : ''} ${step > 2 ? styles.progressStepDone : ''}`}>
            {step > 2 ? '✓' : '২'}
          </div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.progressStepActive : ''}`}>
            ৩
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert} role="alert">
            <span>✅</span>
            <div>{successMsg}</div>
          </div>
        )}

        {/* Step 1: Phone Verification */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="phone-input" className={styles.formLabel}>আপনার মোবাইল নম্বর</label>
              <input 
                type="tel" 
                id="phone-input"
                className={styles.formControl}
                placeholder="যেমন: 01718XXXXXX"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading || !!successMsg}
              />
            </div>
            
            <div className={styles.btnGroup}>
              <button 
                type="submit" 
                id="submit-recover-btn"
                className={styles.submitBtn}
                disabled={loading || !!successMsg}
              >
                {loading ? 'অনুসন্ধান করা হচ্ছে...' : 'পরবর্তী ধাপ'}
              </button>
              <Link href="/login" id="back-login-btn" className={styles.backBtn}>
                লগইন পেজে ফিরে যান
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Name Verification */}
        {step === 2 && (
          <form onSubmit={handleNameSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name-input" className={styles.formLabel}>আপনার রেজিস্টার্ড নাম</label>
              <input 
                type="text" 
                id="name-input"
                className={styles.formControl}
                placeholder="নিবন্ধনের সময় দেওয়া আপনার নাম"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || !!successMsg}
                autoFocus
              />
            </div>
            
            <div className={styles.btnGroup}>
              <button 
                type="submit" 
                id="submit-recover-btn"
                className={styles.submitBtn}
                disabled={loading || !!successMsg}
              >
                {loading ? 'যাচাই করা হচ্ছে...' : 'যাচাই করে লগইন করুন'}
              </button>
              
              <button 
                type="button" 
                id="skip-name-btn"
                className={styles.skipBtn}
                onClick={() => {
                  setError('');
                  setStep(3);
                }}
                disabled={loading || !!successMsg}
              >
                আমি নাম মনে করতে পারছি না
              </button>

              <button 
                type="button" 
                className={styles.backBtn}
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                disabled={loading || !!successMsg}
              >
                পূর্ববর্তী ধাপে ফিরে যান
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Order ID Verification */}
        {step === 3 && (
          <form onSubmit={handleOrderSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="order-input" className={styles.formLabel}>সর্বশেষ অর্ডার আইডি</label>
              <input 
                type="text" 
                id="order-input"
                className={styles.formControl}
                placeholder="যেমন: AKB-XXXXXX বা XXXXXX"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loading || !!successMsg}
                autoFocus
              />
              <p className={styles.hintText}>
                💡 আপনার সর্বশেষ অর্ডারটি আপনার জিমেইলে অথবা আপনার মোবাইলের মেসেজ থেকে খুঁজে পাবেন।
              </p>
            </div>
            
            <div className={styles.btnGroup}>
              <button 
                type="submit" 
                id="submit-recover-btn"
                className={styles.submitBtn}
                disabled={loading || !!successMsg}
              >
                {loading ? 'যাচাই করা হচ্ছে...' : 'যাচাই করে লগইন করুন'}
              </button>
              
              <button 
                type="button" 
                className={styles.backBtn}
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
                disabled={loading || !!successMsg}
              >
                পূর্ববর্তী ধাপে ফিরে যান
              </button>
            </div>
          </form>
        )}

        {/* Alternatives Section */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>বিকল্প লগইন ও সাপোর্ট</span>
        </div>
        
        <div className={styles.altOptionsList}>
          <h4 className={styles.altHeading}>লগইন করতে সমস্যা হচ্ছে?</h4>
          
          <Link href="/track" id="track-order-btn" className={styles.altLink}>
            <span className={styles.trackIcon}>📦</span>
            <div>লগইন ছাড়াই মোবাইল দিয়ে অর্ডার ট্র্যাক করুন</div>
          </Link>
          
          <a 
            href={`https://wa.me/8801718763978?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি আকাবির প্রকাশনী অ্যাকাউন্টে লগইন করতে সমস্যা অনুভব করছি। আমার অ্যাকাউন্ট পুনরুদ্ধারে সাহায্য করুন।')}`}
            target="_blank" 
            rel="noopener noreferrer"
            id="whatsapp-chat-btn"
            className={styles.altLink}
          >
            <span className={styles.whatsappIcon}>💬</span>
            <div>সরাসরি কাস্টমার কেয়ার সাপোর্ট (হোয়াটসঅ্যাপ)</div>
          </a>
        </div>

      </div>
    </div>
  );
}

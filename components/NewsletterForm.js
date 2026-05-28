'use client';
import { useState } from 'react';
import styles from '../app/page.module.css';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1000);
  };

  return (
    <div>
      <form className={styles.newsletterForm} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="আপনার ইমেইল ঠিকানা"
          className={styles.newsletterInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status !== 'idle'}
          required
        />
        <button type="submit" className="btn btn-accent" disabled={status !== 'idle'}>
          {status === 'loading' ? 'অপেক্ষা করুন...' : 'সাবস্ক্রাইব'}
        </button>
      </form>
      
      {status === 'success' && (
        <div style={{ marginTop: '10px', color: '#10b981', fontSize: '0.9rem', fontWeight: '500', textAlign: 'center' }}>
          🎉 ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।
        </div>
      )}
    </div>
  );
}

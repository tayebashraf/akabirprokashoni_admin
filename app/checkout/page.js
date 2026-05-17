'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { districts } from '@/lib/data';
import styles from './page.module.css';
import { createOrder, getSiteSettings } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placedPhone, setPlacedPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [createAccount, setCreateAccount] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  
  const [defaultValues, setDefaultValues] = useState({
    name: '', phone: '', email: '', district: '', address: ''
  });
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSiteSettings(data);
    }).catch(console.error);
  }, []);

  let deliveryCharge = 60; // fallback
  if (siteSettings) {
    deliveryCharge = (defaultValues.district === 'Dhaka' || defaultValues.district === 'ঢাকা') 
      ? siteSettings.delivery_charge_dhaka 
      : siteSettings.delivery_charge_outside;
  }
  
  const discountAmount = appliedCoupon ? Math.floor(totalPrice * (appliedCoupon.discountPercent / 100)) : 0;
  const finalTotal = totalPrice - discountAmount + deliveryCharge;

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponMessage('');
    if (!couponCodeInput.trim()) {
      setCouponError('কুপন কোড দিন');
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/orders/validate-coupon/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCodeInput })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon({
          code: couponCodeInput,
          discountPercent: data.discount_percent
        });
        setCouponMessage(data.message);
      } else {
        setCouponError(data.error || 'কুপন প্রযোজ্য নয়');
      }
    } catch (err) {
      setCouponError('সার্ভার ত্রুটি, আবার চেষ্টা করুন');
    }
  };

  useEffect(() => {
    if (user) {
      setDefaultValues(prev => ({ ...prev, name: user.name || '', phone: user.phone || '', email: user.email || prev.email }));
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/accounts/profile/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.profile) {
            setDefaultValues(prev => ({
              ...prev,
              district: data.profile.city || prev.district,
              address: data.profile.address || prev.address
            }));
          }
        })
        .catch(err => console.error(err));
      }
    } else {
      const savedInfo = localStorage.getItem('akabir_saved_info');
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          setDefaultValues(parsed);
          setCreateAccount(true); // pre-check the save checkbox
        } catch (e) {}
      }
    }
  }, [user, token]);

  // Catch payment errors from URL on redirect back from SSLCommerz
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const orderData = {
      customer_name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || '',
      alt_phone: formData.get('alt_phone') || '',
      district: formData.get('district'),
      address: formData.get('address'),
      payment_method: paymentMethod,
      items: cart.map(item => ({ book_id: item.id, slug: item.slug, quantity: item.quantity })),
      coupon_code: appliedCoupon ? appliedCoupon.code : ''
    };

    if (!user && createAccount) {
      localStorage.setItem('akabir_saved_info', JSON.stringify({
        name: orderData.customer_name,
        phone: orderData.phone,
        email: orderData.email,
        district: orderData.district,
        address: orderData.address
      }));
    }

    try {
      const response = await createOrder(orderData);
      clearCart();
      
      // If the API returns a payment_url, redirect the user to SSLCommerz
      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        // Cash on delivery or fallback
        setOrderId(response.order_id);
        setPlacedPhone(orderData.phone);
        setOrderPlaced(true);
      }
    } catch (err) {
      setError(err.message || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderPlaced) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      const duration = 1.5 * 1000; // Reduced duration
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 20, spread: 360, ticks: 40, zIndex: 0 }; // Lighter effect
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 20 * (timeLeft / duration); // Fewer particles
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 300);
    }
  }, [orderPlaced]);

  if (orderPlaced) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1rem', color: 'var(--color-primary)' }}>
          সুখবর। আপনার অর্ডারটি সফলভাবে সাবমিট হয়েছে।
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          কিছুক্ষণের মধ্যেই আপনাকে ফোন দিয়ে অর্ডারটি নিশ্চিত করা হবে। ইনশাআল্লাহ।
        </p>
        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', display: 'inline-block', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>আপনার অর্ডার নাম্বার:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'var(--font-english)' }}>{orderId}</p>
        </div>
        
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
          অর্ডারটি ট্রাক করতে আপনার মোবাইল নাম্বার লিখে নিচে সার্চ করুন।
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/track?phone=${placedPhone}`} className="btn btn-primary btn-lg">অর্ডার ট্র্যাক করুন</Link>
          <Link href="/" className="btn btn-outline btn-lg">হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <h1>কার্ট খালি</h1>
        <Link href="/books" className="btn btn-primary" style={{ marginTop: '1rem' }}>বই দেখুন</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className={styles.pageTitle}>চেকআউট</h1>
      <form onSubmit={handleOrder} className={styles.checkoutGrid}>
        {/* Shipping Info */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>ডেলিভারি তথ্য</h2>
          
          {error && (
            <div className="alert alert-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}
          
          <div className={styles.formGrid}>
            <div className="input-group">
              <label className="input-label">পুরো নাম *</label>
              <input name="name" className="input" required placeholder="আপনার নাম" defaultValue={defaultValues.name} />
            </div>
            <div className="input-group">
              <label className="input-label">ইমেইল (ঐচ্ছিক)</label>
              <input name="email" type="email" className="input" placeholder="আপনার ইমেইল" defaultValue={defaultValues.email} />
            </div>
            <div className="input-group">
              <label className="input-label">মোবাইল নম্বর *</label>
              <input name="phone" className="input" required placeholder="01XXXXXXXXX" defaultValue={defaultValues.phone} />
            </div>
            <div className="input-group">
              <label className="input-label">বিকল্প মোবাইল নম্বর</label>
              <input name="alt_phone" className="input" placeholder="01XXXXXXXXX (ঐচ্ছিক)" />
            </div>
            <div className="input-group">
              <label className="input-label">জেলা *</label>
              <select name="district" className="input" required value={defaultValues.district} onChange={(e) => setDefaultValues({...defaultValues, district: e.target.value})}>
                <option value="">জেলা নির্বাচন করুন</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="input-label">সম্পূর্ণ ঠিকানা *</label>
            <textarea name="address" className="input" rows="3" required placeholder="বাড়ি, রোড, এলাকা, পোস্ট কোড" style={{ resize: 'vertical' }} defaultValue={defaultValues.address} />
          </div>
          
          {!user && (
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                <input 
                  type="checkbox" 
                  checked={createAccount} 
                  onChange={(e) => setCreateAccount(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                আমার তথ্য সেভ করুন (পরবর্তীতে এক ক্লিকে অর্ডারের জন্য)
              </label>
            </div>
          )}

          {/* Payment */}
          <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--space-8)' }}>পেমেন্ট মেথড</h2>
          <div className={styles.paymentMethods}>
            {[
              { id: 'cod', label: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন' },
              { id: 'bkash', label: 'বিকাশ', desc: 'বিকাশ মোবাইল ব্যাংকিং' },
              { id: 'nagad', label: 'নগদ', desc: 'নগদ মোবাইল ব্যাংকিং' },
              { id: 'card', label: 'কার্ড পেমেন্ট', desc: 'Visa / MasterCard' },
            ].map(method => (
              <label key={method.id} className={`${styles.paymentCard} ${paymentMethod === method.id ? styles.paymentActive : ''}`}>
                <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)} className={styles.paymentRadio} />
                <div>
                  <strong>{method.label}</strong>
                  <span>{method.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>📋 অর্ডার সামারি</h3>
            {cart.map(item => (
              <div key={item.id} className={styles.summaryItem}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '56px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '18px' }}>📖</div>
                    )}
                  </div>
                  <span>{item.title} × {item.quantity}</span>
                </div>
                <span>৳{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}><span>সাবটোটাল</span><span>৳{totalPrice.toLocaleString()}</span></div>
            <div className={styles.summaryRow}>
              <span>ডেলিভারি</span>
              <span style={{ color: deliveryCharge === 0 ? 'var(--color-success)' : '' }}>
                {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge}`}
              </span>
            </div>
            {appliedCoupon && (
              <div className={styles.summaryRow} style={{ color: 'var(--color-success)' }}>
                <span>ডিসকাউন্ট ({appliedCoupon.discountPercent}%)</span>
                <span>- ৳{discountAmount}</span>
              </div>
            )}
            
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="প্রোমো কোড (যদি থাকে)" 
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  disabled={appliedCoupon}
                />
                {!appliedCoupon ? (
                  <button type="button" onClick={handleApplyCoupon} className="btn btn-primary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>এপ্লাই</button>
                ) : (
                  <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCodeInput(''); setCouponMessage(''); }} className="btn btn-outline" style={{ padding: '0 16px', color: '#e74c3c', borderColor: '#e74c3c' }}>বাতিল</button>
                )}
              </div>
              {couponError && <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px' }}>{couponError}</div>}
              {couponMessage && <div style={{ color: '#27ae60', fontSize: '0.85rem', marginTop: '4px' }}>{couponMessage}</div>}
            </div>
            
            <div className={styles.summaryDivider} />
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>সর্বমোট</span><span>৳{finalTotal.toLocaleString()}</span>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', lineHeight: '1.5', textAlign: 'center' }}>
              💡 পরবর্তীতে সহজে অর্ডার ট্র্যাক করার জন্য আপনার দেওয়া নাম্বার দিয়ে একটি একাউন্ট তৈরি করা হবে।
            </p>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              {loading ? 'প্রসেস হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

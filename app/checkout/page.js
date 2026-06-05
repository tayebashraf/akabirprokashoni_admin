'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import bdGeodata from '@/lib/bdGeodata.json';
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
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [createAccount, setCreateAccount] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  
  const [defaultValues, setDefaultValues] = useState({
    name: '', phone: '', email: '', district: '', thana: '', address: ''
  });
  const [siteSettings, setSiteSettings] = useState(null);

  // Refs for each form field
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const districtRef = useRef(null);
  const thanaRef = useRef(null);
  const addressRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    getSiteSettings().then(data => {
      if (data) setSiteSettings(data);
    }).catch(console.error);
  }, []);

  // Calculate total weight in kg
  const totalWeightGrams = cart.reduce((sum, item) => sum + (item.weight || 300) * item.quantity, 0);
  const totalWeightKg = totalWeightGrams / 1000.0;
  const extraKg = Math.max(0, Math.floor(totalWeightKg) - 1 + (totalWeightKg % 1 > 0 && totalWeightKg > 1 ? 1 : 0));

  let deliveryCharge = 60; // fallback
  if (siteSettings) {
    const isDhaka = (defaultValues.district === 'Dhaka' || defaultValues.district === 'ঢাকা');
    const baseCharge = isDhaka ? siteSettings.delivery_charge_dhaka : siteSettings.delivery_charge_outside;
    const extraChargePerKg = isDhaka ? (siteSettings.extra_charge_per_kg_dhaka || 15) : (siteSettings.extra_charge_per_kg_outside || 20);
    
    deliveryCharge = baseCharge + (extraKg * extraChargePerKg);
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
      setDefaultValues(prev => ({ 
        ...prev, 
        name: user.name || '', 
        phone: (user.phone && /^01[3-9]\d{8}$/.test(user.phone)) ? user.phone : '', 
        email: user.email || prev.email 
      }));
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
          setCreateAccount(true);
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

  // Custom validation
  const validateForm = (formData) => {
    const errors = {};
    const name = formData.get('name')?.trim();
    const phone = formData.get('phone')?.trim();
    const district = formData.get('district')?.trim();
    const address = formData.get('address')?.trim();

    if (!name) errors.name = 'আপনার নাম লিখুন';
    if (!phone) {
      errors.phone = 'মোবাইল নম্বর লিখুন';
    } else if (!/^01[3-9]\d{8}$/.test(phone)) {
      errors.phone = 'সঠিক মোবাইল নম্বর লিখুন (01XXXXXXXXX)';
    }
    if (!district) errors.district = 'জেলা নির্বাচন করুন';
    
    // Check if thana is required (if district has thanas)
    if (district && bdGeodata[district]) {
      const thana = formData.get('thana')?.trim();
      if (!thana) errors.thana = 'থানা/উপজেলা নির্বাচন করুন';
    }

    if (!address) errors.address = 'আপনার ঠিকানা লিখুন';

    return errors;
  };

  // Scroll to first error field
  const scrollToFirstError = (errors) => {
    const fieldOrder = ['name', 'phone', 'district', 'thana', 'address'];
    const refMap = { name: nameRef, phone: phoneRef, district: districtRef, thana: thanaRef, address: addressRef };
    
    for (const field of fieldOrder) {
      if (errors[field] && refMap[field]?.current) {
        refMap[field].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the input after scroll
        setTimeout(() => {
          const input = refMap[field].current.querySelector('input, select, textarea');
          if (input) input.focus();
        }, 400);
        break;
      }
    }
  };

  // Clear individual field error on change
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    
    const formData = new FormData(e.target);
    
    // Validate
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      scrollToFirstError(errors);
      return;
    }
    
    // Combine Village and Thana for the final address string
    const rawAddress = formData.get('address');
    const selectedThana = formData.get('thana');
    const finalAddress = selectedThana ? `${rawAddress}, ${selectedThana}` : rawAddress;

    const orderData = {
      customer_name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || '',
      alt_phone: formData.get('alt_phone') || '',
      district: formData.get('district'),
      address: finalAddress,
      customer_note: formData.get('customer_note') || '',
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
        thana: selectedThana,
        address: rawAddress
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
      
      const duration = 1.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 20, spread: 360, ticks: 40, zIndex: 0 };
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 20 * (timeLeft / duration);
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
      <form ref={formRef} onSubmit={handleOrder} className={styles.checkoutGrid} noValidate>
        {/* Shipping Info */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ডেলিভারি তথ্য
          </h2>
          
          {error && (
            <div className={styles.alertError}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              {error}
            </div>
          )}
          
          <div className={styles.formGrid}>
            {/* Name */}
            <div className={styles.formField} ref={nameRef}>
              <label className={styles.fieldLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                পুরো নাম <span className={styles.required}>*</span>
              </label>
              <input 
                name="name" 
                className={`${styles.fieldInput} ${fieldErrors.name ? styles.fieldInputError : ''}`} 
                placeholder="আপনার পূর্ণ নাম লিখুন" 
                defaultValue={defaultValues.name}
                onChange={() => clearFieldError('name')}
              />
              {fieldErrors.name && <span className={styles.fieldErrorMsg}>{fieldErrors.name}</span>}
            </div>

            {/* Email */}
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                ইমেইল <span style={{ color: '#94a3b8', fontSize: '12px' }}>(ঐচ্ছিক)</span>
              </label>
              <input name="email" type="email" className={styles.fieldInput} placeholder="example@email.com" defaultValue={defaultValues.email} />
            </div>

            {/* Phone */}
            <div className={styles.formField} ref={phoneRef}>
              <label className={styles.fieldLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                মোবাইল নম্বর <span className={styles.required}>*</span>
              </label>
              <input 
                name="phone" 
                className={`${styles.fieldInput} ${fieldErrors.phone ? styles.fieldInputError : ''}`} 
                placeholder="01XXXXXXXXX" 
                defaultValue={defaultValues.phone}
                onChange={() => clearFieldError('phone')}
              />
              {fieldErrors.phone && <span className={styles.fieldErrorMsg}>{fieldErrors.phone}</span>}
            </div>

            {/* Alt Phone */}
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                বিকল্প মোবাইল <span style={{ color: '#94a3b8', fontSize: '12px' }}>(ঐচ্ছিক)</span>
              </label>
              <input name="alt_phone" className={styles.fieldInput} placeholder="01XXXXXXXXX" />
            </div>

            {/* District */}
            <div className={styles.formField} ref={districtRef}>
              <label className={styles.fieldLabel}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                জেলা <span className={styles.required}>*</span>
              </label>
              <select 
                name="district" 
                className={`${styles.fieldInput} ${fieldErrors.district ? styles.fieldInputError : ''}`}
                value={defaultValues.district} 
                onChange={(e) => {
                  setDefaultValues({...defaultValues, district: e.target.value, thana: ''});
                  clearFieldError('district');
                }}
              >
                <option value="">জেলা নির্বাচন করুন</option>
                {Object.keys(bdGeodata).sort().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {fieldErrors.district && <span className={styles.fieldErrorMsg}>{fieldErrors.district}</span>}
            </div>

            {/* Thana */}
            {defaultValues.district && bdGeodata[defaultValues.district] && (
              <div className={styles.formField} ref={thanaRef}>
                <label className={styles.fieldLabel}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  থানা / উপজেলা <span className={styles.required}>*</span>
                </label>
                <select 
                  name="thana" 
                  className={`${styles.fieldInput} ${fieldErrors.thana ? styles.fieldInputError : ''}`}
                  value={defaultValues.thana} 
                  onChange={(e) => {
                    setDefaultValues({...defaultValues, thana: e.target.value});
                    clearFieldError('thana');
                  }}
                >
                  <option value="">থানা নির্বাচন করুন</option>
                  {bdGeodata[defaultValues.district].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {fieldErrors.thana && <span className={styles.fieldErrorMsg}>{fieldErrors.thana}</span>}
              </div>
            )}
          </div>

          {/* Address */}
          <div className={styles.formField} ref={addressRef} style={{ marginTop: 'var(--space-4)' }}>
            <label className={styles.fieldLabel}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              গ্রাম / এলাকা / বাড়ির ঠিকানা <span className={styles.required}>*</span>
            </label>
            <textarea 
              name="address" 
              className={`${styles.fieldInput} ${styles.fieldTextarea} ${fieldErrors.address ? styles.fieldInputError : ''}`}
              rows="2" 
              placeholder="বাড়ি নং, রোড নং, গ্রাম/মহল্লা, পোস্ট অফিস" 
              defaultValue={defaultValues.address}
              onChange={() => clearFieldError('address')}
            />
            {fieldErrors.address && <span className={styles.fieldErrorMsg}>{fieldErrors.address}</span>}
          </div>
          
          {/* Customer Note */}
          <div className={styles.formField} style={{ marginTop: 'var(--space-4)' }}>
            <label className={styles.fieldLabel}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              অতিরিক্ত নির্দেশনা <span style={{ color: '#94a3b8', fontSize: '12px' }}>(ঐচ্ছিক)</span>
            </label>
            <textarea 
              name="customer_note" 
              className={`${styles.fieldInput} ${styles.fieldTextarea}`}
              rows="2" 
              placeholder="বই প্যাকেট করার কোনো বিশেষ নির্দেশনা থাকলে লিখতে পারেন..." 
            />
          </div>
          
          {!user && (
            <div className={styles.saveInfoBox}>
              <label className={styles.saveInfoLabel}>
                <input 
                  type="checkbox" 
                  checked={createAccount} 
                  onChange={(e) => setCreateAccount(e.target.checked)} 
                  className={styles.saveInfoCheckbox}
                />
                আমার তথ্য সেভ করুন (পরবর্তীতে এক ক্লিকে অর্ডারের জন্য)
              </label>
            </div>
          )}

          {/* Payment */}
          <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--space-8)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            পেমেন্ট মেথড
          </h2>
          <div className={styles.paymentMethods}>
            <label className={`${styles.paymentCard} ${paymentMethod === 'cod' ? styles.paymentActive : ''}`}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className={styles.paymentRadio} />
              <div>
                <strong>ক্যাশ অন ডেলিভারি</strong>
                <span>পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</span>
              </div>
            </label>

            <label className={`${styles.paymentCard} ${paymentMethod === 'bkash' ? styles.paymentActive : ''}`}>
              <input type="radio" name="payment" value="bkash" checked={paymentMethod === 'bkash'} onChange={() => setPaymentMethod('bkash')} className={styles.paymentRadio} />
              <div>
                <strong>bKash</strong>
                <span>নিরাপদে বিকাশ পেমেন্ট করুন</span>
              </div>
            </label>

            <label className={`${styles.paymentCard} ${paymentMethod === 'nagad' ? styles.paymentActive : ''}`}>
              <input type="radio" name="payment" value="nagad" checked={paymentMethod === 'nagad'} onChange={() => setPaymentMethod('nagad')} className={styles.paymentRadio} />
              <div>
                <strong>Nagad</strong>
                <span>নিরাপদে নগদ পেমেন্ট করুন</span>
              </div>
            </label>
            
            <label className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.paymentActive : ''}`}>
              <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className={styles.paymentRadio} />
              <div>
                <strong>Cards (Visa/Mastercard)</strong>
                <span>ডেবিট বা ক্রেডিট কার্ড পেমেন্ট</span>
              </div>
            </label>
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
                  className={styles.fieldInput}
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
              💡 পরবর্তীতে সহজে অর্ডার ট্র্যাক করার জন্য আপনার দেওয়া নাম্বার দিয়ে একটি একাউন্ট তৈরি করা হবে।
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

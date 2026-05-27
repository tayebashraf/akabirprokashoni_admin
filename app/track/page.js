'use client';
import { useState, useEffect } from 'react';
import { orderStatuses } from '@/lib/data';
import styles from './page.module.css';
import { trackOrdersByPhone } from '@/lib/api';

export default function TrackPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prepopulate phone number if passed in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrders([]);
    try {
      const data = await trackOrdersByPhone(phone);
      if (data && data.length > 0) {
        setOrders(data);
      } else {
        setError('এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি।');
      }
    } catch (err) {
      setError('সার্ভার থেকে ডেটা আনতে সমস্যা হচ্ছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <h1 className={styles.pageTitle}>📦 অর্ডার ট্র্যাক করুন</h1>

      <div className={styles.searchBox}>
        <form onSubmit={handleTrack} className={styles.searchForm}>
          <input
            type="text"
            required
            placeholder="আপনার মোবাইল নাম্বার দিন (যেমন: 01XXXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক করুন'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--color-error)', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
      </div>

      {orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>আপনার পূর্ববর্তী অর্ডারসমূহ</h2>
          {orders.map((order) => (
            <div key={order.order_id} className={styles.resultCard}>
              {/* Header section (Order ID, Date, Status) */}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>অর্ডার নাম্বার</span>
                <strong className={`${styles.infoValue} ${styles.eng}`}>#{order.order_id}</strong>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>তারিখ</span>
                <strong className={styles.infoValue}>{new Date(order.created_at).toLocaleDateString('bn-BD')}</strong>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>স্ট্যাটাস</span>
                {(() => {
                  if (order.steadfast_status && order.steadfast_status !== 'Unknown') {
                    const status = order.steadfast_status.toLowerCase();
                    let badgeConfig = { text: '🚚 ডেলিভারির পথে', color: '#3498db', bg: '#ebf5fb' };
                    if (status.includes('deliver')) {
                      badgeConfig = { text: '✅ ডেলিভারি সম্পন্ন', color: '#27ae60', bg: '#eaeded' };
                    } else if (status.includes('cancel')) {
                      badgeConfig = { text: '❌ বাতিল করা হয়েছে', color: '#c0392b', bg: '#f9ebea' };
                    } else if (status.includes('return')) {
                      badgeConfig = { text: '🔄 রিটার্ন হচ্ছে', color: '#d35400', bg: '#fdf2e9' };
                    } else if (status.includes('pending')) {
                      badgeConfig = { text: '🕒 প্রসেসিং হচ্ছে', color: '#f39c12', bg: '#fef5e7' };
                    }
                    return (
                      <span style={{ 
                        color: badgeConfig.color, 
                        background: badgeConfig.bg, 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold', 
                        fontSize: '0.95rem',
                        display: 'inline-block'
                      }}>
                        {badgeConfig.text} (SteadFast)
                      </span>
                    );
                  }
                  return (
                    <span className={styles.statusBadge}>
                      📌 {order.status_display}
                    </span>
                  );
                })()}
              </div>

              {/* Books */}
              <div style={{ marginTop: '1rem', borderTop: '2px solid var(--color-border)', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>অর্ডারকৃত বই</h3>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.bookItem}>
                    <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0 0 0.5rem 0' }}>
                      <span className={styles.infoLabel}>বইয়ের নাম</span>
                      <div className={styles.infoValue} style={{ maxWidth: '60%' }}>
                        {item.book_title}
                        {item.author_name && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>{item.author_name}</div>}
                      </div>
                    </div>
                    
                    <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0 0 0.5rem 0' }}>
                      <span className={styles.infoLabel}>পরিমাণ</span>
                      <strong className={styles.infoValue}>{item.quantity} কপি</strong>
                    </div>
                    
                    <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0' }}>
                      <span className={styles.infoLabel}>মূল্য</span>
                      <strong className={`${styles.infoValue} ${styles.eng}`}>৳{item.price} × {item.quantity} = ৳{item.line_total || (item.price * item.quantity)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className={styles.infoRow} style={{ marginTop: '1rem' }}>
                <span className={styles.infoLabel}>ডেলিভারি চার্জ</span>
                <strong className={`${styles.infoValue} ${styles.eng}`}>৳{order.delivery_charge}</strong>
              </div>

              <div className={styles.infoRow} style={{ borderBottom: '2px solid var(--color-primary)', borderTop: 'none', paddingBottom: '1rem' }}>
                <strong className={styles.infoLabel} style={{ color: 'var(--color-text)', fontSize: '1.2rem' }}>সর্বমোট</strong>
                <strong className={`${styles.infoValue} ${styles.eng}`} style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>৳{order.total}</strong>
              </div>

              {/* Delivery Info */}
              <div className={styles.deliverySection}>
                <h3>📍 ডেলিভারি ঠিকানা</h3>
                <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0' }}>
                  <span className={styles.infoLabel}>নাম</span>
                  <strong className={styles.infoValue}>{order.customer_name}</strong>
                </div>
                <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0' }}>
                  <span className={styles.infoLabel}>মোবাইল</span>
                  <strong className={`${styles.infoValue} ${styles.eng}`}>{order.phone}</strong>
                </div>
                {order.email && (
                  <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0' }}>
                    <span className={styles.infoLabel}>ইমেইল</span>
                    <strong className={styles.infoValue} style={{ wordBreak: 'break-all' }}>{order.email}</strong>
                  </div>
                )}
                <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0' }}>
                  <span className={styles.infoLabel}>জেলা</span>
                  <strong className={styles.infoValue}>{order.district}</strong>
                </div>
                <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0' }}>
                  <span className={styles.infoLabel}>ঠিকানা</span>
                  <strong className={styles.infoValue} style={{ maxWidth: '65%' }}>{order.address}</strong>
                </div>
                <div className={styles.infoRow} style={{ borderBottom: 'none', padding: '0.25rem 0', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <span className={styles.infoLabel}>পেমেন্ট মেথড</span>
                  <strong className={styles.infoValue}>{order.payment_display}</strong>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

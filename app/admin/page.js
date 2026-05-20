'use client';
import { useState, useEffect } from 'react';
import { getAdminDashboardStats, getAdminOrders } from '@/lib/api';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await getAdminDashboardStats();
        setStats(statsData);
        
        const ordersData = await getAdminOrders();
        setRecentOrders((ordersData.results || []).slice(0, 5));
      } catch (err) {
        console.error(err);
        setError('ড্যাশবোর্ড ডাটা লোড করতে ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'অপেক্ষমাণ';
      case 'confirmed': return 'নিশ্চিতকৃত';
      case 'packaging': return 'প্যাকেজিং';
      case 'shipped': return 'শিপড';
      case 'delivered': return 'ডেলিভারড';
      case 'returned': return 'রিটার্ন';
      case 'cancelled': return 'বাতিল';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return styles.statusPending;
      case 'confirmed': 
      case 'packaging':
        return styles.statusConfirmed;
      case 'shipped': 
      case 'delivered':
        return styles.statusShipped;
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>ড্যাশবোর্ড লোড হচ্ছে...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
        <h2>⚠️ {error}</h2>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>📊 ড্যাশবোর্ড ওভারভিউ</h1>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>৳ {(stats?.revenue?.today || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>আজকের সেলস</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.orders?.today || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>আজকের নতুন অর্ডার</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🚚</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.orders?.pending || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>অপেক্ষমাণ ডেলিভারি</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.catalog?.total_users || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>মোট গ্রাহক</span>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className={styles.sectionsGrid}>
        {/* Recent Orders */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>সাম্প্রতিক অর্ডারসমূহ</h2>
          <div className={styles.orderList}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                কোন অর্ডার পাওয়া যায়নি।
              </div>
            ) : (
              recentOrders.map(order => (
                <div key={order.order_id} className={styles.orderItem}>
                  <div>
                    <div className={styles.orderId}>{order.order_id}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatDate(order.created_at)}</div>
                  </div>
                  <div style={{ fontWeight: '700' }}>৳ {order.total}</div>
                  <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
              ))
            )}
          </div>
          <a href="/admin/orders" className="btn btn-outline" style={{ width: '100%', marginTop: 'var(--space-4)', display: 'block', textAlign: 'center' }}>
            সব অর্ডার দেখুন →
          </a>
        </div>

        {/* Quick Actions / Notifications */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>নোটিফিকেশন ও অ্যালার্ট</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            
            {/* Out of Stock alert */}
            {stats?.catalog?.out_of_stock > 0 && (
              <div style={{ padding: 'var(--space-3)', background: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: '4px' }}>
                <strong style={{ display: 'block', color: '#991B1B' }}>🚨 স্টক আউট অ্যালার্ট</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: '#7F1D1D' }}>
                  বর্তমানে <strong>{stats.catalog.out_of_stock}টি</strong> বইয়ের কোন স্টক নেই।
                </span>
              </div>
            )}

            {/* Low stock list */}
            {stats?.low_stock_alerts && stats.low_stock_alerts.length > 0 ? (
              <div style={{ padding: 'var(--space-3)', background: '#FFFBEB', borderLeft: '4px solid #F59E0B', borderRadius: '4px' }}>
                <strong style={{ display: 'block', color: '#92400E', marginBottom: '0.25rem' }}>⚠️ লো স্টক অ্যালার্ট ({stats.catalog?.low_stock || 0})</strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: 'var(--text-sm)', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {stats.low_stock_alerts.slice(0, 5).map(book => (
                    <li key={book.id}>
                      {book.title} (স্টক: {book.stock})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-3)', background: '#F0FDF4', borderLeft: '4px solid #22C55E', borderRadius: '4px' }}>
                <strong style={{ display: 'block', color: '#166534' }}>✅ স্টক স্ট্যাটাস</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: '#14532D' }}>সব বইয়ের পর্যাপ্ত স্টক রয়েছে!</span>
              </div>
            )}

            {/* General welcome notification */}
            <div style={{ padding: 'var(--space-3)', background: '#ECFCCB', borderLeft: '4px solid #84CC16', borderRadius: '4px' }}>
              <strong style={{ display: 'block', color: '#3F6212' }}>🎉 সিস্টেম কানেকশন</strong>
              <span style={{ fontSize: 'var(--text-sm)', color: '#4D7C0F' }}>
                Django REST API সফলভাবে কানেক্টেড এবং সচল আছে।
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

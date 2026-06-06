'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAdminDashboardStats, getAdminOrders, getAdminSteadfastBalance } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from './page.module.css';

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  packaging: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#10B981',
  returned: '#6B7280',
  cancelled: '#EF4444',
};

const STATUS_LABELS = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিতকৃত',
  packaging: 'প্যাকেজিং',
  shipped: 'শিপড',
  delivered: 'ডেলিভারড',
  returned: 'রিটার্ন',
  cancelled: 'বাতিল',
};

const STATUS_STYLE_MAP = {
  pending: 'statusPending',
  confirmed: 'statusConfirmed',
  packaging: 'statusConfirmed',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  returned: 'statusReturned',
  cancelled: 'statusCancelled',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.97)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0D6B3F' }}>
          ৳{payload[0].value.toLocaleString('bn-BD')}
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [steadfastBalance, setSteadfastBalance] = useState(null);
  const [readOrderIds, setReadOrderIds] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('read_order_ids');
        if (stored) {
          setReadOrderIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const markAsRead = (orderId) => {
    if (!readOrderIds.includes(orderId)) {
      const updated = [...readOrderIds, orderId];
      setReadOrderIds(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('read_order_ids', JSON.stringify(updated));
      }
    }
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsData, ordersData, balanceData] = await Promise.all([
        getAdminDashboardStats(),
        getAdminOrders(),
        getAdminSteadfastBalance().catch(() => ({ balance: 'Error' })) // Don't fail the whole dashboard if Steadfast API is down
      ]);
      setStats(statsData);
      setRecentOrders((ordersData.results || []).slice(0, 6));
      if (balanceData && balanceData.balance !== undefined) {
        setSteadfastBalance(balanceData.balance);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('ড্যাশবোর্ড ডাটা লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusClass = (status) => {
    return styles[STATUS_STYLE_MAP[status]] || '';
  };

  const getStatusText = (status) => STATUS_LABELS[status] || status;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('bn-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatChartDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>ড্যাশবোর্ড লোড হচ্ছে...</div>
      </div>
    );
  }

  // --- Error State ---
  if (error && !stats) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorText}>{error}</div>
        <button
          className={styles.refreshBtn}
          onClick={() => { setLoading(true); loadData(); }}
        >
          🔄 আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // Prepare chart data with formatted dates
  const chartData = (stats?.revenue?.daily_chart || []).map(d => ({
    ...d,
    dateLabel: formatChartDate(d.date)
  }));

  // Pie chart data
  const pieData = stats?.orders?.status_breakdown
    ? Object.entries(stats.orders.status_breakdown).map(([k, v]) => ({
        name: STATUS_LABELS[k] || k,
        value: v,
        color: STATUS_COLORS[k] || '#999',
        key: k,
      }))
    : [];

  return (
    <div className={styles.dashboard}>
      {/* ===== Header ===== */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>📊</span>
            ড্যাশবোর্ড ওভারভিউ
          </h1>
          <span className={styles.subtitle}>আকাবির প্রকাশনী ম্যানেজমেন্ট সিস্টেম</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTag}>
            📅 {getTodayDate()}
          </div>
          <button
            className={styles.refreshBtn}
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? styles.refreshBtnSpin : ''}>🔄</span>
            {refreshing ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}
          </button>
        </div>
      </div>

      {/* ===== Main Stats Grid ===== */}
      <div className={styles.statsGrid}>
        {/* Revenue Card */}
        <Link href="/admin/daily-sales" className={`${styles.statCard} ${styles.statCardRevenue}`} style={{ textDecoration: 'none' }}>
          <div className={`${styles.statIcon} ${styles.statIconRevenue}`}>💰</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>৳{(stats?.revenue?.today || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>আজকের সেলস</span>
            <span className={`${styles.statTrend} ${styles.trendUp}`}>
              📈 সাপ্তাহিক: ৳{(stats?.revenue?.this_week || 0).toLocaleString('bn-BD')}
            </span>
          </div>
        </Link>

        {/* Orders Card */}
        <Link href="/admin/orders" className={`${styles.statCard} ${styles.statCardOrders}`} style={{ textDecoration: 'none' }}>
          <div className={`${styles.statIcon} ${styles.statIconOrders}`}>📦</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.orders?.today || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>আজকের নতুন অর্ডার</span>
            <span className={`${styles.statTrend} ${styles.trendNeutral}`}>
              📋 মোট: {(stats?.orders?.total || 0).toLocaleString('bn-BD')}
            </span>
          </div>
        </Link>

        {/* Pending Card */}
        <Link href="/admin/orders?filter=pending" className={`${styles.statCard} ${styles.statCardPending}`} style={{ textDecoration: 'none' }}>
          <div className={`${styles.statIcon} ${styles.statIconPending}`}>🚚</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.orders?.pending || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>অপেক্ষমাণ ডেলিভারি</span>
            {(stats?.orders?.pending || 0) > 0 && (
              <span className={`${styles.statTrend} ${styles.trendDown}`}>
                ⏳ দ্রুত প্রসেস করুন
              </span>
            )}
          </div>
        </Link>

        {/* Customers Card */}
        <Link href="/admin/customers" className={`${styles.statCard} ${styles.statCardCustomers}`} style={{ textDecoration: 'none' }}>
          <div className={`${styles.statIcon} ${styles.statIconCustomers}`}>👥</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>{(stats?.catalog?.total_users || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.statLabel}>মোট গ্রাহক</span>
            <span className={`${styles.statTrend} ${styles.trendUp}`}>
              🎉 নিবন্ধিত ব্যবহারকারী
            </span>
          </div>
        </Link>

        {/* Steadfast Balance Card */}
        <Link href="/admin/settings" className={styles.statCard} style={{ '--card-accent': '#FF5722', textDecoration: 'none' }}>
          <div className={`${styles.statIcon}`} style={{ background: '#FFECE5', color: '#FF5722' }}>🚚</div>
          <div className={styles.statInfo}>
            <span className={styles.statNum}>
              {steadfastBalance !== null ? (steadfastBalance === 'Error' ? 'এরর' : `৳${steadfastBalance.toLocaleString('bn-BD')}`) : 'লোড হচ্ছে...'}
            </span>
            <span className={styles.statLabel}>Steadfast ব্যালেন্স</span>
            <span className={`${styles.statTrend} ${styles.trendNeutral}`}>
              কুরিয়ার পেমেন্ট
            </span>
          </div>
        </Link>
      </div>

      {/* ===== Quick Stats Row ===== */}
      <div className={styles.quickStatsRow}>
        <div className={styles.quickStat}>
          <div className={styles.quickStatIcon} style={{ background: '#ecfdf5' }}>📚</div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{(stats?.catalog?.total_books || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.quickStatLabel}>মোট বই</span>
          </div>
        </div>
        <div className={styles.quickStat}>
          <div className={styles.quickStatIcon} style={{ background: '#fef3c7' }}>✍️</div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{(stats?.catalog?.total_authors || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.quickStatLabel}>মোট লেখক</span>
          </div>
        </div>
        <div className={styles.quickStat}>
          <div className={styles.quickStatIcon} style={{ background: '#ede9fe' }}>📂</div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{(stats?.catalog?.total_categories || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.quickStatLabel}>মোট ক্যাটাগরি</span>
          </div>
        </div>
        <div className={styles.quickStat}>
          <div className={styles.quickStatIcon} style={{ background: '#fef2f2' }}>⭐</div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{(stats?.reviews?.pending || 0).toLocaleString('bn-BD')}</span>
            <span className={styles.quickStatLabel}>পেন্ডিং রিভিউ</span>
          </div>
        </div>
      </div>

      {/* ===== Recent Orders + Alerts ===== */}
      <div className={styles.sectionsGrid}>
        {/* Recent Orders */}
        <div className={styles.card} style={{ '--delay': '0.35s' }}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleIcon} style={{ background: '#ecfdf5' }}>📋</span>
            সাম্প্রতিক অর্ডারসমূহ
          </h2>
          <div className={styles.orderList}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                কোন অর্ডার পাওয়া যায়নি।
              </div>
            ) : (
              recentOrders.map(order => {
                const isNew = !readOrderIds.includes(order.order_id);
                return (
                  <div 
                    key={order.order_id} 
                    className={styles.orderItem}
                    onClick={() => {
                      markAsRead(order.order_id);
                      window.location.href = `/admin/orders?search=${order.order_id}`;
                    }}
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: isNew ? '4px solid #ef4444' : '1px solid transparent',
                      background: isNew ? '#ecfdf5' : '#fafbfc'
                    }}
                  >
                    <div className={styles.orderItemLeft}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className={styles.orderId}>{order.order_id}</div>
                        {isNew && <span className={styles.newIndicator}>NEW</span>}
                      </div>
                      <div className={styles.orderDate}>{formatDate(order.created_at)}</div>
                    </div>
                    <div className={styles.orderAmount}>৳{order.total}</div>
                    <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Link href="/admin/orders" className={styles.viewAllBtn}>
            সব অর্ডার দেখুন
            <span>→</span>
          </Link>
        </div>

        {/* Notifications & Alerts */}
        <div className={styles.card} style={{ '--delay': '0.45s' }}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleIcon} style={{ background: '#fef3c7' }}>🔔</span>
            নোটিফিকেশন ও অ্যালার্ট
          </h2>
          <div className={styles.alertsContainer}>
            {/* Out of Stock */}
            {stats?.catalog?.out_of_stock > 0 && (
              <div className={`${styles.alertCard} ${styles.alertDanger}`}>
                <span className={styles.alertIcon}>🚨</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>স্টক আউট অ্যালার্ট</div>
                  <div className={styles.alertText}>
                    বর্তমানে <strong>{stats.catalog.out_of_stock}টি</strong> বইয়ের কোন স্টক নেই।
                  </div>
                </div>
              </div>
            )}

            {/* Low Stock */}
            {stats?.low_stock_alerts && stats.low_stock_alerts.length > 0 ? (
              <div className={`${styles.alertCard} ${styles.alertWarning}`}>
                <span className={styles.alertIcon}>⚠️</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>
                    লো স্টক অ্যালার্ট ({stats.catalog?.low_stock || 0}টি বই)
                  </div>
                  <ul className={styles.lowStockList}>
                    {stats.low_stock_alerts.slice(0, 5).map(book => (
                      <li key={book.id} className={styles.lowStockItem}>
                        {book.title} — <strong>স্টক: {book.stock}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className={`${styles.alertCard} ${styles.alertSuccess}`}>
                <span className={styles.alertIcon}>✅</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>স্টক স্ট্যাটাস</div>
                  <div className={styles.alertText}>সব বইয়ের পর্যাপ্ত স্টক রয়েছে!</div>
                </div>
              </div>
            )}

            {/* Pending Reviews */}
            {(stats?.reviews?.pending || 0) > 0 && (
              <div className={`${styles.alertCard} ${styles.alertInfo}`}>
                <span className={styles.alertIcon}>⭐</span>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>পেন্ডিং রিভিউ</div>
                  <div className={styles.alertText}>
                    <strong>{stats.reviews.pending}টি</strong> রিভিউ অপেক্ষমাণ রয়েছে অ্যাপ্রুভালের জন্য।
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            <div className={`${styles.alertCard} ${styles.alertSuccess}`}>
              <span className={styles.alertIcon}>🟢</span>
              <div className={styles.alertContent}>
                <div className={styles.alertTitle}>সিস্টেম সচল</div>
                <div className={styles.alertText}>
                  Django REST API সফলভাবে কানেক্টেড এবং সচল আছে।
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Charts Section ===== */}
      <div className={styles.chartsGrid}>
        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleIcon} style={{ background: '#ecfdf5' }}>📈</span>
            সাপ্তাহিক রাজস্ব (গত ৭ দিন)
          </h2>

          {/* Revenue Summary */}
          <div className={styles.revenueSummary}>
            <div className={styles.revenueSummaryItem}>
              <span className={styles.revenueSummaryLabel}>আজ</span>
              <span className={styles.revenueSummaryValue}>৳{(stats?.revenue?.today || 0).toLocaleString('bn-BD')}</span>
            </div>
            <div className={styles.revenueSummaryItem}>
              <span className={styles.revenueSummaryLabel}>এই সপ্তাহ</span>
              <span className={styles.revenueSummaryValue}>৳{(stats?.revenue?.this_week || 0).toLocaleString('bn-BD')}</span>
            </div>
            <div className={styles.revenueSummaryItem}>
              <span className={styles.revenueSummaryLabel}>সর্বমোট</span>
              <span className={styles.revenueSummaryValue}>৳{(stats?.revenue?.total || 0).toLocaleString('bn-BD')}</span>
            </div>
          </div>

          <div className={styles.chartContainer}>
            {chartData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `৳${value}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noDataMessage}>
                <span className={styles.noDataIcon}>📊</span>
                পর্যাপ্ত ডাটা নেই
              </div>
            )}
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardTitleIcon} style={{ background: '#ede9fe' }}>🎯</span>
            অর্ডার স্ট্যাটাস (সামগ্রিক)
          </h2>
          <div className={styles.chartContainer}>
            {pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.97)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    }}
                    formatter={(value, name) => [`${value}টি`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noDataMessage}>
                <span className={styles.noDataIcon}>🎯</span>
                পর্যাপ্ত ডাটা নেই
              </div>
            )}
          </div>
          {/* Pie Legend */}
          {pieData.length > 0 && (
            <div className={styles.pieLegend}>
              {pieData.map((entry) => (
                <div key={entry.key} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: entry.color }}></div>
                  <span>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

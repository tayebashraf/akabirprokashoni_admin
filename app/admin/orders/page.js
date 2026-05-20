'use client';
import { useState, useEffect } from 'react';
import { getAdminOrders, updateOrderStatus } from '@/lib/api';
import styles from './page.module.css';

const statusOptions = [
  { value: 'all', label: 'সকল অর্ডার' },
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'confirmed', label: 'নিশ্চিতকৃত' },
  { value: 'packaging', label: 'প্যাকেজিং চলছে' },
  { value: 'shipped', label: 'シップド (শিপড)' },
  { value: 'delivered', label: 'ডেলিভারড' },
  { value: 'returned', label: 'রিটার্ন' },
  { value: 'cancelled', label: 'বাতিল' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // Track which order is updating status

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getAdminOrders();
        setOrders(data.results || []);
      } catch (err) {
        console.error(err);
        setError('অর্ডার তালিকা লোড করতে ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert('অর্ডারের স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (statusValue) => {
    // Return custom label or fallback
    if (statusValue === 'shipped') return 'শিপড';
    return statusOptions.find(o => o.value === statusValue)?.label || statusValue;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filter and Search logic
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      order.order_id.toLowerCase().includes(searchLower) ||
      order.customer_name.toLowerCase().includes(searchLower) ||
      order.phone.includes(searchLower) ||
      (order.address && order.address.toLowerCase().includes(searchLower));

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>অর্ডার তালিকা লোড হচ্ছে...</div>
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
    <div className={styles.ordersPage}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>📦 অর্ডার ম্যানেজমেন্ট</h1>
      </div>

      <div className={styles.filters}>
        <select 
          className={styles.filterSelect} 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.value === 'shipped' ? 'শিপড' : opt.label}</option>
          ))}
        </select>
        <input 
          type="text" 
          className="input" 
          placeholder="অর্ডার আইডি, নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..." 
          style={{ maxWidth: '350px', width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>অর্ডার আইডি ও তারিখ</th>
              <th>গ্রাহকের তথ্য</th>
              <th>বইসমূহ</th>
              <th>মোট বিল</th>
              <th>বর্তমান স্ট্যাটাস</th>
              <th>স্ট্যাটাস আপডেট</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map(order => {
              const itemsText = (order.items || []).map(item => `${item.book_title} (${item.quantity})`).join(', ');
              return (
                <tr key={order.order_id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{order.order_id}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatDate(order.created_at)}</div>
                  </td>
                  <td>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>{order.customer_name}</span>
                      <span className={styles.customerPhone}>{order.phone}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{order.district}, {order.address}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.orderItems} title={itemsText}>
                      {itemsText.length > 40 ? itemsText.substring(0, 40) + '...' : itemsText}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700' }}>৳{order.total}</td>
                  <td>
                    <span className={`${styles.orderStatus} ${styles[`status-${order.status}`] || styles.statusPending}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <select 
                      className={styles.actionSelect}
                      value={order.status}
                      disabled={actionLoading === order.order_id}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                    >
                      {statusOptions.filter(o => o.value !== 'all').map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.value === 'shipped' ? 'শিপড' : opt.label}</option>
                      ))}
                    </select>
                    {actionLoading === order.order_id && <span style={{ fontSize: '10px', color: 'var(--color-primary)', display: 'block', marginTop: '2px' }}>আপডেট হচ্ছে...</span>}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>কোনো অর্ডার পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

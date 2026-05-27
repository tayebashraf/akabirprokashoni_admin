'use client';
import { useState, useEffect, useRef } from 'react';
import { getAdminOrders, updateAdminOrder } from '@/lib/api';
import PrintInvoice from '@/components/PrintInvoice';
import styles from './page.module.css';

const statusOptions = [
  { value: 'all', label: 'সকল অর্ডার' },
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'confirmed', label: 'নিশ্চিতকৃত' },
  { value: 'packaging', label: 'প্যাকেজিং চলছে' },
  { value: 'shipped', label: 'শিপড' },
  { value: 'delivered', label: 'ডেলিভারড' },
  { value: 'returned', label: 'রিটার্ন' },
  { value: 'cancelled', label: 'বাতিল' },
];

const contactStatusOptions = [
  { value: 'not_contacted', label: '❌ যোগাযোগ হয়নি' },
  { value: 'called', label: '📞 ফোন করা হয়েছে' },
  { value: 'confirmed_by_customer', label: '✅ গ্রাহক নিশ্চিত করেছে' },
  { value: 'no_response', label: '🔇 ফোন ধরেনি' },
  { value: 'wrong_number', label: '⚠️ ভুল নম্বর' },
  { value: 'cancelled_by_customer', label: '🚫 গ্রাহক বাতিল করেছে' },
];

const paymentStatusOptions = [
  { value: 'unpaid', label: 'পেমেন্ট হয়নি' },
  { value: 'partial', label: 'আংশিক পেমেন্ট' },
  { value: 'paid', label: 'সম্পূর্ণ পেমেন্ট' },
  { value: 'refunded', label: 'রিফান্ড' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({});

  // Printing State
  const [orderToPrint, setOrderToPrint] = useState(null);

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

  useEffect(() => {
    if (orderToPrint) {
      // Trigger print after state is set and component renders
      setTimeout(() => {
        window.print();
        setOrderToPrint(null); // Clear after print dialog closes
      }, 500);
    }
  }, [orderToPrint]);

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      status: order.status,
      contact_status: order.contact_status,
      payment_status: order.payment_status,
      note: order.note || '',
      steadfast_tracking_code: order.steadfast_tracking_code || '',
      steadfast_consignment_id: order.steadfast_consignment_id || '',
    });
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedData = await updateAdminOrder(selectedOrder.order_id, formData);
      setOrders(prev => prev.map(o => o.order_id === selectedOrder.order_id ? { ...o, ...formData } : o));
      alert('অর্ডার সফলভাবে আপডেট হয়েছে!');
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      alert('অর্ডার আপডেট করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusLabel = (statusValue) => {
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
            <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <th>বর্তমান স্ট্যাটাস</th>
              <th>যোগাযোগ স্ট্যাটাস</th>
              <th>মোট বিল</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map(order => {
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
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.orderStatus} ${styles[`status-${order.status}`] || styles.statusPending}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>
                      {contactStatusOptions.find(o => o.value === order.contact_status)?.label || order.contact_status}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700' }}>৳{order.total}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => openOrderModal(order)}
                      >
                        বিস্তারিত দেখুন
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#e2e8f0', color: '#1e293b' }}
                        onClick={() => setOrderToPrint(order)}
                      >
                        🖨️ প্রিন্ট
                      </button>
                      
                      {order.steadfast_consignment_id ? (
                        <span style={{ 
                          padding: '6px 12px', fontSize: '13px', borderRadius: '4px',
                          backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                          display: 'flex', alignItems: 'center', fontWeight: 'bold'
                        }}>
                          ✅ পাঠানো হয়েছে
                        </span>
                      ) : (
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '6px 12px', fontSize: '13px', 
                            backgroundColor: '#ff5722', color: 'white', border: 'none'
                          }}
                          onClick={async () => {
                            if(confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি SteadFast-এ পাঠাতে চান?')) {
                              try {
                                const { sendOrderToSteadfast } = await import('@/lib/api');
                                const res = await sendOrderToSteadfast(order.order_id);
                                alert('সফলভাবে SteadFast-এ পাঠানো হয়েছে!');
                                // Update local state
                                setOrders(prev => prev.map(o => o.order_id === order.order_id ? { 
                                  ...o, 
                                  steadfast_consignment_id: res.consignment_id || 'sent',
                                  steadfast_tracking_code: res.tracking_code || '',
                                  status: 'shipped'
                                } : o));
                              } catch(err) {
                                alert(err.message || 'SteadFast-এ পাঠাতে সমস্যা হয়েছে।');
                              }
                            }
                          }}
                        >
                          🚀 SteadFast
                        </button>
                      )}
                    </div>
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

      {/* --- Order Details Modal --- */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>অর্ডার বিস্তারিত - {selectedOrder.order_id}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              
              {/* Customer Info */}
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>গ্রাহকের তথ্য</h3>
                <p><strong>নাম:</strong> {selectedOrder.customer_name}</p>
                <p><strong>মোবাইল:</strong> {selectedOrder.phone}</p>
                <p><strong>বিকল্প মোবাইল:</strong> {selectedOrder.alt_phone || 'N/A'}</p>
                <p><strong>ঠিকানা:</strong> {selectedOrder.address}, {selectedOrder.district}</p>
                {selectedOrder.customer_note && (
                  <p><strong>গ্রাহকের নোট:</strong> <span style={{ color: 'red' }}>{selectedOrder.customer_note}</span></p>
                )}
              </div>

              {/* Order Items */}
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>বইয়ের তালিকা</h3>
                <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <li key={idx}>{item.book_title} — {item.quantity} পিস (৳{item.price * item.quantity})</li>
                  ))}
                </ul>
                <p style={{ margin: '4px 0' }}><strong>সাবটোটাল:</strong> ৳{selectedOrder.subtotal}</p>
                <p style={{ margin: '4px 0' }}><strong>ডেলিভারি চার্জ:</strong> ৳{selectedOrder.delivery_charge}</p>
                <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 'bold' }}><strong>সর্বমোট:</strong> ৳{selectedOrder.total}</p>
              </div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateOrder} style={{ marginTop: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>অর্ডার আপডেট করুন</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                
                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>অর্ডার স্ট্যাটাস</label>
                  <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {statusOptions.filter(o => o.value !== 'all').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Contact Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>যোগাযোগ স্ট্যাটাস</label>
                  <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    value={formData.contact_status}
                    onChange={(e) => setFormData({...formData, contact_status: e.target.value})}
                  >
                    {contactStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>পেমেন্ট স্ট্যাটাস</label>
                  <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    value={formData.payment_status}
                    onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                  >
                    {paymentStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tracking Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>কুরিয়ার ট্র্যাকিং কোড</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    value={formData.steadfast_tracking_code}
                    onChange={(e) => setFormData({...formData, steadfast_tracking_code: e.target.value})}
                    placeholder="e.g. 11223344"
                  />
                </div>
              </div>

              {/* Admin Note */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>অ্যাডমিন নোট (গোপন)</label>
                <textarea 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="অর্ডার সম্পর্কে কোনো নোট বা কাস্টমারের রেসপন্স লিখে রাখুন..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                  বাতিল
                </button>
                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                  {isUpdating ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Invoice Component */}
      <PrintInvoice order={orderToPrint} />
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { getAdminOrders, updateAdminOrder, sendOrderEmailNotification } from '@/lib/api';
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
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    alt_phone: '',
    district: '',
    address: '',
    subtotal: 0,
    delivery_charge: 60,
    discount_amount: 0,
    total: 0,
    status: 'pending',
    contact_status: 'not_contacted',
    payment_status: 'unpaid',
    note: '',
    steadfast_tracking_code: '',
    steadfast_consignment_id: '',
    items: [],
  });
  const [selectedEmailType, setSelectedEmailType] = useState('confirmed');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Steadfast Tracking State
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [steadfastStatus, setSteadfastStatus] = useState(null);

  // Printing State
  const [orderToPrint, setOrderToPrint] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Clear selection on filter/search change
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [filter, search]);

  // New Orders Tracking State
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

      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get('filter');
      if (filterParam) {
        setFilter(filterParam);
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

  const fetchTrackingStatus = async (orderId) => {
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const { getAdminSteadfastTracking } = await import('@/lib/api');
      const res = await getAdminSteadfastTracking(orderId);
      if (res.success) {
        setSteadfastStatus({
          status: res.steadfast_status,
          details: res.steadfast_details
        });
        
        // Auto update order status locally if changed in DB
        const statusLower = (res.steadfast_status || '').toLowerCase();
        let matchedStatus = null;
        if (statusLower.includes('deliver')) matchedStatus = 'delivered';
        else if (statusLower.includes('cancel')) matchedStatus = 'cancelled';
        else if (statusLower.includes('return')) matchedStatus = 'returned';

        if (matchedStatus) {
          setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: matchedStatus } : o));
          setFormData(prev => ({ ...prev, status: matchedStatus }));
        }
      }
    } catch (err) {
      console.error(err);
      setTrackingError(err.message || 'কুরিয়ার স্ট্যাটাস লোড করা যায়নি।');
    } finally {
      setTrackingLoading(false);
    }
  };

  const openOrderModal = (order) => {
    markAsRead(order.order_id);
    setSelectedOrder(order);
    setFormData({
      customer_name: order.customer_name || '',
      phone: order.phone || '',
      alt_phone: order.alt_phone || '',
      district: order.district || '',
      address: order.address || '',
      subtotal: Number(order.subtotal) || 0,
      delivery_charge: Number(order.delivery_charge) || 0,
      discount_amount: Number(order.discount_amount) || 0,
      total: Number(order.total) || 0,
      status: order.status || 'pending',
      contact_status: order.contact_status || 'not_contacted',
      payment_status: order.payment_status || 'unpaid',
      note: order.note || '',
      customer_note: order.customer_note || '',
      steadfast_tracking_code: order.steadfast_tracking_code || '',
      steadfast_consignment_id: order.steadfast_consignment_id || '',
      items: order.items ? JSON.parse(JSON.stringify(order.items)) : [],
    });
    setSteadfastStatus(null);
    setTrackingError('');
    
    if (order.steadfast_consignment_id || order.steadfast_tracking_code) {
      fetchTrackingStatus(order.order_id);
    }
  };

  // Helper: Recalculate totals from items + charges
  const updateItemField = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: Number(value) || 0
      };
      
      const newSubtotal = updatedItems.reduce((acc, itm) => acc + (Number(itm.price || 0) * Number(itm.quantity || 1)), 0);
      const newTotal = newSubtotal + Number(prev.delivery_charge || 0) - Number(prev.discount_amount || 0);

      return {
        ...prev,
        items: updatedItems,
        subtotal: newSubtotal,
        total: Math.max(0, newTotal)
      };
    });
  };

  const updateDeliveryCharge = (charge) => {
    const numCharge = Number(charge) || 0;
    setFormData(prev => ({
      ...prev,
      delivery_charge: numCharge,
      total: Math.max(0, Number(prev.subtotal || 0) + numCharge - Number(prev.discount_amount || 0))
    }));
  };

  const updateDiscountAmount = (discount) => {
    const numDiscount = Number(discount) || 0;
    setFormData(prev => ({
      ...prev,
      discount_amount: numDiscount,
      total: Math.max(0, Number(prev.subtotal || 0) + Number(prev.delivery_charge || 0) - numDiscount)
    }));
  };

  const updateSubtotal = (subtotal) => {
    const numSubtotal = Number(subtotal) || 0;
    setFormData(prev => ({
      ...prev,
      subtotal: numSubtotal,
      total: Math.max(0, numSubtotal + Number(prev.delivery_charge || 0) - Number(prev.discount_amount || 0))
    }));
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updatedData = await updateAdminOrder(selectedOrder.order_id, formData);
      const mergedOrder = {
        ...selectedOrder,
        ...formData,
        ...(updatedData || {})
      };
      setOrders(prev => prev.map(o => o.order_id === selectedOrder.order_id ? mergedOrder : o));
      setSelectedOrder(mergedOrder);
      alert('অর্ডার সফলভাবে আপডেট হয়েছে!');
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
      <div className={`${styles.topBar} no-print`}>
        <h1 className={styles.title}>📦 অর্ডার ম্যানেজমেন্ট</h1>
      </div>

      <div className={`${styles.filters} no-print`}>
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
        {selectedOrderIds.length > 0 && (
          <button
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0d6b3f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => {
              const selected = orders.filter(o => selectedOrderIds.includes(o.order_id));
              setOrderToPrint(selected);
            }}
          >
            🖨️ লেবেল প্রিন্ট করুন ({selectedOrderIds.length})
          </button>
        )}
      </div>

      <div className={`${styles.tableCard} no-print`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrderIds(filteredOrders.map(o => o.order_id));
                    } else {
                      setSelectedOrderIds([]);
                    }
                  }}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </th>
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
                const isNew = !readOrderIds.includes(order.order_id);
                return (
                  <tr 
                    key={order.order_id} 
                    className={isNew ? styles.newOrderRow : ''} 
                    onClick={() => markAsRead(order.order_id)}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.order_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds([...selectedOrderIds, order.order_id]);
                          } else {
                            setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.order_id));
                          }
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isNew && <span className={styles.newIndicator}>NEW</span>}
                      <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{order.order_id}</div>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatDate(order.created_at)}</div>
                  </td>
                  <td>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerName}>{order.customer_name}</span>
                      <span className={styles.customerPhone} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {order.phone}
                        <a href={`tel:${order.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#0d6b3f', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', textDecoration: 'none', flexShrink: 0 }} title="কল করুন">📞</a>
                      </span>
                    </div>
                  </td>
                  <td>
                    <select 
                      className={`${styles.orderStatus} ${styles[`status-${order.status}`] || styles.statusPending}`}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontSize: '12px' }}
                      value={order.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          const { updateAdminOrder } = await import('@/lib/api');
                          await updateAdminOrder(order.order_id, { status: newStatus });
                          setOrders(prev => prev.map(o => o.order_id === order.order_id ? { ...o, status: newStatus } : o));
                        } catch (err) {
                          alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
                        }
                      }}
                    >
                      {statusOptions.filter(o => o.value !== 'all').map(opt => (
                        <option key={opt.value} value={opt.value} style={{color: '#000'}}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', maxWidth: '140px', backgroundColor: '#f8fafc' }}
                      value={order.contact_status || 'not_contacted'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          const { updateAdminOrder } = await import('@/lib/api');
                          await updateAdminOrder(order.order_id, { contact_status: newStatus });
                          setOrders(prev => prev.map(o => o.order_id === order.order_id ? { ...o, contact_status: newStatus } : o));
                        } catch (err) {
                          alert('যোগাযোগ স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
                        }
                      }}
                    >
                      {contactStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
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
                          padding: '4px 8px', fontSize: '12px', borderRadius: '4px',
                          backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold',
                          lineHeight: '1.2'
                        }}>
                          <span>✅ পাঠানো হয়েছে</span>
                          {order.steadfast_tracking_code && (
                            <span style={{ fontSize: '10px', marginTop: '2px', color: '#15803d', fontFamily: 'monospace' }}>
                              {order.steadfast_tracking_code}
                            </span>
                          )}
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
                <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>কোনো অর্ডার পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Order Details & Edit Modal --- */}
      {selectedOrder && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '880px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>
                  📦 অর্ডার বিস্তারিত ও এডিট — <span style={{ color: '#0d6b3f', fontFamily: 'monospace' }}>#{selectedOrder.order_id}</span>
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  অর্ডারের তারিখ: {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const currentOrderData = { ...selectedOrder, ...formData };
                    setOrderToPrint(currentOrderData);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', backgroundColor: '#0d6b3f', color: 'white',
                    borderRadius: '6px', border: 'none', fontWeight: '700', fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ প্রিন্ট করুন
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  style={{ background: '#f1f5f9', border: 'none', fontSize: '20px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateOrder}>
              {/* Top Row: Customer Info & Editable Fields */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', color: '#1e293b', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  👤 গ্রাহকের তথ্য ও ডেলিভারি ঠিকানা (পরিবর্তনযোগ্য)
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>গ্রাহকের নাম</label>
                    <input 
                      type="text"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>মোবাইল নম্বর</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text"
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                      {formData.phone && (
                        <a 
                          href={`tel:${formData.phone}`} 
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#0d6b3f', color: 'white', borderRadius: '4px', width: '36px', height: '36px', textDecoration: 'none', flexShrink: 0 }}
                          title="কল করুন"
                        >
                          📞
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>বিকল্প মোবাইল (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      value={formData.alt_phone}
                      onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                      placeholder="বিকল্প নম্বর"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>জেলা</label>
                    <input 
                      type="text"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>সম্পূর্ণ ঠিকানা</label>
                  <textarea 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box' }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                {selectedOrder.customer_note && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#fff1f2', borderRadius: '6px', border: '1px solid #fecdd3' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#be123c' }}>
                      <strong>গ্রাহকের বিশেষ নির্দেশনা:</strong> {selectedOrder.customer_note}
                    </p>
                  </div>
                )}
              </div>

              {/* Middle Section: Items List & Price Editing */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    📚 বইয়ের তালিকা ও মূল্য পরিবর্তন (Edit Rates & Quantities)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    * মূল্য বা পরিমাণ পরিবর্তন করলে মোট বিল স্বয়ংক্রিয়ভাবে হিসাব হবে
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}>#</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>বইয়ের নাম</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '140px' }}>একক মূল্য (৳)</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>পরিমাণ</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '130px' }}>মোট মূল্য (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items && formData.items.length > 0 ? (
                        formData.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '8px', fontWeight: '600', color: '#1e293b' }}>
                              {item.book_title}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="0"
                                style={{ width: '100px', padding: '6px 8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '13px' }}
                                value={item.price}
                                onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                min="1"
                                style={{ width: '70px', padding: '6px 8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '13px' }}
                                value={item.quantity}
                                onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#0d6b3f' }}>
                              ৳{(Number(item.price || 0) * Number(item.quantity || 1))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                            কোনো বইয়ের আইটেম পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Grid */}
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>
                      সাবটোটাল (বইয়ের মোট)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '6px 8px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px' }}>৳</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
                        value={formData.subtotal}
                        onChange={(e) => updateSubtotal(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>
                      কুরিয়ার / ডেলিভারি ফি
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '6px 8px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px' }}>৳</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#c2410c' }}
                        value={formData.delivery_charge}
                        onChange={(e) => updateDeliveryCharge(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>
                      ডিসকাউন্ট / ছাড় (৳)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '6px 8px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px' }}>৳</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}
                        value={formData.discount_amount}
                        onChange={(e) => updateDiscountAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#0d6b3f', fontWeight: '800', marginBottom: '4px' }}>
                      সর্বমোট বিল (Total)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '6px 8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>৳</span>
                      <input 
                        type="number"
                        min="0"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '0 4px 4px 0', border: '1px solid #86efac', fontSize: '14px', fontWeight: '800', color: '#166534', backgroundColor: '#f0fdf4' }}
                        value={formData.total}
                        onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SteadFast Courier Section */}
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    🚚 SteadFast কুরিয়ার ট্র্যাকিং ও বুকিং
                  </h3>
                  {formData.steadfast_consignment_id && (
                    <button 
                      type="button" 
                      style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e2e8f0', border: 'none', color: '#1e293b', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                      onClick={() => fetchTrackingStatus(selectedOrder.order_id)}
                      disabled={trackingLoading}
                    >
                      🔄 {trackingLoading ? 'লোড হচ্ছে...' : 'লাইভ ট্র্যাকিং আপডেট'}
                    </button>
                  )}
                </div>

                {formData.steadfast_consignment_id ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        <strong>কনসাইনমেন্ট আইডি:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formData.steadfast_consignment_id}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        <strong>ট্র্যাকিং কোড:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formData.steadfast_tracking_code || '—'}</span>
                        {formData.steadfast_tracking_code && (
                          <a 
                            href={`https://portal.steadfast.com.bd/tracking?tracking_code=${formData.steadfast_tracking_code}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ marginLeft: '8px', color: '#ff5722', fontWeight: 'bold', textDecoration: 'underline' }}
                          >
                            অনুসরণ করুন ↗
                          </a>
                        )}
                      </p>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <strong>কুরিয়ার লাইভ স্ট্যাটাস:</strong>{' '}
                      {trackingLoading ? (
                        <span style={{ color: '#64748b' }}>লোড হচ্ছে...</span>
                      ) : trackingError ? (
                        <span style={{ color: '#ef4444' }}>{trackingError}</span>
                      ) : steadfastStatus ? (
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: (steadfastStatus.status || '').toLowerCase().includes('deliver') ? '#166534' : 
                                 ((steadfastStatus.status || '').toLowerCase().includes('cancel') ? '#991b1b' : '#1e3a8a')
                        }}>
                          {steadfastStatus.status}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>কোনো তথ্য পাওয়া যায়নি। আপডেট বোতামে চাপ দিন।</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '12px', borderRadius: '6px', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{ margin: 0, color: '#c2410c', fontSize: '13px' }}>
                      এই অর্ডারটি এখনো SteadFast কুরিয়ারে বুকিং করা হয়নি।
                    </p>
                    <button
                      type="button"
                      style={{ backgroundColor: '#ff5722', color: 'white', fontSize: '13px', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={async () => {
                        if (confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি SteadFast-এ পাঠাতে চান?')) {
                          try {
                            const { sendOrderToSteadfast } = await import('@/lib/api');
                            const res = await sendOrderToSteadfast(selectedOrder.order_id);
                            alert('সফলভাবে SteadFast-এ বুকিং করা হয়েছে!');
                            
                            const updatedOrder = { 
                              ...selectedOrder, 
                              steadfast_consignment_id: res.consignment_id || 'sent',
                              steadfast_tracking_code: res.tracking_code || '',
                              status: 'shipped'
                            };
                            setSelectedOrder(updatedOrder);
                            setFormData(prev => ({ 
                              ...prev, 
                              steadfast_consignment_id: res.consignment_id || 'sent',
                              steadfast_tracking_code: res.tracking_code || '',
                              status: 'shipped'
                            }));
                            setOrders(prev => prev.map(o => o.order_id === selectedOrder.order_id ? updatedOrder : o));
                            fetchTrackingStatus(selectedOrder.order_id);
                          } catch (err) {
                            alert(err.message || 'SteadFast-এ বুকিং করতে ব্যর্থ হয়েছে।');
                          }
                        }
                      }}
                    >
                      🚀 SteadFast-এ বুক করুন
                    </button>
                  </div>
                )}
              </div>

              {/* Status and Notes Form Row */}
              <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '0 0 12px 0', fontWeight: 'bold' }}>
                  ⚙️ অর্ডার স্ট্যাটাস ও অ্যাডমিন নোট
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#475569' }}>অর্ডার স্ট্যাটাস</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: 'white' }}
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
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#475569' }}>যোগাযোগ স্ট্যাটাস</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: 'white' }}
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
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#475569' }}>পেমেন্ট স্ট্যাটাস</label>
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: 'white' }}
                      value={formData.payment_status}
                      onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                    >
                      {paymentStatusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tracking Code Manual */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#475569' }}>কুরিয়ার ট্র্যাকিং কোড</label>
                    <input 
                      type="text" 
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      value={formData.steadfast_tracking_code}
                      onChange={(e) => setFormData({...formData, steadfast_tracking_code: e.target.value})}
                      placeholder="যেমন: STDF12345"
                    />
                  </div>
                </div>

                {/* Admin Note */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#475569' }}>অ্যাডমিন নোট (গোপন)</label>
                  <textarea 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '60px', fontSize: '13px', boxSizing: 'border-box' }}
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="অর্ডার সম্পর্কে কোনো নোট বা কাস্টমারের রেসপন্স লিখে রাখুন..."
                  />
                </div>
              </div>

              {/* Email Notification Section */}
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 'bold' }}>
                  ✉️ গ্রাহককে ইমেল আপডেট পাঠান
                </h3>
                
                {selectedOrder.email ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#166534' }}>
                      গ্রাহকের ইমেল: <strong style={{ textDecoration: 'underline' }}>{selectedOrder.email}</strong>
                    </span>
                    
                    <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '400px', width: '100%' }}>
                      <select 
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', flexGrow: 1, fontSize: '13px', outline: 'none', backgroundColor: '#fff', color: '#333' }}
                        value={selectedEmailType}
                        onChange={(e) => setSelectedEmailType(e.target.value)}
                      >
                        <option value="confirmed">📋 অর্ডার নিশ্চিতকরণ মেইল</option>
                        <option value="packaging">📦 প্যাকেজিং মেইল</option>
                        <option value="shipped">🚚 শিপড/কুরিয়ার মেইল</option>
                        <option value="delivered">🏠 ডেলিভারি মেইল</option>
                        <option value="cancelled">❌ বাতিল মেইল</option>
                      </select>
                      
                      <button
                        type="button"
                        style={{ backgroundColor: '#0D6B3F', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '6px 14px', fontWeight: 'bold', fontSize: '12px' }}
                        onClick={async () => {
                          setIsSendingEmail(true);
                          try {
                            await sendOrderEmailNotification(selectedOrder.order_id, selectedEmailType);
                            alert('সফলভাবে কাস্টমারের কাছে ইমেল পাঠানো হয়েছে!');
                          } catch (err) {
                            alert(err.message || 'ইমেল পাঠাতে ব্যর্থ হয়েছে।');
                          } finally {
                            setIsSendingEmail(false);
                          }
                        }}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? 'পাঠানো হচ্ছে...' : 'ইমেল পাঠান'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>
                    ⚠️ গ্রাহকের কোনো ইমেল ঠিকানা দেওয়া নেই।
                  </p>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedOrder(null)} 
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentOrderData = { ...selectedOrder, ...formData };
                    setOrderToPrint(currentOrderData);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', backgroundColor: '#0284c7', color: 'white',
                    borderRadius: '6px', border: 'none', fontWeight: '700', fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ ইনভয়েস প্রিন্ট
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0d6b3f', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isUpdating ? '💾 সেভ হচ্ছে...' : '💾 পরিবর্তন সেভ করুন'}
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

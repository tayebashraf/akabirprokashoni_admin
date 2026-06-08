'use client';
import { useState, useEffect } from 'react';
import { getAdminOrders } from '@/lib/api';
import Link from 'next/link';

export default function DailySalesVoucher() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voucherDate, setVoucherDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Default to today
  });

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

  const getFilteredOrders = () => {
    const filterDateStr = new Date(voucherDate).toDateString();
    return orders.filter(order => new Date(order.created_at).toDateString() === filterDateStr);
  };

  const filteredOrders = getFilteredOrders();
  const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalOrdersCount = filteredOrders.length;

  const formatDateBn = (dateStr) => {
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

  const formatTimeBn = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('bn-BD', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>ভাউচার রিপোর্ট তৈরি হচ্ছে...</div>
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Control Panel (Hidden on Print) */}
      <div className="no-print" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>ভাউচার তারিখ:</label>
          <input 
            type="date" 
            value={voucherDate}
            onChange={(e) => setVoucherDate(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => window.print()}
            style={{ 
              backgroundColor: '#0d6b3f', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖨️ প্রিন্ট ভাউচার
          </button>
          <Link 
            href="/tawhid"
            style={{ 
              backgroundColor: '#f1f5f9', 
              color: '#334155', 
              padding: '10px 20px', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ড্যাশবোর্ডে ফিরুন
          </Link>
        </div>
      </div>

      {/* Voucher Print Sheet */}
      <div className="print-sheet" style={{ 
        background: '#white', 
        padding: '30px', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0' }}>আকাবির প্রকাশনী</h1>
          <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '14px' }}>বাংলাবাজার, ঢাকা | www.akabirprokashoni.com</p>
          <div style={{ 
            display: 'inline-block', 
            background: '#f1f5f9', 
            padding: '6px 20px', 
            borderRadius: '20px', 
            fontWeight: 'bold',
            fontSize: '15px',
            border: '1px solid #cbd5e1'
          }}>
            📋 দৈনিক বিক্রয় ভাউচার (Daily Sales Report)
          </div>
          <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#1e293b' }}>
            তারিখ: {formatDateBn(voucherDate)}
          </p>
        </div>

        {/* Sales Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>মোট অর্ডার সংখ্যা</span>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0d6b3f' }}>{totalOrdersCount.toLocaleString('bn-BD')} টি</h3>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>মোট বিক্রয় পরিমাণ</span>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0d6b3f' }}>৳ {totalSales.toLocaleString('bn-BD')}</h3>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>রিপোর্ট জেনারেশন সময়</span>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#334155' }}>
              {new Date().toLocaleTimeString('bn-BD', { hour: 'numeric', minute: 'numeric', hour12: true })}
            </h3>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #000' }}>
              <th style={{ border: '1px solid #000', padding: '10px', width: '50px', textAlign: 'center' }}>ক্রমিক</th>
              <th style={{ border: '1px solid #000', padding: '10px', width: '130px' }}>অর্ডার আইডি ও সময়</th>
              <th style={{ border: '1px solid #000', padding: '10px', width: '160px' }}>গ্রাহকের তথ্য</th>
              <th style={{ border: '1px solid #000', padding: '10px' }}>ডেলিভারি ঠিকানা ও জেলা</th>
              <th style={{ border: '1px solid #000', padding: '10px', width: '250px' }}>অর্ডারকৃত বইয়ের বিবরণ</th>
              <th style={{ border: '1px solid #000', padding: '10px', width: '100px', textAlign: 'right' }}>বিল পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
              <tr key={order.order_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{order.order_id}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>⏱️ {formatTimeBn(order.created_at)}</div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{order.customer_name}</div>
                  <div style={{ color: '#0d6b3f', fontSize: '12px', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>📞 {order.phone} <a href={`tel:${order.phone}`} className="no-print" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#0d6b3f', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', textDecoration: 'none', flexShrink: 0 }} title="কল করুন">📞</a></div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                  <div>{order.address}</div>
                  <div style={{ fontWeight: '600', color: '#475569', marginTop: '2px', fontSize: '12px' }}>📍 জেলা: {order.district}</div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#334155' }}>
                    {order.items?.map((item, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>
                        {item.book_title} <span style={{ fontWeight: 'bold', color: '#000' }}>× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                  ৳{order.total}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ border: '1px solid #cbd5e1', textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  উক্ত তারিখে কোনো সফল সেলস/অর্ডার পাওয়া যায়নি।
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Totals Section */}
        {filteredOrders.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ width: '300px', borderCollapse: 'collapse', border: '2px solid #000' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', fontWeight: 'bold', background: '#f8fafc', borderRight: '1px solid #000' }}>মোট অর্ডার:</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right' }}>{totalOrdersCount} টি</td>
                </tr>
                <tr style={{ borderTop: '1px solid #000' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', background: '#f8fafc', borderRight: '1px solid #000', fontSize: '15px' }}>সর্বমোট বিক্রয়:</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right', fontSize: '16px', color: '#0d6b3f' }}>৳ {totalSales.toLocaleString('bn-BD')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', fontWeight: '600', fontSize: '13px' }}>প্রস্তুতকারী (Prepared By)</div>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', fontWeight: '600', fontSize: '13px' }}>হিসাবরক্ষক (Accountant)</div>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', fontWeight: '600', fontSize: '13px' }}>অনুমোদনকারী (Approved By)</div>
          </div>
        </div>

      </div>

      {/* Print Friendly Style Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide sidebar layout */
          aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />

    </div>
  );
}

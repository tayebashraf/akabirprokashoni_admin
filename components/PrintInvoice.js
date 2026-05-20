'use client';
import React from 'react';

// This component is designed to be printed using CSS @media print.
// We keep it hidden on screen by wrapping it in a visually hidden container, 
// and only show it during printing.
export default function PrintInvoice({ order }) {
  if (!order) return null;

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

  return (
    <div className="print-only-invoice">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>আকাবির প্রকাশনী</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>www.akabirprokashoni.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Invoice / লেবেল</h2>
          <p style={{ margin: 0, fontSize: '14px' }}><strong>অর্ডার আইডি:</strong> {order.order_id}</p>
          <p style={{ margin: 0, fontSize: '14px' }}><strong>তারিখ:</strong> {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ width: '48%', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>প্রাপকের ঠিকানা (Ship To):</h3>
          <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>{order.customer_name}</p>
          <p style={{ margin: '0 0 5px 0' }}><strong>মোবাইল:</strong> {order.phone} {order.alt_phone && `, ${order.alt_phone}`}</p>
          <p style={{ margin: '0 0 5px 0' }}><strong>ঠিকানা:</strong> {order.address}</p>
          <p style={{ margin: '0' }}><strong>জেলা:</strong> {order.district}</p>
        </div>
        <div style={{ width: '48%', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>অর্ডার বিবরণ:</h3>
          <p style={{ margin: '0 0 5px 0' }}><strong>পেমেন্ট মেথড:</strong> {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : order.payment_method}</p>
          <p style={{ margin: '0 0 5px 0' }}><strong>পেমেন্ট স্ট্যাটাস:</strong> {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</p>
          <p style={{ margin: '0' }}><strong>স্টেডফাস্ট ট্র্যাকিং:</strong> {order.steadfast_tracking_code || 'N/A'}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px', border: '1px solid #ddd' }}>বইয়ের নাম</th>
            <th style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd', width: '80px' }}>পরিমাণ</th>
            <th style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd', width: '120px' }}>মূল্য (৳)</th>
            <th style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd', width: '120px' }}>মোট (৳)</th>
          </tr>
        </thead>
        <tbody>
          {order.items && order.items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.book_title}</td>
              <td style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd' }}>{item.price}</td>
              <td style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd' }}>{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ width: '300px', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
          <span>সাবটোটাল:</span>
          <span>৳{order.subtotal}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
          <span>ডেলিভারি চার্জ:</span>
          <span>৳{order.delivery_charge}</span>
        </div>
        {order.discount_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', color: 'red' }}>
            <span>ডিসকাউন্ট:</span>
            <span>-৳{order.discount_amount}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #000' }}>
          <span>সর্বমোট বিল:</span>
          <span>৳{order.total}</span>
        </div>
      </div>
      
      {order.customer_note && (
        <div style={{ marginTop: '40px', padding: '10px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #000' }}>
          <strong>কাস্টমারের নোট:</strong> {order.customer_note}
        </div>
      )}

      <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#777' }}>
        <p>আমাদের সাথে থাকার জন্য ধন্যবাদ! আকাবির প্রকাশনী থেকে কেনাকাটার জন্য আন্তরিক কৃতজ্ঞতা।</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide invoice on screen */
        .print-only-invoice {
          display: none;
        }
        
        /* Show only invoice on print */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only-invoice, .print-only-invoice * {
            visibility: visible;
          }
          .print-only-invoice {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}} />
    </div>
  );
}

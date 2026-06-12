'use client';

import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

// ==========================================
// Barcode Component (Client Side Only)
// ==========================================
function Barcode({ value }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.8,
          height: 38,
          displayValue: true,
          fontSize: 10,
          margin: 0,
          background: 'transparent',
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value]);

  return <svg ref={svgRef} style={{ display: 'block', margin: '0 auto', maxWidth: '100%', maxHeight: '48px' }} />;
}

// ==========================================
// QR Code Component (Client Side Only)
// ==========================================
function QRCodeImage({ value }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        margin: 1,
        width: 80,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('QR Code error:', err));
    }
  }, [value]);

  if (!qrUrl) return <div style={{ width: '68px', height: '68px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '4px' }} />;
  return (
    <img
      src={qrUrl}
      alt="QR Code"
      style={{
        width: '68px',
        height: '68px',
        border: '1px solid black',
        padding: '1px',
        borderRadius: '4px',
        objectFit: 'contain',
      }}
    />
  );
}

// ==========================================
// Main PrintInvoice Component
// ==========================================
export default function PrintInvoice({ order }) {
  if (!order) return null;

  // Support single order or multiple orders array
  const orders = Array.isArray(order) ? order : [order];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="print-only-invoice">
      {orders.map((singleOrder) => {
        const trackingCode = singleOrder.steadfast_tracking_code || singleOrder.order_id;
        
        // Structured data for QR code scanning
        const qrContent = `Order: ${singleOrder.order_id}\nCustomer: ${singleOrder.customer_name}\nPhone: ${singleOrder.phone}\nCollect: ${singleOrder.payment_method === 'cod' ? singleOrder.total : 0} BDT\nAddress: ${singleOrder.address}, ${singleOrder.district}`;

        return (
          <div
            key={singleOrder.order_id}
            className="a5-label-container"
            style={{
              width: '200mm',
              height: '138mm',
              pageBreakAfter: 'always',
              boxSizing: 'border-box',
              padding: '4mm',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              color: '#000',
              margin: '0 auto',
            }}
          >
            {/* Outer frame matching dashboard style */}
            <div
              className="label-frame"
              style={{
                height: '100%',
                border: '1.5px solid black',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              {/* 1. Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1.5px solid black',
                  paddingBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/images/logo.png"
                    alt="Akabir Logo"
                    style={{ height: '10mm', objectFit: 'contain' }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#444',
                      fontWeight: '600',
                      borderLeft: '1.5px solid #ccc',
                      paddingLeft: '10px',
                      marginTop: '4px',
                      fontFamily: "'Hind Siliguri', sans-serif",
                    }}
                  >
                    ইসলামিক বইয়ের বিশ্বস্ত লাইব্রেরি
                  </span>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#000',
                    lineHeight: '1.4',
                    fontFamily: "'Hind Siliguri', sans-serif",
                  }}
                >
                  <p style={{ margin: 0 }}>হেল্পলাইন: ০১৭১৮-৭৬৩৯৭৮</p>
                  <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: '9.5px', color: '#555' }}>akabirprokashoni.com</p>
                </div>
              </div>

              {/* 2. Sender and Receiver Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: '12px',
                  borderBottom: '1px solid black',
                  padding: '8px 0',
                  fontSize: '11px',
                  lineHeight: '1.4',
                }}
              >
                {/* Left: Recipient (7 cols) */}
                <div style={{ gridColumn: 'span 7', borderRight: '1px solid #ddd', paddingRight: '8px' }}>
                  <p style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', margin: '0 0 2px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    প্রাপক (Recipient):
                  </p>
                  <p style={{ fontSize: '13.5px', fontWeight: '800', margin: '0 0 2px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {singleOrder.customer_name}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '900', margin: '0 0 2px 0' }}>
                    মোবাইল: {singleOrder.phone}
                  </p>
                  {singleOrder.alt_phone && (
                    <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 2px 0' }}>
                      বিকল্প: {singleOrder.alt_phone}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '11px', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    ঠিকানা: {singleOrder.address},{' '}
                    <strong style={{ fontWeight: 'bold' }}>{singleOrder.district}</strong>
                  </p>
                </div>

                {/* Right: Order metadata (5 cols) */}
                <div style={{ gridColumn: 'span 5', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <p style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', margin: '0 0 2px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    ইনভয়েস বিবরণ (Invoice Info):
                  </p>
                  <div style={{ display: 'flex', justifycontent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span style={{ flexGrow: 1 }}>অর্ডার আইডি:</span>
                    <span style={{ fontWeight: 'bold', color: '#0d6b3f', fontFamily: 'monospace' }}>
                      {singleOrder.order_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifycontent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span style={{ flexGrow: 1 }}>তারিখ:</span>
                    <span style={{ fontWeight: '600' }}>{formatDate(singleOrder.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifycontent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span style={{ flexGrow: 1 }}>পেমেন্ট মেথড:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {singleOrder.payment_display ||
                        (singleOrder.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : singleOrder.payment_method)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Book items checklist table */}
              <div style={{ flexGrow: 1, margin: '6px 0', display: 'flex', flexDirection: 'column' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid black', fontWeight: 'bold', color: '#000', backgroundColor: '#f8fafc' }}>
                      <th style={{ textAlign: 'center', width: '8%', padding: '4px 2px', border: '1px solid black', fontFamily: "'Hind Siliguri', sans-serif" }}>নং</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px', border: '1px solid black', fontFamily: "'Hind Siliguri', sans-serif" }}>বইয়ের বিবরণ (Book Details)</th>
                      <th style={{ textAlign: 'right', width: '15%', padding: '4px 6px', border: '1px solid black', fontFamily: "'Hind Siliguri', sans-serif" }}>মূল্য (Rate)</th>
                      <th style={{ textAlign: 'center', width: '12%', padding: '4px 2px', border: '1px solid black', fontFamily: "'Hind Siliguri', sans-serif" }}>পরিমাণ</th>
                      <th style={{ textAlign: 'right', width: '18%', padding: '4px 6px', border: '1px solid black', fontFamily: "'Hind Siliguri', sans-serif" }}>মোট (Total)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleOrder.items &&
                      singleOrder.items.slice(0, 4).map((itm, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                          <td style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid black', fontWeight: '600' }}>{i + 1}</td>
                          <td
                            style={{
                              padding: '4px 6px',
                              border: '1px solid black',
                              fontWeight: '700',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '280px',
                              fontFamily: "'Hind Siliguri', sans-serif",
                            }}
                          >
                            {itm.book_title}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px 6px', border: '1px solid black', fontWeight: '600' }}>৳{itm.price}</td>
                          <td style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid black', fontWeight: '700' }}>{itm.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '4px 6px', border: '1px solid black', fontWeight: '700' }}>৳{itm.price * itm.quantity}</td>
                        </tr>
                      ))}
                    {singleOrder.items && singleOrder.items.length > 4 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            fontStyle: 'italic',
                            padding: '3px 0',
                            color: '#555',
                            border: '1px solid black',
                            fontFamily: "'Hind Siliguri', sans-serif",
                            backgroundColor: '#fafafa'
                          }}
                        >
                          + আরও {singleOrder.items.length - 4}টি বই আছে (অর্ডার বিবরণী দেখুন)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. Barcode, QR Code and Bill Summary Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: '12px',
                  alignItems: 'end',
                  borderTop: '1.5px solid black',
                  paddingTop: '6px',
                }}
              >
                {/* Left: Barcode, QR Code and Sender Info (7 cols) */}
                <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flexShrink: 0 }}>
                      <QRCodeImage value={qrContent} />
                    </div>
                    <div style={{ flexGrow: 1, textAlign: 'center' }}>
                      <Barcode value={trackingCode} />
                    </div>
                  </div>
                  
                  {/* Sender Details */}
                  <div
                    style={{
                      fontSize: '9px',
                      color: '#444',
                      fontFamily: "'Hind Siliguri', sans-serif",
                      lineHeight: '1.3',
                      borderTop: '1px dashed #ccc',
                      paddingTop: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <strong>প্রেরক (Sender):</strong> আকাবির প্রকাশনী, বাংলাবাজার, ঢাকা-১১০০। ফোন: ০১৭১৮-৭৬৩৯৭৮
                  </div>
                </div>

                {/* Right: Bill Summary (5 cols) */}
                <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span>উপ-মোট (Subtotal):</span>
                    <span style={{ fontWeight: '700' }}>৳{singleOrder.subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span>ডেলিভারি চার্জ:</span>
                    <span style={{ fontWeight: '700' }}>৳{singleOrder.delivery_charge}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif", borderTop: '1px solid #ccc', paddingTop: '2px', fontWeight: 'bold' }}>
                    <span>সর্বমোট (Total Bill):</span>
                    <span style={{ fontWeight: '800', fontSize: '11.5px' }}>৳{singleOrder.total}</span>
                  </div>

                  {/* Cash Collection highlight box */}
                  <div
                    style={{
                      border: '2px solid black',
                      padding: '4px 6px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      marginTop: '2px',
                    }}
                  >
                    <p style={{ fontSize: '8.5px', fontWeight: 'bold', margin: 0, color: '#333', fontFamily: "'Hind Siliguri', sans-serif", textTransform: 'uppercase' }}>
                      {singleOrder.payment_method === 'cod' ? 'ক্যাশ কালেকশন (Cash Collection)' : 'পেইড অর্ডার (Paid Order)'}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: '900', margin: '2px 0', color: '#000' }}>
                      ৳{singleOrder.payment_method === 'cod' ? singleOrder.total : '০'}
                    </p>
                    <p style={{ fontSize: '8px', fontWeight: 'bold', margin: 0, color: '#555', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {singleOrder.payment_method === 'cod' ? 'কুরিয়ারকে পরিশোধ করুন' : 'পেমেন্ট সম্পন্ন'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Embedded print logic styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide invoice on screen */
        .print-only-invoice {
          display: none;
        }
        
        /* Show only invoice on print */
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-only-invoice, .print-only-invoice * {
            visibility: visible !important;
          }
          .print-only-invoice {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 148.5mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          .a5-label-container {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            border: none !important;
            box-sizing: border-box !important;
            width: 200mm !important;
            height: 138mm !important;
          }
          @page {
            margin: 0 !important;
          }
        }
      `}} />
    </div>
  );
}

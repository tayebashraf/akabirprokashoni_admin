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
                  borderBottom: '1px solid black',
                  paddingBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/images/logo.png"
                    alt="Akabir Logo"
                    style={{ height: '8mm', objectFit: 'contain' }}
                  />
                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      আকাবির প্রকাশনী
                    </h2>
                    <p style={{ fontSize: '9px', color: '#444', margin: 0, fontFamily: "'Hind Siliguri', sans-serif" }}>
                      ইসলামিক বইয়ের বিশ্বস্ত লাইব্রেরি
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '9px',
                    fontWeight: '600',
                    color: '#333',
                    lineHeight: '1.3',
                    fontFamily: "'Hind Siliguri', sans-serif",
                  }}
                >
                  <p style={{ margin: 0 }}>হেল্পলাইন: ০১৩০৫-৬৪৪৭৭৮</p>
                  <p style={{ margin: 0 }}>akabirprokashoni.com</p>
                </div>
              </div>

              {/* 2. Sender and Receiver Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, 1fr)',
                  gap: '8px',
                  borderBottom: '1px solid black',
                  padding: '6px 0',
                  fontSize: '11px',
                  lineHeight: '1.4',
                }}
              >
                {/* Left: Recipient (9 cols) */}
                <div style={{ gridColumn: 'span 9', borderRight: '1px solid #ccc', paddingRight: '8px' }}>
                  <p style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', margin: '0 0 1px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    প্রাপক (Recipient):
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 2px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    {singleOrder.customer_name}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '900', margin: '0 0 2px 0' }}>
                    মোবাইল: {singleOrder.phone}
                  </p>
                  {singleOrder.alt_phone && (
                    <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '0 0 2px 0' }}>
                      বিকল্প: {singleOrder.alt_phone}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '10.5px', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    ঠিকানা: {singleOrder.address},{' '}
                    <strong style={{ fontWeight: 'bold' }}>{singleOrder.district}</strong>
                  </p>
                </div>

                {/* Right: QR Code and Sender Info (3 cols) */}
                <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px' }}>
                  <QRCodeImage value={qrContent} />
                  <div style={{ fontSize: '8.5px', color: '#555', textAlign: 'center', marginTop: '4px', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span style={{ fontWeight: 'bold' }}>প্রেরক:</span> আকাবির প্রকাশনী, ঢাকা
                  </div>
                </div>
              </div>

              {/* 3. Mid Section: Cash Box & Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px', padding: '6px 0', alignItems: 'center' }}>
                {/* Left: Billing details & Order info */}
                <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span>অর্ডার আইডি:</span>
                    <span style={{ fontWeight: 'bold', color: '#0d6b3f', fontFamily: 'monospace' }}>
                      {singleOrder.order_id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span>তারিখ:</span>
                    <span style={{ fontWeight: '600' }}>{formatDate(singleOrder.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Hind Siliguri', sans-serif" }}>
                    <span>পেমেন্ট মেথড:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {singleOrder.payment_display ||
                        (singleOrder.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : singleOrder.payment_method)}
                    </span>
                  </div>
                </div>

                {/* Right: Cash Box */}
                <div style={{ gridColumn: 'span 5' }}>
                  <div
                    style={{
                      border: '2px solid black',
                      padding: '4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      backgroundColor: '#fcfcfc',
                    }}
                  >
                    <p style={{ fontSize: '8.5px', fontWeight: 'bold', margin: 0, color: '#333', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {singleOrder.payment_method === 'cod' ? 'ক্যাশ কালেকশন' : 'পেইড অর্ডার'}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '900', margin: '1px 0' }}>
                      ৳{singleOrder.payment_method === 'cod' ? singleOrder.total : '০.০০'}
                    </p>
                    <p style={{ fontSize: '8.5px', fontWeight: 'bold', margin: 0, color: '#555', fontFamily: "'Hind Siliguri', sans-serif" }}>
                      {singleOrder.payment_method === 'cod' ? 'কুরিয়ারকে পরিশোধ করুন' : 'পেমেন্ট সম্পন্ন'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Book items checklist table */}
              <div style={{ borderTop: '1px solid black', borderBottom: '1px solid black', padding: '4px 0', margin: '2px 0' }}>
                <p style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#555', margin: '0 0 2px 0', fontFamily: "'Hind Siliguri', sans-serif" }}>
                  📦 পার্সেল সামগ্রী (Items Checklist):
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#333' }}>
                      <th style={{ textAlign: 'center', width: '8%', paddingBottom: '1px', fontFamily: "'Hind Siliguri', sans-serif" }}>নং</th>
                      <th style={{ textAlign: 'left', paddingBottom: '1px', fontFamily: "'Hind Siliguri', sans-serif" }}>বইয়ের নাম</th>
                      <th style={{ textAlign: 'center', width: '12%', paddingBottom: '1px', fontFamily: "'Hind Siliguri', sans-serif" }}>পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleOrder.items &&
                      singleOrder.items.slice(0, 3).map((itm, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ textAlign: 'center', padding: '1px 0' }}>{i + 1}</td>
                          <td
                            style={{
                              padding: '1px 0',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '240px',
                              fontFamily: "'Hind Siliguri', sans-serif",
                            }}
                          >
                            {itm.book_title}
                          </td>
                          <td style={{ textAlign: 'center', padding: '1px 0', fontWeight: 'bold' }}>{itm.quantity}</td>
                        </tr>
                      ))}
                    {singleOrder.items && singleOrder.items.length > 3 && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            textAlign: 'center',
                            fontSize: '8.5px',
                            fontWeight: 'bold',
                            fontStyle: 'italic',
                            padding: '1px 0',
                            color: '#555',
                            fontFamily: "'Hind Siliguri', sans-serif",
                          }}
                        >
                          + আরও {singleOrder.items.length - 3}টি বই আছে (অর্ডার শিট দেখুন)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. Barcode (Centered at the bottom) */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ width: '80%', textAlign: 'center' }}>
                  <Barcode value={trackingCode} />
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
            size: A5 landscape !important;
            margin: 0 !important;
          }
        }
      `}} />
    </div>
  );
}

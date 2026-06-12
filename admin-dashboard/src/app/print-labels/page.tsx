'use client';

// Force rebuild trigger
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Printer, ChevronLeft, Info, Eye, EyeOff, CheckCircle } from 'lucide-react';
import type { Order } from '@/lib/types';

// ==========================================
// Barcode Component (Client Side Only)
// ==========================================
function Barcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.6,
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

  return <svg ref={svgRef} className="mx-auto max-h-[50px] max-w-full" />;
}

// ==========================================
// QR Code Component (Client Side Only)
// ==========================================
function QRCodeImage({ value }: { value: string }) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, {
        margin: 1,
        width: 100,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('QR Code error:', err));
    }
  }, [value]);

  if (!qrUrl) return <div className="w-[85px] h-[85px] bg-zinc-100 border border-zinc-200 animate-pulse rounded" />;
  return (
    <img
      src={qrUrl}
      alt="QR Code"
      className="w-[85px] h-[85px] print:w-[80px] print:h-[80px] object-contain border border-black p-0.5 rounded"
    />
  );
}

// ==========================================
// Main PrintLabels Page
// ==========================================
export default function PrintLabelsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const router = useRouter();

  // Load selected orders from localStorage
  useEffect(() => {
    setIsMounted(true);
    const data = localStorage.getItem('akabir_print_orders');
    if (data) {
      try {
        const parsed = JSON.parse(data) as Order[];
        setOrders(parsed);
      } catch (err) {
        console.error('Failed to parse print orders:', err);
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
        <h1 className="text-xl font-semibold mb-4" style={{ fontFamily: "'Hind Siliguri'" }}>
          প্রিন্ট করার মতো কোনো অর্ডার পাওয়া যায়নি!
        </h1>
        <p className="text-zinc-400 mb-6 text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>
          দয়া করে প্রথমে অর্ডার লিস্ট থেকে অর্ডার সিলেক্ট করে প্রিন্ট বাটনে চাপ দিন।
        </p>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
          style={{ fontFamily: "'Hind Siliguri'" }}
        >
          <ChevronLeft className="w-4 h-4" /> ফিরে যান
        </button>
      </div>
    );
  }

  // Split orders into pairs for A4 layout (2 labels per page)
  const orderPairs: Order[][] = [];
  for (let i = 0; i < orders.length; i += 2) {
    orderPairs.push(orders.slice(i, i + 2));
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans print:bg-white print:text-black">
      {/* Top Banner (Hidden when printing) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 no-print flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            title="ফিরে যান"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri'" }}>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs">অ্যাডমিন</span>
              লেবেল প্রিন্ট প্রিভিউ ({orders.length}টি)
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
              আকাবির প্রকাশনী — পার্সেল লেবেল
            </p>
          </div>
        </div>

        {/* Toggles and controls */}
        <div className="flex items-center flex-wrap gap-3">
          <button
            onClick={() => setShowItems(!showItems)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              showItems
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            style={{ fontFamily: "'Hind Siliguri'" }}
          >
            {showItems ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            বইয়ের তালিকা {showItems ? 'দেখুন' : 'লুকান'}
          </button>

          <button
            onClick={() => setShowBorders(!showBorders)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              showBorders
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            style={{ fontFamily: "'Hind Siliguri'" }}
          >
            {showBorders ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            লেবেল বর্ডার {showBorders ? 'দেখুন' : 'লুকান'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-5 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
            style={{ fontFamily: "'Hind Siliguri'" }}
          >
            <Printer className="w-4 h-4" /> প্রিন্ট করুন
          </button>
        </div>
      </header>

      {/* Helper Notification Banner (Hidden when printing) */}
      <div className="max-w-4xl mx-auto pt-24 px-4 no-print">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-emerald-400">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>
            <p className="font-semibold">প্রফেশনাল প্রিন্ট করার জন্য টিপস:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-zinc-300">
              <li>ব্রাউজার প্রিন্ট ডায়ালগ ওপেন হলে <strong className="text-white">Margins</strong> অপশনটি <strong className="text-emerald-400">"None" (বা ০)</strong> সিলেক্ট করুন।</li>
              <li><strong className="text-white">Scale</strong> অপশনটি <strong className="text-emerald-400">"100%" (বা Default)</strong> রাখুন।</li>
              <li>লেআউট হিসেবে <strong className="text-white">Portrait (লম্বালম্বি)</strong> সিলেক্ট করুন।</li>
              <li>এর ফলে একটি A4 সাইজের পাতায় দুটি A5 লেবেল একদম নিখুঁতভাবে ও সমানভাগে ফিট হয়ে যাবে।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pages Container */}
      <main className="flex flex-col items-center gap-8 py-8 px-4 print:p-0 print:gap-0">
        {orderPairs.map((pair, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-sheet bg-white text-black shadow-2xl print:shadow-none flex flex-col justify-between overflow-hidden"
            style={{
              width: '210mm',
              height: '297mm',
              pageBreakAfter: 'always',
              boxSizing: 'border-box',
            }}
          >
            {pair.map((order, labelIndex) => {
              const isLastInPair = labelIndex === pair.length - 1;
              const trackingCode = order.steadfast_tracking_code || order.order_id;
              
              // Structured information for QR code
              const qrContent = `Order: ${order.order_id}\nCustomer: ${order.customer_name}\nPhone: ${order.phone}\nCollect: ${order.payment_method === 'cod' ? order.total : 0} BDT\nAddress: ${order.address}, ${order.district}`;

              return (
                <div
                  key={order.order_id}
                  className="relative flex flex-col justify-between p-[6mm]"
                  style={{
                    height: '148.5mm',
                    width: '210mm',
                    boxSizing: 'border-box',
                    borderBottom: !isLastInPair ? '1px dashed #bbb' : 'none',
                  }}
                >
                  {/* Outer label frame (optional border for sticker peel alignment) */}
                  <div
                    className={`h-full flex flex-col justify-between p-4 ${
                      showBorders ? 'border-[1.5px] border-black rounded-lg' : ''
                    }`}
                  >
                    {/* 1. Logo and Header */}
                    <div className="flex justify-between items-center border-b border-black pb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/images/logo.png"
                          alt="Akabir Logo"
                          className="h-[10mm] object-contain print:h-[9mm]"
                        />
                        <div>
                          <h2
                            className="text-base font-extrabold tracking-wide text-black"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            আকাবির প্রকাশনী
                          </h2>
                          <p
                            className="text-[9px] text-zinc-600 font-medium -mt-1"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            ইসলামিক বইয়ের বিশ্বস্ত লাইব্রেরি
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-zinc-700 leading-normal font-semibold">
                        <p>হেল্পলাইন: 01305-644778</p>
                        <p>akabirprokashoni.com</p>
                      </div>
                    </div>

                    {/* 2. Sender and Receiver Grid */}
                    <div className="grid grid-cols-12 gap-3 py-2 border-b border-black text-[11px] leading-relaxed">
                      {/* Left: Recipient (7 cols) */}
                      <div className="col-span-8 border-r border-zinc-300 pr-2">
                        <p className="font-bold text-zinc-600 text-[10px] mb-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
                          প্রাপক (Recipient):
                        </p>
                        <p className="text-[13px] font-extrabold text-black" style={{ fontFamily: "'Hind Siliguri'" }}>
                          {order.customer_name}
                        </p>
                        <p className="text-[14px] font-black text-black tracking-wide my-0.5">
                          মোবাইল: {order.phone}
                        </p>
                        {order.alt_phone && (
                          <p className="text-[11px] font-bold text-zinc-800 -mt-0.5">
                            বিকল্প: {order.alt_phone}
                          </p>
                        )}
                        <p className="text-[11px] font-medium text-black mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
                          ঠিকানা: {order.address}, {order.upazila ? `${order.upazila}, ` : ''}
                          <strong className="font-bold">{order.district}</strong>
                        </p>
                      </div>

                      {/* Right: Sender (4 cols) */}
                      <div className="col-span-4 pl-1">
                        <div className="mb-2">
                          <p className="font-bold text-zinc-600 text-[10px] mb-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
                            প্রেরক (Sender):
                          </p>
                          <p className="font-extrabold text-black" style={{ fontFamily: "'Hind Siliguri'" }}>
                            আকাবির প্রকাশনী
                          </p>
                          <p className="text-[10px] font-medium" style={{ fontFamily: "'Hind Siliguri'" }}>
                            বাংলাবাজার, ঢাকা-১১০০
                          </p>
                          <p className="text-[10px] font-bold">ফোন: 01305-644778</p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Mid Section: Cash Box & Info */}
                    <div className="grid grid-cols-12 gap-3 py-2 items-center">
                      {/* Left: Billing details & Order info */}
                      <div className="col-span-7 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium" style={{ fontFamily: "'Hind Siliguri'" }}>অর্ডার আইডি (Order ID):</span>
                          <span className="font-bold font-mono text-emerald-600">{order.order_id}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium" style={{ fontFamily: "'Hind Siliguri'" }}>অর্ডারের তারিখ:</span>
                          <span className="font-semibold text-zinc-700">
                            {new Date(order.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium" style={{ fontFamily: "'Hind Siliguri'" }}>পেমেন্ট মেথড:</span>
                          <span className="font-extrabold text-zinc-800" style={{ fontFamily: "'Hind Siliguri'" }}>
                            {order.payment_display}
                          </span>
                        </div>
                      </div>

                      {/* Right: Cash Collection Highlight Box (Thick outline) */}
                      <div className="col-span-5">
                        <div className="border-[2.5px] border-black bg-zinc-50 p-2 text-center rounded-lg">
                          <p
                            className="text-[9px] font-black uppercase text-zinc-700 tracking-wider"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            {order.payment_method === 'cod' ? 'ক্যাশ কালেকশন' : 'পেইড অর্ডার'}
                          </p>
                          <p className="text-xl font-black text-black my-0.5">
                            ৳{order.payment_method === 'cod' ? order.total : '০.০০'}
                          </p>
                          <p
                            className="text-[9px] font-bold text-zinc-600"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            {order.payment_method === 'cod' ? 'কুরিয়ারকে পরিশোধ করুন' : 'পেমেন্ট সম্পন্ন'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4. Book list table (if toggled) */}
                    {showItems && (
                      <div className="border-t border-b border-black py-1.5 my-1">
                        <p
                          className="text-[9px] font-bold text-zinc-500 mb-1"
                          style={{ fontFamily: "'Hind Siliguri'" }}
                        >
                          📦 পার্সেল সামগ্রী (Items Checklist):
                        </p>
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-300 font-semibold text-zinc-700">
                              <th className="py-0.5 text-center w-[8%]" style={{ fontFamily: "'Hind Siliguri'" }}>
                                নং
                              </th>
                              <th className="py-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
                                বইয়ের নাম
                              </th>
                              <th className="py-0.5 text-center w-[12%]" style={{ fontFamily: "'Hind Siliguri'" }}>
                                পরিমাণ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.slice(0, 4).map((itm, i) => (
                              <tr key={itm.id} className="border-b border-zinc-200/50">
                                <td className="py-0.5 text-center font-mono">{i + 1}</td>
                                <td className="py-0.5 font-bold truncate max-w-[200px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                                  {itm.book_title}
                                </td>
                                <td className="py-0.5 text-center font-bold font-mono">
                                  {itm.quantity}
                                </td>
                              </tr>
                            ))}
                            {order.items.length > 4 && (
                              <tr>
                                <td colSpan={3} className="py-0.5 text-zinc-500 font-bold italic text-center text-[9px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                                  + আরও {order.items.length - 4}টি বই আছে (অর্ডার শিট দেখুন)
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 5. Barcode & QR Code Section */}
                    <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-zinc-200">
                      <div className="w-[68%] text-center">
                        <Barcode value={trackingCode} />
                        {order.steadfast_tracking_code && (
                          <p className="text-[8px] font-semibold text-zinc-500 mt-0.5">
                            Steadfast Courier Integration Barcode
                          </p>
                        )}
                      </div>
                      <div className="w-[28%] flex justify-end">
                        <QRCodeImage value={qrContent} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </main>

      {/* Global CSS Inject for Print Styling */}
      <style jsx global>{`
        @media print {
          /* CSS Reset for print */
          body, html {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Force exact margins for alignment */
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          
          /* Prevent page split inside labels */
          .a4-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

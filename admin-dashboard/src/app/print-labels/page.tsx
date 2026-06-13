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
              maxWidth: '100%',
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
                    width: '100%',
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
                    <div className="flex justify-between items-center border-b-[1.5px] border-black pb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/images/logo.png"
                          alt="Akabir Logo"
                          className="h-[10mm] object-contain print:h-[9mm]"
                        />
                        <span
                          className="text-[11px] text-zinc-700 font-semibold border-l-[1.5px] border-zinc-300 pl-2.5 mt-1"
                          style={{ fontFamily: "'Hind Siliguri'" }}
                        >
                          ইসলামিক বইয়ের বিশ্বস্ত লাইব্রেরি
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-black leading-normal font-bold" style={{ fontFamily: "'Hind Siliguri'" }}>
                        <p>হেল্পলাইন: ০১৭১৮-৭৬৩৯৭৮</p>
                        <p className="font-sans text-[9.5px] text-zinc-500 font-normal">akabirprokashoni.com</p>
                      </div>
                    </div>

                    {/* 2. Recipient and Invoice Metadata Row */}
                    <div className="grid grid-cols-12 gap-3 py-2 border-b border-black text-[11px] leading-relaxed">
                      {/* Left: Recipient Details (7 cols) */}
                      <div className="col-span-7 border-r border-zinc-300 pr-2">
                        <p className="font-bold text-zinc-500 text-[9px] mb-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
                          প্রাপক (Recipient):
                        </p>
                        <p className="text-[13.5px] font-extrabold text-black" style={{ fontFamily: "'Hind Siliguri'" }}>
                          {order.customer_name}
                        </p>
                        <p className="text-[13px] font-black text-black tracking-wide my-0.5">
                          মোবাইল: {order.phone}
                        </p>
                        {order.alt_phone && (
                          <p className="text-[11px] font-bold text-zinc-800 -mt-0.5">
                            বিকল্প: {order.alt_phone}
                          </p>
                        )}
                        <p className="text-[11px] font-medium text-black mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
                          ঠিকানা: {order.address},{' '}
                          <strong className="font-bold">{order.district}</strong>
                        </p>
                      </div>

                      {/* Right: Order Metadata (5 cols) */}
                      <div className="col-span-5 pl-2 flex flex-col gap-0.5 justify-center">
                        <p className="font-bold text-zinc-500 text-[9px] mb-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>
                          ইনভয়েস বিবরণ (Invoice Info):
                        </p>
                        <div className="flex justify-between text-[11px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>অর্ডার আইডি:</span>
                          <span className="font-bold font-mono text-emerald-600">{order.order_id}</span>
                        </div>
                        <div className="flex justify-between text-[11px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>তারিখ:</span>
                          <span className="font-semibold text-zinc-700">
                            {new Date(order.created_at).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>পেমেন্ট মেথড:</span>
                          <span className="font-extrabold text-zinc-800">
                            {order.payment_display || (order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method)}
                          </span>
                        </div>
                        {(order as any).steadfast_consignment_id && (
                          <div className="flex justify-between text-[11px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                            <span>কনসাইনমেন্ট আইডি:</span>
                            <span className="font-black text-emerald-700 text-[13px] font-mono">
                              {(order as any).steadfast_consignment_id}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px]" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>মার্চেন্ট আইডি:</span>
                          <span className="font-black text-emerald-700 text-[13px] font-mono">AQQC7A7H</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Itemized Pricing Table */}
                    {showItems && (
                      <div className="flex-grow my-1.5 flex flex-col">
                        <table className="w-full border-collapse text-[10px] border border-black">
                          <thead>
                            <tr className="bg-zinc-50 font-bold text-black border-b border-black">
                              <th className="py-1 text-center w-[8%] border-r border-black" style={{ fontFamily: "'Hind Siliguri'" }}>নং</th>
                              <th className="py-1 px-1.5 text-left border-r border-black" style={{ fontFamily: "'Hind Siliguri'" }}>বইয়ের বিবরণ (Book Details)</th>
                              <th className="py-1 px-1.5 text-right w-[15%] border-r border-black" style={{ fontFamily: "'Hind Siliguri'" }}>মূল্য (Rate)</th>
                              <th className="py-1 text-center w-[12%] border-r border-black" style={{ fontFamily: "'Hind Siliguri'" }}>পরিমাণ</th>
                              <th className="py-1 px-1.5 text-right w-[18%]" style={{ fontFamily: "'Hind Siliguri'" }}>মোট (Total)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.slice(0, 4).map((itm, i) => (
                              <tr key={itm.id} className="border-b border-black/30">
                                <td className="py-1 text-center font-semibold border-r border-black">{i + 1}</td>
                                <td className="py-1 px-1.5 font-bold truncate max-w-[260px] border-r border-black" style={{ fontFamily: "'Hind Siliguri'" }}>
                                  {itm.book_title}
                                </td>
                                <td className="py-1 px-1.5 text-right font-semibold border-r border-black">৳{itm.price}</td>
                                <td className="py-1 text-center font-bold border-r border-black">{itm.quantity}</td>
                                <td className="py-1 px-1.5 text-right font-bold">৳{itm.price * itm.quantity}</td>
                              </tr>
                            ))}
                            {order.items.length > 4 && (
                              <tr>
                                <td colSpan={5} className="py-0.5 text-zinc-600 font-bold italic text-center text-[9px] bg-zinc-50 border-t border-black" style={{ fontFamily: "'Hind Siliguri'" }}>
                                  + আরও {order.items.length - 4}টি বই আছে (অর্ডার বিবরণী দেখুন)
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 4. Barcode, QR Code and Bill Summary Row */}
                    <div className="grid grid-cols-12 gap-3 pt-1.5 border-t border-black items-end">
                      {/* Left: Barcode, QR Code and Sender Info (7 cols) */}
                      <div className="col-span-7 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="shrink-0">
                            <QRCodeImage value={qrContent} />
                          </div>
                          <div className="grow text-center">
                            <Barcode value={trackingCode} />
                          </div>
                        </div>
                        
                        {/* Sender Details */}
                        <div
                          className="text-[9px] text-zinc-600 leading-normal border-t border-dashed border-zinc-300 pt-1 mt-0.5"
                          style={{ fontFamily: "'Hind Siliguri'" }}
                        >
                          <strong>প্রেরক (Sender):</strong> আকাবির প্রকাশনী, বাংলাবাজার, ঢাকা-১১০০। ফোন: ০১৭১৮-৭৬৩৯৭৮
                        </div>
                      </div>

                      {/* Right: Bill Summary (5 cols) */}
                      <div className="col-span-5 flex flex-col gap-0.5 text-[10.5px]">
                        <div className="flex justify-between" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>উপ-মোট (Subtotal):</span>
                          <span className="font-bold">৳{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>ডেলিভারি চার্জ:</span>
                          <span className="font-bold">৳{order.delivery_charge}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-300 pt-0.5 font-bold" style={{ fontFamily: "'Hind Siliguri'" }}>
                          <span>সর্বমোট (Total Bill):</span>
                          <span className="font-black text-[11.5px]">৳{order.total}</span>
                        </div>

                        {/* Cash Collection highlight box */}
                        <div className="border-[2px] border-black bg-zinc-50 p-1 text-center rounded-md mt-1">
                          <p
                            className="text-[8.5px] font-bold text-zinc-700 uppercase tracking-wider"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            {order.payment_method === 'cod' ? 'ক্যাশ কালেকশন (Cash Collection)' : 'পেইড অর্ডার (Paid Order)'}
                          </p>
                          <p className="text-sm font-black text-black my-0.5">
                            ৳{order.payment_method === 'cod' ? order.total : '০'}
                          </p>
                          <p
                            className="text-[8px] font-bold text-zinc-600"
                            style={{ fontFamily: "'Hind Siliguri'" }}
                          >
                            {order.payment_method === 'cod' ? 'কুরিয়ারকে পরিশোধ করুন' : 'পেমেন্ট সম্পন্ন'}
                          </p>
                        </div>
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
        @import url('https://fonts.maateen.me/kalpurush/font.css');

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          body, html {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }

          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
            gap: 0 !important;
          }

          .a4-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

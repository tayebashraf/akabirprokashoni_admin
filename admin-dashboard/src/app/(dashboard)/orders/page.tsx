'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, Search, Filter, Truck, Eye,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ordersApi } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  packaging: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  packaging: 'প্যাকেজিং',
  shipped: 'শিপড',
  delivered: 'ডেলিভারড',
  cancelled: 'বাতিল',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function OrderDetailDrawer({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('স্ট্যাটাস আপডেট হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।'),
  });

  const steadfastMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.sendToSteadfast(orderId),
    onSuccess: () => {
      toast.success('সফলভাবে SteadFast-এ পাঠানো হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'SteadFast-এ পাঠাতে ব্যর্থ।'),
  });

  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-zinc-950 border-zinc-800 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>
            অর্ডার #{order.order_id}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* স্ট্যাটাস পরিবর্তন */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>স্ট্যাটাস পরিবর্তন</p>
            <Select
              value={order.status}
              onValueChange={(val) => statusMutation.mutate({ orderId: order.order_id, status: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-zinc-300">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SteadFast বাটন */}
          {!order.steadfast_consignment_id && (
            <Button
              onClick={() => steadfastMutation.mutate(order.order_id)}
              disabled={steadfastMutation.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
              style={{ fontFamily: "'Hind Siliguri'" }}
            >
              {steadfastMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
              SteadFast-এ পাঠান
            </Button>
          )}

          {order.steadfast_tracking_code && (
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-cyan-400" style={{ fontFamily: "'Hind Siliguri'" }}>ট্র্যাকিং কোড</p>
              <p className="text-lg font-mono text-white mt-1">{order.steadfast_tracking_code}</p>
            </div>
          )}

          <Separator className="bg-zinc-800" />

          {/* গ্রাহক তথ্য */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>👤 গ্রাহক তথ্য</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>নাম</p>
                <p className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{order.customer_name}</p>
              </div>
              <div>
                <p className="text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>মোবাইল</p>
                <p className="text-white">{order.phone}</p>
              </div>
              <div>
                <p className="text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>জেলা</p>
                <p className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{order.district}</p>
              </div>
              <div>
                <p className="text-zinc-500" style={{ fontFamily: "'Hind Siliguri'" }}>উপজেলা</p>
                <p className="text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{order.upazila || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>ঠিকানা</p>
              <p className="text-white text-sm" style={{ fontFamily: "'Hind Siliguri'" }}>{order.address}</p>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* অর্ডার আইটেম */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>📦 অর্ডারকৃত বই</h3>
            {order.items.map((itm, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0">
                <div>
                  <p className="text-sm text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{itm.book_title}</p>
                  <p className="text-xs text-zinc-500">পরিমাণ: {itm.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-white">৳{itm.price}</p>
              </div>
            ))}
          </div>

          <Separator className="bg-zinc-800" />

          {/* মোট */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>সাবটোটাল</span>
              <span className="text-white">৳{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>ডেলিভারি</span>
              <span className="text-white">৳{order.delivery_charge}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>সর্বমোট</span>
              <span className="text-emerald-400">৳{order.total}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  const params: Record<string, string> = { page: String(page) };
  if (search) params.search = search;
  if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['admin-orders', params],
    queryFn: () => ordersApi.getAll(params),
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('স্ট্যাটাস আপডেট হয়েছে!');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const orders = data?.results || [];
  const totalPages = data ? Math.ceil(data.count / 20) : 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>📦 অর্ডারসমূহ</h1>
          <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>
            মোট {data?.count || 0}টি অর্ডার
          </p>
        </div>
      </motion.div>

      {/* ফিল্টার বার */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="অর্ডার আইডি, নাম বা ফোন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500"
            style={{ fontFamily: "'Hind Siliguri'" }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900/50 border-zinc-800 text-white">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="সকল স্ট্যাটাস" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">সকল স্ট্যাটাস</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-zinc-300">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* অর্ডার টেবিল */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 bg-zinc-900/50 rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div variants={item} className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri'" }}>কোনো অর্ডার পাওয়া যায়নি</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-2">
          {/* ডেস্কটপ টেবিল */}
          <div className="hidden md:block rounded-xl border border-zinc-800/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                  {['অর্ডার আইডি', 'গ্রাহক', 'মোবাইল', 'জেলা', 'মোট', 'পেমেন্ট', 'স্ট্যাটাস', 'তারিখ', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                        style={{ fontFamily: "'Hind Siliguri'" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-emerald-400">{o.order_id}</td>
                    <td className="px-4 py-3 text-sm text-white" style={{ fontFamily: "'Hind Siliguri'" }}>{o.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{o.phone}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300" style={{ fontFamily: "'Hind Siliguri'" }}>{o.district}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">৳{o.total}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>{o.payment_display}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={o.status}
                        onValueChange={(v) => statusMutation.mutate({ orderId: o.order_id, status: v })}
                      >
                        <SelectTrigger className={`h-7 text-xs border ${STATUS_COLORS[o.status]} bg-transparent w-[120px]`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {Object.entries(STATUS_LABELS).map(([k, l]) => (
                            <SelectItem key={k} value={k} className="text-zinc-300 text-xs">{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(o.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setSelectedOrder(o); setDrawerOpen(true); }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* মোবাইল কার্ড ভিউ */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <Card key={o.order_id} className="bg-zinc-900/50 border-zinc-800/50 cursor-pointer hover:border-zinc-700/50 transition-colors"
                    onClick={() => { setSelectedOrder(o); setDrawerOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-mono text-emerald-400">{o.order_id}</p>
                      <p className="text-white text-sm mt-0.5" style={{ fontFamily: "'Hind Siliguri'" }}>{o.customer_name}</p>
                    </div>
                    <Badge className={`${STATUS_COLORS[o.status]} text-xs`} style={{ fontFamily: "'Hind Siliguri'" }}>
                      {STATUS_LABELS[o.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{o.phone}</span>
                    <span className="font-semibold text-white">৳{o.total}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* পেজিনেশন */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-300">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri'" }}>
                পৃষ্ঠা {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-300">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      )}

      <OrderDetailDrawer order={selectedOrder} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </motion.div>
  );
}

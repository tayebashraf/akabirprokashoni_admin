'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, BookOpen, Star,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } },
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  packaging: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  packaging: 'প্যাকেজিং',
  shipped: 'শিপড',
  delivered: 'ডেলিভারড',
  cancelled: 'বাতিল',
};

function StatCard({
  title, value, icon: Icon, trend, trendLabel, color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: string;
}) {
  const isUp = trend !== undefined && trend >= 0;
  return (
    <motion.div variants={item}>
      <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{title}</p>
              <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Math.abs(trend)}%
                  </span>
                  {trendLabel && <span className="text-xs text-zinc-500">{trendLabel}</span>}
                </div>
              )}
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <motion.div variants={item}>
      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            📈 সাপ্তাহিক রাজস্ব
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${v}`} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontFamily: "'Hind Siliguri', sans-serif" }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: number) => [`৳${value.toLocaleString('bn-BD')}`, 'রাজস্ব']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OrderStatusChart({ breakdown }: { breakdown: Record<string, number> }) {
  const data = Object.entries(breakdown).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    color: STATUS_COLORS[key] || '#71717a',
  }));

  return (
    <motion.div variants={item}>
      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            📊 অর্ডার স্ট্যাটাস
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontFamily: "'Hind Siliguri', sans-serif" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LowStockAlerts({ alerts }: { alerts: DashboardStats['low_stock_alerts'] }) {
  if (!alerts.length) return null;
  return (
    <motion.div variants={item}>
      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-zinc-300 flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            স্টক অ্যালার্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((book) => (
            <div key={book.id} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0">
              <span className="text-sm text-zinc-300 truncate max-w-[70%]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                {book.title}
              </span>
              <Badge variant={book.stock === 0 ? 'destructive' : 'secondary'} className="text-xs">
                {book.stock === 0 ? 'স্টক আউট' : `${book.stock}টি`}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3 bg-zinc-800" />
              <Skeleton className="h-8 w-16 mb-2 bg-zinc-800" />
              <Skeleton className="h-3 w-20 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-6"><Skeleton className="h-[280px] bg-zinc-800" /></CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-6"><Skeleton className="h-[280px] bg-zinc-800" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            ড্যাশবোর্ড ডেটা লোড করতে সমস্যা হচ্ছে
          </p>
          <p className="text-zinc-500 text-sm" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            ব্যাকএন্ড সার্ভার চালু আছে কিনা পরীক্ষা করুন
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* পেজ টাইটেল */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          ড্যাশবোর্ড
        </h1>
        <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
          আকাবির প্রকাশনী — সার্বিক পরিসংখ্যান
        </p>
      </motion.div>

      {/* KPI কার্ডস */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="আজকের অর্ডার"
          value={stats.orders.today}
          icon={Package}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="আজকের রাজস্ব"
          value={`৳${stats.revenue.today.toLocaleString('bn-BD')}`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="মোট বই"
          value={stats.catalog.total_books}
          icon={BookOpen}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="পেন্ডিং রিভিউ"
          value={stats.reviews.pending}
          icon={Star}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* চার্টস */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={stats.revenue.daily_chart} />
        <OrderStatusChart breakdown={stats.orders.status_breakdown} />
      </div>

      {/* স্টক অ্যালার্ট */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockAlerts alerts={stats.low_stock_alerts} />
        <motion.div variants={item}>
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-zinc-300" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                📋 দ্রুত পরিসংখ্যান
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>পেন্ডিং অর্ডার</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-0">{stats.orders.pending}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>মোট অর্ডার</span>
                <span className="text-sm font-semibold text-white">{stats.orders.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>এই সপ্তাহের রাজস্ব</span>
                <span className="text-sm font-semibold text-emerald-400">৳{stats.revenue.this_week.toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/30">
                <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>মোট লেখক</span>
                <span className="text-sm font-semibold text-white">{stats.catalog.total_authors}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-400" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>মোট বিষয়</span>
                <span className="text-sm font-semibold text-white">{stats.catalog.total_categories}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

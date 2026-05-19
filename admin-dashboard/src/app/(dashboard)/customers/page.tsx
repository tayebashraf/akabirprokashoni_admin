'use client';

import { motion } from 'framer-motion';
import { Users, Construction } from 'lucide-react';

export default function CustomersPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Hind Siliguri'" }}>👥 গ্রাহকগণ</h1>
        <p className="text-zinc-500 text-sm mt-1" style={{ fontFamily: "'Hind Siliguri'" }}>গ্রাহকদের তালিকা ও তথ্য</p>
      </div>
      <div className="text-center py-20">
        <Construction className="w-16 h-16 mx-auto text-amber-500/50 mb-4" />
        <p className="text-zinc-400 text-lg" style={{ fontFamily: "'Hind Siliguri'" }}>শীঘ্রই আসছে</p>
        <p className="text-zinc-600 text-sm mt-2" style={{ fontFamily: "'Hind Siliguri'" }}>
          গ্রাহকদের তালিকা, অর্ডার হিস্ট্রি ও বিশ্লেষণ ফিচার যুক্ত হবে
        </p>
      </div>
    </motion.div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { getAdminCustomers } from '@/lib/api';
import styles from '../orders/page.module.css';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAdminCustomers();
        // Django list API typically returns either array directly or { results: [] }
        setCustomers(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'গ্রাহক তালিকা লোড করতে ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = search.toLowerCase();
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    const phone = customer.username || '';
    const email = (customer.email || '').toLowerCase();
    const profile = customer.profile || {};
    const address = (profile.address || '').toLowerCase();
    const city = (profile.city || '').toLowerCase();

    return (
      fullName.includes(searchLower) ||
      phone.includes(searchLower) ||
      email.includes(searchLower) ||
      address.includes(searchLower) ||
      city.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>গ্রাহক তালিকা লোড হচ্ছে...</div>
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
      <div className={styles.topBar}>
        <h1 className={styles.title}>👥 গ্রাহক ম্যানেজমেন্ট</h1>
      </div>

      <div className={styles.filters} style={{ justifyContent: 'flex-start' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="গ্রাহকের নাম, ফোন নম্বর, ইমেইল বা ঠিকানা দিয়ে খুঁজুন..." 
          style={{ maxWidth: '500px', width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>ক্রমিক</th>
              <th>গ্রাহকের নাম</th>
              <th>মোবাইল নম্বর</th>
              <th>ইমেইল এড্রেস</th>
              <th>শহর / জেলা</th>
              <th>ডেলিভারি ঠিকানা</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? filteredCustomers.map((customer, index) => {
              const profile = customer.profile || {};
              const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'নামহীন গ্রাহক';
              return (
                <tr key={customer.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{index + 1}</td>
                  <td><strong>{fullName}</strong></td>
                  <td style={{ fontFamily: 'monospace' }}>{customer.username}</td>
                  <td>{customer.email || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                  <td>{profile.city || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                  <td>{profile.address || <span style={{ color: '#cbd5e1' }}>N/A</span>}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>কোনো গ্রাহক পাওয়া যায়নি।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

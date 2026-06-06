'use client';
import { useAuth } from '@/lib/AuthContext';
import { useFavorites } from '@/lib/FavoriteContext';
import BookCard from '@/components/BookCard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

export default function AccountPage() {
  const { user, token, logout, loading } = useAuth();
  const { favorites } = useFavorites();
  const router = useRouter();
  
  // Profile state
  const [profile, setProfile] = useState(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, favorites, orders, addresses, settings
  
  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Address Management states
  const [addresses, setAddresses] = useState([]);
  const [addressName, setAddressName] = useState('');
  const [addressVal, setAddressVal] = useState('');
  const [addressCity, setAddressCity] = useState('Dhaka');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Settings Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [settingsError, setSettingsError] = useState(null);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch data
  useEffect(() => {
    if (token) {
      // Fetch profile
      fetch(`${API_URL}/accounts/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          logout();
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
      })
      .catch(err => console.error(err));

      // Fetch orders
      fetch(`${API_URL}/orders/my-orders/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 401) {
          logout();
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
        setOrdersLoading(false);
      })
      .catch(err => {
        console.error(err);
        setOrdersLoading(false);
      });
    }
  }, [token]);

  // Load addresses from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akabir-saved-addresses');
      if (saved) {
        try {
          setAddresses(JSON.parse(saved));
        } catch (e) {
          setAddresses([]);
        }
      } else {
        setAddresses([]);
      }
    }
  }, []);

  // Save addresses to localStorage
  const saveAddressesToLocal = (newAddrs) => {
    setAddresses(newAddrs);
    localStorage.setItem('akabir-saved-addresses', JSON.stringify(newAddrs));
    
    // Sync default address to profile if it exists
    const def = newAddrs.find(a => a.isDefault);
    if (def && token) {
      fetch(`${API_URL}/accounts/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address: def.address,
          city: def.city === 'Dhaka' ? 'Dhaka' : 'Outside Dhaka'
        })
      })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
      })
      .catch(err => console.error('Failed to sync default address to backend profile', err));
    }
  };

  const handleAddOrEditAddress = (e) => {
    e.preventDefault();
    if (!addressName.trim() || !addressVal.trim()) return;

    if (editingAddressId !== null) {
      // Edit
      const updated = addresses.map(addr => 
        addr.id === editingAddressId 
          ? { ...addr, name: addressName.trim(), address: addressVal.trim(), city: addressCity }
          : addr
      );
      saveAddressesToLocal(updated);
      setEditingAddressId(null);
    } else {
      // Add
      const newAddr = {
        id: Date.now(),
        name: addressName.trim(),
        address: addressVal.trim(),
        city: addressCity,
        isDefault: addresses.length === 0 // Default if it's the first address
      };
      const updated = [...addresses, newAddr];
      saveAddressesToLocal(updated);
    }

    setAddressName('');
    setAddressVal('');
    setAddressCity('Dhaka');
    setShowAddressForm(false);
  };

  const handleDeleteAddress = (id) => {
    const filtered = addresses.filter(addr => addr.id !== id);
    // If we deleted the default address and have others, make the first one default
    if (addresses.find(a => a.id === id)?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    saveAddressesToLocal(filtered);
  };

  const handleSetDefaultAddress = (id) => {
    const updated = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    saveAddressesToLocal(updated);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsMessage(null);
    setUpdatingSettings(true);

    try {
      const res = await fetch(`${API_URL}/accounts/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName
        })
      });

      if (!res.ok) {
        throw new Error('প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।');
      }

      const data = await res.json();
      setProfile(data);
      setSettingsMessage('প্রোফাইল সফলভাবে আপডেট করা হয়েছে।');
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  if (loading || !user) {
    return <div className="container section" style={{ textAlign: 'center', padding: '10rem 0' }}>লোড হচ্ছে...</div>;
  }

  const userDisplayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
    : user.name || 'গ্রাহক';

  return (
    <div className="container section">
      <div className="accountGrid">
        {/* Sidebar */}
        <div style={{ background: 'white', padding: '1.75rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', alignSelf: 'start' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf4, #e2efe9)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1.25rem', fontWeight: 'bold', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              {userDisplayName.charAt(0)}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.3rem', color: '#1a1a1a' }}>{userDisplayName}</h3>
            <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', padding: '2px 10px', borderRadius: '9999px', fontWeight: '600' }}>{user.phone}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: activeTab === 'dashboard' ? 'white' : '#475569', background: activeTab === 'dashboard' ? '#C21A1A' : 'transparent', borderRadius: '8px', fontWeight: activeTab === 'dashboard' ? '700' : '500', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              ড্যাশবোর্ড
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: activeTab === 'favorites' ? 'white' : '#475569', background: activeTab === 'favorites' ? '#C21A1A' : 'transparent', borderRadius: '8px', fontWeight: activeTab === 'favorites' ? '700' : '500', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              পছন্দের বই ({favorites.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: activeTab === 'orders' ? 'white' : '#475569', background: activeTab === 'orders' ? '#C21A1A' : 'transparent', borderRadius: '8px', fontWeight: activeTab === 'orders' ? '700' : '500', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              আমার অর্ডারসমূহ
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: activeTab === 'addresses' ? 'white' : '#475569', background: activeTab === 'addresses' ? '#C21A1A' : 'transparent', borderRadius: '8px', fontWeight: activeTab === 'addresses' ? '700' : '500', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ডেলিভারি ঠিকানা
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: activeTab === 'settings' ? 'white' : '#475569', background: activeTab === 'settings' ? '#C21A1A' : 'transparent', borderRadius: '8px', fontWeight: activeTab === 'settings' ? '700' : '500', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              প্রোফাইল সেটিংস
            </button>
            <button 
              onClick={logout} 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1.25rem', color: '#dc2626', background: 'transparent', borderRadius: '8px', fontWeight: '600', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px', transition: 'all 0.2s', marginTop: '1rem' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              লগআউট
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <div className="dashboard-welcome-banner">
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>আসসালামু আলাইকুম, {userDisplayName}!</h2>
                <p style={{ opacity: 0.9, fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '650px', margin: 0 }}>
                  আকাবির প্রকাশনীতে আপনাকে স্বাগতম। আপনার ব্যক্তিগত ড্যাশবোর্ড থেকে সহজেই অর্ডার ট্র্যাক করতে পারেন, ডেলিভারি ঠিকানা যোগ করতে পারেন এবং আপনার পছন্দের বইগুলোর তালিকা দেখতে পারেন।
                </p>
              </div>

              {/* Stats Widgets */}
              <div className="dashboard-stats-grid">
                <div className="dashboard-stat-card">
                  <div className="dashboard-icon-wrap icon-green">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>মোট অর্ডার</span>
                    <strong style={{ fontSize: '1.4rem', color: '#1e293b' }}>{orders.length}</strong>
                  </div>
                </div>
                
                <div className="dashboard-stat-card">
                  <div className="dashboard-icon-wrap icon-red">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>পছন্দের বই</span>
                    <strong style={{ fontSize: '1.4rem', color: '#1e293b' }}>{favorites.length}</strong>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="dashboard-icon-wrap icon-blue">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '2px' }}>সংরক্ষিত ঠিকানা</span>
                    <strong style={{ fontSize: '1.4rem', color: '#1e293b' }}>{addresses.length}</strong>
                  </div>
                </div>
              </div>

              {/* Main Split Grid */}
              <div className="dashboard-split-grid">
                {/* Profile Summary Card */}
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', color: '#1e293b' }}>আমার প্রোফাইল</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem', fontWeight: '600' }}>নাম</span>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{userDisplayName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem', fontWeight: '600' }}>মোবাইল নম্বর</span>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{user.phone}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem', fontWeight: '600' }}>ডিফল্ট ঠিকানা</span>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b', fontWeight: profile?.profile?.address ? '600' : 'normal' }}>
                        {profile?.profile?.address || 'কোনো ঠিকানা সেট করা হয়নি'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem', fontWeight: '600' }}>শহর</span>
                      <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{profile?.profile?.city || 'সেট করা হয়নি'}</strong>
                    </div>
                  </div>
                  
                  <button onClick={() => setActiveTab('settings')} className="btn btn-outline" style={{ marginTop: '1.75rem', width: '100%' }}>প্রোফাইল আপডেট করুন</button>
                </div>

                {/* Recent Orders Card */}
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', color: '#1e293b' }}>সাম্প্রতিক অর্ডার</h3>
                  
                  {ordersLoading ? (
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>অর্ডার লোড হচ্ছে...</p>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-secondary)' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🛒</span>
                      <p style={{ fontSize: '0.9rem' }}>আপনি এখনো কোনো অর্ডার করেননি।</p>
                      <Link href="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.85rem' }}>বই কেনা শুরু করুন</Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {orders.slice(0, 2).map(order => (
                        <div key={order.order_id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.95rem', fontWeight: '700' }}>#{order.order_id}</h4>
                            <p style={{ margin: '0.15rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                              {new Date(order.created_at).toLocaleDateString('bn-BD')}
                            </p>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>৳{order.total}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.4rem', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', fontWeight: '600' }}>
                              {order.status_display}
                            </span>
                            <br/>
                            <Link href={`/track?id=${order.order_id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                              ট্র্যাক
                            </Link>
                          </div>
                        </div>
                      ))}
                      {orders.length > 2 && (
                        <button onClick={() => setActiveTab('orders')} className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%' }}>সকল অর্ডার দেখুন</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB: FAVORITES */}
          {activeTab === 'favorites' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>আমার পছন্দের বইসমূহ</h2>
              
              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>❤️</span>
                  <p>আপনার পছন্দের তালিকায় কোনো বই নেই।</p>
                  <Link href="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>পছন্দের বই খুঁজুন</Link>
                </div>
              ) : (
                <div className="grid grid-3">
                  {favorites.map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>আমার অর্ডারসমূহ</h2>
              
              {ordersLoading ? (
                <p>অর্ডার লোড হচ্ছে...</p>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛒</span>
                  <p>আপনি এখনো কোনো অর্ডার করেননি।</p>
                  <Link href="/books" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>বই কেনা শুরু করুন</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(order => (
                    <div key={order.order_id} style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.05rem', fontWeight: '700' }}>#{order.order_id}</h4>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                          তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                        </p>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>সর্বমোট: ৳{order.total}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7', fontWeight: '600' }}>
                          {order.status_display}
                        </span>
                        <br/>
                        <Link href={`/track?id=${order.order_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                          ট্র্যাক করুন
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>ডেলিভারি ঠিকানা</h2>
                {!showAddressForm && (
                  <button onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setAddressName(''); setAddressVal(''); }} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '13px' }}>
                    + নতুন ঠিকানা
                  </button>
                )}
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddOrEditAddress} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontWeight: '700' }}>{editingAddressId ? 'ঠিকানা এডিট করুন' : 'নতুন ঠিকানা যোগ করুন'}</h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>ঠিকানার নাম (যেমন: বাসা, অফিস, মেস):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressName}
                      onChange={(e) => setAddressName(e.target.value)}
                      placeholder="যেমন: বাসা"
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>বিস্তারিত ঠিকানা:</label>
                    <textarea
                      className="form-control"
                      value={addressVal}
                      onChange={(e) => setAddressVal(e.target.value)}
                      placeholder="যেমন: বাসা নং ১২, ফ্ল্যাট ৩বি, রোড ৪, ধানমন্ডি"
                      required
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>শহর/অঞ্চল:</label>
                    <select
                      className="form-control"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}
                    >
                      <option value="Dhaka">ঢাকা (ঢাকার ভেতরে)</option>
                      <option value="Outside Dhaka">ঢাকার বাইরে</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>সংরক্ষণ করুন</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>বাতিল</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-secondary)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                  কোনো ঠিকানা সংরক্ষিত নেই। নতুন ঠিকানা যোগ করুন।
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {addresses.map(addr => (
                    <div key={addr.id} style={{ border: addr.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)', borderRadius: '8px', padding: '1.2rem', background: addr.isDefault ? '#f0fdf4' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-text)', fontSize: '15px' }}>{addr.name}</span>
                          {addr.isDefault && (
                            <span style={{ fontSize: '11px', background: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ডিফল্ট ঠিকানা</span>
                          )}
                        </div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#444' }}>{addr.address}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>শহর: {addr.city === 'Dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>ডিফল্ট করুন</button>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => {
                            setEditingAddressId(addr.id);
                            setAddressName(addr.name);
                            setAddressVal(addr.address);
                            setAddressCity(addr.city);
                            setShowAddressForm(true);
                          }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>এডিট</button>
                          <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>ডিলিট</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>প্রোফাইল সেটিংস</h2>
              
              {settingsMessage && <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>{settingsMessage}</div>}
              {settingsError && <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>{settingsError}</div>}
              
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>ফার্স্ট নেম (First Name):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>লাস্ট নেম (Last Name):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#475569' }}>মোবাইল নম্বর (পরিবর্তনযোগ্য নয়):</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user.phone}
                    disabled
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={updatingSettings}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', marginTop: '1rem' }}
                >
                  {updatingSettings ? 'আপডেট করা হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
                </button>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

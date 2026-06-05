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
      .then(res => res.json())
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
      .then(res => res.json())
      .then(data => {
        setOrders(data);
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
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', alignSelf: 'start' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem', fontWeight: 'bold' }}>
              {userDisplayName.charAt(0)}
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{userDisplayName}</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{user.phone}</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '0.75rem 1rem', color: activeTab === 'dashboard' ? 'white' : 'var(--color-text-secondary)', background: activeTab === 'dashboard' ? 'var(--color-primary)' : 'transparent', borderRadius: '4px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px' }}
            >
              ड্যাশবোর্ড
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              style={{ padding: '0.75rem 1rem', color: activeTab === 'favorites' ? 'white' : 'var(--color-text-secondary)', background: activeTab === 'favorites' ? 'var(--color-primary)' : 'transparent', borderRadius: '4px', fontWeight: activeTab === 'favorites' ? 'bold' : 'normal', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px' }}
            >
              পছন্দের বই ({favorites.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{ padding: '0.75rem 1rem', color: activeTab === 'orders' ? 'white' : 'var(--color-text-secondary)', background: activeTab === 'orders' ? 'var(--color-primary)' : 'transparent', borderRadius: '4px', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px' }}
            >
              আমার অর্ডারসমূহ
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              style={{ padding: '0.75rem 1rem', color: activeTab === 'addresses' ? 'white' : 'var(--color-text-secondary)', background: activeTab === 'addresses' ? 'var(--color-primary)' : 'transparent', borderRadius: '4px', fontWeight: activeTab === 'addresses' ? 'bold' : 'normal', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px' }}
            >
              ডেলিভারি ঠিকানা
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ padding: '0.75rem 1rem', color: activeTab === 'settings' ? 'white' : 'var(--color-text-secondary)', background: activeTab === 'settings' ? 'var(--color-primary)' : 'transparent', borderRadius: '4px', fontWeight: activeTab === 'settings' ? 'bold' : 'normal', textAlign: 'left', cursor: 'pointer', border: 'none', fontSize: '14px' }}
            >
              প্রোফাইল সেটিংস
            </button>
            <button 
              onClick={logout} 
              style={{ padding: '0.75rem 1rem', color: '#dc2626', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              লগআউট
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>আমার প্রোফাইল</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>নাম</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{userDisplayName}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>মোবাইল নম্বর</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.phone}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>ডিফল্ট ঠিকানা</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.profile?.address || 'কোনো ঠিকানা সেট করা হয়নি'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>শহর</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.profile?.city || 'সেট করা হয়নি'}</p>
                  </div>
                </div>
                
                <button onClick={() => setActiveTab('settings')} className="btn btn-outline" style={{ marginTop: '2rem' }}>প্রোফাইল আপডেট করুন</button>
              </div>

              <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>সাম্প্রতিক অর্ডার</h2>
                
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
                    {orders.slice(0, 3).map(order => (
                      <div key={order.order_id} style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>#{order.order_id}</h4>
                          <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                            তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                          </p>
                          <p style={{ margin: 0, fontWeight: '500' }}>সর্বমোট: ৳{order.total}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7' }}>
                            {order.status_display}
                          </span>
                          <br/>
                          <Link href={`/track?id=${order.order_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                            ট্র্যাক করুন
                          </Link>
                        </div>
                      </div>
                    ))}
                    {orders.length > 3 && (
                      <button onClick={() => setActiveTab('orders')} className="btn btn-outline" style={{ alignSelf: 'center', marginTop: '1rem' }}>সকল অর্ডার দেখুন</button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: FAVORITES */}
          {activeTab === 'favorites' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
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
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
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
                    <div key={order.order_id} style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>#{order.order_id}</h4>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                          তারিখ: {new Date(order.created_at).toLocaleDateString('bn-BD')}
                        </p>
                        <p style={{ margin: 0, fontWeight: '500' }}>সর্বমোট: ৳{order.total}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge status-${order.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: '#e0f2fe', color: '#0284c7' }}>
                          {order.status_display}
                        </span>
                        <br/>
                        <Link href={`/track?id=${order.order_id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
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
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
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
                  <h4 style={{ margin: '0 0 1rem 0' }}>{editingAddressId ? 'ঠিকানা এডিট করুন' : 'নতুন ঠিকানা যোগ করুন'}</h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>ঠিকানার নাম (যেমন: বাসা, অফিস, মেস):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressName}
                      onChange={(e) => setAddressName(e.target.value)}
                      placeholder="যেমন: বাসা"
                      required
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>বিস্তারিত ঠিকানা:</label>
                    <textarea
                      className="form-control"
                      value={addressVal}
                      onChange={(e) => setAddressVal(e.target.value)}
                      placeholder="যেমন: বাসা নং ১২, ফ্ল্যাট ৩বি, রোড ৪, ধানমন্ডি"
                      required
                      rows={3}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>শহর/অঞ্চল:</label>
                    <select
                      className="form-control"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
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
                    <div key={addr.id} style={{ border: addr.isDefault ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)', borderRadius: '8px', padding: '1.2rem', background: addr.isDefault ? '#f0fdf4' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
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
            <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1rem' }}>প্রোফাইল সেটিংস</h2>
              
              {settingsMessage && <div style={{ padding: '10px 16px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>{settingsMessage}</div>}
              {settingsError && <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>{settingsError}</div>}
              
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>ফার্স্ট নেম (First Name):</label>
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>লাস্ট নেম (Last Name):</label>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>মোবাইল নম্বর (পরিবর্তনযোগ্য নয়):</label>
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

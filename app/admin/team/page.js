'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  getAdminSubadmins, 
  createAdminSubadmin, 
  updateAdminSubadmin, 
  deleteAdminSubadmin, 
  getAdminPermissions 
} from '@/lib/api';
import styles from './page.module.css';

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [subadmins, setSubadmins] = useState([]);
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subadminsData, permissionsData] = await Promise.all([
        getAdminSubadmins(),
        getAdminPermissions()
      ]);
      setSubadmins(Array.isArray(subadminsData) ? subadminsData : (subadminsData.results || []));
      setPermissionOptions(permissionsData);
      
      // Initialize selected permissions dict
      const initialPerms = {};
      permissionsData.forEach(p => {
        initialPerms[p.key] = false;
      });
      setSelectedPermissions(initialPerms);
    } catch (err) {
      setError(err.message || 'ডাটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (key) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    
    const resetPerms = {};
    permissionOptions.forEach(p => {
      resetPerms[p.key] = false;
    });
    setSelectedPermissions(resetPerms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
    if (!firstName || !lastName || !email) {
      setError('অনুগ্রহ করে নাম এবং ইমেইল প্রদান করুন।');
      return;
    }
    if (!editingId && !password) {
      setError('নতুন সাব-অ্যাডমিনের জন্য পাসওয়ার্ড প্রদান করা বাধ্যতামূলক।');
      return;
    }

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        permissions: selectedPermissions
      };
      
      if (password) {
        payload.password = password;
      }

      if (editingId) {
        await updateAdminSubadmin(editingId, payload);
        setSuccess('সাব-অ্যাডমিন তথ্য সফলভাবে আপডেট করা হয়েছে।');
      } else {
        await createAdminSubadmin(payload);
        setSuccess('নতুন সাব-অ্যাডমিন সফলভাবে তৈরি করা হয়েছে।');
      }
      
      resetForm();
      // Refresh list
      const updatedSubadmins = await getAdminSubadmins();
      setSubadmins(Array.isArray(updatedSubadmins) ? updatedSubadmins : (updatedSubadmins.results || []));
    } catch (err) {
      setError(err.message || 'সাবমিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleEdit = (subadmin) => {
    setError('');
    setSuccess('');
    setEditingId(subadmin.id);
    setFirstName(subadmin.first_name || '');
    setLastName(subadmin.last_name || '');
    setEmail(subadmin.email || '');
    setPassword(''); // Leave password blank on edit
    
    const perms = {};
    permissionOptions.forEach(p => {
      perms[p.key] = !!(subadmin.permissions && subadmin.permissions[p.key]);
    });
    setSelectedPermissions(perms);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই সাব-অ্যাডমিন অ্যাকাউন্টটি মুছে ফেলতে চান?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    try {
      await deleteAdminSubadmin(id);
      setSuccess('সাব-অ্যাডমিন অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।');
      // Refresh list
      const updatedSubadmins = await getAdminSubadmins();
      setSubadmins(Array.isArray(updatedSubadmins) ? updatedSubadmins : (updatedSubadmins.results || []));
    } catch (err) {
      setError(err.message || 'অ্যাকাউন্টটি মুছতে সমস্যা হয়েছে।');
    }
  };

  if (!user?.is_superuser && !user?.is_super_admin) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', marginTop: '4rem' }}>
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2>অনুমতি নেই</h2>
        <p>টিম ম্যানেজমেন্ট পেজে প্রবেশের ক্ষমতা শুধুমাত্র সুপার অ্যাডমিনের রয়েছে।</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>👥 টিম ম্যানেজমেন্ট (সাব-অ্যাডমিন)</h1>
      </div>

      {error && <div className={styles.errorAlert}>⚠️ {error}</div>}
      {success && <div className={styles.successAlert}>✅ {success}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#22c55e', fontWeight: 'bold' }}>
          লোড হচ্ছে...
        </div>
      ) : (
        <div className={styles.grid}>
          {/* Create/Edit Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              {editingId ? '✏️ সাব-অ্যাডমিন এডিট করুন' : '➕ নতুন সাব-অ্যাডমিন যোগ করুন'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>নামের প্রথম অংশ (First Name)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  placeholder="যেমন: ইসমাইল"
                />
              </div>

              <div className={styles.formGroup}>
                <label>নামের শেষ অংশ (Last Name)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  placeholder="যেমন: হোসাইন"
                />
              </div>

              <div className={styles.formGroup}>
                <label>ইমেইল এড্রেস (লগইন ইউজারনেম)</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="যেমন: admin@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  পাসওয়ার্ড {editingId && <span style={{ color: '#64748b', fontWeight: 'normal' }}>(পরিবর্তন না করতে চাইলে খালি রাখুন)</span>}
                </label>
                <input 
                  type="password" 
                  className={styles.input} 
                  required={!editingId}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড"
                />
              </div>

              <div className={styles.permissionSection}>
                <h3 className={styles.permissionTitle}>🛡️ সাব-অ্যাডমিনের ক্ষমতা নির্বাচন করুন (টিকমার্ক):</h3>
                <div className={styles.permissionGrid}>
                  {permissionOptions.map(p => (
                    <label key={p.key} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={!!selectedPermissions[p.key]}
                        onChange={() => handlePermissionChange(p.key)}
                      />
                      <span className={styles.checkboxText}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                {editingId ? '💾 তথ্য আপডেট করুন' : '🚀 সাব-অ্যাডমিন তৈরি করুন'}
              </button>

              {editingId && (
                <button type="button" className={styles.cancelBtn} onClick={resetForm}>
                  বাতিল করুন
                </button>
              )}
            </form>
          </div>

          {/* Subadmins List Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>👥 বর্তমান সাব-অ্যাডমিনবৃন্দ</h2>
            
            {subadmins.length === 0 ? (
              <div className={styles.emptyState}>
                কোনো সাব-অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।
              </div>
            ) : (
              <div className={styles.subadminList}>
                {subadmins.map(admin => (
                  <div key={admin.id} className={styles.subadminItem}>
                    <div className={styles.info}>
                      <div className={styles.name}>
                        {admin.first_name} {admin.last_name}
                      </div>
                      <div className={styles.email}>{admin.email}</div>
                      
                      <div className={styles.badgeGrid}>
                        {admin.is_super_admin ? (
                          <span className={`${styles.badge} ${styles.badgeSuper}`}>সুপার অ্যাডমিন</span>
                        ) : (
                          permissionOptions
                            .filter(p => admin.permissions && admin.permissions[p.key])
                            .map(p => (
                              <span key={p.key} className={`${styles.badge} ${styles.badgePerm}`}>
                                {p.label}
                              </span>
                            ))
                        )}
                        {(!admin.is_super_admin && (!admin.permissions || Object.values(admin.permissions).every(v => !v))) && (
                          <span className={styles.badge} style={{ background: '#334155', color: '#94a3b8' }}>
                            কোনো অনুমতি নেই
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button 
                        type="button" 
                        className={`${styles.iconBtn} ${styles.iconBtnEdit}`} 
                        onClick={() => handleEdit(admin)}
                        title="সম্পাদনা করুন"
                      >
                        ✏️ এডিট
                      </button>
                      <button 
                        type="button" 
                        className={`${styles.iconBtn} ${styles.iconBtnDelete}`} 
                        onClick={() => handleDelete(admin.id)}
                        title="মুছে ফেলুন"
                      >
                        🗑️ ডিলিট
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import styles from './page.module.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', slug: '', icon: '', description: '', order: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data.results || data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setEditingSlug(null);
    setFormData({ name: '', slug: '', icon: '', description: '', order: categories.length });
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingSlug(cat.slug);
    setFormData({
      name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, order: cat.order
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Need FormData for backend compatibility if they expect multipart or simple JSON
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));

      if (editingSlug) {
        await updateCategory(editingSlug, data);
        alert('ক্যাটাগরি আপডেট হয়েছে!');
      } else {
        await createCategory(data);
        alert('নতুন ক্যাটাগরি যোগ হয়েছে!');
      }
      
      setShowForm(false);
      fetchData();
    } catch (error) {
      alert(`সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি ডিলিট করতে চান? এর অধীনে থাকা বইগুলো আন-ক্যাটাগরাইজড হয়ে যাবে!')) {
      try {
        await deleteCategory(slug);
        setCategories(prev => prev.filter(c => c.slug !== slug));
        alert('ক্যাটাগরি সফলভাবে ডিলিট হয়েছে!');
      } catch (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  return (
    <>
      <div className={styles.topBar}>
        <h1>📂 ক্যাটাগরি ম্যানেজমেন্ট</h1>
        <button className="btn btn-primary" onClick={openAddForm}>
          + নতুন ক্যাটাগরি
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
           <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>আইকন</th>
                  <th>নাম</th>
                  <th>স্লাগ</th>
                  <th>ক্রম</th>
                  <th>বইয়ের সংখ্যা</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                    <td><strong>{cat.name}</strong></td>
                    <td>{cat.slug}</td>
                    <td>{cat.order}</td>
                    <td>{cat.book_count || 0}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => openEditForm(cat)} title="সম্পাদনা করুন">✏️</button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(cat.slug)} title="ডিলিট করুন">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>কোনো ক্যাটাগরি পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingSlug ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি যোগ করুন'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.catForm}>
              <div>
                <label>নাম *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="form-control" />
              </div>
              <div>
                <label>স্লাগ (URL) - ঐচ্ছিক</label>
                <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} className="form-control" placeholder="ফাঁকা রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে" />
              </div>
              <div>
                <label>আইকন (ইমোজি)</label>
                <input type="text" name="icon" value={formData.icon} onChange={handleInputChange} className="form-control" />
              </div>
              <div>
                <label>বিবরণ</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" rows="3"></textarea>
              </div>
              <div>
                <label>সাজানোর ক্রম</label>
                <input type="number" name="order" value={formData.order} onChange={handleInputChange} className="form-control" />
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>বাতিল</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

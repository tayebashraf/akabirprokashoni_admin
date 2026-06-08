'use client';
import { useState, useEffect } from 'react';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor, getImageUrl } from '@/lib/api';
import styles from '../categories/page.module.css';

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', slug: '', bio: ''
  });
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAuthors();
      setAuthors(data.results || data || []);
    } catch (error) {
      console.error("Error fetching authors:", error);
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

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const openAddForm = () => {
    setEditingSlug(null);
    setFormData({ name: '', slug: '', bio: '' });
    setFile(null);
    setShowForm(true);
  };

  const openEditForm = (author) => {
    setEditingSlug(author.slug);
    setFormData({
      name: author.name, slug: author.slug, bio: author.bio || ''
    });
    setFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) {
        data.append('image', file);
      }

      if (editingSlug) {
        await updateAuthor(editingSlug, data);
        alert('লেখকের তথ্য আপডেট হয়েছে!');
      } else {
        await createAuthor(data);
        alert('নতুন লেখক যোগ হয়েছে!');
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
    if (window.confirm('আপনি কি নিশ্চিত যে এই লেখককে ডিলিট করতে চান? এর অধীনে থাকা বইগুলো আন-অ্যাসাইন হয়ে যাবে!')) {
      try {
        await deleteAuthor(slug);
        setAuthors(prev => prev.filter(c => c.slug !== slug));
        alert('লেখক সফলভাবে ডিলিট হয়েছে!');
      } catch (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে।');
      }
    }
  };

  return (
    <>
      <div className={styles.topBar}>
        <h1>✍️ লেখক ম্যানেজমেন্ট</h1>
        <button className="btn btn-primary" onClick={openAddForm}>
          + নতুন লেখক
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
                  <th>ছবি</th>
                  <th>নাম</th>
                  <th>স্লাগ</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {authors.map(author => (
                  <tr key={author.id}>
                    <td>
                      {author.image ? (
                        <img src={getImageUrl(author.image)} alt={author.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>👤</span>
                      )}
                    </td>
                    <td><strong>{author.name}</strong></td>
                    <td>{author.slug}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => openEditForm(author)} title="সম্পাদনা করুন">✏️</button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(author.slug)} title="ডিলিট করুন">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {authors.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>কোনো লেখক পাওয়া যায়নি</td></tr>
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
              <h2>{editingSlug ? 'লেখক সম্পাদনা' : 'নতুন লেখক যোগ করুন'}</h2>
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
                <label>পরিচিতি (Bio)</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="form-control" rows="3"></textarea>
              </div>
              <div>
                <label>ছবি</label>
                <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="form-control" />
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

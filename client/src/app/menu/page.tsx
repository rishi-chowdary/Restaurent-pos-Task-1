'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  MenuItem,
  getMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  deactivateMenuItemApi,
} from '../../lib/api';
import {
  Plus,
  Edit2,
  Power,
  CheckCircle,
  AlertCircle,
  Search,
  BookOpen,
  DollarSign,
  X,
} from 'lucide-react';

export default function MenuManagementPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [errorBanner, setErrorBanner] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/pos');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  const loadItems = () => {
    getMenuItemsApi()
      .then((items) => setMenuItems(items))
      .catch((err) => setErrorBanner(err.message || 'Failed to load menu'));
  };

  useEffect(() => {
    if (isAdmin) {
      loadItems();
    }
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Burgers');
    setFormPrice('');
    setFormAvailable(true);
    setFormActive(true);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormAvailable(item.isAvailable);
    setFormActive(item.isActive);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const numericPrice = parseFloat(formPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setModalError('Price must be a positive number');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        const updated = await updateMenuItemApi(editingItem._id, {
          name: formName.trim(),
          category: formCategory.trim(),
          price: numericPrice,
          isAvailable: formAvailable,
          isActive: formActive,
        });
        setMenuItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
      } else {
        const created = await createMenuItemApi({
          name: formName.trim(),
          category: formCategory.trim(),
          price: numericPrice,
          isAvailable: formAvailable,
          isActive: formActive,
        });
        setMenuItems((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (id: string) => {
    try {
      const updated = await deactivateMenuItemApi(id);
      setMenuItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to toggle status');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await updateMenuItemApi(item._id, {
        isAvailable: !item.isAvailable,
      });
      setMenuItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to toggle availability');
    }
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map((it) => it.category)))];

  const filteredItems = menuItems.filter((it) => {
    const matchesCat = selectedCategory === 'All' || it.category === selectedCategory;
    const matchesQuery = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
            Menu Catalog Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
            Configure dishes, set prices, toggle daily availability, and deactivate seasonal items
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={16} /> Add New Dish
        </button>
      </div>

      {errorBanner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          color: '#fb7185',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          {errorBanner}
        </div>
      )}

      {/* Filter and search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: selectedCategory === cat ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                background: selectedCategory === cat ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#f59e0b' : '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search catalog..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.8px' }}>
              <th style={{ padding: '14px 18px' }}>Item Name</th>
              <th style={{ padding: '14px 18px' }}>Category</th>
              <th style={{ padding: '14px 18px' }}>Price</th>
              <th style={{ padding: '14px 18px' }}>In Stock</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 18px', fontWeight: '700', color: '#f8fafc' }}>
                  {item.name}
                </td>
                <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                  <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                    {item.category}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', fontWeight: '700', color: '#f59e0b' }}>
                  ${item.price.toFixed(2)}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    style={{
                      border: 'none',
                      background: item.isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: item.isAvailable ? '#10b981' : '#fb7185',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {item.isAvailable ? 'Available' : 'Out of Stock (86)'}
                  </button>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    color: item.isActive ? '#10b981' : '#64748b',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {item.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(item)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleDeactivate(item._id)}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: item.isActive ? '#fb7185' : '#10b981'
                      }}
                      title={item.isActive ? 'Deactivate Item' : 'Activate Item'}
                    >
                      <Power size={12} /> {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                color: '#fb7185',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Brioche Burger"
                  className="input-field"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burgers, Pizzas, Beverages"
                  className="input-field"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="14.99"
                  className="input-field"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                  />
                  <span>Available (In Stock)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  <span>Active in Catalog</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  MenuItem,
  Order,
  getMenuItemsApi,
  createOrderApi,
  getSettingsApi,
} from '../../lib/api';
import { ReceiptModal } from '../../components/receipt-modal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Receipt,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function PosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(5.0);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [tableNumber, setTableNumber] = useState<string>('T1');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string>('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    getMenuItemsApi()
      .then((items) => setMenuItems(items))
      .catch((err) => setErrorBanner(err.message || 'Failed to load menu'));

    getSettingsApi()
      .then((settings) => setTaxRate(settings.taxRate))
      .catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuItems.map((item) => item.category)));
    return ['All', ...unique];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    if (!item.isActive || !item.isAvailable) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.menuItem._id === item._id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItem._id === itemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setErrorBanner('');
  };

  // Preview calculations (server strictly re-computes on submit)
  const cartSubtotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const estimatedDiscount = discountType === 'percent'
    ? (cartSubtotal * discountValue) / 100
    : discountValue;
  const clampedDiscount = Math.min(cartSubtotal, Math.max(0, estimatedDiscount));
  const estimatedTax = (Math.max(0, cartSubtotal - clampedDiscount) * taxRate) / 100;
  const estimatedTotal = Math.max(0, cartSubtotal - clampedDiscount + estimatedTax);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setErrorBanner('Please select at least one item');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      setErrorBanner('Please specify a table number for dine-in orders');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorBanner('');

      const newOrder = await createOrderApi({
        type: orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber.trim() : undefined,
        items: cart.map((c) => ({
          menuItem: c.menuItem._id,
          quantity: c.quantity,
        })),
        discountType,
        discountValue,
      });

      setPlacedOrder(newOrder);
      setShowReceipt(true);
      setCart([]);
      setDiscountValue(0);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
      {/* Left panel: Indian Menu catalog browser */}
      <div>
        {/* Placed order alert banner */}
        {placedOrder && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            color: '#a7f3d0',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#10b981" />
              <div>
                <span style={{ fontWeight: '700', color: '#f8fafc' }}>
                  Order {placedOrder.orderNumber} placed successfully!
                </span>
                <span style={{ fontSize: '13px', marginLeft: '8px' }}>
                  Total: ₹{placedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowReceipt(true)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Receipt size={14} /> Receipt
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                View in Orders
              </button>
            </div>
          </div>
        )}

        {/* Filter and search bar */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Indian dishes, biryanis, curries..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

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
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
          {filteredItems.map((item) => {
            const isClickable = item.isActive && item.isAvailable;
            return (
              <div
                key={item._id}
                onClick={() => isClickable && addToCart(item)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  opacity: isClickable ? 1 : 0.45,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  minHeight: '130px'
                }}
                className="menu-card"
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: '700', letterSpacing: '0.5px' }}>
                    {item.category}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', marginTop: '4px', lineHeight: 1.3 }}>
                    {item.name}
                  </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                    ₹{item.price.toFixed(2)}
                  </div>

                  {isClickable ? (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plus size={18} />
                    </div>
                  ) : (
                    <span className="badge badge-cancelled" style={{ fontSize: '10px' }}>
                      {!item.isActive ? 'Inactive' : 'Sold Out'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Live Order Pad & Cart */}
      <div className="glass-panel" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>KOT / Current Order</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>

        {errorBanner && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            color: '#fb7185',
            fontSize: '12px',
            marginBottom: '14px'
          }}>
            <AlertCircle size={15} />
            {errorBanner}
          </div>
        )}

        {/* Order Type & Table Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={() => setOrderType('dine-in')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: orderType === 'dine-in' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: orderType === 'dine-in' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
              color: orderType === 'dine-in' ? '#f59e0b' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Dine-In
          </button>
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: orderType === 'takeaway' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: orderType === 'takeaway' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
              color: orderType === 'takeaway' ? '#f59e0b' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Takeaway (Parcel)
          </button>
        </div>

        {orderType === 'dine-in' && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Table Number
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. Table 4"
              className="input-field"
            />
          </div>
        )}

        {/* Cart items list */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
              <Utensils size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontSize: '13px' }}>Cart is empty</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Click dishes on the left to add</div>
            </div>
          ) : (
            cart.map(({ menuItem, quantity }) => (
              <div
                key={menuItem._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {menuItem.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    ₹{menuItem.price.toFixed(2)} &bull; ₹{(menuItem.price * quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => updateQuantity(menuItem._id, -1)}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#cbd5e1', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(menuItem._id, 1)}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#cbd5e1', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeFromCart(menuItem._id)}
                    style={{ background: 'transparent', border: 'none', color: '#fb7185', padding: '4px', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount section */}
        {cart.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>
              <Tag size={13} color="#f59e0b" /> Add Discount
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px' }}>
              <select
                className="input-field"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                style={{ padding: '6px 8px', fontSize: '12px' }}
              >
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0.00"
                className="input-field"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
            </div>
          </div>
        )}

        {/* Bill Breakdown */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>Subtotal:</span>
            <span>₹{cartSubtotal.toFixed(2)}</span>
          </div>

          {clampedDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185' }}>
              <span>Discount:</span>
              <span>-₹{clampedDiscount.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>GST ({taxRate}%):</span>
            <span>₹{estimatedTax.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: '#f8fafc', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
            <span>Total:</span>
            <span style={{ color: '#f59e0b' }}>₹{estimatedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Order button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cart.length === 0}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', marginTop: '16px', fontSize: '15px' }}
        >
          <Sparkles size={18} />
          {isSubmitting ? 'Placing Order...' : `Generate KOT (${cart.reduce((s, c) => s + c.quantity, 0)} items)`}
        </button>
      </div>

      {/* Printable Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          order={placedOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

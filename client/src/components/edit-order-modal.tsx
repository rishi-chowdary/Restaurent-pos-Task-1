'use client';

import React, { useState, useEffect } from 'react';
import { Order, MenuItem, getMenuItemsApi, updateOrderItemsApi } from '../lib/api';
import { Plus, Minus, Trash2, AlertCircle, X, Check } from 'lucide-react';

interface EditOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

interface EditableItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export function EditOrderModal({ order, onClose, onOrderUpdated }: EditOrderModalProps) {
  const [items, setItems] = useState<EditableItem[]>([]);
  const [availableMenuItems, setAvailableMenuItems] = useState<MenuItem[]>([]);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (order) {
      setItems(
        order.items.map((it) => ({
          menuItemId: typeof it.menuItem === 'object' ? (it.menuItem as any)._id : it.menuItem,
          name: it.nameSnapshot,
          price: it.priceSnapshot,
          quantity: it.quantity,
        }))
      );
      setDiscountType(order.discountType || 'flat');
      setDiscountValue(order.discountValue || 0);
    }
  }, [order]);

  useEffect(() => {
    getMenuItemsApi({ available: true })
      .then((data) => {
        setAvailableMenuItems(data.filter((item) => item.isActive));
      })
      .catch(() => {});
  }, []);

  if (!order) return null;

  const handleQuantityChange = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setItems(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleAddItem = () => {
    if (!selectedToAdd) return;
    const menuItem = availableMenuItems.find((m) => m._id === selectedToAdd);
    if (!menuItem) return;

    const existingIndex = items.findIndex((it) => it.menuItemId === menuItem._id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ]);
    }
    setSelectedToAdd('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Order must have at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateOrderItemsApi(order._id, {
        items: items.map((it) => ({ menuItem: it.menuItemId, quantity: it.quantity })),
        discountType,
        discountValue,
      });

      onOrderUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update order items');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
              Edit Pending Order
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Order: <span className="mono" style={{ color: '#f59e0b' }}>{order.orderNumber}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
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
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Add item dropdown */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <select
              className="input-field"
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">-- Add another menu item --</option>
              {availableMenuItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (₹{item.price.toFixed(2)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedToAdd}
              className="btn btn-secondary"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Current order items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
            {items.map((item, index) => (
              <div
                key={item.menuItemId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    ₹{item.price.toFixed(2)} each &bull; Line: ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, -1)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '4px 6px', cursor: 'pointer' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, 1)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '4px 6px', cursor: 'pointer' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    style={{ background: 'transparent', border: 'none', color: '#fb7185', padding: '6px', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Discount Type
              </label>
              <select
                className="input-field"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
              >
                <option value="flat">Flat Rupees (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Discount Value
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
            * Note: Totals, line items, and taxes are strictly recalculated on the server from current database prices upon saving.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <Check size={16} />
              {isSubmitting ? 'Saving...' : 'Recalculate & Save Order'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

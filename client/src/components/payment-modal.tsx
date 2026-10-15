'use client';

import React, { useState } from 'react';
import { Order, recordPaymentApi } from '../lib/api';
import { Banknote, QrCode, CreditCard, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: (updatedOrder: Order) => void;
}

export function PaymentModal({ order, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!order) return null;

  const totalDue = order.total;
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericTendered - totalDue);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (method === 'Cash' && numericTendered < totalDue) {
      setErrorMessage(`Insufficient cash tendered. Total due is ₹${totalDue.toFixed(2)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await recordPaymentApi(order._id, {
        method,
        amount: totalDue, // Server strictly enforces amount === order.total
        reference: method === 'Cash' ? (cashTendered ? `Tendered ₹${numericTendered}, Change ₹${changeDue.toFixed(2)}` : undefined) : reference || undefined,
      });

      onPaymentSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
              Record Payment
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

        {/* Bill summary banner */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', fontWeight: '700' }}>
            Total Amount Due
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
            ₹{totalDue.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {order.items.length} items &bull; {order.type.toUpperCase()} {order.tableNumber ? `(Table ${order.tableNumber})` : ''}
          </div>
        </div>

        {/* Payment method selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { id: 'Cash', label: 'Cash (INR)', icon: Banknote },
            { id: 'UPI', label: 'UPI / QR', icon: QrCode },
            { id: 'Card', label: 'Card / POS', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = method === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
                  color: isSelected ? '#f59e0b' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={22} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {method === 'Cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Cash Tendered (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min={totalDue}
                  className="input-field"
                  placeholder={`Exact: ₹${totalDue.toFixed(2)}`}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                />
              </div>

              {/* Quick cash denomination chips for Indian currency */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickCash(totalDue)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '11px' }}
                >
                  Exact (₹{totalDue.toFixed(2)})
                </button>
                {[100, 200, 500, 1000, 2000].filter((val) => val >= totalDue).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickCash(val)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {numericTendered >= totalDue && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#a7f3d0', fontWeight: '600' }}>Change Return:</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                    ₹{changeDue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {method === 'UPI' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 10px',
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={100} color="#000000" />
                </div>
                <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600' }}>
                  Scan UPI QR (PhonePe / GPay / Paytm) to Pay ₹{totalDue.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  UPI ID: royalcuisine@okhdfcbank &bull; Instant Settlement
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  UPI Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 428901847291"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
          )}

          {method === 'Card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                padding: '14px',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CreditCard size={28} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                    Swipe / Tap Card on POS EDC Machine
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Terminal will charge exactly ₹{totalDue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Card Auth Code / Reference
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. AUTH-884920"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-success"
              style={{ flex: 1, padding: '12px' }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Recording...' : `Confirm Payment (₹${totalDue.toFixed(2)})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

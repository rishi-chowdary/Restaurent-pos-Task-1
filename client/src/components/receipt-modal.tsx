'use client';

import React from 'react';
import { Order } from '../lib/api';
import { Printer, X } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px', background: '#0f172a' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>Customer Receipt</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable thermal receipt view */}
        <div className="receipt-paper">
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px', margin: '0 0 4px 0' }}>
              SAVOR RESTAURANT & BAR
            </h2>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>742 Evergreen Terrace, Suite 100</div>
            <div style={{ fontSize: '11px', color: '#4b5563' }}>Tel: (555) 234-5678</div>
            <div style={{ margin: '8px 0', borderBottom: '1px dashed #9ca3af' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Order #: {order.orderNumber}</span>
              <span style={{ textTransform: 'uppercase', fontWeight: '700' }}>{order.type}</span>
            </div>
            {order.tableNumber && (
              <div style={{ textAlign: 'left', fontSize: '11px', marginTop: '2px' }}>
                Table: <strong>{order.tableNumber}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px', color: '#4b5563' }}>
              <span>{formattedDate}</span>
              <span>Server: {order.createdBy?.name || 'Staff'}</span>
            </div>
          </div>

          <div style={{ margin: '8px 0', borderBottom: '1px dashed #9ca3af' }} />

          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #d1d5db', textTransform: 'uppercase' }}>
                <th style={{ padding: '4px 0' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px dotted #e5e7eb' }}>
                  <td style={{ padding: '6px 0', fontWeight: '600' }}>{item.nameSnapshot}</td>
                  <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>${item.priceSnapshot.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>${item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ margin: '12px 0 8px 0', borderBottom: '1px dashed #9ca3af' }} />

          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                <span>Discount ({order.discountType === 'percent' ? `${order.discountValue}%` : 'Flat'}):</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax ({order.taxRate}%):</span>
              <span>${order.taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #111827' }}>
              <span>TOTAL DUE:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ margin: '12px 0', borderBottom: '1px dashed #9ca3af' }} />

          <div style={{ fontSize: '11px', textAlign: 'center' }}>
            {order.paymentStatus === 'Paid' && order.payment ? (
              <div style={{ padding: '6px', background: '#ecfdf5', borderRadius: '4px', border: '1px solid #a7f3d0', color: '#065f46' }}>
                <div style={{ fontWeight: '700' }}>PAID VIA {order.payment.method.toUpperCase()}</div>
                <div>Amount: ${order.payment.amount.toFixed(2)}</div>
                {order.payment.reference && <div>Ref: {order.payment.reference}</div>}
              </div>
            ) : (
              <div style={{ padding: '6px', background: '#fffbeb', borderRadius: '4px', border: '1px solid #fde68a', color: '#92400e', fontWeight: '700' }}>
                PAYMENT STATUS: UNPAID
              </div>
            )}
            <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '10px' }}>
              Thank you for dining with us!<br />Please retain this receipt for your records.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1 }}>
            <Printer size={16} />
            Print Receipt
          </button>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

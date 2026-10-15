'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  Order,
  getOrdersApi,
  updateOrderStatusApi,
  cancelOrderApi,
} from '../../lib/api';
import { ReceiptModal } from '../../components/receipt-modal';
import { PaymentModal } from '../../components/payment-modal';
import { EditOrderModal } from '../../components/edit-order-modal';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  CreditCard,
  Edit,
  XCircle,
  Printer,
  ChevronRight,
  AlertCircle,
  ChefHat,
  BellRing,
} from 'lucide-react';

export default function OrdersPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string>('');

  // Modals state
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeEditOrder, setActiveEditOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrorBanner('');
      const params: { status?: string; q?: string } = {};
      if (selectedStatus !== 'All') {
        params.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }

      const res = await getOrdersApi(params);
      setOrders(res.orders);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to fetch orders');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      setErrorBanner('');
      const updated = await updateOrderStatusApi(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err: any) {
      setErrorBanner(err.message || 'Status transition failed');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setErrorBanner('');
      const updated = await cancelOrderApi(orderId);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="badge badge-pending">Pending</span>;
      case 'Preparing':
        return <span className="badge badge-preparing">Preparing</span>;
      case 'Ready':
        return <span className="badge badge-ready">Ready</span>;
      case 'Completed':
        return <span className="badge badge-completed">Completed</span>;
      case 'Cancelled':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
            Live Orders & Kitchen Board
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
            Track order lifecycles, kitchen preparations, and billing settlements in Indian Rupees (₹)
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isRefreshing}
          className="btn btn-secondary"
          style={{ padding: '8px 14px' }}
        >
          <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Queue
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

      {/* Filter tabs and search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: selectedStatus === status ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                background: selectedStatus === status ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
                color: selectedStatus === status ? '#f59e0b' : '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search order number..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#94a3b8' }}>No orders found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>There are currently no orders matching this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {orders.map((order) => {
            const isPending = order.status === 'Pending';
            const isPreparing = order.status === 'Preparing';
            const isReady = order.status === 'Ready';
            const isCompleted = order.status === 'Completed';
            const isCancelled = order.status === 'Cancelled';
            const isPaid = order.paymentStatus === 'Paid';

            return (
              <div
                key={order._id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderLeft: isPending
                    ? '4px solid #f59e0b'
                    : isPreparing
                    ? '4px solid #38bdf8'
                    : isReady
                    ? '4px solid #a78bfa'
                    : isCompleted
                    ? '4px solid #10b981'
                    : '4px solid #f43f5e',
                }}
              >
                {/* Header: Order number, date, badges */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div className="mono" style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                        <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{order.type}</span>{' '}
                        {order.tableNumber ? `(Table ${order.tableNumber})` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {getStatusBadge(order.status)}
                      <span className={`badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}`} style={{ fontSize: '10px' }}>
                        {isPaid ? `Paid (${order.payment?.method})` : 'Unpaid'}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px', margin: '10px 0' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                      Order Items
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#cbd5e1' }}>
                            <strong style={{ color: '#f59e0b' }}>{item.quantity}x</strong> {item.nameSnapshot}
                          </span>
                          <span style={{ color: '#94a3b8' }}>₹{item.lineTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Financials & Server name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    <div>By: {order.createdBy?.name || 'Staff'}</div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                        ₹{order.total.toFixed(2)}
                      </span>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        (GST: ₹{order.taxAmount.toFixed(2)}{order.discountAmount > 0 ? `, Disc: -₹${order.discountAmount.toFixed(2)}` : ''})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  {/* Status Progression buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isPending && (
                      <button
                        onClick={() => handleStatusTransition(order._id, 'Preparing')}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                      >
                        <ChefHat size={14} /> Send to Kitchen
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleStatusTransition(order._id, 'Ready')}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#ffffff' }}
                      >
                        <BellRing size={14} /> Ready to Serve
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => {
                          if (!isPaid) {
                            setActivePaymentOrder(order);
                          } else {
                            handleStatusTransition(order._id, 'Completed');
                          }
                        }}
                        className="btn btn-success"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                        title={!isPaid ? 'Payment must be recorded before completing' : 'Complete Order'}
                      >
                        <CheckCircle size={14} />
                        {isPaid ? 'Complete Order' : 'Pay & Complete'}
                      </button>
                    )}

                    {/* Record payment button if unpaid */}
                    {!isPaid && !isCancelled && (
                      <button
                        onClick={() => setActivePaymentOrder(order)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
                      >
                        <CreditCard size={14} /> Settle Bill
                      </button>
                    )}
                  </div>

                  {/* Secondary actions: Edit (if Pending), Receipt, Cancel (if Admin) */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {isPending && (
                      <button
                        onClick={() => setActiveEditOrder(order)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <Edit size={12} /> Edit Items
                      </button>
                    )}

                    <button
                      onClick={() => setActiveReceiptOrder(order)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                    >
                      <Printer size={12} /> Bill / Receipt
                    </button>

                    {isAdmin && !isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        title="Admin Cancel Order"
                      >
                        <XCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(updated) => {
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
          }}
        />
      )}

      {activeEditOrder && (
        <EditOrderModal
          order={activeEditOrder}
          onClose={() => setActiveEditOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

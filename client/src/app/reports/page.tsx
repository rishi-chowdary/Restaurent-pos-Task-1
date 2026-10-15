'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { DailyReport, getDailySalesReportApi } from '../../lib/api';
import {
  Calendar,
  TrendingUp,
  Receipt,
  Users,
  Award,
  Banknote,
  QrCode,
  CreditCard,
  AlertCircle,
  BarChart,
  IndianRupee,
} from 'lucide-react';

export default function DailyReportsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string>('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/pos');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  const loadReport = (targetDate: string) => {
    setIsFetching(true);
    setErrorBanner('');
    getDailySalesReportApi(targetDate)
      .then((data) => setReport(data))
      .catch((err) => setErrorBanner(err.message || 'Failed to fetch sales report'))
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    if (isAdmin) {
      loadReport(date);
    }
  }, [isAdmin, date]);

  const totalPaymentSum = report
    ? report.paymentBreakdown.Cash.amount +
      report.paymentBreakdown.UPI.amount +
      report.paymentBreakdown.Card.amount
    : 0;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
            Daily Sales & Staff Performance
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
            Audited financial breakdown in Indian Rupees (₹), tender settlement channels, and cashier leaderboard
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="#f59e0b" />
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }}
          />
        </div>
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

      {report && (
        <>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: '700' }}>
                  Total Revenue
                </span>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <IndianRupee size={18} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
                ₹{report.summary.totalRevenue.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>
                {report.summary.paidOrdersCount} orders paid
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: '700' }}>
                  Orders Completed
                </span>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Receipt size={18} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
                {report.summary.completedOrders}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                Out of {report.summary.totalOrders} total orders today
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: '700' }}>
                  Avg Order Value
                </span>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
                ₹{report.summary.averageOrderValue.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                Per settled ticket
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', fontWeight: '700' }}>
                  GST Collected
                </span>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                  <BarChart size={18} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
                ₹{report.summary.totalTaxCollected.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                Discounts given: ₹{report.summary.totalDiscountGiven.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Payment Method Breakdown */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#f59e0b" /> Settlement Channels
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    name: 'Cash (INR)',
                    data: report.paymentBreakdown.Cash,
                    icon: Banknote,
                    color: '#10b981',
                  },
                  {
                    name: 'UPI / QR',
                    data: report.paymentBreakdown.UPI,
                    icon: QrCode,
                    color: '#0ea5e9',
                  },
                  {
                    name: 'Card / POS',
                    data: report.paymentBreakdown.Card,
                    icon: CreditCard,
                    color: '#f59e0b',
                  },
                ].map((channel) => {
                  const Icon = channel.icon;
                  const percentage = totalPaymentSum > 0 ? (channel.data.amount / totalPaymentSum) * 100 : 0;

                  return (
                    <div key={channel.name} style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={16} color={channel.color} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{channel.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>({channel.data.count} txns)</span>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                          ₹{channel.data.amount.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: channel.color, borderRadius: '9999px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff Performance Leaderboard */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#f59e0b" /> Staff Sales Performance
              </h3>

              {report.staffBreakdown.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No staff activity recorded for this date.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {report.staffBreakdown.map((staff, idx) => (
                    <div
                      key={staff.staffId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                          color: idx === 0 ? '#0b0f19' : '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800'
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{staff.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{staff.orderCount} orders created</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#10b981' }}>
                          ₹{staff.totalSales.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#f59e0b" /> Top Selling Indian Dishes
            </h3>

            {report.topSellingItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No items sold on this date.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {report.topSellingItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', marginTop: '2px' }}>
                        {item.quantity} portions served
                      </div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                      ₹{item.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

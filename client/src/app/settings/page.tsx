'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { getSettingsApi, updateSettingsApi } from '../../lib/api';
import { Sliders, Save, CheckCircle, AlertCircle, Percent, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [taxRate, setTaxRate] = useState<string>('5.0');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string>('');
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

  useEffect(() => {
    if (isAdmin) {
      getSettingsApi()
        .then((data) => setTaxRate(data.taxRate.toString()))
        .catch((err) => setErrorBanner(err.message || 'Failed to fetch settings'));
    }
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner('');
    setErrorBanner('');

    const numeric = parseFloat(taxRate);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      setErrorBanner('Tax rate must be between 0% and 100%');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateSettingsApi(numeric);
      setTaxRate(updated.taxRate.toString());
      setSuccessBanner(`Tax rate updated successfully to ${updated.taxRate}%!`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const parsedTax = parseFloat(taxRate) || 0;
  const sampleSubtotal = 100.0;
  const sampleTax = (sampleSubtotal * parsedTax) / 100;
  const sampleTotal = sampleSubtotal + sampleTax;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <Sliders size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>
            System Tax & POS Settings
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
            Configure default sales tax applied across all customer orders
          </p>
        </div>
      </div>

      {successBanner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          color: '#a7f3d0',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <CheckCircle size={18} color="#10b981" />
          {successBanner}
        </div>
      )}

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

      <div className="glass-panel" style={{ padding: '28px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Percent size={15} color="#f59e0b" /> Default Sales Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              className="input-field"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              style={{ fontSize: '16px', fontWeight: '700', maxWidth: '240px' }}
            />
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              Applied automatically to all new Dine-In and Takeaway orders.
            </p>
          </div>

          {/* Real-time tax preview card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', fontWeight: '700', marginBottom: '10px' }}>
              Calculation Simulation (Sample $100.00 Ticket)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
              <span>Sample Subtotal:</span>
              <span>${sampleSubtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
              <span>Calculated Tax ({parsedTax}%):</span>
              <span>${sampleTax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#f8fafc', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
              <span>Estimated Order Total:</span>
              <span style={{ color: '#f59e0b' }}>${sampleTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <ShieldCheck size={14} color="#10b981" />
            Admin-only privilege. Changes are logged and audited in database settings.
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ padding: '12px 20px', alignSelf: 'flex-start' }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}

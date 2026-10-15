'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { UtensilsCrossed, ShieldCheck, UserCheck, AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Logo and header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 16px auto',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
            color: '#0b0f19'
          }}>
            <UtensilsCrossed size={30} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.5px' }}>
            SAVOR<span style={{ color: '#f59e0b' }}>POS</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            Sign in to access POS registers and kitchen displays
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            color: '#fb7185',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="e.g. staff@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px' }}
          >
            <LogIn size={18} />
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo login shortcuts */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>
            Instant Demo Credentials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@restaurant.com', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'flex-start' }}
            >
              <ShieldCheck size={16} color="#f59e0b" />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>Admin</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Full Access</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('staff@restaurant.com', 'staff123')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px 10px', justifyContent: 'flex-start' }}
            >
              <UserCheck size={16} color="#38bdf8" />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div>Staff</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Order & Pay</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

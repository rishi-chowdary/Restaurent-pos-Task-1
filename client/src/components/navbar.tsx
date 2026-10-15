'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  UtensilsCrossed,
  ClipboardList,
  BookOpen,
  BarChart3,
  Sliders,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  const navLinks = [
    { href: '/pos', label: 'Order Taker (POS)', icon: UtensilsCrossed },
    { href: '/orders', label: 'Order Board', icon: ClipboardList },
    ...(isAdmin
      ? [
          { href: '/menu', label: 'Menu Mgmt', icon: BookOpen },
          { href: '/reports', label: 'Daily Sales', icon: BarChart3 },
          { href: '/settings', label: 'Tax Settings', icon: Sliders },
        ]
      : []),
  ];

  return (
    <header className="glass-panel" style={{ margin: '16px 20px', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/pos" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
            color: '#0b0f19'
          }}>
            <UtensilsCrossed size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#f8fafc' }}>
              SAVOR<span style={{ color: '#f59e0b' }}>POS</span>
            </span>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: '700' }}>
              Kitchen & Point of Sale
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '8px' }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#f59e0b' : '#94a3b8'} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: user.role === 'Admin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                border: user.role === 'Admin' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(14, 165, 233, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: user.role === 'Admin' ? '#f59e0b' : '#38bdf8'
              }}>
                <UserIcon size={18} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    color: user.role === 'Admin' ? '#f59e0b' : '#38bdf8',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '0.5px'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
              title="Sign out"
            >
              <LogOut size={14} />
              Exit
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

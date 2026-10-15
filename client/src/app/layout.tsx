import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/navbar';

export const metadata: Metadata = {
  title: 'Savor POS - Restaurant Point of Sale & Order Management',
  description: 'Production-ready Restaurant POS & Order Management System for modern dining and takeaway',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '0 20px 24px 20px' }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

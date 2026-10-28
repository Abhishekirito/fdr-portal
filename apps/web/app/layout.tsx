import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AICTE Security Deposit / FDR Portal | Regulation Bureau',
  description:
    'Centralized, secure, role-based portal for AICTE Regulation Bureau to manage institution security deposits and Fixed Deposit Receipts (FDRs).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}

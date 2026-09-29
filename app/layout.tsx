import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:8080'),
  title: 'Can I steal you for a date?',
  description: 'A tiny invitation with a very charming cat and a date idea waiting for you.',
  openGraph: {
    title: 'Can I steal you for a date?',
    description: 'Pick a day. I’ll plan the cute part.',
    images: [{ url: '/og.png', width: 1733, height: 907, alt: 'A charming cat invites you to pick a date.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Can I steal you for a date?',
    description: 'Pick a day. I’ll plan the cute part.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

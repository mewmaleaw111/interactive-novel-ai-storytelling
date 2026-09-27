import React from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Sarabun } from 'next/font/google';

import '@/styles/globals.css';
import '@/styles/navbar.css';
import '@/styles/library.css';
import '@/styles/discover.css';
import '@/styles/mystories.css';
import '@/styles/profile.css';
import '@/styles/reader.css';
import '@/styles/story-create.css';
import '@/styles/story-modal.css';
import '@/styles/admin.css';
import '@/styles/admin-dashboard.css';
import '@/styles/admin-stories.css';
import '@/styles/admin-users.css';
import '@/styles/admin-stories-loading.css';
import '@/styles/admin-user-detail.css';

import { Navbar } from '@/components/Navbar';


/* =========================================================
   METADATA
========================================================= */

export const metadata: Metadata = {
  title: 'GonnaTales',
  description: 'Interactive AI Storytelling',

  icons: {
    icon: '/images/icon.png',
  },

  openGraph: {
    title: 'GonnaTales',
    description: 'Interactive AI Storytelling',
    images: [
      {
        url: '/images/icon.png',
        alt: 'GonnaTales',
      },
    ],
  },
};


/* =========================================================
   FONTS
========================================================= */

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});


/* =========================================================
   ROOT LAYOUT
========================================================= */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="th">
        <body className={`${sarabun.variable} ${inter.variable}`}>
          <Navbar />

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
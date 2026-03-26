import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConditionalMain from '@/components/ConditionalMain';
import RealtimeWatcher from '@/components/RealtimeWatcher';

export const metadata: Metadata = {
  title: 'CodePrix — Where Code Meets Speed',
  description: 'The ultimate F1-inspired competitive coding event.',
};

import IntroMusic from '@/components/IntroMusic';
import NoCopy from '@/components/NoCopy';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RealtimeWatcher />
        <NoCopy />
        <Navbar />
        <IntroMusic />
        <ConditionalMain>{children}</ConditionalMain>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from '../providers';
import Header from '../components/Header';
import WrongNetworkBanner from '../components/WrongNetworkBanner';
import BottomNav from '../components/BottomNav';
import StatusBar from '../components/StatusBar';
import Toaster from '../components/Toaster';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb-mono' });

export const metadata: Metadata = {
  title: 'RFQ Trading',
  description: 'Trade on-chain options via RFQ on Base',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'light') {
              document.documentElement.classList.add('light');
            }
          } catch {}
        ` }} />
      </head>
      <body className={mono.variable}>
        <Providers>
          <Header />
          <WrongNetworkBanner />
          <main className="pb-20 md:pb-[108px]">
            {children}
          </main>
          <BottomNav />
          <StatusBar />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './ui.css';

/**
 * Geist for display and body, Geist Mono for figures and labels. Both are
 * loaded as variable fonts, which is one file per family and gives the design
 * system the intermediate weights (450 for nav, 500 for headings) it uses.
 *
 * next/font self-hosts them, so there is no render-blocking request to a CDN.
 */
const display = Geist({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LUMEN MUN · Edition I, Guntur',
    template: '%s · LUMEN MUN',
  },
  description:
    'LUMEN MUN is the inaugural Model United Nations conference of Guntur. Three hundred delegates, three committees, three days.',
  openGraph: {
    type: 'website',
    siteName: 'LUMEN MUN',
    title: 'LUMEN MUN · Edition I, Guntur',
    description:
      'The inaugural Model United Nations conference of Guntur. Three hundred delegates, three committees, three days.',
    images: ['/img/crest.jpg'],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/img/crest.jpg' },
};

export const viewport: Viewport = {
  themeColor: '#0C0C0E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

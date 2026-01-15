import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Building Status',
  description: 'Current status of heat, water, and laundry',
  openGraph: {
    title: 'Building Status',
    description: 'Current status of heat, water, and laundry',
    type: 'website',
    images: [
      {
        url: 'https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h33w33l33.png',
        width: 600,
        height: 315,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

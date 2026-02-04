import { DM_Sans, DM_Mono, Inter } from 'next/font/google';
import { PostHogProvider } from '@/components/PostHogProvider';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
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

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${inter.variable}`}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}

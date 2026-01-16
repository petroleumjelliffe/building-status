import { getStatusData } from '@/lib/queries';
import { StatusPageClient } from '@/components/StatusPageClient';
import type { Metadata } from 'next';

// Force static generation at build time for proper OG tag placement
// See ADR 003: Static Generation with ISR for Open Graph Meta Tags
export const dynamic = 'error';
export const revalidate = 60; // ISR: regenerate every 60 seconds

// Generate metadata with dynamic status image
export async function generateMetadata(): Promise<Metadata> {
  // Call database directly at build time
  // Fallback to defaults if database unavailable during build
  let data;
  try {
    data = await getStatusData();
  } catch (error) {
    console.error('[generateMetadata] Database unavailable, using fallback defaults:', error);
    // Fallback to safe defaults if database unavailable
    return {
      title: 'Building Status',
      description: 'Check current building system status',
      openGraph: {
        title: 'Building Status',
        description: 'Building system status monitoring',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        siteName: 'Building Status',
        type: 'website',
        images: [
          {
            url: 'https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h3w3l3.png',
            width: 600,
            height: 315,
            alt: 'Building Status',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Building Status',
        description: 'Building system status monitoring',
        images: ['https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h3w3l3.png'],
      },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Generate dynamic status image URL from database
  const heat = data.systemStatus.find((s) => s.systemId === 'heat');
  const water = data.systemStatus.find((s) => s.systemId === 'water');
  const laundry = data.systemStatus.find((s) => s.systemId === 'laundry');

  const h = heat?.count?.split('/')[0] || '3';
  const w = water?.count?.split('/')[0] || '3';
  const l = laundry?.count?.split('/')[0] || '3';

  const statusImageUrl = `https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h${h}w${w}l${l}.png`;

  const hasIssues = data.systemStatus.some((s) => s.status !== 'ok');
  const statusText = hasIssues
    ? 'Some systems experiencing issues'
    : 'All systems operational';

  return {
    title: 'Building Status',
    description: `Current building status: ${statusText}. Heat, Water, and Laundry systems.`,
    openGraph: {
      title: 'Building Status',
      description: statusText,
      url: siteUrl,
      siteName: 'Building Status',
      type: 'website',
      images: [
        {
          url: statusImageUrl,
          width: 600,
          height: 315,
          alt: 'Building Status',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Building Status',
      description: statusText,
      images: [statusImageUrl],
    },
  };
}

export default async function StatusPage() {
  // Call database directly - static generation caches at build time
  const data = await getStatusData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Format date on server to avoid hydration mismatch
  const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(lastUpdated);

  return <StatusPageClient data={data} siteUrl={siteUrl} formattedDate={formattedDate} />;
}

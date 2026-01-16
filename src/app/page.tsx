import { getStatusData } from '@/lib/queries';
import { StatusPageClient } from '@/components/StatusPageClient';
import type { Metadata } from 'next';

// Revalidate every 60 seconds
export const revalidate = 60;

// Generate metadata for SEO and Open Graph
export async function generateMetadata(): Promise<Metadata> {
  const data = await getStatusData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Determine overall status for description
  const hasIssues = data.systemStatus.some((s) => s.status !== 'ok');
  const statusText = hasIssues
    ? 'Some systems experiencing issues'
    : 'All systems operational';

  // Generate dynamic status image URL
  const heat = data.systemStatus.find((s) => s.systemId === 'heat');
  const water = data.systemStatus.find((s) => s.systemId === 'water');
  const laundry = data.systemStatus.find((s) => s.systemId === 'laundry');

  const h = heat?.count?.split('/')[0] || '3';
  const w = water?.count?.split('/')[0] || '3';
  const l = laundry?.count?.split('/')[0] || '3';

  const statusImageUrl = `https://petroleumjelliffe--d762e03aeb5911f09ff942dde27851f2.web.val.run/h${h}w${w}l${l}.png`;

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
  const data = await getStatusData();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Format date on server to avoid hydration mismatch
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(data.lastUpdated);

  return <StatusPageClient data={data} siteUrl={siteUrl} formattedDate={formattedDate} />;
}

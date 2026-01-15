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
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Building Status',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Building Status',
      description: statusText,
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

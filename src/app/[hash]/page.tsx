import { getStatusData } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { StatusPageClient } from '@/components/StatusPageClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Force dynamic rendering for property pages
export const dynamic = 'force-dynamic';

interface PropertyPageProps {
  params: {
    hash: string;
  };
}

// Generate metadata for property-specific pages
export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  try {
    const property = await getPropertyByHash(params.hash);

    if (!property) {
      return {
        title: 'Property Not Found',
        description: 'The requested property could not be found',
      };
    }

    const data = await getStatusData(property.id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Generate dynamic status image URL
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

    const pageTitle = `${property.name} - Building Status`;
    const pageDescription = `Current status for ${property.name}: ${statusText}. Real-time updates for building systems, maintenance, and issues.`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        url: `${siteUrl}/${params.hash}`,
        siteName: property.name,
        type: 'website',
        images: [
          {
            url: statusImageUrl,
            width: 600,
            height: 315,
            alt: `${property.name} Status`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: [statusImageUrl],
      },
    };
  } catch (error) {
    console.error('[generateMetadata] Error:', error);
    return {
      title: 'Building Status',
      description: 'Building status monitoring',
    };
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = await getPropertyByHash(params.hash);

  if (!property) {
    notFound();
  }

  // Fetch status data for this property
  const data = await getStatusData(property.id);
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

  return (
    <StatusPageClient
      data={data}
      siteUrl={siteUrl}
      formattedDate={formattedDate}
      propertyId={property.id}
      propertyHash={params.hash}
      propertyName={property.name}
      requireAuthForContacts={property.requireAuthForContacts}
    />
  );
}

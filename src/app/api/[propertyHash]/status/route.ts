import { NextResponse } from 'next/server';
import { getStatusData } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';

export const dynamic = 'force-dynamic';

/**
 * GET /api/[propertyHash]/status
 * Returns all status data for the building status page for a property
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
) {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const data = await getStatusData(property.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching status data:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch status data',
      },
      { status: 500 }
    );
  }
}

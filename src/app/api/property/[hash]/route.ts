import { NextRequest, NextResponse } from 'next/server';
import { getPropertyByHash } from '@/lib/property';
import { getStatusData } from '@/lib/queries';

/**
 * GET /api/property/[hash]
 * Fetch status data for a specific property by its hash
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const { hash } = params;

    // Look up property by hash
    const property = await getPropertyByHash(hash);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Fetch status data for this property
    const data = await getStatusData(property.id);

    // Return property info + status data
    return NextResponse.json({
      property: {
        id: property.id,
        propertyId: property.propertyId,
        hash: property.hash,
        name: property.name,
      },
      data,
    });
  } catch (error) {
    console.error('[API] Error fetching property data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

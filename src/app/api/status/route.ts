import { NextResponse } from 'next/server';
import { getStatusData } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status
 * Returns all status data for the building status page
 */
export async function GET() {
  try {
    const propertyId = 1; // TODO: Accept as query param
    const data = await getStatusData(propertyId);

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

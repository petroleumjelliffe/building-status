import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { getAllProperties, createProperty } from '@/lib/property';

/**
 * GET /api/properties
 * List all properties (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAdminToken(token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all properties
    const properties = await getAllProperties();

    return NextResponse.json({
      properties: properties.map(p => ({
        id: p.id,
        propertyId: p.propertyId,
        hash: p.hash,
        name: p.name,
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties
 * Create a new property (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAdminToken(token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { propertyId, name } = body;

    if (!propertyId || !name) {
      return NextResponse.json(
        { error: 'propertyId and name are required' },
        { status: 400 }
      );
    }

    // Create property
    const property = await createProperty(propertyId, name);

    return NextResponse.json({
      id: property.id,
      propertyId: property.propertyId,
      hash: property.hash,
      name: property.name,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

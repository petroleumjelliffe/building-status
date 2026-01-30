import { getStatusData } from '@/lib/queries';
import { getPropertyByHash } from '@/lib/property';
import { dataResponse, ApiErrors } from '@/lib/api-response';
import type { StatusPageDataResponse, GetStatusPageDataResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/[propertyHash]/status
 * Returns all status data for the building status page for a property
 * @returns {GetStatusPageDataResponse}
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ propertyHash: string }> }
): Promise<Response> {
  try {
    const { propertyHash } = await params;

    // Validate property hash
    const property = await getPropertyByHash(propertyHash);
    if (!property) {
      return ApiErrors.propertyNotFound();
    }

    const data = await getStatusData(property.id);

    return dataResponse<StatusPageDataResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching status data:', error);
    return ApiErrors.internal();
  }
}

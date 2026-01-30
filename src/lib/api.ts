/**
 * API URL builder for property-scoped routes
 *
 * All API endpoints that access property-specific data should use these helpers
 * to ensure proper multi-tenant isolation via property hash routing.
 */

/**
 * Build an API URL scoped to a specific property
 * @param propertyHash - The property's unique hash identifier
 * @param path - The API path (e.g., '/events', '/issues/1/resolve')
 * @returns Full API URL (e.g., '/api/abc123xy/events')
 */
export function buildApiUrl(propertyHash: string, path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `/api/${propertyHash}${normalizedPath}`;
}

/**
 * Common fetch options for authenticated API requests
 */
export function getAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Make an authenticated API request to a property-scoped endpoint
 */
export async function fetchWithAuth<T>(
  propertyHash: string,
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = buildApiUrl(propertyHash, path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(token),
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

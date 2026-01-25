'use client';

import { useState, useEffect } from 'react';

interface Property {
  id: number;
  propertyId: string;
  hash: string;
  name: string;
}

interface PropertySelectorProps {
  selectedPropertyId: number | null;
  onPropertySelect: (propertyId: number, property: Property) => void;
  sessionToken: string;
}

export function PropertySelector({
  selectedPropertyId,
  onPropertySelect,
  sessionToken,
}: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch('/api/properties', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        setProperties(data.properties);

        // Auto-select first property if none selected
        if (!selectedPropertyId && data.properties.length > 0) {
          onPropertySelect(data.properties[0].id, data.properties[0]);
        }
      } catch (err) {
        console.error('[PropertySelector] Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [sessionToken]);

  if (loading) {
    return <div className="property-selector">Loading properties...</div>;
  }

  if (error) {
    return <div className="property-selector error">{error}</div>;
  }

  if (properties.length === 0) {
    return (
      <div className="property-selector">
        <p>No properties found. Create a property first.</p>
      </div>
    );
  }

  return (
    <div className="property-selector">
      <label htmlFor="property-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        Select Property:
      </label>
      <select
        id="property-select"
        value={selectedPropertyId || ''}
        onChange={(e) => {
          const propertyId = parseInt(e.target.value);
          const property = properties.find(p => p.id === propertyId);
          if (property) {
            onPropertySelect(propertyId, property);
          }
        }}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
        }}
      >
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name} ({property.hash})
          </option>
        ))}
      </select>
      {selectedPropertyId && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {properties.find(p => p.id === selectedPropertyId)?.hash && (
            <>
              URL: {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/#/
              {properties.find(p => p.id === selectedPropertyId)?.hash}
            </>
          )}
        </div>
      )}
    </div>
  );
}

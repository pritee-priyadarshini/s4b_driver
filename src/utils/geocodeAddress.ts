import * as Location from 'expo-location';

export type GeocodedPoint = {
  latitude: number;
  longitude: number;
};

const PLUS_CODE_PATTERN = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/i;

function buildGeocodeQueries(address: string): string[] {
  const trimmed = address.trim();
  if (!trimmed) return [];

  const queries = new Set<string>();
  queries.add(trimmed);

  // Plus codes often fail on device geocoders — try city/postcode portion.
  const withoutPlusCode = trimmed.replace(PLUS_CODE_PATTERN, '').replace(/^,\s*/, '').trim();
  if (withoutPlusCode && withoutPlusCode !== trimmed) {
    queries.add(withoutPlusCode);
  }

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    queries.add(parts.slice(-3).join(', '));
    queries.add(parts.slice(-2).join(', '));
  }

  return [...queries];
}

async function geocodeWithDevice(query: string): Promise<GeocodedPoint | null> {
  try {
    const results = await Location.geocodeAsync(query);
    if (results.length > 0) {
      return { latitude: results[0].latitude, longitude: results[0].longitude };
    }
  } catch {
    // Fall through to web geocoder.
  }
  return null;
}

async function geocodeWithNominatim(query: string): Promise<GeocodedPoint | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SavefulDriver/1.0',
      },
    });
    if (!response.ok) return null;

    const results = (await response.json()) as { lat?: string; lon?: string }[];
    const hit = results[0];
    if (!hit?.lat || !hit?.lon) return null;

    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}

/** Resolve an address string to coordinates using device geocoder, then OpenStreetMap. */
export async function geocodeAddress(address: string): Promise<GeocodedPoint | null> {
  const queries = buildGeocodeQueries(address);
  if (queries.length === 0) return null;

  for (const query of queries) {
    const device = await geocodeWithDevice(query);
    if (device) return device;
  }

  for (const query of queries) {
    const remote = await geocodeWithNominatim(query);
    if (remote) return remote;
  }

  return null;
}

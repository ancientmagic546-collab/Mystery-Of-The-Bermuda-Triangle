/**
 * Pure geometric and geographic utility functions for Bermuda Triangle & oceanic research.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// Canonical Bermuda Triangle Vertices
export const BERMUDA_TRIANGLE_VERTICES: LatLng[] = [
  { lat: 32.3078, lng: -64.7505 }, // Bermuda (St. George's / Hamilton)
  { lat: 25.7617, lng: -80.1918 }, // Miami, Florida
  { lat: 18.4655, lng: -66.1057 }, // San Juan, Puerto Rico
];

/**
 * Calculates Haversine great-circle distance in kilometers.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates initial spherical bearing in degrees from point 1 to point 2.
 */
export function sphericalBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Determines whether a coordinate lies within the canonical Bermuda Triangle polygon
 * using ray-casting point-in-polygon algorithm.
 */
export function isInsideBermudaTriangle(lat: number, lng: number): boolean {
  const poly = BERMUDA_TRIANGLE_VERTICES;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng;
    const yi = poly[i].lat;
    const xj = poly[j].lng;
    const yj = poly[j].lat;

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Converts Latitude and Longitude to 3D Cartesian coordinates (X, Y, Z)
 * for a sphere of given radius.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

/**
 * Distance in kilometers from a point (P) to a great-circle segment between A and B.
 * Approximated via spherical sampling.
 */
export function distanceToGreatCircleSegmentKm(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  let minDistance = Math.min(
    haversineDistanceKm(pLat, pLng, aLat, aLng),
    haversineDistanceKm(pLat, pLng, bLat, bLng)
  );
  // Sample along segment at 10 intervals
  for (let i = 1; i < 10; i++) {
    const fraction = i / 10;
    const sLat = aLat + (bLat - aLat) * fraction;
    const sLng = aLng + (bLng - aLng) * fraction;
    const dist = haversineDistanceKm(pLat, pLng, sLat, sLng);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

/**
 * Calculates distance in kilometers to the Bermuda Triangle perimeter (or 0 if inside).
 */
export function distanceToBermudaTrianglePerimeterKm(lat: number, lng: number): number {
  if (isInsideBermudaTriangle(lat, lng)) {
    return 0;
  }
  const [bermuda, miami, sanJuan] = BERMUDA_TRIANGLE_VERTICES;
  const d1 = distanceToGreatCircleSegmentKm(lat, lng, bermuda.lat, bermuda.lng, miami.lat, miami.lng);
  const d2 = distanceToGreatCircleSegmentKm(lat, lng, miami.lat, miami.lng, sanJuan.lat, sanJuan.lng);
  const d3 = distanceToGreatCircleSegmentKm(lat, lng, sanJuan.lat, sanJuan.lng, bermuda.lat, bermuda.lng);
  return Math.round(Math.min(d1, d2, d3) * 10) / 10;
}

/**
 * Calculates distance in statute miles to the Bermuda Triangle perimeter.
 */
export function distanceToBermudaTrianglePerimeterMiles(lat: number, lng: number): number {
  return Math.round((distanceToBermudaTrianglePerimeterKm(lat, lng) / 1.60934) * 10) / 10;
}

/**
 * Determines whether a coordinate lies inside or within 500 statute miles of the Bermuda Triangle.
 */
export function isWithin500MilesOfBermudaTriangle(lat: number, lng: number): boolean {
  if (isInsideBermudaTriangle(lat, lng)) return true;
  return distanceToBermudaTrianglePerimeterMiles(lat, lng) <= 500;
}

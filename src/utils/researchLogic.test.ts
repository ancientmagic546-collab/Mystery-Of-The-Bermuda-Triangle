import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistanceKm,
  sphericalBearingDeg,
  isInsideBermudaTriangle,
  latLngToVector3,
  BERMUDA_TRIANGLE_VERTICES,
  isWithin500MilesOfBermudaTriangle,
  distanceToBermudaTrianglePerimeterMiles,
} from './geoMath';
import {
  compareIncidentConditions,
  compareArchitecturalStructures,
} from './comparatorLogic';
import {
  HISTORICAL_INCIDENTS,
  ARCHITECTURAL_STRUCTURES,
} from '../data/bermudaData';

test('haversine distance calculates accurate geographic mileage', () => {
  // Miami (25.7617, -80.1918) to Bermuda (32.3078, -64.7505) is ~1665 km
  const dist = haversineDistanceKm(25.7617, -80.1918, 32.3078, -64.7505);
  assert.ok(dist > 1600 && dist < 1720, `Expected ~1665km, got ${dist}`);
});

test('spherical bearing computes valid compass headings', () => {
  const bearing = sphericalBearingDeg(25.7617, -80.1918, 32.3078, -64.7505);
  assert.ok(bearing >= 0 && bearing <= 360);
  assert.ok(bearing > 50 && bearing < 80, `Expected roughly ENE bearing, got ${bearing}`);
});

test('isInsideBermudaTriangle correctly classifies coordinates', () => {
  // Center of Bermuda Triangle (e.g. 26.0, -71.0)
  assert.equal(isInsideBermudaTriangle(26.0, -71.0), true);

  // Clearly outside points:
  // London, UK
  assert.equal(isInsideBermudaTriangle(51.5, -0.12), false);
  // Tokyo, Japan
  assert.equal(isInsideBermudaTriangle(35.6, 139.6), false);
  // North Pole
  assert.equal(isInsideBermudaTriangle(90.0, 0.0), false);
});

test('latLngToVector3 produces non-zero 3D Cartesian coordinates', () => {
  const [x, y, z] = latLngToVector3(32.3078, -64.7505, 100);
  const radius = Math.sqrt(x * x + y * y + z * z);
  assert.ok(Math.abs(radius - 100) < 0.001, 'Vector length should match radius');
});

test('compareIncidentConditions detects correlation between electromagnetic mist events', () => {
  const flight19 = HISTORICAL_INCIDENTS.find(i => i.id === 'flight_19_1945')!;
  const gernon = HISTORICAL_INCIDENTS.find(i => i.id === 'gernon_electronic_fog_1970')!;
  assert.ok(flight19, 'Flight 19 must exist in test dataset');
  assert.ok(gernon, 'Gernon encounter must exist in test dataset');

  const comparison = compareIncidentConditions(flight19, gernon);
  assert.ok(comparison.similarityScorePercent >= 70, `Expected high similarity score, got ${comparison.similarityScorePercent}`);
  assert.ok(comparison.sharedAnomalousMarkers.includes('Electromagnetic Ionized Mist Blackout'));
  assert.ok(comparison.sharedAnomalousMarkers.includes('Elevated Solar/Geomagnetic Flux Coincidence'));
});

test('compareArchitecturalStructures identifies identical sister lighthouse blueprints', () => {
  const gibbsHill = ARCHITECTURAL_STRUCTURES.find(s => s.id === 'gibbs_hill_lighthouse')!;
  const greatIsaac = ARCHITECTURAL_STRUCTURES.find(s => s.id === 'great_isaac_lighthouse')!;
  const hatteras = ARCHITECTURAL_STRUCTURES.find(s => s.id === 'cape_hatteras_lighthouse')!;

  assert.ok(gibbsHill && greatIsaac && hatteras);

  // Gibbs Hill vs Great Isaac (both Alexander Gordon cast-iron sister plans)
  const sisterComparison = compareArchitecturalStructures(gibbsHill, greatIsaac);
  assert.equal(sisterComparison.isSameArchitecturalPlan, true);
  assert.ok(sisterComparison.identicalDesignProbabilityPercent >= 85);
  assert.ok(sisterComparison.historicalVerification.includes('share verified sister blueprints'));

  // Gibbs Hill (Cast iron) vs Cape Hatteras (Brick masonry) -> should NOT be identical plan
  const diffComparison = compareArchitecturalStructures(gibbsHill, hatteras);
  assert.equal(diffComparison.isSameArchitecturalPlan, false);
  assert.ok(diffComparison.identicalDesignProbabilityPercent < 50);
});

test('isWithin500MilesOfBermudaTriangle detects perimeter proximity and rejects distant locations', () => {
  // Inside the triangle (e.g. 26.0, -71.0) -> distance is 0 miles
  assert.equal(isWithin500MilesOfBermudaTriangle(26.0, -71.0), true);
  assert.equal(distanceToBermudaTrianglePerimeterMiles(26.0, -71.0), 0);

  // Cape Hatteras (35.25, -75.5) is ~220 miles from Bermuda/perimeter -> within 500 miles
  assert.equal(isWithin500MilesOfBermudaTriangle(35.25, -75.5), true);
  const hatterasMiles = distanceToBermudaTrianglePerimeterMiles(35.25, -75.5);
  assert.ok(hatterasMiles > 0 && hatterasMiles <= 500, `Expected <= 500 miles, got ${hatterasMiles}`);

  // Orlando, Florida (28.53, -81.37) is right adjacent to Miami -> within 500 miles
  assert.equal(isWithin500MilesOfBermudaTriangle(28.53, -81.37), true);

  // Tokyo, Japan (35.6, 139.6) -> thousands of miles away -> false
  assert.equal(isWithin500MilesOfBermudaTriangle(35.6, 139.6), false);

  // Paris, France (48.85, 2.35) -> thousands of miles away -> false
  assert.equal(isWithin500MilesOfBermudaTriangle(48.85, 2.35), false);
});

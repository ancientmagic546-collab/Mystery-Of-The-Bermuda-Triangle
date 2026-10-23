import test from 'node:test';
import assert from 'node:assert';
import {
  GLOBAL_HOTSPOT_ANCHORS,
  getUniversalIncidentPoints,
  calculateHotspotDensities,
} from './heatmapDensity';
import { CustomResearcherPin } from '../types/research';

test('heatmapDensity: getUniversalIncidentPoints extracts points from historical incidents and anchors', () => {
  const points = getUniversalIncidentPoints([]);
  assert.ok(points.length > 20, `Expected over 20 points, got ${points.length}`);

  // Check that every point has valid coordinates and weight
  points.forEach((pt) => {
    assert.ok(pt.lat >= -90 && pt.lat <= 90, `Invalid latitude ${pt.lat}`);
    assert.ok(pt.lng >= -180 && pt.lng <= 180, `Invalid longitude ${pt.lng}`);
    assert.ok(pt.weight > 0, `Invalid weight ${pt.weight}`);
  });
});

test('heatmapDensity: calculateHotspotDensities correctly ranks anomalous hotspots and calculates scores', () => {
  const hotspots = calculateHotspotDensities([]);
  assert.strictEqual(hotspots.length, GLOBAL_HOTSPOT_ANCHORS.length);

  // Check top hotspots include Bermuda or Dragon's Triangle with high scores
  const topHotspot = hotspots[0];
  assert.ok(topHotspot.densityScore >= 80, `Top hotspot score should be >= 80, got ${topHotspot.densityScore}`);
  assert.ok(['hotspot_bermuda', 'hotspot_dragons_triangle', 'hotspot_bimini_bahamas'].includes(topHotspot.id));

  // Check all hotspots have valid properties
  hotspots.forEach((h) => {
    assert.ok(h.densityScore >= 0 && h.densityScore <= 100);
    assert.ok(h.incidentCount >= 0);
    assert.ok(['CRITICAL', 'HIGH', 'MODERATE', 'ELEVATED'].includes(h.intensityLevel));
  });
});

test('heatmapDensity: custom researcher pins dynamically boost localized hotspot density and incident count', () => {
  const baseline = calculateHotspotDensities([]);
  const alaskaBaseline = baseline.find((h) => h.id === 'hotspot_alaska_triangle')!;

  const alaskaPin: CustomResearcherPin = {
    id: 'test_pin_alaska',
    lat: 64.2,
    lng: -149.8,
    title: 'Mount Hayes Radar Anomaly',
    category: 'UAP / USO Fast-Mover Contact',
    notes: 'Ground radar tracked vertical ascent at Mach 12',
    timestamp: Date.now(),
  };

  const updated = calculateHotspotDensities([alaskaPin]);
  const alaskaUpdated = updated.find((h) => h.id === 'hotspot_alaska_triangle')!;

  assert.ok(
    alaskaUpdated.incidentCount > alaskaBaseline.incidentCount,
    `Alaska incident count should increase (was ${alaskaBaseline.incidentCount}, now ${alaskaUpdated.incidentCount})`
  );
  assert.ok(
    alaskaUpdated.densityScore >= alaskaBaseline.densityScore,
    `Alaska density score should increase or stay high (was ${alaskaBaseline.densityScore}, now ${alaskaUpdated.densityScore})`
  );
});

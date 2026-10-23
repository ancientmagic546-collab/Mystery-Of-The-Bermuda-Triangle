import { IncidentRecord, CustomResearcherPin, AnomalyHotspot } from '../types/research';
import { haversineDistanceKm } from './geoMath';
import { HISTORICAL_INCIDENTS } from '../data/bermudaData';
import { GLOBAL_ANOMALIES_AND_TRENCHES } from '../data/worldAtlasData';

/**
 * Known Global Anomalous Hotspot Baselines across the globe.
 * These anchor the density calculation alongside historical incidents & custom researcher pins.
 */
export const GLOBAL_HOTSPOT_ANCHORS: Omit<AnomalyHotspot, 'densityScore' | 'incidentCount'>[] = [
  {
    id: 'hotspot_bermuda',
    name: 'Bermuda Triangle & Sargasso Vortex',
    region: 'North Atlantic Ocean',
    lat: 27.5,
    lng: -71.0,
    radiusKm: 1200,
    intensityLevel: 'CRITICAL',
    dominantType: 'Electromagnetic Disappearances & USOs',
    signature: 'Agonic line compass spin, violent methane degassing, and electronic fog tunnels.',
    historicalEvents: ['Flight 19 (1945)', 'USS Cyclops (1918)', 'Ellen Austin (1881)', 'Carroll A. Deering (1921)', 'Bruce Gernon Electronic Fog (1970)'],
  },
  {
    id: 'hotspot_dragons_triangle',
    name: 'Dragon\'s Triangle (Devil\'s Sea / Ma-no Umi)',
    region: 'Western Pacific / South of Japan',
    lat: 25.0,
    lng: 137.0,
    radiusKm: 1100,
    intensityLevel: 'CRITICAL',
    dominantType: 'Maritime Vanishings & Subsea Volcanism',
    signature: 'Radio silence zones, geomagnetic dipole inversions, and sudden whirlpool formation.',
    historicalEvents: ['Kaiyo Maru No. 5 Research Vessel Loss (1952)', 'Japanese Military Fleet Disappearances', 'Yonaguni Submerged Megalith Acoustic Track'],
  },
  {
    id: 'hotspot_puerto_rico_trench',
    name: 'Puerto Rico Trench & Milwaukee Deep',
    region: 'Caribbean / Atlantic Abyssal Zone',
    lat: 19.8,
    lng: -66.5,
    radiusKm: 600,
    intensityLevel: 'HIGH',
    dominantType: 'Abyssal Gravity Minimum & Transmedium USOs',
    signature: 'Deepest Atlantic trench (-8,376m), non-cavitating 220-knot underwater acoustics, and FLIR air-to-sea transitions.',
    historicalEvents: ['Aguadilla Transmedium UAP Incident', 'AUTEC Hydrophone High-Speed Acoustic Contacts', 'San Juan Coastal Magnetic Deviations'],
  },
  {
    id: 'hotspot_alaska_triangle',
    name: 'The Alaska Triangle',
    region: 'North America / Northern Pacific',
    lat: 64.0,
    lng: -150.0,
    radiusKm: 1300,
    intensityLevel: 'HIGH',
    dominantType: 'Aviation Disappearances & Geomagnetic Vortices',
    signature: 'Over 20,000 unsolved missing persons/aircraft, Mount Hayes electromagnetic anomaly, and ELT signal blackouts.',
    historicalEvents: ['US House Majority Leader Hale Boggs Vanishing (1972)', 'Flight C-54 Skymaster Loss', 'Fairbanks Geomagnetic Pulse Sequence'],
  },
  {
    id: 'hotspot_south_atlantic_anomaly',
    name: 'South Atlantic Anomaly (Geomagnetic Dip)',
    region: 'South Atlantic Ocean',
    lat: -20.0,
    lng: -45.0,
    radiusKm: 1800,
    intensityLevel: 'HIGH',
    dominantType: 'Van Allen Belt Dip & Ionizing Radiation Flux',
    signature: 'Earth\'s lowest magnetic field intensity allowing cosmic particle penetrations; satellite instrumentation reboot triggers.',
    historicalEvents: ['Hubble & ISS Sensor Cutoff Protocols', 'ROSAT Satellite Gyro Lock Failures', 'Submarine LF Communications Scrambling'],
  },
  {
    id: 'hotspot_bass_strait',
    name: 'Bass Strait Triangle',
    region: 'Oceania / Southeast Australia',
    lat: -39.5,
    lng: 145.5,
    radiusKm: 700,
    intensityLevel: 'MODERATE',
    dominantType: 'Aerial Interceptions & Instrument Failure',
    signature: 'Green metallic aircraft escort sightings, rapid magnetic compass rotation, and radio transmission interference.',
    historicalEvents: ['Frederick Valentich Cessna 182 Vanishing (1978)', 'Beaufort Bomber Loss A9-27', 'SS Federal Steamship Disappearance'],
  },
  {
    id: 'hotspot_lake_michigan',
    name: 'Lake Michigan Triangle',
    region: 'North America / Great Lakes',
    lat: 43.5,
    lng: -86.5,
    radiusKm: 450,
    intensityLevel: 'MODERATE',
    dominantType: 'Freshwater Ghost Ships & Air Disappearances',
    signature: 'Submerged boulder alignments at 12m depth, localized microburst storms, and compass magnetic deflection.',
    historicalEvents: ['Northwest Orient Airlines Flight 2501 (1950)', 'Schooner Rosa Belle Derelict Discovery (1921)', 'Captain George R. Donner Cabin Vanishing'],
  },
  {
    id: 'hotspot_point_nemo',
    name: 'Point Nemo Oceanic Anomaly Hub',
    region: 'South Pacific Ocean',
    lat: -48.8,
    lng: -123.4,
    radiusKm: 1500,
    intensityLevel: 'ELEVATED',
    dominantType: 'Ultra-Low Frequency Acoustic Bloop & Abyssal Isolation',
    signature: 'Pole of inaccessibility 2,688 km from nearest land; 1997 ultra-low frequency non-seismic acoustic burst detected by equatorial hydrophones.',
    historicalEvents: ['NOAA Equatorial Hydrophone "Bloop" Audio Intercept (1997)', 'Declassified MIR Space Station Re-entry Splash Zone'],
  },
  {
    id: 'hotspot_mariana_trench',
    name: 'Mariana Trench (Challenger Deep)',
    region: 'Western Pacific Ocean',
    lat: 11.35,
    lng: 142.2,
    radiusKm: 800,
    intensityLevel: 'HIGH',
    dominantType: 'Ultra-Deep Hydrostatic Resonances & Seismic Whispers',
    signature: 'Maximum planetary depth (-10,994m); low-frequency resonant acoustic groans logged by deep autonomous submersibles.',
    historicalEvents: ['Autonomous Lander Hydrophone Harmonic Log', 'Subduction Megathrust Acoustic Pulse'],
  },
  {
    id: 'hotspot_bimini_bahamas',
    name: 'Bimini Road & Great Isaac Vertex',
    region: 'Western Bahamas Shelf',
    lat: 25.75,
    lng: -79.28,
    radiusKm: 300,
    intensityLevel: 'CRITICAL',
    dominantType: 'Submerged Megalithic Grids & Dipole Oscillations',
    signature: 'J-shaped limestone block roadway, localized geomagnetic reversals, and Gulf Stream current shear turbulence.',
    historicalEvents: ['1968 Manson Valentine Megalith Discovery', 'Great Isaac Lightkeeper Mysterious Disappearance (1969)', 'Bruce Gernon Tunnel Mist Ingress'],
  },
];

export interface IncidentDensityPoint {
  lat: number;
  lng: number;
  weight: number; // 1 to 5 based on severity & casualties
  category: string;
}

/**
 * Extracts and normalizes all incident density points from historical logs and researcher custom pins.
 */
export function getUniversalIncidentPoints(
  customPins: CustomResearcherPin[] = []
): IncidentDensityPoint[] {
  const points: IncidentDensityPoint[] = [];

  // 1. Historical Bermuda & World Incidents
  HISTORICAL_INCIDENTS.forEach((inc) => {
    let weight = 2.0;
    if (inc.casualtiesOrMissing > 20) weight += 1.5;
    if (inc.meteorological?.geomagneticKIndex && inc.meteorological.geomagneticKIndex >= 6) weight += 1.0;
    if (inc.type === 'uap_uso' || inc.type === 'disappearance') weight += 0.5;

    points.push({
      lat: inc.lat,
      lng: inc.lng,
      weight,
      category: inc.type,
    });
  });

  // 2. Global Hotspot Anchor incident points (seeds worldwide density field)
  GLOBAL_HOTSPOT_ANCHORS.forEach((hotspot) => {
    // Add primary centroid point
    points.push({
      lat: hotspot.lat,
      lng: hotspot.lng,
      weight: hotspot.intensityLevel === 'CRITICAL' ? 4.5 : hotspot.intensityLevel === 'HIGH' ? 3.5 : 2.5,
      category: hotspot.dominantType,
    });

    // Add satellite event points around the hotspot
    hotspot.historicalEvents.forEach((_, idx) => {
      const angle = (idx / hotspot.historicalEvents.length) * Math.PI * 2;
      const offsetDeg = (hotspot.radiusKm / 111) * 0.45; // slight spread
      points.push({
        lat: Math.max(-85, Math.min(85, hotspot.lat + Math.sin(angle) * offsetDeg)),
        lng: ((hotspot.lng + Math.cos(angle) * offsetDeg + 180) % 360) - 180,
        weight: 2.0,
        category: hotspot.dominantType,
      });
    });
  });

  // 3. User Custom Pins (Researcher Field Observations)
  customPins.forEach((pin) => {
    points.push({
      lat: pin.lat,
      lng: pin.lng,
      weight: 3.0, // researcher sightings carry substantial tactical weight
      category: pin.category,
    });
  });

  return points;
}

/**
 * Calculates real-time density scores for all global hotspots based on
 * proximity of historical records and researcher field observations.
 */
export function calculateHotspotDensities(
  customPins: CustomResearcherPin[] = []
): AnomalyHotspot[] {
  const allPoints = getUniversalIncidentPoints(customPins);

  return GLOBAL_HOTSPOT_ANCHORS.map((anchor) => {
    let incidentCount = 0;
    let accumulatedWeight = 0;

    allPoints.forEach((pt) => {
      const distKm = haversineDistanceKm(anchor.lat, anchor.lng, pt.lat, pt.lng);
      if (distKm <= anchor.radiusKm) {
        incidentCount++;
        // Gaussian spatial decay
        const normalizedDist = distKm / anchor.radiusKm;
        const decay = Math.exp(-0.5 * (normalizedDist * 2.5) ** 2);
        accumulatedWeight += pt.weight * decay;
      }
    });

    // Normalize density score to 0 - 100 scale
    const baseDensity = Math.min(100, Math.round(accumulatedWeight * 5.2));
    const densityScore = Math.max(35, baseDensity);

    let intensityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ELEVATED' = 'MODERATE';
    if (densityScore >= 85) intensityLevel = 'CRITICAL';
    else if (densityScore >= 70) intensityLevel = 'HIGH';
    else if (densityScore >= 50) intensityLevel = 'MODERATE';
    else intensityLevel = 'ELEVATED';

    return {
      ...anchor,
      incidentCount,
      densityScore,
      intensityLevel,
    };
  }).sort((a, b) => b.densityScore - a.densityScore);
}

/**
 * Creates an Equirectangular (2048 x 1024) spherical heatmap canvas texture
 * with Gaussian falloff and thermal color gradient.
 */
export function generateSphericalHeatmapCanvas(
  customPins: CustomResearcherPin[] = [],
  bandwidthKm: number = 850,
  intensityMultiplier: number = 1.0,
  width: number = 1024,
  height: number = 512
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Clear with 100% transparent black
  ctx.clearRect(0, 0, width, height);

  const points = getUniversalIncidentPoints(customPins);

  // Phase 1: Draw radial Gaussian intensity field on alpha channel
  points.forEach((pt) => {
    // Project geographic (lat, lng) to equirectangular pixel coordinates
    const px = ((pt.lng + 180) / 360) * width;
    const py = ((90 - pt.lat) / 180) * height;

    // Convert bandwidth in km to approximate pixel radius
    // 40,075 km equator corresponds to canvas width
    const radiusPixels = Math.max(16, (bandwidthKm / 40075) * width * 1.8 * intensityMultiplier);

    // Draw main circle and handle horizontal wrap-around
    const drawRadial = (centerX: number) => {
      const grad = ctx.createRadialGradient(centerX, py, 0, centerX, py, radiusPixels);
      const alphaPeak = Math.min(0.85, 0.22 * pt.weight * intensityMultiplier);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alphaPeak})`);
      grad.addColorStop(0.3, `rgba(255, 255, 255, ${alphaPeak * 0.65})`);
      grad.addColorStop(0.65, `rgba(255, 255, 255, ${alphaPeak * 0.25})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, py, radiusPixels, 0, Math.PI * 2);
      ctx.fill();
    };

    drawRadial(px);
    // Wrap around left or right edges
    if (px - radiusPixels < 0) drawRadial(px + width);
    if (px + radiusPixels > width) drawRadial(px - width);
  });

  // Phase 2: Color-map the grayscale alpha intensities using tactical thermal color palette
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255; // 0 to 1 intensity
    if (alpha <= 0.03) {
      data[i + 3] = 0;
      continue;
    }

    // Thermal color spectrum:
    // Low: Deep Cyan / Marine Blue -> Medium: Lime Emerald -> High: Solar Amber -> Critical: Plasma Crimson
    let r = 0;
    let g = 0;
    let b = 0;
    let finalAlpha = 0;

    if (alpha < 0.25) {
      // 0.03 - 0.25: Deep Cyan / Marine Blue
      const t = (alpha - 0.03) / (0.25 - 0.03);
      r = Math.round(6 * (1 - t) + 14 * t);
      g = Math.round(182 * (1 - t) + 211 * t);
      b = Math.round(212 * (1 - t) + 242 * t);
      finalAlpha = Math.round(alpha * 0.75 * 255);
    } else if (alpha < 0.5) {
      // 0.25 - 0.5: Emerald to Electric Lime
      const t = (alpha - 0.25) / 0.25;
      r = Math.round(14 * (1 - t) + 16 * t);
      g = Math.round(211 * (1 - t) + 225 * t);
      b = Math.round(242 * (1 - t) + 70 * t);
      finalAlpha = Math.round((0.55 + t * 0.25) * 255);
    } else if (alpha < 0.75) {
      // 0.5 - 0.75: Solar Amber to Vivid Orange
      const t = (alpha - 0.5) / 0.25;
      r = Math.round(16 * (1 - t) + 245 * t);
      g = Math.round(225 * (1 - t) + 158 * t);
      b = Math.round(70 * (1 - t) + 11 * t);
      finalAlpha = Math.round((0.75 + t * 0.15) * 255);
    } else {
      // 0.75 - 1.0: Intense Crimson / Magenta to Hot White
      const t = (alpha - 0.75) / 0.25;
      r = Math.round(245 * (1 - t) + 255 * t);
      g = Math.round(158 * (1 - t) + 70 * t);
      b = Math.round(11 * (1 - t) + 80 * t);
      finalAlpha = Math.round((0.85 + t * 0.15) * 255);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = finalAlpha;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

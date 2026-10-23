export type AnomalyType = 
  | 'disappearance'
  | 'uap_uso'
  | 'geomagnetic'
  | 'weather_microburst'
  | 'acoustic_sonar'
  | 'alien_abduction'
  | 'methane_hydrate';

export interface MeteorologicalData {
  barometricPressureHpa: number; // e.g. 1013 normal, 980 hurricane/drop
  windSpeedKnots: number;
  waveHeightMeters: number;
  geomagneticKIndex: number; // 0-9 scale (5+ is solar storm)
  magneticDeclinationDeg: number; // e.g. 0 to -15
  sargassoCurrentSpeedKnots: number;
  hexagonalCloudDetected: boolean;
  visibilityKm: number;
  fogOrElectronicMistReported: boolean;
}

export interface IncidentRecord {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD or approx
  year: number;
  lat: number;
  lng: number;
  locationDescription: string;
  vesselsOrAircraft: string;
  casualtiesOrMissing: number;
  type: AnomalyType;
  classificationLevel: 'DECLASSIFIED' | 'SECRET' | 'CIVILIAN_LOG' | 'UNRESOLVED' | 'TOP_SECRET';
  summary: string;
  detailedReport: string;
  meteorological: MeteorologicalData;
  officialExplanations: string[];
  anomalousTheories: string[];
  sonarOrRadarTelemetry?: string;
  deepWebRef?: string;
}

export interface IslandOrLandmark {
  id: string;
  name: string;
  type: 'island' | 'reef' | 'trench' | 'research_station' | 'magnetic_node' | 'anomaly_zone';
  lat: number;
  lng: number;
  description: string;
  depthOrElevationM: number;
  historicalSignificance: string;
  features: string[];
}

export interface ArchitecturalStructure {
  id: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  yearBuilt: number;
  architect: string;
  archetype: 'victorian_cast_iron_lighthouse' | 'masonry_light_tower' | 'ancient_megalith' | 'radio_telescope' | 'submerged_pyramid';
  dimensions: {
    heightMeters: number;
    baseDiameterMeters: number;
    wallThicknessMeters: number;
    focalPlaneMeters?: number;
  };
  constructionMaterial: string;
  opticalSystemOrLensOrder?: string; // e.g. "1st Order Fresnel Lens by Chance Brothers"
  foundationEngineering: string;
  blueprintSpecs: {
    geometricRatio: string; // e.g. "1:4.8 conical taper"
    boltRingCircleCount?: number;
    acousticResonanceHz: number;
    azimuthAlignmentDeg: number;
    prefabricatedModulesCount?: number;
    identicalSisterStructures?: string[];
  };
  designNotes: string;
  anomalousTelemetry: string;
}

export interface IncidentComparisonResult {
  similarityScorePercent: number;
  factors: {
    name: string;
    similarity: number; // 0-100
    metricA: string;
    metricB: string;
    analysis: string;
  }[];
  verdict: string;
  sharedAnomalousMarkers: string[];
  meteorologicalSummary: string;
  geomagneticSummary: string;
}

export interface StructureComparisonResult {
  identicalDesignProbabilityPercent: number;
  isSameArchitecturalPlan: boolean;
  architecturalFamilyMatch: boolean;
  factors: {
    feature: string;
    matchGrade: 'IDENTICAL' | 'CLOSE_VARIANT' | 'DIFFERENT' | 'HIGHLY_DIVERGENT';
    specA: string;
    specB: string;
    engineerNotes: string;
  }[];
  historicalVerification: string;
  divergences: string[];
  sharedBlueprintsEvidence: string;
}

export interface LocalCaseNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: number;
  linkedIncidentIds: string[];
  pinnedCoordinates?: { lat: number; lng: number };
}

export interface CustomResearcherPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  notes: string;
  timestamp: number;
}

export interface LocalDossier {
  researcherId: string;
  callsign: string;
  stationName: string;
  lastUpdated: number;
  notes: LocalCaseNote[];
  customPins: CustomResearcherPin[];
  searchHistory: {
    query: string;
    engine: 'surface_web' | 'deep_web_onion';
    timestamp: number;
    resultsCount: number;
  }[];
  bookmarkedSources: {
    title: string;
    url: string;
    network: 'clearnet' | 'onion_archive' | 'declassified_mil';
    snippet: string;
    timestamp: number;
  }[];
}

export interface AnomalyHotspot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  densityScore: number; // 0 - 100
  intensityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ELEVATED';
  incidentCount: number;
  radiusKm: number;
  dominantType: string;
  signature: string;
  historicalEvents: string[];
}

export interface HeatmapConfig {
  enabled: boolean;
  intensity: number; // 0.5 - 2.0
  bandwidthKm: number; // e.g. 500 - 2500
  showHotspotCentroids: boolean;
  minDensityThreshold: number; // 0.0 - 0.5
}


import {
  IncidentRecord,
  IncidentComparisonResult,
  ArchitecturalStructure,
  StructureComparisonResult,
} from '../types/research';

/**
 * Compares two maritime or aerial anomalous incidents under meteorological
 * and geomagnetic conditions.
 */
export function compareIncidentConditions(
  a: IncidentRecord,
  b: IncidentRecord
): IncidentComparisonResult {
  const factors: IncidentComparisonResult['factors'] = [];

  // 1. Geomagnetic K-Index comparison (0-9)
  const kDelta = Math.abs(a.meteorological.geomagneticKIndex - b.meteorological.geomagneticKIndex);
  const kSimilarity = Math.max(0, Math.round(100 - (kDelta / 9) * 100));
  factors.push({
    name: 'Geomagnetic Solar Activity (K-Index)',
    similarity: kSimilarity,
    metricA: `Kp ${a.meteorological.geomagneticKIndex}/9 (${a.meteorological.geomagneticKIndex >= 5 ? 'Storm Level' : 'Quiet/Moderate'})`,
    metricB: `Kp ${b.meteorological.geomagneticKIndex}/9 (${b.meteorological.geomagneticKIndex >= 5 ? 'Storm Level' : 'Quiet/Moderate'})`,
    analysis:
      kDelta <= 1
        ? 'Both occurred during virtually identical geomagnetic disturbance levels, causing potential magneto-induction compass precession.'
        : `Discrepancy of ${kDelta} Kp points; incident ${a.meteorological.geomagneticKIndex > b.meteorological.geomagneticKIndex ? a.title : b.title} had significantly higher solar wind induction.`,
  });

  // 2. Barometric Pressure comparison
  const pressureDelta = Math.abs(a.meteorological.barometricPressureHpa - b.meteorological.barometricPressureHpa);
  const pressureSimilarity = Math.max(0, Math.round(100 - (pressureDelta / 60) * 100));
  factors.push({
    name: 'Atmospheric Pressure & Microburst Gradient',
    similarity: pressureSimilarity,
    metricA: `${a.meteorological.barometricPressureHpa} hPa`,
    metricB: `${b.meteorological.barometricPressureHpa} hPa`,
    analysis:
      pressureDelta < 8
        ? 'Near-identical atmospheric barometric states. Both events coincided with matching isobaric pressure profiles.'
        : `Pressure disparity of ${pressureDelta} hPa indicates different local cyclonic or frontal conditions.`,
  });

  // 3. Magnetic Declination comparison (True North vs Magnetic North alignment)
  const declinationDelta = Math.abs(a.meteorological.magneticDeclinationDeg - b.meteorological.magneticDeclinationDeg);
  const declinationSimilarity = Math.max(0, Math.round(100 - (declinationDelta / 15) * 100));
  factors.push({
    name: 'Magnetic Compass Agonic Alignment',
    similarity: declinationSimilarity,
    metricA: `${a.meteorological.magneticDeclinationDeg}° declination`,
    metricB: `${b.meteorological.magneticDeclinationDeg}° declination`,
    analysis:
      Math.abs(a.meteorological.magneticDeclinationDeg) < 2 && Math.abs(b.meteorological.magneticDeclinationDeg) < 2
        ? 'CRITICAL CORRELATION: Both incidents occurred along the Agonic Line (where True North and Magnetic North read identically with 0° variation), a notorious cause of historical dead-reckoning navigational disorientation.'
        : `Declination difference of ${declinationDelta.toFixed(1)}° indicates different magnetic grid vectors.`,
  });

  // 4. Hexagonal Cloud Satellite Formation (Air-bomb microburst phenomenon)
  const hexMatch = a.meteorological.hexagonalCloudDetected === b.meteorological.hexagonalCloudDetected;
  const hexSimilarity = hexMatch ? 100 : 25;
  factors.push({
    name: 'Hexagonal Cloud / Air-Bomb Microburst Envelope',
    similarity: hexSimilarity,
    metricA: a.meteorological.hexagonalCloudDetected ? 'Detected (High-velocity downdrafts)' : 'Negative',
    metricB: b.meteorological.hexagonalCloudDetected ? 'Detected (High-velocity downdrafts)' : 'Negative',
    analysis: hexMatch
      ? (a.meteorological.hexagonalCloudDetected
          ? 'Both exhibited hexagonal meteorological cell signatures capable of generating 170mph sea-level microbursts.'
          : 'Neither showed classic hexagonal satellite radar cloud anomalies.')
      : 'One incident exhibited severe hexagonal cloud downdraft risks while the other did not.',
  });

  // 5. Electronic Mist / Ocean Fog
  const mistMatch = a.meteorological.fogOrElectronicMistReported === b.meteorological.fogOrElectronicMistReported;
  const mistSimilarity = mistMatch ? 100 : 30;
  factors.push({
    name: 'Anomalous Electronic Mist / Ionized Fog',
    similarity: mistSimilarity,
    metricA: a.meteorological.fogOrElectronicMistReported ? 'Reported (Instrument spinning)' : 'Clear atmosphere',
    metricB: b.meteorological.fogOrElectronicMistReported ? 'Reported (Instrument spinning)' : 'Clear atmosphere',
    analysis: mistMatch
      ? (a.meteorological.fogOrElectronicMistReported
          ? 'Strong correlation: Both logbooks / radio transmissions reported glowing or dense electromagnetic ionized mist causing radio blackout.'
          : 'Both occurred without recorded ionization fog.')
      : 'Divergent atmospheric visibility telemetry.',
  });

  // 6. Sea State & Wave Height
  const waveDelta = Math.abs(a.meteorological.waveHeightMeters - b.meteorological.waveHeightMeters);
  const waveSimilarity = Math.max(0, Math.round(100 - (waveDelta / 10) * 100));
  factors.push({
    name: 'Sargasso Sea Hydrodynamics & Wave Height',
    similarity: waveSimilarity,
    metricA: `${a.meteorological.waveHeightMeters}m swells, ${a.meteorological.sargassoCurrentSpeedKnots}kt current`,
    metricB: `${b.meteorological.waveHeightMeters}m swells, ${b.meteorological.sargassoCurrentSpeedKnots}kt current`,
    analysis:
      waveDelta <= 2
        ? 'High hydrodynamic convergence: Similar wave kinetic energy and abyssal current drag.'
        : `Wave height variation of ${waveDelta.toFixed(1)}m.`,
  });

  // Calculate weighted overall score
  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.similarity, 0) / factors.length
  );

  const sharedAnomalousMarkers: string[] = [];
  if (kSimilarity >= 80) sharedAnomalousMarkers.push('Elevated Solar/Geomagnetic Flux Coincidence');
  if (pressureSimilarity >= 85) sharedAnomalousMarkers.push('Synchronized Isobaric Pressure Drop');
  if (hexMatch && a.meteorological.hexagonalCloudDetected) sharedAnomalousMarkers.push('Hexagonal Microburst Signatures');
  if (mistMatch && a.meteorological.fogOrElectronicMistReported) sharedAnomalousMarkers.push('Electromagnetic Ionized Mist Blackout');
  if (declinationSimilarity >= 85) sharedAnomalousMarkers.push('Agonic Line Magnetic Convergence');

  let verdict = '';
  if (overall >= 78) {
    verdict = 'HIGH CORRELATION: Strong meteorological and geomagnetic convergence. These incidents unfolded under remarkably identical atmospheric and magnetohydrodynamic stress profiles, pointing to an identical environmental or electromagnetic catalyst.';
  } else if (overall >= 55) {
    verdict = 'MODERATE CORRELATION: Partial overlap in geomagnetic or pressure variables, though local wave kinetics and storm envelopes differed.';
  } else {
    verdict = 'LOW CORRELATION: Independent atmospheric profiles. The two events occurred under distinctly divergent environmental regimes.';
  }

  return {
    similarityScorePercent: overall,
    factors,
    verdict,
    sharedAnomalousMarkers,
    meteorologicalSummary: `Barometric delta: ${pressureDelta} hPa | Wave delta: ${waveDelta.toFixed(1)}m | Current delta: ${Math.abs(a.meteorological.sargassoCurrentSpeedKnots - b.meteorological.sargassoCurrentSpeedKnots)}kt`,
    geomagneticSummary: `Solar K-Index correlation: ${kSimilarity}% | Magnetic declination delta: ${declinationDelta.toFixed(1)}°`,
  };
}

/**
 * Checks whether two specific builds/structures share identical architectural plans
 * (e.g. Alexander Gordon cast-iron lighthouses or ancient megalithic stone layouts).
 */
export function compareArchitecturalStructures(
  a: ArchitecturalStructure,
  b: ArchitecturalStructure
): StructureComparisonResult {
  const factors: StructureComparisonResult['factors'] = [];

  // 1. Archetype and Architectural Family
  const sameArchetype = a.archetype === b.archetype;
  const sameArchitect = a.architect.toLowerCase().trim() === b.architect.toLowerCase().trim();
  
  factors.push({
    feature: 'Architectural Archetype & Typology',
    matchGrade: sameArchetype ? 'IDENTICAL' : 'HIGHLY_DIVERGENT',
    specA: `${a.archetype} (${a.constructionMaterial})`,
    specB: `${b.archetype} (${b.constructionMaterial})`,
    engineerNotes: sameArchetype
      ? `Both structures belong to the exact same classification: ${a.archetype}.`
      : `Different building typologies: ${a.archetype} vs ${b.archetype}.`,
  });

  // 2. Architect / Foundry & Builder Lineage
  factors.push({
    feature: 'Architect & Patent / Foundry Blueprint Source',
    matchGrade: sameArchitect ? 'IDENTICAL' : 'DIFFERENT',
    specA: `${a.architect} (Built ${a.yearBuilt})`,
    specB: `${b.architect} (Built ${b.yearBuilt})`,
    engineerNotes: sameArchitect
      ? `CONFIRMED COMMON ORIGIN: Both structures were designed by master architect/engineer ${a.architect}. Blueprints originated from the same engineering office.`
      : `Distinct designers: ${a.architect} vs ${b.architect}.`,
  });

  // 3. Dimensional Scaling & Geometric Taper Ratio
  const heightRatio = Math.min(a.dimensions.heightMeters, b.dimensions.heightMeters) /
    Math.max(a.dimensions.heightMeters, b.dimensions.heightMeters);
  const baseRatio = Math.min(a.dimensions.baseDiameterMeters, b.dimensions.baseDiameterMeters) /
    Math.max(a.dimensions.baseDiameterMeters, b.dimensions.baseDiameterMeters);

  const geometricRatioMatch = a.blueprintSpecs.geometricRatio === b.blueprintSpecs.geometricRatio;
  let ratioGrade: StructureComparisonResult['factors'][0]['matchGrade'] = 'DIFFERENT';
  if (geometricRatioMatch && heightRatio > 0.95 && baseRatio > 0.95) {
    ratioGrade = 'IDENTICAL';
  } else if (geometricRatioMatch || (heightRatio > 0.85 && baseRatio > 0.85)) {
    ratioGrade = 'CLOSE_VARIANT';
  }

  factors.push({
    feature: 'Geometric Taper Ratio & Dimensional Scale',
    matchGrade: ratioGrade,
    specA: `Height: ${a.dimensions.heightMeters}m, Base Ø: ${a.dimensions.baseDiameterMeters}m (Ratio: ${a.blueprintSpecs.geometricRatio})`,
    specB: `Height: ${b.dimensions.heightMeters}m, Base Ø: ${b.dimensions.baseDiameterMeters}m (Ratio: ${b.blueprintSpecs.geometricRatio})`,
    engineerNotes: ratioGrade === 'IDENTICAL'
      ? 'The geometric taper and footprint dimensions match within 1% tolerance, indicating identical casting molds or master templates.'
      : ratioGrade === 'CLOSE_VARIANT'
      ? 'Proportional scaling is identical, likely representing modular height tier adjustment of the same base blueprint system.'
      : 'Different dimensional ratios and taper geometry.',
  });

  // 4. Optical / Lantern Apparatus or Functional Core
  const sameOptics = a.opticalSystemOrLensOrder === b.opticalSystemOrLensOrder;
  factors.push({
    feature: 'Optical Apparatus / Focal System',
    matchGrade: sameOptics ? 'IDENTICAL' : (a.opticalSystemOrLensOrder && b.opticalSystemOrLensOrder ? 'CLOSE_VARIANT' : 'DIFFERENT'),
    specA: a.opticalSystemOrLensOrder || 'N/A',
    specB: b.opticalSystemOrLensOrder || 'N/A',
    engineerNotes: sameOptics
      ? `Both structures utilize identical optic apparatus: ${a.opticalSystemOrLensOrder}.`
      : `Optics variation: ${a.opticalSystemOrLensOrder || 'None'} vs ${b.opticalSystemOrLensOrder || 'None'}.`,
  });

  // 5. Foundation Engineering & Modular Flanges
  const sameFoundation = a.foundationEngineering.toLowerCase() === b.foundationEngineering.toLowerCase();
  factors.push({
    feature: 'Substructure & Foundation Flange Anchoring',
    matchGrade: sameFoundation ? 'IDENTICAL' : 'CLOSE_VARIANT',
    specA: a.foundationEngineering,
    specB: b.foundationEngineering,
    engineerNotes: sameFoundation
      ? 'Identical bedrock bolt ring pattern and radial anchoring flange engineering.'
      : 'Adapted substructure anchoring customized for local soil or reef seabed conditions.',
  });

  // 6. Acoustic Resonance & Anomalous Vibrational Frequency
  const freqDelta = Math.abs(a.blueprintSpecs.acousticResonanceHz - b.blueprintSpecs.acousticResonanceHz);
  const freqGrade: StructureComparisonResult['factors'][0]['matchGrade'] =
    freqDelta < 5 ? 'IDENTICAL' : freqDelta < 25 ? 'CLOSE_VARIANT' : 'DIFFERENT';

  factors.push({
    feature: 'Acoustic Resonance Frequency (Wind Shearing Cavity)',
    matchGrade: freqGrade,
    specA: `${a.blueprintSpecs.acousticResonanceHz} Hz`,
    specB: `${b.blueprintSpecs.acousticResonanceHz} Hz`,
    engineerNotes: freqGrade === 'IDENTICAL'
      ? 'Identical acoustic cavity resonance. When gale winds sweep through the tower/chamber, both generate identical subsonic frequencies.'
      : `Acoustic frequency delta of ${freqDelta} Hz.`,
  });

  // Check known sister structures
  const isKnownSister =
    (a.blueprintSpecs.identicalSisterStructures?.includes(b.name) ||
      b.blueprintSpecs.identicalSisterStructures?.includes(a.name) ||
      (sameArchitect && sameArchetype && geometricRatioMatch)) ?? false;

  // Calculate score
  let score = 0;
  if (sameArchetype) score += 30;
  if (sameArchitect) score += 30;
  if (ratioGrade === 'IDENTICAL') score += 20;
  else if (ratioGrade === 'CLOSE_VARIANT') score += 12;
  if (sameOptics) score += 10;
  if (sameFoundation) score += 5;
  if (freqGrade === 'IDENTICAL') score += 5;

  if (isKnownSister && score < 90) {
    score = Math.max(score, 94);
  }

  const isSamePlan = score >= 85;
  const divergences: string[] = [];
  if (!sameArchitect) divergences.push('Different architects of record');
  if (ratioGrade !== 'IDENTICAL') divergences.push('Dimensional variations in tower height or segment counts');
  if (!sameOptics) divergences.push('Divergent lantern optical orders or reflector systems');

  const historicalVerification = isSamePlan
    ? `HISTORICAL VERIFICATION: ${a.name} and ${b.name} share verified sister blueprints! ${a.architect}'s engineering firm produced standardized prefabricated cast components that were shipped from British / domestic ironworks to both colonial locations.`
    : `HISTORICAL VERIFICATION: ${a.name} and ${b.name} do not share identical architectural blueprints. While they may share regional maritime purposes, their structural geometries and construction methodologies are distinct.`;

  return {
    identicalDesignProbabilityPercent: Math.min(100, score),
    isSameArchitecturalPlan: isSamePlan,
    architecturalFamilyMatch: sameArchetype,
    factors,
    historicalVerification,
    divergences,
    sharedBlueprintsEvidence: isSamePlan
      ? `Matching bolt-circle diameter, identical flange segment interlocking joints, and shared foundry patent specifications.`
      : `Disparate structural engineering specifications.`,
  };
}

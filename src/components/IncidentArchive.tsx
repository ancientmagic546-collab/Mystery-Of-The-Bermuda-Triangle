import React, { useState } from 'react';
import {
  IncidentRecord,
  AnomalyType,
  CustomResearcherPin,
} from '../types/research';
import { HISTORICAL_INCIDENTS } from '../data/bermudaData';
import {
  isWithin500MilesOfBermudaTriangle,
  distanceToBermudaTrianglePerimeterMiles,
  isInsideBermudaTriangle,
} from '../utils/geoMath';
import {
  Search,
  Calendar,
  Waves,
  Radio,
  FileWarning,
  Compass,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Sparkles,
  PlusCircle,
  AlertTriangle,
  MapPin,
  X,
  Crosshair,
} from 'lucide-react';

interface IncidentArchiveProps {
  onSelectForComparison: (incident: IncidentRecord) => void;
  onFocusOnGlobe: (lat: number, lng: number) => void;
  onSelectIncidentDetail: (incident: IncidentRecord) => void;
  customPins?: CustomResearcherPin[];
  onAddIncident?: (pin: Omit<CustomResearcherPin, 'id' | 'timestamp'>) => void;
}

export const IncidentArchive: React.FC<IncidentArchiveProps> = ({
  onSelectForComparison,
  onFocusOnGlobe,
  onSelectIncidentDetail,
  customPins = [],
  onAddIncident,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [timelineStartYear, setTimelineStartYear] = useState<number>(1490);
  const [timelineEndYear, setTimelineEndYear] = useState<number>(2026);
  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(HISTORICAL_INCIDENTS[4]); // default to Flight 19

  // Modal for logging new field incident
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [fieldTitle, setFieldTitle] = useState('');
  const [fieldYear, setFieldYear] = useState(new Date().getFullYear());
  const [fieldLat, setFieldLat] = useState(27.5);
  const [fieldLng, setFieldLng] = useState(-73.2);
  const [fieldCategory, setFieldCategory] = useState<AnomalyType>('uap_uso');
  const [fieldVessel, setFieldVessel] = useState('Research Vessel Nautilus / US Coast Guard Cutter');
  const [fieldNotes, setFieldNotes] = useState('');
  const [fieldPressure, setFieldPressure] = useState(1012);
  const [fieldKIndex, setFieldKIndex] = useState(6);

  // Combine historical incidents with converted custom pins
  const allIncidents: IncidentRecord[] = [
    ...HISTORICAL_INCIDENTS,
    ...customPins.map((pin) => ({
      id: pin.id,
      title: pin.title,
      year: new Date(pin.timestamp).getFullYear(),
      date: new Date(pin.timestamp).toISOString().split('T')[0],
      lat: pin.lat,
      lng: pin.lng,
      locationDescription: `Researcher Logged Coordinates: ${pin.lat.toFixed(3)}°N, ${pin.lng.toFixed(3)}°W`,
      vesselsOrAircraft: 'Field Research Telemetry Sighting',
      casualtiesOrMissing: 0,
      classificationLevel: 'DECLASSIFIED' as const,
      type: (pin.category.includes('UFO') || pin.category.includes('USO')
        ? 'uap_uso'
        : pin.category.includes('Geomagnetic')
        ? 'geomagnetic'
        : 'disappearance') as AnomalyType,
      summary: pin.notes || 'Confidential field anomaly finding recorded locally by researcher.',
      detailedReport: `FIELD OBSERVATION LOG - LOCAL DOSSIER\n\nTitle: ${pin.title}\nCategory: ${pin.category}\nCoordinates: ${pin.lat}°N, ${pin.lng}°W\nInside Bermuda Triangle: ${isInsideBermudaTriangle(pin.lat, pin.lng) ? 'CONFIRMED' : 'NO'}\nDistance to Perimeter: ${distanceToBermudaTrianglePerimeterMiles(pin.lat, pin.lng).toFixed(1)} miles\n\nResearcher Field Notes:\n${pin.notes || 'No extended notes provided.'}`,
      officialExplanations: ['Under review by local research terminal', 'Automated anomaly detection sensor flagged event'],
      anomalousTheories: ['Anomalous electromagnetic disturbance', 'Transmedium craft radar correlation', 'Methane pulse or localized microburst'],
      meteorological: {
        barometricPressureHpa: 1013,
        windSpeedKnots: 15,
        waveHeightMeters: 2.1,
        geomagneticKIndex: 5,
        magneticDeclinationDeg: -7.5,
        sargassoCurrentSpeedKnots: 2.5,
        visibilityKm: 18,
        fogOrElectronicMistReported: true,
        hexagonalCloudDetected: false,
      },
    })),
  ];

  // Filtered list
  const filtered = allIncidents.filter((inc) => {
    if (inc.year < timelineStartYear || inc.year > timelineEndYear) return false;
    if (selectedType !== 'ALL' && inc.type !== selectedType) return false;
    if (selectedClassification !== 'ALL' && inc.classificationLevel !== selectedClassification) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inc.title.toLowerCase().includes(q) ||
        inc.locationDescription.toLowerCase().includes(q) ||
        inc.vesselsOrAircraft.toLowerCase().includes(q) ||
        inc.summary.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getAnomalyBadge = (type: AnomalyType) => {
    switch (type) {
      case 'disappearance':
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px] font-mono">DISAPPEARANCE</span>;
      case 'uap_uso':
        return <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/50 text-[10px] font-mono">UAP / USO ENCOUNTER</span>;
      case 'geomagnetic':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] font-mono">GEOMAGNETIC WARP</span>;
      case 'acoustic_sonar':
        return <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600/50 text-[10px] font-mono">ACOUSTIC HYDROPHONE</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">{type}</span>;
    }
  };

  const handleSaveFieldIncident = () => {
    if (!fieldTitle.trim() || !onAddIncident) return;

    onAddIncident({
      lat: Number(fieldLat),
      lng: Number(fieldLng),
      title: fieldTitle.trim(),
      category: fieldCategory === 'uap_uso' ? 'UFO / USO Fast-Mover Contact' : fieldCategory === 'geomagnetic' ? 'Geomagnetic Distortion / Precession' : 'Maritime / Aerial Vanishing',
      notes: `Vessel/Aircraft: ${fieldVessel}\nRecorded Pressure: ${fieldPressure} hPa\nGeomagnetic K-Index: ${fieldKIndex}/9\nField Log: ${fieldNotes}`,
    });

    setIsLogModalOpen(false);
    setFieldTitle('');
    setFieldNotes('');
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Left List & Filter Column */}
      <div className="w-full md:w-1/2 lg:w-5/12 border-r border-slate-800 flex flex-col bg-slate-900/50">
        {/* Header & Search */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm tracking-wide text-slate-100">MARITIME & ANOMALOUS ARCHIVES</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow"
                title="Log new field incident or sighting"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Incident</span>
              </button>
              <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {filtered.length} LOGGED
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vessel, pilot, date, or anomaly..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="disappearance">Disappearances</option>
              <option value="uap_uso">UAP / USO Encounters</option>
              <option value="geomagnetic">Geomagnetic Distortions</option>
              <option value="acoustic_sonar">Sonar & Acoustic Anomalies</option>
            </select>

            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="ALL">All Clearances</option>
              <option value="DECLASSIFIED">Declassified</option>
              <option value="TOP_SECRET">Top Secret</option>
              <option value="SECRET">Secret</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="CIVILIAN_LOG">Civilian Log</option>
            </select>
          </div>

          {/* Historical Timeline Range Slider */}
          <div className="pt-1 text-[11px] font-mono text-slate-400">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>Historical Timeline Filter:</span>
              </span>
              <span className="text-cyan-300 font-bold">{timelineStartYear} — {timelineEndYear}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">From Year: {timelineStartYear}</label>
                <input
                  type="range"
                  min="1490"
                  max="2026"
                  step="10"
                  value={timelineStartYear}
                  onChange={(e) => setTimelineStartYear(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">To Year: {timelineEndYear}</label>
                <input
                  type="range"
                  min="1490"
                  max="2026"
                  step="5"
                  value={timelineEndYear}
                  onChange={(e) => setTimelineEndYear(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Incident Cards List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1.5">
          {filtered.map((inc) => {
            const isSelected = activeIncident?.id === inc.id;
            const isFieldPin = inc.id.startsWith('pin_');
            return (
              <div
                key={inc.id}
                onClick={() => {
                  setActiveIncident(inc);
                  onSelectIncidentDetail(inc);
                }}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800/90 border border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {inc.year}
                    </span>
                    {getAnomalyBadge(inc.type)}
                    {isFieldPin && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                        FIELD LOG
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {inc.classificationLevel}
                  </span>
                </div>

                <div className="font-semibold text-slate-100 text-xs mb-1">
                  {inc.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {inc.summary}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-300/80">{inc.locationDescription}</span>
                  <span>{inc.lat.toFixed(2)}°N, {inc.lng.toFixed(2)}°W</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
        {activeIncident ? (
          <div className="max-w-3xl space-y-5">
            {/* Incident Header Dossier Card */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono text-xs font-bold">
                    DATE: {activeIncident.date}
                  </span>
                  {getAnomalyBadge(activeIncident.type)}
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                    ID: {activeIncident.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onFocusOnGlobe(activeIncident.lat, activeIncident.lng)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono transition"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Focus on 3D Earth</span>
                  </button>

                  <button
                    onClick={() => onSelectForComparison(activeIncident)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-mono transition"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send to Comparator</span>
                  </button>
                </div>
              </div>

              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-100 mb-1">
                  {activeIncident.title}
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  VESSEL / AIRCRAFT: <strong className="text-cyan-300">{activeIncident.vesselsOrAircraft}</strong> | CASUALTIES / MISSING: <strong className="text-rose-400">{activeIncident.casualtiesOrMissing}</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {activeIncident.summary}
              </div>
            </div>

            {/* Meteorological & Geomagnetic Conditions Telemetry Box */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>ENVIRONMENTAL & GEOMAGNETIC CONDITIONS TELEMETRY</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">HISTORICAL RECONSTRUCTION</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">PRESSURE</span>
                  <span className="font-bold text-amber-300">{activeIncident.meteorological.barometricPressureHpa} hPa</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {activeIncident.meteorological.barometricPressureHpa < 1000 ? 'Severe Depression' : 'Normal Gradient'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">GEOMAGNETIC K-INDEX</span>
                  <span className={`font-bold ${activeIncident.meteorological.geomagneticKIndex >= 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Kp {activeIncident.meteorological.geomagneticKIndex} / 9
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {activeIncident.meteorological.geomagneticKIndex >= 5 ? 'Severe Storm' : 'Moderate Baseline'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">WIND VELOCITY</span>
                  <span className="font-bold text-cyan-300">{activeIncident.meteorological.windSpeedKnots} knots</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Sustained surface</span>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">OCEAN SWELL HEIGHT</span>
                  <span className="font-bold text-cyan-300">{activeIncident.meteorological.waveHeightMeters} meters</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Sargasso sea state</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Hexagonal Microburst Cell:</span>
                  <span className={activeIncident.meteorological.hexagonalCloudDetected ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                    {activeIncident.meteorological.hexagonalCloudDetected ? 'ACTIVE AIR-BOMB RISK' : 'NEGATIVE'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Ionized Electronic Mist:</span>
                  <span className={activeIncident.meteorological.fogOrElectronicMistReported ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {activeIncident.meteorological.fogOrElectronicMistReported ? 'REPORTED IN LOGS' : 'CLEAR'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Narrative & Scientific Analysis */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Full Investigation Chronology & Evidence Record
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {activeIncident.detailedReport}
              </p>

              {activeIncident.sonarOrRadarTelemetry && (
                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200">
                  <strong className="text-cyan-400 block mb-1">HYDRO-ACOUSTIC / RADAR TELEMETRY LOG:</strong>
                  {activeIncident.sonarOrRadarTelemetry}
                </div>
              )}

              {/* Theories Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Official Naval / Civil Hypotheses</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    {activeIncident.officialExplanations.map((exp, idx) => (
                      <li key={idx}>{exp}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Anomalous & UAP/USO Hypotheses</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    {activeIncident.anomalousTheories.map((theory, idx) => (
                      <li key={idx}>{theory}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Select an incident from the timeline archive on the left.
          </div>
        )}
      </div>

      {/* Log Field Incident Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-lg p-5 rounded-xl bg-slate-900 border border-amber-500/50 shadow-2xl text-slate-100 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>Log New Field Anomaly / Incident Report</span>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live 500-Mile Check Alert Indicator */}
            {isWithin500MilesOfBermudaTriangle(fieldLat, fieldLng) ? (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-200 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold text-[11px]">AUTOMATED ANOMALY DETECTION ARMED:</span>
                  <p className="text-[10px] text-rose-300">
                    Location is {isInsideBermudaTriangle(fieldLat, fieldLng) ? 'INSIDE' : `${distanceToBermudaTrianglePerimeterMiles(fieldLat, fieldLng).toFixed(1)} miles from`} Bermuda Triangle (&lt; 500 miles). Saving will broadcast an instant alert banner to the status bar!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[10px] mb-3">
                Location is &gt; 500 miles from Bermuda Triangle perimeter. Standard local logging active.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Incident / Finding Title</label>
                <input
                  type="text"
                  value={fieldTitle}
                  onChange={(e) => setFieldTitle(e.target.value)}
                  placeholder="e.g. Submerged USO Acoustic Non-Cavitation Contact"
                  className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Year</label>
                  <input
                    type="number"
                    value={fieldYear}
                    onChange={(e) => setFieldYear(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fieldLat}
                    onChange={(e) => setFieldLat(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Longitude (°W)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fieldLng}
                    onChange={(e) => setFieldLng(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              {/* Quick Bermuda Coordinate Hotspots */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-500">Preset Hotspots:</span>
                <button
                  type="button"
                  onClick={() => { setFieldLat(32.3078); setFieldLng(-64.7505); }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Bermuda Apex
                </button>
                <button
                  type="button"
                  onClick={() => { setFieldLat(25.7333); setFieldLng(-79.2833); }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Bimini (Bahamas)
                </button>
                <button
                  type="button"
                  onClick={() => { setFieldLat(19.8333); setFieldLng(-66.5); }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Puerto Rico Trench
                </button>
                <button
                  type="button"
                  onClick={() => { setFieldLat(28.0); setFieldLng(-66.0); }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Sargasso Sea
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-[10px] mb-0.5">Anomaly Classification</label>
                  <select
                    value={fieldCategory}
                    onChange={(e) => setFieldCategory(e.target.value as AnomalyType)}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  >
                    <option value="uap_uso">UAP / USO Encounter</option>
                    <option value="disappearance">Disappearance / Vanishing</option>
                    <option value="geomagnetic">Geomagnetic Distortion</option>
                    <option value="acoustic_sonar">Acoustic Sonar / Hydrophone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] mb-0.5">Geomagnetic K-Index (0-9)</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={fieldKIndex}
                    onChange={(e) => setFieldKIndex(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] mb-0.5">Observed Vessel / Aircraft</label>
                <input
                  type="text"
                  value={fieldVessel}
                  onChange={(e) => setFieldVessel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] mb-0.5">Confidential Field Notes</label>
                <textarea
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe radar tracks, visual contact, magnetic compass deviation, or sonar ping profiles..."
                  className="w-full px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFieldIncident}
                disabled={!fieldTitle.trim()}
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition shadow"
              >
                Commit Field Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

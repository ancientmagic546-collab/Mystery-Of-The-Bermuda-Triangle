import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Search,
  BookOpen,
  Scale,
  Building2,
  FolderLock,
  Compass,
  Radio,
  Lock,
  HardDrive,
  Calendar,
  Waves,
} from 'lucide-react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { EarthGlobe3D } from './components/EarthGlobe3D';
import { IntelligenceBrowser } from './components/IntelligenceBrowser';
import { IncidentArchive } from './components/IncidentArchive';
import { IncidentComparator } from './components/IncidentComparator';
import { BlueprintComparator } from './components/BlueprintComparator';
import { LocalCaseLocker } from './components/LocalCaseLocker';
import { AnomalyAlertBanner, AnomalyAlertPayload } from './components/AnomalyAlertBanner';
import {
  loadLocalDossier,
  saveLocalDossier,
  getLocalStorageSizeKb,
} from './utils/localVault';
import {
  isWithin500MilesOfBermudaTriangle,
  distanceToBermudaTrianglePerimeterMiles,
  isInsideBermudaTriangle,
} from './utils/geoMath';
import {
  LocalDossier,
  IncidentRecord,
  IslandOrLandmark,
  CustomResearcherPin,
} from './types/research';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'globe' | 'browser' | 'archive' | 'comparator' | 'blueprints' | 'locker'
  >('globe');

  const [dossier, setDossier] = useState<LocalDossier>(loadLocalDossier);
  const [storageSizeKb, setStorageSizeKb] = useState<number>(getLocalStorageSizeKb());

  // Real-time Automated Anomaly Detection System Alerts
  const [activeAnomalyAlert, setActiveAnomalyAlert] = useState<AnomalyAlertPayload | null>(null);
  const [alertHistory, setAlertHistory] = useState<AnomalyAlertPayload[]>([]);
  const [globeFocusTarget, setGlobeFocusTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Cross-component state
  const [comparisonTargetA, setComparisonTargetA] = useState<IncidentRecord | undefined>();
  const [comparisonTargetB, setComparisonTargetB] = useState<IncidentRecord | undefined>();

  // Clock in status bar
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update storage size on dossier updates
  const handleUpdateDossier = (updated: LocalDossier) => {
    setDossier(updated);
    setStorageSizeKb(getLocalStorageSizeKb());
  };

  const handleAddCustomPin = (pinData: Omit<CustomResearcherPin, 'id' | 'timestamp'>) => {
    const newPin: CustomResearcherPin = {
      ...pinData,
      id: `pin_${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = {
      ...dossier,
      customPins: [newPin, ...dossier.customPins],
    };
    saveLocalDossier(updated);
    handleUpdateDossier(updated);

    // Automated Anomaly Detection: check if within 500 miles of Bermuda Triangle
    if (isWithin500MilesOfBermudaTriangle(pinData.lat, pinData.lng)) {
      const distanceMiles = distanceToBermudaTrianglePerimeterMiles(pinData.lat, pinData.lng);
      const isInside = isInsideBermudaTriangle(pinData.lat, pinData.lng);
      const alert: AnomalyAlertPayload = {
        id: `alert_${Date.now()}`,
        timestamp: Date.now(),
        title: pinData.title,
        lat: pinData.lat,
        lng: pinData.lng,
        distanceMiles,
        isInside,
        category: pinData.category,
        notes: pinData.notes,
      };
      setActiveAnomalyAlert(alert);
      setAlertHistory((prev) => [alert, ...prev]);
    }
  };

  const handleClipNote = (title: string, content: string, tags: string[]) => {
    const newNote = {
      id: `note_${Date.now()}`,
      title,
      content,
      tags,
      timestamp: Date.now(),
      linkedIncidentIds: [],
    };
    const updated = {
      ...dossier,
      notes: [newNote, ...dossier.notes],
    };
    saveLocalDossier(updated);
    handleUpdateDossier(updated);
  };

  const handleBookmarkSource = (
    title: string,
    url: string,
    network: 'clearnet' | 'onion_archive' | 'declassified_mil',
    snippet: string
  ) => {
    const newBookmark = {
      title,
      url,
      network,
      snippet,
      timestamp: Date.now(),
    };
    const updated = {
      ...dossier,
      bookmarkedSources: [newBookmark, ...dossier.bookmarkedSources],
    };
    saveLocalDossier(updated);
    handleUpdateDossier(updated);
  };

  const handleLogSearch = (
    query: string,
    engine: 'surface_web' | 'deep_web_onion',
    resultsCount: number
  ) => {
    const newHistory = {
      query,
      engine,
      timestamp: Date.now(),
      resultsCount,
    };
    const updated = {
      ...dossier,
      searchHistory: [newHistory, ...dossier.searchHistory],
    };
    saveLocalDossier(updated);
    handleUpdateDossier(updated);
  };

  const handleSendToComparator = (incident: IncidentRecord) => {
    setComparisonTargetA(incident);
    setActiveTab('comparator');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Windows Application Title Bar */}
      <WindowsTitleBar
        stationName={dossier.stationName}
        storageSizeKb={storageSizeKb}
      />

      {/* 2. Tactical Navigation Ribbon */}
      <nav className="h-11 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-3 z-40 select-none text-xs shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('globe')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'globe'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>3D Earth & Geofence</span>
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'browser'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Intelligence & Deep Web</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'archive'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Incident Archives</span>
          </button>

          <button
            onClick={() => setActiveTab('comparator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'comparator'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Condition Comparator</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprints')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'blueprints'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Blueprint Comparator</span>
          </button>

          <button
            onClick={() => setActiveTab('locker')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'locker'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            <span>Evidence Locker ({dossier.notes.length})</span>
          </button>
        </div>

        {/* Right Station Tag */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-cyan-400 shrink-0">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>STATION ACTIVE: BERMUDA TRIANGLE SECTOR 7</span>
        </div>
      </nav>

      {/* 3. Main Operational Viewport */}
      <main className="flex-1 w-full relative overflow-hidden bg-slate-950">
        {activeTab === 'globe' && (
          <EarthGlobe3D
            customPins={dossier.customPins}
            onAddCustomPin={handleAddCustomPin}
            onSelectIncident={(inc) => {
              setComparisonTargetA(inc);
              setActiveTab('archive');
            }}
            focusTarget={globeFocusTarget}
            onNavigateToBrowser={() => setActiveTab('browser')}
          />
        )}

        {activeTab === 'browser' && (
          <IntelligenceBrowser
            dossier={dossier}
            onClipNote={handleClipNote}
            onBookmarkSource={handleBookmarkSource}
            onLogSearch={handleLogSearch}
          />
        )}

        {activeTab === 'archive' && (
          <IncidentArchive
            onSelectForComparison={handleSendToComparator}
            onFocusOnGlobe={(lat, lng) => {
              setActiveTab('globe');
              setGlobeFocusTarget({ lat, lng });
            }}
            onSelectIncidentDetail={() => {}}
            customPins={dossier.customPins}
            onAddIncident={handleAddCustomPin}
          />
        )}

        {activeTab === 'comparator' && (
          <IncidentComparator
            initialIncidentA={comparisonTargetA}
            initialIncidentB={comparisonTargetB}
          />
        )}

        {activeTab === 'blueprints' && <BlueprintComparator />}

        {activeTab === 'locker' && (
          <LocalCaseLocker
            dossier={dossier}
            storageSizeKb={storageSizeKb}
            onUpdateDossier={handleUpdateDossier}
            onFocusCoordinates={() => setActiveTab('globe')}
          />
        )}
      </main>

      {/* Real-time Automated Anomaly Detection Alert Banner */}
      <AnomalyAlertBanner
        activeAlert={activeAnomalyAlert}
        onDismiss={() => setActiveAnomalyAlert(null)}
        onFocusCoordinates={(lat, lng) => {
          setActiveTab('globe');
          setGlobeFocusTarget({ lat, lng });
        }}
        onNavigateToArchive={() => {
          setActiveTab('archive');
        }}
      />

      {/* 4. Windows Workstation Status Bar */}
      <footer className={`h-7 border-t flex items-center justify-between px-3 text-[11px] font-mono select-none z-40 shrink-0 transition-colors ${
        activeAnomalyAlert
          ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border-rose-500 text-rose-200 shadow-lg'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-3 truncate">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full animate-pulse ${activeAnomalyAlert ? 'bg-rose-400' : 'bg-emerald-400'}`} />
            <span className={activeAnomalyAlert ? 'text-rose-300 font-bold' : 'text-slate-300'}>
              {activeAnomalyAlert ? 'STATUS: SENSOR TRIP' : 'SYSTEM: NORMAL'}
            </span>
          </div>

          <span className="hidden lg:inline text-slate-600">|</span>

          {/* Anomaly Detection Subsystem Badge */}
          <button
            onClick={() => {
              if (alertHistory.length > 0) {
                setActiveAnomalyAlert(alertHistory[0]);
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold transition shadow ${
              activeAnomalyAlert
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-amber-950/70 border border-amber-600/40 text-amber-400 hover:bg-amber-900'
            }`}
            title="Automated 500-Mile Anomaly Sensor Active"
          >
            <Radio className="w-2.5 h-2.5 text-inherit animate-spin" style={{ animationDuration: '6s' }} />
            <span>500-MI ANOMALY SENSOR: {activeAnomalyAlert ? 'TRIGGERED' : 'ARMED'}</span>
            {alertHistory.length > 0 && (
              <span className="px-1 rounded bg-rose-700 text-white font-mono text-[9px]">
                {alertHistory.length}
              </span>
            )}
          </button>

          <span className="hidden lg:inline text-slate-600">|</span>
          <div className="hidden lg:flex items-center gap-1 text-slate-300 truncate">
            <span>BERMUDA VERTICES: 32.3°N, 64.7°W | 25.7°N, 80.2°W | 18.5°N, 66.1°W</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">STORAGE: 100% LOCAL DISK</span>
            <span>({storageSizeKb} KB)</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-200">{utcTime}</span>
        </div>
      </footer>
    </div>
  );
}

import { LocalDossier, LocalCaseNote, CustomResearcherPin } from '../types/research';

const STORAGE_KEY = 'aero_triangle_researcher_vault_v1';

export const DEFAULT_DOSSIER: LocalDossier = {
  researcherId: 'RSRCH-7749-ALPHA',
  callsign: 'NIGHTINGALE-OBSERVER',
  stationName: 'HAMILTON-LOCAL-STATION-01',
  lastUpdated: Date.now(),
  notes: [
    {
      id: 'init_note_1',
      title: 'Initial Case Dossier: The Agonic Line Precession',
      content: 'Bermuda Triangle navigators historically lost dead reckoning because the Agonic Line (zero magnetic variation between true north and magnetic north) traverses directly between Bermuda and the Florida coast. When combined with solar flare geomagnetic induction (Kp >= 6), mechanical gyrocompasses drift up to 15 degrees.',
      tags: ['Geomagnetism', 'Agonic Line', 'Flight 19', 'Navigation'],
      timestamp: Date.now() - 86400000,
      linkedIncidentIds: ['flight_19_1945', 'columbus_1492'],
      pinnedCoordinates: { lat: 32.3078, lng: -64.7505 },
    },
    {
      id: 'init_note_2',
      title: 'Structural Parallels: Alexander Gordon Cast-Iron Towers',
      content: 'Examining Gibbs Hill (Bermuda, 1844) and Great Isaac (Bimini, 1859). Both use 16-flange concentric segmental cast plates fabricated in London. Both experienced unexplained keeper phenomena and localized magnetic polarization anomalies.',
      tags: ['Architecture', 'Lighthouses', 'Alexander Gordon', 'Bimini'],
      timestamp: Date.now() - 43200000,
      linkedIncidentIds: [],
      pinnedCoordinates: { lat: 26.0306, lng: -79.0911 },
    },
  ],
  customPins: [
    {
      id: 'pin_initial_1',
      lat: 25.7667,
      lng: -79.2833,
      title: 'Bimini Road Submerged Grid',
      category: 'Megalithic / USO',
      notes: 'Submerged limestone block pavement at 5.5m depth. Magnetometer readings show anomalous dipole shift.',
      timestamp: Date.now() - 172800000,
    },
    {
      id: 'pin_initial_2',
      lat: 19.8333,
      lng: -66.5,
      title: 'Milwaukee Deep Subduction Anomaly',
      category: 'Abyssal Acoustic',
      notes: 'Deepest Atlantic trench (-8,376m). Hydrophones logged 220kt non-cavitating underwater acoustic tracks.',
      timestamp: Date.now() - 86400000,
    },
  ],
  searchHistory: [
    {
      query: 'Flight 19 radio transcript Hen and Chickens shoals',
      engine: 'surface_web',
      timestamp: Date.now() - 7200000,
      resultsCount: 8,
    },
    {
      query: 'AUTEC hydrophone unredacted acoustic spectrogram USO',
      engine: 'deep_web_onion',
      timestamp: Date.now() - 3600000,
      resultsCount: 3,
    },
  ],
  bookmarkedSources: [
    {
      title: 'Naval History & Heritage Command - Flight 19 Official Record',
      url: 'https://www.history.navy.mil/browse-by-topic/disasters-and-phenomena/flight-19.html',
      network: 'clearnet',
      snippet: 'Official Naval investigation report concerning the loss of 5 TBM Avengers on Dec 5, 1945.',
      timestamp: Date.now() - 10000000,
    },
    {
      title: 'SOSUS Sub-Surface Hydro-Acoustic Leak (Mirror #7)',
      url: 'http://ocean7xq5mabyssalnode.onion/leaks/toto_hydrophone_94.dat',
      network: 'onion_archive',
      snippet: 'Classified acoustic telemetry record detailing 220kt sub-surface non-cavitation contact.',
      timestamp: Date.now() - 5000000,
    },
  ],
};

export function loadLocalDossier(): LocalDossier {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocalDossier(DEFAULT_DOSSIER);
      return DEFAULT_DOSSIER;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DOSSIER, ...parsed };
  } catch (err) {
    console.error('Failed to load local dossier:', err);
    return DEFAULT_DOSSIER;
  }
}

export function saveLocalDossier(dossier: LocalDossier): void {
  try {
    dossier.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dossier));
  } catch (err) {
    console.error('Failed to save local dossier to localStorage:', err);
  }
}

export function exportDossierToFile(dossier: LocalDossier): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dossier, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `AERO_TRIANGLE_DOSSIER_${dossier.callsign}_${new Date().toISOString().split('T')[0]}.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function getLocalStorageSizeKb(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return Math.round((new Blob([raw]).size / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function wipeLocalDossier(): LocalDossier {
  localStorage.removeItem(STORAGE_KEY);
  const fresh: LocalDossier = {
    ...DEFAULT_DOSSIER,
    notes: [],
    customPins: [],
    searchHistory: [],
    bookmarkedSources: [],
    lastUpdated: Date.now(),
  };
  saveLocalDossier(fresh);
  return fresh;
}

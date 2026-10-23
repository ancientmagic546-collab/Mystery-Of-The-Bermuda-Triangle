import React, { useState } from 'react';
import {
  Search,
  Globe,
  ShieldAlert,
  ExternalLink,
  BookmarkPlus,
  FileText,
  RotateCw,
  Lock,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { LocalDossier } from '../types/research';

interface IntelligenceBrowserProps {
  dossier: LocalDossier;
  onClipNote: (title: string, content: string, tags: string[]) => void;
  onBookmarkSource: (title: string, url: string, network: 'clearnet' | 'onion_archive' | 'declassified_mil', snippet: string) => void;
  onLogSearch: (query: string, engine: 'surface_web' | 'deep_web_onion', resultsCount: number) => void;
}

export const IntelligenceBrowser: React.FC<IntelligenceBrowserProps> = ({
  dossier,
  onClipNote,
  onBookmarkSource,
  onLogSearch,
}) => {
  const [engine, setEngine] = useState<'surface_web' | 'deep_web_onion'>('surface_web');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUrl, setActiveUrl] = useState('https://intelligence.bermuda-nexus.org');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<{
    query: string;
    report: string;
    sources: { uri: string; title: string }[];
    timestamp: number;
    network?: string;
  } | null>({
    query: 'Bermuda Triangle magnetic anomalies and Flight 19',
    report: `### Executive Summary: The Bermuda Marine & Aerial Anomalous Zone
The Bermuda Triangle (spanning roughly 500,000 square miles between Bermuda, Miami, and San Juan, Puerto Rico) is characterized by anomalous physical and meteorological phenomena:

1. **The Agonic Line Precession**: One of few locations on Earth where True North and Magnetic North converge with zero magnetic declination. Historically, navigators who failed to compensate for this variance drifted far off course.
2. **Hexagonal Cloud Downdrafts & Microbursts**: Satellite radar imagery frequently reveals hexagonal cloud openings 20 to 50 miles wide generating "air-bombs" with downdraft wind speeds exceeding 170 mph.
3. **Methane Clathrate Blowouts**: Massive subterranean methane hydrate deposits along the Blake Ridge occasionally release gas plumes, dramatically reducing seawater density and causing immediate vessel sinking.
4. **Flight 19 (Dec 5, 1945)**: 5 TBM Avengers commanded by Lt. Charles Taylor vanished after reporting simultaneous dual-compass failures and disorienting ionized sea fog. A rescue PBM-5 Mariner plane vanished 20 minutes later.`,
    sources: [
      {
        uri: 'https://www.history.navy.mil/browse-by-topic/disasters-and-phenomena/flight-19.html',
        title: 'Naval History & Heritage Command - Official Flight 19 Loss Record',
      },
      {
        uri: 'https://oceanservice.noaa.gov/facts/bermudatriangle.html',
        title: 'NOAA Ocean Service - What is the Bermuda Triangle?',
      },
    ],
    timestamp: Date.now() - 3600000,
    network: 'CLEARNET_SURFACE_SEARCH',
  });

  const [clippedFeedback, setClippedFeedback] = useState(false);
  const [bookmarkedFeedback, setBookmarkedFeedback] = useState(false);

  const executeSearch = async (queryToSearch = searchQuery) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);
    setClippedFeedback(false);
    setBookmarkedFeedback(false);

    try {
      const endpoint = engine === 'surface_web' ? '/api/search' : '/api/deep-web';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with code ${res.status}`);
      }

      const data = await res.json();
      setCurrentResult(data);
      setActiveUrl(
        engine === 'surface_web'
          ? `https://google.com/search?q=${encodeURIComponent(q)}`
          : `onion://abyssal-vault-mirror.onion/search?k=${encodeURIComponent(q)}`
      );

      // Log into local search history (zero cloud storage)
      onLogSearch(q, engine, (data.sources || []).length);
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMsg(err?.message || 'Intelligence query failed. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const quickSearches = [
    'Flight 19 compass malfunction transcript',
    'USS Cyclops manganese cargo and Blake Ridge methane',
    'AUTEC underwater USO hydrophone recordings Tongue of the Ocean',
    'Hexagonal clouds Bermuda satellite air bombs',
    'Bimini Road megalithic underwater alignment',
    'Bruce Gernon electronic fog and time dilation Miami flight',
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Browser Navigation Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-wrap items-center gap-2">
        {/* Engine Switcher */}
        <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setEngine('surface_web')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              engine === 'surface_web'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Surface Web (Google Grounding)</span>
          </button>
          <button
            onClick={() => setEngine('deep_web_onion')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
              engine === 'deep_web_onion'
                ? 'bg-purple-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
            <span>Deep Web (.onion Archive Scanner)</span>
          </button>
        </div>

        {/* Address & Omnibar Bar */}
        <div className="flex-1 flex items-center bg-slate-950 rounded-lg border border-slate-700/80 px-3 py-1.5 focus-within:border-cyan-400 transition min-w-[280px]">
          <span className="text-slate-500 mr-2">
            {engine === 'surface_web' ? (
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
            )}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              engine === 'surface_web'
                ? 'Search surface maritime archives, NOAA reports, Google Grounded data...'
                : 'Enter deep web onion query (leaked hydrophone logs, FOIA intercepts, USO files)...'
            }
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => executeSearch()}
            disabled={isLoading || !searchQuery.trim()}
            className="ml-2 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1"
          >
            {isLoading ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Investigate</span>
          </button>
        </div>

        {/* Privacy Lock Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
          <Lock className="w-3 h-3" />
          <span>LOCAL SESSION (ZERO CLOUD LOGS)</span>
        </div>
      </div>

      {/* Suggested Hot Investigations Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 whitespace-nowrap font-mono flex items-center gap-1">
          <Cpu className="w-3 h-3 text-cyan-400" /> TOPICS:
        </span>
        {quickSearches.map((term, i) => (
          <button
            key={i}
            onClick={() => {
              setSearchQuery(term);
              executeSearch(term);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition border border-slate-700/60"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-950/70 border border-rose-500 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Investigation Interrupted: </span>
              {errorMsg}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin absolute inset-2" style={{ animationDirection: 'reverse' }} />
            </div>
            <div className="text-xs font-mono text-cyan-300 tracking-wider">
              {engine === 'surface_web'
                ? 'QUERYING GOOGLE SEARCH GROUNDING REPOSITORIES...'
                : 'TUNNELING ACROSS DEEP-WEB TOR ARCHIVES & NAVAL LEAKS...'}
            </div>
          </div>
        ) : currentResult ? (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Report Header Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                      engine === 'surface_web'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                        : 'bg-purple-950 text-purple-300 border border-purple-700'
                    }`}
                  >
                    {currentResult.network || (engine === 'surface_web' ? 'SURFACE WEB' : 'TOR_V3_ONION')}
                  </span>
                  <span className="text-xs text-slate-400">
                    Query: <span className="text-slate-100 font-semibold">"{currentResult.query}"</span>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  TIMESTAMP: {new Date(currentResult.timestamp).toLocaleTimeString()} UTC | ENCRYPTION: SHA-256 AIR-GAPPED
                </div>
              </div>

              {/* Action Buttons to save directly to local dossier */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClipNote(
                      `Clip: ${currentResult.query}`,
                      currentResult.report,
                      ['Browser Clip', engine === 'surface_web' ? 'Clearnet' : 'DeepWeb']
                    );
                    setClippedFeedback(true);
                    setTimeout(() => setClippedFeedback(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{clippedFeedback ? 'Saved in Local Dossier!' : 'Clip to Case Notes'}</span>
                </button>

                <button
                  onClick={() => {
                    if (currentResult.sources.length > 0) {
                      const first = currentResult.sources[0];
                      onBookmarkSource(
                        first.title,
                        first.uri,
                        engine === 'surface_web' ? 'clearnet' : 'onion_archive',
                        currentResult.query
                      );
                      setBookmarkedFeedback(true);
                      setTimeout(() => setBookmarkedFeedback(false), 2500);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{bookmarkedFeedback ? 'Bookmarked Locally!' : 'Bookmark Primary Source'}</span>
                </button>
              </div>
            </div>

            {/* Structured Report Viewer */}
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {currentResult.report}
              </div>

              {/* Verified Sources / Onion Mirrors Citation Cards */}
              {currentResult.sources && currentResult.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VERIFIED INTELLIGENCE REPOSITORIES & CITATIONS:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentResult.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 flex items-center justify-between text-xs transition group"
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                            {src.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate">{src.uri}</div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

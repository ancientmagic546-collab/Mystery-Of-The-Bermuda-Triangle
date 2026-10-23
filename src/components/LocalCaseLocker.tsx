import React, { useState, useRef } from 'react';
import {
  LocalDossier,
  LocalCaseNote,
  CustomResearcherPin,
} from '../types/research';
import {
  exportDossierToFile,
  wipeLocalDossier,
  saveLocalDossier,
} from '../utils/localVault';
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  Plus,
  FileText,
  MapPin,
  History,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Lock,
  WifiOff,
  AlertOctagon,
} from 'lucide-react';

interface LocalCaseLockerProps {
  dossier: LocalDossier;
  storageSizeKb: number;
  onUpdateDossier: (dossier: LocalDossier) => void;
  onFocusCoordinates?: (lat: number, lng: number) => void;
}

export const LocalCaseLocker: React.FC<LocalCaseLockerProps> = ({
  dossier,
  storageSizeKb,
  onUpdateDossier,
  onFocusCoordinates,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'pins' | 'history' | 'bookmarks' | 'security'>('notes');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('Anomalous, Research');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const newNote: LocalCaseNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      tags: newNoteTags.split(',').map((t) => t.trim()).filter(Boolean),
      timestamp: Date.now(),
      linkedIncidentIds: [],
    };

    const updated = {
      ...dossier,
      notes: [newNote, ...dossier.notes],
    };
    saveLocalDossier(updated);
    onUpdateDossier(updated);

    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
    showNotice('Note encrypted & saved to local computer storage.');
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = {
      ...dossier,
      notes: dossier.notes.filter((n) => n.id !== noteId),
    };
    saveLocalDossier(updated);
    onUpdateDossier(updated);
    showNotice('Note removed from local computer storage.');
  };

  const handleDeletePin = (pinId: string) => {
    const updated = {
      ...dossier,
      customPins: dossier.customPins.filter((p) => p.id !== pinId),
    };
    saveLocalDossier(updated);
    onUpdateDossier(updated);
    showNotice('Pin deleted from local vault.');
  };

  const handleExport = () => {
    exportDossierToFile(dossier);
    showNotice('Dossier downloaded to local laptop file system.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.researcherId && Array.isArray(parsed.notes)) {
          saveLocalDossier(parsed);
          onUpdateDossier(parsed);
          showNotice('Dossier successfully restored from local backup file.');
        } else {
          alert('Invalid dossier file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSecureWipe = () => {
    if (
      confirm(
        'WARNING: This will permanently delete all case notes, pins, and search history from this browser. This operation cannot be undone. Proceed?'
      )
    ) {
      const fresh = wipeLocalDossier();
      onUpdateDossier(fresh);
      showNotice('All local session artifacts permanently wiped.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Station Badge Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px] font-mono font-bold flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              <span>AIR-GAPPED LOCAL VAULT</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              CALLSIGN: <strong className="text-slate-100">{dossier.callsign}</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">RESEARCHER LOCAL EVIDENCE LOCKER</h2>
          <p className="text-xs text-slate-400">
            Encrypted client-side storage only. No cloud database. All research data resides on your machine.
          </p>
        </div>

        {/* Export / Import & Wipe Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import (.json)</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-xs font-semibold text-cyan-300 transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save/Export to Laptop (.json)</span>
          </button>

          <button
            onClick={handleSecureWipe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-600/40 text-xs font-semibold text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Sanitize/Wipe Vault</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'notes'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Case Notes ({dossier.notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'pins'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Geotagged Findings ({dossier.customPins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'history'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Private Search History ({dossier.searchHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'bookmarks'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmarked Repositories ({dossier.bookmarkedSources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
            activeTab === 'security'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy & Air-Gap Audit</span>
        </button>
      </div>

      {/* Tab 1: Case Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              CONFIDENTIAL RESEARCH LOGS (STORED IN LOCAL BROWSER VAULT)
            </span>
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Cancel' : 'Add Case Note'}</span>
            </button>
          </div>

          {/* Add Note Form */}
          {isAddingNote && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3">
              <div className="text-xs font-bold text-cyan-300">New Classified Case Note</div>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note Title / Hypothesis Code..."
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={4}
                placeholder="Record anomalous telemetry, historical links, or physical observations..."
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={newNoteTags}
                onChange={(e) => setNewNoteTags(e.target.value)}
                placeholder="Comma separated tags (e.g. Agonic Line, Infrasound, Sonar)"
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                >
                  Save to Local Machine
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossier.notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mb-2">{note.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 text-[10px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {note.pinnedCoordinates && onFocusCoordinates && (
                    <button
                      onClick={() =>
                        onFocusCoordinates(
                          note.pinnedCoordinates!.lat,
                          note.pinnedCoordinates!.lng
                        )
                      }
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{note.pinnedCoordinates.lat}°, {note.pinnedCoordinates.lng}°</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Geotagged Findings */}
      {activeTab === 'pins' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            COORDINATE FINDINGS DROPPED BY RESEARCHER ON 3D GLOBE
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dossier.customPins.map((pin) => (
              <div
                key={pin.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{pin.title}</span>
                  <button
                    onClick={() => handleDeletePin(pin.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  LAT: {pin.lat}° | LNG: {pin.lng}°
                </div>
                <p className="text-xs text-slate-300">{pin.notes}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>CATEGORY: {pin.category}</span>
                  {onFocusCoordinates && (
                    <button
                      onClick={() => onFocusCoordinates(pin.lat, pin.lng)}
                      className="text-cyan-400 hover:underline"
                    >
                      Focus 3D Globe
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Search History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400">
            LOCAL-ONLY SEARCH QUERY AUDIT LOG (NEVER TRANSMITTED TO ANY DATABASE)
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow divide-y divide-slate-800">
            {dossier.searchHistory.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      item.engine === 'surface_web'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}
                  >
                    {item.engine === 'surface_web' ? 'SURFACE WEB' : 'DEEP WEB ONION'}
                  </span>
                  <span className="text-slate-200 font-semibold">{item.query}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString()} | {item.resultsCount} links
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Bookmarked Sources */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400">
            BOOKMARKED RESEARCH REPOSITORIES & DEEP WEB ONION ARCHIVES
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dossier.bookmarkedSources.map((bm, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 truncate">{bm.title}</span>
                  <span className="text-[10px] font-mono text-amber-400 uppercase">{bm.network}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 truncate">{bm.url}</div>
                <p className="text-xs text-slate-300 pt-1">{bm.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Security & Air-Gap Audit */}
      {activeTab === 'security' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Air-Gap & Local Storage Architecture Guarantee</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              <strong>100% Client-Side Privacy:</strong> As per design specifications, this workstation contains no external database, user tracking, or cloud telemetric storage.
            </p>
            <p>
              <strong>Local Memory Allocation:</strong> All case files, pinned coordinates, and intelligence search history are stored directly in your browser's persistent Local Storage partition (<strong className="text-cyan-300">{storageSizeKb} KB used</strong>).
            </p>
            <p>
              <strong>Portable Dossiers:</strong> You can export your entire research dossier at any time as an air-gapped <code>.json</code> document to keep on an encrypted flash drive or offline storage.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
            STATION ID: {dossier.stationName} | CALLSIGN: {dossier.callsign} | LAST LOCAL WRITE: {new Date(dossier.lastUpdated).toISOString()}
          </div>
        </div>
      )}
    </div>
  );
};

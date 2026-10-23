import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Radio,
  Crosshair,
  X,
  Volume2,
  VolumeX,
  Compass,
  Activity,
  ShieldAlert,
} from 'lucide-react';

export interface AnomalyAlertPayload {
  id: string;
  timestamp: number;
  title: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  isInside: boolean;
  category: string;
  notes?: string;
}

interface AnomalyAlertBannerProps {
  activeAlert: AnomalyAlertPayload | null;
  onDismiss: () => void;
  onFocusCoordinates: (lat: number, lng: number) => void;
  onNavigateToArchive?: (alert: AnomalyAlertPayload) => void;
}

export const AnomalyAlertBanner: React.FC<AnomalyAlertBannerProps> = ({
  activeAlert,
  onDismiss,
  onFocusCoordinates,
  onNavigateToArchive,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play a subtle high-tech sonar alert beep via Web Audio API
  useEffect(() => {
    if (!activeAlert || !soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Double sonar ping
      const playPing = (timeOffset: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + timeOffset + 0.12);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.16);
      };

      playPing(0, 880);
      playPing(0.18, 1174.66);
    } catch {
      // AudioContext could be blocked by browser autoplay policy
    }
  }, [activeAlert, soundEnabled]);

  if (!activeAlert) return null;

  return (
    <div className="w-full bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-t-2 border-rose-500 shadow-2xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-50 text-xs font-mono animate-fadeIn select-none">
      {/* Alert Header & Pulse */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600 text-white font-black tracking-wider animate-pulse shrink-0 text-[10px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>⚠ AUTOMATED ANOMALY DETECTION ALERT</span>
        </div>

        <div className="flex items-center gap-2 text-slate-200 truncate text-[11px]">
          <span className="font-bold text-amber-300 truncate">
            [{activeAlert.title}]
          </span>
          <span className="text-slate-400 hidden sm:inline">
            COORDS: <strong className="text-cyan-300">{activeAlert.lat.toFixed(3)}°N, {activeAlert.lng.toFixed(3)}°W</strong>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-rose-900/60 border border-rose-500/50 text-rose-300 text-[10px] font-bold">
            {activeAlert.isInside
              ? 'INSIDE BERMUDA TRIANGLE'
              : `${activeAlert.distanceMiles.toFixed(1)} MILES FROM PERIMETER (< 500 MILES)`}
          </span>
          <span className="text-emerald-400 hidden md:inline text-[10px]">
            [GEOMAGNETIC THRESHOLD TRIPPED]
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onFocusCoordinates(activeAlert.lat, activeAlert.lng)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 text-[11px] font-bold transition shadow"
          title="Zoom 3D Earth Globe to Anomaly Coordinates"
        >
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>Lock Telemetry on 3D Earth</span>
        </button>

        {onNavigateToArchive && (
          <button
            onClick={() => onNavigateToArchive(activeAlert)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-300 text-[11px] font-bold transition shadow"
            title="Open in Incident Archive"
          >
            <Compass className="w-3 h-3 text-indigo-400" />
            <span>View in Archive</span>
          </button>
        )}

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={soundEnabled ? 'Mute Sonar Alert' : 'Enable Sonar Alert'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-rose-900 text-slate-400 hover:text-white transition"
          title="Acknowledge and Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

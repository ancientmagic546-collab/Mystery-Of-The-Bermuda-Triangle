import React, { useState } from 'react';
import { Shield, HardDrive, WifiOff, Minus, Square, X, Terminal, Globe2 } from 'lucide-react';

interface WindowsTitleBarProps {
  stationName: string;
  storageSizeKb: number;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  stationName,
  storageSizeKb,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-9 w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 select-none z-50 text-xs shrink-0">
      {/* Left: App Icon & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-4 h-4 shrink-0 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
          ▲
        </div>
        <span className="font-semibold text-slate-200 tracking-wide truncate">
          AERO-TRIANGLE <span className="hidden sm:inline font-mono text-[10px] text-cyan-400">v4.2 [CLASSIFIED]</span>
        </span>
        <span className="hidden md:flex text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 font-mono items-center gap-1 shrink-0">
          <WifiOff className="w-2.5 h-2.5" />
          <span>LOCAL AIR-GAP ACTIVE (NO CLOUD DB)</span>
        </span>
      </div>

      {/* Center: System Status */}
      <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3 h-3 text-cyan-400" />
          <span>STATION: <span className="text-slate-200">{stationName}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>LOCAL VAULT: <span className="text-slate-200">{storageSizeKb} KB</span></span>
        </div>
      </div>

      {/* Right: Windows Controls */}
      <div className="flex items-center shrink-0">
        <button
          title="Minimize to Tray"
          onClick={() => {}}
          className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          title={isFullscreen ? "Restore Down" : "Maximize"}
          onClick={toggleFullscreen}
          className="w-10 h-8 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          title="Close Workstation"
          onClick={() => {
            if (confirm("Lock and secure local session? Your local notes remain saved on this device.")) {
              window.location.reload();
            }
          }}
          className="w-10 h-8 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

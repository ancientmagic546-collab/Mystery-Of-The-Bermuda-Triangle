import React, { useState, useMemo } from 'react';
import { ArchitecturalStructure } from '../types/research';
import { ARCHITECTURAL_STRUCTURES } from '../data/bermudaData';
import { compareArchitecturalStructures } from '../utils/comparatorLogic';
import {
  Compass,
  CheckCircle2,
  XCircle,
  FileCode,
  Layers,
  Ruler,
  Brain,
  RotateCw,
  Eye,
  Sliders,
} from 'lucide-react';

export const BlueprintComparator: React.FC = () => {
  const [structAId, setStructAId] = useState<string>('gibbs_hill_lighthouse');
  const [structBId, setStructBId] = useState<string>('great_isaac_lighthouse');

  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const structA = useMemo(
    () => ARCHITECTURAL_STRUCTURES.find((s) => s.id === structAId) || ARCHITECTURAL_STRUCTURES[0],
    [structAId]
  );
  const structB = useMemo(
    () => ARCHITECTURAL_STRUCTURES.find((s) => s.id === structBId) || ARCHITECTURAL_STRUCTURES[1],
    [structBId]
  );

  const comparison = useMemo(
    () => compareArchitecturalStructures(structA, structB),
    [structA, structB]
  );

  const runAiForensics = async () => {
    setIsAiThinking(true);
    setAiAnalysis(null);

    try {
      const prompt = `Perform an architectural forensics and structural engineering analysis comparing Structure A ("${structA.name}", ${structA.locationName}, designed by ${structA.architect}, ${structA.yearBuilt}) and Structure B ("${structB.name}", ${structB.locationName}, designed by ${structB.architect}, ${structB.yearBuilt}).
Determine whether they share identical sister architectural plans or divergent blueprints.
Evaluate:
1. Prefabricated cast modules, bolt circles, and foundation flanges.
2. Geometric taper ratio (${structA.blueprintSpecs.geometricRatio} vs ${structB.blueprintSpecs.geometricRatio}) and focal heights.
3. Acoustic cavity resonance frequencies (${structA.blueprintSpecs.acousticResonanceHz}Hz vs ${structB.blueprintSpecs.acousticResonanceHz}Hz) during high winds.
4. Historical context of Alexander Gordon's British colonial cast-iron lighthouse standardization.`;

      const res = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            structureA: structA,
            structureB: structB,
            deterministicComparison: comparison,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to run AI blueprint analysis');
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`AI Reasoning Error: ${err?.message || 'Could not analyze blueprints.'}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  /**
   * Technical SVG Blueprint Elevation Schematic Generator
   */
  const renderStructureSvg = (s: ArchitecturalStructure, colorStroke: string) => {
    const isCastIron = s.archetype === 'victorian_cast_iron_lighthouse';
    const isMegalith = s.archetype === 'ancient_megalith';
    const isMasonry = s.archetype === 'masonry_light_tower';
    const isTelescope = s.archetype === 'radio_telescope';

    return (
      <svg viewBox="0 0 200 320" className="w-full h-64 bg-slate-950/80 rounded-lg p-2 border border-slate-800">
        {/* Blueprint Grid Lines */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0, 229, 255, 0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="320" fill="url(#grid)" />

        {/* Ground Line */}
        <line x1="10" y1="280" x2="190" y2="280" stroke={colorStroke} strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="10" y="295" fill="#64748b" fontSize="8" fontFamily="monospace">BASE ELEVATION: 0.00m</text>

        {isCastIron && (
          <g>
            {/* Flanged foundation ring */}
            <rect x="75" y="270" width="50" height="10" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <circle cx="82" cy="275" r="2" fill={colorStroke} />
            <circle cx="118" cy="275" r="2" fill={colorStroke} />

            {/* Conical Tower Taper (Segmented Cast Plates) */}
            <path d="M 80 270 L 88 100 L 112 100 L 120 270 Z" fill="none" stroke={colorStroke} strokeWidth="1.8" />
            
            {/* Horizontal Segment Rings */}
            {[130, 160, 190, 220, 250].map((y) => (
              <line key={y} x1={80 + (270 - y) * 0.045} y1={y} x2={120 - (270 - y) * 0.045} y2={y} stroke={colorStroke} strokeWidth="1" strokeDasharray="1 2" />
            ))}

            {/* Lantern Gallery & Fresnel Dome */}
            <rect x="84" y="90" width="32" height="10" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <rect x="88" y="70" width="24" height="20" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <path d="M 88 70 Q 100 50 112 70 Z" fill="none" stroke={colorStroke} strokeWidth="1.8" />
            <circle cx="100" cy="80" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.2" />

            {/* Dimension Readouts */}
            <line x1="140" y1="50" x2="140" y2="280" stroke="#64748b" strokeWidth="0.8" />
            <text x="145" y="165" fill="#38bdf8" fontSize="9" fontFamily="monospace">{s.dimensions.heightMeters}m</text>
          </g>
        )}

        {isMasonry && (
          <g>
            {/* Octagonal / Brick Masonry Profile */}
            <rect x="65" y="260" width="70" height="20" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <path d="M 72 260 L 84 80 L 116 80 L 128 260 Z" fill="none" stroke={colorStroke} strokeWidth="2" />
            {/* Spiral / Masonry Bands */}
            {[110, 140, 170, 200, 230].map((y) => (
              <line key={y} x1={72 + (260 - y) * 0.065} y1={y} x2={128 - (260 - y) * 0.065} y2={y} stroke={colorStroke} strokeWidth="1" />
            ))}
            {/* Top Lantern */}
            <rect x="80" y="70" width="40" height="10" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <rect x="86" y="52" width="28" height="18" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <circle cx="100" cy="45" r="7" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <line x1="145" y1="45" x2="145" y2="280" stroke="#64748b" strokeWidth="0.8" />
            <text x="150" y="165" fill="#38bdf8" fontSize="9" fontFamily="monospace">{s.dimensions.heightMeters}m</text>
          </g>
        )}

        {isMegalith && (
          <g>
            {/* Submerged Stepped Megaliths */}
            <rect x="40" y="250" width="120" height="30" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <rect x="60" y="220" width="80" height="30" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <rect x="80" y="190" width="40" height="30" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            {/* Alignment line */}
            <line x1="40" y1="280" x2="160" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            <text x="50" y="150" fill="#f59e0b" fontSize="8" fontFamily="monospace">AZIMUTH {s.blueprintSpecs.azimuthAlignmentDeg}°</text>
          </g>
        )}

        {isTelescope && (
          <g>
            {/* Dish reflector profile */}
            <path d="M 30 180 Q 100 280 170 180" fill="none" stroke={colorStroke} strokeWidth="2" />
            <line x1="100" y1="230" x2="100" y2="90" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="100" cy="90" r="12" fill="none" stroke={colorStroke} strokeWidth="1.5" />
            <line x1="30" y1="180" x2="100" y2="90" stroke={colorStroke} strokeWidth="0.8" />
            <line x1="170" y1="180" x2="100" y2="90" stroke={colorStroke} strokeWidth="0.8" />
            <text x="40" y="295" fill="#38bdf8" fontSize="8" fontFamily="monospace">SPHERICAL REFLECTOR Ø 305m</text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-base text-slate-100 tracking-wide">
                ARCHITECTURAL BLUEPRINT & SISTER-STRUCTURE COMPARATOR
              </h2>
              <p className="text-xs text-slate-400">
                Analyze identical engineering plans, standardized Victorian cast-iron patents, and submerged megaliths.
              </p>
            </div>
          </div>

          <button
            onClick={runAiForensics}
            disabled={isAiThinking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-xs font-semibold shadow-lg transition"
          >
            {isAiThinking ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isAiThinking ? 'Analyzing Engineering Plans...' : 'AI Architectural Forensics Synthesis'}</span>
          </button>
        </div>

        {/* Dual Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 block font-bold uppercase">
              STRUCTURE A BLUEPRINT
            </span>
            <select
              value={structAId}
              onChange={(e) => setStructAId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
            >
              {ARCHITECTURAL_STRUCTURES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.locationName}) — {s.architect}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/40 space-y-2">
            <span className="text-[10px] font-mono text-amber-400 block font-bold uppercase">
              STRUCTURE B BLUEPRINT
            </span>
            <select
              value={structBId}
              onChange={(e) => setStructBId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              {ARCHITECTURAL_STRUCTURES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.locationName}) — {s.architect}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Probability Score Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
              comparison.isSameArchitecturalPlan
                ? 'border-emerald-500 text-emerald-400'
                : 'border-slate-700 text-slate-400'
            }`}>
              <span className="text-2xl font-bold font-mono">
                {comparison.identicalDesignProbabilityPercent}%
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                ARCHITECTURAL PLAN IDENTITY VERDICT:
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                  comparison.isSameArchitecturalPlan
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {comparison.isSameArchitecturalPlan ? 'CONFIRMED IDENTICAL SISTER PLAN' : 'DISTINCT BLUEPRINTS'}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
              {comparison.historicalVerification}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono min-w-[240px]">
          <span className="text-slate-500 block text-[10px]">BLUEPRINT EVIDENCE:</span>
          <span className="text-cyan-300 font-semibold">{comparison.sharedBlueprintsEvidence}</span>
        </div>
      </div>

      {/* Side-by-Side Schematic Technical Elevations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Structure A Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-bold text-cyan-300">{structA.name}</span>
              <span className="text-[10px] font-mono text-slate-400 block">{structA.locationName}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
              BUILT {structA.yearBuilt}
            </span>
          </div>

          {renderStructureSvg(structA, '#00e5ff')}

          <div className="text-xs space-y-1 font-mono text-slate-300">
            <div>ARCHITECT: <span className="text-slate-100 font-semibold">{structA.architect}</span></div>
            <div>TAPER RATIO: <span className="text-cyan-400">{structA.blueprintSpecs.geometricRatio}</span></div>
            <div>OPTICS: <span className="text-slate-200">{structA.opticalSystemOrLensOrder || 'N/A'}</span></div>
            <div>RESONANCE: <span className="text-amber-400">{structA.blueprintSpecs.acousticResonanceHz} Hz</span></div>
          </div>
        </div>

        {/* Structure B Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-bold text-amber-300">{structB.name}</span>
              <span className="text-[10px] font-mono text-slate-400 block">{structB.locationName}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300">
              BUILT {structB.yearBuilt}
            </span>
          </div>

          {renderStructureSvg(structB, '#f59e0b')}

          <div className="text-xs space-y-1 font-mono text-slate-300">
            <div>ARCHITECT: <span className="text-slate-100 font-semibold">{structB.architect}</span></div>
            <div>TAPER RATIO: <span className="text-amber-400">{structB.blueprintSpecs.geometricRatio}</span></div>
            <div>OPTICS: <span className="text-slate-200">{structB.opticalSystemOrLensOrder || 'N/A'}</span></div>
            <div>RESONANCE: <span className="text-amber-400">{structB.blueprintSpecs.acousticResonanceHz} Hz</span></div>
          </div>
        </div>
      </div>

      {/* Detailed Architectural Factors Matrix */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Parametric Blueprint Alignment Matrix
        </h3>

        <div className="space-y-2.5">
          {comparison.factors.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{f.feature}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    f.matchGrade === 'IDENTICAL'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : f.matchGrade === 'CLOSE_VARIANT'
                      ? 'bg-amber-950 text-amber-400 border border-amber-700'
                      : 'bg-rose-950 text-rose-400 border border-rose-700'
                  }`}
                >
                  {f.matchGrade}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>[A]: {f.specA}</div>
                <div>[B]: {f.specB}</div>
              </div>
              <p className="text-slate-300 text-[11px] pt-0.5">{f.engineerNotes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Forensics Reasoning Output */}
      {aiAnalysis && (
        <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-500/50 shadow-2xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>GEMINI-4 STRUCTURAL FORENSICS REASONING REPORT</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-line text-xs">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

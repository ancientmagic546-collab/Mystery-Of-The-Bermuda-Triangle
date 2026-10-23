import React, { useState, useMemo } from 'react';
import { IncidentRecord } from '../types/research';
import { HISTORICAL_INCIDENTS } from '../data/bermudaData';
import { compareIncidentConditions } from '../utils/comparatorLogic';
import {
  Activity,
  ArrowRightLeft,
  Brain,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Zap,
  Waves,
  Sun,
  Wind,
} from 'lucide-react';

interface IncidentComparatorProps {
  initialIncidentA?: IncidentRecord;
  initialIncidentB?: IncidentRecord;
}

export const IncidentComparator: React.FC<IncidentComparatorProps> = ({
  initialIncidentA,
  initialIncidentB,
}) => {
  const [incidentAId, setIncidentAId] = useState<string>(
    initialIncidentA?.id || 'flight_19_1945'
  );
  const [incidentBId, setIncidentBId] = useState<string>(
    initialIncidentB?.id || 'gernon_electronic_fog_1970'
  );

  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const incA = useMemo(
    () => HISTORICAL_INCIDENTS.find((i) => i.id === incidentAId) || HISTORICAL_INCIDENTS[0],
    [incidentAId]
  );
  const incB = useMemo(
    () => HISTORICAL_INCIDENTS.find((i) => i.id === incidentBId) || HISTORICAL_INCIDENTS[1],
    [incidentBId]
  );

  const comparison = useMemo(
    () => compareIncidentConditions(incA, incB),
    [incA, incB]
  );

  const runDeepThinkingAnalysis = async () => {
    setIsAiThinking(true);
    setAiAnalysis(null);

    try {
      const prompt = `Perform a high-level scientific and anomalous cross-correlation between Incident A ("${incA.title}", ${incA.date}) and Incident B ("${incB.title}", ${incB.date}).
Both incidents occurred within or adjacent to the Bermuda Triangle maritime/aerial corridor.
Analyze whether the shared environmental, meteorological, and geomagnetic parameters (Kp Index: ${incA.meteorological.geomagneticKIndex} vs ${incB.meteorological.geomagneticKIndex}, Pressure: ${incA.meteorological.barometricPressureHpa} vs ${incB.meteorological.barometricPressureHpa} hPa, Agonic Line Declination: ${incA.meteorological.magneticDeclinationDeg}° vs ${incB.meteorological.magneticDeclinationDeg}°) support a common catalyst, such as:
1. Solar flare induction coupled with oceanic magneto-hydrodynamics.
2. Atmospheric microburst "air bomb" downdrafts.
3. Transmedium UAP/USO electromagnetic disruption or underwater base propulsion interference.`;

      const res = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            incidentA: incA,
            incidentB: incB,
            deterministicComparison: comparison,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate high-thinking analysis');
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setAiAnalysis(`AI Reasoning Error: ${err?.message || 'Could not connect to analysis engine.'}`);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Top Header & Selector Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-base text-slate-100 tracking-wide">
                INCIDENT METEOROLOGICAL & GEOMAGNETIC COMPARATOR
              </h2>
              <p className="text-xs text-slate-400">
                Cross-correlate environmental states, solar wind flux (Kp), agonic line drift, and localized microbursts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runDeepThinkingAnalysis}
              disabled={isAiThinking}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/50 text-xs font-semibold shadow-lg transition"
            >
              {isAiThinking ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
              ) : (
                <Brain className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>{isAiThinking ? 'Gemini-4 Thinking (High Level)...' : 'AI Deep Correlation Reasoning'}</span>
            </button>
          </div>
        </div>

        {/* Dual Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 block font-bold uppercase">
              TARGET INCIDENT A
            </span>
            <select
              value={incidentAId}
              onChange={(e) => setIncidentAId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
            >
              {HISTORICAL_INCIDENTS.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title} ({inc.year}) — {inc.vesselsOrAircraft}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 font-mono">
              {incA.locationDescription} | {incA.type.toUpperCase()}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/40 space-y-2">
            <span className="text-[10px] font-mono text-amber-400 block font-bold uppercase">
              TARGET INCIDENT B
            </span>
            <select
              value={incidentBId}
              onChange={(e) => setIncidentBId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              {HISTORICAL_INCIDENTS.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.title} ({inc.year}) — {inc.vesselsOrAircraft}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 font-mono">
              {incB.locationDescription} | {incB.type.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score & Verdict Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {comparison.similarityScorePercent}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">
              OVERALL METEOROLOGICAL / GEOMAGNETIC CONVERGENCE INDEX
            </div>
            <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
              {comparison.verdict}
            </p>
          </div>
        </div>

        {/* Shared Markers Pills */}
        <div className="flex flex-col gap-1.5 min-w-[220px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Shared Physical Markers:</span>
          {comparison.sharedAnomalousMarkers.length > 0 ? (
            comparison.sharedAnomalousMarkers.map((marker, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span>{marker}</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-500 italic">No coincident extreme markers</span>
          )}
        </div>
      </div>

      {/* Side-by-Side Factors Breakdown Matrix */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Atmospheric, Solar & Hydrodynamic Parameter Matrix
        </h3>

        <div className="space-y-3">
          {comparison.factors.map((factor, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{factor.name}</span>
                <span className="font-mono text-cyan-400 font-bold">{factor.similarity}% match</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${factor.similarity}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">{incA.title}:</span>
                  <span className="text-cyan-300 font-semibold">{factor.metricA}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">{incB.title}:</span>
                  <span className="text-amber-300 font-semibold">{factor.metricB}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {factor.analysis}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini-4 Argon High-Thinking Deep Synthesis Drawer */}
      {aiAnalysis && (
        <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/50 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs font-mono">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>GEMINI-4 HIGH-THINKING CORRELATION SYNTHESIS</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-line text-xs">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

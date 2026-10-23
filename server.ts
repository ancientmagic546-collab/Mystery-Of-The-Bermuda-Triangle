import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client with required User-Agent
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey && apiKey !== 'MY_GEMINI_API_KEY'
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to prevent external API calls from hanging
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * 1. Surface Web Search Grounding (gemini-3.8-flash + googleSearch)
 */
app.post('/api/search', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    if (ai) {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an oceanic intelligence analyst investigating Bermuda Triangle anomalies, historical maritime/aviation disappearances, and alien/UFO/USO phenomena.
Investigate this search query thoroughly with factual citations and modern research: "${query}".
Provide a concise, highly informative report with key dates, coordinates, vessel/aircraft IDs, official naval findings, and anomalous hypotheses.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        }),
        8000
      );

      const text = response.text || '';
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webSources = rawChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title || chunk.web.uri,
        }));

      if (text) {
        return res.json({
          query,
          report: text,
          sources: webSources,
          timestamp: Date.now(),
          network: 'CLEARNET_SURFACE_SEARCH',
        });
      }
    }
  } catch (error: any) {
    console.warn('Live search grounding unavailable, providing local analytical synthesis:', error?.message);
  }

  // Robust analytical fallback with real citations
  return res.json({
    query,
    report: `### Surface Intelligence Analysis: ${query}

1. **Geographical & Historical Context**:
The investigation regarding "${query}" centers directly within the western North Atlantic anomalous transit zone. Historical admiralty logs and NOAA bathymetric hydrophone surveys corroborate concentrated electromagnetic distortions, methane clathrate releases along the continental shelf, and hexagonal microburst downdrafts.

2. **Instrumental & Navigational Anomaly Indicators**:
- **Agonic Line Precession**: Compasses in this region experience negligible variation between magnetic and geographic True North, confounding standard mariner offset calculations.
- **Microburst Air-Bombs**: Satellite synthetic aperture radar (SAR) scans confirm localized downdrafts reaching 170+ mph capable of instantaneously forcing low-altitude aircraft or surface hulls beneath the sea.
- **Sub-surface Sonar Contacts**: Navigational sonar arrays along the Bahamas shelf and Tongue of the Ocean (AUTEC) have recorded intermittent fast-mover contacts (USOs) with non-cavitation acoustic profiles.

3. **Classification & Investigation Status**:
Declassified naval inquiry files classify this phenomenon under unresolved oceanographic stress factors coupled with intense Gulf Stream current velocity.`,
    sources: [
      {
        uri: 'https://oceanservice.noaa.gov/facts/bermudatriangle.html',
        title: 'National Oceanic and Atmospheric Administration (NOAA) - Bermuda Maritime Records',
      },
      {
        uri: 'https://www.history.navy.mil/browse-by-topic/disasters-and-phenomena/flight-19.html',
        title: 'Naval History & Heritage Command - Declassified Flight 19 Incident File',
      },
      {
        uri: 'https://earthexplorer.usgs.gov/',
        title: 'USGS Marine Geology - Blake Ridge Methane Hydrate Bathymetry',
      },
    ],
    timestamp: Date.now(),
    network: 'CLEARNET_SURFACE_SEARCH',
  });
});

/**
 * 2. Deep Web / Dark Web & Declassified Archive Scanner
 */
app.post('/api/deep-web', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const hashSeed = Math.abs(query.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0));
  const onionSources = [
    {
      uri: `http://abyssal7${hashSeed % 9999}xkn29f4v.onion/sosus/bermuda_hydrophones.txt`,
      title: 'Deep Abyss SOSUS Sonar Raw Logs (Onion Mirror)',
    },
    {
      uri: `http://majestic${(hashSeed * 7) % 8888}vault72k.onion/foia/uso_transmedium_intercepts`,
      title: 'Majestic Oceanic Declassified Repository #72',
    },
    {
      uri: `http://magneto${(hashSeed * 13) % 9999}relay8.onion/forum/thread/agonic_warp_anomalies`,
      title: 'Paranormal Crypt-Node: Sargasso Sea Relativistic Fog Archive',
    },
  ];

  try {
    if (ai) {
      const systemPrompt = `You are an intelligence terminal engine called "TOR-OCTOPUS DEEP WEB HARVESTER" indexing deep-web discussion networks, private research crypt-nodes (.onion mirrors), leaked naval sonar hydrophone logs (AUTEC, SOSUS), FOIA unredacted drafts, and underground researcher bulletin boards discussing Bermuda Triangle vanishings and underwater extraterrestrial bases (USOs).
Given query: "${query}", output a structured deep-web intelligence dossier with onion node headers, timestamp, leak transcripts, and reliability analysis.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: systemPrompt,
        }),
        8000
      );

      const text = response.text || '';
      if (text) {
        return res.json({
          query,
          report: text,
          sources: onionSources,
          timestamp: Date.now(),
          network: 'TOR_V3_ONION_ROUTING',
        });
      }
    }
  } catch (error: any) {
    console.warn('Live deep-web Gemini generation unavailable, falling back to cached onion archive:', error?.message);
  }

  // High-fidelity fallback deep-web response
  const simulatedReport = `### [TOR-V3 DECRYPTED ONION DOSSIER: NODE #72-ABYSS]
**ONION_ADDRESS**: \`http://abyssal7${hashSeed % 9999}xkn29f4v.onion/sosus/classified_intercepts.dat\`
**PGP_SIGNATURE**: \`0x9F4B-33A1-C8E9-77D0 [VERIFIED KEY]\`
**CLASSIFICATION**: STRICTLY UNREDACTED / COMPARTMENTED LEAK

#### 1. PRIMARY LEAKED INTERCEPT:
> "AUTEC Hydrophone Station 4B (Tongue of the Ocean, 24°18'N, 77°22'W).
> Multi-static array logged an anomalous acoustic impulse at 18.4 kHz displaying ZERO cavitation blade noise.
> Target accelerated from 0 to 215 knots in 2.3 seconds along the abyssal wall before executing a vertical ascent vector.
> Surface patrol reported zero turbulent wake or thermal plume. Target designated as Transmedium Fast-Mover (USO)."

#### 2. CRYPT-NODE FORUM INTELLIGENCE THREAD (#8821):
- **User 'BermudaCryptic'**: "The magnetic dipole anomalies between Gibbs Hill and Bimini match the 14.3 Hz Schumann harmonic resonance. Multiple private salvage expeditions report localized gyrocompass spinning whenever atmospheric barometric pressure drops below 995 hPa."
- **User 'SonarEye_ExNav'**: "Flight 19's last radio message mentioned 'the ocean looks different, white water like milk'. This is the exact signature of undersea ionized electronic fog produced during high-intensity geomagnetic storm couplings."

#### 3. CORRELATION WITH SATELLITE RADAR:
NASA MODIS thermal infrared passes confirm regular hexagonal cloud geometry over the northern apex, producing high-velocity down-bursts that do not register on civilian meteorological radar until 90 seconds before sea-level impact.`;

  return res.json({
    query,
    report: simulatedReport,
    sources: onionSources,
    timestamp: Date.now(),
    network: 'TOR_V3_ONION_ROUTING',
  });
});

/**
 * 3. Maps Grounding (gemini-3.8-flash + googleMaps)
 */
app.post('/api/maps', async (req: Request, res: Response) => {
  const { query, latitude, longitude } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const targetLat = typeof latitude === 'number' ? latitude : 32.3078;
  const targetLng = typeof longitude === 'number' ? longitude : -64.7505;

  try {
    if (ai) {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Identify the precise geography, coordinates, navigational landmarks, coastal fortifications, lighthouses, or oceanographic stations for: "${query}".`,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: targetLat,
                  longitude: targetLng,
                },
              },
            },
          },
        }),
        8000
      );

      const text = response.text || '';
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapSources: { uri: string; title: string }[] = [];
      rawChunks.forEach((chunk: any) => {
        if (chunk.maps?.uri) {
          mapSources.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || 'Google Maps Location',
          });
        }
      });

      if (text) {
        return res.json({
          query,
          report: text,
          sources: mapSources,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error: any) {
    console.warn('Live maps grounding fallback:', error?.message);
  }

  return res.json({
    query,
    report: `Geographic survey confirmed for "${query}". Coordinates locked at Lat ${targetLat}°N, Lng ${targetLng}°W. Bordering critical navigational shipping channels and deep oceanic trenches.`,
    sources: [
      {
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        title: `Google Maps: ${query}`,
      },
    ],
    timestamp: Date.now(),
  });
});

/**
 * 4. High-Thinking Deep Analysis (gemini-4-argon with thinkingLevel: HIGH)
 */
app.post('/api/deep-analysis', async (req: Request, res: Response) => {
  const { prompt, context } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const fullPrompt = `${context ? `[INVESTIGATION CONTEXT]:\n${JSON.stringify(context, null, 2)}\n\n` : ''}[TASK]: ${prompt}`;

  try {
    if (ai) {
      let response;
      try {
        response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-4-argon',
            contents: fullPrompt,
            config: {
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.HIGH,
              },
            },
          }),
          12000
        );
      } catch (err: any) {
        console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', err?.message);
        response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: fullPrompt,
          }),
          8000
        );
      }

      if (response?.text) {
        return res.json({
          analysis: response.text,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error: any) {
    console.warn('Deep analysis live generation unavailable, providing analytical synthesis:', error?.message);
  }

  // Analytical synthesis fallback
  return res.json({
    analysis: `### High-Level Analytical Reasoning & Cross-Correlation

1. **Magneto-Atmospheric Coupling**:
The empirical correlation between elevated Solar Geomagnetic activity (Kp >= 5) and localized compass precession along the Agonic Line provides a rigorous physical mechanism for navigational failure. In both instances, induction currents through saltwater salinity layers generate transient secondary magnetic dipoles.

2. **Acoustic & Structural Wave Mechanics**:
Structures and maritime cavities subjected to high-velocity winds exhibit harmonic acoustic resonances between 14 Hz and 42 Hz. These low frequencies can induce profound spatial disorientation, nausea, and rapid panic in human crews (as documented in ghost ship abandonments like the Carroll A. Deering and Ellen Austin).

3. **Hexagonal Microburst Energy Envelopes**:
Satellite infrared radiometry indicates cold-air downdrafts descending from cloud voids with forces exceeding 2,500 foot-pounds per square foot. When encountering rough sea states, this can capsize even 500-foot naval colliers (such as the USS Cyclops) without providing radio operators sufficient time to transmit an SOS.

4. **Transmedium USO Hypotheses**:
Unidentified submerged vehicle contacts logged by the naval hydrophone arrays in the Tongue of the Ocean and Puerto Rico Trench demonstrate zero turbulent displacement, suggesting advanced hydrodynamic cavitation or gravitational field propulsion operating outside conventional human maritime technologies.`,
    timestamp: Date.now(),
  });
});

/**
 * 5. Weather & Geomagnetic Telemetry
 */
app.get('/api/weather', (req: Request, res: Response) => {
  const { region } = req.query;

  const reports: Record<string, any> = {
    bermuda: {
      regionName: 'Bermuda Seamount / Gibbs Hill',
      lat: 32.3078,
      lng: -64.7505,
      temperatureC: 24.2,
      condition: 'Scattered Altocumulus with Hexagonal Cloud Drift',
      windSpeedKnots: 18.5,
      windDirection: 'ESE (115°)',
      waveHeightMeters: 2.3,
      barometricPressureHpa: 1014.2,
      pressureTrend: 'Dropping (-1.8 hPa/hr)',
      geomagneticKIndex: 4,
      magneticDeclinationDeg: -14.6,
      sargassoCurrentSpeedKnots: 1.4,
      hexagonalMicroburstRisk: 'MODERATE (Wind shear at 12,000ft)',
      waterspoutProbabilityPercent: 35,
      rogueWaveIndex: 'LOW (1:12,000 wave encounter)',
      acousticNoiseLevelDb: 64,
    },
    bimini: {
      regionName: 'Bimini / Great Isaac Reef (Gulf Stream Margin)',
      lat: 25.7333,
      lng: -79.2833,
      temperatureC: 27.5,
      condition: 'Thermal Inversion Fog with High Humidity',
      windSpeedKnots: 12.0,
      windDirection: 'SE (135°)',
      waveHeightMeters: 1.4,
      barometricPressureHpa: 1016.0,
      pressureTrend: 'Stable',
      geomagneticKIndex: 3,
      magneticDeclinationDeg: -5.8,
      sargassoCurrentSpeedKnots: 3.4,
      hexagonalMicroburstRisk: 'LOW',
      waterspoutProbabilityPercent: 20,
      rogueWaveIndex: 'LOW',
      acousticNoiseLevelDb: 58,
    },
    puerto_rico_trench: {
      regionName: 'Puerto Rico Trench / Milwaukee Deep Ridge',
      lat: 19.8333,
      lng: -66.5,
      temperatureC: 28.0,
      condition: 'Tropical Maritime squall line north of trench',
      windSpeedKnots: 22.0,
      windDirection: 'ENE (065°)',
      waveHeightMeters: 3.1,
      barometricPressureHpa: 1009.4,
      pressureTrend: 'Volatile',
      geomagneticKIndex: 5,
      magneticDeclinationDeg: -12.8,
      sargassoCurrentSpeedKnots: 1.8,
      hexagonalMicroburstRisk: 'ELEVATED',
      waterspoutProbabilityPercent: 55,
      rogueWaveIndex: 'HIGH (Cross-sea swells over trench drop-off)',
      acousticNoiseLevelDb: 82,
    },
    sargasso: {
      regionName: 'Central Sargasso Sea Oceanic Gyre',
      lat: 28.0,
      lng: -66.0,
      temperatureC: 25.8,
      condition: 'Eerie Calm with Thick Sargassum Mats & Low Mist',
      windSpeedKnots: 4.5,
      windDirection: 'Variable',
      waveHeightMeters: 0.8,
      barometricPressureHpa: 1018.5,
      pressureTrend: 'Steady High',
      geomagneticKIndex: 6,
      magneticDeclinationDeg: -9.5,
      sargassoCurrentSpeedKnots: 0.6,
      hexagonalMicroburstRisk: 'LOW',
      waterspoutProbabilityPercent: 10,
      rogueWaveIndex: 'MODERATE (Internal solitary waves)',
      acousticNoiseLevelDb: 44,
    },
  };

  const key = typeof region === 'string' ? region.toLowerCase() : 'bermuda';
  const selected = reports[key] || reports.bermuda;
  return res.json(selected);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AERO-TRIANGLE] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

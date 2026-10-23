import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  latLngToVector3,
  haversineDistanceKm,
  sphericalBearingDeg,
  isInsideBermudaTriangle,
  distanceToBermudaTrianglePerimeterKm,
  distanceToBermudaTrianglePerimeterMiles,
  isWithin500MilesOfBermudaTriangle,
  BERMUDA_TRIANGLE_VERTICES,
} from '../utils/geoMath';
import {
  ISLANDS_AND_LANDMARKS,
  HISTORICAL_INCIDENTS,
} from '../data/bermudaData';
import {
  WORLD_COUNTRIES,
  WORLD_ISLANDS,
  WORLD_SEAS_AND_OCEANS,
  GLOBAL_ANOMALIES_AND_TRENCHES,
  ALL_WORLD_ENTITIES,
  WorldEntity,
} from '../data/worldAtlasData';
import {
  IncidentRecord,
  IslandOrLandmark,
  CustomResearcherPin,
  AnomalyHotspot,
} from '../types/research';
import {
  generateSphericalHeatmapCanvas,
  calculateHotspotDensities,
  GLOBAL_HOTSPOT_ANCHORS,
} from '../utils/heatmapDensity';
import {
  Compass,
  Layers,
  CloudRain,
  Eye,
  MapPin,
  Crosshair,
  Maximize2,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  Info,
  Waves,
  Globe,
  Search,
  Flag,
  Anchor,
  ShieldAlert,
  Flame,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface EarthGlobe3DProps {
  onSelectIncident?: (incident: IncidentRecord) => void;
  onSelectIsland?: (island: IslandOrLandmark | WorldEntity) => void;
  customPins: CustomResearcherPin[];
  onAddCustomPin: (pin: Omit<CustomResearcherPin, 'id' | 'timestamp'>) => void;
  onAnomalyAlert?: (alert: {
    id: string;
    timestamp: number;
    title: string;
    lat: number;
    lng: number;
    distanceMiles: number;
    isInside: boolean;
    category: string;
    notes?: string;
  }) => void;
  focusTarget?: { lat: number; lng: number } | null;
  onNavigateToBrowser?: (query?: string) => void;
}

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  onSelectIncident,
  onSelectIsland,
  customPins,
  onAddCustomPin,
  onAnomalyAlert,
  focusTarget,
  onNavigateToBrowser,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const weatherGroupRef = useRef<THREE.Group | null>(null);
  const atlasMarkersGroupRef = useRef<THREE.Group | null>(null);
  const heatmapGroupRef = useRef<THREE.Group | null>(null);
  const heatmapMeshRef = useRef<THREE.Mesh | null>(null);
  const hotspotCentroidGroupRef = useRef<THREE.Group | null>(null);

  // Interaction & camera rotation state in refs for smooth lossless 60fps
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.45, y: -0.33 });
  const currentRotationRef = useRef({ x: 0.45, y: -0.33 });
  const cameraDistanceRef = useRef(200);
  const targetCameraDistanceRef = useRef(200);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVectorRef = useRef(new THREE.Vector2());

  // UI state & Layer Toggles
  const [showTriangle, setShowTriangle] = useState(true);
  const [show500MilePerimeter, setShow500MilePerimeter] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showIslands, setShowIslands] = useState(true);
  const [showCountries, setShowCountries] = useState(true);
  const [showSeasAndOceans, setShowSeasAndOceans] = useState(true);
  const [showGlobalAnomalies, setShowGlobalAnomalies] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showUserPins, setShowUserPins] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHeatmapPanel, setShowHeatmapPanel] = useState(false);
  const [heatmapBandwidthKm, setHeatmapBandwidthKm] = useState(900);
  const [heatmapIntensity, setHeatmapIntensity] = useState(1.1);
  const [selectedHotspot, setSelectedHotspot] = useState<AnomalyHotspot | null>(null);

  const [pinDropMode, setPinDropMode] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
    insideTriangle: boolean;
    distanceToBermudaKm: number;
    distanceToPerimeterMiles: number;
    isWithin500Miles: boolean;
  } | null>({
    lat: 32.3078,
    lng: -64.7505,
    insideTriangle: true,
    distanceToBermudaKm: 0,
    distanceToPerimeterMiles: 0,
    isWithin500Miles: true,
  });

  // Selected World Entity for detailed Intelligence Card Drawer
  const [selectedWorldEntity, setSelectedWorldEntity] = useState<WorldEntity | null>(null);

  // Global search query
  const [atlasSearchQuery, setAtlasSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modal for new pin
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinCategory, setNewPinCategory] = useState('UFO / USO Fast-Mover Contact');
  const [newPinNotes, setNewPinNotes] = useState('');

  // Active weather report preview for Bermuda
  const [weatherTelemetry, setWeatherTelemetry] = useState<any>(null);

  useEffect(() => {
    fetch('/api/weather?region=bermuda')
      .then((r) => r.json())
      .then((data) => setWeatherTelemetry(data))
      .catch((err) => console.error('Weather load error:', err));
  }, []);

  // Handle external focus target
  useEffect(() => {
    if (focusTarget) {
      focusCoordinates(focusTarget.lat, focusTarget.lng, 150);
    }
  }, [focusTarget]);

  // Filtered world atlas search results
  const searchResults = useMemo(() => {
    if (!atlasSearchQuery.trim()) return [];
    const q = atlasSearchQuery.toLowerCase();
    return ALL_WORLD_ENTITIES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.regionOrContinent.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [atlasSearchQuery]);

  // Dynamically calculated global anomalous hotspots based on historical logs & custom pins
  const calculatedHotspots = useMemo(() => {
    return calculateHotspotDensities(customPins);
  }, [customPins]);

  /**
   * Helper to generate full-detail procedural Earth texture canvas
   * with worldwide continents, coastlines, and oceans.
   */
  const createEarthTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Deep Ocean Base with Bathymetric Shading
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGradient.addColorStop(0, '#020d1c');
    oceanGradient.addColorStop(0.3, '#031936');
    oceanGradient.addColorStop(0.5, '#042247');
    oceanGradient.addColorStop(0.8, '#031936');
    oceanGradient.addColorStop(1, '#020d1c');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 2048, 1024);

    // 2. Lat/Long Graticule Grid Lines
    ctx.strokeStyle = 'rgba(30, 144, 255, 0.12)';
    ctx.lineWidth = 1;

    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * 1024;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2048, y);
      ctx.stroke();
    }

    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * 2048;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }

    // Equator, Tropics & Prime Meridian
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(2048, 512);
    ctx.stroke();

    const drawLandmass = (pts: [number, number][], fill = '#112942', stroke = '#24527a') => {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      pts.forEach(([lng, lat], idx) => {
        const x = ((lng + 180) / 360) * 2048;
        const y = ((90 - lat) / 180) * 1024;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // North America (USA, Canada, Alaska, Mexico)
    drawLandmass([
      [-168, 65], [-160, 71], [-130, 70], [-95, 72], [-80, 60], [-60, 50],
      [-55, 45], [-70, 43], [-75, 35], [-80, 25], [-82, 24], [-90, 30],
      [-97, 26], [-105, 20], [-95, 16], [-90, 14], [-84, 9], [-80, 8.5],
      [-95, 17], [-105, 23], [-115, 30], [-125, 48], [-140, 60], [-165, 60]
    ]);

    // Florida & US East Coast Highlight
    drawLandmass([
      [-82, 31], [-80, 28], [-80, 25], [-81, 24.5], [-82.5, 27], [-84, 30]
    ], '#18385a', '#38bdf8');

    // South America (Brazil, Argentina, Chile, Colombia, etc.)
    drawLandmass([
      [-77, 9], [-60, 11], [-50, 0], [-35, -5], [-35, -12], [-40, -22],
      [-50, -30], [-55, -35], [-65, -55], [-75, -53], [-75, -45], [-81, -5],
      [-78, 5], [-77, 8]
    ]);

    // Europe (UK, Scandinavia, France, Germany, Spain, Italy, Mediterranean)
    drawLandmass([
      [-10, 36], [-8, 43], [-2, 43.5], [-4, 48], [1, 51], [5, 53], [8, 57],
      [10, 60], [20, 70], [30, 71], [40, 68], [35, 50], [25, 40], [15, 40],
      [15, 38], [10, 37], [0, 38], [-5, 36]
    ]);

    // British Isles
    drawLandmass([
      [-5, 50], [0, 51], [1.5, 53], [-2, 58], [-6, 58], [-5, 54], [-6, 50]
    ], '#163352', '#38bdf8');
    drawLandmass([
      [-10, 51.5], [-6, 52], [-6, 55], [-10, 54]
    ], '#163352', '#38bdf8');

    // Africa (North Africa, Sahara, West Africa, Central, South Africa, Horn)
    drawLandmass([
      [-15, 30], [-5, 36], [10, 37], [25, 32], [32, 31], [43, 12], [51, 10],
      [42, -5], [35, -20], [30, -34], [18, -34], [12, -18], [10, 0], [0, 5],
      [-15, 10], [-17, 15], [-17, 22]
    ]);

    // Eurasia / Asia (Russia, China, India, Middle East, Southeast Asia)
    drawLandmass([
      [40, 68], [60, 70], [80, 73], [100, 77], [140, 72], [170, 67], [180, 65],
      [160, 55], [140, 50], [130, 42], [120, 35], [120, 23], [105, 20],
      [105, 10], [100, 5], [95, 15], [90, 22], [80, 10], [75, 20], [60, 25],
      [50, 30], [35, 40], [35, 55]
    ]);

    // India Peninsula
    drawLandmass([
      [70, 22], [73, 15], [77, 8], [80, 13], [87, 22]
    ], '#163352');

    // Japan Archipelago
    drawLandmass([
      [130, 32], [133, 34], [139, 36], [141, 38], [145, 44], [141, 45], [138, 38], [132, 33]
    ], '#1e40af', '#60a5fa');

    // Australia & New Zealand
    drawLandmass([
      [114, -22], [122, -15], [135, -12], [142, -10], [150, -22], [153, -28],
      [150, -38], [140, -38], [130, -32], [115, -34]
    ]);
    drawLandmass([[173, -35], [178, -38], [175, -42], [170, -45], [168, -46], [170, -42]], '#163352');

    // Greenland
    drawLandmass([
      [-50, 60], [-40, 60], [-25, 70], [-20, 80], [-40, 83], [-55, 78], [-55, 68]
    ], '#1c3d5a', '#7dd3fc');

    // Madagascar
    drawLandmass([[44, -12], [50, -15], [48, -25], [44, -25]], '#163352');

    // Caribbean Islands (Cuba, Hispaniola, Puerto Rico)
    drawLandmass([[-84, 22], [-75, 20], [-76, 21], [-84, 23]], '#1e3a8a', '#38bdf8');
    drawLandmass([[-74, 19], [-68, 18], [-70, 19.5]], '#1e3a8a', '#38bdf8');
    drawLandmass([[-67.5, 18.5], [-65.5, 18.5], [-65.5, 18.0], [-67.5, 18.0]], '#0284c7', '#38bdf8');

    // Bermuda Island Accent (prominent glowing beacon)
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const bx = ((-64.75 + 180) / 360) * 2048;
    const by = ((90 - 32.3) / 180) * 1024;
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Antarctica (South Pole)
    drawLandmass([
      [-180, -70], [-120, -72], [-60, -65], [0, -70], [60, -68], [120, -66], [180, -70],
      [180, -90], [-180, -90]
    ], '#172554', '#93c5fd');

    return new THREE.CanvasTexture(canvas);
  };

  /**
   * Initialize Three.js Scene, Camera, Globe, Markers, and Listeners
   */
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040812);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = cameraDistanceRef.current;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xa5f3fc, 1.8);
    sunLight.position.set(150, 100, 200);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.85);
    rimLight.position.set(-150, -100, -200);
    scene.add(rimLight);

    // Main Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    const GLOBE_RADIUS = 80;

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthTexture = createEarthTexture();
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x183050),
      shininess: 15,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Outer Sphere
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Bermuda Triangle 3D Polygon
    const triangleGroup = new THREE.Group();
    triangleGroup.name = 'bermuda_triangle_group';
    const vBermuda = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[0].lat, BERMUDA_TRIANGLE_VERTICES[0].lng, GLOBE_RADIUS * 1.008));
    const vMiami = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[1].lat, BERMUDA_TRIANGLE_VERTICES[1].lng, GLOBE_RADIUS * 1.008));
    const vSanJuan = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[2].lat, BERMUDA_TRIANGLE_VERTICES[2].lng, GLOBE_RADIUS * 1.008));

    const createArcLine = (v1: THREE.Vector3, v2: THREE.Vector3, color = 0xff0055, segments = 32) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = new THREE.Vector3().lerpVectors(v1, v2, t).normalize().multiplyScalar(GLOBE_RADIUS * 1.008);
        points.push(p);
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 3 });
      return new THREE.Line(geom, mat);
    };

    triangleGroup.add(createArcLine(vBermuda, vMiami, 0xff0055));
    triangleGroup.add(createArcLine(vMiami, vSanJuan, 0xff0055));
    triangleGroup.add(createArcLine(vSanJuan, vBermuda, 0xff0055));

    // Translucent Bermuda Triangle Mesh Face
    const triangleGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      vBermuda.x, vBermuda.y, vBermuda.z,
      vMiami.x, vMiami.y, vMiami.z,
      vSanJuan.x, vSanJuan.y, vSanJuan.z,
    ]);
    triangleGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const triangleMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const triangleMesh = new THREE.Mesh(triangleGeom, triangleMat);
    triangleGroup.add(triangleMesh);
    globeGroup.add(triangleGroup);

    // 500-Mile Perimeter Warning Ring (Offset Geofence)
    const perimeterGroup = new THREE.Group();
    perimeterGroup.name = 'perimeter_500_group';

    // 500 miles ≈ 7.2 degrees offset
    const DEG_OFFSET = 7.2;
    const vBermudaOuter = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[0].lat + DEG_OFFSET, BERMUDA_TRIANGLE_VERTICES[0].lng, GLOBE_RADIUS * 1.01));
    const vMiamiOuter = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[1].lat, BERMUDA_TRIANGLE_VERTICES[1].lng - DEG_OFFSET, GLOBE_RADIUS * 1.01));
    const vSanJuanOuter = new THREE.Vector3(...latLngToVector3(BERMUDA_TRIANGLE_VERTICES[2].lat - DEG_OFFSET, BERMUDA_TRIANGLE_VERTICES[2].lng, GLOBE_RADIUS * 1.01));

    perimeterGroup.add(createArcLine(vBermudaOuter, vMiamiOuter, 0xf59e0b, 32));
    perimeterGroup.add(createArcLine(vMiamiOuter, vSanJuanOuter, 0xf59e0b, 32));
    perimeterGroup.add(createArcLine(vSanJuanOuter, vBermudaOuter, 0xf59e0b, 32));
    globeGroup.add(perimeterGroup);

    // Weather Layer Group
    const weatherGroup = new THREE.Group();
    weatherGroupRef.current = weatherGroup;
    globeGroup.add(weatherGroup);

    const createWeatherPulseRing = (lat: number, lng: number, color: number, radiusScale: number) => {
      const pos = new THREE.Vector3(...latLngToVector3(lat, lng, GLOBE_RADIUS * 1.012));
      const ringGeom = new THREE.RingGeometry(1, 4 * radiusScale, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      return ring;
    };
    weatherGroup.add(createWeatherPulseRing(32.3078, -64.7505, 0x00e5ff, 1.2));
    weatherGroup.add(createWeatherPulseRing(19.8333, -66.5, 0xffa500, 1.5));

    // Global Anomaly Incident Heatmap Density Layer Group
    const heatmapGroup = new THREE.Group();
    heatmapGroup.name = 'heatmap_density_group';
    heatmapGroupRef.current = heatmapGroup;
    globeGroup.add(heatmapGroup);

    // Continuous Spherical Heatmap Overlay Mesh (just above ocean sphere)
    const heatmapGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.008, 64, 64);
    const heatmapMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.88,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    heatmapMesh.name = 'heatmap_overlay_sphere';
    heatmapMeshRef.current = heatmapMesh;
    heatmapGroup.add(heatmapMesh);

    // Hotspot Centroid Beacons / Rings Sub-Group
    const hotspotCentroidGroup = new THREE.Group();
    hotspotCentroidGroup.name = 'hotspot_centroid_group';
    hotspotCentroidGroupRef.current = hotspotCentroidGroup;
    heatmapGroup.add(hotspotCentroidGroup);

    // Incident & Custom Markers Group
    const markersGroup = new THREE.Group();
    markersGroupRef.current = markersGroup;
    globeGroup.add(markersGroup);

    // Full Atlas World Markers Group
    const atlasMarkersGroup = new THREE.Group();
    atlasMarkersGroupRef.current = atlasMarkersGroup;
    globeGroup.add(atlasMarkersGroup);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;
      cameraDistanceRef.current += (targetCameraDistanceRef.current - cameraDistanceRef.current) * 0.1;

      if (globeGroupRef.current) {
        globeGroupRef.current.rotation.x = currentRotationRef.current.x;
        globeGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z = cameraDistanceRef.current;
      }

      // Pulse effects
      if (weatherGroupRef.current) {
        const time = Date.now() * 0.002;
        weatherGroupRef.current.children.forEach((child, i) => {
          const scale = 1 + 0.15 * Math.sin(time + i * 1.5);
          child.scale.set(scale, scale, 1);
        });
      }

      if (hotspotCentroidGroupRef.current) {
        const time = Date.now() * 0.003;
        hotspotCentroidGroupRef.current.children.forEach((child, i) => {
          const scale = 1 + 0.12 * Math.sin(time + i * 1.2);
          child.scale.set(scale, scale, scale);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  /**
   * Populate / update 3D Markers on globe (Incidents & Custom Pins)
   */
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clear();

    const GLOBE_RADIUS = 80;

    // 1. Bermuda Region Islands & Landmarks
    if (showIslands) {
      ISLANDS_AND_LANDMARKS.forEach((island) => {
        const [x, y, z] = latLngToVector3(island.lat, island.lng, GLOBE_RADIUS * 1.015);
        const markerGeom = new THREE.CylinderGeometry(0.8, 0, 3, 8);
        const color = island.type === 'trench' ? 0x9333ea : island.type === 'anomaly_zone' ? 0xef4444 : 0x06b6d4;
        const markerMat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(markerGeom, markerMat);
        mesh.position.set(x, y, z);
        mesh.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2));
        mesh.rotateX(Math.PI / 2);
        mesh.userData = { type: 'island', data: island };
        group.add(mesh);
      });
    }

    // 2. Historical Incidents
    if (showIncidents) {
      HISTORICAL_INCIDENTS.forEach((inc) => {
        const [x, y, z] = latLngToVector3(inc.lat, inc.lng, GLOBE_RADIUS * 1.02);
        const markerGeom = new THREE.SphereGeometry(1.2, 12, 12);
        const color =
          inc.type === 'disappearance'
            ? 0xff0055
            : inc.type === 'uap_uso'
            ? 0x00ffcc
            : inc.type === 'geomagnetic'
            ? 0xf59e0b
            : 0x3b82f6;
        const markerMat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(markerGeom, markerMat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: 'incident', data: inc };
        group.add(mesh);
      });
    }

    // 3. User Custom Pins
    if (showUserPins) {
      customPins.forEach((pin) => {
        const [x, y, z] = latLngToVector3(pin.lat, pin.lng, GLOBE_RADIUS * 1.025);
        const pinGeom = new THREE.OctahedronGeometry(1.4);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
        const mesh = new THREE.Mesh(pinGeom, pinMat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: 'custom_pin', data: pin };
        group.add(mesh);
      });
    }
  }, [showIslands, showIncidents, showUserPins, customPins]);

  /**
   * Populate Global Atlas Markers (Every Country, World Island, Sea/Ocean, Global Anomaly)
   */
  useEffect(() => {
    if (!atlasMarkersGroupRef.current) return;
    const group = atlasMarkersGroupRef.current;
    group.clear();

    const GLOBE_RADIUS = 80;

    // A. World Countries
    if (showCountries) {
      WORLD_COUNTRIES.forEach((c) => {
        const [x, y, z] = latLngToVector3(c.lat, c.lng, GLOBE_RADIUS * 1.012);
        const geom = new THREE.SphereGeometry(0.7, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: 'world_entity', data: c };
        group.add(mesh);
      });
    }

    // B. World Islands
    if (showIslands) {
      WORLD_ISLANDS.forEach((isl) => {
        const [x, y, z] = latLngToVector3(isl.lat, isl.lng, GLOBE_RADIUS * 1.014);
        const geom = new THREE.ConeGeometry(0.7, 1.8, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2));
        mesh.rotateX(Math.PI / 2);
        mesh.userData = { type: 'world_entity', data: isl };
        group.add(mesh);
      });
    }

    // C. World Seas & Oceans
    if (showSeasAndOceans) {
      WORLD_SEAS_AND_OCEANS.forEach((sea) => {
        const [x, y, z] = latLngToVector3(sea.lat, sea.lng, GLOBE_RADIUS * 1.01);
        const geom = new THREE.RingGeometry(0.5, 1.8, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2));
        mesh.userData = { type: 'world_entity', data: sea };
        group.add(mesh);
      });
    }

    // D. Global Anomalies & Trenches (Dragon's Triangle, Mariana Trench, SAA, etc.)
    if (showGlobalAnomalies) {
      GLOBAL_ANOMALIES_AND_TRENCHES.forEach((anom) => {
        const [x, y, z] = latLngToVector3(anom.lat, anom.lng, GLOBE_RADIUS * 1.02);
        const geom = new THREE.DodecahedronGeometry(1.2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        mesh.userData = { type: 'world_entity', data: anom };
        group.add(mesh);
      });
    }
  }, [showCountries, showIslands, showSeasAndOceans, showGlobalAnomalies]);

  // Toggle Visibility of Geofence and 500-mile perimeter
  useEffect(() => {
    if (!globeGroupRef.current) return;
    const triGroup = globeGroupRef.current.getObjectByName('bermuda_triangle_group');
    if (triGroup) triGroup.visible = showTriangle;
    const perimGroup = globeGroupRef.current.getObjectByName('perimeter_500_group');
    if (perimGroup) perimGroup.visible = show500MilePerimeter;
  }, [showTriangle, show500MilePerimeter]);

  // Toggle Weather Group visibility
  useEffect(() => {
    if (!weatherGroupRef.current) return;
    weatherGroupRef.current.visible = showWeatherOverlay;
  }, [showWeatherOverlay]);

  // Update Continuous Spherical Heatmap Texture & 3D Hotspot Centroids
  useEffect(() => {
    if (!heatmapGroupRef.current || !heatmapMeshRef.current) return;

    heatmapGroupRef.current.visible = showHeatmap;
    if (!showHeatmap) return;

    // 1. Generate equirectangular thermal canvas texture
    const canvas = generateSphericalHeatmapCanvas(customPins, heatmapBandwidthKm, heatmapIntensity);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Apply texture to sphere overlay
    const mat = heatmapMeshRef.current.material as THREE.MeshBasicMaterial;
    if (mat.map) {
      mat.map.dispose();
    }
    mat.map = texture;
    mat.needsUpdate = true;

    // 2. Populate Hotspot Centroid Beacons / Rings
    if (hotspotCentroidGroupRef.current) {
      const hGroup = hotspotCentroidGroupRef.current;
      hGroup.clear();

      const GLOBE_RADIUS = 80;

      calculatedHotspots.forEach((hotspot) => {
        const [x, y, z] = latLngToVector3(hotspot.lat, hotspot.lng, GLOBE_RADIUS * 1.018);
        const color =
          hotspot.intensityLevel === 'CRITICAL'
            ? 0xef4444
            : hotspot.intensityLevel === 'HIGH'
            ? 0xf59e0b
            : hotspot.intensityLevel === 'MODERATE'
            ? 0x10b981
            : 0x06b6d4;

        // Concentric thermal halo ring
        const ringGeom = new THREE.RingGeometry(1.2, 4.0 * (hotspot.densityScore / 80), 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.set(x, y, z);
        ringMesh.lookAt(new THREE.Vector3(x, y, z).multiplyScalar(2));
        ringMesh.userData = { type: 'anomaly_hotspot', data: hotspot };
        hGroup.add(ringMesh);

        // Core thermal diamond beacon
        const beaconGeom = new THREE.OctahedronGeometry(1.4);
        const beaconMat = new THREE.MeshBasicMaterial({ color });
        const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
        beaconMesh.position.set(x, y, z);
        beaconMesh.userData = { type: 'anomaly_hotspot', data: hotspot };
        hGroup.add(beaconMesh);
      });
    }
  }, [showHeatmap, heatmapBandwidthKm, heatmapIntensity, customPins, calculatedHotspots]);

  // Camera Orbit Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.006;
      targetRotationRef.current.x = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, targetRotationRef.current.x + deltaY * 0.006)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    }

    // Raycast hover detection
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseVectorRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVectorRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVectorRef.current, cameraRef.current);

    let hits: THREE.Intersection[] = [];
    if (markersGroupRef.current) {
      hits = raycasterRef.current.intersectObjects(markersGroupRef.current.children);
    }
    if (hits.length === 0 && showHeatmap && hotspotCentroidGroupRef.current) {
      hits = raycasterRef.current.intersectObjects(hotspotCentroidGroupRef.current.children);
    }
    if (hits.length === 0 && atlasMarkersGroupRef.current) {
      hits = raycasterRef.current.intersectObjects(atlasMarkersGroupRef.current.children);
    }

    if (hits.length > 0) {
      setHoveredEntity(hits[0].object.userData);
    } else {
      setHoveredEntity(null);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    targetCameraDistanceRef.current = Math.max(
      105,
      Math.min(420, targetCameraDistanceRef.current + e.deltaY * 0.25)
    );
  };

  // Click on globe to pin or select marker
  const handleClick = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !globeGroupRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseVectorRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVectorRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVectorRef.current, cameraRef.current);

    // Check markers first
    if (markersGroupRef.current) {
      const markerHits = raycasterRef.current.intersectObjects(markersGroupRef.current.children);
      if (markerHits.length > 0) {
        const udata = markerHits[0].object.userData;
        if (udata.type === 'incident' && onSelectIncident) {
          onSelectIncident(udata.data);
          return;
        }
        if (udata.type === 'island') {
          setSelectedWorldEntity({
            id: udata.data.id,
            name: udata.data.name,
            category: 'island',
            lat: udata.data.lat,
            lng: udata.data.lng,
            regionOrContinent: 'Bermuda Sector',
            description: udata.data.description,
            depthOrElevationM: udata.data.depthOrElevationM,
            anomalousOrNavalRelevance: udata.data.historicalSignificance,
          });
          if (onSelectIsland) {
            onSelectIsland(udata.data);
          }
          return;
        }
      }
    }

    // Check Hotspot Centroid Beacons
    if (showHeatmap && hotspotCentroidGroupRef.current) {
      const hotspotHits = raycasterRef.current.intersectObjects(hotspotCentroidGroupRef.current.children);
      if (hotspotHits.length > 0) {
        const udata = hotspotHits[0].object.userData;
        if (udata.type === 'anomaly_hotspot') {
          setSelectedHotspot(udata.data);
          setSelectedWorldEntity(null);
          focusCoordinates(udata.data.lat, udata.data.lng, 150);
          return;
        }
      }
    }

    if (atlasMarkersGroupRef.current) {
      const atlasHits = raycasterRef.current.intersectObjects(atlasMarkersGroupRef.current.children);
      if (atlasHits.length > 0) {
        const udata = atlasHits[0].object.userData;
        if (udata.type === 'world_entity') {
          setSelectedWorldEntity(udata.data);
          focusCoordinates(udata.data.lat, udata.data.lng, udata.data.category === 'country' ? 180 : 145);
          if (onSelectIsland) {
            onSelectIsland(udata.data);
          }
          return;
        }
      }
    }

    // Next check Earth sphere for coordinates
    const sphereHits = raycasterRef.current.intersectObjects(globeGroupRef.current.children);
    const earthHit = sphereHits.find((h) => h.object instanceof THREE.Mesh && h.object.geometry instanceof THREE.SphereGeometry);
    if (earthHit) {
      const point = earthHit.point.clone();
      point.applyAxisAngle(new THREE.Vector3(1, 0, 0), -currentRotationRef.current.x);
      point.applyAxisAngle(new THREE.Vector3(0, 1, 0), -currentRotationRef.current.y);
      point.normalize();

      const lat = Math.asin(point.y) * (180 / Math.PI);
      const lng = (Math.atan2(point.z, -point.x) * (180 / Math.PI)) - 180;
      const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;

      const inside = isInsideBermudaTriangle(lat, normalizedLng);
      const distToBermuda = haversineDistanceKm(lat, normalizedLng, 32.3078, -64.7505);
      const distPerimeterMiles = distanceToBermudaTrianglePerimeterMiles(lat, normalizedLng);
      const within500 = isWithin500MilesOfBermudaTriangle(lat, normalizedLng);

      setSelectedCoordinates({
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(normalizedLng * 1000) / 1000,
        insideTriangle: inside,
        distanceToBermudaKm: distToBermuda,
        distanceToPerimeterMiles: distPerimeterMiles,
        isWithin500Miles: within500,
      });

      if (pinDropMode) {
        setIsPinModalOpen(true);
      }
    }
  };

  // Quick preset camera focus
  const focusCoordinates = (lat: number, lng: number, distance = 160) => {
    const phi = (lat * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    targetRotationRef.current = {
      x: phi,
      y: -theta + Math.PI / 2,
    };
    targetCameraDistanceRef.current = distance;
  };

  // Save new Pin and Trigger Real-time Automated Anomaly Detection Alert if <= 500 miles
  const handleSavePin = () => {
    if (!selectedCoordinates || !newPinTitle.trim()) return;

    onAddCustomPin({
      lat: selectedCoordinates.lat,
      lng: selectedCoordinates.lng,
      title: newPinTitle.trim(),
      category: newPinCategory,
      notes: newPinNotes.trim(),
    });

    setNewPinTitle('');
    setNewPinNotes('');
    setIsPinModalOpen(false);
    setPinDropMode(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top HUD Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 shadow-xl">
        <div className="flex items-center gap-2 text-xs">
          {/* Global Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700 focus-within:border-cyan-400 min-w-[230px]">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                value={atlasSearchQuery}
                onChange={(e) => {
                  setAtlasSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search country, island, sea..."
                className="bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none w-full"
              />
            </div>

            {/* Dropdown Suggestions */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-10 left-0 w-80 max-h-72 overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 shadow-2xl p-1 divide-y divide-slate-800 z-50 text-xs">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      focusCoordinates(item.lat, item.lng, item.category === 'country' ? 180 : 145);
                      setSelectedWorldEntity(item);
                      setSelectedCoordinates({
                        lat: item.lat,
                        lng: item.lng,
                        insideTriangle: isInsideBermudaTriangle(item.lat, item.lng),
                        distanceToBermudaKm: haversineDistanceKm(item.lat, item.lng, 32.3078, -64.7505),
                        distanceToPerimeterMiles: distanceToBermudaTrianglePerimeterMiles(item.lat, item.lng),
                        isWithin500Miles: isWithin500MilesOfBermudaTriangle(item.lat, item.lng),
                      });
                      setIsSearchOpen(false);
                      setAtlasSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded hover:bg-slate-800 transition flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.regionOrContinent} | {item.lat}°N, {item.lng}°W
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                        item.category === 'country'
                          ? 'bg-sky-950 text-sky-300 border border-sky-700'
                          : item.category === 'island'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : item.category === 'sea_ocean'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                          : 'bg-purple-950 text-purple-300 border border-purple-700'
                      }`}
                    >
                      {item.category.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Focus Preset Buttons */}
          <button
            onClick={() => focusCoordinates(32.3078, -64.7505, 145)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            Bermuda
          </button>
          <button
            onClick={() => focusCoordinates(25.7333, -79.2833, 140)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            Bimini
          </button>
          <button
            onClick={() => focusCoordinates(19.8333, -66.5, 150)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
          >
            PR Trench
          </button>
          <button
            onClick={() => focusCoordinates(25.0, 137.0, 155)}
            className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-xs transition"
          >
            Devil's Sea (Japan)
          </button>
        </div>

        {/* Layer Toggles Ribbon */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowTriangle(!showTriangle)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showTriangle
                ? 'bg-red-950/80 border-red-500 text-red-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Triangle</span>
          </button>

          <button
            onClick={() => setShow500MilePerimeter(!show500MilePerimeter)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              show500MilePerimeter
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Automated Anomaly Detection 500-Mile Perimeter"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>500-Mi Zone</span>
          </button>

          <button
            onClick={() => setShowCountries(!showCountries)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showCountries
                ? 'bg-sky-950/80 border-sky-500 text-sky-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Flag className="w-3 h-3" />
            <span>Countries ({WORLD_COUNTRIES.length})</span>
          </button>

          <button
            onClick={() => setShowIslands(!showIslands)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showIslands
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Anchor className="w-3 h-3" />
            <span>Islands ({WORLD_ISLANDS.length})</span>
          </button>

          <button
            onClick={() => setShowSeasAndOceans(!showSeasAndOceans)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showSeasAndOceans
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>Seas & Oceans</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showIncidents
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Incidents ({HISTORICAL_INCIDENTS.length})</span>
          </button>

          <button
            onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showWeatherOverlay
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            <span>Weather</span>
          </button>

          {/* Togglable Heatmap Density Layer */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold transition ${
              showHeatmap
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Global Incident Density Heatmap Layer"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Heatmap ({showHeatmap ? 'ON' : 'OFF'})</span>
          </button>

          {showHeatmap && (
            <button
              onClick={() => setShowHeatmapPanel(!showHeatmapPanel)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition ${
                showHeatmapPanel
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Open Global Anomalous Hotspots & Density Tuning Drawer"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Hotspots ({calculatedHotspots.length})</span>
            </button>
          )}

          <button
            onClick={() => setPinDropMode(!pinDropMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border font-semibold transition ${
              pinDropMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{pinDropMode ? 'Click Earth to Pin' : 'Pin Incident'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Surface */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Hover Information Box */}
      {hoveredEntity && !selectedWorldEntity && !selectedHotspot && (
        <div className="absolute top-20 left-6 z-20 max-w-sm p-3.5 rounded-lg bg-slate-900/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md pointer-events-none font-mono">
          <div className="flex items-center justify-between text-[11px] text-cyan-400 border-b border-slate-800 pb-1 mb-1.5">
            <span className="uppercase">{hoveredEntity.type.replace('_', ' ')}</span>
            <span>{hoveredEntity.data.regionOrContinent || hoveredEntity.data.region || hoveredEntity.data.year || ''}</span>
          </div>
          <div className="font-bold text-slate-100 text-sm mb-1">{hoveredEntity.data.title || hoveredEntity.data.name}</div>
          {hoveredEntity.type === 'anomaly_hotspot' ? (
            <div className="space-y-1 my-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">INCIDENT DENSITY:</span>
                <span className="text-amber-400 font-bold">{hoveredEntity.data.densityScore}% [{hoveredEntity.data.intensityLevel}]</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">{hoveredEntity.data.signature}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
              {hoveredEntity.data.summary || hoveredEntity.data.description || hoveredEntity.data.notes}
            </p>
          )}
          <div className="mt-2 text-[10px] text-cyan-300 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>LAT: {hoveredEntity.data.lat}° N</span>
            <span>LNG: {hoveredEntity.data.lng}° W</span>
          </div>
        </div>
      )}

      {/* Selected World Entity Detailed Dossier Drawer */}
      {selectedWorldEntity && (
        <div className="absolute top-20 right-6 z-30 w-96 p-4 rounded-xl bg-slate-900/95 border border-cyan-500/70 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  selectedWorldEntity.category === 'country'
                    ? 'bg-sky-950 text-sky-300 border border-sky-700'
                    : selectedWorldEntity.category === 'island'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : selectedWorldEntity.category === 'sea_ocean'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-purple-950 text-purple-300 border border-purple-700'
                }`}
              >
                {selectedWorldEntity.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-400">{selectedWorldEntity.regionOrContinent}</span>
            </div>
            <button
              onClick={() => setSelectedWorldEntity(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          <h3 className="font-bold text-base text-slate-100 mb-1">{selectedWorldEntity.name}</h3>

          <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-slate-950 border border-slate-800 mb-3">
            <div>
              <span className="text-slate-500 block text-[9px]">COORDINATES</span>
              <span className="text-cyan-300 font-bold">
                {selectedWorldEntity.lat >= 0 ? `${selectedWorldEntity.lat.toFixed(2)}°N` : `${Math.abs(selectedWorldEntity.lat).toFixed(2)}°S`},{' '}
                {selectedWorldEntity.lng >= 0 ? `${selectedWorldEntity.lng.toFixed(2)}°E` : `${Math.abs(selectedWorldEntity.lng).toFixed(2)}°W`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">ELEVATION / DEPTH</span>
              <span className="text-amber-300 font-bold">
                {selectedWorldEntity.depthOrElevationM !== undefined
                  ? `${selectedWorldEntity.depthOrElevationM > 0 ? '+' : ''}${selectedWorldEntity.depthOrElevationM} meters`
                  : 'Surface Level'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-[9px]">BERMUDA GEOFENCE PROXIMITY</span>
              <span className="text-emerald-400 font-bold">
                {isInsideBermudaTriangle(selectedWorldEntity.lat, selectedWorldEntity.lng)
                  ? 'INSIDE BERMUDA TRIANGLE'
                  : `${distanceToBermudaTrianglePerimeterMiles(selectedWorldEntity.lat, selectedWorldEntity.lng).toFixed(1)} miles to perimeter`}
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">GEOGRAPHIC PROFILE:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedWorldEntity.description}</p>
            </div>

            {selectedWorldEntity.anomalousOrNavalRelevance && (
              <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] text-cyan-400 block font-bold mb-0.5">NAVAL & ANOMALOUS INTELLIGENCE:</span>
                <p className="text-xs text-cyan-200 leading-relaxed font-sans">{selectedWorldEntity.anomalousOrNavalRelevance}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setSelectedCoordinates({
                  lat: selectedWorldEntity.lat,
                  lng: selectedWorldEntity.lng,
                  insideTriangle: isInsideBermudaTriangle(selectedWorldEntity.lat, selectedWorldEntity.lng),
                  distanceToBermudaKm: haversineDistanceKm(selectedWorldEntity.lat, selectedWorldEntity.lng, 32.3078, -64.7505),
                  distanceToPerimeterMiles: distanceToBermudaTrianglePerimeterMiles(selectedWorldEntity.lat, selectedWorldEntity.lng),
                  isWithin500Miles: isWithin500MilesOfBermudaTriangle(selectedWorldEntity.lat, selectedWorldEntity.lng),
                });
                setNewPinTitle(`Finding near ${selectedWorldEntity.name}`);
                setIsPinModalOpen(true);
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Pin Anomaly Here</span>
            </button>
            <button
              onClick={() => focusCoordinates(selectedWorldEntity.lat, selectedWorldEntity.lng, selectedWorldEntity.category === 'country' ? 180 : 145)}
              className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Center View
            </button>
          </div>
        </div>
      )}

      {/* Selected Anomalous Hotspot Intelligence Dossier Drawer */}
      {selectedHotspot && (
        <div className="absolute top-20 right-6 z-30 w-96 p-4 rounded-xl bg-slate-900/95 border border-amber-500/70 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                  selectedHotspot.intensityLevel === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-700'
                    : selectedHotspot.intensityLevel === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : selectedHotspot.intensityLevel === 'MODERATE'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                }`}
              >
                {selectedHotspot.intensityLevel} DENSITY HOTSPOT
              </span>
              <span className="text-[10px] text-slate-400">{selectedHotspot.region}</span>
            </div>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{selectedHotspot.name}</span>
            </h3>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">DENSITY INDEX</span>
              <span className="text-amber-400 font-bold text-sm">{selectedHotspot.densityScore}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded bg-slate-950 border border-slate-800 mb-3">
            <div>
              <span className="text-slate-500 block text-[9px]">COORDINATES</span>
              <span className="text-cyan-300 font-bold">
                {selectedHotspot.lat >= 0 ? `${selectedHotspot.lat.toFixed(2)}°N` : `${Math.abs(selectedHotspot.lat).toFixed(2)}°S`},{' '}
                {selectedHotspot.lng >= 0 ? `${selectedHotspot.lng.toFixed(2)}°E` : `${Math.abs(selectedHotspot.lng).toFixed(2)}°W`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">INFLUENCE RADIUS</span>
              <span className="text-slate-200 font-bold">{selectedHotspot.radiusKm} km</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block text-[9px]">PRIMARY ANOMALY CLASSIFICATION</span>
              <span className="text-rose-400 font-bold">{selectedHotspot.dominantType}</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold mb-0.5">ANOMALOUS TELEMETRY SIGNATURE:</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedHotspot.signature}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-bold mb-1">
                RECORDED HISTORICAL INCIDENTS ({selectedHotspot.historicalEvents.length}):
              </span>
              <div className="space-y-1">
                {selectedHotspot.historicalEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-amber-200/90 font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80"
                  >
                    <span className="text-amber-400">▶</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setSelectedCoordinates({
                  lat: selectedHotspot.lat,
                  lng: selectedHotspot.lng,
                  insideTriangle: isInsideBermudaTriangle(selectedHotspot.lat, selectedHotspot.lng),
                  distanceToBermudaKm: haversineDistanceKm(selectedHotspot.lat, selectedHotspot.lng, 32.3078, -64.7505),
                  distanceToPerimeterMiles: distanceToBermudaTrianglePerimeterMiles(selectedHotspot.lat, selectedHotspot.lng),
                  isWithin500Miles: isWithin500MilesOfBermudaTriangle(selectedHotspot.lat, selectedHotspot.lng),
                });
                setNewPinTitle(`Observation at ${selectedHotspot.name}`);
                setIsPinModalOpen(true);
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Pin Incident Here</span>
            </button>
            <button
              onClick={() => focusCoordinates(selectedHotspot.lat, selectedHotspot.lng, 150)}
              className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Center View
            </button>
            {onNavigateToBrowser && (
              <button
                onClick={() => onNavigateToBrowser(selectedHotspot.name)}
                className="py-1.5 px-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs transition"
                title="Search Deep Web Intel"
              >
                Deep Web
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Heatmap Hotspots & Density Tuning Drawer */}
      {showHeatmap && showHeatmapPanel && (
        <div className="absolute top-20 left-3 z-30 w-84 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md font-mono text-xs text-slate-200 flex flex-col max-h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>INCIDENT DENSITY HEATMAP</span>
            </div>
            <button
              onClick={() => setShowHeatmapPanel(false)}
              className="text-slate-400 hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Density Thermal Spectrum Scale */}
          <div className="p-2 rounded bg-slate-950 border border-slate-800 mb-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>THERMAL DENSITY GRADIENT</span>
              <span className="text-amber-400 font-bold">{calculatedHotspots.length} HOTSPOTS</span>
            </div>
            <div className="h-2.5 w-full rounded bg-gradient-to-r from-cyan-500 via-emerald-400 via-amber-400 to-rose-600 mb-1" />
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>0% Low (Cyan)</span>
              <span>50% Mid (Amber)</span>
              <span>100% Critical (Crimson)</span>
            </div>
          </div>

          {/* Tuning Sliders */}
          <div className="space-y-2 p-2 rounded bg-slate-950/80 border border-slate-800 mb-2.5 text-[11px]">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-0.5">
                <span>Kernel Bandwidth:</span>
                <span className="text-cyan-300 font-bold">{heatmapBandwidthKm} km</span>
              </div>
              <input
                type="range"
                min="400"
                max="2000"
                step="50"
                value={heatmapBandwidthKm}
                onChange={(e) => setHeatmapBandwidthKm(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-0.5">
                <span>Thermal Intensity:</span>
                <span className="text-amber-300 font-bold">{heatmapIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={heatmapIntensity}
                onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Hotspots Ranking List */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Global Anomaly Hotspots</span>
            <span>Density Score</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72">
            {calculatedHotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => {
                  setSelectedHotspot(hotspot);
                  setSelectedWorldEntity(null);
                  focusCoordinates(hotspot.lat, hotspot.lng, 150);
                }}
                className={`w-full text-left p-2 rounded border transition flex items-center justify-between gap-2 ${
                  selectedHotspot?.id === hotspot.id
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hotspot.intensityLevel === 'CRITICAL'
                          ? 'bg-rose-500 animate-ping'
                          : hotspot.intensityLevel === 'HIGH'
                          ? 'bg-amber-400'
                          : hotspot.intensityLevel === 'MODERATE'
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <span className="truncate">{hotspot.name}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{hotspot.region}</div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold text-xs font-mono ${
                      hotspot.densityScore >= 85
                        ? 'text-rose-400'
                        : hotspot.densityScore >= 70
                        ? 'text-amber-400'
                        : hotspot.densityScore >= 50
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {hotspot.densityScore}%
                  </span>
                  <span className="block text-[8px] text-slate-500">{hotspot.intensityLevel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Right: Live Weather Telemetry Drawer */}
      {showWeatherOverlay && weatherTelemetry && (
        <div className="absolute bottom-4 right-4 z-10 w-80 p-3 rounded-lg bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-xl text-xs font-mono">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span>BERMUDA METEOROLOGICAL STATION</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">LIVE FEED</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">ATMOSPHERIC PRESSURE</span>
              <span className="text-amber-300 font-semibold">{weatherTelemetry.barometricPressureHpa} hPa</span>
              <span className="text-[10px] text-rose-400 ml-1">({weatherTelemetry.pressureTrend})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GEOMAGNETIC K-INDEX</span>
              <span className={`font-semibold ${weatherTelemetry.geomagneticKIndex >= 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Kp {weatherTelemetry.geomagneticKIndex} / 9
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">WIND & GULF CURRENT</span>
              <span>{weatherTelemetry.windSpeedKnots} kts | {weatherTelemetry.windDirection}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SWELL & SARGASSO SEAS</span>
              <span>{weatherTelemetry.waveHeightMeters}m swells</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Telemetry & 500-Mile Perimeter Indicator */}
      {selectedCoordinates && (
        <div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-100">TELEMETRY COORDINATE LOCK</span>
          </div>
          <div className="text-[11px] space-y-0.5">
            <div>LAT: <span className="text-cyan-300">{selectedCoordinates.lat}°</span> | LNG: <span className="text-cyan-300">{selectedCoordinates.lng}°</span></div>
            <div>
              500-MILE GEOFENCE STATUS:{' '}
              <span className={selectedCoordinates.isWithin500Miles ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400'}>
                {selectedCoordinates.insideTriangle
                  ? 'INSIDE BERMUDA TRIANGLE'
                  : selectedCoordinates.isWithin500Miles
                  ? `WITHIN 500-MILE ANOMALY PERIMETER (${selectedCoordinates.distanceToPerimeterMiles} mi)`
                  : `OUTSIDE PERIMETER (${selectedCoordinates.distanceToPerimeterMiles} mi)`}
              </span>
            </div>
            <div>
              DISTANCE TO BERMUDA APEX:{' '}
              <span className="text-cyan-300">{selectedCoordinates.distanceToBermudaKm} km</span>
              <span className="text-slate-400 text-[10px]"> ({Math.round(selectedCoordinates.distanceToBermudaKm * 0.539957)} NM)</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Pin / Incident Modal */}
      {isPinModalOpen && selectedCoordinates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-5 rounded-xl bg-slate-900 border border-amber-500/50 shadow-2xl text-slate-100 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <MapPin className="w-5 h-5" />
                <span>Log New Oceanic Anomaly / Incident</span>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {selectedCoordinates.isWithin500Miles && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/70 text-rose-200 text-xs mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold">AUTOMATED ANOMALY DETECTION ARMED:</span>
                  <p className="text-[11px] text-rose-300">
                    Location is {selectedCoordinates.insideTriangle ? 'INSIDE' : `${selectedCoordinates.distanceToPerimeterMiles} miles from`} Bermuda Triangle. Saving will broadcast a real-time system alert to the status bar.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Incident / Finding Title</label>
                <input
                  type="text"
                  value={newPinTitle}
                  onChange={(e) => setNewPinTitle(e.target.value)}
                  placeholder="e.g. Submerged USO Non-Cavitation Radar Echo"
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Classification Category</label>
                <select
                  value={newPinCategory}
                  onChange={(e) => setNewPinCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="UFO / USO Fast-Mover Contact">UFO / USO Fast-Mover Contact</option>
                  <option value="Geomagnetic Distortion / Precession">Geomagnetic Distortion / Precession</option>
                  <option value="Maritime / Aerial Vanishing">Maritime / Aerial Vanishing</option>
                  <option value="Submerged Megalith / Pyramidal Mound">Submerged Megalith / Pyramidal Mound</option>
                  <option value="Hydro-Acoustic Infrasound Inversion">Hydro-Acoustic Infrasound Inversion</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Confidential Field Log</label>
                <textarea
                  value={newPinNotes}
                  onChange={(e) => setNewPinNotes(e.target.value)}
                  rows={3}
                  placeholder="Record coordinates, sonar frequencies, magnetic deflection, or visual contact notes..."
                  className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                disabled={!newPinTitle.trim()}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow"
              >
                Commit to Local Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Emergencia, HeatmapPoint } from '@/types';
import { getHeatmapData } from '@/services/indeciService';

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapComponentProps {
  cameras: Camera[];
  emergencias: Emergencia[];
  showCameras: boolean;
  showEmergencies: boolean;
  showCriminalResidences: boolean;
  criminalResidencesData: HeatmapPoint[];
  criminalResidencesFilter?: {
    crimeType?: string;
    deptCode?: string;
  };
  emergencyFilter?: Set<string>;
  onCameraClick?: (camera: Camera) => void;
  onEmergencyClick?: (emergencia: Emergencia) => void;
}

// Icono de cámara para modo hacker
const hackerCameraIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="16" fill="#00ff41" opacity="0.2"/>
      <circle cx="20" cy="20" r="12" fill="#003300" stroke="#00ff41" stroke-width="2" filter="url(#glow)"/>
      <rect x="15" y="18" width="10" height="7" fill="#00ff41" opacity="0.8"/>
      <circle cx="20" cy="21" r="3" fill="#00ff41"/>
      <circle cx="20" cy="21" r="1.5" fill="#003300"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
  className: 'hacker-camera-marker-icon',
});

// Icono para residencias criminales en modo hacker
const hackerCriminalResidenceIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-criminal">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="16" fill="#a855f7" opacity="0.3"/>
      <circle cx="20" cy="20" r="14" fill="#a855f7" opacity="0.8" filter="url(#glow-criminal)"/>
      <path d="M13 22 L13 28 L27 28 L27 22 M20 16 L13 22 L27 22 M20 16 L28 24" fill="#001a00" stroke="#001a00" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="15" y="23" width="3" height="3" fill="#a855f7"/>
      <rect x="22" y="23" width="3" height="3" fill="#a855f7"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
  className: 'hacker-criminal-marker-icon',
});

function HackerCriminalResidencesLayer({
  showCriminalResidences,
  criminalResidencesFilter,
}: {
  showCriminalResidences: boolean;
  criminalResidencesFilter?: {
    crimeType?: string;
    deptCode?: string;
  };
}) {
  const map = useMap();
  const [dynamicCriminalData, setDynamicCriminalData] = useState<HeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastBoundsRef = useRef<string>('');
  const requestIdRef = useRef(0);
  const filterKey = `${criminalResidencesFilter?.crimeType ?? ''}|${criminalResidencesFilter?.deptCode ?? ''}`;

  const getBoundsKey = (bounds: L.LatLngBounds) =>
    `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}|${filterKey}`;

  useMapEvents({
    moveend() {
      if (!showCriminalResidences) return;
      const bounds = map.getBounds();
      const boundsKey = getBoundsKey(bounds);
      if (boundsKey === lastBoundsRef.current) return;
      lastBoundsRef.current = boundsKey;
      loadCriminalDataForBounds(bounds);
    },
    zoomend() {
      if (!showCriminalResidences) return;
      const bounds = map.getBounds();
      const boundsKey = getBoundsKey(bounds);
      if (boundsKey === lastBoundsRef.current) return;
      lastBoundsRef.current = boundsKey;
      loadCriminalDataForBounds(bounds);
    },
  });

  async function loadCriminalDataForBounds(bounds: L.LatLngBounds) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      setIsLoading(true);
      setDynamicCriminalData([]);

      const { _southWest, _northEast } = bounds as any;
      const min_lat = _southWest.lat;
      const max_lat = _northEast.lat;
      const min_lon = _southWest.lng;
      const max_lon = _northEast.lng;
      const zoom = map.getZoom();
      const limit = zoom <= 9 ? 20000 : 10000;
      const chunkSize = 1000;
      let offset = 0;

      while (offset < limit) {
        if (requestIdRef.current !== requestId) return;

        const pageLimit = Math.min(chunkSize, limit - offset);
        const data = await getHeatmapData({
          limit: pageLimit,
          offset,
          crime_type: criminalResidencesFilter?.crimeType,
          dept_code: criminalResidencesFilter?.deptCode,
          min_lat,
          max_lat,
          min_lon,
          max_lon,
        });

        if (requestIdRef.current !== requestId) return;
        if (!data || data.length === 0) break;

        setDynamicCriminalData((prev) => [...prev, ...data]);

        if (data.length < pageLimit) break;
        offset += pageLimit;

        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Error cargando datos dinámicos de residencias criminales:', error);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (showCriminalResidences && dynamicCriminalData.length === 0) {
      const bounds = map.getBounds();
      loadCriminalDataForBounds(bounds);
    }
  }, [showCriminalResidences]);

  useEffect(() => {
    if (showCriminalResidences) {
      const bounds = map.getBounds();
      lastBoundsRef.current = '';
      loadCriminalDataForBounds(bounds);
    }
  }, [criminalResidencesFilter]);

  if (!showCriminalResidences) return null;

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={40}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={true}
      zoomToBoundsOnClick={true}
      iconCreateFunction={(cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count >= 50) size = 'large';
        else if (count >= 20) size = 'medium';

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size} hacker-criminal-cluster`,
          iconSize: L.point(40, 40),
        });
      }}
    >
      {dynamicCriminalData.map((point, index) => {
        const lat = parseFloat(point.lat);
        const lon = parseFloat(point.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return (
          <Marker key={`hacker-criminal-${index}-${point.lat}-${point.lon}`} position={[lat, lon]} icon={hackerCriminalResidenceIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold mb-2">Residencia Criminal</h3>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Tipo de Crimen:</span> {point.type}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Coordenadas:</span> {lat.toFixed(6)}, {lon.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

// Mapa de colores con estilo neón para emergencias
const emergencyColorMap: { [key: string]: string } = {
  'EMERGENCIA MEDICA': '#00ff41',
  'INCENDIO': '#ff0080',
  'ACCIDENTE VEHICULAR': '#ffff00',
  'ACCIDENTE DE TRANSITO': '#ffff00',
  'RESCATE': '#00ffff',
  'MATERIALES PELIGROSOS': '#ff00ff',
  'INCENDIO URBANO': '#ff0080',
  'SERVICIO ESPECIAL': '#00ffaa',
  'LLUVIA INTENSA': '#0080ff',
  'DESLIZAMIENTO': '#ff6600',
  'INUNDACION': '#00aaff',
  'SISMO': '#ff0000',
  'HELADA': '#80ffff',
  'SEQUIA': '#ffaa00',
  'INCENDIO FORESTAL': '#ff4400',
  'VANDALISMO': '#888888',
  'ACCIDENTE': '#ffff00',
  'OTRO': '#808080',
};

function getEmergencyColor(tipo: string): string {
  if (emergencyColorMap[tipo]) return emergencyColorMap[tipo];
  for (const [key, color] of Object.entries(emergencyColorMap)) {
    if (tipo.includes(key)) return color;
  }
  return '#00ff41';
}

function getEmergencySymbol(tipo: string): string {
  const color = getEmergencyColor(tipo);
  
  if (tipo.includes('EMERGENCIA MEDICA')) {
    return `
      <rect x="18" y="12" width="4" height="16" fill="#003300" rx="1"/>
      <rect x="12" y="18" width="16" height="4" fill="#003300" rx="1"/>
    `;
  } else if (tipo.includes('INCENDIO')) {
    return `
      <path d="M20 12 C18 14, 16 16, 16 19 C16 22, 17.5 24, 20 24 C22.5 24, 24 22, 24 19 C24 16, 22 14, 20 12 Z" fill="#003300"/>
    `;
  } else if (tipo.includes('ACCIDENTE')) {
    return `
      <rect x="13" y="17" width="14" height="8" fill="#003300" rx="2"/>
      <path d="M15 17 L17 13 L23 13 L25 17" fill="#003300"/>
    `;
  } else if (tipo.includes('RESCATE')) {
    return `
      <circle cx="20" cy="14" r="3" fill="#003300"/>
      <path d="M20 17 L20 24 M16 20 L20 20 L24 17" stroke="#003300" stroke-width="2" fill="none"/>
    `;
  }
  
  return `
    <polygon points="20,10 26,26 14,26" fill="#003300" opacity="0.9"/>
  `;
}

function createHackerEmergencyIcon(tipo: string): L.Icon {
  const color = getEmergencyColor(tipo);
  const symbol = getEmergencySymbol(tipo);
  
  const svgString = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${tipo.replace(/\s+/g, '-')}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="16" fill="${color}" opacity="0.3"/>
      <circle cx="20" cy="20" r="14" fill="${color}" opacity="0.8" filter="url(#glow-${tipo.replace(/\s+/g, '-')})"/>
      ${symbol}
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgString)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
    className: `hacker-emergency-marker-icon emergency-${tipo.replace(/\s+/g, '-')}`,
  });
}

const iconCache: { [key: string]: L.Icon } = {};

function getEmergencyIcon(tipo: string): L.Icon {
  if (!iconCache[tipo]) {
    iconCache[tipo] = createHackerEmergencyIcon(tipo);
  }
  return iconCache[tipo];
}

export default function HackerMapContainer({
  cameras,
  emergencias,
  showCameras,
  showEmergencies,
  showCriminalResidences,
  criminalResidencesData,
  criminalResidencesFilter,
  emergencyFilter,
  onCameraClick,
  onEmergencyClick,
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // En modo hacker empieza en modo oscuro
  const center: [number, number] = [-12.0464, -77.0428];
  const zoom = 11;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="hacker-spinner"></div>
      </div>
    );
  }

  const lightTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        .hacker-map .leaflet-container {
          background: #000000;
          filter: brightness(0.8) contrast(1.3) saturate(1.5);
        }
        
        .hacker-map .leaflet-tile {
          filter: ${isDarkMode ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.2)' : 'none'};
        }
        
        .hacker-map .leaflet-popup-content-wrapper {
          background: rgba(0, 20, 0, 0.95);
          border: 2px solid #00ff41;
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
          color: #00ff41;
          font-family: 'Courier New', monospace;
        }
        
        .hacker-map .leaflet-popup-tip {
          background: rgba(0, 20, 0, 0.95);
          border: 1px solid #00ff41;
        }
        
        .hacker-map .leaflet-popup-content h3 {
          color: #00ff41 !important;
          text-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
          border-bottom: 1px solid #00ff41;
          padding-bottom: 5px;
        }
        
        .hacker-map .leaflet-popup-content p,
        .hacker-map .leaflet-popup-content span {
          color: #00ff41 !important;
        }
        
        .hacker-map .leaflet-popup-content .font-semibold {
          color: #00cc33 !important;
          font-weight: bold;
        }
        
        .hacker-map .leaflet-control-zoom-in,
        .hacker-map .leaflet-control-zoom-out {
          background: rgba(0, 20, 0, 0.8) !important;
          border: 1px solid #00ff41 !important;
          color: #00ff41 !important;
        }
        
        .hacker-map .leaflet-control-zoom-in:hover,
        .hacker-map .leaflet-control-zoom-out:hover {
          background: rgba(0, 255, 65, 0.2) !important;
        }
        
        .hacker-map .leaflet-bar {
          border: 2px solid #00ff41;
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
        
        .hacker-map .leaflet-control-attribution {
          background: rgba(0, 20, 0, 0.8) !important;
          color: #00ff41 !important;
          border: 1px solid #00ff41;
          font-family: 'Courier New', monospace;
          font-size: 10px;
        }
        
        .hacker-map .leaflet-control-attribution a {
          color: #00ff41 !important;
        }

        /* Estilos para clusters en modo hacker */
        .hacker-emergency-cluster {
          background-color: rgba(0, 255, 65, 0.3);
          border-radius: 50%;
          text-align: center;
          color: #00ff41;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          border: 3px solid #00ff41;
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.8);
        }

        .hacker-criminal-cluster {
          background-color: rgba(168, 85, 247, 0.3);
          border-radius: 50%;
          text-align: center;
          color: #a855f7;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          border: 3px solid #a855f7;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
        }
        
        .hacker-emergency-cluster div {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .hacker-criminal-cluster div {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        
        .hacker-emergency-cluster span {
          line-height: 1;
          text-shadow: 0 0 10px rgba(0, 255, 65, 1);
        }

        .hacker-criminal-cluster span {
          line-height: 1;
          text-shadow: 0 0 10px rgba(168, 85, 247, 1);
        }
        
        .marker-cluster-small.hacker-emergency-cluster {
          background-color: rgba(0, 255, 65, 0.4);
          border-width: 2px;
        }
        
        .marker-cluster-medium.hacker-emergency-cluster {
          background-color: rgba(0, 255, 65, 0.5);
          border-width: 3px;
        }
        
        .marker-cluster-large.hacker-emergency-cluster {
          background-color: rgba(0, 255, 65, 0.7);
          border-width: 4px;
          box-shadow: 0 0 30px rgba(0, 255, 65, 1);
        }

        .marker-cluster-small.hacker-criminal-cluster {
          background-color: rgba(168, 85, 247, 0.4);
          border-width: 2px;
        }

        .marker-cluster-medium.hacker-criminal-cluster {
          background-color: rgba(168, 85, 247, 0.5);
          border-width: 3px;
        }

        .marker-cluster-large.hacker-criminal-cluster {
          background-color: rgba(168, 85, 247, 0.7);
          border-width: 4px;
          box-shadow: 0 0 30px rgba(168, 85, 247, 1);
        }
      `}</style>

      {/* Botón de cambio de tema en estilo hacker */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 z-[1000] bg-black hover:bg-gray-900 text-green-400 font-mono font-semibold py-2 px-4 border-2 border-green-400 rounded shadow-lg transition-all hover:shadow-green-400"
        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        style={{ boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)' }}
      >
        {isDarkMode ? '[☀]' : '[🌙]'}
        <span className="hidden sm:inline ml-2">{isDarkMode ? 'LIGHT_MODE' : 'DARK_MODE'}</span>
      </button>
      
      <div className="hacker-map w-full h-full">
        <LeafletMap
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>'
            url={isDarkMode ? darkTileUrl : lightTileUrl}
          />

          <HackerCriminalResidencesLayer
            showCriminalResidences={showCriminalResidences}
            criminalResidencesFilter={criminalResidencesFilter}
          />

          {/* Marcadores de cámaras (sin clustering) */}
          {showCameras &&
            cameras.map((camera) => (
              <Marker
                key={camera.id}
                position={[camera.latitud, camera.longitud]}
                icon={hackerCameraIcon}
                eventHandlers={{
                  click: () => onCameraClick?.(camera),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold mb-2">[CÁMARA] {camera.nombre}</h3>
                    <p className="text-sm mb-1">
                      <span className="font-semibold">UBICACIÓN:</span> {camera.ubicacion}
                    </p>
                    {camera.direccion && (
                      <p className="text-sm mb-1">
                        <span className="font-semibold">DIRECCIÓN:</span> {camera.direccion}
                      </p>
                    )}
                    <p className="text-sm mb-1">
                      <span className="font-semibold">TIPO:</span> {camera.tipo}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">ESTADO:</span> {camera.estado}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Marcadores de emergencias con clustering */}
          {showEmergencies && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={30}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={true}
              zoomToBoundsOnClick={true}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                let size = 'small';
                if (count >= 10) size = 'large';
                else if (count >= 5) size = 'medium';
                
                return L.divIcon({
                  html: `<div><span>[${count}]</span></div>`,
                  className: `marker-cluster marker-cluster-${size} hacker-emergency-cluster`,
                  iconSize: L.point(40, 40),
                });
              }}
            >
              {emergencias
                .filter((e) => e.coordenadas && (!emergencyFilter || emergencyFilter.has(e.tipoEmergencia)))
                .map((emergencia) => (
                  <Marker
                    key={emergencia.id}
                    position={[emergencia.coordenadas!.latitud, emergencia.coordenadas!.longitud]}
                    icon={getEmergencyIcon(emergencia.tipoEmergencia)}
                    eventHandlers={{
                      click: () => onEmergencyClick?.(emergencia),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold mb-2">[EMERGENCIA] {emergencia.tipoEmergencia}</h3>
                        <p className="text-sm mb-1">
                          <span className="font-semibold">FENÓMENO:</span> {emergencia.fenomeno}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-semibold">FECHA:</span>{' '}
                          {new Date(emergencia.fecha).toLocaleDateString('es-PE')} {new Date(emergencia.fecha).toLocaleTimeString('es-PE')}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-semibold">UBICACIÓN:</span> {emergencia.ubicacion.distrito},{' '}
                          {emergencia.ubicacion.provincia}
                        </p>
                        {emergencia.descripcion && (
                          <p className="text-sm mb-1">
                            <span className="font-semibold">DESC:</span> {emergencia.descripcion}
                          </p>
                        )}
                        {emergencia.afectados && (
                          <div className="text-sm mt-2 border-t border-green-500 pt-2">
                            <p className="font-semibold">AFECTADOS:</p>
                            {emergencia.afectados.fallecidos && (
                              <p>Fallecidos: {emergencia.afectados.fallecidos}</p>
                            )}
                            {emergencia.afectados.heridos && <p>Heridos: {emergencia.afectados.heridos}</p>}
                            {emergencia.afectados.damnificados && (
                              <p>Damnificados: {emergencia.afectados.damnificados}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}
        </LeafletMap>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Emergencia } from '@/types';

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
  emergencyFilter?: Set<string>; // Tipos de emergencias a mostrar
  onCameraClick?: (camera: Camera) => void;
  onEmergencyClick?: (emergencia: Emergencia) => void;
}

// Iconos de alto contraste para cámaras
const cameraIcon = new L.Icon({
  iconUrl: '/icons/camera-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
  className: 'camera-marker-icon',
});

// Mapa de colores por categoría de emergencia
const emergencyColorMap: { [key: string]: string } = {
  // Bomberos
  'EMERGENCIA MEDICA': '#FF6B6B', // Rojo brillante
  'INCENDIO': '#FF8C00', // Naranja
  'ACCIDENTE VEHICULAR': '#FFD700', // Oro/Amarillo
  'ACCIDENTE DE TRANSITO': '#FFD700',
  'RESCATE': '#1E90FF', // Azul
  'MATERIALES PELIGROSOS': '#9932CC', // Morado
  'INCENDIO URBANO': '#FF8C00',
  'SERVICIO ESPECIAL': '#00CED1', // Turquesa
  // INDECI - Fenómenos naturales
  'LLUVIA INTENSA': '#4169E1', // Azul real
  'DESLIZAMIENTO': '#8B4513', // Marrón
  'INUNDACION': '#20B2AA', // Agua/Turquesa oscuro
  'SISMO': '#DC143C', // Rojo oscuro
  'HELADA': '#87CEEB', // Azul cielo
  'SEQUIA': '#DAA520', // Dorado oscuro
  'INCENDIO FORESTAL': '#FF4500', // Naranja rojo
  'VANDALISMO': '#696969', // Gris oscuro
  'ACCIDENTE': '#FFD700', // Oro
  'OTRO': '#808080', // Gris
};

/**
 * Obtiene el color para un tipo de emergencia
 */
function getEmergencyColor(tipo: string): string {
  // Buscar coincidencia exacta primero
  if (emergencyColorMap[tipo]) {
    return emergencyColorMap[tipo];
  }
  
  // Buscar coincidencia parcial
  for (const [key, color] of Object.entries(emergencyColorMap)) {
    if (tipo.includes(key)) {
      return color;
    }
  }
  
  // Color por defecto (rojo)
  return '#FF6B6B';
}

/**
 * Obtiene el símbolo SVG apropiado para cada tipo de emergencia
 */
function getEmergencySymbol(tipo: string): string {
  // Bomberos
  if (tipo.includes('EMERGENCIA MEDICA')) {
    // Cruz médica
    return `
      <rect x="18" y="12" width="4" height="16" fill="white" rx="1"/>
      <rect x="12" y="18" width="16" height="4" fill="white" rx="1"/>
    `;
  } else if (tipo.includes('INCENDIO')) {
    // Llama de fuego
    return `
      <path d="M20 12 C18 14, 16 16, 16 19 C16 22, 17.5 24, 20 24 C22.5 24, 24 22, 24 19 C24 16, 22 14, 20 12 Z" fill="white"/>
      <path d="M20 15 C19 16, 18.5 17, 18.5 18.5 C18.5 20, 19 21, 20 21 C21 21, 21.5 20, 21.5 18.5 C21.5 17, 21 16, 20 15 Z" fill="${getEmergencyColor(tipo)}" opacity="0.3"/>
    `;
  } else if (tipo.includes('ACCIDENTE VEHICULAR') || tipo.includes('ACCIDENTE DE TRANSITO') || tipo.includes('ACCIDENTE')) {
    // Auto
    return `
      <rect x="13" y="17" width="14" height="8" fill="white" rx="2"/>
      <path d="M15 17 L17 13 L23 13 L25 17" fill="white"/>
      <circle cx="16" cy="26" r="2" fill="white"/>
      <circle cx="24" cy="26" r="2" fill="white"/>
    `;
  } else if (tipo.includes('RESCATE')) {
    // Persona + brazo ayudando
    return `
      <circle cx="20" cy="14" r="3" fill="white"/>
      <path d="M20 17 L20 24 M16 20 L20 20 L24 17" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
    `;
  } else if (tipo.includes('MATERIALES PELIGROSOS')) {
    // Símbolo de peligro químico
    return `
      <polygon points="20,11 27,24 13,24" fill="none" stroke="white" stroke-width="2.5"/>
      <text x="20" y="23" font-size="12" font-weight="bold" fill="white" text-anchor="middle">!</text>
    `;
  } else if (tipo.includes('SERVICIO ESPECIAL')) {
    // Engranaje
    return `
      <circle cx="20" cy="20" r="5" fill="white"/>
      <circle cx="20" cy="20" r="3" fill="${getEmergencyColor(tipo)}"/>
      <rect x="19" y="12" width="2" height="4" fill="white"/>
      <rect x="19" y="24" width="2" height="4" fill="white"/>
      <rect x="12" y="19" width="4" height="2" fill="white"/>
      <rect x="24" y="19" width="4" height="2" fill="white"/>
    `;
  }
  // INDECI - Fenómenos naturales
  else if (tipo.includes('LLUVIA INTENSA') || tipo.includes('TORMENTA')) {
    // Nube con lluvia
    return `
      <path d="M12 18 Q12 14 16 14 Q17 12 20 12 Q24 12 24 16 Q28 16 28 20" fill="white" stroke="white" stroke-width="1"/>
      <line x1="14" y1="22" x2="12" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="22" x2="18" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="26" y1="22" x2="24" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (tipo.includes('DESLIZAMIENTO') || tipo.includes('DERRUMBE')) {
    // Montaña/Tierra cayendo
    return `
      <polygon points="12,20 20,10 28,20 24,20 24,28 16,28 16,20" fill="white"/>
      <polygon points="13,21 18,15 23,21" fill="white" opacity="0.7"/>
    `;
  } else if (tipo.includes('INUNDACION')) {
    // Onda de agua
    return `
      <path d="M12 20 Q14 18 16 20 T20 20 T24 20 T28 20" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M12 24 Q14 22 16 24 T20 24 T24 24 T28 24" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="10" y="26" width="20" height="2" fill="white" opacity="0.8"/>
    `;
  } else if (tipo.includes('SISMO') || tipo.includes('TERREMOTO')) {
    // Ondas sísmicas
    return `
      <circle cx="20" cy="20" r="3" fill="white"/>
      <path d="M16 20 L13 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M24 20 L27 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 13 L20 10" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 27 L20 30" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (tipo.includes('HELADA') || tipo.includes('FRIO')) {
    // Copo de nieve
    return `
      <path d="M20 10 L20 30 M10 20 L30 20 M14 14 L26 26 M26 14 L14 26" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="20" cy="20" r="2" fill="white"/>
    `;
  } else if (tipo.includes('SEQUIA') || tipo.includes('DÉFICIT HÍDRICO')) {
    // Tierra seca/Grieta
    return `
      <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="1.5"/>
      <path d="M20 12 L20 28 M15 17 L25 23 M15 23 L25 17" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
  } else if (tipo.includes('INCENDIO FORESTAL')) {
    // Árbol en llamas
    return `
      <path d="M20 12 L15 22 L17 22 L12 28 L20 24 L28 28 L23 22 L25 22 Z" fill="white"/>
      <path d="M20 16 L18 21 L20 20 L22 21 Z" fill="${getEmergencyColor(tipo)}" opacity="0.5"/>
    `;
  } else if (tipo.includes('VANDALISMO')) {
    // Mano
    return `
      <path d="M16 28 L16 18 L20 14 L20 28 M20 16 L24 18 L24 28 M14 20 L18 20 M14 24 L18 24" stroke="white" stroke-width="2" fill="white" stroke-linejoin="round"/>
    `;
  }
  
  // Por defecto: alerta genérica
  return `
    <polygon points="20,10 26,26 14,26" fill="white" opacity="0.9"/>
    <circle cx="20" cy="28" r="1.5" fill="white"/>
  `;
}

/**
 * Crea un icono SVG dinámico para una emergencia
 */
function createEmergencyIcon(tipo: string): L.Icon {
  const color = getEmergencyColor(tipo);
  const symbol = getEmergencySymbol(tipo);
  
  const svgString = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="16" fill="${color}" filter="url(#shadow)"/>
      <circle cx="20" cy="20" r="14" fill="${color}" opacity="0.9"/>
      ${symbol}
    </svg>
  `;

  const icon = new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
    className: `emergency-marker-icon emergency-${tipo.replace(/\s+/g, '-')}`,
  });

  return icon;
}

// Cache de iconos para evitar recrearlos
const iconCache: { [key: string]: L.Icon } = {};

function getEmergencyIcon(tipo: string): L.Icon {
  if (!iconCache[tipo]) {
    iconCache[tipo] = createEmergencyIcon(tipo);
  }
  return iconCache[tipo];
}

export default function MapComponent({
  cameras,
  emergencias,
  showCameras,
  showEmergencies,
  emergencyFilter,
  onCameraClick,
  onEmergencyClick,
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Lima coordinates (centro aproximado)
  const center: [number, number] = [-12.0464, -77.0428];
  const zoom = 11;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <LeafletMap
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marcadores de cámaras */}
      {showCameras &&
        cameras.map((camera) => (
          <Marker
            key={camera.id}
            position={[camera.latitud, camera.longitud]}
            icon={cameraIcon}
            eventHandlers={{
              click: () => onCameraClick?.(camera),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-700 mb-2">{camera.nombre}</h3>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Ubicación:</span> {camera.ubicacion}
                </p>
                {camera.direccion && (
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Dirección:</span> {camera.direccion}
                  </p>
                )}
                <p className="text-sm mb-1">
                  <span className="font-semibold">Tipo:</span> {camera.tipo}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Estado:</span>{' '}
                  <span
                    className={
                      camera.estado === 'Operativo'
                        ? 'text-green-600'
                        : camera.estado === 'No Operativo'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }
                  >
                    {camera.estado}
                  </span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Marcadores de emergencias */}
      {showEmergencies &&
        emergencias
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
                  <h3 className="font-bold text-red-700 mb-2">{emergencia.tipoEmergencia}</h3>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Fenómeno:</span> {emergencia.fenomeno}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Fecha:</span>{' '}
                    {new Date(emergencia.fecha).toLocaleDateString('es-PE')} {new Date(emergencia.fecha).toLocaleTimeString('es-PE')}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-semibold">Ubicación:</span> {emergencia.ubicacion.distrito},{' '}
                    {emergencia.ubicacion.provincia}
                  </p>
                  {emergencia.descripcion && (
                    <p className="text-sm mb-1">
                      <span className="font-semibold">Descripción:</span> {emergencia.descripcion}
                    </p>
                  )}
                  {emergencia.afectados && (
                    <div className="text-sm mt-2 border-t pt-2">
                      <p className="font-semibold">Afectados:</p>
                      {emergencia.afectados.fallecidos && (
                        <p>Fallecidos: {emergencia.afectados.fallecidos}</p>
                      )}
                      {emergencia.afectados.heridos && <p>Heridos: {emergencia.afectados.heridos}</p>}
                      {emergencia.afectados.damnificados && (
                        <p>Damnificados: {emergencia.afectados.damnificados}</p>
                      )}
                    </div>
                  )}
                  {emergencia.codigoSinpad && !emergencia.codigoSinpad.startsWith('INDECI-') && (
                    <a
                      href={`https://sgonorte.bomberosperu.gob.pe/24horas/Home/Map?numparte=${emergencia.codigoSinpad}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      <p className='block mt-3 text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm'>
                        🚒 Ver en Bomberos Perú
                      </p>
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
    </LeafletMap>
  );
}

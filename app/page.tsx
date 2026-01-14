'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Camera, Emergencia } from '@/types';
import { getCameras } from '@/services/camerasService';
import { getEmergencias } from '@/services/indeciService';
import Dashboard from '@/components/Dashboard/Dashboard';
import CameraViewer from '@/components/CameraViewer/CameraViewer';

// Importar MapContainer dinámicamente para evitar problemas de SSR con Leaflet
const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="spinner"></div>
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [emergencyFilter, setEmergencyFilter] = useState<Set<string> | undefined>(undefined); // undefined = mostrar todo
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [konamiKeys, setKonamiKeys] = useState<string[]>([]);

  // Detector del código Konami
  useEffect(() => {
    const konamiCode = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      setKonamiKeys(prev => {
        const newKeys = [...prev, e.key];
        const lastKeys = newKeys.slice(-konamiCode.length);
        
        // Verificar si coincide con el código Konami
        const isMatch = lastKeys.every((key, index) => 
          key.toLowerCase() === konamiCode[index].toLowerCase()
        );
        
        if (isMatch) {
          // ¡Código Konami activado!
          router.push('/hacker');
          return [];
        }
        
        // Mantener solo los últimos 10 keys
        return newKeys.slice(-10);
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [camerasData, emergenciasData] = await Promise.all([
          getCameras(),
          getEmergencias(),
        ]);
        setCameras(camerasData);
        setEmergencias(emergenciasData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleToggleCameras = () => {
    setShowCameras(!showCameras);
  };

  const handleToggleEmergencies = () => {
    setShowEmergencies(!showEmergencies);
  };

  const handleCameraClick = (camera: Camera) => {
    setSelectedCamera(camera);
  };

  const handleCloseCameraViewer = () => {
    setSelectedCamera(null);
  };

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg z-20">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl" role="img" aria-label="Bandera de Perú">&#x1F1F5;&#x1F1EA;</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Alerta Perú</h1>
              <p className="text-xs sm:text-sm text-red-100 hidden sm:block">Cámaras Públicas y Reportes de Emergencias</p>
            </div>
          </div>
          <button
            onClick={handleToggleSidebar}
            className="lg:hidden bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
          >
            {showSidebar ? 'Ocultar' : 'Panel'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-10 w-full sm:w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto transition-transform duration-300 h-full`}
        >
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : (
              <Dashboard
                cameras={cameras}
                emergencias={emergencias}
                showCameras={showCameras}
                showEmergencies={showEmergencies}
                onToggleCameras={handleToggleCameras}
                onToggleEmergencies={handleToggleEmergencies}
                onEmergencyFilterChange={setEmergencyFilter}
              />
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              cameras={cameras}
              emergencias={emergencias}
              showCameras={showCameras}
              showEmergencies={showEmergencies}
              emergencyFilter={emergencyFilter}
              onCameraClick={handleCameraClick}
            />
          )}

          {/* Legend */}
          <div className="absolute bottom-2 sm:bottom-6 right-2 sm:right-6 bg-white rounded-lg shadow-lg p-2 sm:p-4 z-10 max-w-xs">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-xs sm:text-sm">Leyenda</h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              {showCameras && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-700">Cámaras de tráfico</span>
                </div>
              )}
              {showEmergencies && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#FF6B6B'}}></div>
                    <span className="text-gray-700">Emergencia médica</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#FF8C00'}}></div>
                    <span className="text-gray-700">Incendios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#FFD700'}}></div>
                    <span className="text-gray-700">Accidentes vehiculares</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#1E90FF'}}></div>
                    <span className="text-gray-700">Rescates / Lluvias</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#8B4513'}}></div>
                    <span className="text-gray-700">Deslizamientos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{backgroundColor: '#9932CC'}}></div>
                    <span className="text-gray-700">Mat. peligrosos</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Banner */}
          {showInfoBanner && (
            <div className="absolute top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-white rounded-lg shadow-lg px-3 py-2 sm:px-6 sm:py-3 z-10 max-w-2xl">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-700 text-center flex-1">
                  <span className="font-semibold text-blue-600">Nota:</span> Los datos mostrados
                  provienen de fuentes públicas. Para accesos mas detallados, como camaras de la Municipalidad de Lima u otras instituciones, visite{' '}
                  <a
                    href="https://www.datosabiertos.gob.pe/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    datosabiertos.gob.pe
                  </a>
                </p>
                <button
                  onClick={() => setShowInfoBanner(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label="Cerrar banner"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Camera Viewer Modal */}
      <CameraViewer camera={selectedCamera} onClose={handleCloseCameraViewer} />

      {/* Footer (visible on larger screens) */}
      <footer className="hidden lg:block bg-gray-800 text-white text-center py-2 text-sm z-20">
        <p>
          Datos de{' '}
          <a
            href="https://portal.bomberosperu.gob.pe/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400"
          >
            Bomberos Perú
          </a>
          {' '}e{' '}
          <a
            href="https://www.indeci.gob.pe/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400"
          >
            INDECI
          </a>
        </p>
      </footer>
    </div>
  );
}

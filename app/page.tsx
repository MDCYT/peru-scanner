'use client';

import { useEffect, useState } from 'react';
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
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [emergencyFilter, setEmergencyFilter] = useState<Set<string> | undefined>(undefined); // undefined = mostrar todo
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl">🇵🇪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Peru Scanner</h1>
              <p className="text-sm text-red-100">Cámaras Públicas y Reportes de Emergencias</p>
            </div>
          </div>
          <button
            onClick={handleToggleSidebar}
            className="lg:hidden bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
          >
            {showSidebar ? 'Ocultar Panel' : 'Mostrar Panel'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-10 w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto transition-transform duration-300 h-full`}
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
          <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 z-10">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Leyenda</h3>
            <div className="space-y-2 text-sm">
              {showCameras && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Cámaras Públicas</span>
                </div>
              )}
              {showEmergencies && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Emergencias</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-6 py-3 z-10 max-w-2xl">
            <p className="text-sm text-gray-700 text-center">
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
          </div>
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

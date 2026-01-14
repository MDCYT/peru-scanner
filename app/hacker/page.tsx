'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Camera, Emergencia } from '@/types';
import { getCameras } from '@/services/camerasService';
import { getEmergencias } from '@/services/indeciService';
import Dashboard from '@/components/Dashboard/Dashboard';
import CameraViewer from '@/components/CameraViewer/CameraViewer';

const MapContainer = dynamic(() => import('@/components/Map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="hacker-spinner"></div>
    </div>
  ),
});

export default function HackerMode() {
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [emergencyFilter, setEmergencyFilter] = useState<Set<string> | undefined>(undefined);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [terminalText, setTerminalText] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // Efecto de texto escribiéndose
  useEffect(() => {
    const messages = [
      'INICIANDO SISTEMA DE VIGILANCIA...',
      'CONECTANDO A RED NEURONAL...',
      'ACCESO CONCEDIDO: NIVEL MÁXIMO',
      'CARGANDO DATOS CLASIFICADOS...',
    ];
    
    let messageIndex = 0;
    let charIndex = 0;
    
    const typeWriter = setInterval(() => {
      if (messageIndex < messages.length) {
        if (charIndex < messages[messageIndex].length) {
          setTerminalText(prev => prev + messages[messageIndex][charIndex]);
          charIndex++;
        } else {
          setTerminalText(prev => prev + '\n');
          messageIndex++;
          charIndex = 0;
        }
      } else {
        clearInterval(typeWriter);
        setTimeout(() => setAuthenticated(true), 500);
      }
    }, 50);

    return () => clearInterval(typeWriter);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    
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
  }, [authenticated]);

  const handleToggleCameras = () => setShowCameras(!showCameras);
  const handleToggleEmergencies = () => setShowEmergencies(!showEmergencies);
  const handleCameraClick = (camera: Camera) => setSelectedCamera(camera);
  const handleCloseCameraViewer = () => setSelectedCamera(null);
  const handleToggleSidebar = () => setShowSidebar(!showSidebar);
  const exitHackerMode = () => router.push('/');

  if (!authenticated) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
        <div className="matrix-bg"></div>
        <div className="relative z-10 w-full max-w-3xl px-4">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-green-400 text-xs font-mono">root@alertaperu:~#</div>
            </div>
            <div className="terminal-body">
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
{terminalText}
                <span className="terminal-cursor">▊</span>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden hacker-theme">
      <style jsx global>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
        }

        .matrix-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          overflow: hidden;
          z-index: 0;
        }

        .matrix-bg::before {
          content: '01010101 01001000 01000001 01000011 01001011 01000101 01010010';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 200%;
          color: rgba(0, 255, 65, 0.1);
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.5;
          animation: matrix-fall 20s linear infinite;
          word-wrap: break-word;
        }

        .hacker-theme {
          background: #000000;
          color: #00ff41;
          font-family: 'Courier New', monospace;
        }

        .terminal-window {
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #00ff41;
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
          overflow: hidden;
        }

        .terminal-header {
          background: rgba(0, 255, 65, 0.1);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #00ff41;
        }

        .terminal-body {
          padding: 20px;
          min-height: 300px;
          max-height: 500px;
          overflow-y: auto;
        }

        .terminal-cursor {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .hacker-spinner {
          border: 3px solid rgba(0, 255, 65, 0.1);
          border-radius: 50%;
          border-top-color: #00ff41;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: rgba(0, 255, 65, 0.3);
          animation: scan-line 4s linear infinite;
          z-index: 100;
          pointer-events: none;
        }

        .glitch-text {
          animation: glitch 0.3s infinite;
        }

        .neon-border {
          border: 1px solid #00ff41;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5), inset 0 0 10px rgba(0, 255, 65, 0.2);
        }

        .hacker-button {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid #00ff41;
          color: #00ff41;
          transition: all 0.3s;
        }

        .hacker-button:hover {
          background: rgba(0, 255, 65, 0.2);
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
      `}</style>

      <div className="scan-line"></div>
      <div className="matrix-bg"></div>

      {/* Header */}
      <header className="bg-black border-b-2 border-green-500 text-green-400 shadow-lg z-20 relative">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 bg-opacity-20 border border-green-500 rounded flex items-center justify-center">
              <span className="text-xl sm:text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold font-mono glitch-text">ALERTA PERÚ [CLASSIFIED]</h1>
              <p className="text-xs sm:text-sm text-green-300 hidden sm:block font-mono">SISTEMA DE VIGILANCIA NIVEL 5 // ACCESO RESTRINGIDO</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exitHackerMode}
              className="hacker-button px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-mono"
              title="Salir del modo hacker"
            >
              EXIT
            </button>
            <button
              onClick={handleToggleSidebar}
              className="lg:hidden hacker-button px-2 py-1 sm:px-4 sm:py-2 rounded transition-colors text-xs sm:text-sm font-mono"
            >
              {showSidebar ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-10 w-full sm:w-80 bg-black border-r-2 border-green-500 overflow-y-auto transition-transform duration-300 h-full`}
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(0,20,0,0.98) 100%)',
          }}
        >
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="hacker-spinner"></div>
              </div>
            ) : (
              <div className="hacker-dashboard">
                <Dashboard
                  cameras={cameras}
                  emergencias={emergencias}
                  showCameras={showCameras}
                  showEmergencies={showEmergencies}
                  onToggleCameras={handleToggleCameras}
                  onToggleEmergencies={handleToggleEmergencies}
                  onEmergencyFilterChange={setEmergencyFilter}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="hacker-spinner mx-auto mb-4"></div>
                <p className="text-green-400 font-mono">DESCARGANDO DATOS CLASIFICADOS...</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <div className="absolute inset-0" style={{ filter: 'hue-rotate(90deg) saturate(1.5)' }}>
                <MapContainer
                  cameras={cameras}
                  emergencias={emergencias}
                  showCameras={showCameras}
                  showEmergencies={showEmergencies}
                  emergencyFilter={emergencyFilter}
                  onCameraClick={handleCameraClick}
                />
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-2 sm:bottom-6 right-2 sm:right-6 neon-border bg-black bg-opacity-90 rounded-lg p-2 sm:p-4 z-10 max-w-xs">
            <h3 className="font-bold text-green-400 mb-2 sm:mb-3 text-xs sm:text-sm font-mono">[LEYENDA]</h3>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-mono">
              {showCameras && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  <span className="text-green-300">CÁMARAS ACTIVAS</span>
                </div>
              )}
              {showEmergencies && (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{backgroundColor: '#FF6B6B'}}></div>
                    <span className="text-green-300">EMERGENCIA MÉDICA</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(255,140,0,0.8)]" style={{backgroundColor: '#FF8C00'}}></div>
                    <span className="text-green-300">INCENDIOS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(255,215,0,0.8)]" style={{backgroundColor: '#FFD700'}}></div>
                    <span className="text-green-300">ACCIDENTES</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(30,144,255,0.8)]" style={{backgroundColor: '#1E90FF'}}></div>
                    <span className="text-green-300">RESCATES/LLUVIAS</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Banner */}
          {showInfoBanner && (
            <div className="absolute top-2 sm:top-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 neon-border bg-black bg-opacity-90 rounded-lg px-3 py-2 sm:px-6 sm:py-3 z-10 max-w-2xl">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs sm:text-sm text-green-300 text-center flex-1 font-mono">
                  <span className="font-bold text-green-400">[CLASIFICADO]</span> Acceso a red de vigilancia nacional.
                  Datos de fuentes públicas encriptadas. Nivel de seguridad: MÁXIMO
                </p>
                <button
                  onClick={() => setShowInfoBanner(false)}
                  className="text-green-500 hover:text-green-300 transition-colors flex-shrink-0"
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

      {/* Footer */}
      <footer className="hidden lg:block bg-black border-t-2 border-green-500 text-green-400 text-center py-2 text-sm z-20 font-mono">
        <p>
          SISTEMA CLASIFICADO // BOMBEROS PERÚ + INDECI // UNAUTHORIZED ACCESS FORBIDDEN
        </p>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera } from '@/types';
import { X } from 'lucide-react';

interface CameraViewerProps {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraViewer({ camera, onClose }: CameraViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hlsError, setHlsError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const isM3U8 = !!camera?.urlStream && camera.urlStream.includes('.m3u8');

  // Obtener sessionId para cámaras especiales de SkylineWebcams
  useEffect(() => {
    async function fetchSkylineSession() {
      if (!camera?.specialCamera || camera.specialCamera.provider !== 'SkylineWebcams') {
        setStreamUrl(camera?.urlStream || null);
        return;
      }

      setIsLoadingSession(true);
      try {
        const response = await fetch(
          `/api/get-skyline-session?url=${encodeURIComponent(camera.specialCamera.url)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.sessionId && camera.urlStream) {
            // Reemplazar o agregar el parámetro 'a' con el nuevo sessionId
            const url = new URL(camera.urlStream, window.location.origin);
            url.searchParams.set('a', data.sessionId);
            setStreamUrl(url.toString().replace(window.location.origin, ''));
          } else {
            setStreamUrl(camera.urlStream || null);
          }
        } else {
          console.warn('Failed to fetch Skyline session, using default URL');
          setStreamUrl(camera.urlStream || null);
        }
      } catch (error) {
        console.error('Error fetching Skyline session:', error);
        setStreamUrl(camera.urlStream || null);
      } finally {
        setIsLoadingSession(false);
      }
    }

    fetchSkylineSession();
  }, [camera?.id, camera?.urlStream, camera?.specialCamera]);

  useEffect(() => {
    setHlsError(null);

    if (!isM3U8 || !streamUrl) return;

    const video = videoRef.current;
    if (!video) return;

    // Safari tiene soporte HLS nativo
    const canPlayNative = video.canPlayType('application/vnd.apple.mpegurl');
    if (canPlayNative) {
      video.src = streamUrl;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Configuraciones conservadoras para mayor estabilidad
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setHlsError(`Error HLS: ${data.type}`);
          try {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          } catch (_) {
            // noop
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else {
      setHlsError('Este navegador no soporta HLS.js');
    }
  }, [streamUrl, isM3U8]);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{camera.nombre}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Información de la cámara */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Ubicación</h3>
                <p className="text-gray-600">{camera.ubicacion}</p>
                {camera.direccion && <p className="text-gray-600 text-sm">{camera.direccion}</p>}
                {camera.distrito && (
                  <p className="text-gray-600 text-sm">Distrito: {camera.distrito}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Información</h3>
                <p className="text-gray-600 text-sm">Tipo: {camera.tipo}</p>
                <p className="text-gray-600 text-sm">
                  Estado:{' '}
                  <span
                    className={
                      camera.estado === 'Operativo'
                        ? 'text-green-600 font-semibold'
                        : camera.estado === 'No Operativo'
                        ? 'text-red-600 font-semibold'
                        : 'text-yellow-600 font-semibold'
                    }
                  >
                    {camera.estado}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  Coordenadas: {camera.latitud.toFixed(4)}, {camera.longitud.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Área del feed de video */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Feed en Vivo</h3>
            {isLoadingSession ? (
              <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center" style={{ paddingTop: '56.25%' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Obteniendo sesión de SkylineWebcams...</p>
                  </div>
                </div>
              </div>
            ) : camera.urlStream ? (
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                {isM3U8 ? (
                  <video
                    ref={videoRef}
                    className="absolute top-0 left-0 w-full h-full"
                    controls
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <iframe
                    src={streamUrl || camera.urlStream}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={`Stream de ${camera.nombre}`}
                  />
                )}
                {hlsError && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-sm p-2">
                    {hlsError}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-12 text-center">
                <div className="mb-4">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Feed de video no disponible
                </h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  El acceso al stream de video en vivo de esta cámara requiere permisos especiales o
                  no está disponible públicamente. Por favor, contacte a la Municipalidad de Lima para
                  más información sobre el acceso a los feeds de video.
                </p>
                <div className="mt-6">
                  <a
                    href="http://protransito.munlima.gob.pe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver en ProTransito
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

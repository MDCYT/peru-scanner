import axios from 'axios';
import { Camera } from '@/types';

const EXTERNAL_CAMERAS_URL = 'https://api.mdcdev.me/v2/peru/cameras';

/**
 * Obtiene información de una cámara específica
 */
export async function getCameraById(id: string): Promise<Camera | null> {
  try {
    const cameras = await getCameras();
    return cameras.find(camera => camera.id === id) || null;
  } catch (error) {
    console.error('Error al obtener cámara:', error);
    return null;
  }
}

/**
 * Obtiene cámaras desde la API externa
 */
export async function getCameras(): Promise<Camera[]> {
  try {
    const response = await fetch(EXTERNAL_CAMERAS_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Cameras API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();
    const camerasArray = apiResponse.data || [];

    if (!apiResponse.success || camerasArray.length === 0) {
      console.log('No hay cámaras disponibles desde la API');
      return [];
    }

    console.log(`${camerasArray.length} cámaras obtenidas desde API externa`);

    // Mapear cámaras de la API al formato interno
    return camerasArray.map((cam: any) => ({
      id: cam.id,
      nombre: cam.nombre,
      ubicacion: cam.ubicacion,
      direccion: cam.direccion,
      latitud: cam.latitud,
      longitud: cam.longitud,
      estado: cam.estado,
      tipo: cam.tipo,
      distrito: cam.distrito,
      zona: cam.zona,
      // Para cámaras con specialCamera.provider === 'SkylineWebcams', ignorar proxy
      urlStream: cam.specialCamera?.provider === 'SkylineWebcams'
        ? 'https://hd-auth.skylinewebcams.com/live.m3u8' // URL original de Skyline
        : cam.proxyStream, // Usar proxy para el resto
      specialCamera: cam.specialCamera,
    }));
  } catch (error) {
    console.error('Error al obtener cámaras desde API externa:', error);
    return [];
  }
}

import axios from 'axios';
import { Emergencia, HeatmapPoint, CrimeType, Earthquake } from '@/types';

// URL de la API de datos abiertos de Perú para INDECI
const INDECI_API_BASE = 'http://www.datosabiertos.gob.pe/api/3/action';
const EMERGENCIAS_DATASET_ID = '33c2e284-2699-4599-b9d1-6b972fdbbdf5';

/**
 * Obtiene la información del dataset de emergencias
 */
export async function getEmergenciasDatasetInfo() {
  try {
    const url = `${INDECI_API_BASE}/package_show?id=${EMERGENCIAS_DATASET_ID}`;
    const response = await axios.get(url);
    return response.data.result;
  } catch (error) {
    console.error('Error al obtener información del dataset:', error);
    return null;
  }
}

function getEarthquakeYear(quake: Earthquake): string | null {
  const dateString = quake.local_date || quake.utc_date || quake.datetime_utc || null;
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear().toString();
}

function applyEarthquakeMapFallbacks(quake: Earthquake): Earthquake {
  const year = getEarthquakeYear(quake);
  const reportNumber = quake.report_number;

  if (!year || !reportNumber) return quake;

  const fallbackSeismic = `https://www.igp.gob.pe/mapas-tematicos/${year}/${reportNumber}/sismo.png`;
  const fallbackAccelerometric = `https://www.igp.gob.pe/mapas-tematicos/${year}/${reportNumber}/pga.png`;

  return {
    ...quake,
    seismic_map_url: quake.seismic_map_url || fallbackSeismic,
    accelerometric_map_url: quake.accelerometric_map_url || fallbackAccelerometric,
  };
}

/**
 * Obtiene todas las emergencias disponibles
 */
export async function getEmergencias(): Promise<Emergencia[]> {
  try {
    // Obtener emergencias de ambas fuentes
    const todas = await getTodasEmergencias();
    return todas;
  } catch (error) {
    console.error('Error al obtener emergencias:', error);
    return [];
  }
}

/**
 * Obtiene emergencias de los bomberos en las últimas 24 horas
 */
export async function getBomberos24Horas(): Promise<Emergencia[]> {
  try {
    const response = await fetch('https://api.mdcdev.me/v2/peru/bomberos/incidentes', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`Bomberos API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();
    
    // La API puede devolver data o emergencias, permitir ambos formatos
    const emergenciasArray = apiResponse.data || apiResponse.emergencias || [];
    
    if (!apiResponse.success || emergenciasArray.length === 0) {
      console.log('No hay emergencias de bomberos disponibles');
      return [];
    }

    console.log(`Processing ${emergenciasArray.length} bomberos emergencies from ${apiResponse.source || 'unknown'}`);

    // Transformar emergencias de bomberos al formato Emergencia
    return emergenciasArray.map((emerg: any) => {
      const latitud = typeof emerg.latitude === 'number' ? emerg.latitude : parseFloat(emerg.latitude);
      const longitud = typeof emerg.longitude === 'number' ? emerg.longitude : parseFloat(emerg.longitude);

      return {
        id: emerg.id || emerg.report_number,
        codigoSinpad: emerg.report_number,
        tipoEmergencia: emerg.type || 'Emergencia',
        fenomeno: emerg.type || 'Reporte de bomberos',
        fecha: emerg.occurred_at || new Date().toISOString(),
        ubicacion: {
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: emerg.district || 'Sin especificar',
          direccion: emerg.location,
        },
        coordenadas:
          Number.isFinite(latitud) && Number.isFinite(longitud)
            ? {
                latitud,
                longitud,
              }
            : undefined,
        descripcion: `Reporte ${emerg.report_number || emerg.id}`,
        estado: 'Activo',
        fuente: 'bomberos',
      };
    });
  } catch (error) {
    console.error('Error al obtener emergencias de bomberos:', error);
    return [];
  }
}

/**
 * Obtiene emergencias de INDECI en las últimas 24 horas
 */
export async function getIndeci24Horas(): Promise<Emergencia[]> {
  try {
    const response = await fetch('https://api.mdcdev.me/v2/peru/indeci/incidentes', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`INDECI API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();
    
    const emergenciasArray = apiResponse.data || [];
    
    if (!apiResponse.success || emergenciasArray.length === 0) {
      console.log('No hay emergencias de INDECI disponibles');
      return [];
    }

    console.log(`Processing ${emergenciasArray.length} INDECI emergencies from ${apiResponse.source || 'unknown'}`);

    // Transformar emergencias de INDECI al formato Emergencia
    return emergenciasArray.map((emerg: any) => {
      const latitud = typeof emerg.latitude === 'number' ? emerg.latitude : parseFloat(emerg.latitude);
      const longitud = typeof emerg.longitude === 'number' ? emerg.longitude : parseFloat(emerg.longitude);

      return {
        id: emerg.id,
        codigoSinpad: emerg.sinpad_code,
        tipoEmergencia: emerg.type || 'Emergencia INDECI',
        fenomeno: emerg.description || emerg.type,
        fecha: emerg.occurred_at || new Date().toISOString(),
        ubicacion: {
          departamento: emerg.region || 'Sin especificar',
          provincia: emerg.province || 'Sin especificar',
          distrito: emerg.district || 'Sin especificar',
          direccion: emerg.location,
        },
        coordenadas:
          Number.isFinite(latitud) && Number.isFinite(longitud)
            ? {
                latitud,
                longitud,
              }
            : undefined,
        descripcion: emerg.description || `Emergencia ${emerg.type}`,
        estado: 'Activo',
        fuente: 'indeci',
      };
    });
  } catch (error) {
    console.error('Error al obtener emergencias de INDECI:', error);
    return [];
  }
}

/**
 * Obtiene emergencias de ambas fuentes (Bomberos e INDECI)
 */
export async function getTodasEmergencias(): Promise<Emergencia[]> {
  try {
    const [bomberosEmerg, indeciEmerg] = await Promise.all([
      getBomberos24Horas(),
      getIndeci24Horas(),
    ]);

    // Combinar ambas fuentes y evitar duplicados
    const todas = [...bomberosEmerg, ...indeciEmerg];
    
    console.log(`Total emergencias: ${todas.length} (Bomberos: ${bomberosEmerg.length}, INDECI: ${indeciEmerg.length})`);
    
    return todas;
  } catch (error) {
    console.error('Error al obtener todas las emergencias:', error);
    return [];
  }
}

/**
 * Filtra emergencias por tipo
 */
export function filterEmergenciasByType(
  emergencias: Emergencia[],
  tipos: string[]
): Emergencia[] {
  if (tipos.length === 0) return emergencias;
  return emergencias.filter(e => tipos.includes(e.tipoEmergencia));
}

/**
 * Filtra emergencias por rango de fechas
 */
export function filterEmergenciasByDateRange(
  emergencias: Emergencia[],
  startDate: Date,
  endDate: Date
): Emergencia[] {
  return emergencias.filter(e => {
    const fecha = new Date(e.fecha);
    return fecha >= startDate && fecha <= endDate;
  });
}

/**
 * Obtiene estadísticas de emergencias
 */
export function getEmergencyStats(emergencias: Emergencia[]) {
  const stats = {
    total: emergencias.length,
    porTipo: {} as Record<string, number>,
    porDepartamento: {} as Record<string, number>,
    porMes: {} as Record<string, number>,
  };

  emergencias.forEach(e => {
    // Por tipo
    stats.porTipo[e.tipoEmergencia] = (stats.porTipo[e.tipoEmergencia] || 0) + 1;

    // Por departamento
    const dept = e.ubicacion.departamento;
    stats.porDepartamento[dept] = (stats.porDepartamento[dept] || 0) + 1;

    // Por mes
    const fecha = new Date(e.fecha);
    const mes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    stats.porMes[mes] = (stats.porMes[mes] || 0) + 1;
  });

  return stats;
}

/**
 * Obtiene datos del heatmap de crímenes
 * 
 * Parámetros opcionales:
 * - limit: Máximo de registros (default: 5000, máximo: 20000)
 * - offset: Desplazamiento para paginación
 * - crime_type: Filtrar por tipo de delito
 * - dept_code: Filtrar por departamento
 * - min_lat, max_lat, min_lon, max_lon: Rango de coordenadas
 */
export async function getHeatmapData(options?: {
  limit?: number;
  offset?: number;
  crime_type?: string;
  dept_code?: string;
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
}): Promise<HeatmapPoint[]> {
  try {
    const params = new URLSearchParams();
    
    if (options?.limit) {
      const limit = Math.min(Math.max(options.limit, 1), 20000);
      params.append('limit', limit.toString());
    }
    if (options?.offset !== undefined) params.append('offset', options.offset.toString());
    if (options?.crime_type) params.append('crime_type', options.crime_type);
    if (options?.dept_code) params.append('dept_code', options.dept_code);
    if (options?.min_lat !== undefined) params.append('min_lat', options.min_lat.toString());
    if (options?.max_lat !== undefined) params.append('max_lat', options.max_lat.toString());
    if (options?.min_lon !== undefined) params.append('min_lon', options.min_lon.toString());
    if (options?.max_lon !== undefined) params.append('max_lon', options.max_lon.toString());

    const queryString = params.toString();
    const url = `https://api.mdcdev.me/v2/peru/inei/criminals/heatmap${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Heatmap API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      console.log('No hay datos de heatmap disponibles');
      return [];
    }

    console.log(`Retrieved ${apiResponse.data.length} heatmap points`);

    return apiResponse.data;
  } catch (error) {
    console.error('Error al obtener datos del heatmap:', error);
    return [];
  }
}

/**
 * Obtiene los tipos de crímenes disponibles con sus conteos
 */
export async function getCrimeTypes(): Promise<CrimeType[]> {
  try {
    const response = await fetch('https://api.mdcdev.me/v2/peru/inei/criminals/types', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Crime Types API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      console.log('No hay tipos de crímenes disponibles');
      return [];
    }

    console.log(`Retrieved ${apiResponse.data.length} crime types`);

    return apiResponse.data;
  } catch (error) {
    console.error('Error al obtener tipos de crímenes:', error);
    return [];
  }
}

/**
 * Obtiene sismos recientes (IGP)
 */
export async function getEarthquakes(): Promise<Earthquake[]> {
  try {
    const response = await fetch('https://api.mdcdev.me/v2/peru/igp/earthquakes', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Earthquakes API error: ${response.status}`);
      return [];
    }

    const apiResponse = await response.json();
    const earthquakesArray = apiResponse.data || [];

    if (!apiResponse.success || earthquakesArray.length === 0) {
      console.log('No hay sismos disponibles');
      return [];
    }

    return earthquakesArray.map((quake: Earthquake) => applyEarthquakeMapFallbacks(quake));
  } catch (error) {
    console.error('Error al obtener sismos:', error);
    return [];
  }
}

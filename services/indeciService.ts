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

/**
 * Combina local_date y local_time para obtener la hora peruana correcta
 * local_time viene como timestamp donde los días adicionales representan horas acumuladas
 */
function getPeruDateTime(quake: Earthquake): string | null {
  // Priorizar local_date y local_time que ya deberían estar en hora peruana
  if (!quake.local_date || !quake.local_time) {
    // Fallback a UTC si no hay datos locales
    if (!quake.utc_date || !quake.utc_time) return null;
    return getPeruDateTimeFromUTC(quake);
  }
  
  try {
    // Extraer la fecha de local_date
    const dateObj = new Date(quake.local_date);
    let year = dateObj.getUTCFullYear();
    let month = dateObj.getUTCMonth() + 1;
    let day = dateObj.getUTCDate();
    
    // local_time viene como epoch time donde puede tener días extras
    // Ejemplo: "1970-01-02T07:01:36.000Z" significa 1 día completo (24h) + 7:01:36
    const timeObj = new Date(quake.local_time);
    const totalSeconds = Math.floor(timeObj.getTime() / 1000);
    
    // DEBUG: Log para verificar valores
    if (quake.report_number) {
      console.log(`[Earthquake #${quake.report_number}] local_time:`, quake.local_time, 
                  'totalSeconds:', totalSeconds, 
                  'totalHours:', Math.floor(totalSeconds / 3600));
    }
    
    // Convertir a horas, minutos, segundos totales
    let totalHours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // AJUSTE: Restar 8 horas del offset (parece que local_time viene con GMT+8)
    totalHours -= 8;
    
    // Si las horas totales son >= 24, ajustar el día
    if (totalHours >= 24) {
      const daysToAdd = Math.floor(totalHours / 24);
      day += daysToAdd;
      totalHours = totalHours % 24;
      
      // Ajustar mes si el día se pasa
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day > daysInMonth) {
        day -= daysInMonth;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
    } else if (totalHours < 0) {
      // Si es negativo, retroceder un día
      day -= 1;
      totalHours += 24;
      
      if (day < 1) {
        month -= 1;
        if (month < 1) {
          month = 12;
          year -= 1;
        }
        day = new Date(year, month, 0).getDate();
      }
    }
    
    const yearStr = String(year);
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const hoursStr = String(totalHours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    
    const result = `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:${secondsStr}.000-05:00`;
    
    // DEBUG: Log resultado
    if (quake.report_number) {
      console.log(`[Earthquake #${quake.report_number}] peru_datetime:`, result);
    }
    
    // Retornar en formato ISO con timezone de Perú
    return result;
  } catch (error) {
    console.error('Error al convertir fecha/hora local a hora peruana:', error);
    return null;
  }
}

/**
 * Fallback: Combina utc_date y utc_time y convierte a hora peruana (UTC-5)
 */
function getPeruDateTimeFromUTC(quake: Earthquake): string | null {
  if (!quake.utc_date || !quake.utc_time) return null;
  
  try {
    // Extraer la fecha de utc_date (YYYY-MM-DD)
    const dateObj = new Date(quake.utc_date);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    // Extraer la hora de utc_time (puede tener días extras como en local_time)
    const timeObj = new Date(quake.utc_time);
    const totalSeconds = Math.floor(timeObj.getTime() / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);
    const hours = totalHours % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    
    // Combinar en formato UTC
    const utcDateTimeString = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:${secondsStr}.000Z`;
    const utcDateTime = new Date(utcDateTimeString);
    
    if (Number.isNaN(utcDateTime.getTime())) return null;
    
    // Convertir a hora peruana (UTC-5)
    const peruDateTime = new Date(utcDateTime.getTime() - 5 * 60 * 60 * 1000);
    
    // Formatear como ISO con timezone de Perú
    const peruYear = peruDateTime.getUTCFullYear();
    const peruMonth = String(peruDateTime.getUTCMonth() + 1).padStart(2, '0');
    const peruDay = String(peruDateTime.getUTCDate()).padStart(2, '0');
    const peruHours = String(peruDateTime.getUTCHours()).padStart(2, '0');
    const peruMinutes = String(peruDateTime.getUTCMinutes()).padStart(2, '0');
    const peruSeconds = String(peruDateTime.getUTCSeconds()).padStart(2, '0');
    
    return `${peruYear}-${peruMonth}-${peruDay}T${peruHours}:${peruMinutes}:${peruSeconds}.000-05:00`;
  } catch (error) {
    console.error('Error al convertir fecha/hora UTC a hora peruana:', error);
    return null;
  }
}

function getEarthquakeYear(quake: Earthquake): string | null {
  const dateString = quake.peru_datetime || quake.local_date || quake.utc_date || quake.datetime_utc || null;
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

    return earthquakesArray.map((quake: Earthquake) => {
      const quakeWithPeruTime = {
        ...quake,
        peru_datetime: getPeruDateTime(quake),
      };
      return applyEarthquakeMapFallbacks(quakeWithPeruTime);
    });
  } catch (error) {
    console.error('Error al obtener sismos:', error);
    return [];
  }
}

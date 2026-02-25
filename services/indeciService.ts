import axios from 'axios';
import { Emergencia } from '@/types';

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
    const response = await fetch('/api/bomberos-24horas');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
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
    const response = await fetch('/api/indeci-emergencias');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
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

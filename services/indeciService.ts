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
 * Descarga y procesa datos de emergencias de un año específico
 * NOTA: Los datos vienen en formato CSV/Excel, esta función es una simulación
 */
export async function getEmergenciasByYear(year: number): Promise<Emergencia[]> {
  try {
    // En producción, aquí se descargaría y procesaría el archivo CSV/Excel
    // Por ahora, retornamos datos de ejemplo
    return getMockEmergencias();
  } catch (error) {
    console.error(`Error al obtener emergencias del año ${year}:`, error);
    return getMockEmergencias();
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

    console.log(`📍 Processing ${emergenciasArray.length} bomberos emergencies from ${apiResponse.source || 'unknown'}`);

    // Transformar emergencias de bomberos al formato Emergencia
    return emergenciasArray.map((emerg: any) => ({
      id: emerg.id || emerg.numparte,
      codigoSinpad: emerg.numparte,
      tipoEmergencia: emerg.tipo || 'Emergencia',
      fenomeno: emerg.tipo || 'Reporte de bomberos',
      fecha: emerg.hora || new Date().toISOString(),
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: emerg.distrito || 'Sin especificar',
        direccion: emerg.ubicacion,
      },
      coordenadas:
        emerg.latitud && emerg.longitud
          ? {
              latitud: parseFloat(emerg.latitud),
              longitud: parseFloat(emerg.longitud),
            }
          : undefined,
      descripcion: `Reporte ${emerg.numparte}`,
      estado: 'Activo',
    }));
  } catch (error) {
    console.error('❌ Error al obtener emergencias de bomberos:', error);
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

    console.log(`📍 Processing ${emergenciasArray.length} INDECI emergencies from ${apiResponse.source || 'unknown'}`);

    // Transformar emergencias de INDECI al formato Emergencia
    return emergenciasArray.map((emerg: any) => ({
      id: emerg.id,
      codigoSinpad: emerg.codigoSinpad,
      tipoEmergencia: emerg.tipo || 'Emergencia INDECI',
      fenomeno: emerg.descripcion || emerg.tipo,
      fecha: emerg.fecha || new Date().toISOString(),
      ubicacion: {
        departamento: emerg.region || 'Sin especificar',
        provincia: emerg.provincia || 'Sin especificar',
        distrito: emerg.distrito || 'Sin especificar',
        direccion: emerg.ubicacion,
      },
      coordenadas:
        emerg.latitud && emerg.longitud
          ? {
              latitud: parseFloat(emerg.latitud),
              longitud: parseFloat(emerg.longitud),
            }
          : undefined,
      descripcion: emerg.descripcion || `Emergencia ${emerg.tipo}`,
      estado: 'Activo',
    }));
  } catch (error) {
    console.error('❌ Error al obtener emergencias de INDECI:', error);
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
    
    console.log(`✅ Total emergencias: ${todas.length} (Bomberos: ${bomberosEmerg.length}, INDECI: ${indeciEmerg.length})`);
    
    return todas;
  } catch (error) {
    console.error('❌ Error al obtener todas las emergencias:', error);
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
 * Datos de ejemplo de emergencias en Lima (para desarrollo y fallback)
 * Basado en tipos comunes de emergencias reportadas por INDECI
 */
function getMockEmergencias(): Emergencia[] {
  return [
    {
      id: '1',
      codigoSinpad: 'SINPAD-2024-001',
      tipoEmergencia: 'Incendio Urbano',
      fenomeno: 'Incendio',
      fecha: '2024-01-15T14:30:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Cercado de Lima',
        ubigeo: '150101',
        direccion: 'Jr. Mesa Redonda cdra. 7',
      },
      coordenadas: {
        latitud: -12.0526,
        longitud: -77.0394,
      },
      afectados: {
        heridos: 5,
        damnificados: 15,
        viviendas: 3,
      },
      descripcion: 'Incendio en zona comercial',
      estado: 'Controlado',
    },
    {
      id: '2',
      codigoSinpad: 'SINPAD-2024-002',
      tipoEmergencia: 'Sismo',
      fenomeno: 'Sismo',
      fecha: '2024-02-20T08:45:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        ubigeo: '150122',
      },
      coordenadas: {
        latitud: -12.1198,
        longitud: -77.0284,
      },
      afectados: {
        afectados: 120,
      },
      descripcion: 'Sismo de magnitud 4.5, sin daños mayores',
      estado: 'Finalizado',
    },
    {
      id: '3',
      codigoSinpad: 'SINPAD-2024-003',
      tipoEmergencia: 'Inundación',
      fenomeno: 'Lluvias intensas',
      fecha: '2024-03-10T16:20:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'San Juan de Lurigancho',
        ubigeo: '150132',
        direccion: 'Av. Próceres de la Independencia',
      },
      coordenadas: {
        latitud: -11.9933,
        longitud: -77.0011,
      },
      afectados: {
        damnificados: 45,
        viviendas: 12,
        afectados: 180,
      },
      descripcion: 'Inundación por desborde de acequia',
      estado: 'En atención',
    },
    {
      id: '4',
      codigoSinpad: 'SINPAD-2024-004',
      tipoEmergencia: 'Deslizamiento',
      fenomeno: 'Deslizamiento',
      fecha: '2024-04-05T11:15:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Rimac',
        ubigeo: '150127',
        direccion: 'Cerro San Cristóbal',
      },
      coordenadas: {
        latitud: -12.0325,
        longitud: -77.0461,
      },
      afectados: {
        damnificados: 8,
        viviendas: 2,
      },
      descripcion: 'Deslizamiento de tierra en zona de riesgo',
      estado: 'En atención',
    },
    {
      id: '5',
      codigoSinpad: 'SINPAD-2024-005',
      tipoEmergencia: 'Incendio Forestal',
      fenomeno: 'Incendio',
      fecha: '2024-05-18T13:00:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Villa María del Triunfo',
        ubigeo: '150143',
      },
      coordenadas: {
        latitud: -12.1619,
        longitud: -76.9403,
      },
      afectados: {
        afectados: 50,
      },
      descripcion: 'Incendio en área de vegetación seca',
      estado: 'Controlado',
    },
    {
      id: '6',
      codigoSinpad: 'SINPAD-2024-006',
      tipoEmergencia: 'Accidente de Tránsito',
      fenomeno: 'Accidente',
      fecha: '2024-06-22T19:30:00',
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'San Borja',
        ubigeo: '150130',
        direccion: 'Av. Javier Prado Este cdra. 13',
      },
      coordenadas: {
        latitud: -12.0893,
        longitud: -76.9981,
      },
      afectados: {
        fallecidos: 2,
        heridos: 8,
      },
      descripcion: 'Choque múltiple en vía expresa',
      estado: 'Finalizado',
    },
  ];
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

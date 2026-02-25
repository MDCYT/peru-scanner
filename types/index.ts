// Tipos para la API de Cámaras de la Municipalidad de Lima
export interface Camera {
  id: string;
  nombre: string;
  ubicacion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: 'Operativo' | 'No Operativo' | 'En Mantenimiento';
  tipo: 'Vigilancia' | 'Tráfico';
  distrito?: string;
  zona?: string;
  urlStream?: string; // URL del stream de video si está disponible
  specialCamera?: {
    provider: 'SkylineWebcams';
    url: string; // URL de la página del proveedor
  };
}

// Tipos para la API de INDECI
export interface Emergencia {
  id: string;
  codigoSinpad?: string;
  tipoEmergencia: string;
  fenomeno: string;
  fecha: string;
  ubicacion: {
    departamento: string;
    provincia: string;
    distrito: string;
    ubigeo?: string;
    direccion?: string;
  };
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
  afectados?: {
    fallecidos?: number;
    heridos?: number;
    desaparecidos?: number;
    damnificados?: number;
    afectados?: number;
    viviendas?: number;
  };
  descripcion?: string;
  estado?: string;
  fuente?: 'bomberos' | 'indeci';
}

// Tipo para los filtros del mapa
export interface MapFilters {
  showCameras: boolean;
  showEmergencies: boolean;
  cameraType?: 'all' | 'Vigilancia' | 'Tráfico';
  emergencyType?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Tipo para las estadísticas
export interface EmergencyStats {
  total: number;
  porTipo: Record<string, number>;
  porDepartamento: Record<string, number>;
  porMes: Record<string, number>;
}

// Tipo para datos del Heatmap de Crímenes
export interface HeatmapPoint {
  lat: string;
  lon: string;
  type: string;
  intensity: number;
}

// Tipo para tipos de crímenes disponibles
export interface CrimeType {
  crime_type: string;
  count: number;
}

// Tipo para datos de sismos (IGP)
export interface Earthquake {
  id: number;
  code: string | null;
  report_number: number | null;
  local_date: string | null;
  local_time: string | null;
  utc_date: string | null;
  utc_time: string | null;
  datetime_utc: string | null;
  latitude: string;
  longitude: string;
  reference: string | null;
  magnitude: string | null;
  depth: string | null;
  intensity: string | null;
  seismic_map_url: string | null;
  accelerometric_map_url: string | null;
  accelerometric_report_pdf: string | null;
}

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

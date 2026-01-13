# Peru Scanner 🇵🇪

Aplicación web para visualizar cámaras públicas y reportes de emergencias en Perú en tiempo real.

## Características

- **Mapa Interactivo**: Visualiza la ubicación de cámaras públicas y reportes de emergencias en un mapa de Lima
- **Cámaras Públicas**: Accede a información sobre cámaras de vigilancia y tráfico de la Municipalidad de Lima
- **Reportes de Emergencias**: Consulta datos históricos de emergencias registradas por INDECI
- **Dashboard**: Panel de control con estadísticas en tiempo real
- **Responsive**: Diseño adaptable para desktop y móviles

## Fuentes de Datos

### Cámaras Públicas
- **Fuente**: Portal de Datos Abiertos - Municipalidad Metropolitana de Lima
- **API**: `http://api.datosabiertos.munlima.gob.pe/api/v2/datastreams/`
- **Dataset**: UBICA-DE-CAMAR-GSGC-69245
- **Contacto**: datosabiertos@munlima.gob.pe

### Emergencias
- **Fuente**: Plataforma Nacional de Datos Abiertos - INDECI
- **API**: `https://www.datosabiertos.gob.pe/api/3/action/`
- **Dataset ID**: 33c2e284-2699-4599-b9d1-6b972fdbbdf5
- **Sistema**: SINPAD (Sistema de Información Nacional para la Respuesta y Rehabilitación)
- **Contacto**: ccasimiro@indeci.gob.pe

## Tecnologías Utilizadas

- **Frontend**: Next.js 14+ con TypeScript
- **Mapas**: Leaflet + React-Leaflet
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **HTTP Client**: Axios

## Instalación

1. Clona este repositorio:
```bash
git clone <repo-url>
cd peru-scanner
```

2. Instala las dependencias:
```bash
npm install
```

3. (Opcional) Configura las variables de entorno:
```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega tu API key de la Municipalidad de Lima si la tienes.

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre tu navegador en [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Estructura del Proyecto

```
peru-scanner/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout general
│   └── globals.css        # Estilos globales
├── components/
│   ├── Map/               # Componentes del mapa
│   │   └── MapContainer.tsx
│   ├── CameraViewer/      # Visor de cámaras
│   │   └── CameraViewer.tsx
│   └── Dashboard/         # Panel de control
│       └── Dashboard.tsx
├── services/              # Servicios para APIs
│   ├── camerasService.ts
│   └── indeciService.ts
├── types/                 # TypeScript types
│   └── index.ts
├── public/                # Archivos estáticos
└── package.json
```

## Uso

### Visualizar Cámaras
1. En el panel lateral, marca la opción "Cámaras Públicas"
2. Los marcadores azules en el mapa representan cámaras
3. Haz clic en un marcador para ver información detallada
4. Haz clic en el marcador nuevamente para abrir el visor de cámara

### Visualizar Emergencias
1. En el panel lateral, marca la opción "Reportes de Emergencias"
2. Los marcadores rojos en el mapa representan emergencias reportadas
3. Haz clic en un marcador para ver detalles de la emergencia

## Notas Importantes

### Acceso a APIs

**API de Cámaras (Municipalidad de Lima)**:
- La aplicación incluye datos de ejemplo para desarrollo
- Para acceso completo a la API, necesitas solicitar una API key
- Contacto: datosabiertos@munlima.gob.pe
- Documentación: https://datosabiertos.munlima.gob.pe/developers/

**API de Emergencias (INDECI)**:
- Los datos históricos están disponibles públicamente en formato CSV/Excel
- La aplicación actualmente usa datos de ejemplo
- Para implementación completa, necesitas descargar y procesar los archivos CSV
- Contacto: ccasimiro@indeci.gob.pe

### Feeds de Video

Los feeds de video en tiempo real de las cámaras no están disponibles públicamente sin permisos especiales. Para solicitar acceso:
- Visita: http://protransito.munlima.gob.pe
- Contacta a la Municipalidad de Lima para permisos de acceso

## Desarrollo Futuro

### Mejoras Planificadas
- [ ] Integración real con la API de cámaras (requiere API key)
- [ ] Parser de archivos CSV de INDECI para datos reales
- [ ] Filtros avanzados por tipo de emergencia y fecha
- [ ] Notificaciones de emergencias en tiempo real
- [ ] Exportación de datos y reportes
- [ ] Modo oscuro
- [ ] Soporte para más ciudades de Perú

### Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

## Contacto y Recursos

- **Municipalidad de Lima - Datos Abiertos**: https://datosabiertos.munlima.gob.pe/
- **INDECI - Datos Abiertos**: https://www.datosabiertos.gob.pe/
- **ProTransito**: http://protransito.munlima.gob.pe/

## Disclaimer

Esta aplicación es un proyecto independiente y no está oficialmente afiliada con la Municipalidad de Lima, INDECI, o cualquier entidad gubernamental de Perú. Los datos mostrados provienen de fuentes públicas y pueden no estar actualizados o ser completamente precisos.

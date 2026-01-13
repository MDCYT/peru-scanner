# Cámaras Públicas en Perú

Este documento lista las fuentes de cámaras públicas disponibles en Perú que están integradas o pueden integrarse en la aplicación Peru Scanner.

## Cámaras Implementadas

### 1. Cámaras de Tráfico - Municipalidad de Lima (Mock Data)
**Total:** 8 cámaras de tráfico y vigilancia

Ubicaciones:
- Av. Javier Prado Este - San Borja
- Vía Expresa - San Isidro
- Panamericana Norte - Los Olivos
- Plaza Mayor - Cercado de Lima
- Av. Universitaria - San Miguel
- Panamericana Sur - Villa El Salvador
- Carretera Central - Ate
- Mesa Redonda - Cercado de Lima

**Fuente:** API de Datos Abiertos de la Municipalidad de Lima
- **URL:** http://api.datosabiertos.munlima.gob.pe/api/v2/datastreams/
- **Dataset ID:** UBICA-DE-CAMAR-GSGC-69245
- **Contacto:** datosabiertos@munlima.gob.pe
- **Nota:** Requiere API key para acceso completo

### 2. Webcams Públicas - SkylineWebcams
**Total:** 8 webcams en tiempo real

#### Lima Centro
- **Óvalo de Miraflores** (-12.1198, -77.0304)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/lima/miraflores-oval.html

- **Kennedy Park - Miraflores** (-12.1211, -77.0289)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/lima/kennedy-park.html

- **Plaza de Armas de Barranco** (-12.1458, -77.0206)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/barranco/plaza-de-armas.html

#### Playas del Sur de Lima
- **Playa Señoritas - Punta Hermosa** (-12.3333, -76.8167)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/punta-hermosa/playa-senoritas.html

- **Playa Caballeros - Punta Hermosa** (-12.3361, -76.8194)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/punta-hermosa/caballeros-beach.html

- **Playa el Silencio - Punta Hermosa** (-12.3281, -76.8256)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/punta-hermosa/playa-el-silencio.html

- **Playa La Herradura - Chorrillos** (-12.1742, -77.0158)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/chorrillos/playa-la-herradura.html

- **San Bartolo Beach** (-12.3869, -76.7831)
  - URL: https://www.skylinewebcams.com/en/webcam/peru/lima/san-bartolo.html

**Fuente:** SkylineWebcams
- **URL:** https://www.skylinewebcams.com/en/webcam/peru/lima.html
- **Tipo:** Webcams públicas en streaming
- **Acceso:** Gratuito, embed disponible

## Otras Fuentes de Cámaras Disponibles

### 3. WorldCam - Cámaras de Perú
- **URL:** https://worldcam.eu/webcams/south-america/peru
- **Cobertura:** Varias ciudades de Perú
- **Tipo:** Webcams públicas

### 4. Tabi.cam - Webcams de Lima
- **URL:** https://tabi.cam/peru/lima-livecams/
- **Cobertura:** Lima y otras ciudades
- **Tipo:** Webcams en vivo

### 5. WorldViewStream - Cámaras de Perú
- **URL:** https://worldviewstream.com/category/peru/
- **Cobertura:** Varias ubicaciones en Perú
- **Tipo:** Streaming en vivo

### 6. Claro Perú - Tráfico en Vivo
- **URL:** https://www.claro.com.pe/traficoenvivo/
- **Cobertura:** Principales avenidas de Lima con cobertura 5G
- **Tipo:** Mapa interactivo con información de tráfico
- **Nota:** Usa cámaras instaladas en paneles en zonas de cobertura 5G

## Cámaras en Otras Ciudades

### Arequipa
- **Municipalidad de Arequipa** cuenta con 63 cámaras de vigilancia (26 operativas)
- **Contacto:** muniarequipa.gob.pe
- **Nota:** Principalmente para seguridad ciudadana, no disponible públicamente

### Cusco y Trujillo
- Actualmente no se encontraron sistemas de cámaras públicas municipales disponibles
- Recomendación: Contactar a las municipalidades directamente

## Sistemas de Monitoreo Vial

### SUTRAN - Alertas de Estado de Vía
- **URL:** https://gis.sutran.gob.pe/alerta_sutran/
- **Tipo:** Sistema de alertas de bloqueos, fenómenos naturales y cierres de vías
- **Cobertura:** Nacional

## Cómo Integrar Más Cámaras

Para agregar más cámaras a la aplicación:

1. **Obtener coordenadas GPS** de la ubicación de la cámara
2. **Verificar acceso público** a la cámara
3. **Obtener URL del stream** (si disponible)
4. **Agregar al array** en `services/camerasService.ts`:

```typescript
{
  id: 'unique-id',
  nombre: 'Nombre de la Cámara',
  ubicacion: 'Descripción de ubicación',
  direccion: 'Dirección exacta',
  latitud: -12.0000,
  longitud: -77.0000,
  estado: 'Operativo',
  tipo: 'Tráfico' | 'Vigilancia',
  distrito: 'Nombre del distrito',
  zona: 'Norte' | 'Sur' | 'Este' | 'Oeste' | 'Centro',
  urlStream: 'URL del stream (opcional)',
}
```

## APIs y Contactos

### Para Acceso a APIs Oficiales

**Municipalidad de Lima - Datos Abiertos:**
- Email: datosabiertos@munlima.gob.pe
- Portal: https://datosabiertos.munlima.gob.pe/
- Documentación: https://datosabiertos.munlima.gob.pe/developers/

**ProTransito - Control de Tráfico:**
- Portal: http://protransito.munlima.gob.pe/
- Cámaras: 1,520 cámaras censando volúmenes vehiculares

## Actualizaciones

**Última actualización:** Enero 2026
**Total de cámaras implementadas:** 16 cámaras públicas en Lima

## Notas Importantes

1. **Permisos:** Las webcams de SkylineWebcams son públicas y accesibles
2. **Streams en Vivo:** Los feeds de video en tiempo real de cámaras municipales requieren permisos especiales
3. **API Keys:** Para acceso completo a la API de la Municipalidad de Lima, se requiere solicitar una API key
4. **Privacidad:** Todas las cámaras listadas son públicas y de acceso libre o mediante solicitud oficial

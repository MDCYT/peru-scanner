# Integración de Emergencias INDECI

## Resumen

Se han integrado exitosamente las emergencias de **INDECI** (Instituto Nacional de Defensa Civil) al sistema de escaneo de Perú. Ahora la aplicación muestra emergencias de dos fuentes principales:

1. **Bomberos Perú (24h)** - Reportes en tiempo real de emergencias urbanas
2. **INDECI** - Fenómenos naturales y desastres (últimas 24 horas)

## Fuentes de Datos

### 1. Bomberos Perú 24h
- **URL**: `https://sgonorte.bomberosperu.gob.pe/24horas/`
- **Endpoint**: `/api/bomberos-24horas`
- **Tipos**: EMERGENCIA MEDICA, INCENDIO, ACCIDENTE VEHICULAR, RESCATE, MATERIALES PELIGROSOS, SERVICIO ESPECIAL
- **Cantidad**: ~123 emergencias activas
- **Caché**: 30 minutos (RAM)

### 2. INDECI
- **URL API**: `https://geosinpad.indeci.gob.pe/indeci/rest/services/Emergencias/EMERGENCIAS_SINPAD/FeatureServer/0/query`
- **Endpoint**: `/api/indeci-emergencias`
- **Tipos**: 
  - LLUVIA INTENSA / TORMENTA
  - DESLIZAMIENTO / DERRUMBE
  - INUNDACIÓN
  - SISMO / TERREMOTO
  - HELADA / FRÍO
  - SEQUÍA / DÉFICIT HÍDRICO
  - INCENDIO FORESTAL
  - VANDALISMO
- **Cantidad**: ~51 emergencias activas
- **Caché**: 30 minutos (RAM)
- **Filtro**: FECHA >= CURRENT_TIMESTAMP-1 (últimas 24 horas)

## Cambios Implementados

### 1. Nuevo Endpoint API: `/api/indeci-emergencias`
**Archivo**: `app/api/indeci-emergencias/route.ts`

Características:
- Consulta en tiempo real la API REST de INDECI
- Convierte timestamps de milisegundos a ISO 8601
- Clasifica fenómenos en tipos de emergencia
- Extrae coordenadas geográficas (lat/lon)
- Implementa caché en RAM con TTL de 30 minutos
- Fallback a caché expirado si hay errores
- Manejo robusto de errores

```typescript
// Ejemplo de respuesta
{
  "success": true,
  "count": 51,
  "data": [
    {
      "id": "indeci-1234567",
      "codigoSinpad": "INDECI-1234567",
      "tipo": "LLUVIA INTENSA",
      "descripcion": "Precipitaciones intensas en zona andina",
      "ubicacion": "Huancayo",
      "distrito": "Huancayo",
      "provincia": "Junín",
      "region": "Junín",
      "fecha": "2026-01-12T14:30:00.000Z",
      "latitud": -12.0746,
      "longitud": -75.2142,
      "afectados": 0,
      "fuente": "indeci"
    }
  ],
  "source": "real",
  "timestamp": "2026-01-12T19:45:23.456Z"
}
```

### 2. Actualización del Servicio INDECI
**Archivo**: `services/indeciService.ts`

Nuevas funciones:
- `getIndeci24Horas()` - Obtiene emergencias de INDECI en 24 horas
- `getTodasEmergencias()` - Combina Bomberos + INDECI
- Actualizado `getEmergencias()` para usar ambas fuentes

### 3. Actualización del Mapa
**Archivo**: `components/Map/MapContainer.tsx`

Cambios:
- **Mapa de colores expandido** para incluir tipos INDECI:
  - Lluvia: Azul real (#4169E1)
  - Deslizamiento: Marrón (#8B4513)
  - Inundación: Turquesa oscuro (#20B2AA)
  - Sismo: Rojo oscuro (#DC143C)
  - Helada: Azul cielo (#87CEEB)
  - Sequía: Dorado oscuro (#DAA520)
  - Incendio forestal: Naranja rojo (#FF4500)
  - Vandalismo: Gris oscuro (#696969)

- **Símbolos SVG únicos por tipo**:
  - ☔ Nube con lluvia (lluvia intensa)
  - 🏔️ Montaña/tierra (deslizamiento)
  - 🌊 Ondas de agua (inundación)
  - 📍 Ondas sísmicas (sismo)
  - ❄️ Copo de nieve (helada)
  - 🌱 Grieta en tierra (sequía)
  - 🔥 Árbol en llamas (incendio forestal)
  - ✋ Mano (vandalismo)

### 4. Actualización del Dashboard
**Archivo**: `components/Dashboard/Dashboard.tsx`

Nuevas estadísticas:
- Total de reportes combinados
- Últimas 24 horas (total)
- Reportes Bomberos (24h)
- Reportes INDECI (24h)

Los filtros ya funcionan con ambas fuentes automáticamente.

## Cómo Funcionan los Filtros

1. El usuario marca/desmarca tipos de emergencias en el panel de control
2. El filtro se aplica a **TODAS las emergencias** (Bomberos + INDECI)
3. Solo se muestran los tipos seleccionados en el mapa
4. Las estadísticas se actualizan en tiempo real

Ejemplo:
```typescript
// Si el filtro incluye: ["EMERGENCIA MEDICA", "LLUVIA INTENSA"]
// Se mostrarán: emergencias médicas de Bomberos + lluvias intensas de INDECI
```

## Caché y Rendimiento

- **30 minutos de caché** por fuente
- Cada API es independiente
- Si una API falla, se intenta nuevamente con proxies/retry
- Fallback a caché expirado si se agota el retry
- Logs en consola indican `Using cache` vs `Fresh data`

## Respuesta del Servidor

El terminal muestra:
```
INDECI: 51 emergencias obtenidas
Total emergencias: 174 (Bomberos: 123, INDECI: 51)
```

## Testing

Para verificar los endpoints:

```bash
# INDECI
curl http://localhost:3000/api/indeci-emergencias

# Bomberos
curl http://localhost:3000/api/bomberos-24horas
```

## Próximos Pasos (Opcionales)

1. **Actualizaciones en tiempo real**: Implementar WebSocket para actualizar datos cada X minutos
2. **Alertas**: Notificaciones para nuevas emergencias
3. **Historial**: Guardar datos en base de datos para análisis histórico
4. **Exportación**: Descargar reportes en CSV/PDF
5. **Integración móvil**: App nativa para Perú Scanner

## Notas Técnicas

- INDECI devuelve fechas en milisegundos (timestamp Unix * 1000)
- Las coordenadas están en formato WGS84 (lat/lon estándar)
- El filtro de fecha en INDECI API: `FECHA>=CURRENT_TIMESTAMP-1` (últimas 24 horas)
- Algunos registros pueden tener coordenadas undefined (sin ubicación geográfica)
- La API de INDECI es pública y no requiere autenticación

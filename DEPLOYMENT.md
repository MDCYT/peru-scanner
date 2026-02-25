# Guía de Despliegue

## Vercel

### Arquitectura

La aplicación consume directamente las APIs externas desde el frontend:
- Bomberos: `https://api.mdcdev.me/v2/peru/bomberos/incidentes`
- INDECI: `https://api.mdcdev.me/v2/peru/indeci/incidentes`
- Cámaras: `https://api.mdcdev.me/v2/peru/cameras`

No se requieren rutas API intermedias ni configuración especial.

### Variables de Entorno

No se requieren variables de entorno para el funcionamiento básico. 

Opcionales:
- `NEXT_PUBLIC_MUNLIMA_API_KEY`: API key de la Municipalidad de Lima (no requerido actualmente)

### Troubleshooting

Si las emergencias no cargan en producción:

1. Verifica que las APIs externas estén accesibles desde el navegador:
   - https://api.mdcdev.me/v2/peru/bomberos/incidentes
   - https://api.mdcdev.me/v2/peru/indeci/incidentes
   - https://api.mdcdev.me/v2/peru/cameras

2. Revisa la consola del navegador para errores CORS o de red

3. Verifica que las APIs respondan con el formato esperado:
   ```json
   {
     "success": true,
     "data": [...]
   }
   ```

### Deployment

```bash
# Build local
npm run build

# Deploy a Vercel
vercel --prod
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

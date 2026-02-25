# Guía de Despliegue

## Vercel

### Variables de Entorno

No es necesario configurar variables de entorno adicionales en Vercel. El sistema detectará automáticamente la URL de producción usando `VERCEL_URL`.

### Troubleshooting

Si las emergencias no cargan en producción:

1. Verifica que las APIs externas estén accesibles:
   - https://api.mdcdev.me/v2/peru/bomberos/incidentes
   - https://api.mdcdev.me/v2/peru/indeci/incidentes
   - https://api.mdcdev.me/v2/peru/cameras

2. Revisa los logs de Vercel para ver errores específicos

3. Si necesitas forzar una URL específica, configura en Vercel:
   ```
   NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
   ```

### Deployment

```bash
# Build local
npm run build

# Deploy a Vercel
vercel --prod
```

## Variables de Entorno Disponibles

- `NEXT_PUBLIC_BASE_URL` (opcional): URL base de la aplicación. Si no se configura, se usa:
  - `window.location.origin` en el cliente
  - `VERCEL_URL` en producción (Vercel)
  - `http://localhost:3000` en desarrollo local

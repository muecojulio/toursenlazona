# Tours de Historia

PWA de tours históricos construida con Next.js App Router. Incluye 76 sitios, mapa Leaflet + OpenStreetMap, narración con voces del dispositivo, modo inmersivo y rutas de API sin claves obligatorias.

## Requisitos

- Node.js 24.x
- npm

## Desarrollo local

```bash
npm ci
npm run dev
```

## Validación de producción

```bash
npm ci
npm run build
npm start
```

## Despliegue en Vercel

1. Importa este repositorio y deja **Root Directory** en la raíz del proyecto.
2. Selecciona el framework **Next.js**, conserva la instalación automática basada en `package-lock.json` y usa `npm run build` como comando de build.
3. Usa Node.js **24.x**. El proyecto incluye `package-lock.json` para instalar versiones reproducibles.
4. No configures un directorio de salida personalizado ni variables de entorno obligatorias.

Las rutas `/api/*` obtienen información pública de Open-Meteo, Wikipedia/Wikimedia, REST Countries, Sunrise-Sunset y Nager.Date. Leaflet, OpenStreetMap y QR Server se consumen desde el navegador.

## Datos y privacidad

Los sitios están en `data/` y sus índices se crean en memoria; no se necesita base de datos. Las preferencias de voz se guardan en el dispositivo. La cámara del modo inmersivo se usa localmente y se detiene al cerrar. Consulta `/privacidad` para más detalles.

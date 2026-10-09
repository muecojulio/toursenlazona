# Tours de Historia

PWA en español para descubrir sitios históricos en Japón y en el mundo. La experiencia ahora tiene una dirección editorial más viajera y colorida: fotografías grandes, acentos coral y turquesa, sellos de pasaporte, fichas de destinos y controles accesibles. Incluye 76 sitios, mapa Leaflet + OpenStreetMap, narración con voces del dispositivo, modo inmersivo, información pública de los lugares y política de privacidad dentro de la app.

## Requisitos y desarrollo

- Node.js 24.x
- npm

```bash
npm ci
npm run dev
```

## Validaciones

```bash
npm run security   # npm audit --audit-level=low
npm run build
npm start
```

`npm audit` no reporta vulnerabilidades en las dependencias bloqueadas del proyecto al 9 de octubre de 2026.

## Seguridad y privacidad

- Las rutas de API validan coordenadas, códigos de país, años y títulos contra el catálogo permitido; las llamadas externas usan destinos fijos, timeout y rechazan redirecciones, evitando convertirlas en un proxy abierto.
- Los datos externos se procesan como texto. Los popups del mapa se construyen con nodos DOM y `textContent`, no interpolando HTML.
- El mapa carga Leaflet 1.9.4 con Subresource Integrity. `proxy.js` aplica una CSP con nonce en las páginas; `next.config.mjs` añade cabeceras contra MIME sniffing, framing, fugas de referencia y permisos innecesarios.
- El service worker precarga las páginas públicas de inicio y privacidad para el modo sin conexión. Durante el uso normal, solo guarda recursos estáticos y respuestas públicas aptas para caché; excluye respuestas privadas, `Set-Cookie` y solicitudes `no-store`.
- La cámara se solicita solo al activar el modo inmersivo y sus pistas se detienen al cerrar, ocultar o salir de la página. No se usa la API de geolocalización.
- No hay cuentas ni analítica. Las preferencias de voz se guardan localmente. Consulta `/privacidad` para conocer los proveedores externos y sus funciones.

## Componentes

La app conserva un sistema pequeño de componentes y APIs nativas del navegador:

| Archivo | Responsabilidad |
| --- | --- |
| `lib/interacciones.js` | Movimiento reducido, detección de puntero, umbrales y gestos horizontales con bloqueo de eje. |
| `components/ui/BotonAccion.js` | Botón con área táctil amplia, estado de carga y avisos accesibles. |
| `components/ui/Pestanas.js` | Navegación con `tablist`, teclado y foco visible. |
| `components/ui/TransicionPanel.js` | Cambio de secciones con soporte de movimiento reducido. |
| `components/ui/Rail.js` | Carril horizontal para filtros con desplazamiento nativo. |
| `components/ui/Carrusel.js` | Destinos en carrusel en móvil y cuadrícula en escritorio. |
| `components/ui/FilaSwipe.js` | Acciones opcionales por gesto, botón alternativo y soporte de teclado. |
| `components/ui/BuscadorCombo.js` | Búsqueda sin distinción de mayúsculas ni diacríticos y navegación por teclado. |
| `components/ui/Interruptor.js` | Interruptor con semántica `role="switch"`. |
| `components/ui/Colapsable.js` | Acordeón con estado ARIA y contenido inerte al cerrarse. |

`prefers-reduced-motion` reduce las animaciones, el zoom no está bloqueado y los gestos no cancelan el desplazamiento vertical.

## Datos y servicios

Los sitios viven en `data/`; no se necesita base de datos ni claves de API. Los datos públicos de clima, país, amanecer, festivos y Wikipedia se consultan desde rutas del servidor. El navegador descarga las teselas de OpenStreetMap, imágenes de Wikimedia, Leaflet desde unpkg y el QR desde QR Server. Sus funciones y el tratamiento de datos técnicos se detallan en `/privacidad`.

## Despliegue en Vercel

1. Importa este repositorio y deja **Root Directory** en la raíz del proyecto.
2. Selecciona **Next.js** y conserva la instalación basada en `package-lock.json`.
3. Usa Node.js **24.x** y `npm run build` como comando de build.
4. No configures un directorio de salida personalizado ni variables de entorno obligatorias.

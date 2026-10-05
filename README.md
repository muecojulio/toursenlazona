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

## Sistema de interacción

La app reutiliza un pequeño sistema de componentes y primitivas, sin dependencias
añadidas (solo React y APIs nativas del navegador):

| Archivo | Responsabilidad |
| --- | --- |
| `lib/interacciones.js` | Movimiento reducido, puntero fino, eje de gestos (proporción 1,2), umbrales, ciclo `inactivo → cargando → éxito → error`, arrastre horizontal con bloqueo de eje y cierre al pulsar fuera. |
| `components/ui/BotonAccion.js` | Botón con objetivo táctil ≥ 44 px, hundimiento al pulsar, `aria-busy`, icono de estado, región `role="status"` y mensaje visible opcional. |
| `components/ui/Pestanas.js` | `tablist`/`tab`/`tabpanel` con indicador animado, flechas + Inicio/Fin, centrado de la activa y velos de desbordamiento. |
| `components/ui/TransicionPanel.js` | Entrada y salida de paneles con desplazamiento corto y fundido (~220 ms). |
| `components/ui/Rail.js` | Carril horizontal nativo con `scroll-snap`, velos de desbordamiento, pista «Desliza», selección centrada y sin activaciones accidentales. |
| `components/ui/Carrusel.js` | Tarjetas en carrusel con `scroll-snap` y asomo de la siguiente; en ≥ 900 px pasa a cuadrícula. |
| `components/ui/FilaSwipe.js` | Swipe para revelar acciones con bloqueo de eje, `inert` mientras están ocultas, botón «⋯» alternativo y revelado por hover/foco en escritorio. |
| `components/ui/BuscadorCombo.js` | Combobox con búsqueda que ignora mayúsculas y diacríticos, `aria-activedescendant`, aviso de sin coincidencias y lista con scroll interno. |
| `components/ui/Interruptor.js` | `role="switch"` + `aria-checked` con animación breve. |
| `components/ui/Colapsable.js` | Acordeón con `aria-expanded`, altura animada y `inert` cerrado. |

Decisiones de accesibilidad y movimiento:

- `prefers-reduced-motion` elimina desplazamientos, barridos y animaciones decorativas, y cambia el desplazamiento suave por inmediato.
- El zoom no está bloqueado (`viewport` sin `maximumScale`/`user-scalable`).
- Los gestos horizontales nunca empiezan sobre botones, enlaces, campos, pestañas, carriles, mapas ni otros controles, y no cancelan el scroll vertical.
- El swipe entre secciones exige un desplazamiento lateral claramente dominante (proporción 1,2) con distancia o velocidad suficientes.
- Los estados importantes se comunican con etiquetas accesibles y regiones `role="status"`, no solo con color.

## Despliegue en Vercel

1. Importa este repositorio y deja **Root Directory** en la raíz del proyecto.
2. Selecciona el framework **Next.js**, conserva la instalación automática basada en `package-lock.json` y usa `npm run build` como comando de build.
3. Usa Node.js **24.x**. El proyecto incluye `package-lock.json` para instalar versiones reproducibles.
4. No configures un directorio de salida personalizado ni variables de entorno obligatorias.

Las rutas `/api/*` obtienen información pública de Open-Meteo, Wikipedia/Wikimedia, REST Countries, Sunrise-Sunset y Nager.Date. Leaflet, OpenStreetMap y QR Server se consumen desde el navegador.

## Datos y privacidad

Los sitios están en `data/` y sus índices se crean en memoria; no se necesita base de datos. Las preferencias de voz se guardan en el dispositivo. La cámara del modo inmersivo se usa localmente y se detiene al cerrar. Consulta `/privacidad` para más detalles.

"use client";
/**
 * Región de anuncios para tecnologías de asistencia.
 * Una sola instancia por vista; el texto se actualiza sin mover el foco.
 */
export default function RegionAnuncio({ mensaje }) {
  return (
    <div className="sr-solo" role="status" aria-live="polite" aria-atomic="true">
      {mensaje}
    </div>
  );
}

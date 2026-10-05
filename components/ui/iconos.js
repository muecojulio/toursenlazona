/**
 * Iconos en línea (SVG) del sistema de interacción.
 * Se marcan como decorativos salvo que se use como único contenido accesible.
 */
export function IconoSpinner({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconoCheck({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoAlerta({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M12 3.5 21.5 20H2.5L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 9.5v4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function IconoFlecha({ dir = "derecha", className = "" }) {
  const rot = dir === "izquierda" ? 180 : dir === "arriba" ? -90 : dir === "abajo" ? 90 : 0;
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoMas({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="5.5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function IconoCerrar({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconoBuscar({ className = "" }) {
  return (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M15.5 15.5 21 21" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

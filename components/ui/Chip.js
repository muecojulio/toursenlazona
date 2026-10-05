"use client";
/** Chip de filtro: estado activo con `aria-pressed` y foco visible. */
export default function Chip({ activo = false, children, ...resto }) {
  return (
    <button
      {...resto}
      type="button"
      className="chip"
      aria-pressed={activo}
      data-activo={activo || undefined}
    >
      {children}
    </button>
  );
}

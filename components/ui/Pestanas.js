"use client";
/**
 * Pestañas accesibles con indicador animado.
 *
 * - Semántica ARIA: `tablist` / `tab` / `tabpanel` con `aria-controls` y `aria-labelledby`.
 * - Teclado: ← → cambian de pestaña, Inicio/Fin van a los extremos (roving tabindex).
 * - El indicador (píldora) se desplaza suavemente hasta la opción activa.
 * - Si no caben, la tira se desplaza de forma nativa, centra la activa y muestra
 *   velos laterales además de la pista «Desliza».
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionReducido } from "../../lib/interacciones.js";

export default function Pestanas({
  opciones,
  activa,
  onCambiar,
  etiqueta = "Secciones",
  idBase = "pestana",
  idPanel = "panel-principal",
  className = "",
}) {
  const tiraRef = useRef(null);
  const [indicador, setIndicador] = useState({ x: 0, ancho: 0, listo: false });
  const [desborde, setDesborde] = useState({ inicio: false, fin: false });
  const reducido = useMotionReducido();

  const posicionar = useCallback(() => {
    const tira = tiraRef.current;
    if (!tira) return;
    const activo = tira.querySelector('[role="tab"][aria-selected="true"]');
    if (!activo) return;
    setIndicador({
      x: activo.offsetLeft,
      ancho: activo.offsetWidth,
      listo: true,
    });
    const sobra = tira.scrollWidth - tira.clientWidth;
    setDesborde({
      inicio: tira.scrollLeft > 4,
      fin: sobra > 4 && tira.scrollLeft < sobra - 4,
    });
    const centro = activo.offsetLeft - (tira.clientWidth - activo.offsetWidth) / 2;
    tira.scrollTo({ left: Math.max(0, centro), behavior: reducido ? "auto" : "smooth" });
  }, [reducido]);

  useLayoutEffect(posicionar, [posicionar, activa, opciones]);

  useEffect(() => {
    const tira = tiraRef.current;
    if (!tira) return;
    let raf = 0;
    const alDesplazar = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const sobra = tira.scrollWidth - tira.clientWidth;
        setDesborde({
          inicio: tira.scrollLeft > 4,
          fin: sobra > 4 && tira.scrollLeft < sobra - 4,
        });
      });
    };
    tira.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", posicionar);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(posicionar) : null;
    ro?.observe(tira);
    return () => {
      tira.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("resize", posicionar);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [posicionar]);

  function alTeclado(evento) {
    const tecla = evento.key;
    const indices = opciones.map((o) => o.id);
    const actual = indices.indexOf(activa);
    let siguiente = null;
    if (tecla === "ArrowRight") siguiente = (actual + 1) % indices.length;
    else if (tecla === "ArrowLeft") siguiente = (actual - 1 + indices.length) % indices.length;
    else if (tecla === "Home") siguiente = 0;
    else if (tecla === "End") siguiente = indices.length - 1;
    if (siguiente === null) return;
    evento.preventDefault();
    onCambiar(indices[siguiente]);
    // El foco sigue a la selección para mantener un orden de tabulación correcto.
    requestAnimationFrame(() => {
      tiraRef.current
        ?.querySelector(`[role="tab"][data-id="${indices[siguiente]}"]`)
        ?.focus();
    });
  }

  const clases = ["pestanas", className].filter(Boolean).join(" ");

  return (
    <div
      className={clases}
      data-desborde-inicio={desborde.inicio || undefined}
      data-desborde-fin={desborde.fin || undefined}
    >
      <div className="pestanas-tira" role="tablist" aria-label={etiqueta} ref={tiraRef} onKeyDown={alTeclado}>
        <span
          className="pestanas-indicador"
          aria-hidden="true"
          style={{
            transform: `translate3d(${indicador.x}px,0,0)`,
            width: indicador.ancho,
            opacity: indicador.listo ? 1 : 0,
          }}
        />
        {opciones.map((o) => {
          const seleccionada = o.id === activa;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              data-id={o.id}
              id={`${idBase}-tab-${o.id}`}
              className={`pestana ${seleccionada ? "on" : ""}`}
              aria-selected={seleccionada}
              aria-controls={idPanel}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => onCambiar(o.id)}
            >
              <span aria-hidden="true">{o.icon}</span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";
/**
 * Carril horizontal nativo (chips, filtros, opciones).
 *
 * - Scroll nativo con momentum y `scroll-snap` moderado: no se intercepta el gesto.
 * - La barra se oculta solo visualmente; la capacidad de desplazarse se mantiene.
 * - Indicadores de desbordamiento (bordes difuminados + pista «Desliza») que
 *   aparecen únicamente cuando hay contenido fuera de vista y se actualizan al desplazar.
 * - La opción seleccionada se centra con desplazamiento suave (o inmediato con
 *   movimiento reducido) y conserva el foco visible.
 * - Un desplazamiento nunca activa una opción por accidente.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Children, cloneElement } from "react";
import { useMotionReducido } from "../../lib/interacciones.js";

export default function Rail({
  children,
  etiqueta,
  valor,
  className = "",
  centrar = true,
  pista = "Desliza",
  itemSelector = "[data-rail-key]",
}) {
  const pistaRef = useRef(null);
  const [desborde, setDesborde] = useState({ inicio: false, fin: false });
  const [visto, setVisto] = useState(false);
  const [pistaVisible, setPistaVisible] = useState(true);
  const reducido = useMotionReducido();
  const arrastrado = useRef(false);

  const medir = useCallback(() => {
    const el = pistaRef.current;
    if (!el) return;
    const sobra = el.scrollWidth - el.clientWidth;
    setDesborde({
      inicio: el.scrollLeft > 4,
      fin: sobra > 4 && el.scrollLeft < sobra - 4,
    });
    if (sobra <= 4) setPistaVisible(false);
  }, []);

  useEffect(() => {
    const el = pistaRef.current;
    if (!el) return;
    medir();
    let raf = 0;
    const alDesplazar = () => {
      if (el.scrollLeft > 8) setVisto(true);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        medir();
      });
    };
    el.addEventListener("scroll", alDesplazar, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(alDesplazar) : null;
    ro?.observe(el);
    window.addEventListener("resize", alDesplazar);
    const t = setTimeout(() => setPistaVisible(false), 3200);
    return () => {
      el.removeEventListener("scroll", alDesplazar);
      ro?.disconnect();
      window.removeEventListener("resize", alDesplazar);
      clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [medir]);

  // Centra la opción seleccionada cuando cambia.
  useEffect(() => {
    const el = pistaRef.current;
    if (!el || !centrar || valor === undefined || valor === null) return;
    const clave = String(valor);
    const destino = el.querySelector(`${itemSelector}[data-rail-key="${clave}"]`);
    if (!destino) return;
    const izquierda =
      destino.offsetLeft - (el.clientWidth - destino.offsetWidth) / 2;
    el.scrollTo({
      left: Math.max(0, izquierda),
      behavior: reducido ? "auto" : "smooth",
    });
  }, [valor, centrar, reducido, itemSelector]);

  // Un arrastre sobre el carril no debe disparar la opción que queda debajo.
  const alDesplazarTactil = (e) => {
    const el = e.currentTarget;
    const inicio = Number(el.dataset.inicioScroll || 0);
    if (Math.abs(el.scrollLeft - inicio) > 6) arrastrado.current = true;
  };

  const alPointerDownPista = (e) => {
    const el = e.currentTarget;
    el.dataset.inicioScroll = String(el.scrollLeft);
    arrastrado.current = false;
  };

  const alClickCaptura = (e) => {
    if (!arrastrado.current) return;
    e.preventDefault();
    e.stopPropagation();
    arrastrado.current = false;
  };

  const hijos = Children.map(children, (hijo) => {
    if (!hijo || typeof hijo.type !== "string" || !hijo.key) return hijo;
    const clave = String(hijo.key).replace(/^\.\$/, "");
    return cloneElement(hijo, { "data-rail-key": clave });
  });

  const clases = [
    "riel",
    desborde.inicio ? "desborda-inicio" : "",
    desborde.fin ? "desborda-fin" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases} role="group" aria-label={etiqueta} data-desplazado={visto || undefined}>
      <div
        className="riel-pista"
        ref={pistaRef}
        onPointerDown={alPointerDownPista}
        onScroll={alDesplazarTactil}
        onClickCapture={alClickCaptura}
      >
        {hijos}
      </div>
      <span className="riel-velo riel-velo-inicio" aria-hidden="true" />
      <span className="riel-velo riel-velo-fin" aria-hidden="true" />
      {pistaVisible && desborde.fin && !visto ? (
        <span className="riel-pista-texto" aria-hidden="true">
          {pista}
        </span>
      ) : null}
    </div>
  );
}

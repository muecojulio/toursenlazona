"use client";
/**
 * Carrusel de tarjetas con scroll nativo y `scroll-snap`.
 *
 * - En móvil es un carril horizontal: asoma parte de la siguiente tarjeta para
 *   sugerir que hay más contenido y `scroll-snap` ayuda a detenerse en una.
 * - En pantallas grandes pasa a cuadrícula (el carrusel deja de ser útil).
 * - Flechas para recorrer con ratón o teclado; la tarjeta seleccionada se resalta
 *   con anillo y marca, no solo con color.
 * - El scroll queda contenido: nunca genera scroll horizontal global.
 */
import { Children, cloneElement, useCallback, useEffect, useRef, useState } from "react";
import { useMotionReducido } from "../../lib/interacciones.js";
import { IconoFlecha } from "./iconos.js";

export default function Carrusel({
  children,
  etiqueta = "Elementos",
  valor,
  className = "",
  itemSelector = "[data-carrusel-item]",
}) {
  const pistaRef = useRef(null);
  const [bordes, setBordes] = useState({ inicio: false, fin: false });
  const reducido = useMotionReducido();

  const medir = useCallback(() => {
    const el = pistaRef.current;
    if (!el) return;
    const sobra = el.scrollWidth - el.clientWidth;
    setBordes({ inicio: el.scrollLeft > 4, fin: sobra > 4 && el.scrollLeft < sobra - 4 });
  }, []);

  useEffect(() => {
    const el = pistaRef.current;
    if (!el) return;
    medir();
    let raf = 0;
    const alDesplazar = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        medir();
      });
    };
    el.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("resize", alDesplazar);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(alDesplazar) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("resize", alDesplazar);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [medir]);

  const desplazar = useCallback(
    (direccion) => {
      const el = pistaRef.current;
      if (!el) return;
      const item = el.querySelector(itemSelector);
      const paso = item ? item.getBoundingClientRect().width + 12 : el.clientWidth * 0.8;
      el.scrollBy({ left: direccion * paso, behavior: reducido ? "auto" : "smooth" });
    },
    [itemSelector, reducido]
  );

  // Desplaza solo la pista (nunca la página) para dejar un elemento a la vista.
  const centrarEn = useCallback(
    (nodo) => {
      const el = pistaRef.current;
      if (!el || !nodo) return;
      const izquierda = nodo.offsetLeft - (el.clientWidth - nodo.offsetWidth) / 2;
      el.scrollTo({
        left: Math.max(0, Math.min(izquierda, el.scrollWidth - el.clientWidth)),
        behavior: reducido ? "auto" : "smooth",
      });
    },
    [reducido]
  );

  // Flechas izquierda/derecha mueven el foco entre tarjetas.
  function alTeclado(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const el = pistaRef.current;
    if (!el) return;
    const items = [...el.querySelectorAll(itemSelector)];
    const actual = items.indexOf(document.activeElement?.closest?.(itemSelector));
    const siguiente = items[actual + (e.key === "ArrowRight" ? 1 : -1)];
    if (!siguiente) return;
    e.preventDefault();
    const enfocable = siguiente.querySelector("button, [href], input, select, textarea") || siguiente;
    enfocable.focus?.();
    centrarEn(siguiente);
  }

  // Centra la tarjeta seleccionada cuando cambia desde fuera del carrusel.
  useEffect(() => {
    const el = pistaRef.current;
    if (!el || valor === undefined || valor === null) return;
    const clave = String(valor);
    centrarEn(el.querySelector(`${itemSelector}[data-carrusel-key="${clave}"]`));
  }, [valor, itemSelector, centrarEn]);

  const hijos = Children.map(children, (hijo, i) => {
    if (!hijo || typeof hijo.type !== "string" || !hijo.key) return hijo;
    const clave = String(hijo.key).replace(/^\.\$/, "");
    const seleccionada = valor !== undefined && valor !== null && String(valor) === clave;
    return cloneElement(hijo, {
      "data-carrusel-item": true,
      "data-carrusel-key": clave,
      "data-seleccionada": seleccionada || undefined,
      "aria-current": seleccionada ? "true" : undefined,
      style: { ...(hijo.props.style || {}), "--i": Math.min(i, 8) },
    });
  });

  const clases = ["carrusel", className].filter(Boolean).join(" ");

  return (
    <div className={clases} role="group" aria-label={etiqueta}>
      <div className="carrusel-controles">
        <button
          type="button"
          className="carrusel-flecha"
          onClick={() => desplazar(-1)}
          disabled={!bordes.inicio}
          aria-label={`${etiqueta}: anterior`}
        >
          <IconoFlecha dir="izquierda" />
        </button>
        <button
          type="button"
          className="carrusel-flecha"
          onClick={() => desplazar(1)}
          disabled={!bordes.fin}
          aria-label={`${etiqueta}: siguiente`}
        >
          <IconoFlecha />
        </button>
      </div>
      <ul className="carrusel-pista" ref={pistaRef} onKeyDown={alTeclado}>
        {hijos}
      </ul>
    </div>
  );
}

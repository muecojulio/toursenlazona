"use client";
/**
 * Panel plegable / acordeón.
 *
 * - `aria-expanded` en el disparador y `role="region"` con nombre en el panel.
 * - La altura se anima con `grid-template-rows` (sin saltos ni mediciones frágiles).
 * - Cerrado, el contenido queda fuera del orden de tabulación (`inert`).
 * - Con movimiento reducido la apertura es inmediata.
 */
import { useId, useState } from "react";
import { IconoFlecha } from "./iconos.js";

export default function Colapsable({
  titulo,
  children,
  abierto: abiertoProp,
  porDefecto = false,
  onToggle,
  nivel = 3,
  className = "",
  extra = null,
}) {
  const generado = useId();
  const id = `colapsable-${generado}`;
  const controlado = abiertoProp !== undefined;
  const [interno, setInterno] = useState(porDefecto);
  const abierto = controlado ? abiertoProp : interno;

  function alternar() {
    if (!controlado) setInterno((v) => !v);
    onToggle?.(!abierto);
  }

  const Cabecera = `h${nivel}`;
  const clases = ["colapsable", abierto ? "abierto" : "", className].filter(Boolean).join(" ");

  return (
    <section className={clases} data-abierto={abierto || undefined}>
      <Cabecera className="colapsable-titulo">
        <button
          type="button"
          className="colapsable-disparador"
          id={`${id}-disparador`}
          aria-expanded={abierto}
          aria-controls={`${id}-panel`}
          onClick={alternar}
        >
          <span className="colapsable-texto">{titulo}</span>
          {extra}
          <IconoFlecha dir={abierto ? "arriba" : "abajo"} className="colapsable-chevron" />
        </button>
      </Cabecera>
      <div
        className="colapsable-cuerpo"
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-disparador`}
        inert={!abierto}
      >
        <div className="colapsable-interior">{children}</div>
      </div>
    </section>
  );
}

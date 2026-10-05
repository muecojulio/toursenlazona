"use client";
/**
 * Interruptor (switch) accesible.
 *
 * `role="switch"` + `aria-checked` comunican nombre y estado; el movimiento es
 * breve y decorativo, nunca la única forma de saber si está activado.
 */
import { useId } from "react";

export default function Interruptor({
  activado = false,
  onChange,
  etiqueta,
  descripcion,
  deshabilitado = false,
  id: idProp,
}) {
  const generado = useId();
  const id = idProp || `switch-${generado}`;
  const idTexto = `${id}-texto`;
  const idDesc = `${id}-desc`;

  return (
    <div className="fila-switch">
      <span className="fila-switch-texto" id={idTexto}>
        {etiqueta}
        {descripcion ? (
          <small id={idDesc} className="fila-switch-desc">
            {descripcion}
          </small>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activado}
        aria-labelledby={idTexto}
        aria-describedby={descripcion ? idDesc : undefined}
        className="interruptor"
        data-activo={activado || undefined}
        disabled={deshabilitado}
        onClick={() => onChange?.(!activado)}
      >
        <span className="interruptor-pista" aria-hidden="true">
          <span className="interruptor-boton" />
        </span>
      </button>
    </div>
  );
}

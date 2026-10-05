"use client";
/**
 * Botón de acción con microinteracciones y estados comunicados.
 *
 * Estados: inactivo · cargando · éxito · error · deshabilitado
 * - `aria-busy` mientras carga y se ignoran pulsaciones repetidas.
 * - Mensaje de estado en una región `role="status"` (no depende del color).
 * - Respuesta táctil: hundimiento + escala corta y sombra más compacta.
 * - Objetivo táctil mínimo de 44 × 44 px y `touch-action: manipulation`.
 */
import { useAccion } from "../../lib/interacciones.js";
import { IconoAlerta, IconoCheck, IconoSpinner } from "./iconos.js";

const ETIQUETAS = {
  cargando: "Cargando…",
  exito: "Listo",
  error: "Revisar",
};

export default function BotonAccion({
  children,
  variante = "gold",
  estado: estadoProp,
  mensaje: mensajeProp,
  mensajeVisible = false,
  onClick,
  textos = {},
  confirmar = true,
  deshabilitado = false,
  expandido = false,
  solo = false,
  className = "",
  type = "button",
  ref: refProp,
  ...resto
}) {
  const auto = useAccion();
  const controlado = estadoProp !== undefined;
  const estado = controlado ? estadoProp : auto.estado;
  const mensaje = controlado ? mensajeProp ?? "" : auto.mensaje;

  const cargando = estado === "cargando";
  const bloqueado = deshabilitado || cargando;

  const etiqueta =
    estado === "cargando"
      ? textos.cargando || ETIQUETAS.cargando
      : estado === "exito" && textos.exito
        ? textos.exito
        : estado === "error" && textos.error
          ? textos.error
          : children;

  const clases = [
    "btn",
    `btn-${variante}`,
    expandido ? "btn-bloque" : "",
    solo ? "btn-solo" : "",
    estado !== "inactivo" ? `is-${estado}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  async function alPulsar(evento) {
    if (bloqueado) {
      evento.preventDefault();
      evento.stopPropagation();
      return;
    }
    let resultado;
    try {
      resultado = onClick?.(evento);
    } catch (error) {
      auto.fallar(textos.error || "No se pudo completar la acción.");
      return;
    }
    if (controlado) return;
    if (resultado && typeof resultado.then === "function") {
      await auto.ejecutar(() => resultado, textos);
      return;
    }
    if (confirmar) auto.confirmar(textos.exito || "");
  }

  const icono =
    estado === "cargando" ? (
      <IconoSpinner className="icon-gira" />
    ) : estado === "exito" ? (
      <IconoCheck />
    ) : estado === "error" ? (
      <IconoAlerta />
    ) : null;

  return (
    <>
      <button
        {...resto}
        ref={refProp}
        type={type}
        className={clases}
        data-estado={estado}
        aria-busy={cargando || undefined}
        aria-disabled={bloqueado || undefined}
        onClick={alPulsar}
      >
        {icono ? (
          <span className="btn-icono" aria-hidden="true">
            {icono}
          </span>
        ) : null}
        <span className="btn-texto">{etiqueta}</span>
      </button>
      {/* Mensaje visible opcional (errores que conviene leer sin lector de pantalla). */}
      {mensajeVisible && mensaje ? (
        <span className="btn-mensaje" data-estado={estado}>
          {mensaje}
        </span>
      ) : null}
      {/* Región de estado: comunica el resultado también a lectores de pantalla. */}
      <span className="sr-solo" role="status" aria-live="polite">
        {mensaje}
      </span>
    </>
  );
}

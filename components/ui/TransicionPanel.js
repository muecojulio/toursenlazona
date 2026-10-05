"use client";
/**
 * Entrada y salida de paneles con desplazamiento corto y fundido.
 *
 * El panel saliente permanece montado ~280 ms (oculto para tecnologías de
 * asistencia con `aria-hidden` + `inert`) para que el cambio no sea brusco.
 *
 * Detalles de implementación:
 * - La capa saliente reutiliza la misma `key` que tenía al entrar, así React
 *   actualiza el nodo en lugar de volver a montarlo: no se repiten efectos ni
 *   se duplican instancias pesadas (por ejemplo el mapa).
 * - El contenido visible se renderiza siempre con los hijos más recientes.
 * - Si el foco estaba dentro del panel saliente, se traslada al entrante.
 */
import { useEffect, useRef, useState } from "react";
import { DUR, useMotionReducido } from "../../lib/interacciones.js";

export default function TransicionPanel({ id, children, direccion = 1, className = "" }) {
  const reducido = useMotionReducido();
  const [estado, setEstado] = useState({ id, previo: null });
  const hijosPrevios = useRef(children);
  const salidaRef = useRef(null);
  const entradaRef = useRef(null);

  // Ajuste de estado derivado: al cambiar de sección se captura el contenido
  // saliente (el del render anterior, todavía en hijosPrevios).
  if (id !== estado.id) {
    setEstado({ id, previo: { id: estado.id, hijos: hijosPrevios.current } });
  }
  hijosPrevios.current = children;

  useEffect(() => {
    if (!estado.previo) return;
    const salida = salidaRef.current;
    const activo = document.activeElement;
    if (salida && activo && salida.contains(activo)) entradaRef.current?.focus?.();
    const t = setTimeout(
      () => setEstado((s) => ({ ...s, previo: null })),
      reducido ? 0 : DUR.panel + 60
    );
    return () => clearTimeout(t);
  }, [estado.previo, reducido]);

  const clases = ["transicion", className].filter(Boolean).join(" ");

  return (
    <div className={clases} data-direccion={direccion}>
      {estado.previo ? (
        <div
          className="panel-capa panel-sale"
          key={`panel-${estado.previo.id}`}
          ref={salidaRef}
          aria-hidden="true"
          inert
        >
          {estado.previo.hijos}
        </div>
      ) : null}
      <div className="panel-capa panel-entra" key={`panel-${id}`} ref={entradaRef} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

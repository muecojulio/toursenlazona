"use client";
/**
 * Fila con acciones reveladas por swipe.
 *
 * - Bloqueo de eje: la tarjeta solo se mueve cuando el gesto es claramente
 *   horizontal; el scroll vertical sigue siendo del navegador (`touch-action: pan-y`).
 * - El desplazamiento se limita al ancho del panel de acciones y hay umbral
 *   (además de velocidad) para decidir apertura o cierre.
 * - Nunca es la única vía: hay un botón visible «Acciones» y, en escritorio,
 *   las acciones se muestran directamente.
 * - Mientras están ocultas no entran en el orden de foco ni se anuncian (`inert`).
 * - Un clic posterior a un arrastre no activa la tarjeta ni sus controles.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  UMBRAL_ACCIONES,
  UMBRAL_RAPIDO_ACCIONES,
  UMBRAL_DRAG,
  VELOCIDAD_GESTO,
  limitar,
  esControlInteractivo,
  useAncho,
  useArrastreHorizontal,
  usePunteroFino,
} from "../../lib/interacciones.js";
import { IconoMas } from "./iconos.js";

export default function FilaSwipe({
  children,
  acciones = [],
  etiqueta = "Acciones",
  etiquetaBoton = "Mostrar acciones",
  className = "",
}) {
  const generado = useId();
  const id = `fila-${generado}`;
  const pistaRef = useRef(null);
  const accionesRef = useRef(null);
  const [abierta, setAbierta] = useState(false);
  const [dx, setDx] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const anchoAcciones = useAncho(accionesRef, 0);
  const punteroFino = usePunteroFino();
  const arrastro = useRef(false);

  const maxDesplazamiento = anchoAcciones || 160;
  const visible = abierta || punteroFino;
  // Mientras se arrastra manda el gesto; en reposo la fila queda en abierta
  // (-ancho del panel de acciones) o cerrada (0).
  const desplazamiento = arrastrando ? dx : abierta ? -maxDesplazamiento : 0;

  // Cierra con Escape o al desplazar la página.
  useEffect(() => {
    if (!abierta) return;
    const escape = (e) => {
      if (e.key === "Escape") setAbierta(false);
    };
    const scroll = () => setAbierta(false);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", scroll);
    };
  }, [abierta]);

  const alIniciar = useCallback(() => {
    arrastro.current = false;
    setArrastrando(true);
  }, []);

  const alMover = useCallback(
    ({ dx: deltaX }) => {
      arrastro.current = Math.abs(deltaX) > UMBRAL_DRAG;
      if (deltaX < 0) setDx(limitar(deltaX, -maxDesplazamiento, 0));
      else setDx(deltaX * 0.18); // resistencia al abrir hacia la derecha
    },
    [maxDesplazamiento]
  );

  const alSoltar = useCallback(
    ({ dx: deltaX, dt, cancelado }) => {
      setArrastrando(false);
      if (cancelado) {
        setDx(0);
        return;
      }
      const velocidad = Math.abs(deltaX) / dt;
      const umbral = maxDesplazamiento * UMBRAL_ACCIONES;
      if (deltaX < 0 && (Math.abs(deltaX) > umbral || (velocidad > VELOCIDAD_GESTO && Math.abs(deltaX) >= UMBRAL_RAPIDO_ACCIONES))) {
        setAbierta(true);
      } else if (deltaX > 0 && (Math.abs(deltaX) > umbral * 0.7 || velocidad > VELOCIDAD_GESTO)) {
        setAbierta(false);
      }
      setDx(0);
    },
    [maxDesplazamiento]
  );

  useArrastreHorizontal(pistaRef, {
    habilitado: !punteroFino,
    onStart: alIniciar,
    onMove: alMover,
    onEnd: alSoltar,
    puedeIniciar: (e) => {
      if (punteroFino) return false;
      if (e.pointerType === "mouse") return false; // en escritorio manda el botón
      return !esControlInteractivo(e.target);
    },
  });

  // Un clic justo después de arrastrar no debe activar la tarjeta.
  const alClickCaptura = (e) => {
    if (!arrastro.current) return;
    arrastro.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const clases = [
    "fila-swipe",
    abierta ? "abierta" : "",
    punteroFino ? "en-escritorio" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={clases}
      data-abierta={abierta || undefined}
      data-arrastrando={arrastrando || undefined}
      data-escritorio={punteroFino || undefined}
    >
      <div className="fila-swipe-pista" ref={pistaRef} onClickCapture={alClickCaptura}>
        <div
          className="fila-swipe-acciones"
          id={`${id}-acciones`}
          ref={accionesRef}
          role="group"
          aria-label={etiqueta}
          inert={!visible}
          aria-hidden={!visible || undefined}
        >
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`fila-accion fila-accion-${a.variante || "suave"}`}
              onClick={() => {
                setAbierta(false);
                a.onClick?.();
              }}
            >
              {a.icono ? (
                <span className="fila-accion-icono" aria-hidden="true">
                  {a.icono}
                </span>
              ) : null}
              <span className="fila-accion-texto">{a.etiqueta}</span>
            </button>
          ))}
        </div>
        <div
          className="fila-swipe-contenido"
          style={{ transform: `translate3d(${desplazamiento}px,0,0)` }}
        >
          {children}
        </div>
      </div>
      <button
        type="button"
        className="fila-swipe-mas"
        aria-expanded={abierta}
        aria-controls={`${id}-acciones`}
        onClick={() => setAbierta((v) => !v)}
      >
        <IconoMas />
        <span className="sr-solo">{etiquetaBoton}</span>
      </button>
    </div>
  );
}

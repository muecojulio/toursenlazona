"use client";
/**
 * Primitivas compartidas del sistema de interacción.
 *
 * No añade dependencias: solo React y APIs nativas del navegador
 * (pointer events, matchMedia, ResizeObserver).
 */
import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * Constantes de movimiento
 * ------------------------------------------------------------------ */

/** Duraciones breves y coherentes (ms). */
export const DUR = { panel: 220 };

/** Un gesto es horizontal cuando dx supera claramente a dy (proporción 1,2). */
export const RATIO_EJE = 1.2;

/** Distancia mínima antes de decidir el eje del gesto. */
export const UMBRAL_EJE = 10;

/** Distancia mínima para cambiar de sección con swipe. */
export const UMBRAL_SECCION = 52;

/** Distancia mínima para que un gesto rápido cambie de sección. */
export const UMBRAL_RAPIDO = 30;

/** Distancia mínima de un gesto rápido para abrir acciones por swipe. */
export const UMBRAL_RAPIDO_ACCIONES = 26;

/** Velocidad mínima (px/ms) para aceptar un gesto rápido. */
export const VELOCIDAD_GESTO = 0.45;

/** Proporción del ancho del panel de acciones que obliga a abrirlo. */
export const UMBRAL_ACCIONES = 0.45;

/** Distancia a partir de la cual un arrastre se considera drag (no clic). */
export const UMBRAL_DRAG = 8;

/** Selector de controles que nunca deben iniciar un gesto de swipe. */
export const SELECTOR_CONTROLES = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='option']",
  "[role='switch']",
  "[role='combobox']",
  "[role='listbox']",
  "[data-no-gesto]",
].join(",");

/* ------------------------------------------------------------------ *
 * Utilidades puras
 * ------------------------------------------------------------------ */

/** Minúsculas sin diacríticos: comparaciones tolerantes en español. */
export function normalizar(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** ¿El elemento (o un ancestro) es un control interactivo? */
export function esControlInteractivo(nodo) {
  if (!nodo || nodo.nodeType !== 1 || typeof nodo.closest !== "function") return false;
  return !!nodo.closest(SELECTOR_CONTROLES);
}

/** Dirección dominante de un gesto a partir de sus desplazamientos. */
export function direccionGesto(dx, dy, ratio = RATIO_EJE) {
  if (Math.abs(dx) < UMBRAL_EJE && Math.abs(dy) < UMBRAL_EJE) return null;
  if (Math.abs(dx) > Math.abs(dy) * ratio) return "x";
  return "y";
}

/** Limita un número a un rango. */
export function limitar(valor, min, max) {
  return Math.min(Math.max(valor, min), max);
}

/* ------------------------------------------------------------------ *
 * Hooks
 * ------------------------------------------------------------------ */

/** true cuando el usuario pide movimiento reducido. */
export function useMotionReducido() {
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizar = (e) => setReducido(e.matches);
    actualizar(mq);
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  return reducido;
}

/** true en dispositivos con ratón o trackpad de precisión. */
export function usePunteroFino() {
  const [fino, setFino] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const actualizar = (e) => setFino(e.matches);
    actualizar(mq);
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  return fino;
}

/** Ancho real de un elemento, observando cambios de tamaño. */
export function useAncho(ref, inicial = 0) {
  const [ancho, setAncho] = useState(inicial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setAncho(el.getBoundingClientRect().width);
    medir();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return ancho;
}

/**
 * Ciclo de vida de una acción: inactivo → cargando → éxito | error.
 * Evita envíos duplicados y expone un mensaje para tecnologías de asistencia.
 */
export function useAccion({ exitoMs = 1900, errorMs = 3200 } = {}) {
  const [estado, setEstado] = useState("inactivo");
  const [mensaje, setMensaje] = useState("");
  const temporizador = useRef(null);
  const ocupado = useRef(false);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  // Muestra el resultado durante unos instantes y vuelve a «inactivo».
  // No bloquea el control: solo la carga impide nuevos envíos.
  const reprogramar = useCallback((nuevoEstado, texto, ms) => {
    clearTimeout(temporizador.current);
    setEstado(nuevoEstado);
    setMensaje(texto || "");
    if (ms) {
      temporizador.current = setTimeout(() => {
        setEstado("inactivo");
        setMensaje("");
      }, ms);
    }
  }, []);

  const ejecutar = useCallback(
    async (tarea, textos = {}) => {
      if (ocupado.current) return { ok: false, motivo: "ocupado" };
      ocupado.current = true;
      setEstado("cargando");
      setMensaje(textos.cargando || "");
      try {
        const valor = await tarea();
        reprogramar("exito", textos.exito || "", exitoMs);
        return { ok: true, valor };
      } catch (error) {
        reprogramar("error", textos.error || "No se pudo completar la acción.", errorMs);
        return { ok: false, error };
      } finally {
        // La acción terminó: se puede reintentar aunque siga el mensaje visible.
        ocupado.current = false;
      }
    },
    [exitoMs, errorMs, reprogramar]
  );

  const confirmar = useCallback(
    (texto = "", ms = exitoMs) => reprogramar("exito", texto, ms),
    [exitoMs, reprogramar]
  );

  const fallar = useCallback(
    (texto = "No se pudo completar la acción.", ms = errorMs) =>
      reprogramar("error", texto, ms),
    [errorMs, reprogramar]
  );

  const reiniciar = useCallback(() => {
    clearTimeout(temporizador.current);
    ocupado.current = false;
    setEstado("inactivo");
    setMensaje("");
  }, []);

  return { estado, mensaje, ejecutar, confirmar, fallar, reiniciar };
}

/**
 * Arrastre horizontal con bloqueo de eje.
 *
 * - `touch-action: pan-y` en el elemento deja el scroll vertical al navegador.
 * - El gesto solo se considera horizontal cuando dx supera a dy por RATIO_EJE.
 * - Los gestos que empiezan sobre controles interactivos se ignoran.
 */
export function useArrastreHorizontal(ref, opciones = {}) {
  const {
    habilitado = true,
    onStart,
    onMove,
    onEnd,
    puedeIniciar,
    ratio = RATIO_EJE,
  } = opciones;

  const opcionesRef = useRef({ onStart, onMove, onEnd, puedeIniciar, ratio });
  opcionesRef.current = { onStart, onMove, onEnd, puedeIniciar, ratio };

  useEffect(() => {
    const el = ref.current;
    if (!el || !habilitado) return;

    let gesto = null;

    const limpiarVentana = () => {
      window.removeEventListener("pointermove", onMoveVentana);
      window.removeEventListener("pointerup", onUpVentana);
      window.removeEventListener("pointercancel", onCancelVentana);
    };

    function onMoveVentana(e) {
      const g = gesto;
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      g.dx = dx;
      g.dy = dy;
      if (g.eje === null) {
        const dir = direccionGesto(dx, dy, g.ratio);
        if (!dir) return;
        g.eje = dir;
        // Vertical: el navegador conserva el scroll y abandonamos el gesto.
        if (dir === "y") {
          limpiarVentana();
          gesto = null;
          opcionesRef.current.onEnd?.({ dx: 0, dy: 0, dt: 0, cancelado: true });
          return;
        }
        g.t0 = e.timeStamp;
      }
      opcionesRef.current.onMove?.({
        dx,
        dy,
        dt: Math.max(1, e.timeStamp - g.t0),
        horizontal: g.eje === "x",
      });
    }

    function terminar(cancelado) {
      const g = gesto;
      if (!g) return;
      gesto = null;
      limpiarVentana();
      opcionesRef.current.onEnd?.({
        dx: g.dx,
        dy: g.dy,
        dt: Math.max(1, performance.now() - g.t0),
        horizontal: g.eje === "x",
        cancelado: !!cancelado,
        movido: Math.abs(g.dx) > UMBRAL_DRAG || Math.abs(g.dy) > UMBRAL_DRAG,
      });
    }

    function onUpVentana() {
      terminar(false);
    }

    function onCancelVentana() {
      terminar(true);
    }

    function onDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const { puedeIniciar: filtro } = opcionesRef.current;
      if (filtro && !filtro(e)) return;
      gesto = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        t0: e.timeStamp,
        dx: 0,
        dy: 0,
        eje: null,
        ratio: opcionesRef.current.ratio,
      };
      opcionesRef.current.onStart?.(e);
      window.addEventListener("pointermove", onMoveVentana, { passive: true });
      window.addEventListener("pointerup", onUpVentana);
      window.addEventListener("pointercancel", onCancelVentana);
    }

    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      limpiarVentana();
    };
  }, [ref, habilitado]);
}

/** Cierra al pulsar fuera del elemento o al presionar Escape. */
export function useCerrarFuera(ref, activo, alCerrar) {
  useEffect(() => {
    if (!activo) return;
    const fuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) alCerrar?.();
    };
    const escape = (e) => {
      if (e.key === "Escape") alCerrar?.();
    };
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      document.removeEventListener("keydown", escape);
    };
  }, [ref, activo, alCerrar]);
}


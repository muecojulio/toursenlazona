"use client";

import { useEffect, useState } from "react";

/**
 * Imagen de un lugar con alternativas: primero la foto del catálogo, después
 * una imagen de Wikipedia/Commons y, por último, un recurso gráfico visible.
 */
export default function ImagenLugar({
  src,
  fallbackSrc,
  fallbackTitle,
  alt,
  emoji = "📍",
  className = "",
  loading = "lazy",
}) {
  const identidad = JSON.stringify([src || "", fallbackTitle || ""]);
  const [fallos, setFallos] = useState({ identidad: "", fuentes: [] });
  const [rescate, setRescate] = useState({ identidad: "", fuente: "", intentado: false });
  const fallosActuales = fallos.identidad === identidad ? fallos.fuentes : [];
  const rescateActual = rescate.identidad === identidad
    ? rescate
    : { identidad, fuente: "", intentado: false };
  const fuentes = [...new Set([src, fallbackSrc, rescateActual.fuente].filter((fuente) => typeof fuente === "string" && fuente.trim()))];
  const fuente = fuentes.find((alternativa) => !fallosActuales.includes(alternativa));
  const clases = ["imagen-lugar", className].filter(Boolean).join(" ");

  // Si también falla la foto del catálogo, prueba a recuperar una imagen del
  // artículo correspondiente por la API del propio sitio.
  useEffect(() => {
    if (fuente || !fallbackTitle || rescateActual.intentado) return undefined;
    const controller = new AbortController();
    fetch(`/api/place?title=${encodeURIComponent(fallbackTitle)}`, { signal: controller.signal })
      .then((respuesta) => respuesta.ok ? respuesta.json() : null)
      .then((datos) => {
        if (controller.signal.aborted) return;
        const alternativa = datos?.image?.thumbnail || datos?.image?.original || "";
        setRescate({ identidad, fuente: alternativa, intentado: true });
      })
      .catch(() => {
        if (!controller.signal.aborted) setRescate({ identidad, fuente: "", intentado: true });
      });

    return () => controller.abort();
  }, [fuente, fallbackTitle, rescateActual.intentado, identidad]);

  if (!fuente) {
    return (
      <span
        className={`${clases} imagen-lugar-fallback`}
        role="img"
        aria-label={`Imagen del lugar no disponible: ${alt || "lugar"}`}
      >
        <span className="imagen-lugar-fallback-simbolo" aria-hidden="true">{emoji}</span>
        <span className="imagen-lugar-fallback-texto">Imagen del lugar</span>
      </span>
    );
  }

  return (
    <img
      className={clases}
      src={fuente}
      alt={alt || "Imagen del lugar"}
      loading={loading}
      decoding="async"
      onError={() => {
        setFallos((estado) => {
          const anteriores = estado.identidad === identidad ? estado.fuentes : [];
          return anteriores.includes(fuente)
            ? estado
            : { identidad, fuentes: [...anteriores, fuente] };
        });
      }}
    />
  );
}

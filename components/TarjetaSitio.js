"use client";
/**
 * Tarjeta de sitio: acción principal siempre visible y acciones secundarias
 * accesibles con ratón, teclado y pantalla táctil.
 */
import BotonAccion from "./ui/BotonAccion.js";
import { IconoCheck } from "./ui/iconos.js";

export default function TarjetaSitio({
  sitio,
  onEntrar,
  onEscuchar,
  seleccionada = false,
  etiquetaPrincipal = "Entrar al sitio",
}) {
  if (!sitio) return null;
  return (
    <article className="tarjeta" data-seleccionada={seleccionada || undefined}>
      <img className="tarjeta-foto" src={sitio.foto} alt="" loading="lazy" decoding="async" />
      <div className="tarjeta-cuerpo">
        <h3 className="tarjeta-titulo">
          {sitio.emoji} {sitio.nombre}
        </h3>
        <p className="meta">{sitio.ciudad} · {sitio.pais}</p>
        <p className="tarjeta-epoca">{sitio.epoca}</p>
        <div className="tarjeta-acciones">
          <BotonAccion
            variante="gold"
            textos={{ cargando: "Abriendo…", exito: "Tour abierto" }}
            onClick={() => onEntrar?.(sitio)}
          >
            {etiquetaPrincipal}
          </BotonAccion>
          {onEscuchar ? (
            <BotonAccion
              variante="ghost"
              solo
              confirmar={false}
              aria-label={`Escuchar el resumen de ${sitio.nombre}`}
              onClick={() => onEscuchar?.(sitio)}
            >
              <span aria-hidden="true">🔊</span>
            </BotonAccion>
          ) : null}
        </div>
      </div>
      {seleccionada ? (
        <span className="tarjeta-marca" aria-hidden="true">
          <IconoCheck />
          <span className="sr-solo">Sitio seleccionado</span>
        </span>
      ) : null}
    </article>
  );
}

"use client";
/**
 * Campo de búsqueda con combobox accesible (ARIA 1.2).
 *
 * - Filtra mientras se escribe ignorando mayúsculas y diacríticos.
 * - Semántica completa: `role="combobox"` + `aria-expanded`, `aria-controls`,
 *   `aria-activedescendant`, listbox con opción activa y opción seleccionada.
 * - Teclado: ↑ ↓ (con envoltura), Inicio/Fin, Enter para confirmar, Escape para cerrar.
 * - La opción activa siempre se mantiene visible; altura limitada y scroll interno
 *   sin desplazar la página (`overscroll-behavior: contain`).
 * - Cierra al pulsar fuera, conserva el foco en el campo y ofrece un botón táctil
 *   cómodo para abrir o cerrar la lista.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizar, useCerrarFuera, useMotionReducido } from "../../lib/interacciones.js";
import { IconoBuscar, IconoCerrar, IconoFlecha } from "./iconos.js";

export default function BuscadorCombo({
  valor,
  onCambiar,
  opciones = [],
  etiqueta = "Buscar",
  placeholder = "Buscar…",
  etiquetaOpcion = (o) => o.nombre ?? String(o),
  descripcionOpcion = null,
  claveOpcion = (o, i) => String(o.id ?? i),
  alElegir,
  textos = {},
  limite = 8,
  id: idProp,
  campos = ["nombre", "ciudad", "pais", "epoca"],
}) {
  const generado = useId();
  const id = idProp || `combo-${generado}`;
  const idLista = `${id}-lista`;
  const idAyuda = `${id}-ayuda`;

  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const contenedor = useRef(null);
  const listaRef = useRef(null);
  const inputRef = useRef(null);
  const reducido = useMotionReducido();

  const t = useMemo(() => {
    const base = {
      sinResultados: "Sin coincidencias",
      abrir: "Mostrar sugerencias",
      cerrar: "Ocultar sugerencias",
      limpiar: "Borrar la búsqueda",
      resultados: (n) => `${n} ${n === 1 ? "resultado" : "resultados"}`,
    };
    const propios = Object.fromEntries(
      Object.entries(textos).filter(([, v]) => v !== undefined)
    );
    return { ...base, ...propios };
  }, [textos]);

  const coincidencias = useMemo(() => {
    const q = normalizar(valor);
    if (!q) return opciones.slice(0, limite);
    return opciones
      .filter((o) => {
        const texto = campos.map((c) => normalizar(o?.[c])).join(" ");
        const nombre = normalizar(etiquetaOpcion(o));
        return texto.includes(q) || nombre.includes(q);
      })
      .slice(0, limite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, opciones, limite]);

  useCerrarFuera(contenedor, abierto, () => {
    setAbierto(false);
    setActivo(-1);
  });

  // Mantiene visible la opción activa mientras se navega con el teclado.
  useEffect(() => {
    if (!abierto || activo < 0) return;
    const nodo = listaRef.current?.querySelector('[data-activa="true"]');
    nodo?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: reducido ? "auto" : "smooth",
    });
  }, [activo, abierto, reducido]);

  function abrirLista() {
    setAbierto(true);
    if (coincidencias.length) setActivo((a) => (a >= 0 && a < coincidencias.length ? a : 0));
  }

  function elegir(indice) {
    const sitio = coincidencias[indice];
    if (!sitio) return;
    setActivo(indice);
    alElegir?.(sitio);
  }

  function alTeclado(e) {
    const tecla = e.key;
    if (tecla === "ArrowDown") {
      e.preventDefault();
      if (!abierto) return abrirLista();
      if (!coincidencias.length) return;
      setActivo((a) => (a + 1) % coincidencias.length);
      return;
    }
    if (tecla === "ArrowUp") {
      e.preventDefault();
      if (!abierto) return abrirLista();
      if (!coincidencias.length) return;
      setActivo((a) => (a <= 0 ? coincidencias.length - 1 : a - 1));
      return;
    }
    if (tecla === "Home" && abierto) {
      e.preventDefault();
      if (coincidencias.length) setActivo(0);
      return;
    }
    if (tecla === "End" && abierto) {
      e.preventDefault();
      if (coincidencias.length) setActivo(coincidencias.length - 1);
      return;
    }
    if (tecla === "Enter") {
      if (abierto && activo >= 0) {
        e.preventDefault();
        elegir(activo);
      }
      return;
    }
    if (tecla === "Escape") {
      if (abierto) {
        e.preventDefault();
        setAbierto(false);
        setActivo(-1);
      } else if (valor) {
        onCambiar("");
      }
      return;
    }
    if (tecla === "Tab") setAbierto(false);
  }

  const anuncio = !coincidencias.length
    ? `${t.sinResultados} para «${valor}».`
    : `${t.resultados(coincidencias.length)}. Usa las flechas para revisar.`;

  return (
    <div className="combo" ref={contenedor} data-abierto={abierto || undefined}>
      <label className="combo-etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="combo-campo">
        <span className="combo-icono" aria-hidden="true">
          <IconoBuscar />
        </span>
        <input
          ref={inputRef}
          id={id}
          className="combo-input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={valor}
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-describedby={idAyuda}
          aria-activedescendant={abierto && activo >= 0 ? `${id}-op-${activo}` : undefined}
          onChange={(e) => {
            onCambiar(e.target.value);
            setActivo(-1);
            abrirLista();
          }}
          onFocus={() => abrirLista()}
          onKeyDown={alTeclado}
        />
        {valor ? (
          <button
            type="button"
            className="combo-boton"
            onClick={() => {
              onCambiar("");
              inputRef.current?.focus();
              abrirLista();
            }}
          >
            <IconoCerrar />
            <span className="sr-solo">{t.limpiar}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="combo-boton"
          aria-expanded={abierto}
          aria-controls={idLista}
          onClick={() => {
            if (abierto) {
              setAbierto(false);
              setActivo(-1);
            } else {
              inputRef.current?.focus();
              abrirLista();
            }
          }}
        >
          <IconoFlecha dir={abierto ? "arriba" : "abajo"} />
          <span className="sr-solo">{abierto ? t.cerrar : t.abrir}</span>
        </button>
      </div>

      <ul
        className="combo-lista"
        id={idLista}
        role="listbox"
        aria-label={textos.etiquetaLista || "Sugerencias"}
        ref={listaRef}
        hidden={!abierto}
      >
        {coincidencias.length === 0 ? (
          <li className="combo-vacio" role="option" aria-disabled="true" aria-selected="false">
            {t.sinResultados}
            {valor ? <b> «{valor}»</b> : null}
          </li>
        ) : (
          coincidencias.map((o, i) => {
            const seleccionada = i === activo;
            const descripcion = descripcionOpcion?.(o);
            return (
              <li
                key={claveOpcion(o, i)}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={seleccionada}
                data-activa={seleccionada || undefined}
                className={`combo-opcion ${seleccionada ? "activa" : ""}`}
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(i);
                }}
              >
                <span className="combo-opcion-texto">{etiquetaOpcion(o)}</span>
                {descripcion ? <span className="combo-opcion-dato">{descripcion}</span> : null}
              </li>
            );
          })
        )}
      </ul>

      <p className="sr-solo" id={idAyuda}>
        {textos.ayuda || "Escribe para filtrar. Usa flechas, Enter y Escape."}
      </p>
      <span className="sr-solo" role="status" aria-live="polite">
        {anuncio}
      </span>
    </div>
  );
}

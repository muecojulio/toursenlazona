"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sitios } from "../data/sitios.js";
import { getSitioById, SITIOS_BY_REGION } from "../data/indexes.js";
import { TABS, FILTROS, TONOS, TIPOS, tipoDeVoz, coincideFiltro, centroMapa } from "./tourConfig.js";
import {
  UMBRAL_RAPIDO,
  UMBRAL_SECCION,
  VELOCIDAD_GESTO,
  esControlInteractivo,
  limitar,
  useAccion,
  useArrastreHorizontal,
  useMotionReducido,
} from "../lib/interacciones.js";
import Pestanas from "./ui/Pestanas.js";
import TransicionPanel from "./ui/TransicionPanel.js";
import Rail from "./ui/Rail.js";
import Chip from "./ui/Chip.js";
import Carrusel from "./ui/Carrusel.js";
import FilaSwipe from "./ui/FilaSwipe.js";
import BotonAccion from "./ui/BotonAccion.js";
import BuscadorCombo from "./ui/BuscadorCombo.js";
import Interruptor from "./ui/Interruptor.js";
import Colapsable from "./ui/Colapsable.js";
import TarjetaSitio from "./TarjetaSitio.js";
import RegionAnuncio from "./ui/RegionAnuncio.js";

const ORDEN_TABS = TABS.map((t) => t.id);

export default function TourApp() {
  const [tab, setTab] = useState("inicio");
  const [direccion, setDireccion] = useState(1);
  const [vistaPrevia, setVistaPrevia] = useState(0);
  const [anuncio, setAnuncio] = useState("");
  const [cargandoInfo, setCargandoInfo] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [q, setQ] = useState("");
  const [actual, setActual] = useState(() => getSitioById("fushimi") || sitios[0]);
  const [hablando, setHablando] = useState(false);
  const [arOn, setArOn] = useState(false);
  const [url, setUrl] = useState("");
  const [msgCamara, setMsgCamara] = useState("");
  const [voces, setVoces] = useState([]);
  const [tipoVoz, setTipoVoz] = useState("todas");
  const [vozId, setVozId] = useState("");
  const [tonoId, setTonoId] = useState("museo");
  const [instalarEvt, setInstalarEvt] = useState(null);
  const [instalada, setInstalada] = useState(false);
  const [enriquecido, setEnriquecido] = useState(null);
  const [clima, setClima] = useState(null);
  const [paisInfo, setPaisInfo] = useState(null);
  const [sol, setSol] = useState(null);
  const [festivos, setFestivos] = useState([]);
  const [ahorrarDatos, setAhorrarDatos] = useState(false);
  const appRef = useRef(null);
  const panelesRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const arBotonCerrar = useRef(null);
  const temporizadorAnuncio = useRef(null);

  const reducido = useMotionReducido();
  const camara = useAccion({ exitoMs: 2400, errorMs: 4600 });
  const instalacion = useAccion({ exitoMs: 2600, errorMs: 3600 });

  const avisar = useCallback((texto) => {
    clearTimeout(temporizadorAnuncio.current);
    setAnuncio(texto);
    temporizadorAnuncio.current = setTimeout(() => setAnuncio(""), 4200);
  }, []);

  useEffect(() => () => clearTimeout(temporizadorAnuncio.current), []);

  useEffect(() => {
    setUrl(window.location.origin);
    const sola = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalada(!!sola);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e) => { e.preventDefault(); setInstalarEvt(e); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const saved = window.localStorage.getItem("tours-voz");
    if (saved) {
      try {
        const o = JSON.parse(saved);
        if (o.tipoVoz) setTipoVoz(o.tipoVoz);
        if (o.vozId) setVozId(o.vozId);
        if (o.tonoId) setTonoId(o.tonoId);
      } catch {}
    }
    const cargar = () => setVoces(window.speechSynthesis?.getVoices?.() || []);
    cargar();
    window.speechSynthesis?.addEventListener("voiceschanged", cargar);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", cargar);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tours-voz", JSON.stringify({ tipoVoz, vozId, tonoId }));
  }, [tipoVoz, vozId, tonoId]);

  useEffect(() => {
    let cancelled = false;
    setEnriquecido(null); setClima(null); setPaisInfo(null); setSol(null); setFestivos([]);
    if (!actual) return;
    setCargandoInfo(true);
    const slug = encodeURIComponent(actual.wikipedia || actual.nombre);
    const fin = () => { if (!cancelled) setCargandoInfo(false); };
    fetch(`/api/place?title=${slug}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setEnriquecido(v); }).catch(() => {}).finally(fin);
    fetch(`/api/weather?lat=${actual.lat}&lng=${actual.lng}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setClima(v); }).catch(() => {});
    if (!ahorrarDatos) {
      fetch(`/api/country?pais=${encodeURIComponent(actual.pais)}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setPaisInfo(v); }).catch(() => {});
      fetch(`/api/sun?lat=${actual.lat}&lng=${actual.lng}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setSol(v); }).catch(() => {});
      fetch(`/api/holidays?pais=${encodeURIComponent(actual.pais)}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setFestivos(v?.holidays || []); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [actual, ahorrarDatos]);

  const vocesEs = useMemo(() => {
    const es = voces.filter((v) => (v.lang || "").toLowerCase().startsWith("es"));
    const base = es.length ? es : voces;
    if (tipoVoz === "todas") return base;
    const filtradas = base.filter((v) => tipoDeVoz(v) === tipoVoz);
    return filtradas.length ? filtradas : base;
  }, [voces, tipoVoz]);

  const lista = useMemo(() => {
    const base = filtro === "Japón" || filtro === "Mundo" ? SITIOS_BY_REGION[filtro] || [] : sitios;
    const busqueda = q.trim().toLowerCase();
    return base.filter((s) => {
      const texto = `${s.nombre} ${s.ciudad} ${s.pais} ${s.epoca}`.toLowerCase();
      return coincideFiltro(s, filtro) && texto.includes(busqueda);
    });
  }, [filtro, q]);

  function narrar(texto) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const tono = TONOS.find((t) => t.id === tonoId) || TONOS[0];
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = tono.lang; u.rate = tono.rate; u.pitch = tono.pitch;
    const elegida = vocesEs.find((v) => v.voiceURI === vozId) || vocesEs[0];
    if (elegida) { u.voice = elegida; u.lang = elegida.lang || tono.lang; }
    u.onend = () => setHablando(false);
    u.onerror = () => setHablando(false);
    setHablando(true);
    window.speechSynthesis.speak(u);
  }

  function cambiarTab(id) {
    if (id === tab) return;
    setDireccion(ORDEN_TABS.indexOf(id) > ORDEN_TABS.indexOf(tab) ? 1 : -1);
    setTab(id);
    appRef.current?.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
    avisar(`Sección ${TABS.find((t) => t.id === id)?.label || id}`);
  }

  function abrirTour(sitio, anunciar = true) {
    if (!sitio) return;
    setActual(sitio);
    setTab("tour");
    setDireccion(ORDEN_TABS.indexOf("tour") > ORDEN_TABS.indexOf(tab) ? 1 : -1);
    window.speechSynthesis?.cancel();
    setHablando(false);
    appRef.current?.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
    if (anunciar) avisar(`Tour de ${sitio.nombre} abierto`);
  }

  function verEnMapa(sitio) {
    if (!sitio) return;
    setActual(sitio);
    cambiarTab("mapa");
  }

  function toggleAudio(sitio) {
    if (hablando) {
      window.speechSynthesis?.cancel();
      setHablando(false);
      avisar("Narración en pausa");
      return;
    }
    const objetivo = sitio || actual;
    if (!objetivo) return;
    narrar(`${objetivo.nombre}. ${objetivo.audio}`);
    avisar(`Reproduciendo la guía de ${objetivo.nombre}`);
  }

  async function descargarApp() {
    if (instalarEvt) {
      await instalacion.ejecutar(async () => {
        instalarEvt.prompt();
        const res = await instalarEvt.userChoice;
        if (res.outcome !== "accepted") throw new Error("cancelado");
        setInstalada(true);
        setInstalarEvt(null);
      }, {
        cargando: "Abriendo el instalador…",
        exito: "Aplicación instalada.",
        error: "Instalación cancelada. Puedes reintentarlo.",
      });
      return;
    }
    cambiarTab("instalar");
  }

  async function abrirAR() {
    setMsgCamara("");
    await camara.ejecutar(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setArOn(true);
      narrar(`Modo inmersivo de ${actual.nombre}. ${actual.resumen}`);
    }, {
      cargando: "Activando la cámara…",
      exito: "Modo inmersivo listo.",
      error: "Este dispositivo no permitió la cámara.",
    });
  }

  function cerrarAR() {
    setArOn(false);
    window.speechSynthesis?.cancel();
    setHablando(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    avisar("Modo inmersivo cerrado");
  }

  // Escape cierra el modo inmersivo y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!arOn) return;
    const alTeclado = (e) => {
      if (e.key === "Escape") cerrarAR();
    };
    document.addEventListener("keydown", alTeclado);
    const t = setTimeout(() => arBotonCerrar.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", alTeclado);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arOn]);

  useEffect(() => {
    if (tab !== "mapa") return;
    let cancelled = false;
    function ensureLeaflet() {
      return new Promise((resolve) => {
        if (window.L) return resolve(window.L);
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css"; link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve(window.L);
        document.body.appendChild(script);
      });
    }
    ensureLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;
      if (leafletRef.current) {
        try { leafletRef.current.remove(); } catch {}
        leafletRef.current = null;
      }
      const view = centroMapa(filtro);
      const map = L.map(mapRef.current, { zoomControl: true }).setView(view.c, view.z);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap", maxZoom: 19 }).addTo(map);
      sitios.filter((s) => coincideFiltro(s, filtro)).forEach((s) => {
        const mark = L.marker([s.lat, s.lng]).addTo(map);
        mark.bindPopup(`<strong>${s.emoji} ${s.nombre}</strong><br/>${s.ciudad}, ${s.pais}`);
        mark.on("click", () => setActual(s));
      });
      leafletRef.current = map;
      setTimeout(() => {
        if (mapRef.current?.isConnected) map.invalidateSize();
      }, 200);
    });
    return () => { cancelled = true; };
  }, [tab, filtro]);

  /* ---------------- Swipe horizontal entre secciones ---------------- */
  useArrastreHorizontal(panelesRef, {
    habilitado: !arOn,
    onMove: ({ dx }) => {
      if (reducido) return;
      setVistaPrevia(limitar(dx, -140, 140));
    },
    onEnd: ({ dx, dt, cancelado }) => {
      setVistaPrevia(0);
      if (cancelado || arOn) return;
      const distancia = Math.abs(dx);
      const velocidad = distancia / dt;
      const gestoRapido = velocidad > VELOCIDAD_GESTO && distancia >= UMBRAL_RAPIDO;
      if (distancia < UMBRAL_SECCION && !gestoRapido) return;
      const indice = ORDEN_TABS.indexOf(tab);
      const destino = dx < 0 ? indice + 1 : indice - 1;
      if (destino < 0 || destino >= ORDEN_TABS.length) return;
      cambiarTab(ORDEN_TABS[destino]);
    },
    puedeIniciar: (e) => {
      if (arOn) return false;
      // El gesto nunca empieza sobre botones, enlaces, campos, pestañas,
      // carriles horizontales, mapas ni otros controles interactivos.
      if (esControlInteractivo(e.target)) return false;
      const nodo = e.target;
      if (nodo?.closest?.(".carrusel-pista, .riel-pista, .fila-swipe-pista, .leaflet-container, [data-no-gesto]")) {
        return false;
      }
      return true;
    },
  });

  const estiloPaneles =
    reducido || !vistaPrevia
      ? undefined
      : {
          transform: `translate3d(${vistaPrevia * 0.22}px,0,0)`,
          opacity: 1 - Math.min(0.22, Math.abs(vistaPrevia) / 1800),
        };

  const filtros = (
    <Rail etiqueta="Filtros" valor={filtro}>
      {FILTROS.map((f) => (
        <Chip
          key={f.id}
          activo={filtro === f.id}
          onClick={() => {
            setFiltro(f.id);
            avisar(`Filtro ${f.label}`);
          }}
        >
          {f.label}
        </Chip>
      ))}
    </Rail>
  );

  const accionesSwipe = (s) => [
    {
      id: "mapa",
      etiqueta: "Ver en mapa",
      variante: "suave",
      icono: <span aria-hidden="true">⦿</span>,
      onClick: () => verEnMapa(s),
    },
    {
      id: "escuchar",
      etiqueta: "Escuchar",
      variante: "oro",
      icono: <span aria-hidden="true">🔊</span>,
      onClick: () => {
        setActual(s);
        toggleAudio(s);
      },
    },
  ];

  const qr = url ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}` : "";

  return (
    <div className="app" ref={appRef}>
      <header className="topbar">
        <div className="app-inner" style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
          <div className="brand"><small>Guía inmersiva</small><b>Tours de Historia</b></div>
          <span className="pill">{instalada ? "App instalada" : `${sitios.length} sitios`}</span>
        </div>
      </header>

      <div className="app-inner">
        <div
          className="paneles"
          id="panel-principal"
          role="tabpanel"
          aria-labelledby={`pestana-tab-${tab}`}
          ref={panelesRef}
          style={estiloPaneles}
        >
          <TransicionPanel id={tab} direccion={direccion}>
            {tab === "inicio" && (
              <>
                <section className="hero">
                  <img src={actual.foto} alt={actual.nombre} />
                  <div className="hero-shade" />
                  <div className="hero-copy">
                    <h1>Viaja sin maleta</h1>
                    <p>Japón y el mundo. Mapa, voces y modo inmersivo.</p>
                  </div>
                </section>
                <div className="row-btns">
                  <BotonAccion variante="gold" textos={{ exito: "Abriendo el mapa" }} onClick={() => cambiarTab("mapa")}>
                    Abrir mapa
                  </BotonAccion>
                  {!instalada && (
                    <BotonAccion
                      variante="red"
                      estado={instalacion.estado}
                      mensaje={instalacion.mensaje}
                      onClick={descargarApp}
                      textos={{ cargando: "Instalando…", exito: "Instalada", error: "No se pudo instalar" }}
                    >
                      Descargar app
                    </BotonAccion>
                  )}
                  <BotonAccion variante="ghost" textos={{ exito: "Filtro Kioto" }} onClick={() => { setFiltro("Kioto"); cambiarTab("sitios"); }}>
                    Templos de Kioto
                  </BotonAccion>
                  <BotonAccion variante="ghost" textos={{ exito: "Abriendo tour" }} onClick={() => abrirTour(getSitioById("naritasan"))}>
                    Tour en Narita
                  </BotonAccion>
                </div>
                {filtros}
                <Carrusel etiqueta="Sitios para explorar" valor={actual?.id}>
                  {lista.slice(0, 8).map((s) => (
                    <li className="carrusel-item" key={s.id}>
                      <TarjetaSitio
                        sitio={s}
                        seleccionada={actual?.id === s.id}
                        onEntrar={abrirTour}
                        onEscuchar={toggleAudio}
                      />
                    </li>
                  ))}
                </Carrusel>
                {lista.length === 0 && <p className="empty">No hay sitios con este filtro.</p>}
              </>
            )}

            {tab === "mapa" && (
              <>
                {filtros}
                <div className="map-wrap">
                  <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
                </div>
                <div className="panel">
                  <p className="meta">Sitio seleccionado</p>
                  <h2>{actual.emoji} {actual.nombre}</h2>
                  <p>{actual.resumen}</p>
                  <div className="row-btns" style={{ padding: "12px 0 0" }}>
                    <BotonAccion variante="gold" textos={{ exito: "Tour abierto" }} onClick={() => abrirTour(actual)}>
                      Abrir tour
                    </BotonAccion>
                    <BotonAccion variante="ghost" confirmar={false} onClick={() => toggleAudio()}>
                      {hablando ? "Silenciar" : "Escuchar"}
                    </BotonAccion>
                  </div>
                </div>
              </>
            )}

            {tab === "sitios" && (
              <>
                <BuscadorCombo
                  id="buscador-sitios"
                  etiqueta="Buscar sitios"
                  placeholder="Buscar templo, castillo, ciudad…"
                  valor={q}
                  onCambiar={setQ}
                  opciones={lista}
                  alElegir={(s) => abrirTour(s)}
                  etiquetaOpcion={(s) => `${s.emoji} ${s.nombre}`}
                  descripcionOpcion={(s) => `${s.ciudad} · ${s.pais}`}
                  claveOpcion={(s) => s.id}
                  textos={{
                    sinResultados: "No hay sitios",
                    etiquetaLista: "Sitios disponibles",
                    ayuda: "Escribe para filtrar por nombre, ciudad, país o época.",
                  }}
                />
                {filtros}
                <p className="conteo">
                  {lista.length} {lista.length === 1 ? "sitio" : "sitios"} con el filtro {FILTROS.find((f) => f.id === filtro)?.label}
                </p>
                <ul className="list">
                  {lista.length === 0 && (
                    <li className="empty">No hay sitios. Prueba con otro filtro o borra la búsqueda.</li>
                  )}
                  {lista.map((s) => (
                    <li key={s.id}>
                      <FilaSwipe
                        acciones={accionesSwipe(s)}
                        etiqueta={`Acciones de ${s.nombre}`}
                        etiquetaBoton={`Mostrar acciones de ${s.nombre}`}
                      >
                        <TarjetaSitio
                          sitio={s}
                          seleccionada={actual?.id === s.id}
                          onEntrar={abrirTour}
                          etiquetaPrincipal="Visitar"
                        />
                      </FilaSwipe>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {tab === "tour" && actual && (
              <section className="tour">
                <img className="tour-photo" src={actual.foto} alt={actual.nombre} />
                <p className="meta">{actual.region} · {actual.epoca}</p>
                <h2>{actual.emoji} {actual.nombre}</h2>
                <p className="meta">{actual.ciudad}, {actual.pais}</p>
                <div className="facts">{actual.datos.map((d) => <span className="fact" key={d}>{d}</span>)}</div>
                <p>{actual.audio}</p>

                <div className="info-extra" aria-busy={cargandoInfo || undefined}>
                  {cargandoInfo && <p className="meta">Consultando datos del sitio…</p>}
                  {enriquecido?.extract && <p className="meta">{enriquecido.extract}</p>}
                  {clima && <p className="meta">🌤️ {clima.temperature} °C · {clima.description}</p>}
                  {sol?.sunrise && <p className="meta">Amanecer {new Date(sol.sunrise).toLocaleTimeString()} · Atardecer {new Date(sol.sunset).toLocaleTimeString()}</p>}
                  {paisInfo && <p className="meta">{paisInfo.name} · {paisInfo.capital || "—"}</p>}
                  {festivos.slice(0, 4).map((h) => <span className="fact" key={h.date}>{h.date} · {h.name}</span>)}
                </div>

                <Interruptor
                  activado={ahorrarDatos}
                  onChange={(v) => { setAhorrarDatos(v); avisar(v ? "Ahorro de datos activado" : "Ahorro de datos desactivado"); }}
                  etiqueta="Ahorrar datos"
                  descripcion="Evita consultar país, sol y festivos."
                />

                <Colapsable titulo="Voz de la guía" porDefecto className="audio-box">
                  <div className="audio-cabecera">
                    <strong>Voz de la guía</strong>
                  </div>
                  <Rail etiqueta="Tipo de voz" valor={tipoVoz} className="riel-interno">
                    {TIPOS.map((t) => (
                      <Chip key={t.id} activo={tipoVoz === t.id} onClick={() => setTipoVoz(t.id)}>
                        {t.label}
                      </Chip>
                    ))}
                  </Rail>
                  <label className="campo">
                    <span className="campo-etiqueta">Voz del dispositivo</span>
                    <select className="select" value={vozId} onChange={(e) => setVozId(e.target.value)}>
                      <option value="">Automática</option>
                      {vocesEs.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                    </select>
                  </label>
                  <div className="tono-grid">
                    {TONOS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tono ${tonoId === t.id ? "on" : ""}`}
                        aria-pressed={tonoId === t.id}
                        onClick={() => setTonoId(t.id)}
                      >
                        <b>{t.nombre}</b><span>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="audio-actions">
                    <BotonAccion variante="ghost" confirmar={false} onClick={() => narrar("Así sonará tu guía.")}>
                      Probar voz
                    </BotonAccion>
                    <BotonAccion variante="gold" confirmar={false} onClick={() => toggleAudio()}>
                      {hablando ? "Pausar" : "Reproducir guía"}
                    </BotonAccion>
                  </div>
                </Colapsable>

                <BotonAccion
                  variante="red"
                  className="btn-inmersivo"
                  estado={camara.estado}
                  mensaje={camara.mensaje}
                  mensajeVisible
                  textos={{ cargando: "Activando cámara…", exito: "Cámara lista", error: "Cámara no disponible" }}
                  onClick={abrirAR}
                >
                  Modo inmersivo
                </BotonAccion>
              </section>
            )}

            {tab === "instalar" && (
              <section className="install">
                <h2>Descargar</h2>
                <p>{instalada ? "Ya está instalada." : "Instálala en el teléfono, tablet o computadora."}</p>
                {!instalada && (
                  <BotonAccion
                    variante="gold"
                    estado={instalacion.estado}
                    mensaje={instalacion.mensaje}
                    mensajeVisible
                    textos={{ cargando: "Instalando…", exito: "Instalada", error: "No se pudo instalar" }}
                    onClick={descargarApp}
                  >
                    {instalarEvt ? "Instalar ahora" : "Ver cómo instalar"}
                  </BotonAccion>
                )}
                {qr && <img className="qr" src={qr} alt="Código QR de instalación" />}
                <Colapsable titulo="Instrucciones paso a paso" className="pasos">
                  <ol className="steps">
                    <li>iPhone: Safari → Compartir → Añadir a pantalla de inicio.</li>
                    <li>Android: Chrome → Instalar aplicación.</li>
                  </ol>
                </Colapsable>
                <p className="meta"><a href="/privacidad">Política de privacidad</a></p>
              </section>
            )}
          </TransicionPanel>
        </div>
      </div>

      <Pestanas
        opciones={TABS}
        activa={tab}
        onCambiar={cambiarTab}
        etiqueta="Secciones de la app"
        idBase="pestana"
        idPanel="panel-principal"
      />

      <RegionAnuncio mensaje={anuncio} />

      {arOn && (
        <div className="ar" role="dialog" aria-modal="true" aria-label={`Modo inmersivo de ${actual.nombre}`}>
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="ar-ui">
            <div>
              <span className="pill">Modo inmersivo</span>
              <h2>{actual.nombre}</h2>
              {msgCamara && <p>{msgCamara}</p>}
            </div>
            <div className="audio-actions">
              <BotonAccion variante="gold" confirmar={false} onClick={() => toggleAudio()}>
                {hablando ? "Silenciar" : "Narrar"}
              </BotonAccion>
              <BotonAccion variante="ghost" onClick={cerrarAR} ref={arBotonCerrar}>
                Cerrar
              </BotonAccion>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

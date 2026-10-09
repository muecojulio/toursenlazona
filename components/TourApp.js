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
  normalizar,
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
import ImagenLugar from "./ui/ImagenLugar.js";
import PoliticaPrivacidad from "./PoliticaPrivacidad.js";

const ORDEN_TABS = TABS.map((t) => t.id);
const LEAFLET_JS_INTEGRITY = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
const LEAFLET_CSS_INTEGRITY = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
let leafletPromise = null;

function cargarLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("Leaflet solo puede cargarse en el navegador."));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = LEAFLET_CSS_INTEGRITY;
      link.crossOrigin = "anonymous";
      link.referrerPolicy = "no-referrer";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.id = "leaflet-script";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = LEAFLET_JS_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("Leaflet no se inicializó."));
    script.onerror = () => reject(new Error("No se pudo cargar Leaflet."));
    document.body.appendChild(script);
  }).catch((error) => {
    leafletPromise = null;
    document.getElementById("leaflet-script")?.remove();
    throw error;
  });

  return leafletPromise;
}

function horaEnZona(value, timezone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: timezone || "UTC" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
  }
}

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
  const [errorMapa, setErrorMapa] = useState("");
  const [preferenciasListas, setPreferenciasListas] = useState(false);
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
  const arBotonAbrir = useRef(null);
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

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const alSalir = () => {
      detenerCamara();
      setArOn(false);
      window.speechSynthesis?.cancel();
      setHablando(false);
    };
    const alOcultarse = () => {
      if (document.visibilityState === "hidden") alSalir();
    };
    window.addEventListener("pagehide", alSalir);
    document.addEventListener("visibilitychange", alOcultarse);
    return () => {
      window.removeEventListener("pagehide", alSalir);
      document.removeEventListener("visibilitychange", alOcultarse);
      detenerCamara();
      window.speechSynthesis?.cancel();
    };
  }, [detenerCamara]);

  useEffect(() => {
    setUrl(window.location.origin);
    const sola = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalada(!!sola);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const onPrompt = (event) => {
      event.preventDefault();
      setInstalarEvt(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    try {
      const saved = window.localStorage.getItem("tours-voz");
      if (saved) {
        const preferences = JSON.parse(saved);
        if (TIPOS.some((type) => type.id === preferences?.tipoVoz)) setTipoVoz(preferences.tipoVoz);
        if (TONOS.some((tone) => tone.id === preferences?.tonoId)) setTonoId(preferences.tonoId);
        if (typeof preferences?.vozId === "string" && preferences.vozId.length <= 256) {
          setVozId(preferences.vozId);
        }
      }
    } catch {
      // El almacenamiento puede estar bloqueado; las preferencias siguen funcionando en memoria.
    } finally {
      setPreferenciasListas(true);
    }

    const cargarVoces = () => setVoces(window.speechSynthesis?.getVoices?.() || []);
    cargarVoces();
    window.speechSynthesis?.addEventListener("voiceschanged", cargarVoces);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", cargarVoces);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  useEffect(() => {
    if (!preferenciasListas) return;
    try {
      window.localStorage.setItem("tours-voz", JSON.stringify({ tipoVoz, vozId, tonoId }));
    } catch {
      // La app no depende de que el navegador permita el almacenamiento local.
    }
  }, [preferenciasListas, tipoVoz, vozId, tonoId]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const options = { signal: controller.signal };
    setEnriquecido(null);
    setClima(null);
    setPaisInfo(null);
    setSol(null);
    setFestivos([]);
    if (!actual) return () => controller.abort();

    setCargandoInfo(true);
    const slug = encodeURIComponent(actual.wikipedia || actual.nombre);
    const fin = () => { if (!cancelled) setCargandoInfo(false); };
    fetch(`/api/place?title=${slug}`, options)
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (!cancelled) setEnriquecido(value); })
      .catch(() => {})
      .finally(fin);
    fetch(`/api/weather?lat=${actual.lat}&lng=${actual.lng}`, options)
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (!cancelled) setClima(value); })
      .catch(() => {});

    if (!ahorrarDatos) {
      fetch(`/api/country?pais=${encodeURIComponent(actual.pais)}`, options)
        .then((response) => response.ok ? response.json() : null)
        .then((value) => { if (!cancelled) setPaisInfo(value); })
        .catch(() => {});
      fetch(`/api/sun?lat=${actual.lat}&lng=${actual.lng}`, options)
        .then((response) => response.ok ? response.json() : null)
        .then((value) => { if (!cancelled) setSol(value); })
        .catch(() => {});
      fetch(`/api/holidays?pais=${encodeURIComponent(actual.pais)}`, options)
        .then((response) => response.ok ? response.json() : null)
        .then((value) => { if (!cancelled) setFestivos(value?.holidays || []); })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
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
    const busqueda = normalizar(q);
    return base.filter((sitio) => {
      const texto = normalizar(`${sitio.nombre} ${sitio.ciudad} ${sitio.pais} ${sitio.epoca}`);
      return coincideFiltro(sitio, filtro) && texto.includes(busqueda);
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
    await camara.ejecutar(async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("La cámara requiere un navegador compatible y una conexión segura.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      try {
        if (!videoRef.current) throw new Error("No se encontró el visor de cámara.");
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setArOn(true);
        narrar(`Modo inmersivo de ${actual.nombre}. ${actual.resumen}`);
      } catch (error) {
        detenerCamara();
        throw error;
      }
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
    detenerCamara();
    avisar("Modo inmersivo cerrado");
    requestAnimationFrame(() => arBotonAbrir.current?.focus());
  }

  // El diálogo atrapa el foco, se cierra con Escape y lo devuelve al iniciador.
  useEffect(() => {
    if (!arOn) return;
    const alTeclado = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cerrarAR();
        return;
      }
      if (event.key !== "Tab") return;
      const botones = [...document.querySelectorAll(".ar button:not([disabled])")];
      const primero = botones[0];
      const ultimo = botones[botones.length - 1];
      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo?.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero?.focus();
      }
    };
    document.addEventListener("keydown", alTeclado);
    const timeout = setTimeout(() => arBotonCerrar.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", alTeclado);
      clearTimeout(timeout);
    };
    // cerrarAR uses stable refs and setters; attach only while the dialog is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arOn]);

  useEffect(() => {
    if (tab !== "mapa") return;
    let cancelled = false;
    let map = null;
    let resizeTimer = null;
    setErrorMapa("");

    cargarLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) return;
        const view = centroMapa(filtro);
        map = L.map(mapRef.current, { zoomControl: true }).setView(view.c, view.z);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        sitios.filter((sitio) => coincideFiltro(sitio, filtro)).forEach((sitio) => {
          const marker = L.marker([sitio.lat, sitio.lng]).addTo(map);
          const popup = document.createElement("div");
          const title = document.createElement("strong");
          const detail = document.createElement("span");
          title.textContent = `${sitio.emoji} ${sitio.nombre}`;
          detail.textContent = `${sitio.ciudad}, ${sitio.pais}`;
          popup.append(title, document.createElement("br"), detail);
          marker.bindPopup(popup);
          marker.on("click", () => setActual(sitio));
        });

        leafletRef.current = map;
        resizeTimer = setTimeout(() => {
          if (!cancelled && mapRef.current?.isConnected) map.invalidateSize();
        }, 200);
      })
      .catch(() => {
        if (!cancelled) setErrorMapa("No se pudo cargar el mapa. Comprueba tu conexión e inténtalo de nuevo.");
      });

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      if (map && leafletRef.current === map) leafletRef.current = null;
      try { map?.remove(); } catch {}
    };
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
          <span aria-hidden="true">{f.icon}</span> {f.label}
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
      <a className="skip-link" href="#panel-principal">Saltar al contenido</a>
      <header className="topbar">
        <div className="app-inner topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">✦</span>
            <span className="brand-copy">
              <small>Rutas para almas curiosas</small>
              <b>Tours de Historia</b>
            </span>
          </div>
          <span className="pill">
            <span className="pill-icon" aria-hidden="true">{instalada ? "📲" : "🧭"}</span>
            {instalada ? "Tu guía está lista" : `${sitios.length} lugares por descubrir`}
          </span>
        </div>
      </header>

      <main className="app-inner app-main">
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
                  <ImagenLugar
                    className="hero-foto"
                    src={actual.foto}
                    fallbackSrc={enriquecido?.image?.thumbnail || enriquecido?.image?.original}
                    alt={`Vista de ${actual.nombre}`}
                    emoji={actual.emoji}
                    loading="eager"
                  />
                  <div className="hero-shade" />
                  <div className="hero-copy">
                    <span className="hero-kicker"><span aria-hidden="true">✦</span> Pasaporte a otra época</span>
                    <h1>El mundo está lleno<br />de historias<span className="hero-punto">.</span></h1>
                    <p>Haz una parada en Japón o cruza continentes: cada lugar guarda una historia para ti.</p>
                    <div className="hero-metas">
                      <span>🗺️ {sitios.length} lugares</span>
                      <span>🎧 Guías con voz</span>
                    </div>
                  </div>
                  <div className="hero-stamp" aria-hidden="true">
                    <span>↗</span><b>VIAJA</b><small>A TU RITMO</small>
                  </div>
                </section>
                <div className="row-btns home-actions">
                  <BotonAccion variante="gold" textos={{ exito: "Abriendo el mapa" }} onClick={() => cambiarTab("mapa")}>
                    🧭 Explorar mapa
                  </BotonAccion>
                  {!instalada && (
                    <BotonAccion
                      variante="red"
                      estado={instalacion.estado}
                      mensaje={instalacion.mensaje}
                      onClick={descargarApp}
                      textos={{ cargando: "Instalando…", exito: "Instalada", error: "No se pudo instalar" }}
                    >
                      ↓ Instalar la guía
                    </BotonAccion>
                  )}
                  <BotonAccion variante="ghost" textos={{ exito: "Filtro Kioto" }} onClick={() => { setFiltro("Kioto"); cambiarTab("sitios"); }}>
                    ⛩️ Templos de Kioto
                  </BotonAccion>
                  <BotonAccion variante="ghost" textos={{ exito: "Abriendo tour" }} onClick={() => abrirTour(getSitioById("naritasan"))}>
                    🍵 Tour en Narita
                  </BotonAccion>
                </div>
                <div className="section-heading section-heading-home">
                  <div>
                    <span className="eyebrow">Tu próxima parada</span>
                    <h2>Elige una historia</h2>
                  </div>
                  <span className="section-note">✨ Rutas con carácter</span>
                </div>
                {filtros}
                <Carrusel etiqueta="Sitios para explorar" valor={actual?.id} className="carrusel-destinos">
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
                <div className="section-heading panel-heading">
                  <div>
                    <span className="eyebrow">Cartografía viajera</span>
                    <h2>Traza tu propia ruta</h2>
                  </div>
                  <span className="section-note">📍 {lista.length} paradas</span>
                </div>
                {filtros}
                <div className="map-wrap" role="region" aria-label="Mapa interactivo de sitios históricos">
                  <div ref={mapRef} className="map-canvas" />
                  {errorMapa && <p className="map-error" role="status">{errorMapa}</p>}
                </div>
                <div className="panel panel-sitio">
                  <ImagenLugar
                    className="mapa-sitio-foto"
                    src={actual.foto}
                    fallbackSrc={enriquecido?.image?.thumbnail || enriquecido?.image?.original}
                    alt={`Vista de ${actual.nombre}`}
                    emoji={actual.emoji}
                  />
                  <p className="meta">Sitio seleccionado</p>
                  <h2>{actual.emoji} {actual.nombre}</h2>
                  <p>{actual.resumen}</p>
                  <div className="row-btns panel-actions">
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
                <div className="section-heading panel-heading">
                  <div>
                    <span className="eyebrow">Colección de lugares</span>
                    <h2>Encuentra tu próxima parada</h2>
                  </div>
                  <span className="section-note">🌍 Japón + mundo</span>
                </div>
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
                <p className="meta">{actual.region} · {actual.epoca}</p>
                <h2>{actual.emoji} {actual.nombre}</h2>
                <p className="meta">{actual.ciudad}, {actual.pais}</p>
                <div className="facts">{actual.datos.map((d) => <span className="fact" key={d}>{d}</span>)}</div>

                <section className="descripcion-lugar" aria-labelledby={`descripcion-${actual.id}`}>
                  <figure className="descripcion-lugar-figura">
                    <ImagenLugar
                      className="tour-photo descripcion-lugar-foto"
                      src={actual.foto}
                      fallbackSrc={enriquecido?.image?.thumbnail || enriquecido?.image?.original}
                      alt={`Vista de ${actual.nombre}`}
                      emoji={actual.emoji}
                      loading="eager"
                    />
                    <figcaption>{actual.nombre} · {actual.ciudad}, {actual.pais}</figcaption>
                  </figure>
                  <div className="descripcion-lugar-cuerpo">
                    <h3 id={`descripcion-${actual.id}`}>Descripción del lugar</h3>
                    <p className="descripcion-resumen">{actual.resumen}</p>
                    <h4>Relato de la guía</h4>
                    <p>{actual.audio}</p>
                    {enriquecido?.extract && (
                      <div className="descripcion-ampliada">
                        <h4>Información complementaria</h4>
                        <p>{enriquecido.extract}</p>
                        {enriquecido.source && (
                          <a href={enriquecido.source} target="_blank" rel="noreferrer">
                            Fuente: Wikipedia
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <div className="info-extra" aria-busy={cargandoInfo || undefined}>
                  {cargandoInfo && <p className="meta">Consultando datos del sitio…</p>}
                  {clima && <p className="meta">🌤️ {clima.temperature} °C · {clima.description}</p>}
                  {sol?.sunrise && sol?.sunset && (
                    <p className="meta">🌅 Amanecer {horaEnZona(sol.sunrise, clima?.timezone)} · Atardecer {horaEnZona(sol.sunset, clima?.timezone)} (hora local)</p>
                  )}
                  {paisInfo && <p className="meta">🌐 {paisInfo.name} · Capital: {paisInfo.capital || "—"}</p>}
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
                  ref={arBotonAbrir}
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
                <span className="eyebrow">Tu guía, siempre a mano</span>
                <h2>Un pasaporte de bolsillo</h2>
                <p>{instalada ? "Ya está instalada y lista para acompañarte." : "Instálala en el teléfono, tablet o computadora y vuelve a tus historias cuando quieras."}</p>
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
                {qr && <img className="qr" src={qr} alt="Código QR de instalación" loading="lazy" referrerPolicy="no-referrer" />}
                {qr && <p className="qr-nota">El código solo contiene la dirección de esta guía.</p>}
                <Colapsable titulo="Instrucciones paso a paso" className="pasos">
                  <ol className="steps">
                    <li>iPhone: Safari → Compartir → Añadir a pantalla de inicio.</li>
                    <li>Android: Chrome → Instalar aplicación.</li>
                  </ol>
                </Colapsable>
              </section>
            )}

            {tab === "privacidad" && <PoliticaPrivacidad />}
          </TransicionPanel>
        </div>
      </main>

      <footer className="app-inner app-footer">
        <span>Hecha para caminar más despacio <span aria-hidden="true">✦</span></span>
        <a href="/privacidad">Privacidad y datos</a>
      </footer>

      <Pestanas
        opciones={TABS}
        activa={tab}
        onCambiar={cambiarTab}
        etiqueta="Secciones de la app"
        idBase="pestana"
        idPanel="panel-principal"
      />

      <RegionAnuncio mensaje={anuncio} />

      <div
        className="ar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ar-titulo"
        hidden={!arOn}
        aria-hidden={!arOn || undefined}
        inert={!arOn}
      >
        <video ref={videoRef} playsInline muted autoPlay aria-hidden="true" tabIndex={-1} />
        <div className="ar-ui">
          <div>
            <span className="pill">Modo inmersivo</span>
            <h2 id="ar-titulo">{actual.nombre}</h2>
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
    </div>
  );
}

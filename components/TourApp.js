"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { sitios } from "../data/sitios.js";
import { getSitioById, SITIOS_BY_REGION } from "../data/indexes.js";
import { TABS, FILTROS, TONOS, TIPOS, tipoDeVoz, coincideFiltro, centroMapa } from "./tourConfig.js";

export default function TourApp() {
  const [tab, setTab] = useState("inicio");
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
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
    const slug = encodeURIComponent(actual.wikipedia || actual.nombre);
    fetch(`/api/place?title=${slug}`).then((r) => r.ok ? r.json() : null).then((v) => { if (!cancelled) setEnriquecido(v); }).catch(() => {});
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
    return base.filter((s) => {
      const texto = `${s.nombre} ${s.ciudad} ${s.pais} ${s.epoca}`.toLowerCase();
      return coincideFiltro(s, filtro) && texto.includes(q.toLowerCase());
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

  function abrirTour(sitio) {
    if (!sitio) return;
    setActual(sitio); setTab("tour");
    window.speechSynthesis?.cancel(); setHablando(false);
  }

  function toggleAudio() {
    if (hablando) { window.speechSynthesis?.cancel(); setHablando(false); return; }
    narrar(`${actual.nombre}. ${actual.audio}`);
  }

  async function descargarApp() {
    if (instalarEvt) {
      instalarEvt.prompt();
      const res = await instalarEvt.userChoice;
      if (res.outcome === "accepted") { setInstalada(true); setInstalarEvt(null); }
      return;
    }
    setTab("instalar");
  }

  async function abrirAR() {
    setMsgCamara(""); setArOn(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      narrar(`Modo inmersivo de ${actual.nombre}. ${actual.resumen}`);
    } catch { setMsgCamara("Este dispositivo no permitió la cámara."); }
  }

  function cerrarAR() {
    setArOn(false); window.speechSynthesis?.cancel(); setHablando(false);
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
  }

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
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
      const view = centroMapa(filtro);
      const map = L.map(mapRef.current, { zoomControl: true }).setView(view.c, view.z);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap", maxZoom: 19 }).addTo(map);
      sitios.filter((s) => coincideFiltro(s, filtro)).forEach((s) => {
        const mark = L.marker([s.lat, s.lng]).addTo(map);
        mark.bindPopup(`<strong>${s.emoji} ${s.nombre}</strong><br/>${s.ciudad}, ${s.pais}`);
        mark.on("click", () => setActual(s));
      });
      leafletRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => { cancelled = true; };
  }, [tab, filtro]);

  const qr = url ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}` : "";
  const chips = (
    <div className="filters">{FILTROS.map((f) => (
      <button key={f.id} className={`chip ${filtro === f.id ? "on" : ""}`} onClick={() => setFiltro(f.id)}>{f.label}</button>
    ))}</div>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="app-inner" style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
          <div className="brand"><small>Guía inmersiva</small><b>Tours de Historia</b></div>
          <span className="pill">{instalada ? "App instalada" : `${sitios.length} sitios`}</span>
        </div>
      </header>
      <div className="app-inner">
        {tab === "inicio" && (
          <div className="panel-enter">
            <section className="hero">
              <img src={actual.foto} alt={actual.nombre} />
              <div className="hero-shade" /><div className="hero-copy"><h1>Viaja sin maleta</h1><p>Japón y el mundo. Mapa, voces y modo inmersivo.</p></div>
            </section>
            <div className="row-btns">
              <button className="btn btn-gold" onClick={() => setTab("mapa")}>Abrir mapa</button>
              {!instalada && <button className="btn btn-red" onClick={descargarApp}>Descargar app</button>}
              <button className="btn btn-ghost" onClick={() => { setFiltro("Kioto"); setTab("sitios"); }}>Templos de Kioto</button>
              <button className="btn btn-ghost" onClick={() => abrirTour(getSitioById("naritasan"))}>Tour en Narita</button>
            </div>
            {chips}
            <div className="list">{lista.slice(0, 8).map((s) => (
              <article className="card" key={s.id} onClick={() => abrirTour(s)}>
                <img src={s.foto} alt="" /><div className="card-body"><h3>{s.emoji} {s.nombre}</h3><p className="meta">{s.ciudad} · {s.pais}</p><button className="btn btn-gold">Entrar al sitio</button></div>
              </article>
            ))}</div>
          </div>
        )}
        {tab === "mapa" && (
          <div className="panel-enter">{chips}<div className="map-wrap"><div ref={mapRef} style={{ width: "100%", height: "100%" }} /></div>
            <div className="panel"><p className="meta">Sitio seleccionado</p><h2>{actual.emoji} {actual.nombre}</h2><p>{actual.resumen}</p>
              <div className="row-btns" style={{ padding: "12px 0 0" }}>
                <button className="btn btn-gold" onClick={() => abrirTour(actual)}>Abrir tour</button>
                <button className="btn btn-ghost" onClick={toggleAudio}>{hablando ? "Silenciar" : "Escuchar"}</button>
              </div></div></div>
        )}
        {tab === "sitios" && (
          <div className="panel-enter">
            <input className="search" placeholder="Buscar templo, castillo, ciudad..." value={q} onChange={(e) => setQ(e.target.value)} />
            {chips}
            <div className="list">{lista.length === 0 && <p className="empty">No hay sitios.</p>}{lista.map((s) => (
              <article className="card" key={s.id}><img src={s.foto} alt="" /><div className="card-body"><h3>{s.emoji} {s.nombre}</h3><p className="meta">{s.ciudad} · {s.pais}</p><button className="btn btn-gold" onClick={() => abrirTour(s)}>Visitar</button></div></article>
            ))}</div>
          </div>
        )}
        {tab === "tour" && actual && (
          <section className="tour panel-enter">
            <img className="tour-photo" src={actual.foto} alt={actual.nombre} />
            <p className="meta">{actual.region} · {actual.epoca}</p>
            <h2>{actual.emoji} {actual.nombre}</h2>
            <p className="meta">{actual.ciudad}, {actual.pais}</p>
            <div className="facts">{actual.datos.map((d) => <span className="fact" key={d}>{d}</span>)}</div>
            <p>{actual.audio}</p>
            {enriquecido?.extract && <p className="meta">{enriquecido.extract}</p>}
            {clima && <p className="meta">🌤️ {clima.temperature} °C · {clima.description}</p>}
            {sol?.sunrise && <p className="meta">Amanecer {new Date(sol.sunrise).toLocaleTimeString()} · Atardecer {new Date(sol.sunset).toLocaleTimeString()}</p>}
            {paisInfo && <p className="meta">{paisInfo.name} · {paisInfo.capital || "—"}</p>}
            {festivos.slice(0, 4).map((h) => <span className="fact" key={h.date}>{h.date} · {h.name}</span>)}
            <label className="switch-row"><span>Ahorrar datos</span><span className="switch"><input type="checkbox" checked={ahorrarDatos} onChange={(e) => setAhorrarDatos(e.target.checked)} /></span></label>
            <div className="audio-box">
              <strong>Voz de la guía</strong>
              <div className="filters" style={{ padding: 0 }}>{TIPOS.map((t) => <button key={t.id} className={`chip ${tipoVoz === t.id ? "on" : ""}`} onClick={() => setTipoVoz(t.id)}>{t.label}</button>)}</div>
              <select className="select" value={vozId} onChange={(e) => setVozId(e.target.value)}><option value="">Automática</option>{vocesEs.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</select>
              <div className="tono-grid">{TONOS.map((t) => <button key={t.id} className={`tono ${tonoId === t.id ? "on" : ""}`} onClick={() => setTonoId(t.id)}><b>{t.nombre}</b><span>{t.desc}</span></button>)}</div>
              <div className="audio-actions"><button className="btn btn-ghost" onClick={() => narrar("Así sonara tu guía.")}>Probar voz</button><button className="btn btn-gold" onClick={toggleAudio}>{hablando ? "Pausar" : "Reproducir guía"}</button></div>
            </div>
            <button className="btn btn-red" style={{ marginTop: 12 }} onClick={abrirAR}>Modo inmersivo</button>
          </section>
        )}
        {tab === "instalar" && (
          <section className="install panel-enter">
            <h2>Descargar</h2>
            <p>{instalada ? "Ya está instalada." : "Instálala en el teléfono, tablet o computadora."}</p>
            {!instalada && <button className="btn btn-gold" onClick={descargarApp}>{instalarEvt ? "Instalar ahora" : "Ver cómo instalar"}</button>}
            {qr && <img className="qr" src={qr} alt="QR" />}
            <ol className="steps"><li>iPhone: Safari → Compartir → Añadir a pantalla de inicio.</li><li>Android: Chrome → Instalar aplicación.</li></ol>
            <p className="meta"><a href="/privacidad">Política de privacidad</a></p>
          </section>
        )}
      </div>
      <nav className="tabbar">{TABS.map((t) => (
        <button type="button" key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}><span>{t.icon}</span>{t.label}</button>
      ))}</nav>
      {arOn && (
        <div className="ar"><video ref={videoRef} playsInline muted autoPlay /><div className="ar-ui"><div><span className="pill">Modo inmersivo</span><h2>{actual.nombre}</h2>{msgCamara && <p>{msgCamara}</p>}</div>
          <div className="audio-actions"><button className="btn btn-gold" onClick={toggleAudio}>{hablando ? "Silenciar" : "Narrar"}</button><button className="btn btn-ghost" onClick={cerrarAR}>Cerrar</button></div></div></div>
      )}
    </div>
  );
}

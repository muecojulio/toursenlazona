export const TABS = [
  { id: "inicio", icon: "⌂", label: "Inicio" },
  { id: "mapa", icon: "⦿", label: "Mapa" },
  { id: "sitios", icon: "▣", label: "Sitios" },
  { id: "tour", icon: "▶", label: "Tour" },
  { id: "instalar", icon: "↓", label: "Instalar" },
  { id: "privacidad", icon: "ⓘ", label: "Privacidad" },
];

export const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "Japón", label: "Japón" },
  { id: "Kioto", label: "Kioto" },
  { id: "Tokio", label: "Tokio" },
  { id: "Osaka", label: "Osaka" },
  { id: "Kawaguchiko", label: "Kawaguchiko" },
  { id: "Narita", label: "Narita" },
  { id: "Mundo", label: "Mundo" },
];

export const TONOS = [
  { id: "museo", nombre: "Guía de museo", desc: "Despacio y formal", rate: 0.86, pitch: 0.92, lang: "es-ES" },
  { id: "calida", nombre: "Cálida", desc: "Cercana y suave", rate: 0.93, pitch: 1.18, lang: "es-MX" },
  { id: "documental", nombre: "Documental", desc: "Clara y neutra", rate: 0.98, pitch: 1.0, lang: "es-ES" },
  { id: "agil", nombre: "Ágil", desc: "Ritmo de viaje", rate: 1.08, pitch: 1.12, lang: "es-US" },
  { id: "solemne", nombre: "Solemne", desc: "Templo y ritual", rate: 0.8, pitch: 0.76, lang: "es-ES" },
];

export const TIPOS = [
  { id: "todas", label: "Todas" },
  { id: "fem", label: "Femenina" },
  { id: "masc", label: "Masculina" },
];

export function tipoDeVoz(voice) {
  const n = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (/female|mujer|femin|monica|mónica|paulina|sabina|helena|lucia|lucía|elena|dalia|maria|maría|soledad|camila|pilar|conchita|joana|silvia|paloma|carlota/.test(n)) return "fem";
  if (/male|hombre|mascul|jorge|juan|pablo|diego|raul|raúl|carlos|enrique|tomas|tomás/.test(n)) return "masc";
  return "otra";
}

export function coincideFiltro(sitio, filtro) {
  if (filtro === "todos") return true;
  if (filtro === "Japón") return sitio.region === "Japón";
  if (filtro === "Mundo") return sitio.region === "Mundo";
  return `${sitio.ciudad} ${sitio.nombre}`.toLowerCase().includes(filtro.toLowerCase());
}

export function centroMapa(filtro) {
  if (filtro === "Kioto") return { c: [35.01, 135.76], z: 12 };
  if (filtro === "Tokio") return { c: [35.7, 139.76], z: 11 };
  if (filtro === "Osaka") return { c: [34.67, 135.5], z: 12 };
  if (filtro === "Kawaguchiko") return { c: [35.5, 138.77], z: 11 };
  if (filtro === "Narita") return { c: [35.79, 140.32], z: 13 };
  if (filtro === "Japón") return { c: [36.2, 138.2], z: 5 };
  return { c: [20, 20], z: 2 };
}

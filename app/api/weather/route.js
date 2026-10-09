import { esCoordenadaDeSitio } from "../../../data/indexes.js";
import { jsonErr, readCoordinates, jsonOk } from "../../../lib/http.js";

const WEATHER_LABELS = {
  0: "Despejado",
  1: "Principalmente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla escarchada",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos intensos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

export async function GET(request) {
  const coordinates = readCoordinates(request.nextUrl.searchParams);
  if (!coordinates || !esCoordenadaDeSitio(coordinates.lat, coordinates.lng)) {
    return jsonErr("Coordenadas de sitio no válidas");
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coordinates.lat));
  url.searchParams.set("longitude", String(coordinates.lng));
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);

    const data = await response.json();
    const code = data.current?.weather_code;
    const temperature = data.current?.temperature_2m;
    if (!Number.isFinite(temperature)) throw new Error("Weather response was incomplete");

    return jsonOk(
      {
        temperature,
        description: WEATHER_LABELS[code] || "Condición meteorológica",
        timezone: typeof data.timezone === "string" ? data.timezone : "UTC",
      },
      900
    );
  } catch {
    return jsonErr("No disponible", 503);
  }
}

import { fetchPublic, jsonErr, jsonOk } from "../../../lib/http.js";

export async function GET(request) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return jsonErr("Coordenadas inválidas");
  try {
    const url = new URL("https://api.sunrise-sunset.org/json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    url.searchParams.set("formatted", "0");
    const data = await fetchPublic(url, { revalidate: 21600 });
    const r = data?.results || {};
    return jsonOk({
      sunrise: r.sunrise || null,
      sunset: r.sunset || null,
      dayLength: r.day_length || null,
    }, 21600);
  } catch {
    return jsonErr("No disponible", 503);
  }
}

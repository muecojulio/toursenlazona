import { esCoordenadaDeSitio } from "../../../data/indexes.js";
import { fetchPublic, jsonErr, jsonOk, readCoordinates } from "../../../lib/http.js";

export async function GET(request) {
  const coordinates = readCoordinates(request.nextUrl.searchParams);
  if (!coordinates || !esCoordenadaDeSitio(coordinates.lat, coordinates.lng)) {
    return jsonErr("Coordenadas de sitio no válidas");
  }

  try {
    const url = new URL("https://api.sunrise-sunset.org/json");
    url.searchParams.set("lat", String(coordinates.lat));
    url.searchParams.set("lng", String(coordinates.lng));
    url.searchParams.set("formatted", "0");
    const data = await fetchPublic(url, { revalidate: 21600 });
    if (data?.status !== "OK") throw new Error("Sunrise data unavailable");
    const results = data.results || {};
    return jsonOk(
      {
        sunrise: results.sunrise || null,
        sunset: results.sunset || null,
      },
      21600
    );
  } catch {
    return jsonErr("No disponible", 503);
  }
}

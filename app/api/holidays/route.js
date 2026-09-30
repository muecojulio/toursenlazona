import { isoDePais } from "../../../data/indexes.js";
import { fetchPublic, jsonErr, jsonOk } from "../../../lib/http.js";

export async function GET(request) {
  const pais = request.nextUrl.searchParams.get("pais");
  const code = isoDePais(pais || "") || request.nextUrl.searchParams.get("code");
  const year = request.nextUrl.searchParams.get("year") || String(new Date().getFullYear());
  if (!code) return jsonErr("País no soportado");
  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${encodeURIComponent(year)}/${encodeURIComponent(code)}`;
    const rows = await fetchPublic(url, { revalidate: 86400 });
    const next = (Array.isArray(rows) ? rows : [])
      .filter((h) => h?.date && h?.localName)
      .slice(0, 8)
      .map((h) => ({ date: h.date, name: h.localName, global: !!h.global }));
    return jsonOk({ holidays: next }, 86400);
  } catch {
    return jsonErr("No disponible", 503);
  }
}

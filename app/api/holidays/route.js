import { isoDePais, PAIS_ISO } from "../../../data/indexes.js";
import { fetchPublic, jsonErr, jsonOk, readCountryCode } from "../../../lib/http.js";

const CODIGOS_PAIS = new Set(Object.values(PAIS_ISO));

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const pais = params.get("pais")?.trim() || "";
  const code = readCountryCode(params, pais, isoDePais);
  const rawYear = params.get("year") || String(new Date().getFullYear());
  const year = Number(rawYear);
  const currentYear = new Date().getFullYear();

  if (!code || !CODIGOS_PAIS.has(code)) return jsonErr("País no soportado");
  if (!/^\d{4}$/.test(rawYear) || !Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
    return jsonErr("Año inválido");
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`;
    const rows = await fetchPublic(url, { revalidate: 86400 });
    const holidays = (Array.isArray(rows) ? rows : [])
      .filter((holiday) => holiday?.date && holiday?.localName)
      .slice(0, 8)
      .map((holiday) => ({
        date: holiday.date,
        name: String(holiday.localName).slice(0, 160),
        global: !!holiday.global,
      }));
    return jsonOk({ holidays }, 86400);
  } catch {
    return jsonErr("No disponible", 503);
  }
}

import { isoDePais, PAIS_ISO } from "../../../data/indexes.js";
import { fetchPublic, jsonErr, jsonOk, readCountryCode } from "../../../lib/http.js";

const CODIGOS_PAIS = new Set(Object.values(PAIS_ISO));

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const pais = params.get("pais")?.trim() || "";
  const code = readCountryCode(params, pais, isoDePais);
  if (!code || !CODIGOS_PAIS.has(code)) return jsonErr("País no soportado");

  try {
    const url = new URL(`https://restcountries.com/v3.1/alpha/${code}`);
    url.searchParams.set("fields", "name,capital");
    const data = await fetchPublic(url, { revalidate: 86400 });
    const row = Array.isArray(data) ? data[0] : data;
    return jsonOk(
      {
        name: row?.name?.common || pais || code,
        capital: row?.capital?.[0] || null,
      },
      86400
    );
  } catch {
    return jsonErr("No disponible", 503);
  }
}

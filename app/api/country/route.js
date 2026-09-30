import { isoDePais } from "../../../data/indexes.js";
import { fetchPublic, jsonErr, jsonOk } from "../../../lib/http.js";

export async function GET(request) {
  const pais = request.nextUrl.searchParams.get("pais");
  const code = isoDePais(pais || "") || request.nextUrl.searchParams.get("code");
  if (!code) return jsonErr("País no soportado");
  try {
    const url = new URL(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`);
    url.searchParams.set("fields", "name,capital,population,flags,region,subregion,currencies,languages");
    const data = await fetchPublic(url, { revalidate: 86400 });
    const row = Array.isArray(data) ? data[0] : data;
    return jsonOk({
      name: row?.name?.common || pais,
      capital: row?.capital?.[0] || null,
      population: row?.population ?? null,
      flag: row?.flags?.svg || row?.flags?.png || null,
      region: row?.region || null,
      currencies: row?.currencies ? Object.keys(row.currencies) : [],
      languages: row?.languages ? Object.values(row.languages) : [],
    }, 86400);
  } catch {
    return jsonErr("No disponible", 503);
  }
}

const TIMEOUT_MS = 8_000;

export function jsonOk(data, seconds = 900) {
  return Response.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
    },
  });
}

export function jsonErr(message, status = 400) {
  return Response.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function fetchPublic(url, { revalidate = 3600 } = {}) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "toursenlazona/1.1 (public tour app)",
    },
    next: { revalidate },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function readCoordinates(searchParams) {
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  if (
    rawLat === null || rawLng === null ||
    !rawLat.trim() || !rawLng.trim() ||
    rawLat.length > 32 || rawLng.length > 32
  ) return null;

  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

export function readCountryCode(searchParams, countryName, isoDePais) {
  const fromName = isoDePais(countryName || "");
  const fromCode = searchParams.get("code")?.trim().toUpperCase() || "";
  const code = fromName || fromCode;
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

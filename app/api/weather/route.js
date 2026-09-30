import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lng);
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "auto");

  try {
    const r = await fetch(url, { next: { revalidate: 900 } });
    if (!r.ok) throw new Error("weather");
    const d = await r.json();
    const labels = {
      0: "Despejado", 1: "Principalmente despejado", 2: "Parcialmente nublado", 3: "Nublado",
      45: "Niebla", 48: "Niebla escarchada", 51: "Llovizna", 61: "Lluvia",
      71: "Nieve", 80: "Chubascos", 95: "Tormenta"
    };
    const body = {
      temperature: d.current?.temperature_2m,
      wind: d.current?.wind_speed_10m,
      description: labels[d.current?.weather_code] || "Condición meteorológica",
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch {
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }
}

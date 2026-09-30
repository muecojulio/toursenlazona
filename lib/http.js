export function jsonOk(data, seconds = 900) {
  return Response.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
    },
  });
}

export function jsonErr(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function fetchPublic(url, { revalidate = 3600 } = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": "toursenlazona/1.1 (public tour app)" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

import { sitios } from "../../../data/sitios.js";
import { jsonErr, jsonOk } from "../../../lib/http.js";

const TITULOS_PERMITIDOS = new Set(sitios.map((sitio) => sitio.nombre));
const CACHE_SECONDS = 86_400;
const TIMEOUT_MS = 8_000;
const HEADERS = {
  Accept: "application/json",
  "User-Agent": "toursenlazona/1.1 (public tour app)",
};

function safeWikimediaUrl(value, hosts) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !hosts.includes(url.hostname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: CACHE_SECONDS },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return response.ok ? response.json() : null;
}

export async function GET(request) {
  const title = new URL(request.url).searchParams.get("title")?.trim() || "";
  if (
    !title ||
    title.length > 180 ||
    /[\u0000-\u001f\u007f]/.test(title) ||
    !TITULOS_PERMITIDOS.has(title)
  ) {
    return jsonErr("Título inválido");
  }

  try {
    const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const wiki = await fetchJson(wikiUrl);

    let imagenCommons = null;
    if (!wiki?.thumbnail?.source && !wiki?.originalimage?.source) {
      const commonsUrl = new URL("https://commons.wikimedia.org/w/api.php");
      commonsUrl.searchParams.set("action", "query");
      commonsUrl.searchParams.set("generator", "search");
      commonsUrl.searchParams.set("gsrsearch", title);
      commonsUrl.searchParams.set("gsrnamespace", "6");
      commonsUrl.searchParams.set("gsrlimit", "1");
      commonsUrl.searchParams.set("prop", "imageinfo");
      commonsUrl.searchParams.set("iiprop", "url");
      commonsUrl.searchParams.set("iiurlwidth", "900");
      commonsUrl.searchParams.set("format", "json");
      const commons = await fetchJson(commonsUrl);
      const page = commons?.query?.pages ? Object.values(commons.query.pages)[0] : null;
      imagenCommons = page?.imageinfo?.[0] || null;
    }

    const original =
      safeWikimediaUrl(wiki?.originalimage?.source, ["upload.wikimedia.org"]) ||
      safeWikimediaUrl(imagenCommons?.url, ["upload.wikimedia.org"]);
    const thumbnail =
      safeWikimediaUrl(wiki?.thumbnail?.source, ["upload.wikimedia.org"]) ||
      safeWikimediaUrl(imagenCommons?.thumburl, ["upload.wikimedia.org"]) ||
      original;
    const source = safeWikimediaUrl(wiki?.content_urls?.desktop?.page, ["es.wikipedia.org"]);

    return jsonOk(
      {
        title: String(wiki?.title || title).slice(0, 180),
        extract: String(wiki?.extract || "").slice(0, 4_000),
        source,
        image: { original: original || thumbnail, thumbnail },
      },
      CACHE_SECONDS
    );
  } catch {
    return jsonErr("No disponible", 503);
  }
}

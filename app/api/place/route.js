import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  if (!title) return NextResponse.json({ error: "Falta title" }, { status: 400 });

  const headers = { "User-Agent": "toursenlazona/1.0 (tour app; contact via project owner)" };
  try {
    const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const wikiRes = await fetch(wikiUrl, { headers, next: { revalidate: 86400 } });
    const wiki = wikiRes.ok ? await wikiRes.json() : null;

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

    const commonsRes = await fetch(commonsUrl, { headers, next: { revalidate: 86400 } });
    const commons = commonsRes.ok ? await commonsRes.json() : null;
    const page = commons?.query?.pages ? Object.values(commons.query.pages)[0] : null;
    const image = page?.imageinfo?.[0];

    return NextResponse.json({
      title: wiki?.title || title,
      extract: wiki?.extract || "",
      source: wiki?.content_urls?.desktop?.page || "",
      image: {
        original: image?.url || "",
        thumbnail: image?.thumburl || image?.url || "",
      },
    }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } });
  } catch {
    return NextResponse.json({ title, extract: "", image: { original: "", thumbnail: "" } });
  }
}

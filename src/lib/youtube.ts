/** Extrae el ID de video de una URL de YouTube (watch, youtu.be, embed). */
export function extractYoutubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    const v = parsed.searchParams.get("v");
    if (v) return v;
    const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
    if (embedMatch) return embedMatch[1] ?? null;
    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(url: string | undefined | null): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

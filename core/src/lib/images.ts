/**
 * Downscale Unsplash images to the size they are displayed at.
 * Other hosts (Supabase storage) pass through unchanged: their transform
 * params are not enabled, so rewriting would break the URL.
 */
export function sizedImage(url: string | null | undefined, width: number, quality = 70): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "images.unsplash.com") return url;
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", String(quality));
    return parsed.toString();
  } catch {
    return url;
  }
}

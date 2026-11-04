/** Resolve bundled public images without changing their persisted canonical path. */
export function publicAssetUrl(path: string): string {
  return path.startsWith('/images/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
}

const bundledPhoto = /^\/images\/(community|concert|innovation|outdoor|wellness|workshop)\.jpg$/;

/**
 * Responsive props for an event photo. Bundled photos have WebP copies at 640, 800 and 1200 px
 * (public/images/<name>-<width>.webp); uploaded images and other paths pass through as they are.
 * `sizes` describes the rendered width so the browser picks the lighter file on phones.
 */
export function eventImageProps(path: string, sizes = '(max-width: 700px) 100vw, 33vw'): { src: string; srcSet?: string; sizes?: string } {
  const match = bundledPhoto.exec(path);
  if (!match) return { src: publicAssetUrl(path) };
  const base = `${import.meta.env.BASE_URL}images/${match[1]}`;
  return { src: `${base}-800.webp`, srcSet: `${base}-640.webp 640w, ${base}-800.webp 800w, ${base}-1200.webp 1200w`, sizes };
}

/** Resolve bundled public images without changing their persisted canonical path. */
export function publicAssetUrl(path: string): string {
  return path.startsWith('/images/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
}

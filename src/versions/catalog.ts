export type ExperienceVersion = 'original' | '3d' | 'hybrid' | 'commercial';
export function versionHref(version: ExperienceVersion | 'versions') {
  const segment = { original: 'original', '3d': '3d', hybrid: 'hibrida', commercial: 'comercial', versions: 'versiones' }[version];
  return `${import.meta.env.BASE_URL}${segment}/`;
}

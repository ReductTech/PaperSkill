/**
 * Resolve files copied from public/ against Vite's configured base path.
 *
 * Local public paths are authored as `/images/...` for readability, but a raw
 * leading slash would point at the domain root after this tutorial is deployed
 * under `PaperSkill/papers/<paper-name>/`. External and data URLs are preserved.
 */
export function assetPath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

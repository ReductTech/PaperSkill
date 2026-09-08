/** Resolve public assets relative to Vite's deployment base.
 *
 * PaperSkill publishes each tutorial below a nested `/papers/<paperName>/`
 * path. Keeping this helper at the boundary prevents `/images/...` URLs from
 * escaping that subpath on GitHub Pages while still working in local dev.
 */
export function assetPath(path: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${clean}`;
}

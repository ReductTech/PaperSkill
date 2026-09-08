import { assetPath } from '../lib/assetPath';

// Optional paper-figure display. `src` is a path under /public (e.g. "/images/fig1.png")
// or an absolute URL. Figures are OPTIONAL (per contract.md §7/figures): only render when
// the generator supplies `src`. UI copy is Simplified Chinese where present.

export function Figure({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  if (!src) return null;
  const resolvedSrc = assetPath(src);
  return (
    <figure className="paper-figure">
      <img src={resolvedSrc} alt={alt || ''} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

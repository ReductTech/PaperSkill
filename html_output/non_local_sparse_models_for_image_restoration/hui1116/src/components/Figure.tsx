// Optional paper-figure display. `src` is a path under /public (e.g. "./images/fig1.png")
// or an absolute URL. Figures are OPTIONAL (per contract.md §7/figures): only render when
// the generator supplies `src`. UI copy is Simplified Chinese where present.

export function Figure({
  src,
  alt,
  caption,
  source,
}: {
  src?: string;
  alt?: string;
  caption?: string;
  source?: string;
}) {
  if (!src) return null;
  return (
    <figure className="paper-figure">
      <img src={src} alt={alt || ''} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
      {source ? <a className="paper-source" href={source} target="_blank" rel="noreferrer">在论文中查看 ↗</a> : null}
    </figure>
  );
}

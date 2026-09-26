// Optional paper-figure display. `src` is a RELATIVE path to a file in public/
// (e.g. "./images/fig1.png" — never the root-absolute a site-root image path, which 404s
// because tutorials are served from a repository sub-path) or an absolute URL.
// Figures are OPTIONAL (per contract.md §7/figures): only render when
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
  return (
    <figure className="paper-figure">
      <img src={src} alt={alt || ''} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

// Optional paper-figure display. `src` is a RELATIVE path to a file in public/
// (e.g. "./images/fig1.png" — never a root-absolute image path, which 404s
// because tutorials are served from a repository sub-path) or an absolute URL.
// Figures are OPTIONAL (per contract.md §11): call this helper from a
// paper-specific scene only when the generator supplies `src`.

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

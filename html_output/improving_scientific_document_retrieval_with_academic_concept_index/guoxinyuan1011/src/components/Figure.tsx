// Optional paper-figure display. `src` is a RELATIVE path to a file in public/
// (e.g. "./images/fig1.png") or an absolute URL. A root-absolute path — one that
// begins with a slash — must NOT be used: tutorials are served from a repository
// sub-path, so such a path resolves outside the app and 404s.
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

// Optional paper-figure display. Local public/ images use page-relative URLs,
// e.g. "./images/fig1.png", so they load under a nested deployment path.

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

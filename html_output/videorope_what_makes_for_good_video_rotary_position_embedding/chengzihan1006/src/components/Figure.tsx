// Optional paper-figure display. `src` is a relative path under /public (e.g. "images/fig1.png")
// or an absolute URL. The relative path is resolved against Vite's base URL so subdirectory
// deployments work as well as a site hosted at the domain root. Figures are OPTIONAL (per contract.md §7/figures): only render when
// the generator supplies `src`. UI copy is Simplified Chinese where present.

function resolveFigureSrc(src: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
}

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
  const imageSrc = resolveFigureSrc(src);
  return (
    <figure className="paper-figure">
      <a href={imageSrc} target="_blank" rel="noopener noreferrer" aria-label={`查看原尺寸：${alt || '论文图片'}`}>
        <img src={imageSrc} alt={alt || ''} loading="lazy" />
      </a>
      {caption ? <figcaption>{caption} 点击图片可查看原尺寸。</figcaption> : null}
    </figure>
  );
}

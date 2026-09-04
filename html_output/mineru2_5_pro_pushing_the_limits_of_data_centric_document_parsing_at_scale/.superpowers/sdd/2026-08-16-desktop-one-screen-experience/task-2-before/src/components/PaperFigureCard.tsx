import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlossaryText } from './Glossary';

export type PaperFigureHotspot = {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PaperFigureCardProps = {
  src: string;
  alt: string;
  figure: string;
  title: string;
  intro: string;
  sourceHref: string;
  width?: number;
  height?: number;
  compact?: boolean;
  hotspots?: readonly PaperFigureHotspot[];
  provenance?: 'paper-original' | 'paper-redraw';
};

export interface PaperFigureViewerProps {
  open: boolean;
  src: string;
  alt: string;
  title: string;
  width?: number;
  height?: number;
  hotspots?: readonly PaperFigureHotspot[];
  initialHotspotId?: string;
  /** Optional context keeps legacy PaperFigureCard viewers feature-equivalent. */
  intro?: string;
  figure?: string;
  sourceHref?: string;
  provenance?: 'paper-original' | 'paper-redraw';
  boundaryText?: string;
  onClose: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normaliseHotspot(hotspot: PaperFigureHotspot): PaperFigureHotspot {
  const x = clamp(Number.isFinite(hotspot.x) ? hotspot.x : 0, 0, 99.5);
  const y = clamp(Number.isFinite(hotspot.y) ? hotspot.y : 0, 0, 99.5);
  const width = clamp(Number.isFinite(hotspot.width) ? hotspot.width : 1, 0.5, 100 - x);
  const height = clamp(Number.isFinite(hotspot.height) ? hotspot.height : 1, 0.5, 100 - y);
  return { ...hotspot, x, y, width, height };
}

export function PaperFigureViewer({
  open, src, alt, title, width, height, hotspots = [], initialHotspotId, intro,
  figure, sourceHref, provenance = 'paper-original', boundaryText, onClose,
}: PaperFigureViewerProps) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(initialHotspotId ?? null);
  const [showFullFigure, setShowFullFigure] = useState(!initialHotspotId);
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const safeHotspots = useMemo(() => hotspots.map(normaliseHotspot), [hotspots]);
  const activeHotspot = safeHotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null;
  const figureRatio = width && height ? width / height : 16 / 9;
  const cropRatio = activeHotspot ? figureRatio * (activeHotspot.width / activeHotspot.height) : figureRatio;

  useEffect(() => {
    if (!open) return;
    setActiveHotspotId(initialHotspotId ?? null);
    setShowFullFigure(!initialHotspotId);
    setExpanded(false);
  }, [initialHotspotId, open]);

  useEffect(() => { setImageFailed(false); }, [open, src]);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((element) => !element.hasAttribute('hidden'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;
  const cropImageStyle: React.CSSProperties | undefined = activeHotspot && !showFullFigure ? {
    width: `${10000 / activeHotspot.width}%`, height: 'auto', maxWidth: 'none',
    left: `${(-activeHotspot.x / activeHotspot.width) * 100}%`, top: `${(-activeHotspot.y / activeHotspot.height) * 100}%`,
  } : undefined;

  return createPortal(
    <div className="paper-figure-viewer" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className={`paper-figure-viewer__dialog ${expanded ? 'is-expanded' : ''}`} role="dialog" aria-modal="true" aria-labelledby={`${dialogId}-title`} aria-describedby={boundaryText ? `${dialogId}-boundary` : undefined}>
        <header className="paper-figure-viewer__toolbar"><div><span>{provenance === 'paper-redraw' ? '基于论文重绘' : '论文原图节选'}</span><strong id={`${dialogId}-title`}>{activeHotspot && !showFullFigure ? activeHotspot.label : title}</strong></div><div>
          <button type="button" onClick={() => setExpanded((current) => !current)}>{expanded ? '退出全屏' : '铺满窗口'}</button>
          <button ref={closeButtonRef} type="button" className="paper-figure-viewer__close" aria-label="关闭论文图片查看器" onClick={onClose}>关闭 <span aria-hidden="true">×</span></button>
        </div></header>
        <div className="paper-figure-viewer__body"><div className="paper-figure-viewer__stage"><div className={`paper-figure-viewer__viewport ${activeHotspot && !showFullFigure ? 'is-cropped' : 'is-full'}`} style={{ aspectRatio: activeHotspot && !showFullFigure ? cropRatio : figureRatio }}>
          {imageFailed ? <div className="paper-figure-card__fallback" role="status"><strong>图片暂时无法显示</strong>{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer">打开论文出处</a> : null}</div> : <img src={src} alt={activeHotspot && !showFullFigure ? `${alt}；局部：${activeHotspot.label}` : alt} style={cropImageStyle} onError={() => setImageFailed(true)} />}
        </div></div><aside className="paper-figure-viewer__explanation">
          <span className={`source-tag ${provenance === 'paper-redraw' ? 'teaching' : 'paper'}`}>{activeHotspot && !showFullFigure ? '教学示意' : provenance === 'paper-redraw' ? '基于论文重绘' : '论文原图节选'}</span>
          <h4>{activeHotspot && !showFullFigure ? activeHotspot.label : '完整图片'}</h4>
          <p>{activeHotspot && !showFullFigure ? activeHotspot.description : intro ?? '在本地查看完整图片，或切换到图中的讲解区域。'}</p>
          {activeHotspot ? <button type="button" className="paper-figure-viewer__view-toggle" onClick={() => setShowFullFigure((current) => !current)}>{showFullFigure ? `返回局部：${activeHotspot.label}` : '在整图中查看位置'}</button> : null}
          {safeHotspots.length ? <div className="paper-figure-viewer__sections"><strong>切换图中模块</strong><div>{safeHotspots.map((hotspot, index) => <button type="button" key={hotspot.id} className={activeHotspot?.id === hotspot.id && !showFullFigure ? 'is-active' : ''} aria-pressed={activeHotspot?.id === hotspot.id && !showFullFigure} onClick={() => { setActiveHotspotId(hotspot.id); setShowFullFigure(false); }}><i aria-hidden="true">{index + 1}</i><span>{hotspot.label}</span></button>)}</div></div> : null}
          {boundaryText ? <div className="paper-figure-viewer__boundary" id={`${dialogId}-boundary`}><strong>{provenance === 'paper-redraw' ? '重绘边界' : '事实与教学层的边界'}</strong><p>{boundaryText}</p></div> : null}
          {sourceHref ? <a className="paper-figure-viewer__source" href={sourceHref} target="_blank" rel="noreferrer">在论文中核对 {figure ?? title} ↗</a> : null}
        </aside></div>
      </div>
    </div>, document.body,
  );
}

export function PaperFigureCard({ src, alt, figure, title, intro, sourceHref, width, height, compact = false, hotspots = [], provenance = 'paper-original' }: PaperFigureCardProps) {
  const [viewerHotspotId, setViewerHotspotId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: width ?? 0, height: height ?? 0 });
  const safeHotspots = useMemo(() => hotspots.map(normaliseHotspot), [hotspots]);
  const ratio = naturalSize.width > 0 && naturalSize.height > 0 ? naturalSize.width / naturalSize.height : 16 / 9;
  const isRedraw = provenance === 'paper-redraw';
  const provenanceLabel = isRedraw ? `基于论文重绘 · ${figure}` : `论文原图节选 · ${figure}`;
  const boundaryText = isRedraw ? '图形依据论文机制重新绘制；中文标注属于教学表达。' : '图片来自论文原图；彩色热点与中文解释属于教学标注。';
  useEffect(() => { setImageFailed(false); setNaturalSize({ width: width ?? 0, height: height ?? 0 }); }, [height, src, width]);
  return <figure className={`paper-figure-card ${compact ? 'paper-figure-card--compact' : ''}`}>
    <div className="paper-figure-card__copy"><span className={`source-tag ${isRedraw ? 'teaching' : 'paper'}`}>{provenanceLabel}</span><h3><GlossaryText text={title} /></h3><p><GlossaryText text={intro} /></p><small>点击图片可在对话框中查看本地原尺寸图。</small></div>
    <div className="paper-figure-card__media-column"><div className={`paper-figure-card__media ${imageFailed ? 'has-error' : ''}`} style={{ aspectRatio: ratio }}>{imageFailed ? <div className="paper-figure-card__fallback" role="status"><strong>图片暂时无法显示</strong><p>教学说明仍可阅读，也可以前往论文出处核对原图。</p><a href={sourceHref} target="_blank" rel="noreferrer">打开论文出处</a></div> : <>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" onLoad={(event) => setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setImageFailed(true)} />
      <button type="button" className="paper-figure-card__full-trigger" aria-label={`在对话框中查看 ${figure} 整张图`} onClick={() => setViewerHotspotId('')}><span>查看整图 ↗</span></button>
      {safeHotspots.map((hotspot, index) => <button type="button" key={hotspot.id} className="paper-figure-card__hotspot" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }} aria-label={`放大区域 ${index + 1}：${hotspot.label}`} data-label={hotspot.label} onClick={() => setViewerHotspotId(hotspot.id)}><span aria-hidden="true">{index + 1}</span></button>)}
    </>}</div>{safeHotspots.length > 0 && !imageFailed ? <div className="paper-figure-card__hotspot-list" aria-label={`${figure} 图中分区`}><span>图中分区</span><div>{safeHotspots.map((hotspot, index) => <button type="button" key={hotspot.id} onClick={() => setViewerHotspotId(hotspot.id)}><i aria-hidden="true">{index + 1}</i>{hotspot.label}</button>)}</div></div> : null}</div>
    <figcaption><span>{boundaryText}</span><a href={sourceHref} target="_blank" rel="noreferrer">核对论文出处 ↗</a></figcaption>
    <PaperFigureViewer open={viewerHotspotId !== null} src={src} alt={alt} title={title} width={width} height={height} hotspots={safeHotspots} initialHotspotId={viewerHotspotId || undefined} intro={intro} figure={figure} sourceHref={sourceHref} provenance={provenance} boundaryText={boundaryText} onClose={() => setViewerHotspotId(null)} />
  </figure>;
}

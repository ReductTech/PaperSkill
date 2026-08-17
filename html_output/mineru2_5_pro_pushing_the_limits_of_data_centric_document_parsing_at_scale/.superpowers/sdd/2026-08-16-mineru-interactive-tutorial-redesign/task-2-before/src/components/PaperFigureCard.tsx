import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlossaryText } from './Glossary';

export type PaperFigureHotspot = {
  id: string;
  label: string;
  description: string;
  /** Left edge as a percentage of the original figure width. */
  x: number;
  /** Top edge as a percentage of the original figure height. */
  y: number;
  /** Region width as a percentage of the original figure width. */
  width: number;
  /** Region height as a percentage of the original figure height. */
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
  /** Defaults to an unchanged paper figure. Hotspots are always a teaching overlay. */
  provenance?: 'paper-original' | 'paper-redraw';
};

type ViewerState = {
  hotspotId: string | null;
  showFullFigure: boolean;
  expanded: boolean;
};

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

export function PaperFigureCard({
  src,
  alt,
  figure,
  title,
  intro,
  sourceHref,
  width,
  height,
  compact = false,
  hotspots = [],
  provenance = 'paper-original',
}: PaperFigureCardProps) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: width ?? 0, height: height ?? 0 });

  const safeHotspots = useMemo(
    () => hotspots.map(normaliseHotspot),
    [hotspots],
  );
  const activeHotspot = viewer?.hotspotId
    ? safeHotspots.find((hotspot) => hotspot.id === viewer.hotspotId) ?? null
    : null;
  const figureRatio = naturalSize.width > 0 && naturalSize.height > 0
    ? naturalSize.width / naturalSize.height
    : 16 / 9;
  const cropRatio = activeHotspot
    ? figureRatio * (activeHotspot.width / activeHotspot.height)
    : figureRatio;
  const isRedraw = provenance === 'paper-redraw';
  const provenanceLabel = isRedraw ? `基于论文重绘 · ${figure}` : `论文原图 · ${figure}`;
  const boundaryText = isRedraw
    ? '图形依据论文机制重新绘制；数字与流程来自论文，视觉编排和中文热点属于教学表达。'
    : '图片及图中数据来自论文原图；彩色热点、局部裁剪与中文解释是本页添加的教学标注。';
  const viewerOpen = viewer !== null;

  useEffect(() => {
    setImageFailed(false);
    setNaturalSize({ width: width ?? 0, height: height ?? 0 });
  }, [height, src, width]);

  useEffect(() => {
    if (!viewerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setViewer(null);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    };
  }, [viewerOpen]);

  const rememberTrigger = (element: HTMLElement) => {
    returnFocusRef.current = element;
  };

  const openFullFigure = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (imageFailed) return;
    rememberTrigger(event.currentTarget);
    setViewer({ hotspotId: null, showFullFigure: true, expanded: false });
  };

  const openHotspot = (hotspotId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (imageFailed) return;
    rememberTrigger(event.currentTarget);
    setViewer({ hotspotId, showFullFigure: false, expanded: false });
  };

  const chooseHotspotInViewer = (hotspotId: string) => {
    setViewer((current) => current
      ? { ...current, hotspotId, showFullFigure: false }
      : current);
  };

  const mediaAspectStyle: React.CSSProperties = { aspectRatio: figureRatio };
  const cropImageStyle: React.CSSProperties | undefined = activeHotspot && !viewer?.showFullFigure
    ? {
        width: `${10000 / activeHotspot.width}%`,
        height: 'auto',
        maxWidth: 'none',
        left: `${(-activeHotspot.x / activeHotspot.width) * 100}%`,
        top: `${(-activeHotspot.y / activeHotspot.height) * 100}%`,
      }
    : undefined;

  return (
    <figure className={`paper-figure-card ${compact ? 'paper-figure-card--compact' : ''}`}>
      <div className="paper-figure-card__copy">
        <span className={`source-tag ${isRedraw ? 'teaching' : 'paper'}`}>{provenanceLabel}</span>
        <h3><GlossaryText text={title} /></h3>
        <p><GlossaryText text={intro} /></p>
        <small>
          {safeHotspots.length > 0
            ? '选择图中编号查看局部与中文解释；点击图像空白处查看整图。'
            : '点击图像可在对话框中查看本地原尺寸图。'}
        </small>
      </div>

      <div className="paper-figure-card__media-column">
        <div
          className={`paper-figure-card__media ${imageFailed ? 'has-error' : ''}`}
          style={mediaAspectStyle}
        >
          {imageFailed ? (
            <div className="paper-figure-card__fallback" role="status">
              <span aria-hidden="true">▧</span>
              <strong>论文图暂时无法加载</strong>
              <p>教学说明仍可阅读，也可以前往论文出处核对原图。</p>
              <a href={sourceHref} target="_blank" rel="noreferrer">打开论文出处 ↗</a>
            </div>
          ) : (
            <>
              <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading="lazy"
                decoding="async"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setImageFailed(false);
                  setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
                }}
                onError={() => setImageFailed(true)}
              />
              <button
                type="button"
                className="paper-figure-card__full-trigger"
                aria-label={`在对话框中查看 ${figure} 整张图`}
                onClick={openFullFigure}
              >
                <span>查看整图 ↗</span>
              </button>
              {safeHotspots.map((hotspot, index) => (
                <button
                  type="button"
                  key={hotspot.id}
                  className="paper-figure-card__hotspot"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                  }}
                  aria-label={`放大区域 ${index + 1}：${hotspot.label}`}
                  data-label={hotspot.label}
                  onClick={(event) => openHotspot(hotspot.id, event)}
                >
                  <span aria-hidden="true">{index + 1}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {safeHotspots.length > 0 && !imageFailed ? (
          <div className="paper-figure-card__hotspot-list" aria-label={`${figure} 图中分区`}>
            <span>图中分区</span>
            <div>
              {safeHotspots.map((hotspot, index) => (
                <button
                  type="button"
                  key={hotspot.id}
                  onClick={(event) => openHotspot(hotspot.id, event)}
                >
                  <i aria-hidden="true">{index + 1}</i>{hotspot.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <figcaption>
        <span>{boundaryText}</span>
        <a href={sourceHref} target="_blank" rel="noreferrer">核对论文出处 ↗</a>
      </figcaption>

      {viewer && typeof document !== 'undefined' ? createPortal((
        <div
          className="paper-figure-viewer"
          role="presentation"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setViewer(null);
          }}
        >
          <div
            ref={dialogRef}
            className={`paper-figure-viewer__dialog ${viewer.expanded ? 'is-expanded' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            aria-describedby={`${dialogId}-boundary`}
          >
            <header className="paper-figure-viewer__toolbar">
              <div>
                <span>{provenanceLabel}</span>
                <strong id={`${dialogId}-title`}>
                  {activeHotspot && !viewer.showFullFigure ? activeHotspot.label : title}
                </strong>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setViewer((current) => current
                    ? { ...current, expanded: !current.expanded }
                    : current)}
                >
                  {viewer.expanded ? '退出铺满' : '铺满窗口'}
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="paper-figure-viewer__close"
                  aria-label="关闭论文图查看器"
                  onClick={() => setViewer(null)}
                >
                  关闭 <span aria-hidden="true">×</span>
                </button>
              </div>
            </header>

            <div className="paper-figure-viewer__body">
              <div className="paper-figure-viewer__stage">
                <div
                  className={`paper-figure-viewer__viewport ${activeHotspot && !viewer.showFullFigure ? 'is-cropped' : 'is-full'}`}
                  style={{ aspectRatio: activeHotspot && !viewer.showFullFigure ? cropRatio : figureRatio }}
                >
                  {imageFailed ? (
                    <div className="paper-figure-card__fallback" role="status">
                      <strong>论文图暂时无法加载</strong>
                      <a href={sourceHref} target="_blank" rel="noreferrer">打开论文出处 ↗</a>
                    </div>
                  ) : (
                    <img
                      src={src}
                      alt={activeHotspot && !viewer.showFullFigure ? `${alt}；局部：${activeHotspot.label}` : alt}
                      style={cropImageStyle}
                      onError={() => setImageFailed(true)}
                    />
                  )}
                </div>
              </div>

              <aside className="paper-figure-viewer__explanation">
                <span className={`source-tag ${isRedraw ? 'teaching' : 'paper'}`}>
                  {activeHotspot && !viewer.showFullFigure ? '教学局部讲解' : provenanceLabel}
                </span>
                <h4>{activeHotspot && !viewer.showFullFigure ? activeHotspot.label : '整图阅读顺序'}</h4>
                <p>{activeHotspot && !viewer.showFullFigure
                  ? activeHotspot.description
                  : intro}</p>

                {activeHotspot ? (
                  <button
                    type="button"
                    className="paper-figure-viewer__view-toggle"
                    onClick={() => setViewer((current) => current
                      ? { ...current, showFullFigure: !current.showFullFigure }
                      : current)}
                  >
                    {viewer.showFullFigure ? `返回局部：${activeHotspot.label}` : '在整图中查看位置'}
                  </button>
                ) : null}

                {safeHotspots.length > 0 ? (
                  <div className="paper-figure-viewer__sections">
                    <strong>切换图中模块</strong>
                    <div>
                      {safeHotspots.map((hotspot, index) => (
                        <button
                          type="button"
                          key={hotspot.id}
                          className={activeHotspot?.id === hotspot.id && !viewer.showFullFigure ? 'is-active' : ''}
                          aria-pressed={activeHotspot?.id === hotspot.id && !viewer.showFullFigure}
                          onClick={() => chooseHotspotInViewer(hotspot.id)}
                        >
                          <i aria-hidden="true">{index + 1}</i>
                          <span>{hotspot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="paper-figure-viewer__boundary" id={`${dialogId}-boundary`}>
                  <strong>{isRedraw ? '重绘边界' : '事实与教学层的边界'}</strong>
                  <p>{boundaryText}</p>
                </div>
                <a className="paper-figure-viewer__source" href={sourceHref} target="_blank" rel="noreferrer">
                  在论文中核对 {figure} ↗
                </a>
              </aside>
            </div>
          </div>
        </div>
      ), document.body) : null}
    </figure>
  );
}

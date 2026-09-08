import { useMemo, useState } from 'react';
import { getMediaAsset, type MediaAssetId } from '../data/media';
import type { MediaCrop, PaperMediaVariant, PaperMediaViewerMode } from '../types';
import { PaperFigureViewer, type PaperFigureHotspot } from './PaperFigureCard';

export interface PaperMediaProps {
  assetId: MediaAssetId;
  cropId?: string;
  variant?: PaperMediaVariant;
  viewer?: PaperMediaViewerMode;
  label?: '论文原图节选' | '基于论文重绘' | '教学示意';
  caption?: string;
  hotspots?: readonly PaperFigureHotspot[];
  className?: string;
  chrome?: boolean;
}

function cropStyle(crop: MediaCrop | undefined, width?: number, height?: number): React.CSSProperties {
  const ratio = crop && width && height
    ? (width * (crop.width / 100)) / (height * (crop.height / 100))
    : width && height ? width / height : 16 / 9;
  return {
    '--paper-crop-aspect': String(ratio),
    '--paper-crop-image-width': `${10000 / (crop?.width ?? 100)}%`,
    '--paper-crop-image-left': `${-((crop?.x ?? 0) / (crop?.width ?? 100)) * 100}%`,
    '--paper-crop-image-top': `${-((crop?.y ?? 0) / (crop?.height ?? 100)) * 100}%`,
  } as React.CSSProperties;
}

export function PaperMedia({
  assetId,
  cropId,
  variant = 'card',
  viewer = 'full',
  label = '论文原图节选',
  caption,
  hotspots,
  className,
  chrome,
}: PaperMediaProps) {
  const asset = getMediaAsset(assetId);
  const crop = cropId ? asset.crops?.[cropId] : undefined;
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const style = useMemo(() => cropStyle(crop, asset.width, asset.height), [asset.height, asset.width, crop]);
  const cropAlt = crop
    ? `${asset.alt}；裁图：${crop.label}${caption && caption !== crop.label ? `；${caption}` : ''}`
    : asset.alt;
  const viewerContext = [caption, crop?.label]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join('；');
  const boundaryText = asset.forbiddenClaims?.join(' ') ?? `仅支持以下说明：${asset.allowedClaim}`;
  const cropHotspot: PaperFigureHotspot | undefined = crop && cropId ? {
    ...crop,
    id: cropId,
    description: caption ?? asset.allowedClaim,
    provenance: 'paper-original',
  } : undefined;
  const viewerHotspots = cropHotspot && viewer === 'crop'
    ? [cropHotspot, ...(hotspots ?? []).filter((hotspot) => hotspot.id !== cropHotspot.id)]
    : hotspots;
  const showChrome = chrome ?? variant !== 'thumbnail';

  return <figure
    className={`paper-media paper-media--${variant} ${className ?? ''}`.trim()}
    data-asset-id={assetId}
    data-crop-id={cropId}
    data-variant={variant}
  >
    {showChrome ? <span className="source-tag paper-media__label">{label}</span> : null}
    <div className="paper-media__canvas">
      <div className={`paper-crop ${failed ? 'paper-crop--failed' : ''}`} style={style}>
        {failed ? <div className="paper-media__fallback" role="status"><strong>图片暂时无法显示</strong><span>本地图片不可用；请继续阅读页面中的文字说明。</span></div> : <>
          <img src={asset.src} alt={cropAlt} width={asset.width} height={asset.height} loading="lazy" decoding="async" onError={() => setFailed(true)} />
          {viewer === false ? null : <button
            type="button"
            className="viewer-trigger"
            aria-label={`${viewer === 'crop' && cropHotspot ? '查看局部图片' : '查看完整图片'}${viewerContext ? `：${viewerContext}` : ''}`}
            onClick={() => setViewerOpen(true)}
          ><span>{viewer === 'crop' && cropHotspot ? '查看局部' : '查看完整图片'}</span></button>}
        </>}
      </div>
    </div>
    {showChrome && caption ? <figcaption>{caption}</figcaption> : null}
    {showChrome && asset.source ? <a className="paper-media__source" href={asset.source.url} target="_blank" rel="noreferrer">来源：{asset.source.title}</a> : null}
    {viewer === false ? null : <PaperFigureViewer
      open={viewerOpen}
      src={asset.src}
      alt={asset.alt}
      title={caption ?? crop?.label ?? asset.alt}
      width={asset.width}
      height={asset.height}
      hotspots={viewerHotspots}
      initialHotspotId={viewer === 'crop' ? cropHotspot?.id : undefined}
      intro={asset.allowedClaim}
      figure={asset.source?.figure}
      sourceHref={asset.source?.url}
      provenance={label === '基于论文重绘' ? 'paper-redraw' : 'paper-original'}
      boundaryText={boundaryText}
      onClose={() => setViewerOpen(false)}
    />}
  </figure>;
}

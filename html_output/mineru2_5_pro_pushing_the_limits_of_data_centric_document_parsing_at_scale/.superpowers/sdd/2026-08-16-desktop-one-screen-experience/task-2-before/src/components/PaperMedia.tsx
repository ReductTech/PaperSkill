import { useMemo, useState } from 'react';
import { getMediaAsset, type MediaAssetId } from '../data/media';
import type { MediaCrop } from '../types';
import { PaperFigureViewer, type PaperFigureHotspot } from './PaperFigureCard';

export interface PaperMediaProps {
  assetId: MediaAssetId;
  cropId?: string;
  label: '论文原图节选' | '基于论文重绘' | '教学示意';
  caption?: string;
  hotspots?: readonly PaperFigureHotspot[];
  className?: string;
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

export function PaperMedia({ assetId, cropId, label, caption, hotspots, className }: PaperMediaProps) {
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

  return <figure className={`paper-media ${className ?? ''}`.trim()}>
    <span className="source-tag paper-media__label">{label}</span>
    <div className={`paper-crop ${failed ? 'paper-crop--failed' : ''}`} style={style}>
      {failed ? <div className="paper-media__fallback" role="status"><strong>图片暂时无法显示</strong><span>本地图片不可用；说明和来源链接仍然保留。</span></div> : <>
        <img src={asset.src} alt={cropAlt} width={asset.width} height={asset.height} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        <button type="button" className="viewer-trigger" aria-label={`查看完整图片${viewerContext ? `：${viewerContext}` : ''}`} onClick={() => setViewerOpen(true)}><span>查看完整图片</span></button>
      </>}
    </div>
    {caption ? <figcaption>{caption}</figcaption> : null}
    {asset.source ? <a className="paper-media__source" href={asset.source.url} target="_blank" rel="noreferrer">来源：{asset.source.title}</a> : null}
    <PaperFigureViewer
      open={viewerOpen}
      src={asset.src}
      alt={asset.alt}
      title={caption ?? crop?.label ?? asset.alt}
      width={asset.width}
      height={asset.height}
      hotspots={hotspots}
      intro={asset.allowedClaim}
      figure={asset.source?.figure}
      sourceHref={asset.source?.url}
      provenance={label === '基于论文重绘' ? 'paper-redraw' : 'paper-original'}
      boundaryText={boundaryText}
      onClose={() => setViewerOpen(false)}
    />
  </figure>;
}

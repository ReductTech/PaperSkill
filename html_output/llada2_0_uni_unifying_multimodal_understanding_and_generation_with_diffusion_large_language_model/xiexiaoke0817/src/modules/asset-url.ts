import type React from 'react';

export function assetUrl(file: string) {
  const normalized = file.replace(/^\/?images\//, '').replace(/^\//, '');
  return `${import.meta.env.BASE_URL}images/${normalized}`;
}

export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#eef1f2"/><rect x="24" y="24" width="912" height="492" rx="18" fill="none" stroke="#aab6bf" stroke-dasharray="10 8"/><text x="480" y="255" text-anchor="middle" fill="#41566a" font-family="Arial,sans-serif" font-size="28" font-weight="700">图片资源未加载</text><text x="480" y="300" text-anchor="middle" fill="#71808c" font-family="Arial,sans-serif" font-size="18">请检查本地预览服务或部署路径</text></svg>`;
  image.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  image.alt = `${image.alt}（资源加载失败）`;
}

import { useState } from 'react';

function iou(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

export function AnchorDrawer(_props: { chapterId: string; moduleId: string }) {
  const [aspect, setAspect] = useState(1);
  const base = 180;
  const ph = Math.sqrt((base * base) / aspect);
  const pw = ph * aspect;
  const photo = { x: -pw / 2, y: -ph / 2, w: pw, h: ph };
  const anchors = [0.5, 1, 2].flatMap((a) => [0.72, 1, 1.35].map((s) => {
    const w = base * s * Math.sqrt(a);
    const h = base * s / Math.sqrt(a);
    const rect = { x: -w / 2, y: -h / 2, w, h };
    return { a, s, rect, hit: iou(photo, rect) >= 0.5, score: iou(photo, rect) };
  }));
  const matched = anchors.filter((item) => item.hit).length;
  const best = anchors.reduce((p, c) => (c.score > p.score ? c : p));
  const fit = Math.min(460 / pw, 280 / ph);
  const tone = matched < 3 ? '#c43f52' : matched >= 5 ? '#228d5c' : '#27446e';
  const feedback = matched < 3
    ? `这张照片的长宽比是 ${aspect.toFixed(2)}，9 个固定相框里只有 ${matched} 个交并比达到 0.5。形状一变，套得上的框就少了。`
    : matched >= 5
      ? `接近正方形时有 ${matched} 个预制框能套上。这只说明形状凑巧，不是 COCO 的 AP。`
      : `现在有 ${matched} 个预制框交并比达到 0.5。再把照片拉扁或拉高，这个数会掉下去。`;
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '900px 532px', gap: 40 }}>
      <svg viewBox="0 0 900 622" width="900" height="622" role="img" aria-label="照片和预制相框">
        <rect width="900" height="622" rx="18" fill="#f3ead7" />
        <g transform={`translate(390 250) scale(${fit})`}>
          <rect x={best.rect.x} y={best.rect.y} width={best.rect.w} height={best.rect.h} fill="none" stroke={best.hit ? '#27446e' : '#c43f52'} strokeWidth={6 / fit} />
          <rect x={photo.x} y={photo.y} width={photo.w} height={photo.h} fill="#fffdf8" stroke="#f07e47" strokeWidth={5 / fit} />
          <ellipse cx="0" cy={-ph * 0.08} rx="18" ry="9" fill="#228d5c" />
          <path d="M -14 0 Q 0 36 14 0 Z" fill="#27446e" />
        </g>
        {anchors.map((item, i) => {
          const col = i % 9;
          const x = 36 + col * 96;
          const y = 500;
          const iw = 36 * Math.sqrt(item.a);
          const ih = 36 / Math.sqrt(item.a);
          return (
            <g key={i}>
              <rect x={x} y={y} width="84" height="92" rx="8" fill={item.hit ? '#e7f6ee' : '#fde8eb'} />
              <rect x={x + 42 - iw / 2} y={y + 40 - ih / 2} width={iw} height={ih} fill="none" stroke={item.hit ? '#228d5c' : '#c43f52'} strokeWidth="3" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <div style={{ fontSize: 34, lineHeight: 1.3, fontWeight: 800, color: '#21324a' }}>9 个固定相框</div>
        <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 800, color: tone }}>{matched} / 9</div>
        <label style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>
          照片长宽比 {aspect.toFixed(2)}
          <input type="range" min={0.5} max={2.2} step={0.02} value={aspect}
            onChange={(e) => setAspect(Number(e.target.value))}
            aria-valuetext={`长宽比 ${aspect.toFixed(2)}，${matched} 个相框能套上`}
            style={{ width: '100%', height: 36, accentColor: '#f07e47' }} />
        </label>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: tone }}>{feedback}</div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>表 8 消融（不是表 3 主实验）：单锚框 32.5，九锚框 35.7，纯 FCOS（C5）也是 35.7。上面的相框个数只是示意。</div>
      </div>
    </div>
  );
}

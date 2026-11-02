import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

/* 封面：同一张玻片，两种看法。
   左侧只把整片缩成一张缩略图就下结论；右侧用显微镜视野框逐处核查后签报告。
   两侧共用 useCoverPlayback 的同一时钟与同一尺寸。 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

const SL = {
  glass: '#eef4f7',
  glassEdge: '#c7d4dc',
  label: '#f7f3e6',
  labelLine: '#b9c4cf',
  tissue: '#dfbcc7',
  tissueDeep: '#c69aab',
  nucleus: '#8a5f74',
  lumen: '#fbf7f2',
  ink: '#21324a',
  inkSoft: '#5b6b84',
  brass: '#b98a4b',
  green: '#228d5c',
  red: '#c43f52',
};

function SlideArt({ x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5 }: { x: number; y: number; w: number; h: number; zoom?: number; fx?: number; fy?: number }) {
  const uid = React.useId().replace(/:/g, '');
  const pad = 6;
  const labelW = Math.max(18, w * 0.14);
  const inner = { x: x + pad, y: y + pad, w: w - pad * 2 - labelW, h: h - pad * 2 };
  const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const k = 0.82 + 0.22 * Math.sin(seed + i * 1.7) + 0.1 * Math.cos(seed * 2.3 + i);
      pts.push(`${(cx + Math.cos(a) * rx * k) * inner.w} ${(cy + Math.sin(a) * ry * k) * inner.h}`);
    }
    return `M${pts.join(' L')} Z`;
  };
  const nuclei: React.ReactElement[] = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.399963;
    const r = Math.sqrt((i + 0.6) / 46) * 0.42;
    const cx = inner.w * (0.5 + Math.cos(a) * r);
    const cy = inner.h * (0.5 + Math.sin(a) * r * 0.86);
    nuclei.push(
      <circle key={i} cx={cx} cy={cy} r={Math.max(1, inner.h * (0.008 + 0.006 * ((i % 3) / 2)))} fill={SL.nucleus} opacity={0.28 + 0.12 * (i % 4)} />,
    );
  }
  const tissue = (
    <g>
      <rect x={0} y={0} width={inner.w} height={inner.h} fill="#fdf9f5" />
      {/* 嗜伊红组织浆：几块不规则粉染区 */}
      <path d={blob(0.28, 0.34, 0.3, 0.34, 1.1)} fill={SL.tissue} opacity={0.92} />
      <path d={blob(0.66, 0.46, 0.28, 0.3, 2.6)} fill={SL.tissue} opacity={0.86} />
      <path d={blob(0.46, 0.72, 0.34, 0.24, 4.2)} fill={SL.tissue} opacity={0.8} />
      {/* 深染色区（核密集） */}
      <path d={blob(0.56, 0.4, 0.16, 0.17, 3.4)} fill={SL.tissueDeep} opacity={0.55} />
      <path d={blob(0.3, 0.62, 0.13, 0.12, 5.1)} fill={SL.tissueDeep} opacity={0.45} />
      {/* 组织纹理：细密走向线 */}
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={`t${i}`} d={`M0 ${(inner.h / 16) * (i + 0.5)} C${inner.w * 0.3} ${(inner.h / 16) * (i + 0.5) - inner.h * 0.03} ${inner.w * 0.7} ${(inner.h / 16) * (i + 0.5) + inner.h * 0.03} ${inner.w} ${(inner.h / 16) * (i + 0.5)}`}
          fill="none" stroke={SL.tissueDeep} strokeWidth={0.7} opacity={0.16} />
      ))}
      {/* 细胞核与腔隙 */}
      {nuclei}
      <ellipse cx={inner.w * 0.38} cy={inner.h * 0.46} rx={inner.w * 0.018} ry={inner.h * 0.03} fill={SL.lumen} opacity={0.5} />
      <ellipse cx={inner.w * 0.7} cy={inner.h * 0.66} rx={inner.w * 0.014} ry={inner.h * 0.022} fill={SL.lumen} opacity={0.45} />
      <ellipse cx={inner.w * 0.52} cy={inner.h * 0.26} rx={inner.w * 0.012} ry={inner.h * 0.018} fill={SL.lumen} opacity={0.4} />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`sl-clip-${uid}`}>
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
        </clipPath>
        <pattern id={`sl-tissue-${uid}`} width={inner.w} height={inner.h} patternUnits="userSpaceOnUse"
          patternTransform={`translate(${inner.x} ${inner.y}) translate(${fx * inner.w} ${fy * inner.h}) scale(${zoom}) translate(${-fx * inner.w} ${-fy * inner.h})`}>
          {tissue}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={SL.glass} stroke={SL.glassEdge} strokeWidth={1.5} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
      <g clipPath={`url(#sl-clip-${uid})`}>
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill={`url(#sl-tissue-${uid})`} />
      </g>
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={SL.glassEdge} strokeWidth={1} />
      <rect x={x + w - labelW} y={y + pad} width={labelW - pad} height={h - pad * 2} rx={3} fill={SL.label} stroke={SL.glassEdge} strokeWidth={0.8} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.32} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.32} stroke={SL.labelLine} strokeWidth={1.4} />
      <line x1={x + w - labelW + 4} y1={y + pad + (h - pad * 2) * 0.5} x2={x + w - pad - 3} y2={y + pad + (h - pad * 2) * 0.5} stroke={SL.labelLine} strokeWidth={1.1} />
    </g>
  );
}

function ScopeArt({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} aria-hidden="true">
      <rect x={-28} y={44} width={56} height={10} rx={4} fill="#4b5b6b" />
      <path d="M-6 44 V10" stroke="#4b5b6b" strokeWidth={7} strokeLinecap="round" />
      <rect x={-22} y={16} width={44} height={7} rx={3} fill="#8a99a8" />
      <path d="M-14 16 V6 M0 16 V2 M14 16 V6" stroke="#5b6b84" strokeWidth={5} strokeLinecap="round" />
      <path d="M-10 2 Q0 -26 10 2" fill="none" stroke="#4b5b6b" strokeWidth={7} strokeLinecap="round" />
      <rect x={-7} y={-30} width={14} height={16} rx={4} fill="#6d7d8c" />
      <circle cx={0} cy={-32} r={4} fill={SL.brass} />
    </g>
  );
}

function Stamp({ x, y, label, color, scale }: { x: number; y: number; label: string; color: string; scale: number }) {
  const s = clamp(scale, 0, 1);
  if (s <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(-7) scale(${s})`} opacity={s}>
      <rect x={-48} y={-22} width={96} height={44} rx={5} fill="#fffdf6" opacity={0.65} />
      <rect x={-48} y={-22} width={96} height={44} rx={5} fill="none" stroke={color} strokeWidth={4} />
      <text x={0} y={9} textAnchor="middle" fontSize={25} fontWeight={700} fill={color} letterSpacing={1}>{label}</text>
    </g>
  );
}

export function AdaptivePathCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const planned = moduleId === 'newMethod';
  const observe = ease((progress - 0.28) / 0.58);
  const stampIn = clamp((progress - 0.86) / 0.1, 0, 1);
  const spots = [
    { x: 0.28, y: 0.38 },
    { x: 0.56, y: 0.3 },
    { x: 0.44, y: 0.64 },
    { x: 0.74, y: 0.58 },
  ];
  const idx = Math.min(spots.length - 1, Math.floor(observe * spots.length));
  const frac = observe * spots.length - idx;
  const prev = spots[Math.max(0, idx - 1)];
  const cur = spots[idx];
  const fx = prev.x + (cur.x - prev.x) * frac;
  const fy = prev.y + (cur.y - prev.y) * frac;
  const slideX = 120;
  const slideY = 54;
  const slideW = 424;
  const slideH = 150;
  const vp = 74;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 664 324" style={{ width: '100%', height: '100%', display: 'block' }}
        role="img"
        aria-label={planned
          ? '右图：玻片上的显微镜视野框依次停到四处可疑区域核查，最后签下病理报告'
          : '左图：整张玻片缩成一张缩略图，组织结构糊在一起，凭整体印象直接签报告'}>
        <g filter={planned ? undefined : 'url(#cover-blur)'}>
          <defs>
          <filter id="cover-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" /></filter>
        </defs>
        <SlideArt x={slideX} y={slideY} w={slideW} h={slideH} zoom={1} />
        </g>
        {!planned && <rect x={slideX} y={slideY} width={slideW} height={slideH} rx={5} fill="#ffffff" opacity={0.45} />}
        <ScopeArt x={58} y={150} s={0.85} />

        {planned ? (
          <g>
            {/* 视野框：位置随观察推进 */}
            <rect x={slideX + 14 + fx * (slideW - 44) - vp / 2} y={slideY + 8 + fy * (slideH - 20) - vp / 2 + 6}
              width={vp} height={vp} rx={3} fill="none" stroke="#f07e47" strokeWidth={3} />
            <path d={`M${slideX + 16 + fx * (slideW - 44) - vp / 2} ${slideY + 12 + fy * (slideH - 20)} h-8 M${slideX + 12 + fx * (slideW - 44) + vp / 2} ${slideY + 12 + fy * (slideH - 20)} h8`} stroke="#f07e47" strokeWidth={2} />
            {spots.map((s, i) => {
              const seen = observe * spots.length > i;
              if (!seen) return null;
              return (
                <g key={i}>
                  <rect x={126 + i * 98} y={216} width={88} height={34} rx={4} fill="#fffdf7" stroke={SL.glassEdge} strokeWidth={1.5}
                    transform={`rotate(${i % 2 ? 1.5 : -1.5} ${170 + i * 98} 233)`} />
                  <text x={170 + i * 98} y={238} textAnchor="middle" fontSize={17} fill={SL.ink}>记 {i + 1} · 结构</text>
                </g>
              );
            })}
            {stampIn < 0.9 && (
              <text x={332} y={300} textAnchor="middle" fontSize={18} fill={SL.inkSoft}>
                视野框停在第 {Math.min(spots.length, Math.floor(observe * spots.length) + 1)} 处 · 已记 {Math.round(observe * spots.length)} 条形态笔记
              </text>
            )}
            <Stamp x={470} y={150} label="诊断" color={SL.green} scale={stampIn} />
          </g>
        ) : (
          <g>
            <rect x={252} y={202} width={176} height={92} rx={4} fill="#fbfaf5" stroke={SL.glassEdge} strokeWidth={2} />
            <g opacity={0.55}>
              <SlideArt x={256} y={206} w={168} h={84} zoom={0.5} />
            </g>
            <text x={340} y={306} textAnchor="middle" fontSize={18} fill={SL.red}>整片缩成一张缩略图</text>
            <Stamp x={470} y={150} label="误诊" color={SL.red} scale={clamp((observe - 0.5) / 0.3, 0, 1)} />
          </g>
        )}
      </svg>

      <div style={{ position: 'absolute', left: 12, bottom: 2, right: 12, fontSize: 17, color: SL.inkSoft, textAlign: 'center' }}>
        {planned
          ? (stampIn > 0.5 ? '四处证据互相对照后才签报告' : '按可疑区域推进，每处只留一条形态笔记')
          : (observe > 0.6 ? '缩略图里组织结构糊在一起，只能凭整体印象猜' : '先把整片缩成一张小图')}
      </div>
    </div>
  );
}

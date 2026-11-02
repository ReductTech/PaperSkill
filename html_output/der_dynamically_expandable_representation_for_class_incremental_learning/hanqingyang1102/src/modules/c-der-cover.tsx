import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function Packet({ x, y, rot, label, tone, dim = 1, w = 66, h = 34 }: {
  x: number; y: number; rot: number; label: string; tone: 'old' | 'new'; dim?: number; w?: number; h?: number;
}) {
  const fill = tone === 'old' ? '#f3e6cf' : '#e6f2e3';
  const edge = tone === 'old' ? '#c9ab84' : '#9cc196';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={dim}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="5" fill={fill} stroke={edge} strokeWidth="2" />
      <path d={`M${-w / 2} ${-h / 2 + 12} h${w}`} stroke={edge} strokeWidth="1.4" opacity=".7" />
      <text x="0" y="7" textAnchor="middle" fontSize="14" fontWeight="700" fill="#5b4a36">{label}</text>
    </g>
  );
}

function Grain({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const lines = Array.from({ length: 4 }, (_, i) => y + 12 + i * ((h - 20) / 4));
  return <g opacity=".16" stroke="#5d3a22" strokeWidth="1">
    {lines.map((ly, i) => <line key={i} x1={x + 8} y1={ly} x2={x + w - 8} y2={ly + 1.5} />)}
  </g>;
}

export function DerCover({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Capture mode is used for thumbnails; show a representative mid-to-late frame there.
  const capture = typeof location !== 'undefined' && location.search.includes('capture=1');
  const move = capture ? 0.78 : reduced && !playing ? 1 : clamp((progress - 0.08) / 0.72, 0, 1);
  const planned = moduleId === 'newMethod';

  if (!planned) {
    const stack = move * 5;
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <svg viewBox="0 0 664 324" role="img" aria-label="旧方法：所有新药倒进同一个抽屉，旧药包被压到最底层，标签看不见了">
          <rect x="0" y="0" width="664" height="324" fill="#fbf7ef" />
          <ellipse cx="240" cy="300" rx="180" ry="12" fill="#8a6a46" opacity=".16" />
          <rect x="44" y="46" width="380" height="228" rx="12" fill="#8a5636" />
          <Grain x={44} y={46} w={380} h={228} />
          <rect x="60" y="62" width="348" height="150" rx="8" fill="#5f3a24" />
          {[[128, 130], [228, 136], [326, 130]].map(([px, py], i) => (
            <Packet key={i} x={px} y={py + stack * 14} rot={-6 + i * 5} label={['旧类 A', '旧类 B', '旧类 C'][i]}
              tone="old" dim={clamp(1 - stack * 0.22, 0.1, 1)} />
          ))}
          {Array.from({ length: Math.round(stack) }, (_, i) => (
            <Packet key={`n${i}`} x={118 + (i % 3) * 100} y={96 + Math.floor(i / 3) * 52} rot={-14 + i * 11}
              label={`新类 ${i + 1}`} tone="new" />
          ))}
          <rect x="60" y="62" width="348" height="150" rx="8" fill="none" stroke="#3f2516" strokeWidth="3" />
          <rect x="150" y="196" width="180" height="36" rx="8" fill="#a9704a" stroke="#5f3a24" strokeWidth="2" />
          <rect x="200" y="208" width="80" height="10" rx="5" fill="#e0b34e" />

          <text x="446" y="112" fontSize="26" fontWeight="800" fill="#c43f52">同一个抽屉</text>
          <text x="446" y="150" fontSize="21" fill="#5b6a7c">新旧共用一组参数</text>
          <text x="446" y="182" fontSize="21" fill="#5b6a7c">旧药的签被压住</text>
        </svg>
        <div style={{ position: 'absolute', left: 26, bottom: 10, fontSize: 24, fontWeight: 700, color: move < 1 ? '#68778f' : '#c43f52' }}>
          {move < 1 ? '新药不断倒进来……' : '旧方抓不准了'}
        </div>
      </div>
    );
  }

  const open = move;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 664 324" role="img" aria-label="本文方法：旧抽屉贴上封条不再改动，旁边新开一格抽屉，两屉的药材并排摊在柜台上，药师按整台判断">
        <rect x="0" y="0" width="664" height="324" fill="#fbf7ef" />
        <ellipse cx="230" cy="304" rx="186" ry="12" fill="#8a6a46" opacity=".16" />
        <rect x="36" y="40" width="372" height="142" rx="12" fill="#8a5636" />
        <Grain x={36} y={40} w={372} h={142} />
        <g transform={`translate(0 ${open * 6})`}>
          <rect x="52" y="56" width="156" height="110" rx="8" fill="#c48c60" stroke="#5f3a24" strokeWidth="2" />
          <rect x="64" y="68" width="132" height="66" rx="6" fill="#6b4229" />
          <Packet x={92} y={92} rot={-8} label="旧类 A" tone="old" w={54} h={30} />
          <Packet x={152} y={96} rot={7} label="旧类 B" tone="old" w={54} h={30} />
          <rect x="110" y="146" width="40" height="9" rx="4" fill="#e0b34e" />
          <g opacity={clamp(open * 1.6, 0, 1)}>
            <rect x="86" y="134" width="88" height="28" rx="4" fill="none" stroke="#c43f52" strokeWidth="3"
              transform="rotate(-10 130 148)" />
            <text x="130" y="153" textAnchor="middle" fontSize="16" fontWeight="800" fill="#c43f52"
              transform="rotate(-10 130 148)">封存</text>
          </g>
        </g>
        <g transform={`translate(${open * 8} ${open * 12})`}>
          <rect x="226" y="56" width="156" height="110" rx="8" fill="#c48c60" stroke="#5f3a24" strokeWidth="2" />
          <rect x="238" y="68" width="132" height="66" rx="6" fill="#6b4229" />
          <Packet x={264} y={92} rot={9} label="新类 A" tone="new" w={54} h={30} />
          <Packet x={326} y={96} rot={-6} label="新类 B" tone="new" w={54} h={30} />
          <rect x="284" y="146" width="40" height="9" rx="4" fill="#e0b34e" />
        </g>

        <rect x="36" y="220" width="372" height="10" rx="4" fill="#7d4f31" />
        {['旧类 A', '旧类 B', '新类 A', '新类 B'].map((label, i) => (
          <g key={label} transform={`translate(${74 + i * 88} 250)`} opacity={clamp((open - 0.25 - i * 0.08) * 3, 0, 1)}>
            <rect x="-38" y="-19" width="76" height="38" rx="5" fill="#fffaf0" stroke="#cbb797" strokeWidth="2" />
            <text x="0" y="7" textAnchor="middle" fontSize="17" fontWeight="700" fill="#5b4a36">{label}</text>
          </g>
        ))}

        <g transform="translate(470 0)">
          <circle cx="70" cy="128" r="24" fill="#e8c9a4" />
          <path d="M46 128 a24 22 0 0 1 48 0" fill="#3f4f5e" />
          <rect x="42" y="152" width="56" height="78" rx="16" fill="#3f5a4c" />
          <rect x="14" y="196" width="112" height="10" rx="5" fill="#c9a87e" />
          <text x="70" y="256" textAnchor="middle" fontSize="21" fontWeight="700" fill="#27446e">药师看整台</text>
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 26, bottom: 10, fontSize: 24, fontWeight: 700, color: move < 1 ? '#68778f' : '#228d5c' }}>
        {move < 1 ? '封旧屉、开新屉……' : '旧方照抓，新方也认'}
      </div>
    </div>
  );
}

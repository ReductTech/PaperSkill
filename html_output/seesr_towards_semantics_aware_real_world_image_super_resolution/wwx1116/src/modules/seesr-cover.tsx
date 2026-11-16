import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

/* ---------------------------------------------------------------------------
   SeeSR · shared drawing kit for the scroll-restoration studio.
   Imported read-only by every other widget (`import { ... } from './seesr-cover'`).
   Palette follows contract.md §5 semantic roles.
--------------------------------------------------------------------------- */

export const C = {
  paper: '#f7f2e6',
  paper2: '#efe6d2',
  silk: '#e3d6bb',
  wood: '#b98a52',
  woodDark: '#8a6238',
  sea: '#8fb2c6',
  seaDeep: '#5f849c',
  cliff: '#a39070',
  cliffDark: '#7c6a4e',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  white: '#ffffff',
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const pct = (v: number) => `${Math.round(v * 100)}%`;

export type Interpretation = 'blur' | 'boat' | 'bird' | 'plane';

/* --- candidate interpretations, drawn around the origin (170 x 110 box) --- */

export function BoatGlyph({ detail = 1 }: { detail?: number }) {
  const d = clamp(detail, 0, 1);
  return (
    <g>
      <path d="M-88 14 Q0 44 88 14 L74 32 Q0 58 -74 32 Z" fill="#fbf7ec" stroke="#b9ab8f" strokeWidth="2" />
      <path d="M-62 -6 H58 L50 14 H-56 Z" fill="#f4efe2" stroke="#b9ab8f" strokeWidth="2" opacity={0.55 + 0.45 * d} />
      <rect x="-40" y="-30" width="80" height="26" rx="5" fill="#fdfbf4" stroke="#b9ab8f" strokeWidth="2" opacity={0.3 + 0.7 * d} />
      {[-30, -8, 14].map((x) => (
        <rect key={x} x={x} y={-24} width="14" height="12" rx="2" fill={C.seaDeep} opacity={0.75 * d} />
      ))}
      <path d="M-2 -52 V-30" stroke="#9c8f75" strokeWidth="3" opacity={d} />
      <path d="M-52 -8 V10 M52 -8 V10" stroke="#9c8f75" strokeWidth="2.5" opacity={d} />
      <path d="M-20 22 L-14 30 M0 26 L0 34 M20 22 L14 30" stroke="#b9ab8f" strokeWidth="2" opacity={d} />
    </g>
  );
}

export function BirdGlyph() {
  return (
    <g>
      <path d="M-84 10 Q-52 -30 -6 -8 L-2 6 Q-46 16 -84 10 Z" fill="#ece7d8" stroke="#b3a58a" strokeWidth="2.5" />
      <path d="M84 10 Q52 -30 6 -8 L2 6 Q46 16 84 10 Z" fill="#ece7d8" stroke="#b3a58a" strokeWidth="2.5" />
      <path d="M-8 -6 Q6 -18 26 2 Q10 16 -4 10 Z" fill="#f6f2e6" stroke="#b3a58a" strokeWidth="2" />
      <path d="M26 2 L48 8 L26 12 Z" fill="#d9a05b" />
      <path d="M-2 12 L-8 30 M8 12 L14 30" stroke="#b3a58a" strokeWidth="2.5" />
    </g>
  );
}

export function PlaneGlyph() {
  return (
    <g>
      <path d="M-80 6 Q-30 -14 40 0 Q70 6 82 12 Q40 24 -30 18 Z" fill="#f2f0e6" stroke="#b3a58a" strokeWidth="2.5" />
      <path d="M-6 -2 L28 -44 L44 -42 L20 0 Z" fill="#e9e5d6" stroke="#b3a58a" strokeWidth="2" />
      <path d="M-30 12 L-12 40 L4 38 L-6 12 Z" fill="#e9e5d6" stroke="#b3a58a" strokeWidth="2" />
      <path d="M36 -6 L52 -26 L62 -24 L50 0 Z" fill="#dcd7c6" stroke="#b3a58a" strokeWidth="2" />
      <circle cx="6" cy="-2" r="4" fill={C.seaDeep} />
    </g>
  );
}

function BlurBlob({ strength = 1 }: { strength?: number }) {
  return (
    <g opacity={clamp(strength, 0, 1)}>
      <ellipse cx="-34" cy="8" rx="44" ry="20" fill="#dfe4e0" opacity="0.85" />
      <ellipse cx="26" cy="12" rx="40" ry="18" fill="#e6e9e3" opacity="0.8" />
      <ellipse cx="0" cy="-6" rx="34" ry="16" fill="#eef0ea" opacity="0.75" />
      <ellipse cx="-6" cy="4" rx="16" ry="8" fill="#c9cfd0" opacity="0.6" />
    </g>
  );
}

/* --- the damaged fragment: sea, cliff, lighthouse and the ambiguous region --- */

export function SeaCliffScene({
  interpretation,
  damage = 0.85,
  detail = 1,
  lensAt = null,
  showLighthouse = true,
  ghost = null,
}: {
  interpretation: Interpretation;
  damage?: number;
  detail?: number;
  lensAt?: { x: number; y: number } | null;
  showLighthouse?: boolean;
  ghost?: Interpretation | null;
}) {
  const d = clamp(damage, 0, 1);
  const strokeOpacity = clamp(1 - 1.05 * d, 0.06, 1);
  return (
    <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice" role="img"
      aria-label="修复台上的古画残卷：海面、崖壁与一处看不清的船形色块">
      <defs>
        <linearGradient id="seesr-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9dbfd1" />
          <stop offset="1" stopColor="#5f849c" />
        </linearGradient>
        <filter id="seesr-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={0.8 + 5 * d} />
        </filter>
      </defs>
      <rect x="0" y="0" width="600" height="420" fill="url(#seesr-sea)" />
      {[120, 168, 214, 262, 318].map((y, i) => (
        <path key={y} d={`M0 ${y} Q150 ${y - 8 - i * 2} 300 ${y + 3} T600 ${y - 4}`}
          fill="none" stroke="#cfe0e8" strokeWidth="2" opacity={0.5 * strokeOpacity} />
      ))}
      <path d="M600 420 H300 L392 300 L470 250 L520 262 L600 214 Z" fill={C.cliff} />
      <path d="M600 420 H360 L430 322 L512 300 L600 286 Z" fill={C.cliffDark} opacity="0.75" />
      <path d="M300 420 L392 300 L430 322 L360 420 Z" fill="#8d7b5d" opacity="0.55" />
      {showLighthouse ? (
        <g transform="translate(516 196)" opacity={0.55 + 0.45 * strokeOpacity}>
          <rect x="-9" y="-26" width="18" height="34" rx="3" fill="#f6f2e6" stroke="#b3a58a" strokeWidth="2" />
          <rect x="-13" y="-36" width="26" height="12" rx="3" fill="#e8e4d8" stroke="#b3a58a" strokeWidth="2" />
          <path d="M-13 -30 L-24 -34 M13 -30 L24 -34" stroke={C.orange} strokeWidth="2.5" opacity="0.7" />
        </g>
      ) : null}
      <g transform="translate(206 258)">
        <g filter={interpretation === 'blur' ? 'url(#seesr-soft)' : undefined}>
          {interpretation === 'blur' ? <BlurBlob strength={0.4 + 0.6 * d} /> : null}
        </g>
        {interpretation === 'boat' ? <BoatGlyph detail={detail} /> : null}
        {interpretation === 'bird' ? <BirdGlyph /> : null}
        {interpretation === 'plane' ? <PlaneGlyph /> : null}
        {ghost === 'bird' ? <g opacity="0.42"><BirdGlyph /></g> : null}
        {ghost === 'plane' ? <g opacity="0.42"><PlaneGlyph /></g> : null}
      </g>
      {lensAt ? (
        <g pointerEvents="none">
          <circle cx={lensAt.x} cy={lensAt.y} r="58" fill="rgba(255,255,255,0.10)" stroke={C.woodDark} strokeWidth="6" />
          <circle cx={lensAt.x} cy={lensAt.y} r="58" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
          <path d={`M${lensAt.x + 40} ${lensAt.y + 42} L${lensAt.x + 74} ${lensAt.y + 78}`}
            stroke={C.woodDark} strokeWidth="10" strokeLinecap="round" />
        </g>
      ) : null}
      <rect x="0" y="0" width="600" height="420" fill="none" stroke="#cbb994" strokeWidth="8" opacity="0.35" />
    </svg>
  );
}

/* --- small studio vignette used on explanation / boundary pages --- */

export function StudioVignette({ mode = 'review' }: { mode?: 'review' | 'underdrawing' | 'magnify' }) {
  return (
    <svg viewBox="0 0 460 266" role="img" aria-label="修复工作室一角">
      <rect width="460" height="266" fill={C.paper2} />
      <rect y="206" width="460" height="60" fill={C.wood} opacity="0.55" />
      <rect y="206" width="460" height="8" fill={C.woodDark} opacity="0.5" />
      {mode === 'review' ? (
        <g>
          <rect x="34" y="42" width="150" height="120" fill="#ffffff" stroke={C.woodDark} strokeWidth="6" />
          <rect x="52" y="64" width="114" height="80" fill="#e6eef2" />
          <path d="M52 118 L96 96 L128 112 L166 88 V144 H52 Z" fill={C.cliff} opacity="0.8" />
          <rect x="176" y="42" width="150" height="120" fill="#ffffff" stroke={C.green} strokeWidth="6" />
          <rect x="194" y="64" width="114" height="80" fill="#dfeaf0" />
          <path d="M194 118 L238 96 L270 112 L308 88 V144 H194 Z" fill={C.cliff} opacity="0.8" />
          <g transform="translate(250 116) scale(.34)"><BoatGlyph detail={1} /></g>
          <rect x="346" y="40" width="80" height="124" rx="6" fill="#ffffff" stroke={C.woodDark} strokeWidth="4" />
          <path d="M360 64 H414 M360 84 H414 M360 104 H400" stroke={C.muted} strokeWidth="3" />
          <path d="M360 128 H392" stroke={C.orange} strokeWidth="5" />
        </g>
      ) : mode === 'underdrawing' ? (
        <g>
          <rect x="90" y="34" width="280" height="150" fill={C.silk} stroke={C.woodDark} strokeWidth="6" />
          <path d="M110 150 Q190 120 250 148 T350 132" fill="none" stroke={C.seaDeep} strokeWidth="3" opacity="0.45" />
          <path d="M250 150 L330 110 L350 168 L270 168 Z" fill={C.cliff} opacity="0.25" />
          <g transform="translate(190 128) scale(.42)" opacity="0.35"><BoatGlyph detail={0.2} /></g>
          <path d="M120 60 L150 48" stroke={C.woodDark} strokeWidth="4" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <rect x="120" y="52" width="200" height="120" fill={C.silk} stroke={C.woodDark} strokeWidth="6" />
          <g transform="translate(220 116) scale(.5)" opacity="0.85"><BoatGlyph detail={0.6} /></g>
          <circle cx="250" cy="112" r="46" fill="rgba(255,255,255,0.14)" stroke={C.woodDark} strokeWidth="5" />
          <path d="M282 146 L306 172" stroke={C.woodDark} strokeWidth="9" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/* --- cover: two synchronized studio outcomes on the shared clock --- */

export function SeesrCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const p = clamp(progress, 0, 1);
  const planned = moduleId === 'newMethod';
  const detail = clamp((p - 0.55) / 0.35, 0, 1);
  const interpretation: Interpretation = planned
    ? (p > 0.5 ? 'boat' : 'blur')
    : 'blur';
  const ghost: Interpretation | null = !planned && p > 0.52 ? 'bird' : null;
  const slips = ['船', '海', '崖', '灯塔'];
  return (
    <div className="seesr-cover">
      <div className="seesr-cover-art">
        <SeaCliffScene interpretation={interpretation} damage={0.85} detail={planned ? Math.max(0.15, detail) : 1} ghost={ghost} />
      </div>
      {planned ? (
        <div className="seesr-cover-slips">
          {slips.map((s, i) => (
            <span key={s} className={`seesr-cover-slip ${p > 0.18 + i * 0.1 ? 'is-on' : ''}`}>{s}</span>
          ))}
        </div>
      ) : (
        <div className="seesr-cover-slips">
          <span className="seesr-cover-slip is-empty">清单空白</span>
        </div>
      )}
      <div className={`seesr-cover-result ${planned ? 'is-good' : 'is-bad'}`}>
        {planned
          ? (p > 0.9 ? '先认定，再补细节' : '照着清单补出的船体、窗与栏杆……')
          : (p > 0.9 ? '没有名字，只能靠先验猜' : '照糊图直接补绘……')}
      </div>
    </div>
  );
}

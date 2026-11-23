import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { CameraGlyph, clamp } from './photo-kit';

export function HeroNewSequence() {
  const { progress } = useCoverPlayback();
  const p = clamp(progress, 0, 1);
  const x = 112 + p * 350;
  const row = Math.floor(p * 4);
  const y = 94 + row * 35;
  return <div className="photo-cover">
    <svg viewBox="0 0 640 300" role="img" aria-label="低成本相机逐行拍摄重叠画面，随后拼接并恢复为整张切片">
      <rect width="640" height="300" fill="#eef5ee" />
      <rect x="83" y="58" width="470" height="180" rx="20" fill="#fffdf7" stroke="#b8c9a7" strokeWidth="4" />
      <path d="M121 193 C155 103 222 94 284 140 C317 165 337 200 406 181 C456 166 475 97 527 113" fill="#b88cad" opacity={.26 + p * .55} />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={112 + (i % 4) * 112} y={88 + Math.floor(i / 4) * 74} width="124" height="83" rx="8" fill="none" stroke={i / 8 <= p ? '#228d5c' : '#d7deea'} strokeWidth="4" opacity={.9} />)}
      <g transform={`translate(${x} ${y}) scale(.43)`}><CameraGlyph /></g>
      <g transform="translate(143 262)">
        <rect width="130" height="21" rx="10" fill="#fffdf7" />
        <rect width={Math.round(25 + p * 95)} height="21" rx="10" fill="#228d5c" />
      </g>
      <g transform="translate(446 256)">
        <circle r="27" fill={p > .8 ? '#e7f5eb' : '#fffdf7'} stroke={p > .8 ? '#228d5c' : '#9fb2bf'} strokeWidth="4" />
        <path d="M-12 4 L-3 13 L15 -11" fill="none" stroke={p > .8 ? '#228d5c' : '#aebdc7'} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
    <span className="photo-cover-mini-label is-progress">恢复进度</span>
    <div className={`photo-cover-outcome ${p > .72 ? 'is-good' : ''}`}>{p < .55 ? '逐行拍摄，保留相邻画面重叠' : p < .8 ? '停顿帧去重后递归拼接' : '真实配对恢复后形成 WSI'}</div>
  </div>;
}

import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { clamp } from './glc-kit';

const tilePalette = ['#d8e8e5', '#b9d1c8', '#7ca697', '#406f61', '#e6d7b6', '#d98657'];

export function GlcCover({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const planned = moduleId === 'newMethod';
  const settle = clamp((progress - .08) / .72, 0, 1);
  const tileCount = planned ? 42 : 70;
  const cols = 14;
  const rows = 8;
  const tiles = [];
  for (let index = 0; index < tileCount; index += 1) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const semanticBand = row > 3 ? 3 + (col % 2) : row === 3 ? 2 : row === 2 ? 1 : 0;
    const pixelBand = (row + col * 2) % tilePalette.length;
    const colorIndex = planned ? semanticBand : pixelBand;
    const stagger = clamp(settle * 1.6 - index / tileCount * .6, 0, 1);
    const startX = planned ? 270 + (col - cols / 2) * 8 : 340 + (index % 5) * 12;
    const targetX = 76 + col * 37;
    const targetY = 64 + row * 22;
    tiles.push(<rect key={index}
      x={targetX + (1 - stagger) * (startX - targetX) * .45}
      y={targetY - (1 - stagger) * 64}
      width={planned ? 34 : 34 - (row > 4 ? 3 : 0)}
      height={planned ? 19 : 18}
      rx={planned ? 4 : 1.5}
      fill={tilePalette[colorIndex]}
      opacity={.35 + stagger * .65}
      transform={`rotate(${planned ? 0 : (index % 3 - 1) * 2.2} ${targetX + 17} ${targetY + 9})`} />);
  }
  return <div className="glc-cover-widget" role="img"
    aria-label={planned ? '语义马赛克先保留结构，再由生成式修补补全纹理' : '像素马赛克在有限预算下逐步丢失结构'}>
    <svg viewBox="0 0 660 300">
      <rect x="1" y="1" width="658" height="298" rx="18" fill="#fbfcf8" stroke={planned ? '#cce5d8' : '#efd6d9'} strokeWidth="2" />
      <path d="M42 237 H620" stroke="#aebba9" strokeWidth="8" strokeLinecap="round" />
      <path d="M65 237 V80 M598 237 V80" stroke="#c8b293" strokeWidth="7" strokeLinecap="round" />
      <rect x="53" y="56" width="558" height="188" rx="8" fill="#f4f2e9" stroke="#8c9f8b" strokeWidth="3" />
      {tiles}
      {planned ? <g opacity={clamp((progress - .55) / .35, 0, 1)}>
        <path d="M150 212 C222 165 300 205 370 158 C435 115 504 170 548 129"
          fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity=".5" />
        {[0, 1, 2, 3, 4].map(index => <circle key={index}
          cx={220 + index * 54} cy={160 + (index % 2) * 28} r={3 + index % 2}
          fill="#228d5c" opacity={.45 + index * .1} />)}
      </g> : <g opacity={clamp(.3 + (1 - settle) * .7, 0, 1)}>
        <path d="M98 153 L144 122 L201 151 L252 95 L309 153" fill="none" stroke="#c43f52" strokeWidth="5" strokeDasharray="8 10" />
        <path d="M420 135 L462 111 L509 144" fill="none" stroke="#c43f52" strokeWidth="5" strokeDasharray="8 10" />
      </g>}
    </svg>
    <span className={`glc-cover-svg-label is-primary ${planned ? 'is-green' : 'is-red'}`}>
      {planned ? '语义保留 + 生成补全' : '像素质感先被压扁'}
    </span>
    <span className="glc-cover-svg-label is-secondary">
      <i aria-hidden="true" />{planned ? '有限语义色卡' : '有限像素碎片'}
    </span>
  </div>;
}

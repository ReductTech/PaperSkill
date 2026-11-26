import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, btn, green, red } from './ui';

export function PhotoTiles(_props: WidgetProps) {
  const [block, setBlock] = useState(5);
  const hit = block === 5 || block === 4 || block === 6;
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="点中的照片分块会按是否含遮罩像素变色">
    <Photo covered={3} />
    {Array.from({ length: 12 }).map((_, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      if (index !== block) return null;
      return <rect key={index} x={108 + col * 156} y={78 + row * 112} width="140" height="96" rx="8" fill={hit ? 'rgba(196,63,82,.35)' : 'rgba(34,141,92,.28)'} stroke="#27446e" strokeWidth="5" />;
    })}
  </svg>}>
    <H>前置：视频先切成小块</H>
    <T>3D-VAE 把一段视频编成词元。点一块看看整块算不算被遮住。</T>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" style={btn(block === 5)} onClick={() => setBlock(5)}>人在的那块</button>
      <button type="button" style={btn(block === 0)} onClick={() => setBlock(0)}>天空那块</button>
    </div>
    <Big color={hit ? red : green}>{hit ? '块内有遮罩像素，整块词元都算遮罩。' : '这块没有遮罩像素，词元保持干净。'}</Big>
    <T>补充材料的规则：<SymbolHint meaning="分块内部的一个像素遮罩，1 表示被挡住">m</SymbolHint> 有一个为 1，词元就为 1。4×3 格是示意，不是 VAE 步长。</T>
  </Page>;
}

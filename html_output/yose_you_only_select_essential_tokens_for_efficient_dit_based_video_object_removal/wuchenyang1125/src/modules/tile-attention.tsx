import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, blue, btn } from './ui';

export function TileAttention(_props: WidgetProps) {
  const [query, setQuery] = useState(5);
  const qx = 178 + (query % 4) * 156;
  const qy = 126 + Math.floor(query / 4) * 112;
  const lines = [];
  for (let index = 0; index < 12; index += 1) {
    if (index === query) continue;
    lines.push(<line key={index} x1={qx} y1={qy} x2={178 + (index % 4) * 156} y2={126 + Math.floor(index / 4) * 112} stroke="#27446e" strokeWidth="2" opacity="0.4" />);
  }
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="从一格看向照片上的每一格">
    <Photo covered={0} />
    {lines}
    <circle cx={qx} cy={qy} r="11" fill="#f07e47" />
  </svg>}>
    <H>前置：DiT 每一格都要互看</H>
    <T>橙点是当前词元，蓝线是它的目光。换一格，目光仍然铺满整张照片。</T>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" style={btn(query === 5)} onClick={() => setQuery(5)}>从人身上看</button>
      <button type="button" style={btn(query === 0)} onClick={() => setQuery(0)}>从天空看</button>
    </div>
    <Big color={blue}>两种起点都连向其余 11 格。</Big>
    <T>这是论文说的全词元自注意力。MiniMax Remover 用无交叉注意力的 DiT。YOSE 后面会避开这种全量计算。</T>
  </Page>;
}

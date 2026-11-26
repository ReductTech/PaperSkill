import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, btn, green, red } from './ui';

export function LimitRepair(_props: WidgetProps) {
  const [ratio, setRatio] = useState(80);
  const [fuse, setFuse] = useState(false);
  const covered = ratio === 80 ? 10 : ratio === 40 ? 5 : 2;
  const fast = ratio <= 20;
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="大遮罩时加速消失，融合可以修好接缝">
    <Photo covered={covered} scan={!fast} />
    {!fuse && ratio >= 40 ? <rect x="250" y="180" width="16" height="220" fill="#c43f52" /> : null}
  </svg>}>
    <H>{fast ? '回到常见的小遮罩' : '遮罩太大时不再更快'}</H>
    <T>80% 时 VAE 分块盖住全部词元。ROSE 没有固定遮罩，本文没有直接套用。</T>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" style={btn(ratio === 20)} onClick={() => setRatio(20)}>20%</button>
      <button type="button" style={btn(ratio === 40)} onClick={() => setRatio(40)}>40%</button>
      <button type="button" style={btn(ratio === 80)} onClick={() => setRatio(80)}>80%</button>
      <button type="button" style={btn(fuse)} onClick={() => { setRatio(20); setFuse(true); }}>缩回 20% 并打开融合</button>
    </div>
    <Big color={fast && fuse ? green : red}>{fast ? (fuse ? '小遮罩，接缝也对齐了。' : '小遮罩可以加速，接缝还没处理。') : '这一档耗时回到全量。'}</Big>
    <T>180 例中约 75% 的波动在 ±5% 内；遮罩更大时大约到 ±25%。</T>
  </Page>;
}

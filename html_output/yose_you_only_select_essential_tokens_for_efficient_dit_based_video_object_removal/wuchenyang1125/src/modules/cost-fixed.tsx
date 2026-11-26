import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, btn, red } from './ui';

export function CostFixed(_props: WidgetProps) {
  const [small, setSmall] = useState(true);
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="小贴纸和大贴纸旁边的计算柱一样高">
    <Photo covered={small ? 2 : 10} scan />
  </svg>}>
    <H>遮罩变了，计算柱不变</H>
    <T>全词元 DiT 不管贴纸大小，都看完整段视频。这一页只说明问题。</T>
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" style={btn(small)} onClick={() => setSmall(true)}>常见小遮罩</button>
      <button type="button" style={btn(!small)} onClick={() => setSmall(false)}>少见大遮罩</button>
    </div>
    <Big color={red}>{small ? '示意约 20%，计算仍然满额。' : '示意约 80%，计算仍然满额。'}</Big>
  </Page>;
}

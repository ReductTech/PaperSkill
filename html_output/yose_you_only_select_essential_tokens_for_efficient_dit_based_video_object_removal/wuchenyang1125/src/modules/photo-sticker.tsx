import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, red } from './ui';

export function PhotoSticker({ chapterId }: WidgetProps) {
  const [ratio, setRatio] = useState(18);
  const covered = Math.max(1, Math.min(12, Math.round(ratio / 100 * 12)));
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="红框扫过整张生活照，橙色贴纸只盖住一部分">
    <Photo covered={covered} scan />
  </svg>}>
    <H>红框始终扫过整张照片</H>
    <T>物体去除只该改掉被挡住的地方。拖动贴纸，红框不会缩小。</T>
    <label style={{ margin: 0, fontSize: 28 }}>示意面积 {ratio}%
      <input data-chapter={chapterId} type="range" min={8} max={80} value={ratio} onChange={event => setRatio(Number(event.target.value))} style={{ width: '100%', margin: 0 }} />
    </label>
    <Big color={red}>仍处理 12/12 格，贴纸盖住 {covered} 格。</Big>
    <T>格数是示意。论文统计是：YouTube-VOS 和 DAVIS 上约 70% 的例子遮罩不到 20%。</T>
  </Page>;
}

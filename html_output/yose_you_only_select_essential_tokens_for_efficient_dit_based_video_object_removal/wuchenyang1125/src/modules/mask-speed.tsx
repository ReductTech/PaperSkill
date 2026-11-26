import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, btn, green } from './ui';

const points = [
  { id: '5%', ratio: 0.05, covered: 1, speed: '3.3 倍', time: 0.3, note: '相对无交叉注意力的全词元 DiT' },
  { id: '20%', ratio: 0.2, covered: 2, speed: '2.5 倍', time: 0.4, note: '图 2：480p 下大约 25 FPS' },
  { id: '80%', ratio: 0.8, covered: 10, speed: '回到 1 倍', time: 1, note: 'VAE 分块后计算盖住全部词元' },
];

export function MaskSpeed(_props: WidgetProps) {
  const [index, setIndex] = useState(1);
  const point = points[index];
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="三个实测遮罩比例对应的相对耗时">
    <Photo covered={point.covered} />
    <rect x="690" y="430" width="42" height="70" fill="#c43f52" />
    <rect x="748" y={500 - 70 * point.time} width="42" height={70 * point.time} fill="#228d5c" />
  </svg>}>
    <H>耗时只在三个测点上报告</H>
    <T>红柱是全量 DiT，绿柱是 YOSE 的相对耗时，等于 1 除以论文给出的加速比。中间比例没有逐点实测。</T>
    <div style={{ display: 'flex', gap: 8 }}>
      {points.map((item, itemIndex) => <button key={item.id} type="button" style={btn(index === itemIndex)} onClick={() => setIndex(itemIndex)}>{item.id}</button>)}
    </div>
    <Big color={green}>{point.id}：{point.speed}</Big>
    <T>{point.note}。主项随 <SymbolHint meaning="遮罩词元占全部词元的比例">γ</SymbolHint> 变化，论文公式后面还有省略号。</T>
  </Page>;
}

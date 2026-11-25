import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, T, btn, green, red } from './ui';

function Stack({ count, back }: { count: number; back: boolean }) {
  return <svg viewBox="0 0 420 250" width="100%" height="180" role="img" aria-label={back ? '词元已经放回照片' : '照片上留下空位'}>
    <rect width="420" height="250" fill="#f5f8f0" />
    <rect x="16" y="16" width="388" height="210" rx="12" fill="#fffdf8" stroke="#92400e" strokeWidth="3" />
    <circle cx="210" cy="78" r="16" fill="#e5ae78" />
    <path d="M24 150 Q120 110 210 146 T404 130 V180 H24 Z" fill="#76906a" />
    {Array.from({ length: count }).map((_, index) => <rect key={index} x={28 + (index % 6) * 62} y={168} width="52" height="28" rx="5" fill={back ? '#228d5c' : 'transparent'} stroke={back ? '#228d5c' : '#f07e47'} strokeWidth="3" />)}
  </svg>;
}

export function BviTray(_props: WidgetProps) {
  const [left, setLeft] = useState(2);
  const [right, setRight] = useState(5);
  const [back, setBack] = useState(false);
  const longest = Math.max(left, right);
  return <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <H>{back ? '用反向索引把格子放回原位' : '正向索引只把遮罩格拎上托盘'}</H>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: 12, minHeight: 0 }}>
      <Stack count={left} back={back} />
      <Stack count={right} back={back} />
      <svg viewBox="0 0 460 180" width="100%" height="180" role="img" aria-label="按本批最长遮罩补齐的托盘">
        <rect width="460" height="180" rx="12" fill="#e7d3b0" stroke="#92400e" strokeWidth="4" />
        {[left, right].map((count, row) => Array.from({ length: longest }).map((_, index) => <rect key={`${row}-${index}`} x={16 + index * 72} y={18 + row * 78} width="62" height="58" rx="6" fill={back ? '#fff' : index < count ? '#f07e47' : '#fff'} stroke={index < count ? '#228d5c' : '#c43f52'} strokeWidth="3" />))}
      </svg>
    </div>
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ margin: 0, fontSize: 28 }}>左图 {left}
        <input type="range" min={1} max={6} value={left} onChange={event => setLeft(Number(event.target.value))} />
      </label>
      <label style={{ margin: 0, fontSize: 28 }}>右图 {right}
        <input type="range" min={1} max={6} value={right} onChange={event => setRight(Number(event.target.value))} />
      </label>
      <button type="button" style={btn(!back)} onClick={() => setBack(false)}>抽出</button>
      <button type="button" style={btn(back)} onClick={() => setBack(true)}>放回</button>
    </div>
    <Big color={left === right ? green : red}>{left === right ? `两张都是 ${left} 格，托盘没有空白。` : `托盘长度为 ${longest}。红框白格只是补齐，不是真实词元。`}</Big>
    <T>硬索引会挡住梯度，也不能把不同长度放进同一批。BVI 改用 grid sample，并把每张补到本批最长。</T>
  </div>;
}

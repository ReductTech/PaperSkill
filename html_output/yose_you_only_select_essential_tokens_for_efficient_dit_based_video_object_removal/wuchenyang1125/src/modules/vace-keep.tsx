import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Big, H, Page, T, btn, green, red } from './ui';

export function VaceKeep(_props: WidgetProps) {
  const [yose, setYose] = useState(true);
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="打开 YOSE 后背景不再被改成贴纸形状">
    <rect width="900" height="622" fill="#f5f8f0" />
    <rect x="70" y="48" width="740" height="500" rx="16" fill="#fffdf8" stroke="#92400e" strokeWidth="4" />
    <rect x="96" y="74" width="688" height="220" fill="#d5eee4" />
    <path d="M96 260 Q280 180 460 250 T784 230 V340 H96 Z" fill="#76906a" />
    <circle cx="250" cy="300" r="28" fill="#e5ae78" />
    {yose ? null : <ellipse cx="560" cy="210" rx="90" ry="54" fill="#f07e47" opacity="0.85" />}
    <text x="430" y="470" textAnchor="middle" fill="#21324a" fontSize="28">{yose ? '背景保持原样' : '背景多出一块贴纸形状'}</text>
  </svg>}>
    <H>{yose ? '计算停在遮罩内' : '原 VACE 会改到背景'}</H>
    <T>图是示意图。论文指出原 VACE 会出现遮罩形状的多余物体，并改动背景。</T>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" style={btn(!yose)} onClick={() => setYose(false)}>原 VACE</button>
      <button type="button" style={btn(yose)} onClick={() => setYose(true)}>YOSE（VACE）</button>
    </div>
    <Big color={yose ? green : red}>{yose ? '去除成功率 97.8%' : '去除成功率 62.2%'}</Big>
    <T>FPS 从 0.308 到 0.417。控制分支本身不能被 YOSE 加速，所以这里的加速有限。YouTube-VOS 背景 PSNR 从 23.72 到 29.19。</T>
  </Page>;
}

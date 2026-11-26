import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Big, H, Page, Photo, T, green } from './ui';

const mask = [118, 168, 124];
const residual = [186, 96, 78];

export function SwatchSim(_props: WidgetProps) {
  const [gain, setGain] = useState(55);
  const ratio = gain / 100;
  const mixed = mask.map((value, index) => Math.round(ratio * value + (1 - ratio) * residual[index]));
  const color = `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="修复者拿着一块由原图和残差混成的色样">
    <Photo covered={3} />
    <rect x="620" y="300" width="150" height="110" rx="12" fill={color} stroke="#7c3aed" strokeWidth="6" />
    <circle cx="400" cy="208" r="22" fill={color} />
  </svg>}>
    <H>用色样代替整张重算</H>
    <T>未遮罩区域不进入 DiT。色样混合原图潜变量和噪声残差，颜色只是公式示意。</T>
    <label style={{ margin: 0, fontSize: 28 }}><SymbolHint meaning="第 i 个 DiT block 的混合系数，训练时学习">G</SymbolHint> = {ratio.toFixed(2)}
      <input type="range" min={0} max={100} value={gain} onChange={event => setGain(Number(event.target.value))} style={{ width: '100%', margin: 0 }} />
    </label>
    <Big color={green}>{gain === 0 ? '只用残差。消融里这样会掉质量。' : gain === 100 ? '只用遮罩视频。消融里这样也会掉质量。' : '两项都在。完整设置才同时使用它们。'}</Big>
    <T><SymbolHint meaning="噪声潜变量减遮罩视频潜变量">Res</SymbolHint> = Lat_Nis − Lat_mask。DAVIS 上只用一项时 PSNR 约 27.6，两项都用是 29.5855。</T>
  </Page>;
}

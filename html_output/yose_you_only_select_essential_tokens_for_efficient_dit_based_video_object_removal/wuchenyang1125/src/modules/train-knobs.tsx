import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { Big, H, Page, T, btn, green, red } from './ui';

const errors = [0.4, 1.2, 0.2, 0.8, 1.6, 0.3];
const mask = [0, 1, 0, 1, 1, 0];

export function TrainKnobs(_props: WidgetProps) {
  const [inside, setInside] = useState(true);
  const weights = inside ? mask : errors.map(() => 1);
  const denom = weights.reduce((sum, value) => sum + value, 0);
  const loss = errors.reduce((sum, value, index) => sum + weights[index] * value * value, 0) / denom;
  return <Page art={<svg viewBox="0 0 900 622" width="100%" height="100%" role="img" aria-label="大模型被锁住，只留三个小旋钮">
    <rect width="900" height="622" fill="#f5f8f0" />
    <rect x="80" y="80" width="520" height="420" rx="18" fill="#fffdf8" stroke="#92400e" strokeWidth="4" />
    <rect x="120" y="130" width="440" height="250" rx="12" fill="#d7deea" />
    <text x="340" y="270" textAnchor="middle" fill="#21324a" fontSize="34">DiT 权重锁住</text>
    <rect x="640" y="140" width="150" height="70" rx="12" fill="#7c3aed" />
    <rect x="640" y="240" width="150" height="70" rx="12" fill="#27446e" />
    <rect x="640" y="340" width="150" height="70" rx="12" fill="#f07e47" />
    <text x="715" y="184" textAnchor="middle" fill="#fff" fontSize="28">G</text>
    <text x="715" y="284" textAnchor="middle" fill="#fff" fontSize="28">S</text>
    <text x="715" y="384" textAnchor="middle" fill="#fff" fontSize="28">Bias</text>
  </svg>}>
    <H>只学习三个旋钮</H>
    <T>手算例子，不是论文报出的损失值。六个位置里三个属于遮罩。</T>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" style={btn(inside)} onClick={() => setInside(true)}>损失只看遮罩</button>
      <button type="button" style={btn(!inside)} onClick={() => setInside(false)}>错误地把背景也算上</button>
    </div>
    <Big color={inside ? green : red}>{inside ? `遮罩内损失 ${loss.toFixed(2)}` : `全图损失 ${loss.toFixed(2)}`}</Big>
    <T><SymbolHint meaning="只在遮罩位置监督的 flow-matching 损失">L</SymbolHint> 用遮罩归一化。训练是 8 卡总 batch 32、17 帧、480×832、AdamW 5e-5、2K 步，约 7 万条，约 4 小时。</T>
  </Page>;
}

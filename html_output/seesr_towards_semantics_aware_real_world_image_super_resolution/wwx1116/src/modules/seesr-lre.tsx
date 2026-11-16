import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { C, clamp, pct } from './seesr-cover';

const COLS = 14;
const ROWS = 9;
const hash = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const STROKES = [
  [34, 40, 60], [120, 76, 44], [196, 44, 72], [268, 92, 36], [330, 52, 84],
  [402, 96, 50], [96, 138, 66], [214, 158, 38], [352, 132, 58],
];

/** S7 — the sampling start point: pure noise or the LR underdrawing (LRE). */
export function SeesrLre(_props: WidgetProps) {
  const [w, setW] = useState(0);

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const keep = hash(i) < w;
      const isCliff = c > COLS - 4 - Math.round(r * 0.4) && r > 3;
      const isSea = !isCliff;
      const color = keep
        ? (isCliff ? '#a39070' : '#8fb2c6')
        : ['#c9d3da', '#a9b9c4', '#e3e9ec', '#93a6b2'][Math.floor(hash(i + 7) * 4)];
      cells.push(<rect key={i} x={8 + c * 32} y={8 + r * 32} width="28" height="28" rx="3" fill={color}
        opacity={keep ? 0.95 : 0.75} />);
    }
  }

  const feedback = w < 0.3
    ? '起点几乎全是随机噪声：模型把退化当成内容去增强，平滑天空里长出细碎笔触。'
    : w < 0.8
      ? '起点开始保留残卷的浅影，虚假笔触明显减少。'
      : '起点带着残卷的浅影：天空保持平滑，随机细节基本消失。';
  const tone = w < 0.3 ? 'is-bad' : w < 0.8 ? 'is-mid' : 'is-good';

  return (
    <div className="seesr-scene">
      <div className="seesr-panel" style={{ left: 0, top: 0, width: 560, height: 348 }}>
        <div className="seesr-h">采样起点 z_T</div>
        <svg viewBox="0 0 456 300" style={{ width: 456, height: 300 }} role="img"
          aria-label={`起点由 ${pct(w)} 的残卷浅影与其余随机噪声组成`}>
          <rect width="456" height="300" fill={C.white} />
          {cells}
        </svg>
      </div>

      <div className="seesr-panel" style={{ left: 0, top: 364, width: 560, height: 258 }}>
        <div className="seesr-h">天空区域的补绘</div>
        <svg viewBox="0 0 520 150" style={{ width: 520, height: 150 }} role="img" aria-label="平滑天空区域的虚假笔触随底稿强度上升而减少">
          <rect width="520" height="150" fill="#9dbfd1" />
          <path d="M0 120 Q140 104 260 118 T520 108" fill="none" stroke="#cfe0e8" strokeWidth="3" opacity="0.7" />
          {STROKES.map(([x, y, len], index) => (
            <path key={index} d={`M${x} ${y} q${len / 2} ${12 + (index % 3) * 8} ${len} 0`}
              fill="none" stroke="#fdfbf4" strokeWidth="3" strokeLinecap="round"
              opacity={clamp(0.9 * (1 - w), 0, 0.9)} />
          ))}
        </svg>
        <p className="seesr-muted">虚假细节：{w < 0.3 ? '多' : w < 0.8 ? '减少' : '基本消失'}（示意）</p>
      </div>

      <div className="seesr-panel" style={{ left: 576, top: 0, width: 896, height: 250 }}>
        <div className="seesr-h">把 LR latent 嵌入初始噪声</div>
        <label className="seesr-slider">
          <span>起点中来自残卷的比例 w</span>
          <input type="range" min={0} max={1} step={0.02} value={w}
            onChange={(event) => setW(Number(event.target.value))} />
          <b>{pct(w)}</b>
        </label>
        <div className="seesr-formula-line">
          <strong>
            <SymbolHint meaning="z_T：扩散采样的初始 latent，即起点。">z</SymbolHint><sub>T</sub> = w·(
            <SymbolHint meaning="ᾱ_T：训练噪声调度器的累计系数，T 为最后一步。">ᾱ</SymbolHint><sub>T</sub>·
            <SymbolHint meaning="z_lr：LR 经可训练图像编码器得到的 latent。">z</SymbolHint><sub>lr</sub> + √(1−
            <SymbolHint meaning="ᾱ_T：同上，决定噪声所占比例。">ᾱ</SymbolHint><sub>T</sub>)·
            <SymbolHint meaning="ε：标准高斯噪声。">ε</SymbolHint>) + (1−w)·
            <SymbolHint meaning="ε：纯随机起点，即不使用 LRE 时的做法。">ε</SymbolHint>
          </strong>
        </div>
        <p className="seesr-muted">w=0 纯噪声起点 · w=1 论文 LRE 起点</p>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 576, top: 266, width: 896, height: 356 }}>
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
        <div className="seesr-compare">
          <div>
            <b className="is-bad">w=0：纯噪声起点</b>
            <p className="seesr-muted">训练时图像不会变成纯噪声，推理却从纯噪声开始——这个不一致让模型把退化当成内容。</p>
          </div>
          <div>
            <b className="is-good">w=1：论文 LRE</b>
            <p className="seesr-muted">按训练噪声调度器把 LR latent 嵌入起点，平滑区域不再长出随机细节。论文未给出逐项公式，这里的 w 是讲解插值。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

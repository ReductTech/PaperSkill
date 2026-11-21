import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, TokenChip, boxTokens, clamp, iou, type Box } from './rex-kit';

// Section 4.2.1: CE treats coordinate tokens as categories. Token space 0–999 on both axes.
const GT = boxTokens(EGRETS[2].box); // egret E3 → [430, 410, 500, 660]
const NAMES = ['x0 左边', 'y0 上边', 'x1 右边', 'y1 下边'];
const PRESETS: { name: string; v: number[] }[] = [
  { name: `x1 预测为相邻值 <${GT[2] - 1}>`, v: [GT[0], GT[1], GT[2] - 1, GT[3]] },
  { name: 'x1 预测为远处值 <999>', v: [GT[0], GT[1], 999, GT[3]] },
];
// Drawn inside the visible window; a box running past the edge is cut at the edge.
const toScene = (t: number[]): Box => [clamp(t[0] / 999 * 1000, 334, 806), clamp(t[1] / 999 * 560, 179, 440), clamp(t[2] / 999 * 1000, 334, 806), clamp(t[3] / 999 * 560, 179, 440)];

export function S6CeGeometry(_: WidgetProps) {
  const [pred, setPred] = useState<number[]>(PRESETS[0].v);
  const wrongAt = pred.map((k, i) => k !== GT[i]);
  const wrong = wrongAt.filter(Boolean).length;
  const l1 = pred.reduce((s, k, i) => s + Math.abs(k - GT[i]), 0);
  const ov = iou(pred as Box, GT as unknown as Box);
  const bump = (i: number, d: number) => setPred(p => p.map((k, j) => j === i ? clamp(k + d, 0, 999) : k));
  const feedback = wrong === 0 ? '预测与真值完全一致。'
    : l1 <= 2 ? `L1 只有 ${l1} 格，IoU ${ov.toFixed(2)}，几何上几乎无差；交叉熵的监督目标仍是真值类别，这个预测与预测成远处的值一样，都不是该类别。`
      : ov < 0.5 ? `L1 为 ${l1} 格，IoU 降到 ${ov.toFixed(2)}，框已严重错位；而对交叉熵来说，它与相邻值的错误一样，只是“不是真值类别”。`
        : `L1 为 ${l1} 格，IoU ${ov.toFixed(2)}。交叉熵只看每个位置的类别是否等于真值，不随 L1 的大小变化；L1 和 IoU 则能区分误差远近。`;
  return <div className="rx-page rx-s6">
    <div className="rx-s6-left">
      <svg viewBox="330 175 480 269" width="680" height="381" role="img" aria-label={`预测框与真值框 IoU ${ov.toFixed(2)}`}>
        <LakeScene view={[332, 177, 476, 265]}><AllBirds view={[332, 177, 476, 265]} /></LakeScene>
        <BoxRect box={toScene(GT)} color={C.green} width={5} dashed />
        <BoxRect box={toScene(pred)} color={ov < .5 ? C.red : C.blue} width={6} />
      </svg>
      <div className="rx-tokline"><span className="rx-tokline-tag">真值</span>{GT.map((k, i) => <TokenChip key={i} text={`<${k}>`} kind="coord" />)}</div>
      <div className="rx-tokline"><span className="rx-tokline-tag">预测</span>{pred.map((k, i) => <TokenChip key={i} text={`<${k}>`} kind={k === GT[i] ? 'coord' : 'bad'} />)}</div>
      <p className="rx-text rx-s6-formulas">
        检测器：<b><SymbolHint meaning="L1 损失：预测坐标 ĉ 与真值坐标 c 的绝对差之和，差得越远损失越大。">L1 = Σ|ĉ − c|</SymbolHint></b><br />
        MLLM：<b><SymbolHint meaning="交叉熵：只看真值词元 c_t 分到的概率 p，与预测错到哪个词元、错多远无关。">CE = −Σ log p(c<sub>t</sub>)</SymbolHint></b>
      </p>
    </div>
    <div className="rx-s6-right">
      <div className="rx-row rx-wrap" role="group" aria-label="典型情形">
        {PRESETS.map(p => <button key={p.name} className="rx-chip" onClick={() => setPred(p.v)}>{p.name}</button>)}
      </div>
      {NAMES.map((n, i) => <div key={n} className="rx-stepper">
        <span className="rx-text">{n}</span>
        <button className="rx-mini" aria-label={`${n}减 50`} onClick={() => bump(i, -50)}>−50</button>
        <button className="rx-mini" aria-label={`${n}减 1`} onClick={() => bump(i, -1)}>−1</button>
        <b className={pred[i] === GT[i] ? '' : 'rx-red'}>&lt;{pred[i]}&gt;</b>
        <button className="rx-mini" aria-label={`${n}加 1`} onClick={() => bump(i, 1)}>+1</button>
        <button className="rx-mini" aria-label={`${n}加 50`} onClick={() => bump(i, 50)}>+50</button>
      </div>)}
      <div className="rx-metrics rx-s6-metrics">
        <div><span className="rx-text">与真值类别不同的位置</span><b className="rx-em rx-red">{wrongAt.map((w, i) => w ? ['x0', 'y0', 'x1', 'y1'][i] : null).filter(Boolean).join(' ') || '无'}</b></div>
        <div><span className="rx-text">坐标差 L1</span><b className="rx-em">{l1} 格</b></div>
        <div><span className="rx-text">IoU</span><b className={`rx-em ${ov >= .5 ? 'rx-green' : 'rx-red'}`}>{ov.toFixed(2)}</b></div>
      </div>
      <p className="rx-text" aria-live="polite">{feedback}</p>
    </div>
  </div>;
}

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BIRDS, BoxRect, C, LakeScene, iou, type Box } from './rex-kit';

// Teaching re-staging of the paper's Figure 2 on the lake photo (not a measured result).
type Outcome = { box: Box; status: 'good' | 'wrong' | 'dup' | 'off' };
interface Step { prompt: string; model: string; title: string; text: string; boxes: Outcome[]; missed: string[] }

const E = Object.fromEntries(BIRDS.map(b => [b.id, b.box])) as Record<string, Box>;
const OFF: Box = [104, 148, 188, 300];
const DUP: Box = [110, 154, 194, 306];
const STEPS: Step[] = [
  { prompt: '白鹭', model: '回归检测器', title: '① 只说类别：检测器又全又准',
    text: '回归检测器（如 Grounding DINO）直接输出连续坐标，训练时用 L1、GIoU 这类几何损失，所以 5 只白鹭都框得很贴合。',
    boxes: ['E1', 'E2', 'E3', 'E4', 'E5'].map(id => ({ box: E[id], status: 'good' as const })), missed: [] },
  { prompt: '站在石头上的白鹭', model: '回归检测器', title: '② 加上描述：检测器读不懂',
    text: '它的文本编码器只抓住“白鹭”这个类别，把水里的 3 只也框了。论文图 2 中，Grounding DINO 收到 “red apple” 时框出了所有苹果。',
    boxes: [...['E1', 'E2'].map(id => ({ box: E[id], status: 'good' as const })), ...['E3', 'E4', 'E5'].map(id => ({ box: E[id], status: 'wrong' as const }))], missed: [] },
  { prompt: '站在石头上的白鹭', model: '通用 MLLM', title: '③ 换成 MLLM：读懂了，却框不好',
    text: '大语言模型听懂了“站在石头上”，但坐标写得不准：一只漏了，另一只的框偏了，还多写了一个几乎重复的框——即论文说的低召回、坐标错位和重复预测。',
    boxes: [{ box: OFF, status: 'off' }, { box: DUP, status: 'dup' }], missed: ['E2'] },
  { prompt: '站在石头上的白鹭', model: 'Rex-Omni 的目标', title: '④ 本文目标：既懂描述，又框得准',
    text: 'Rex-Omni 想保留 MLLM 的语言理解，同时把框画准。它靠三个设计：坐标词元、数据引擎、SFT + GRPO 两阶段训练，后面各章逐一展开。',
    boxes: ['E1', 'E2'].map(id => ({ box: E[id], status: 'good' as const })), missed: [] },
];
const COLOR = { good: C.green, wrong: C.red, dup: C.red, off: C.orange };

export function S1TwoGaps(_: WidgetProps) {
  const [step, setStep] = useState(0);
  const [zoom, setZoom] = useState(false);
  const s = STEPS[step];
  const count = (st: Outcome['status']) => s.boxes.filter(b => b.status === st).length;
  const offIou = iou(OFF, E.E1);
  return <div className="rx-page rx-s1">
    <div className="rx-s1-scene">
      <div className="rx-prompt"><span>指令</span><b>检测“{s.prompt}”</b><em>{s.model}</em></div>
      <svg viewBox="0 0 1000 560" width="860" height="482" role="img" aria-label={`${s.model}对“${s.prompt}”的输出`}>
        <LakeScene><AllBirds /></LakeScene>
        <g key={step} className="rx-fade-in">
          {s.boxes.map((b, i) => <BoxRect key={i} box={b.box} color={COLOR[b.status]} width={6} dashed={b.status === 'dup'} />)}
          {s.missed.map(id => <g key={id}><BoxRect box={E[id]} color={C.red} width={3} dashed opacity={.8} />
            <text x={E[id][0] - 6} y={E[id][1] - 14} fill={C.red} fontSize="32" fontWeight="700">漏</text></g>)}
          {s.boxes.some(b => b.status === 'off') && <BoxRect box={E.E1} color={C.green} width={2} dashed opacity={.7} />}
        </g>
      </svg>
    </div>
    <div className="rx-s1-side">
      <div className="rx-steps" role="group" aria-label="演示步骤">
        {STEPS.map((_, i) => <button key={i} className={`rx-step ${i === step ? 'is-on' : ''}`} aria-pressed={i === step} onClick={() => setStep(i)}>{'①②③④'[i]}</button>)}
        <button className="rx-btn rx-btn-main" disabled={step === 3} onClick={() => setStep(step + 1)}>下一步 ▶</button>
      </div>
      <h3 className="rx-h">{s.title}</h3>
      <p className="rx-text">{s.text}</p>
      <div className="rx-counters" aria-live="polite">
        <span className="is-good"><b>{count('good') + count('off')}</b>框中</span>
        <span className="is-bad"><b>{count('wrong')}</b>错选</span>
        <span className="is-bad"><b>{s.missed.length}</b>漏检</span>
        <span className="is-bad"><b>{count('dup')}</b>重复</span>
      </div>
      {step === 2 && <p className="rx-text rx-muted">偏移框与真实位置的 IoU 只有 {offIou.toFixed(2)}（虚线为真实位置）。</p>}
      {step !== 2 && <button className="rx-figthumb" onClick={() => setZoom(true)} aria-label="放大论文图 2">
        <img src="./images/figure-2.png" alt="论文图 2：检测器与 MLLM 的对比" /></button>}
    </div>
    {zoom && <button className="rx-figzoom" onClick={() => setZoom(false)} aria-label="关闭放大的论文图 2">
      <img src="./images/figure-2.png" alt="论文图 2 原图" />
      <span className="rx-text">论文图 2（CC BY 4.0）：左为两类模型的检测结果，右为回归损失与分类损失的对比。点击关闭</span>
    </button>}
  </div>;
}

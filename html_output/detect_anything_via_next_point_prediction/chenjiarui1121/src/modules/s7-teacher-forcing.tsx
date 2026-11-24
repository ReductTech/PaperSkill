import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, iou, type Box } from './rex-kit';

// Teaching replay of the failure modes described in Sec. 4.2.1 (not a recorded model output).
const GT: Box[] = EGRETS.map(e => e.box).sort((a, b) => a[0] - b[0]);
const jitter = (b: Box, d: number[]): Box => [b[0] + d[0], b[1] + d[1], b[2] + d[2], b[3] + d[3]];
// Teacher forcing: at step k the model sees GT boxes 1..k-1 and predicts box k (small errors never feed back).
const TF_PRED: Box[] = [jitter(GT[0], [3, -4, 2, 3]), jitter(GT[1], [-5, 6, 4, -2]), jitter(GT[2], [6, 2, -3, 5]), jitter(GT[3], [-2, -6, 5, 4]), jitter(GT[4], [4, 3, -6, -3])];
// Free generation: the prefix is the model's own output.
const FREE: { box: Box | null; tag: 'ok' | 'dup' | 'end' }[] = [
  { box: jitter(GT[0], [3, -4, 2, 3]), tag: 'ok' },
  { box: jitter(GT[2], [10, 8, 12, 6]), tag: 'ok' },
  { box: jitter(GT[2], [16, 12, 18, 10]), tag: 'dup' },
  { box: jitter(GT[2], [22, 16, 24, 14]), tag: 'dup' },
  { box: jitter(GT[2], [28, 20, 30, 18]), tag: 'dup' },
  { box: null, tag: 'end' },
];
const MAX = 6;

function Pane({ title, children, caption }: { title: string; children: React.ReactNode; caption: string }) {
  return <div className="rx-s7-pane"><h3 className="rx-h">{title}</h3>{children}<p className="rx-text">{caption}</p></div>;
}

export function S7TeacherForcing(_: WidgetProps) {
  const [k, setK] = useState(0);
  const tfShown = Math.min(k, 5);
  const free = FREE.slice(0, k);
  const freeBoxes = free.filter(f => f.box).map(f => f.box as Box);
  const found = GT.filter(g => freeBoxes.some(b => iou(b, g) >= .5)).length;
  const dups = free.filter(f => f.tag === 'dup').length;
  const ended = free.some(f => f.tag === 'end');
  const tfCaption = k === 0 ? '输入：图像 + 真值序列的前缀'
    : k <= 5 ? `第 ${k} 步：输入是真值前 ${k - 1} 个框，预测第 ${k} 个。预测的小误差只算进损失，不会进入下一步输入。`
      : '第 6 步：真值序列在这里写 C/ 结束——框数永远等于标注数，模型无需自己决定何时停。';
  const freeCaption = k === 0 ? '输入：图像 + 模型自己已经写下的内容'
    : ended ? `写完：找到 ${found}/5，重复 ${dups} 个，漏检 ${5 - found} 个。推理时以自己的输出为前缀，偏差会延续下去。`
      : dups ? '以自己写偏的框为前缀继续生成，得到一个坐标只略有偏移的框——论文所说的重复预测。'
        : k === 2 ? '跳过了石头上的第 2 只，直接写到水里那只——漏检在推理时才会暴露。' : '第 1 个框写对了。';
  return <div className="rx-page rx-s7">
    <div className="rx-s7-panes">
      <Pane title="训练：teacher forcing" caption={tfCaption}>
        <svg viewBox="0 0 1000 560" width="660" height="370" role="img" aria-label={`训练侧已示范 ${tfShown} 个框`}>
          <LakeScene><AllBirds /></LakeScene>
          {GT.slice(0, tfShown).map((b, i) => <BoxRect key={'g' + i} box={b} color={C.green} width={4} dashed />)}
          {TF_PRED.slice(0, tfShown).map((b, i) => <BoxRect key={'p' + i} box={b} color={C.blue} width={5} />)}
        </svg>
      </Pane>
      <Pane title="推理：自己往下写" caption={freeCaption}>
        <svg viewBox="0 0 1000 560" width="660" height="370" role="img" aria-label={`推理侧找到 ${found} 只，重复 ${dups} 个`}>
          <LakeScene><AllBirds /></LakeScene>
          {free.map((f, i) => f.box && <BoxRect key={i} box={f.box} color={f.tag === 'dup' ? C.red : C.blue} width={5} dashed={f.tag === 'dup'} />)}
          {ended && GT.filter(g => !freeBoxes.some(b => iou(b, g) >= .5)).map((g, i) => <BoxRect key={'m' + i} box={g} color={C.red} width={3} dashed opacity={.7} />)}
        </svg>
      </Pane>
    </div>
    <div className="rx-row rx-s7-bar">
      <button className="rx-btn rx-btn-main" disabled={k >= MAX} onClick={() => setK(k + 1)}>两边各写下一个框 ▶</button>
      <button className="rx-btn" onClick={() => setK(0)}>重来</button>
      <span className="rx-text rx-muted">第 {k}/{MAX} 步</span>
    </div>
  </div>;
}

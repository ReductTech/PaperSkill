import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, TokenChip, iou, type Box } from './rex-kit';

// Absolute coordinates spelled digit by digit (Sec. 2.1: Qwen2.5-VL style, 1921 → 1, 9, 2, 1).
const BOXES: Box[] = EGRETS.map(e => e.box).sort((a, b) => a[0] - b[0]);
const spell = (b: Box) => ['[', ...b.flatMap((v, i) => [...String(v).split(''), ...(i < 3 ? [','] : [])]), ']'];

export function T2NextToken(_: WidgetProps) {
  const [box, setBox] = useState(0);      // index of the box being written (may exceed 4 = repeats)
  const [n, setN] = useState(0);          // tokens of the current box written
  const [done, setDone] = useState<Box[]>([]);
  const [ended, setEnded] = useState(false);
  const cur = BOXES[Math.min(box, 4)];
  const toks = spell(cur);
  const boxDone = n >= toks.length;
  const total = done.reduce((s, b) => s + spell(b).length, 0) + n;
  const write = (all = false) => {
    const k = all ? toks.length : n + 1;
    setN(k);
    if (k >= toks.length) setDone(d => [...d, cur]);
  };
  const next = () => { setBox(box + 1); setN(0); };
  const reset = () => { setBox(0); setN(0); setDone([]); setEnded(false); };
  const found = BOXES.filter(g => done.some(b => iou(b, g) > .9)).length;
  const repeats = Math.max(0, done.length - 5);
  const fb = ended
    ? (repeats ? `写了 ${done.length} 个框，其中 ${repeats} 个是重复。` : found < 5 ? `只写了 ${found} 个框就结束，还有 ${5 - found} 只白鹭没有框。` : '5 个框写完后结束，数量正好。') + '框的总数完全取决于这一步的判断。'
    : boxDone ? '这个框写完。下一步要判断：继续写下一个框，还是结束。'
      : n === 0 ? '每点一次，模型预测一个 token。这里按 Qwen2.5-VL 的写法，坐标按数字一位一位写。' : `已写 ${n}/${toks.length} 个 token，下一个由前面写过的全部内容决定。`;
  return <div className="rx-page rx-t2">
    <svg viewBox="0 0 1000 560" width="760" height="426" role="img" aria-label={`已写出 ${done.length} 个框`}>
      <LakeScene><AllBirds /></LakeScene>
      {done.map((b, i) => <BoxRect key={i} box={i >= 5 ? [b[0] + 6 * (i - 4), b[1] + 5 * (i - 4), b[2] + 6 * (i - 4), b[3] + 5 * (i - 4)] : b} color={i >= 5 ? C.red : C.green} width={6} dashed={i >= 5} />)}
    </svg>
    <div className="rx-t2-side">
      <div className="rx-notebook rx-t2-line"><div className="rx-tokline">
        {toks.slice(0, n).map((t, i) => <TokenChip key={i} text={t} kind="faded" />)}
        {!boxDone && !ended && <span className="rx-tok rx-tok-next">?</span>}
      </div></div>
      <div className="rx-metrics">
        <div><span className="rx-text">已写 token</span><b className="rx-em">{total}</b></div>
        <div><span className="rx-text">已写框数</span><b className="rx-em">{done.length}</b></div>
        <div><span className="rx-text">目标</span><b className="rx-em">5 只</b></div>
      </div>
      {!boxDone || ended
        ? <div className="rx-row"><button className="rx-btn rx-btn-main" disabled={ended} onClick={() => write()}>预测下一个 token</button><button className="rx-btn" disabled={ended} onClick={() => write(true)}>写完这个框</button></div>
        : <div className="rx-row"><button className="rx-btn rx-btn-main" onClick={next}>继续写下一个框</button><button className="rx-btn" onClick={() => setEnded(true)}>结束</button></div>}
      <p className="rx-text" aria-live="polite">{fb}</p>
      <div className="rx-row"><button className="rx-btn" onClick={reset}>重来</button><span className="rx-text rx-muted">由读者代替模型判断，不是模型输出</span></div>
    </div>
    <p className="rx-text rx-t2-foot">token（词元）是模型词表里的一项。写坐标要做两种判断：下一个数是多少；写完一个框后继续还是结束。</p>
  </div>;
}

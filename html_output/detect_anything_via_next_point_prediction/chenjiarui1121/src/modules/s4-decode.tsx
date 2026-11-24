import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, SPECIAL, TokenChip, boxTokens, useReducedMotion, type Box, type TokenKind } from './rex-kit';

interface Step { text: string; kind: TokenKind; box?: number; part?: number; why: string }
const boxes: Box[] = EGRETS.map(e => e.box).sort((a, b) => a[0] - b[0]);
const PART = ['左边 x0', '上边 y0', '右边 x1', '下边 y1'];

function buildSteps(): Step[] {
  const s: Step[] = [
    { text: SPECIAL.ps, kind: 'special', why: '先写短语开始标记 P。' },
    { text: '白鹭', kind: 'phrase', why: '写下要找的类别，与指令里的短语一致。' },
    { text: SPECIAL.pe, kind: 'special', why: '短语结束。' },
    { text: SPECIAL.cs, kind: 'special', why: '坐标开始。若照片里没有白鹭，这里会写 None。' },
  ];
  boxes.forEach((b, bi) => {
    boxTokens(b).forEach((k, pi) => s.push({ text: `<${k}>`, kind: 'coord', box: bi, part: pi,
      why: `第 ${bi + 1} 个框的${PART[pi]}：从 1000 个坐标词元 <0>…<999> 中预测一个。` }));
    if (bi < boxes.length - 1) s.push({ text: ',', kind: 'text', why: `第 ${bi + 1} 个框写完。下一个词元是逗号（继续下一个框）还是 C/（结束坐标），同样由模型预测决定。` });
  });
  s.push({ text: SPECIAL.ce, kind: 'special', why: '模型判断白鹭已经写完，写 C/ 结束坐标。多写就会重复，少写就会漏检。' });
  s.push({ text: '<EOS>', kind: 'special', why: '回答结束。全部 5 个框都由“预测下一个词元”一步步写出。' });
  return s;
}
const STEPS = buildSteps();

export function S4Decode(_: WidgetProps) {
  const [n, setN] = useState(4); // number of tokens already written
  const [auto, setAuto] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!auto) return;
    if (reduced) { setN(STEPS.length); setAuto(false); return; }
    if (n >= STEPS.length) { setAuto(false); return; }
    const id = setTimeout(() => setN(v => v + 1), 380);
    return () => clearTimeout(id);
  }, [auto, n, reduced]);
  const next = n < STEPS.length ? STEPS[n] : null;
  const written = STEPS.slice(0, n);
  const doneBoxes = written.filter(s => s.part === 3).length;
  const partial = written.filter(s => s.box === doneBoxes && s.part !== undefined).length; // edges of the box in progress
  const cur = boxes[doneBoxes];
  const finishBox = () => { let i = n; while (i < STEPS.length && !(STEPS[i].part === 3)) i++; setN(Math.min(STEPS.length, i + 1)); };
  return <div className="rx-page rx-s4">
    <div className="rx-s4-top">
      <svg viewBox="0 0 1000 560" width="740" height="414" role="img" aria-label={`已写完 ${doneBoxes} 个框`}>
        <LakeScene><AllBirds /></LakeScene>
        {boxes.slice(0, doneBoxes).map((b, i) => <BoxRect key={i} box={b} color={C.green} width={6} />)}
        {cur && partial > 0 && <g stroke={C.orange} strokeWidth="5" strokeDasharray="12 8">
          <line x1={cur[0]} x2={cur[0]} y1={0} y2={560} />
          {partial > 1 && <line x1={0} x2={1000} y1={cur[1]} y2={cur[1]} />}
          {partial > 2 && <line x1={cur[2]} x2={cur[2]} y1={0} y2={560} />}
        </g>}
      </svg>
      <div className="rx-s4-side">
        <h3 className="rx-h">{next ? '下一个词元' : '生成结束'}</h3>
        {next ? <div className="rx-row"><TokenChip text={next.text} kind={next.kind} /><span className="rx-text rx-muted">待生成</span></div>
          : <p className="rx-h rx-green">30 个词元，其中 20 个是坐标词元</p>}
        <p className="rx-text">{next ? next.why : '每次只预测一个词元：类别、坐标、逗号和结束符都是这样写出来的。在 COCO 上，Rex-Omni 平均每框只要 7.6 个输出词元，SEED1.5-VL 要 148.8 个。'}</p>
        <div className="rx-row">
          <button className="rx-btn rx-btn-main" disabled={!next} onClick={() => setN(n + 1)}>写下一个词元</button>
          <button className="rx-btn" disabled={!next} onClick={finishBox}>写完这个框</button>
          <button className="rx-btn" disabled={!next || auto} onClick={() => setAuto(true)}>连续写</button>
          <button className="rx-btn" onClick={() => { setAuto(false); setN(4); }}>重来</button>
        </div>
      </div>
    </div>
    <div className="rx-notebook rx-s4-notebook">
      <div className="rx-tokline">
        <span className="rx-tokline-tag">{n}/{STEPS.length}</span>
        {written.map((s, i) => <TokenChip key={i} text={s.text} kind={s.kind} />)}
        {next && <span className="rx-tok rx-tok-next">?</span>}
      </div>
    </div>
  </div>;
}

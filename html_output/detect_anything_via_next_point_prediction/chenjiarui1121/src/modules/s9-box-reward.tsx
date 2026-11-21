import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import { AllBirds, BoxRect, C, EGRETS, KIND_ZH, LakeScene, boxReward, clamp, svgPoint, type Box, type LabeledBox } from './rex-kit';

const GT: LabeledBox[] = EGRETS.slice(2).map(e => ({ box: e.box, label: 'egret' }));
const START: LabeledBox[] = [
  { box: [434, 236, 503, 373], label: 'egret' }, { box: [557, 246, 623, 382], label: 'egret' }, { box: [805, 220, 874, 363], label: 'egret' },
];
type Drag = { i: number; mode: 'move' | 'size'; sx: number; sy: number; orig: Box } | null;

export function S9BoxReward(_: WidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [preds, setPreds] = useState<LabeledBox[]>(START);
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState<Drag>(null);
  const res = boxReward(preds, GT);
  const start = (e: React.PointerEvent, i: number, mode: 'move' | 'size') => {
    e.stopPropagation(); if (!svgRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    setSel(i); setDrag({ i, mode, sx: p.x, sy: p.y, orig: preds[i].box });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    const dx = p.x - drag.sx, dy = p.y - drag.sy, o = drag.orig;
    const box: Box = drag.mode === 'move'
      ? [clamp(o[0] + dx, 396, 896), clamp(o[1] + dy, 196, 394), clamp(o[2] + dx, 406, 900), clamp(o[3] + dy, 206, 404)]
      : [o[0], o[1], clamp(o[2] + dx, o[0] + 12, 898), clamp(o[3] + dy, o[1] + 12, 398)];
    setPreds(ps => ps.map((b, j) => j === drag.i ? { ...b, box } : b));
  };
  const nudge = (e: React.KeyboardEvent, i: number) => {
    const d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key];
    if (!d) return; e.preventDefault(); setSel(i);
    setPreds(ps => ps.map((b, j) => j === i ? { ...b, box: [b.box[0] + d[0], b.box[1] + d[1], b.box[2] + d[0], b.box[3] + d[1]] } : b));
  };
  const s = preds[sel];
  const addDup = () => { const b = (s || preds[0] || START[0]).box; setPreds([...preds, { box: [b[0] + 8, b[1] + 6, b[2] + 8, b[3] + 6], label: 'egret' }]); setSel(preds.length); };
  const addLarge = () => { setPreds([{ box: [420, 212, 882, 394], label: 'egret' }]); setSel(0); };
  const flip = () => s && setPreds(preds.map((b, j) => j === sel ? { ...b, label: b.label === 'egret' ? 'duck' : 'egret' } : b));
  const del = () => { if (!s) return; setPreds(preds.filter((_, j) => j !== sel)); setSel(0); };
  const m = preds.length, n = GT.length, sum = res.perGt.reduce((a, r) => a + r.reward, 0);
  const wrongLabel = res.perGt.some(r => r.match >= 0 && r.iou > .3 && r.reward === 0);
  const large = preds.some(p => (p.box[2] - p.box[0]) > 300);
  const feedback = m === 0 ? '一个框都没有：召回和精确率都是 0。'
    : large ? '一个大框罩住三只鸟：它与每只鸟的 IoU 都很小，奖励很低。GRPO 正是用这种信号压低“大框”行为。'
      : wrongLabel ? '框的位置对了，类别却写成野鸭：该真值框得 0 分。奖励同时检查位置和类别。'
        : m > n ? `多了 ${m - n} 个框：召回没有增加（Σr 不变），分母 m 却变大，精确率下降，F1 随之下降——重复框会被扣分。`
          : res.perGt.some(r => r.reward < .2) ? '有真值框没被覆盖：召回下降。漏检同样会降低奖励。'
            : '拖动或缩放蓝框，IoU 连续变化，框越贴合奖励越高。奖励直接看几何重叠，这正是交叉熵做不到的。';
  return <div className="rx-page rx-s9">
    <div className="rx-s9-left">
      <svg ref={svgRef} viewBox="392 182 516 226" width="860" height="380" role="group" aria-label="拖动蓝色预测框，缩放右下角手柄"
        onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
        <LakeScene view={[392, 182, 516, 226]}><AllBirds view={[392, 182, 516, 226]} /></LakeScene>
        {GT.map((g, i) => <BoxRect key={'g' + i} box={g.box} color={C.green} width={2.5} dashed />)}
        {preds.map((p, i) => {
          const [x0, y0, x1, y1] = p.box;
          const col = p.label === 'egret' ? C.blue : C.red;
          return <g key={i} className="rx-drag" tabIndex={0} role="button" aria-label={`预测框 ${i + 1}（${KIND_ZH[p.label]}），方向键移动`}
            onKeyDown={e => nudge(e, i)} onFocus={() => setSel(i)}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={col} fillOpacity={i === sel ? .14 : .05} stroke={col} strokeWidth={i === sel ? 4 : 3}
              onPointerDown={e => start(e, i, 'move')} />
            <text x={x0 + 4} y={y0 - 6} fontSize="17" fill={col} fontWeight="700">{KIND_ZH[p.label]}</text>
            <rect x={x1 - 9} y={y1 - 9} width="18" height="18" fill="#fff" stroke={col} strokeWidth="3" onPointerDown={e => start(e, i, 'size')} style={{ cursor: 'nwse-resize' }} />
          </g>;
        })}
      </svg>
      <div className="rx-row rx-wrap">
        <button className="rx-btn" onClick={addDup}>添加重复框</button>
        <button className="rx-btn" onClick={addLarge}>换成一个大框</button>
        <button className="rx-btn" disabled={!s} onClick={flip}>切换选中框类别</button>
        <button className="rx-btn" disabled={!s} onClick={del}>删除选中框</button>
        <button className="rx-btn" onClick={() => { setPreds(START); setSel(0); }}>重置</button>
      </div>
      <p className="rx-text rx-muted">指点任务用“点落在掩码内”给 1 分，GUI 定位用“点落在目标框内”给 1 分，召回、精确、F1 的算法相同。</p>
    </div>
    <div className="rx-s9-right">
      <p className="rx-text">每个真值框找 IoU 最大的预测框，类别相同才得分：</p>
      {res.perGt.map((r, j) => <div key={j} className="rx-gtrow">
        <span className="rx-text">白鹭 {j + 1}</span>
        <span className="rx-bar"><span style={{ width: `${r.reward * 100}%`, background: r.reward > .5 ? C.green : C.red }} /></span>
        <b className="rx-text">r = {r.reward.toFixed(2)}</b>
      </div>)}
      <div className="rx-formula rx-text">
        <SymbolHint meaning="Recall：召回率。把每个真值框的得分 r_j 相加，再除以真值框数 n。">Recall</SymbolHint> = Σr / <SymbolHint meaning="n：真值框个数（这里是 3 只白鹭）。">n</SymbolHint> = {sum.toFixed(2)} / {n} = <b>{res.recall.toFixed(2)}</b><br />
        <SymbolHint meaning="Precision：精确率。同样的得分总和，除以预测框数 m；多写的框会让它下降。">Precision</SymbolHint> = Σr / <SymbolHint meaning="m：模型写出的预测框个数。">m</SymbolHint> = {sum.toFixed(2)} / {m} = <b>{res.precision.toFixed(2)}</b>
      </div>
      <div className="rx-reward"><span className="rx-text">奖励 r<sup>IoU</sup> = 2PR / (P + R + ε)</span><b className={`rx-em ${res.f1 > .7 ? 'rx-green' : 'rx-red'}`}>{res.f1.toFixed(2)}</b></div>
      <p className="rx-text" aria-live="polite">{feedback}</p>
    </div>
  </div>;
}

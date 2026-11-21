import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, SPECIAL, TokenChip, boxReward, boxTokens, clamp, iou, svgPoint, type Box } from './rex-kit';

// One egret, one predicted box: the four mechanisms of the paper computed from the same state.
const VIEW = [392, 182, 516, 226] as const;
const GT: Box = EGRETS[2].box;
const START: Box = [440, 244, 512, 380];
type Drag = { mode: 'move' | 'size'; sx: number; sy: number; o: Box } | null;

export function S14Recap(_: WidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<Box>(START);
  const [dup, setDup] = useState(false);
  const [drag, setDrag] = useState<Drag>(null);
  const gtT = boxTokens(GT), pT = boxTokens(box);
  const ov = iou(box, GT);
  const preds = [{ box, label: 'egret' as const }, ...(dup ? [{ box: [box[0] + 8, box[1] + 6, box[2] + 8, box[3] + 6] as Box, label: 'egret' as const }] : [])];
  const reward = boxReward(preds, [{ box: GT, label: 'egret' }]);
  const start = (e: React.PointerEvent, mode: 'move' | 'size') => {
    if (!svgRef.current) return; e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY); setDrag({ mode, sx: p.x, sy: p.y, o: box });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY); const dx = p.x - drag.sx, dy = p.y - drag.sy, o = drag.o;
    setBox(drag.mode === 'move'
      ? [clamp(o[0] + dx, 396, 860), clamp(o[1] + dy, 186, 370), clamp(o[2] + dx, 430, 880), clamp(o[3] + dy, 210, 396)]
      : [o[0], o[1], clamp(o[2] + dx, o[0] + 16, 880), clamp(o[3] + dy, o[1] + 16, 396)]);
  };
  const key = (e: React.KeyboardEvent) => {
    const d = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }[e.key];
    if (!d) return; e.preventDefault(); setBox(b => [b[0] + d[0], b[1] + d[1], b[2] + d[0], b[3] + d[1]]);
  };
  return <div className="rx-page rx-s14">
    <div className="rx-s14-left">
      <svg ref={svgRef} viewBox={VIEW.join(' ')} width="560" height="246" role="group" aria-label="拖动蓝框，右侧四步同时变化"
        onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
        <LakeScene view={[...VIEW]}><AllBirds view={[...VIEW]} /></LakeScene>
        <BoxRect box={GT} color={C.green} width={2.5} dashed />
        {dup && <BoxRect box={preds[1].box} color={C.red} width={3} dashed />}
        <g className="rx-drag" tabIndex={0} role="button" aria-label="预测框，方向键移动" onKeyDown={key}>
          <rect x={box[0]} y={box[1]} width={box[2] - box[0]} height={box[3] - box[1]} fill={C.blue} fillOpacity=".1" stroke={C.blue} strokeWidth="3.5" onPointerDown={e => start(e, 'move')} />
          <rect x={box[2] - 8} y={box[3] - 8} width="16" height="16" fill="#fff" stroke={C.blue} strokeWidth="3" style={{ cursor: 'nwse-resize' }} onPointerDown={e => start(e, 'size')} />
        </g>
      </svg>
      <div className="rx-row">
        <button className="rx-btn" aria-pressed={dup} onClick={() => setDup(!dup)}>{dup ? '去掉重复框' : '多写一个重复框'}</button>
        <button className="rx-btn" onClick={() => { setBox(START); setDup(false); }}>重置</button>
      </div>
      <p className="rx-text">拖动或缩放蓝框（绿虚线是真值框）。同一个框依次经过论文的四个环节，右边四格同时变化。</p>
    </div>
    <div className="rx-s14-grid" aria-live="polite">
      <section><h3 className="rx-h">① 量化</h3><div>
        <div className="rx-tokline">{pT.map((k, i) => <TokenChip key={i} text={`<${k}>`} kind="coord" />)}</div>
        <p className="rx-text rx-muted">4 个像素坐标 → 4 个坐标词元</p></div></section>
      <section><h3 className="rx-h">② 序列</h3><div>
        <div className="rx-tokline"><TokenChip text={SPECIAL.ps} kind="special" /><TokenChip text="白鹭" kind="phrase" /><TokenChip text={SPECIAL.pe} kind="special" /><TokenChip text={SPECIAL.cs} kind="special" />
          <TokenChip text={`${dup ? 8 : 4} 个坐标词元`} kind="coord" /><TokenChip text={SPECIAL.ce} kind="special" /></div>
        <p className="rx-text rx-muted">{dup ? '多写一个框，序列多出 4 个坐标词元' : '一个框之后即为坐标结束标记'}</p></div></section>
      <section><h3 className="rx-h">③ 交叉熵监督</h3><div>
        <div className="rx-tokline"><span className="rx-tokline-tag">预测</span>{pT.map((k, i) => <TokenChip key={i} text={`<${k}>`} kind={k === gtT[i] ? 'coord' : 'bad'} />)}</div>
        <div className="rx-tokline"><span className="rx-tokline-tag">真值</span>{gtT.map((k, i) => <TokenChip key={i} text={`<${k}>`} kind="coord" />)}</div>
        <p className="rx-text rx-muted">每个坐标词元按 1000 类分类监督，偏差大小不进入损失</p></div></section>
      <section><h3 className="rx-h">④ GRPO 奖励</h3><div>
        <p className="rx-text">IoU {ov.toFixed(2)} · 召回 {reward.recall.toFixed(2)} · 精确 {reward.precision.toFixed(2)} → <b className={`rx-em ${reward.f1 > .7 ? 'rx-green' : 'rx-red'}`}>r = {reward.f1.toFixed(2)}</b></p>
        <p className="rx-text rx-muted">{dup ? '重复框使精确率 Σr/m 下降，奖励随之下降' : '框与真值的 IoU 越高，奖励越高'}</p></div></section>
    </div>
  </div>;
}

import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BoxRect, C, EGRETS, Egret, LakeScene, clamp, svgPoint, type Box } from './rex-kit';

// Referring data engine (p.9): expression → Molmo point → SAM mask per GT box → link the box whose mask contains the point.
// Masks here are the egret silhouettes drawn by the kit (body ellipse + neck + head).
function egretMaskHit(box: Box, x: number, y: number) {
  const [x0, y0, x1, y1] = box; const w = x1 - x0, h = y1 - y0; const cx = x0 + w * .45;
  const inEllipse = ((x - cx) / (w * .42)) ** 2 + ((y - (y1 - h * .34)) / (h * .14)) ** 2 <= 1;
  const inHead = Math.hypot(x - (cx + w * .26), y - (y0 + h * .09)) <= w * .1 + 2;
  // neck: two quadratic Bézier segments, sampled
  const P = [[cx + w * .25, y1 - h * .4], [cx + w * .05, y0 + h * .45], [cx + w * .3, y0 + h * .28], [cx + w * .45, y0 + h * .14], [cx + w * .25, y0 + h * .1]];
  let near = false;
  for (const [a, b, c] of [[P[0], P[1], P[2]], [P[2], P[3], P[4]]]) for (let t = 0; t <= 1; t += .05) {
    const px = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0];
    const py = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1];
    if (Math.hypot(x - px, y - py) <= Math.max(6, w * .12) / 2 + 2) near = true;
  }
  return inEllipse || inHead || near;
}
const inBox = (b: Box, x: number, y: number) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];

const PHRASES = [
  { p: '湖面', adj: false }, { p: '白鹭', adj: false }, { p: '野鸭', adj: false },
  { p: '低头的白鹭', adj: true }, { p: '灰色的海鸥', adj: true },
];
const MIX = [
  { name: '公开数据', v: 8.9, c: '#9fb0c8' }, { name: '定位引擎', v: 3, c: C.blue }, { name: '指代引擎', v: 3, c: C.green },
  { name: '指点引擎', v: 5, c: C.orange }, { name: 'OCR 引擎', v: 2, c: C.purple },
];

export function S5Data(_: WidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: 152, y: 262 });
  const [drag, setDrag] = useState(false);
  const [filter, setFilter] = useState(true);
  const move = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    setPt({ x: clamp(p.x, 0, 1000), y: clamp(p.y, 0, 560) });
  };
  const key = (e: React.KeyboardEvent) => {
    const d = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
    if (!d) return; e.preventDefault(); setPt(p => ({ x: clamp(p.x + d[0], 0, 1000), y: clamp(p.y + d[1], 0, 560) }));
  };
  const hitIdx = EGRETS.findIndex(e => egretMaskHit(e.box, pt.x, pt.y));
  const boxIdx = EGRETS.findIndex(e => inBox(e.box, pt.x, pt.y));
  const target = 0; // E1: the left egret on the rock
  const status = hitIdx === target ? 'good' : hitIdx >= 0 ? 'wrong' : boxIdx >= 0 ? 'gap' : 'none';
  const feedback = {
    good: '点落在左边那只白鹭的掩码里 → 把它的框与描述配成一条指代数据。',
    wrong: `点落在第 ${hitIdx + 1} 只白鹭的掩码里 → 描述会被配给它。Molmo 指错时，这条数据就是错的。`,
    gap: '点在框里却不在鸟身上（比如两腿之间）→ 掩码判断为“不关联”。只用框判断会误配，这正是先用 SAM 求掩码的原因。',
    none: '点没落在任何掩码里 → 这条描述找不到对应的框，不生成数据。',
  }[status];
  const total = MIX.reduce((s, m) => s + m.v, 0);
  return <div className="rx-page rx-s5">
    <div className="rx-s5-left">
      <p className="rx-text rx-s5-expr">① Qwen2.5-VL-7B 生成描述：<b>“站在石头左边的白鹭”</b></p>
      <svg ref={svgRef} viewBox="0 0 1000 560" width="720" height="403" role="group" aria-label="拖动 Molmo 给出的点，观察它与哪个掩码关联"
        onPointerMove={e => drag && move(e)} onPointerUp={() => setDrag(false)} onPointerLeave={() => setDrag(false)}>
        <LakeScene><AllBirds /></LakeScene>
        {EGRETS.map((e, i) => <BoxRect key={i} box={e.box} color={i === hitIdx ? (status === 'good' ? C.green : C.red) : C.muted} width={i === hitIdx ? 7 : 3} dashed={i !== hitIdx} />)}
        {EGRETS.map((e, i) => i === hitIdx && <Egret key={'m' + i} box={e.box} tone={status === 'good' ? '#a9dcc0' : '#efb2bd'} />)}
        <g tabIndex={0} role="slider" aria-label="Molmo 的点" aria-valuenow={Math.round(pt.x)} aria-valuetext={feedback} className="rx-drag" onKeyDown={key}
          onPointerDown={e => { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(true); move(e); }}>
          <circle cx={pt.x} cy={pt.y} r="36" fill="transparent" />
          <circle cx={pt.x} cy={pt.y} r="14" fill={C.orange} stroke="#fff" strokeWidth="4" />
        </g>
      </svg>
      <div className="rx-pipe">
        <span>② Molmo 给一个点（拖动它）</span><span>③ SAM 给每个真值框求掩码</span><span>④ 点在哪个掩码里，就关联哪个框</span>
      </div>
    </div>
    <div className="rx-s5-right">
      <p className={`rx-text rx-feedback is-${status === 'good' ? 'good' : 'bad'}`} aria-live="polite">{feedback}</p>
      <h3 className="rx-h">定位引擎：过滤带形容词的短语</h3>
      <div className="rx-row rx-wrap">
        {PHRASES.map(({ p, adj }) => <span key={p} className={`rx-phrase ${adj && filter ? 'is-cut' : ''} ${adj && !filter ? 'is-risk' : ''}`}>{p}</span>)}
      </div>
      <button className="rx-btn" aria-pressed={filter} onClick={() => setFilter(!filter)}>形容词过滤：{filter ? '开' : '关'}</button>
      <p className={`rx-text ${filter ? '' : 'rx-red'}`}>{filter
        ? '只把“湖面、白鹭、野鸭”交给 DINO-X 标框，类别名清楚，标注不易错。'
        : '“低头的白鹭”也交给 DINO-X：它会把 5 只白鹭全标成“低头的”，其中 4 只是错标。'}</p>
      <div className="rx-mix" aria-label="训练数据组成，约 2200 万张图像">
        {MIX.map(m => <span key={m.name} style={{ flex: m.v, background: m.c }} title={`${m.name} 约 ${m.v}M`} />)}
      </div>
      <p className="rx-text">{MIX.map(m => `${m.name} ${m.v}M`).join(' · ')}，合计约 {Math.round(total)}M 张图像</p>
    </div>
  </div>;
}

import React, { useMemo, useState } from 'react';
import { StageCanvas } from '../live/TimeBar';
import { Anim, rgba, rr, txt, useStage, markDirectInput, type Frame } from '../live/stage';
import { C, Feedback, Range, Readout, Seg, Swatch, Tag } from './sv-kit';
import type { WidgetProps } from './registry';

// 2.1 同一张示意街景、三个问题：“不看问题”按图像自身的显著度保留，“评分员打分”按与问题的相关度保留。
// 场景、显著度、相关度都是教学示意；覆盖率只在示意场景里成立。

export const COLS = 12;
export const ROWS = 8;
export type Q = 'sign' | 'bus' | 'roof';
export const QUESTIONS: { value: Q; label: string; text: string; region: [number, number, number, number] }[] = [
  { value: 'sign', label: '牌子上写了什么？', text: '“这块蓝色牌子上写了什么？”', region: [9, 1, 11, 2] },
  { value: 'bus', label: '有几辆公交车？', text: '“图里有几辆公交车？”', region: [2, 5, 8, 6] },
  { value: 'roof', label: '屋顶是什么颜色？', text: '“这个屋顶是什么颜色？”', region: [0, 1, 3, 2] },
];
export const inRegion = (c: number, r: number, g: [number, number, number, number]) => c >= g[0] && c <= g[2] && r >= g[1] && r <= g[3];

/** 图像自身的显著度（示意）：大块、居中、颜色对比强的地方高 */
export function salience(c: number, r: number) {
  let s = 0.25 + 0.25 * Math.exp(-((c - 5.5) ** 2) / 18 - ((r - 4.5) ** 2) / 8);
  if (inRegion(c, r, [2, 5, 8, 6])) s += 0.55; // 公交车：大、显眼
  if (inRegion(c, r, [3, 3, 6, 4])) s += 0.3; // 楼房中部
  if (inRegion(c, r, [0, 1, 3, 2])) s += 0.12;
  if (inRegion(c, r, [9, 1, 11, 2])) s += 0.08; // 牌子小、在角落
  return s + ((c * 7 + r * 13) % 10) * 0.012;
}
/** 与问题的相关度（示意） */
function relevance(c: number, r: number, q: Q) {
  const g = QUESTIONS.find((x) => x.value === q)!.region;
  const cx = (g[0] + g[2]) / 2;
  const cy = (g[1] + g[3]) / 2;
  const base = inRegion(c, r, g) ? 1 : 0.5 * Math.exp(-((c - cx) ** 2 + (r - cy) ** 2) / 6);
  return base + 0.25 * salience(c, r);
}

export function SvAgnostic(_: WidgetProps) {
  const [q, setQ] = useState<Q>('sign');
  const [mode, setMode] = useState<'agnostic' | 'text'>('agnostic');
  const [ratio, setRatio] = useState(25);
  const k = Math.round((COLS * ROWS * ratio) / 100);
  const keep = useMemo(() => {
    const cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push({ c, r, s: mode === 'agnostic' ? salience(c, r) : relevance(c, r, q) });
    cells.sort((a, b) => b.s - a.s);
    return new Set(cells.slice(0, k).map((x) => x.r * COLS + x.c));
  }, [q, mode, k]);
  const g = QUESTIONS.find((x) => x.value === q)!;
  const regionCells = (g.region[2] - g.region[0] + 1) * (g.region[3] - g.region[1] + 1);
  let hit = 0;
  keep.forEach((id) => {
    if (inRegion(id % COLS, Math.floor(id / COLS), g.region)) hit++;
  });
  const cover = hit / regionCells;

  const anim = useMemo(() => new Anim(), []);
  const draw = (f: Frame) => {
    anim.begin();
    paint(f, anim, keep, g.region);
    return anim.moving;
  };
  const stage = useStage({ heightOf: (w) => Math.round(w * (ROWS / COLS)) + 8, draw }, [keep, q]);
  const tone = cover >= 0.8 ? 'ok' : cover >= 0.4 ? 'warn' : 'bad';

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <StageCanvas s={stage} label={`示意街景：${g.text}，保留 ${k} 个图块，覆盖问题区域 ${Math.round(cover * 100)}%`} />
          <div className="sv-legend">
            <span>
              <Swatch color={C.vis} />
              保留的图块（实线框）
            </span>
            <span>
              <Swatch color={C.pruned} dashed />
              被剪掉的图块
            </span>
            <span>虚线框 = 回答问题需要的区域</span>
          </div>
        </div>
        <div className="lv-side">
          <span className="sv-k">问题</span>
          <Seg label="问题" value={q} onChange={setQ} options={QUESTIONS.map((x) => ({ value: x.value, label: x.label }))} />
          <span className="sv-k">挑法</span>
          <Seg
            label="挑法"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'agnostic', label: '不看问题（按显著度）' },
              { value: 'text', label: '评分员打分（看问题）' },
            ]}
          />
          <Range
            label="保留比例"
            value={ratio}
            min={10}
            max={50}
            onChange={(v) => {
              markDirectInput();
              setRatio(v);
            }}
            display={`${ratio}%（${k} 块）`}
          />
          <div className="sv-reads">
            <Readout label="问题区域被保留" value={`${hit} / ${regionCells}`} tone={tone === 'ok' ? 'green' : tone === 'warn' ? 'amber' : 'red'} sub={`覆盖率约 ${Math.round(cover * 100)}%`} />
          </div>
          <Feedback tone={tone} k={`${q}-${mode}-${tone}`}>
            {mode === 'agnostic'
              ? `不看问题时，三个问题留下的是同一批图块（显眼的公交车和楼房）。${q === 'bus' ? '这次问题恰好问公交车，所以覆盖得不错。' : '问题关心的区域不显眼，大部分被剪掉了。'}`
              : '让问题打分后，保留区域跟着问题移动；同样的保留比例，问题需要的图块大多留了下来。'}
          </Feedback>
          <p className="sv-small">
            <Tag kind="demo" /> 场景、显著度与相关度均为示意设定，仿照论文图 1 的设置，不代表真实模型的注意力。
          </p>
        </div>
      </div>
    </div>
  );
}

function paint(f: Frame, anim: Anim, keep: Set<number>, region: [number, number, number, number]) {
  const { ctx, w, h, dt, final } = f;
  const pad = 4;
  const cw = (w - pad * 2) / COLS;
  const ch = (h - pad * 2) / ROWS;
  const X = (c: number) => pad + c * cw;
  const Y = (r: number) => pad + r * ch;
  paintStreet(ctx, X, Y, cw, ch, w, h, pad);
  // 图块：被剪的盖上灰色（过渡约 0.4s，从当前透明度续接）
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const id = r * COLS + c;
      const on = keep.has(id);
      const a = anim.to(`c${id}`, on ? 0 : 1, dt, final, 9);
      if (a > 0.01) {
        ctx.fillStyle = rgba('#eef1f6', 0.82 * a);
        ctx.fillRect(X(c), Y(r), cw, ch);
      }
      ctx.strokeStyle = on ? rgba(C.vis, 0.95) : rgba(C.prunedLine, 0.28);
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.strokeRect(X(c) + 0.8, Y(r) + 0.8, cw - 1.6, ch - 1.6);
    }
  // 问题区域：虚线框
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(X(region[0]) - 1, Y(region[1]) - 1, (region[2] - region[0] + 1) * cw + 2, (region[3] - region[1] + 1) * ch + 2);
  ctx.restore();
  txt(ctx, '问题区域', X(region[0]) + 4, Y(region[1]) - 1 + (region[1] === 0 ? 12 : -8), { size: 11, weight: 800, color: C.ink });
}

/** 示意街景（2.1 与 4.1 共用）：X(c)、Y(r) 把格坐标换成像素。 */
export function paintStreet(ctx: CanvasRenderingContext2D, X: (c: number) => number, Y: (r: number) => number, cw: number, ch: number, w: number, h: number, pad: number) {
  ctx.save();
  rr(ctx, X(0), Y(0), cw * COLS, ch * ROWS, Math.min(10, cw));
  ctx.clip();
  const sky = ctx.createLinearGradient(0, Y(0), 0, Y(ROWS));
  sky.addColorStop(0, '#d8e7fb');
  sky.addColorStop(1, '#f2f5fa');
  ctx.fillStyle = sky;
  ctx.fillRect(X(0), Y(0), cw * COLS, ch * ROWS);
  ctx.fillStyle = '#cbd3df';
  ctx.fillRect(X(0), Y(5), cw * COLS, ch * 3); // 路面
  ctx.fillStyle = '#9aabc4';
  ctx.fillRect(X(3), Y(2.2), cw * 4, ch * 2.8); // 楼
  ctx.fillStyle = '#e9eef6';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ctx.fillRect(X(3.3 + i), Y(2.6 + j * 1.2), cw * 0.5, ch * 0.6);
  ctx.fillStyle = '#a7795f';
  ctx.fillRect(X(0.2), Y(2.4), cw * 3.4, ch * 2.6); // 小屋
  ctx.fillStyle = '#b44a3c';
  ctx.beginPath();
  ctx.moveTo(X(0), Y(2.6));
  ctx.lineTo(X(1.9), Y(1.1));
  ctx.lineTo(X(3.9), Y(2.6));
  ctx.fill(); // 红屋顶
  ctx.fillStyle = '#6b7a90';
  ctx.fillRect(X(10.4), Y(2.8), cw * 0.18, ch * 2.4); // 牌子立杆
  ctx.fillStyle = C.vis;
  rr(ctx, X(9.2), Y(1.15), cw * 2.6, ch * 1.6, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(X(9.5), Y(1.6), cw * 2, ch * 0.18);
  ctx.fillRect(X(9.5), Y(2.05), cw * 1.4, ch * 0.18);
  for (const bx of [2.2, 5.3]) {
    ctx.fillStyle = '#e0a63a';
    rr(ctx, X(bx), Y(5.15), cw * 2.7, ch * 1.6, 6);
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    for (let i = 0; i < 3; i++) ctx.fillRect(X(bx + 0.25 + i * 0.8), Y(5.45), cw * 0.55, ch * 0.5);
    ctx.fillStyle = '#4b5565';
    ctx.beginPath();
    ctx.arc(X(bx + 0.6), Y(6.8), Math.min(cw, ch) * 0.28, 0, Math.PI * 2);
    ctx.arc(X(bx + 2.1), Y(6.8), Math.min(cw, ch) * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

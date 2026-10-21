import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useInView, useReducedMotion, useWidth } from '../lib/hooks';
import { C, FONT_MONO } from '../lib/palette';
import { euclidOf, greedyMaxMin, makeCloud, minPair, rng, topK } from '../lib/maxmin';

// Hero 对决：同一片示意点云、同样的名额，左边按“重要性”Top-k，右边按 Max-Min。
// 两边同步逐个点亮，下方实时显示“最近一对距离”与“覆盖簇数”。教学示意，非真实数据。

const K = 16;
const AR = 1.75;
const SPECS = [
  { cx: 0.24, cy: 0.66, sx: 0.07, sy: 0.07, n: 46 },
  { cx: 0.52, cy: 0.42, sx: 0.07, sy: 0.06, n: 34 },
  { cx: 0.8, cy: 0.66, sx: 0.06, sy: 0.07, n: 30 },
  { cx: 0.74, cy: 0.18, sx: 0.05, sy: 0.04, n: 16 },
  { cx: 0.24, cy: 0.2, sx: 0.035, sy: 0.035, n: 10 },
];
const STEP_MS = 260;

type Side = 'old' | 'new';

export const HeroDuel: React.FC<WidgetProps> = () => {
  const reduced = useReducedMotion();
  const [viewRef, inView] = useInView<HTMLDivElement>('0px');
  const [shown, setShown] = useState(reduced ? K : 0);
  const pts = useMemo(() => makeCloud(97, SPECS), []);
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  const scores = useMemo(() => {
    const r = rng(5);
    return pts.map((p) => (p.c === 0 ? 0.7 + 0.3 * r() : 0.4 * r()));
  }, [pts]);
  const sel = useMemo<Record<Side, number[]>>(
    () => ({ old: topK(scores, K), new: greedyMaxMin(pts.length, K, d) }),
    [scores, pts, d]
  );

  useEffect(() => {
    if (reduced) {
      setShown(K);
      return;
    }
    if (!inView || shown >= K) return;
    const id = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? 700 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, shown, reduced]);

  const stat = (side: Side) => {
    const s = sel[side].slice(0, Math.max(2, shown));
    return { mm: minPair(s, d).v, cl: new Set(sel[side].slice(0, shown).map((i) => pts[i].c)).size };
  };

  return (
    <div className="duel" ref={viewRef}>
      {(['old', 'new'] as Side[]).map((side) => (
        <Panel key={side} side={side} pts={pts} sel={sel[side]} shown={shown} scores={scores} stat={stat(side)} />
      ))}
      <button type="button" className="duel-replay" onClick={() => setShown(reduced ? K : 0)} aria-label="重播对比动画">
        ↻ 重播
      </button>
    </div>
  );
};

function Panel({
  side,
  pts,
  sel,
  shown,
  scores,
  stat,
}: {
  side: Side;
  pts: { x: number; y: number; c: number }[];
  sel: number[];
  shown: number;
  scores: number[];
  stat: { mm: number; cl: number };
}) {
  const [wrapRef, w] = useWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const h = w ? Math.round(w / AR) : 0;
  const color = side === 'old' ? C.mustard : C.verm;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const pad = 12;
    const X = (x: number) => pad + x * (w - 2 * pad);
    const Y = (y: number) => pad + y * (h - 2 * pad);
    const on = new Set(sel.slice(0, shown));
    // 背景点
    pts.forEach((p, i) => {
      if (on.has(i)) return;
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), side === 'old' ? 1.6 + scores[i] * 2 : 2, 0, Math.PI * 2);
      ctx.fillStyle = side === 'old' ? `rgba(214, 148, 18, ${0.12 + scores[i] * 0.35})` : 'rgba(20, 28, 52, 0.25)';
      ctx.fill();
    });
    // 最近一对（短板）
    const cur = sel.slice(0, shown);
    if (cur.length >= 2) {
      let best = Infinity;
      let a = -1;
      let b = -1;
      for (let i = 0; i < cur.length; i++)
        for (let j = i + 1; j < cur.length; j++) {
          const dd = Math.hypot((pts[cur[i]].x - pts[cur[j]].x) * AR, pts[cur[i]].y - pts[cur[j]].y);
          if (dd < best) {
            best = dd;
            a = cur[i];
            b = cur[j];
          }
        }
      ctx.strokeStyle = C.cobalt;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(pts[a].x), Y(pts[a].y));
      ctx.lineTo(X(pts[b].x), Y(pts[b].y));
      ctx.stroke();
    }
    // 选中点：光晕 + 实心
    cur.forEach((i, k) => {
      const x = X(pts[i].x);
      const y = Y(pts[i].y);
      const fresh = k === cur.length - 1;
      const g = ctx.createRadialGradient(x, y, 0, x, y, fresh ? 18 : 11);
      g.addColorStop(0, side === 'old' ? 'rgba(214, 148, 18, 0.35)' : 'rgba(255, 106, 77, 0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, fresh ? 18 : 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      if (side === 'old') {
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 5.5, y + 4);
        ctx.lineTo(x - 5.5, y + 4);
        ctx.closePath();
      } else {
        ctx.arc(x, y, 4.6, 0, Math.PI * 2);
      }
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
    ctx.font = `600 11px ${FONT_MONO}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(`${shown} / ${K}`, w - 46, h - 8);
  }, [w, h, pts, sel, shown, scores, side, color]);

  return (
    <div className={`duel-panel duel-${side}`}>
      <div className="duel-head">
        <span className="duel-k">{side === 'old' ? '旧思路 · 按重要性 Top-k' : 'DivPrune · Max-Min'}</span>
      </div>
      <div ref={wrapRef} className="duel-cv">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${side === 'old' ? '重要性 Top-k' : 'Max-Min'}：已选 ${shown} 个，覆盖 ${stat.cl} 个簇`}
        />
      </div>
      <div className="duel-stats">
        <div>
          <span>最近一对距离</span>
          <b>{shown >= 2 ? stat.mm.toFixed(3) : '—'}</b>
        </div>
        <div>
          <span>覆盖簇数</span>
          <b>{stat.cl} / 5</b>
        </div>
      </div>
    </div>
  );
}

export default HeroDuel;

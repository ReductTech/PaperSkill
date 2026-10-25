import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useInView, useReducedMotion, useTween, useWidth } from '../lib/hooks';
import { greedyMaxMinSteps, makeCloud, type Pt } from '../lib/maxmin';
import { C } from '../lib/palette';

// Hero：576 个灰点（教学示意的二维点云），先“扫描”一遍（对应第一阶段的全量距离计算），
// 再按 Algorithm 1 的 Max-Min 顺序逐个点亮 56 个朱红点，每次点亮扩出一圈覆盖半径。

const N = 576;
const K = 56;
const SCAN_MS = 1100;
const PICK_MS = 85;
const RING_MS = 900;

function heroPoints(): Pt[] {
  return makeCloud(20250611, [
    { cx: 0.24, cy: 0.62, sx: 0.08, sy: 0.07, n: 150 },
    { cx: 0.52, cy: 0.42, sx: 0.1, sy: 0.08, n: 140 },
    { cx: 0.78, cy: 0.66, sx: 0.07, sy: 0.08, n: 110 },
    { cx: 0.7, cy: 0.2, sx: 0.06, sy: 0.05, n: 70 },
    { cx: 0.3, cy: 0.2, sx: 0.05, sy: 0.04, n: 40 },
    { cx: 0.5, cy: 0.82, sx: 0.12, sy: 0.05, n: 50 },
    { cx: 0.92, cy: 0.38, sx: 0.025, sy: 0.04, n: 16 },
  ]);
}

export const HeroCloud: React.FC<WidgetProps> = () => {
  const [wrapRef, w] = useWidth<HTMLDivElement>();
  const [viewRef, inView] = useInView<HTMLDivElement>('0px');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const [run, setRun] = useState(0);
  const shown = useTween(count, 160);

  const h = w ? Math.round(w < 720 ? Math.min(420, w * 0.78) : Math.min(760, Math.max(520, w * 0.62))) : 0;

  const base = useMemo(heroPoints, []);
  const layout = useMemo(() => {
    if (!w || !h) return null;
    const mx = 18;
    const my = 18;
    const pts = base.map((p) => ({ x: mx + p.x * (w - 2 * mx), y: my + p.y * (h - 2 * my) }));
    const d = (a: number, b: number) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
    const steps = greedyMaxMinSteps(N, K, d);
    const picks = steps.map((s) => s.pick);
    // 每次被选中时，到已选集合的最近距离 = 本轮覆盖半径；最近者用于画连线
    const radius = steps.map((s) => (s.round === 0 ? s.D[s.pick] : s.D[s.pick]));
    const nearest = steps.map((s) => (s.round === 0 ? -1 : s.nearest[s.pick]));
    return { pts, picks, radius, nearest };
  }, [base, w, h]);

  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = 0;
    setCount(reduced ? K : 0);
  }, [run, reduced, layout]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !layout || !w || !h) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    const { pts, picks, radius, nearest } = layout;
    let raf = 0;
    let lastCount = -1;

    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, w, h);
      const pickT = elapsed - SCAN_MS;
      const nPicked = reduced ? K : Math.max(0, Math.min(K, Math.floor(pickT / PICK_MS) + 1));
      const pickedSet = new Set(picks.slice(0, nPicked));

      // 覆盖圈（已选点）
      for (let i = 0; i < nPicked; i++) {
        const age = reduced ? RING_MS : pickT - i * PICK_MS;
        const k = Math.min(1, Math.max(0, age / RING_MS));
        const e = 1 - Math.pow(1 - k, 3);
        const p = pts[picks[i]];
        const r = Math.min(radius[i], h * 0.2) * (0.35 + 0.65 * e);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        // 扩张时短暂填充，结束后只留一圈很淡的覆盖线
        ctx.fillStyle = `rgba(255,106,77,${0.1 * (1 - e)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255,106,77,${0.6 * (1 - e) + 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 灰点
      for (let i = 0; i < N; i++) {
        if (pickedSet.has(i)) continue;
        const p = pts[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 28, 52, 0.32)';
        ctx.fill();
      }
      // 扫描光（第一阶段：全量距离计算）
      if (!reduced && elapsed < SCAN_MS + 200) {
        const k = Math.min(1, elapsed / SCAN_MS);
        const x = -80 + (w + 160) * (1 - Math.pow(1 - k, 2));
        const g = ctx.createLinearGradient(x - 90, 0, x + 10, 0);
        g.addColorStop(0, 'rgba(59, 91, 255, 0)');
        g.addColorStop(0.85, 'rgba(59, 91, 255, 0.12)');
        g.addColorStop(1, 'rgba(59, 91, 255, 0.5)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 90, 0, 100, h);
      }
      // 最新一次选择：连向最近的已选点（钴蓝）
      if (!reduced && nPicked > 1 && nPicked < K + 1) {
        const i = nPicked - 1;
        const age = pickT - i * PICK_MS;
        if (age < 600 && nearest[i] >= 0) {
          const a = pts[picks[i]];
          const b = pts[nearest[i]];
          ctx.strokeStyle = `rgba(59, 91, 255, ${0.7 * (1 - age / 600)})`;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      // 已选点
      for (let i = 0; i < nPicked; i++) {
        const p = pts[picks[i]];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = C.verm;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = C.paper;
        ctx.stroke();
      }
      if (nPicked !== lastCount) {
        lastCount = nPicked;
        setCount(nPicked);
      }
      return nPicked >= K && (reduced || pickT > K * PICK_MS + RING_MS);
    };

    if (reduced || !inView) {
      // 静态帧：减少动态效果时直接画最终状态；离开视口时保持当前帧
      draw(reduced ? Infinity : elapsedRef.current);
      return;
    }
    // 离开视口时暂停；回到视口时从暂停处继续
    let start = -1;
    const from = elapsedRef.current;
    const loop = (now: number) => {
      if (start < 0) start = now;
      elapsedRef.current = from + (now - start);
      const done = draw(elapsedRef.current);
      if (!done) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [layout, w, h, reduced, inView, run]);

  return (
    <div className="hero-cloud" ref={viewRef}>
      <div ref={wrapRef} className="hero-cloud-box">
        <canvas ref={canvasRef} role="img" aria-label="示意动画：576 个灰点中，按 Max-Min 顺序逐个点亮 56 个朱红点，每个点扩出一圈覆盖半径。" />
      </div>
      <div className="hero-counter" aria-live="off">
        <span className="hero-counter-n">{Math.round(shown)}</span>
        <span className="hero-counter-d"> / 576 已选</span>
        <button type="button" className="hero-replay" onClick={() => setRun((r) => r + 1)} aria-label="重播选择动画">
          ↻ 重播
        </button>
      </div>
      <div className="hero-cloud-note">教学示意：二维点云，非真实特征 · 选择顺序按 Algorithm 1 计算</div>
    </div>
  );
};

export default HeroCloud;

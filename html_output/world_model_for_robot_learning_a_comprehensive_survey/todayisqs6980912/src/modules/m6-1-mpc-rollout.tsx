import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawInkPath,
  drawGhostPath,
  drawTarget,
  drawBrush,
  drawLegend,
  drawSceneLabel,
  strokePath,
} from './theme-kit';
import type { Pt } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 6.1 滚动重规划（P2 步进）：每次预演 H=3 段、走 1 段。
// 当前位置长出 3 条虚线候选（主路 ± 法向偏移），穿墨渍者标红淘汰，
// 最优者高亮执行首段（实线墨迹），毛笔前移；8 步到达目标。

const W = 720;
const H = 320;

const WP: Pt[] = [
  { x: 70, y: 150 },
  { x: 150, y: 165 },
  { x: 230, y: 195 },
  { x: 310, y: 190 },
  { x: 390, y: 160 },
  { x: 470, y: 145 },
  { x: 550, y: 150 },
  { x: 610, y: 155 },
  { x: 655, y: 150 },
];
const STEPS = WP.length - 1;
const RUN_MS = 900;

const BLOTS: { x: number; y: number; r: number }[] = [
  { x: 280, y: 105, r: 30 },
  { x: 465, y: 210, r: 30 },
];

function offsetPath(pts: Pt[], d: number): Pt[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (-dy / len) * d, y: p.y + (dx / len) * d };
  });
}

function crossesBlot(pts: Pt[]): boolean {
  for (const p of pts) {
    for (const b of BLOTS) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 5) return true;
    }
  }
  return false;
}

// 预演候选：从第 k 步出发，看向 k+3（截断到终点）
function candidatesAt(k: number): Pt[][] {
  const end = Math.min(k + 3, STEPS);
  const base = strokePath(WP[k], WP.slice(k + 1, end), WP[end], 40);
  return [base, offsetPath(base, 46), offsetPath(base, -46)];
}

export const M61MpcRollout: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, anim: null as null | { from: number; t: number; last: number } });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const mainFull = strokePath(WP[0], WP.slice(1, -1), WP[STEPS], 160);
    // 主路径上每步的位置索引
    const idxAt = (k: number) => Math.round((k / STEPS) * (mainFull.length - 1));

    const drawBlots = () => {
      for (const b of BLOTS) {
        ctx.save();
        ctx.fillStyle = PALETTE.envDark;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.r, b.r * 0.82, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.envLight;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.25, b.r * 0.42, b.r * 0.3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const render = () => {
      const s = stateRef.current;
      const k = s.step;
      const anim = s.anim;

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.muted, text: '候选' },
        { color: PALETTE.blue, text: '已走' },
        { color: PALETTE.green, text: '目标' },
      ]);

      drawBlots();

      // 目标绿环 + 起点
      drawTarget(ctx, WP[STEPS].x, WP[STEPS].y, { r: 11 });
      ctx.save();
      ctx.fillStyle = PALETTE.guide;
      ctx.beginPath();
      ctx.arc(WP[0].x - 8, WP[0].y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawSceneLabel(ctx, WP[0].x - 6, WP[0].y + 18, '起点', { size: 11, align: 'center' });

      // 已走墨迹
      let curPos: Pt = WP[0];
      if (anim) {
        const inkU = clamp((anim.t - 0.55) / 0.45, 0, 1);
        const i0 = idxAt(anim.from);
        const i1 = idxAt(anim.from + 1);
        const upto = Math.max(2, Math.round(lerp(i0, i1, inkU)));
        drawInkPath(ctx, mainFull.slice(0, upto), { color: PALETTE.blue, width: 3.5 });
        curPos = mainFull[Math.min(upto, mainFull.length - 1)];
      } else if (k > 0) {
        drawInkPath(ctx, mainFull.slice(0, idxAt(k) + 1), { color: PALETTE.blue, width: 3.5 });
        curPos = mainFull[idxAt(k)];
      }

      // 候选幽灵（动画中逐段长出）
      if (anim) {
        const cands = candidatesAt(anim.from);
        const probeU = clamp(anim.t / 0.45, 0, 1);
        const best = 0;
        for (let ci = 0; ci < cands.length; ci++) {
          const bad = crossesBlot(cands[ci]);
          const n = Math.max(2, Math.round(probeU * (cands[ci].length - 1)) + 1);
          const pts = cands[ci].slice(0, n);
          const fading = anim.t > 0.55 && ci !== best;
          const isBest = ci === best && anim.t > 0.35;
          drawGhostPath(ctx, pts, {
            color: bad ? PALETTE.red : isBest ? PALETTE.blue : PALETTE.muted,
            width: isBest ? 3 : 2,
            alpha: fading ? 0.22 : bad ? 0.5 : isBest ? 0.95 : 0.45,
          });
          if (bad && probeU >= 1) {
            const p = cands[ci][Math.floor(cands[ci].length / 2)];
            ctx.save();
            ctx.fillStyle = PALETTE.red;
            ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✕', p.x, p.y);
            ctx.restore();
          }
        }
      }

      // 毛笔
      drawBrush(ctx, curPos.x, curPos.y, 0.18, 26);

      // 底部剩余距离条
      const rem = (STEPS - (anim ? anim.from : k)) / STEPS;
      drawSceneLabel(ctx, 40, H - 26, '剩余距离', { size: 12 });
      const bx = 112;
      const bw = 440;
      ctx.fillStyle = PALETTE.grid;
      ctx.fillRect(bx, H - 32, bw, 12);
      ctx.fillStyle = PALETTE.green;
      ctx.fillRect(bx, H - 32, bw * rem, 12);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      if (s.anim) {
        if (s.anim.last === 0) s.anim.last = ms;
        s.anim.t = clamp(s.anim.t + (ms - s.anim.last) / RUN_MS, 0, 1);
        s.anim.last = ms;
        if (s.anim.t >= 1) {
          s.step = s.anim.from + 1;
          s.anim = null;
          setStep(s.step);
        }
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStep = () => {
    const s = stateRef.current;
    if (s.anim) return;
    if (s.step >= STEPS) {
      s.step = 0;
      setStep(0);
    } else {
      s.anim = { from: s.step, t: 0, last: 0 };
    }
  };

  const fb =
    step === 0
      ? { text: '点击「走一步」：先预演 H=3 段，选优执行 1 段。', cls: '' }
      : step >= STEPS
      ? { text: '边走边重新想象：滚动重规划让长路径不再怕中途生变。', cls: 'good' }
      : { text: `第 ${step} 步：预演 3 条，选优走 1 段——再从新位置重新想象。`, cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onStep}>
          {step >= STEPS ? '重来' : '走一步'}
        </button>
        <span className="step-label">
          已走 <b>{step}</b> / {STEPS} 段
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M61MpcRollout;

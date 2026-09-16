import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawEventDots, drawLegend, drawSceneLabel, PAPER } from './halftoneKit';
import type { WidgetProps } from './registry';

// §4.1 时间片：把一串点装进箱子
// 主操作：chip 行三选一（B = 3 / B = 5 / B = 8）。
// 上区是切成 B 段的时间轴，下区是同一批事件点按时间投影到各自的时间片上。
// 下区的事件点是**表示层**，不表示极性，所以一律用 drawEventDots(..., 'single')（紫色），
// 图例也只有单项「时间片」——这里绝不能用极性红蓝。

const W = 1080;
const H = 280;
const X0 = 24;
const X1 = 1056;
const BAR_Y = 40;
const BAR_H = 90;
const DOT_TOP = 150;
const DOT_BOT = 250;

type Bins = 3 | 5 | 8;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 同一批事件：大部分挤在运动最剧烈的一小段时间里，少数散在整段上。
const EVENTS: { u: number; j: number }[] = (() => {
  const rnd = mulberry32(7788);
  const out: { u: number; j: number }[] = [];
  for (let i = 0; i < 200; i++) {
    const u = clamp(0.44 + (rnd() + rnd() + rnd() - 1.5) * 0.26, 0.006, 0.994);
    out.push({ u, j: rnd() * 2 - 1 });
  }
  for (let i = 0; i < 60; i++) {
    out.push({ u: rnd(), j: rnd() * 2 - 1 });
  }
  return out;
})();

function feedbackFor(bins: Bins): { text: string; cls: string } {
  if (bins === 3) {
    return { text: '片数太少，一片里挤了太多事件，时间细节被压平了。', cls: 'warn' };
  }
  if (bins === 8) {
    return {
      text: '论文试过更多迭代：N = 8 相比 N = 5 没有额外收益（Table VIII）。片切得太细，每片里的点变稀疏，反而不好提取特征。',
      cls: 'warn',
    };
  }
  return {
    text: '论文正是把事件流离散成 B = 5 个时间片（Eq. 1–2），并让 ITE 的迭代次数 N 等于 B。消融显示 5 次迭代最好。',
    cls: 'good',
  };
}

function segWidth(bins: number): number {
  return (X1 - X0) / bins;
}

function binIndex(u: number, bins: number): number {
  return Math.min(bins - 1, Math.floor(u * bins));
}

function render(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  mix: number
): void {
  clearScene(ctx, W, H);
  const m = easeInOutQuad(clamp(mix, 0, 1));

  // ------------------------------------------------------------- 时间轴
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(X0, BAR_Y, X1 - X0, BAR_H);
  ctx.restore();

  const bands = (bins: number, alpha: number) => {
    if (alpha <= 0.01) return;
    const segW = segWidth(bins);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(39,68,110,0.10)';
    for (let i = 0; i < bins; i += 2) {
      ctx.fillRect(X0 + i * segW, BAR_Y, segW, BAR_H);
    }
    ctx.restore();
  };
  bands(from, 1 - m);
  bands(to, m);

  const separators = (bins: number, alpha: number, yTop: number, yBot: number) => {
    if (alpha <= 0.01) return;
    const segW = segWidth(bins);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PAPER.axis;
    ctx.lineWidth = 1.5;
    for (let i = 1; i < bins; i++) {
      ctx.beginPath();
      ctx.moveTo(X0 + i * segW, yTop);
      ctx.lineTo(X0 + i * segW, yBot);
      ctx.stroke();
    }
    ctx.restore();
  };
  separators(from, 1 - m, BAR_Y, BAR_H);
  separators(to, m, BAR_Y, BAR_H);

  ctx.save();
  ctx.strokeStyle = PAPER.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(X0 + 0.5, BAR_Y + 0.5, X1 - X0 - 1, BAR_H - 1);
  ctx.restore();

  // ------------------------------------------------------------- 事件点投影
  separators(from, (1 - m) * 0.55, BAR_Y + BAR_H, DOT_BOT);
  separators(to, m * 0.55, BAR_Y + BAR_H, DOT_BOT);

  const project = (u: number, j: number, bins: number) => {
    const i = binIndex(u, bins);
    const segW = segWidth(bins);
    const x = X0 + (i + 0.5) * segW + j * segW * 0.3;
    const f = u * bins - i;
    const y = DOT_BOT - 8 - f * (DOT_BOT - DOT_TOP - 16);
    return { x, y };
  };

  const pts: { x: number; y: number; p: number }[] = [];
  for (const q of EVENTS) {
    const a = project(q.u, q.j, from);
    const b = project(q.u, q.j, to);
    pts.push({ x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m), p: 1 });
  }
  drawEventDots(ctx, pts, 'single');

  // ------------------------------------------------------------- 标签与图例
  drawSceneLabel(ctx, X0, BAR_Y - 10, '时间', PAPER.screenLine);
  drawSceneLabel(ctx, X0, DOT_BOT + 16, '时间片', PAPER.screenLine);
  drawLegend(ctx, X1 - 120, BAR_Y - 10, [{ color: PAPER.purple, label: '时间片' }]);
}

export const M4_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [binCount, setBinCount] = useState<Bins>(5);
  const [feedback, setFeedback] = useState(() => feedbackFor(5));
  const animRef = useRef({ from: 5, to: 5, mix: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf = 0;
    let running = false;
    let ready = false;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;

      const anim = animRef.current;
      if (anim.mix < 1) anim.mix = Math.min(1, anim.mix + dt / 240);

      render(ctx, anim.from, anim.to, anim.mix);

      if (!ready) {
        canvas.classList.add('is-ready');
        ready = true;
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (b: Bins) => {
    if (b === binCount) return;
    animRef.current = { from: binCount, to: b, mix: 0 };
    setBinCount(b);
    setFeedback(feedbackFor(b));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="时间片条"
      />
      <div className="chip-row">
        {([3, 5, 8] as Bins[]).map((b) => (
          <button
            key={b}
            type="button"
            className={`chip${binCount === b ? ' selected' : ''}`}
            onClick={() => pick(b)}
          >
            B = {b}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default M4_1;

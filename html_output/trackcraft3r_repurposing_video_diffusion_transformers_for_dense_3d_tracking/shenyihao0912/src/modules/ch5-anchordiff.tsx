import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawDog,
  drawTracker,
  drawTrail,
  drawSofa,
  drawTimeCard,
  drawSceneLabel,
  drawLegend,
} from './dogKit';
import type { Pt } from './dogKit';
import type { WidgetProps } from './registry';

// 两种锚定，同屏对比（P3 synchronized compare）：one shared clock drives two
// stacked halves. Top = 帧锚定 P_j(t_j)：the full room is redrawn each t, the cat
// enters at t₂, and the current content set is dotted blue. Bottom = 参考锚定
// P_0(t_j)：only the first-frame green mark and its dashed trail persist; the mark
// dims (o=0) at t₃ when the dog is behind the sofa.

const W = 1080;
const H = 280;
const PANEL_H = 130;
const BOT_Y = 150;
const DUR = 1.6; // seconds of animation for t₀ → t₃, then hold
const SUB = ['₀', '₁', '₂', '₃'];

type Phase = 'idle' | 'running' | 'done';

const FB_IDLE = '按开始，让两块面板同走一条时间轴。';
const FB_RUN =
  '上面板蓝点 = 该帧重建点图里的内容点（钉在狗鼻、沙发靠背上，t₂ 起还包括猫）；下面板绿点 = 第一帧那批点。狗中途会向上跳一下——跳起的高度同样进 3D 轨迹，绿点身份不变。';
const FB_DONE =
  '同一个视频，两种问法：『现在看见什么』 vs 『第一帧的点在哪』——TrackCraft3R 要回答的是后者。';

/** A small grey cat; drawn before the sofa so it peeks out from behind it. */
const drawCat = (ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.muted;
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // tail
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 10);
  ctx.quadraticCurveTo(x - 22, y - 18, x - 16, y - 26);
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.arc(x + 12, y - 16, 6, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 20);
  ctx.lineTo(x + 6, y - 27);
  ctx.lineTo(x + 12, y - 22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 21);
  ctx.lineTo(x + 17, y - 27);
  ctx.lineTo(x + 18, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** Blue content dot with a white ring. */
const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.save();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const Ch5Anchordiff: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [fb, setFb] = useState({ text: FB_IDLE, cls: '' });
  const phaseRef = useRef<Phase>('idle');
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    // continuous walk + one physical hop around t≈1.6: the dog leaps into the
    // air (vertical arc); the nose mark and trail follow through the air too
    const markX = (t: number) => lerp(180, 892, t / 3);
    const dogX = (t: number) => markX(t) - 20;
    const HOP0 = 1.35;
    const HOP1 = 1.85;
    const hopY = (t: number) =>
      t > HOP0 && t < HOP1 ? -44 * Math.sin((Math.PI * (t - HOP0)) / (HOP1 - HOP0)) : 0;

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const g1 = PANEL_H - 34; // local ground line inside each panel

      // ---- top panel: 帧锚定 P_j(t_j) ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, PANEL_H);
      ctx.clip();
      drawSceneBg(ctx, W, PANEL_H);
      if (t >= 2) drawCat(ctx, 958, g1, clamp((t - 2) / 0.3, 0, 1));
      drawDog(ctx, dogX(t), g1 + hopY(t), 0.85, { mood: 'walk', t });
      drawSofa(ctx, 920, g1, 1);
      // hop cue: tag above the apex while the dog is in the air
      if (t >= HOP0 && t <= HOP1 + 0.6) {
        drawTimeCard(ctx, markX(1.6), g1 - 92, '跳跃');
      }
      // blue content dots = this frame's reconstruction points, pinned to objects
      drawDot(ctx, 920, g1 - 50); // sofa back corner
      if (t < 2.75) drawDot(ctx, markX(t), g1 - 21 + hopY(t)); // dog nose (follows the hop)
      if (t >= 2.2) drawDot(ctx, 970, g1 - 18); // cat head
      drawSceneLabel(ctx, '帧锚定', 16, 18);
      drawTimeCard(ctx, 1032, 20, `t${SUB[Math.min(3, Math.floor(t))]}`);
      ctx.restore();

      // divider between the two synchronized halves
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.lineTo(W, 140);
      ctx.stroke();

      // ---- bottom panel: 参考锚定 P_0(t_j) ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, BOT_Y, W, PANEL_H);
      ctx.clip();
      ctx.translate(0, BOT_Y);
      drawSceneBg(ctx, W, PANEL_H);
      drawSofa(ctx, 920, g1, 1);
      // ghost of the first-frame origin
      ctx.globalAlpha = 0.3;
      drawTracker(ctx, 180, g1 - 21, 6);
      ctx.globalAlpha = 1;
      // dashed trail of the mark (rides through the hop — identity is kept)
      const pts: Pt[] = [];
      for (let u = 0; u <= t + 1e-6; u += 0.25) {
        pts.push({ x: markX(u), y: g1 - 21 + hopY(u) });
      }
      const m: Pt = { x: markX(t), y: g1 - 21 + hopY(t) };
      pts.push(m);
      drawTrail(ctx, pts, C.green, true);
      // the mark itself; dims (o=0) once the dog is behind the sofa
      const dim = t >= 2.75;
      if (dim) ctx.globalAlpha = 0.35;
      drawTracker(ctx, m.x, m.y, 6);
      ctx.globalAlpha = 1;
      if (dim) {
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(m.x + 12, m.y - 36, 34, 18, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.red;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('o=0', m.x + 29, m.y - 26);
      }
      drawSceneLabel(ctx, '参考锚定', 16, 18);
      drawLegend(
        ctx,
        [
          ['当前内容点', C.blue],
          ['第一帧的点', C.green],
        ],
        16,
        118
      );
      ctx.restore();
    };

    const tick = (now: number) => {
      let t = 0;
      if (phaseRef.current !== 'idle') {
        t = clamp((now - startRef.current) / 1000 / DUR, 0, 1) * 3;
        if (phaseRef.current === 'running' && t >= 3) {
          phaseRef.current = 'done';
          setPhase('done');
          setFb({ text: FB_DONE, cls: 'good' });
        }
      }
      render(t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    startRef.current = performance.now();
    phaseRef.current = 'running';
    setPhase('running');
    setFb({ text: FB_RUN, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onStart} disabled={phase === 'running'}>
          {phase === 'idle' ? '开始' : '重放'}
        </button>
        <span className="step-label">共享时钟 t₀ → t₃</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Anchordiff;

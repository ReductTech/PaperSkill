import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawGuitar,
  drawTuningFork,
  drawWave,
  drawCapo,
  drawTape,
  drawPitchMark,
  drawBox,
  drawStaff,
  drawArrow,
  label,
} from './scene';

const W = 560;
const H = 140;

type Scene = (ctx: CanvasRenderingContext2D, t: number) => void;

function ease(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - x, 3);
}

// 1 顺序到达时音准标记滑离刻度，旧录音不动
const sceneDrift: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawGuitar(ctx, 8, 46, 296, 62, { active: true });
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(462, 16);
  ctx.lineTo(462, 116);
  ctx.stroke();
  ctx.restore();
  const x = 336 + ease(t) * 116;
  drawPitchMark(ctx, x, 56, t < 0.4 ? C.blue : t < 0.75 ? C.orange : C.red);
  drawTape(ctx, 384, 96, 140, 28, false);
  drawTuningFork(ctx, 508, 62, 0.72, 0);
  label(ctx, '旧录音', 452, 134, 12, C.muted, 'center');
};

// 2 两种拨法逐渐对齐到同一刻度
const sceneViews: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawStaff(ctx, 16, 26, 190);
  drawBox(ctx, 26, 52, 66, 44, C.white, C.dark, 6);
  drawBox(ctx, 108, 52, 66, 44, C.light, C.dark, 6);
  drawArrow(ctx, 84, 74, 104, 74, C.wood, 2, 6);
  drawTuningFork(ctx, 246, 72, 0.68, 0.4 + 0.6 * t);
  const d = 54 - ease(t) * 40;
  ctx.save();
  ctx.strokeStyle = t > 0.72 ? C.green : C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(360, 72 - d / 2);
  ctx.lineTo(360, 72 + d / 2);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(360, 72 - d / 2, 6, 0, Math.PI * 2);
  ctx.arc(360, 72 + d / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t > 0.72 ? C.green : C.muted;
  ctx.beginPath();
  ctx.moveTo(392, 72 - d / 2);
  ctx.lineTo(392, 72 + d / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(392, 72 - d / 2, 6, 0, Math.PI * 2);
  ctx.arc(392, 72 + d / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  label(ctx, '两视图', 100, 130, 12, C.muted, 'center');
};

// 3 移调夹滑到目标品位并停住
const sceneTranspose: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawGuitar(ctx, 8, 44, 300, 66, { active: true });
  const p = ease(Math.min(1, t / 0.65));
  const cx = 232 + p * 112;
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(344, 32);
  ctx.lineTo(344, 110);
  ctx.stroke();
  ctx.restore();
  drawCapo(ctx, cx, 77, 14, C.orange);
  const align = Math.max(0, 1 - p);
  drawWave(ctx, 362, 58, 176, 8, align * 2.4, C.muted, 2);
  drawWave(ctx, 362, 90, 176, 8, 0, p > 0.9 ? C.green : C.blue, 2);
  label(ctx, '合奏', 450, 130, 12, C.muted, 'center');
};

// 4 按下定格键，旧录音静止
const sceneFreeze: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawGuitar(ctx, 8, 50, 248, 58, { active: false });
  const press = Math.min(1, t / 0.3);
  ctx.save();
  ctx.fillStyle = t > 0.3 ? C.blue : C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(286, 58, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawArrow(ctx, 306, 58, 346, 58, C.blue, 2, 7);
  drawTape(ctx, 356, 38, 168, 40, true);
  drawWave(ctx, 386, 58, 108, 7, t > 0.3 ? 1.2 : t * 8, t > 0.3 ? C.dark : C.muted, 2);
  ctx.save();
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(352, 26);
  ctx.lineTo(352, 100);
  ctx.stroke();
  ctx.restore();
  if (press > 0.5) drawBox(ctx, 262, 82, 48, 16, C.red, undefined, 4);
  label(ctx, '冻结', 286, 90, 11, C.white, 'center');
};

// 5 一支音叉同时校两条波形
const sceneFork: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawTuningFork(ctx, 62, 70, 1.1, t);
  const shake = Math.max(0, 1 - t) * 8;
  drawWave(ctx, 150, 52, 360, 5 + shake, t * 3, C.muted, 2);
  drawWave(ctx, 150, 90, 360, 5 + shake, 0, t > 0.6 ? C.green : C.blue, 2);
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(330, 26);
  ctx.lineTo(330, 116);
  ctx.stroke();
  ctx.restore();
  label(ctx, '同一音叉', 64, 132, 12, C.muted, 'center');
};

// 6 拨片沿弦扫过一次
const scenePick: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawGuitar(ctx, 8, 52, 300, 62, { active: true });
  const px = 250 + ease(t) * 250;
  ctx.save();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(252, 83);
  ctx.lineTo(px, 83);
  ctx.stroke();
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.moveTo(px, 83);
  ctx.lineTo(px - 14, 74);
  ctx.lineTo(px - 14, 92);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawWave(ctx, 372, 46, 168, 6, t * 6, C.blue, 2);
  drawWave(ctx, 372, 98, 168, 6, t * 6 + 1.6, C.light, 2);
  label(ctx, '一次扫弦', 456, 130, 12, C.muted, 'center');
};

// 7 谱架上的谱页翻到新一页
const scenePage: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawBox(ctx, 60, 42, 200, 76, C.white, C.wood, 6);
  drawStaff(ctx, 76, 58, 168);
  const p = Math.min(1, t / 0.55);
  const w = 200 * Math.abs(Math.cos(p * Math.PI));
  ctx.save();
  ctx.fillStyle = C.light;
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(260, 42);
  ctx.lineTo(260 + w, 42);
  ctx.lineTo(260 + w, 118);
  ctx.lineTo(260, 118);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawBox(ctx, 300, 42, 200, 76, C.white, C.wood, 6);
  drawStaff(ctx, 316, 58, 168, C.dark);
  ctx.save();
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 118);
  ctx.lineTo(100, 138);
  ctx.moveTo(380, 118);
  ctx.lineTo(400, 138);
  ctx.stroke();
  ctx.restore();
  label(ctx, '新一页', 400, 130, 12, C.muted, 'center');
};

// 8 校音旋钮转到四个档位
const sceneKnob: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  const cx = 120;
  const cy = 72;
  const idx = Math.min(3, Math.floor(t * 4));
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI * 0.75 + (i * Math.PI) / 3;
    ctx.strokeStyle = i === idx ? C.orange : C.light;
    ctx.lineWidth = i === idx ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46);
    ctx.lineTo(cx + Math.cos(a) * 54, cy + Math.sin(a) * 54);
    ctx.stroke();
  }
  const ang = -Math.PI * 0.75 + (idx * Math.PI) / 3;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang) * 32, cy + Math.sin(ang) * 32);
  ctx.stroke();
  ctx.restore();
  drawWave(ctx, 220, 46, 300, 7, 0, C.blue, 2);
  drawWave(ctx, 220, 96, 300, 7, 0.8, C.green, 2);
  label(ctx, '四种校音', 390, 130, 12, C.muted, 'center');
};

// 9 扳手轻拧，波形由抖动变平直
const sceneWrench: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  drawGuitar(ctx, 8, 52, 236, 58, { active: true });
  const p = ease(t);
  ctx.save();
  ctx.translate(292, 72);
  ctx.rotate(-0.5 + p * 1.0);
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(46, 0);
  ctx.stroke();
  ctx.strokeStyle = C.wood;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(52, 0, 9, -0.8, 0.8);
  ctx.stroke();
  ctx.restore();
  const amp = 10 - p * 7;
  drawWave(ctx, 340, 62, 190, amp, t * (1 - p) * 14, p > 0.75 ? C.green : C.orange, 2);
  label(ctx, '长期演出', 434, 130, 12, C.muted, 'center');
};

// 10 回放指针扫过四根录音柱
const sceneReplay: Scene = (ctx, t) => {
  clearScene(ctx, W, H);
  const baseY = 118;
  const vals = [0.62, 0.72, 0.78, 0.92];
  const colors = [C.light, C.dark, C.blue, C.green];
  vals.forEach((v, i) => {
    const x = 78 + i * 96;
    const h = v * 84;
    drawBox(ctx, x, baseY - h, 44, h, colors[i], undefined, 5);
  });
  const px = 60 + ease(t) * 400;
  ctx.save();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(px, 20);
  ctx.lineTo(px, baseY);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, baseY);
  ctx.lineTo(500, baseY);
  ctx.stroke();
  ctx.restore();
  label(ctx, '回放', 278, 132, 12, C.muted, 'center');
};

const SCENES: Record<string, Scene> = {
  'chap-1': sceneDrift,
  'chap-2': sceneViews,
  'chap-3': sceneTranspose,
  'chap-4': sceneFreeze,
  'chap-5': sceneFork,
  'chap-6': scenePick,
  'chap-7': scenePage,
  'chap-8': sceneKnob,
  'chap-9': sceneWrench,
  'chap-10': sceneReplay,
};

export const BandAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const scene = SCENES[chapterId] || sceneDrift;
    const start = performance.now();
    const tick = () => {
      const t = ((performance.now() - start) % 3200) / 3200;
      scene(ctx, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const run = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, run, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId]);

  return <canvas ref={canvasRef} width={W} height={H} aria-label="乐队换琴类比动画" />;
};

const HW = 520;
const HH = 220;

export const HeroTuning: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, HW, HH);
    } catch {
      return;
    }
    const start = performance.now();
    const tick = () => {
      const t = ((performance.now() - start) % 3400) / 3400;
      clearScene(ctx, HW, HH);
      drawStaff(ctx, 30, 26, 300, C.light);
      drawGuitar(ctx, 24, 96, 300, 82, { active: isNew });
      if (isNew) {
        const cx = 268 + Math.sin(t * Math.PI * 2) * 3;
        drawCapo(ctx, cx, 137, 14, C.orange);
        drawTuningFork(ctx, 454, 66, 1.15, t);
        drawWave(ctx, 60, 196, 400, 8, 0, C.green, 2);
        drawWave(ctx, 60, 176, 400, 8, 0, C.blue, 1.5);
        drawArrow(ctx, 200, 156, 200, 168, C.green, 2, 6);
      } else {
        drawTuningFork(ctx, 454, 66, 1.15, 0);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(454, 40);
        ctx.lineTo(454, 108);
        ctx.stroke();
        ctx.restore();
        drawWave(ctx, 60, 196, 400, 10, t * 5, C.red, 2);
        drawWave(ctx, 60, 174, 400, 5, 0, C.muted, 1.5);
        drawPitchMark(ctx, 250 + Math.sin(t * Math.PI * 2) * 6, 150, C.red);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const run = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, run, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isNew]);

  return <canvas ref={canvasRef} width={HW} height={HH} aria-label="新旧方法对照动画" />;
};

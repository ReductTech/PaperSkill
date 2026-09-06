import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

// Hero comparison: the same room and the same robot arm.
// Old side: the robot can only look; it never moves and cannot act.
// New side: one coherent task story — scan the state, attempt the action and fail,
// detect the deviation, replan, and recover — plus sparse MoE activation.
const W = 460;
const H = 220;

const BALL = { x: 148, y: 112 };
const BOX = { x: 190, y: 94, w: 46, h: 28 };
const MUG = { x: 62, y: 86, w: 26, h: 34 };
const WRONG = { x: 274, y: 152 };
const HOME = { x: 322, y: 100 };

function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawRoom(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#eef3fb';
  ctx.fillRect(0, 0, W, 128);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, 128, W, 62);
  ctx.fillStyle = C.route;
  ctx.fillRect(20, 128, 408, 14);
  ctx.fillStyle = C.dark;
  ctx.fillRect(20, 142, 408, 4);
  // mug
  ctx.fillStyle = '#f0c060';
  ctx.fillRect(MUG.x, MUG.y, MUG.w, MUG.h);
  ctx.fillStyle = C.blue;
  ctx.fillRect(MUG.x + MUG.w - 4, MUG.y + 5, 4, MUG.h - 10);
  // box
  ctx.fillStyle = '#d9c48f';
  ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
  ctx.strokeStyle = C.muted;
  ctx.lineWidth = 1;
  ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#c96f3b';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawArm(ctx: CanvasRenderingContext2D, gx: number, gy: number, color: string, t: number): void {
  const baseX = 414;
  const baseY = 188;
  const shoulderX = 392;
  const shoulderY = 122;
  const elbowX = (shoulderX + gx) / 2 + 22;
  const elbowY = (shoulderY + gy) / 2 - 14;
  // base
  ctx.fillStyle = color;
  ctx.fillRect(baseX - 13, baseY - 10, 26, 20);
  ctx.fillStyle = C.dark;
  ctx.fillRect(baseX - 8, baseY - 6, 16, 6);
  // two-segment arm with visible joints
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(gx, gy);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(shoulderX, shoulderY, 6, 0, Math.PI * 2);
  ctx.arc(elbowX, elbowY, 5, 0, Math.PI * 2);
  ctx.arc(gx, gy, 4, 0, Math.PI * 2);
  ctx.fill();
  // gripper connected at the wrist
  ctx.lineWidth = 4;
  const open = 5 + Math.sin(t * 5) * 1.5;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + 9, gy - open);
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + 9, gy + open);
  ctx.stroke();
}

function drawDense(ctx: CanvasRenderingContext2D, t: number): void {
  const xs = [286, 312, 338, 364, 390, 416];
  xs.forEach((x, i) => {
    ctx.fillStyle = C.red;
    ctx.globalAlpha = 0.35 + 0.1 * i + 0.05 * Math.sin(t * 3 + i);
    ctx.fillRect(x, 26, 18, 24);
  });
  ctx.globalAlpha = 1;
  label(ctx, '全部参数每步运转', 350, 62, 10, C.red);
}

function drawExperts(ctx: CanvasRenderingContext2D, t: number): void {
  const xs = [286, 312, 338, 364, 390, 416, 442, 468];
  const active = [2, 5, 6];
  xs.forEach((x, i) => {
    const on = active.includes(i);
    ctx.fillStyle = on ? C.green : C.axis;
    ctx.globalAlpha = on ? 0.7 + 0.3 * Math.sin(t * 3 + i) : 0.45;
    ctx.fillRect(x, 26, 14, 34);
    ctx.globalAlpha = 1;
  });
  label(ctx, '约 3B 参数参与计算 / 约 30B 总参数', 372, 72, 10, C.green);
}

export const HeroCompare: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const renderOld = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawRoom(ctx);
      drawBall(ctx, BALL.x, BALL.y);
      drawArm(ctx, HOME.x, HOME.y, C.red, t);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      ctx.strokeStyle = `rgba(39,68,110,${0.45 + pulse * 0.3})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 38, 208, 100);
      const c = 12;
      ctx.beginPath();
      ctx.moveTo(36, 38 + c); ctx.lineTo(36, 38); ctx.lineTo(36 + c, 38);
      ctx.moveTo(244 - c, 38); ctx.lineTo(244, 38); ctx.lineTo(244, 38 + c);
      ctx.moveTo(36, 138 - c); ctx.lineTo(36, 138); ctx.lineTo(36 + c, 138);
      ctx.moveTo(244 - c, 138); ctx.lineTo(244, 138); ctx.lineTo(244, 138 - c);
      ctx.stroke();
      ctx.fillStyle = `rgba(196,63,82,${0.4 + pulse * 0.5})`;
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', MUG.x + MUG.w / 2, MUG.y - 10);
      ctx.fillText('?', BALL.x, BALL.y - 22);
      ctx.fillText('?', BOX.x + BOX.w / 2, BOX.y - 12);
      const gx = HOME.x;
      const gy = HOME.y;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(gx - 9, gy - 9); ctx.lineTo(gx + 9, gy + 9);
      ctx.moveTo(gx - 9, gy + 9); ctx.lineTo(gx + 9, gy - 9);
      ctx.stroke();
      drawDense(ctx, t);
      label(ctx, '只看懂画面，动作后果未知', 140, 166, 11, C.red);
      label(ctx, '算力随参数同步膨胀', 350, 100, 10, C.muted);
    };
    const renderNew = (t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawRoom(ctx);
      const p = (t % 7.5) / 7.5;
      let stage = '看懂状态';
      let stageColor = C.blue;
      let gx = HOME.x;
      let gy = HOME.y;
      let ballX = BALL.x;
      let ballY = BALL.y;
      let showBall = true;

      if (p < 0.30) {
        // 1. action-relevant state understanding: scan and label
        const s = p / 0.30;
        const scanX = 36 + s * 212;
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        ctx.fillRect(32, 38, scanX - 32, 100);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(scanX, 40);
        ctx.lineTo(scanX, 136);
        ctx.stroke();
        if (scanX > MUG.x + MUG.w) {
          ctx.strokeStyle = C.blue;
          ctx.strokeRect(MUG.x - 4, MUG.y - 4, MUG.w + 8, MUG.h + 8);
          label(ctx, '抓握点', MUG.x + MUG.w / 2, MUG.y - 14, 9, C.blue);
        }
        if (scanX > BALL.x + 14) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(BALL.x, BALL.y, 20, 0, Math.PI * 2);
          ctx.stroke();
          label(ctx, '可吸附', BALL.x, BALL.y - 30, 9, C.orange);
        }
        if (scanX > BOX.x + BOX.w) {
          ctx.strokeStyle = C.green;
          ctx.strokeRect(BOX.x - 4, BOX.y - 4, BOX.w + 8, BOX.h + 8);
          label(ctx, '放置区', BOX.x + BOX.w / 2, BOX.y - 14, 9, C.green);
        }
        gx = HOME.x;
        gy = HOME.y;
      } else if (p < 0.62) {
        // 2. action + local transition: first attempt follows a red path and fails
        stage = '动作 → 首次执行失败';
        stageColor = C.red;
        const u = ease((p - 0.30) / 0.32);
        // planned route is still shown as the expected transition
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(BALL.x, BALL.y);
        ctx.quadraticCurveTo(210, 104, BOX.x + BOX.w / 2, BOX.y + BOX.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, '预期轨迹', 206, 76, 9, C.green);
        // actual path deviates to the wrong spot
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(BALL.x, BALL.y);
        ctx.quadraticCurveTo(214, 150, WRONG.x, WRONG.y);
        ctx.stroke();
        ballX = lerp(BALL.x, WRONG.x, u);
        ballY = lerp(BALL.y, WRONG.y, u);
        gx = ballX + 24;
        gy = ballY - 18;
        if (u > 0.82) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(WRONG.x - 9, WRONG.y - 9); ctx.lineTo(WRONG.x + 9, WRONG.y + 9);
          ctx.moveTo(WRONG.x - 9, WRONG.y + 9); ctx.lineTo(WRONG.x + 9, WRONG.y - 9);
          ctx.stroke();
          label(ctx, '发现偏差', WRONG.x, WRONG.y + 22, 9, C.red);
        }
      } else {
        // 3. sequential adaptive reasoning: replan from the failure state and recover
        stage = '重规划 → 恢复';
        stageColor = C.green;
        const u = ease((p - 0.62) / 0.38);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(BALL.x, BALL.y);
        ctx.quadraticCurveTo(214, 150, WRONG.x, WRONG.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(WRONG.x - 7, WRONG.y - 7); ctx.lineTo(WRONG.x + 7, WRONG.y + 7);
        ctx.moveTo(WRONG.x - 7, WRONG.y + 7); ctx.lineTo(WRONG.x + 7, WRONG.y - 7);
        ctx.stroke();
        // corrected path
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(WRONG.x, WRONG.y);
        ctx.quadraticCurveTo(238, 130, BOX.x + BOX.w / 2, BOX.y + BOX.h / 2);
        ctx.stroke();
        ballX = lerp(WRONG.x, BOX.x + BOX.w / 2, u);
        ballY = lerp(WRONG.y, BOX.y + BOX.h / 2, u);
        gx = ballX + 24;
        gy = ballY - 18;
        if (u > 0.85) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(BOX.x + BOX.w / 2 - 7, BOX.y + BOX.h / 2 - 4);
          ctx.lineTo(BOX.x + BOX.w / 2 - 2, BOX.y + BOX.h / 2 + 3);
          ctx.lineTo(BOX.x + BOX.w / 2 + 7, BOX.y + BOX.h / 2 - 6);
          ctx.stroke();
          label(ctx, '恢复成功', BOX.x + BOX.w / 2, BOX.y - 16, 9, C.green);
        }
      }

      if (showBall) drawBall(ctx, ballX, ballY);
      drawArm(ctx, gx, gy, C.blue, t);
      drawExperts(ctx, t);
      label(ctx, stage, 140, 166, 11, stageColor);
      label(ctx, '看懂状态 · 预测变化 · 持续纠错', 140, 182, 10, C.blue);
    };
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      if (moduleId === 'old') renderOld(t);
      else renderNew(t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [moduleId]);
  return <canvas ref={ref} width={W} height={H} aria-label="旧方法与本方法对比动画" />;
};

export default HeroCompare;

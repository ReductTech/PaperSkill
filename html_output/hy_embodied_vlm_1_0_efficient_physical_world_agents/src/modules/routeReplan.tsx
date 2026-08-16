import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 300;

const STEPS = [
  { title: '按计划出发', note: '船从起点出发，沿预先规划好的蓝色航线行驶。', color: C.blue, pos: { x: 46, y: 226 }, wind: false, dist: 6.4 },
  { title: '沿计划航行', note: '前半段一切正常：模型持续对照当前观测与计划航向，偏差仍在容许带内。', color: C.blue, pos: { x: 154, y: 168 }, wind: false, dist: 4.9 },
  { title: '侧风造成偏差', note: '一股侧风把船推出容许带。模型检测到实际位置与计划不一致，标记失败。', color: C.red, pos: { x: 228, y: 198 }, wind: true, dist: 3.9 },
  { title: '发现失败，重新规划', note: '模型没有硬走旧路线，而是从当前位置重新规划一条橙色新航线。', color: C.orange, pos: { x: 304, y: 158 }, wind: false, dist: 3.1 },
  { title: '沿新航线修正', note: '船按新航线前进，偏差逐渐缩小，目标重新回到可达状态。', color: C.green, pos: { x: 416, y: 112 }, wind: false, dist: 1.3 },
  { title: '到达终点', note: '一次完整的长程任务：规划 → 执行 → 发现失败 → 重规划 → 到达。', color: C.green, pos: { x: 498, y: 66 }, wind: false, dist: 0.0 },
];

const PLANNED: Array<{ x: number; y: number }> = [
  { x: 46, y: 226 }, { x: 150, y: 164 }, { x: 250, y: 122 }, { x: 352, y: 108 }, { x: 498, y: 66 },
];
const REPLAN: Array<{ x: number; y: number }> = [
  { x: 304, y: 158 }, { x: 384, y: 124 }, { x: 498, y: 66 },
];
const CORRIDOR = 15;

function drawPath(ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, color: string, dash: number[], width = 3): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();
}

function drawCorridor(ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, radius: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(39,68,110,0.14)';
  ctx.lineWidth = radius * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();
}

function drawIsland(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#d8b26a';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, r * 0.6, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // one small tree
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = C.dark;
  ctx.beginPath();
  ctx.arc(x, y - 22, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, heading = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading + Math.sin(t * 2.2) * 0.05);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-13, 7);
  ctx.lineTo(0, -13);
  ctx.lineTo(13, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5f8f0';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, -22);
  ctx.lineTo(7, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const RouteReplan: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          setAuto(false);
          return prev;
        }
        stateRef.current.step = next;
        return next;
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, [auto]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { step: number }) => {
      const t = performance.now() / 1000;
      ctx.fillStyle = '#dcecef';
      ctx.fillRect(0, 0, W, H);
      // current field arrows (quiet water flow)
      ctx.strokeStyle = 'rgba(39,68,110,0.16)';
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row += 1) {
        const y = 70 + row * 50;
        for (let x = 30; x < W - 20; x += 56) {
          const off = Math.sin(t * 1.1 + row + x) * 3;
          ctx.beginPath();
          ctx.moveTo(x, y + off);
          ctx.lineTo(x + 12, y + off);
          ctx.moveTo(x + 8, y - 3 + off);
          ctx.lineTo(x + 12, y + off);
          ctx.lineTo(x + 8, y + 3 + off);
          ctx.stroke();
        }
      }
      // islands
      drawIsland(ctx, 180, 48, 46);
      drawIsland(ctx, 440, 214, 54);
      drawIsland(ctx, 390, 36, 30);
      // start and goal
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(46, 226, 8, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, '起点', 46, 250, 11, C.blue);
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(498, 66, 9, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, '终点', 498, 44, 11, C.green);
      // planned route corridor and path
      drawCorridor(ctx, PLANNED, CORRIDOR);
      drawPath(ctx, PLANNED, C.blue, [8, 7]);
      if (s.step >= 3) {
        drawCorridor(ctx, REPLAN, CORRIDOR - 4);
        drawPath(ctx, REPLAN, C.orange, [6, 5]);
        label(ctx, '重规划航线', 380, 148, 10, C.orange);
      }
      // actual route up to current step
      ctx.strokeStyle = s.step >= 2 ? C.red : C.green;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= s.step; i += 1) {
        const p = STEPS[i].pos;
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      // wind
      if (STEPS[s.step].wind) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(292, 236);
        ctx.lineTo(340, 210);
        ctx.lineTo(330, 204);
        ctx.moveTo(340, 210);
        ctx.lineTo(322, 200);
        ctx.stroke();
        label(ctx, '侧风', 326, 244, 11, C.red);
        ctx.strokeStyle = 'rgba(196,63,82,0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(258, 178, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, '超出容许带', 258, 214, 10, C.red);
      }
      const cur = STEPS[s.step].pos;
      const heading = s.step === 0 ? -0.65 : s.step === STEPS.length - 1 ? -0.55 : -0.5;
      drawBoat(ctx, cur.x, cur.y, STEPS[s.step].color, t, heading);
      label(ctx, `第 ${s.step + 1} / ${STEPS.length} 步 · ${STEPS[s.step].title}`, W / 2, 20, 13, STEPS[s.step].color);
      label(ctx, `距终点 ${STEPS[s.step].dist.toFixed(1)} m`, 470, 282, 10, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (v: number) => {
    setAuto(false);
    const n = Math.max(0, Math.min(STEPS.length - 1, v));
    stateRef.current.step = n;
    setStep(n);
  };

  const st = STEPS[step];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="chip" onClick={() => go(0)} disabled={step === 0}>重置</button>
        <button className="chip" onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <button className="chip" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>{step === STEPS.length - 1 ? '已到达' : '下一步'}</button>
        <button className="chip" onClick={() => {
          if (!auto && step === STEPS.length - 1) go(0);
          setAuto((prev) => !prev);
        }}>{auto ? '暂停演示' : '自动演示'}</button>
      </div>
      <div className={`feedback ${step === STEPS.length - 1 ? 'good' : step === 2 ? 'bad' : step >= 3 ? 'good' : ''}`}>
        {st.note}
      </div>
    </div>
  );
};

export default RouteReplan;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 6 章 Module 6.1：ODE 采样逐步推进（数学/技术视图，P2）
// 丰富演示：坐标轴 + 多条采样轨迹 + 速度场箭头 + 步进点轨迹 + 进度条。
// 自动/手动双模式：默认自动循环演示；点「下一步/重置」即切为手动，可再切回。
const W = 1080;
const H = 300;
const TOTAL_STEPS = 10;
const STEP_MS = 1100;     // 自动模式每步间隔
const LOOP_PAUSE = 1600;  // 走完一轮后的停留时间

const stepFeedback = (ns: number) =>
  ns >= TOTAL_STEPS
    ? { text: '采样完成，表示已恢复到干净状态（绿色），可送入解码器。', cls: 'good' }
    : ns > TOTAL_STEPS / 2
    ? { text: `第 ${ns} 步：表示已明显接近干净状态，速度场持续指向干净方向。`, cls: '' }
    : { text: `第 ${ns} 步：表示仍偏退化（红色），ODE 积分沿速度场推进。`, cls: 'bad' };

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, auto: true, last: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [feedback, setFeedback] = useState({ text: '自动演示中：ODE 采样一步步走向干净状态。点「下一步」可手动接管。', cls: '' });

  const applyStep = (ns: number) => {
    stateRef.current.step = ns;
    stateRef.current.last = performance.now();
    setStep(ns);
    setFeedback(stepFeedback(ns));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ax = 90, ay = 240, aw = 880, ah = 180;
      const sx = ax + 40, sy = ay - 40;      // 退化起点（红）
      const ex = ax + aw - 40, ey = ay - 150; // 干净终点（绿）

      // 坐标轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - ah); ctx.stroke();
      // 轴标签
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('退化 z₀', ax - 8, ay + 22);
      ctx.fillText('干净 z₁', ax + aw - 50, ay + 22);
      ctx.fillText('时间 t →', ax + aw - 90, ay - ah + 22);

      // 多条参考轨迹（虚线，展示不同采样路径）
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) {
        const bend = (k - 1.5) * 24;
        ctx.strokeStyle = 'rgba(104, 119, 143, 0.35)';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2 + bend;
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 主轨迹（蓝，直线）
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.setLineDash([]);

      // 速度场箭头（沿主轨迹等距散布，从当前点指向干净方向）
      const prog = s.step / TOTAL_STEPS;
      for (let i = 0; i < 6; i++) {
        const ft = i / 5;
        const fx = sx + (ex - sx) * ft;
        const fy = sy + (ey - sy) * ft;
        const dx = (ex - sx) / Math.hypot(ex - sx, ey - sy);
        const dy = (ey - sy) / Math.hypot(ex - sx, ey - sy);
        const alen = 18 + (1 - ft) * 16;
        const head = (ft < prog) ? '#f07e47' : 'rgba(240, 126, 71, 0.35)';
        ctx.strokeStyle = head;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + dx * alen, fy + dy * alen);
        ctx.stroke();
        // 箭头头
        const hx = fx + dx * alen, hy = fy + dy * alen;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - dx * 8 - dy * 5, hy - dy * 8 + dx * 5);
        ctx.lineTo(hx - dx * 8 + dy * 5, hy - dy * 8 - dx * 5);
        ctx.closePath();
        ctx.fillStyle = head;
        ctx.fill();
      }

      // 已走过的轨迹（实线，粗）
      if (prog > 0) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (ex - sx) * prog, sy + (ey - sy) * prog);
        ctx.stroke();
      }

      // 起终点
      ctx.fillStyle = '#c43f52';
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('退化', sx - 22, sy + 32);
      ctx.fillStyle = '#228d5c';
      ctx.beginPath(); ctx.arc(ex, ey, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('干净', ex - 18, ey + 32);

      // 当前点（z_t 标注抬高，避免压在轨迹线上）
      const cx = sx + (ex - sx) * prog;
      const cy = sy + (ey - sy) * prog;
      ctx.fillStyle = '#27446e';
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 17px "Segoe UI", sans-serif';
      ctx.fillText('z_t', cx + 18, cy - 16);

      // 进度条（底部）
      const pbX = ax, pbY = ay + 48, pbW = aw, pbH = 10;
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(pbX, pbY, pbW, pbH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pbX, pbY, pbW, pbH);
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(pbX, pbY, pbW * prog, pbH);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText(`${s.step} / ${TOTAL_STEPS} 步`, ax + aw - 150, pbY + 32);
    };

    const tick = () => {
      const s = stateRef.current;
      // 自动演示：按间隔推进，走完停留后循环
      if (s.auto) {
        const now = performance.now();
        if (s.step < TOTAL_STEPS && now - s.last >= STEP_MS) {
          applyStep(s.step + 1);
        } else if (s.step >= TOTAL_STEPS && now - s.last >= LOOP_PAUSE) {
          s.step = 0;
          s.last = now;
          setStep(0);
          setFeedback({ text: '自动演示：从头开始新一轮采样。', cls: '' });
        }
      }
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  // 手动：点「下一步」即接管（切为手动模式）
  const next = () => {
    const s = stateRef.current;
    if (s.step >= TOTAL_STEPS) return;
    if (s.auto) {
      s.auto = false;
      setAuto(false);
      setFeedback({ text: '已切换为手动模式，点击「下一步」逐步推进。', cls: '' });
      return;
    }
    applyStep(s.step + 1);
  };

  const reset = () => {
    const s = stateRef.current;
    s.auto = false;
    s.step = 0;
    s.last = performance.now();
    setAuto(false);
    setStep(0);
    setFeedback({ text: '已切换为手动并重置，点击「下一步」逐步推进。', cls: '' });
  };

  const toggleAuto = () => {
    const s = stateRef.current;
    const on = !s.auto;
    s.auto = on;
    if (on) {
      s.last = performance.now() - STEP_MS; // 立即走出第一步，演示更跟手
      setFeedback({ text: '自动演示已开启，采样将循环播放。', cls: '' });
    } else {
      setFeedback({ text: '已切换为手动模式，点击「下一步」逐步推进。', cls: '' });
    }
    setAuto(on);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${auto ? 'selected' : ''}`} onClick={toggleAuto}>
          {auto ? '自动演示：开' : '自动演示：关'}
        </button>
        <button className="chip" onClick={reset}>重置</button>
        <button className="chip selected" onClick={next} disabled={step >= TOTAL_STEPS}>
          {step >= TOTAL_STEPS ? '已完成' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;

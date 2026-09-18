import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 4 章 Module 4.1：流匹配进度 t 滑块（数学/技术视图，P1）
const W = 1080;
const H = 280;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动进度 t，观察表示沿直线从退化走向干净。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { t: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // 坐标轴
      const ax = 120, ay = 220, aw = 720, ah = 180;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + aw, ay);
      ctx.stroke();
      // 退化点（红，左）
      const degX = ax + 30, degY = ay - 30;
      // 干净点（绿，右）
      const cleanX = ax + aw - 30, cleanY = ay - 120;
      // 直线路径（蓝）
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(degX, degY);
      ctx.lineTo(cleanX, cleanY);
      ctx.stroke();
      ctx.setLineDash([]);
      // 当前插值点
      const zx = degX + (cleanX - degX) * s.t;
      const zy = degY + (cleanY - degY) * s.t;
      // 速度场箭头（从当前点指向干净点）
      const vlen = (1 - s.t) * 80;
      const dx = (cleanX - degX) / Math.hypot(cleanX - degX, cleanY - degY);
      const dy = (cleanY - degY) / Math.hypot(cleanX - degX, cleanY - degY);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(zx, zy);
      ctx.lineTo(zx + dx * vlen, zy + dy * vlen);
      ctx.stroke();
      // 箭头头
      ctx.beginPath();
      const axx = zx + dx * vlen, ayy = zy + dy * vlen;
      ctx.moveTo(axx, ayy);
      ctx.lineTo(axx - dx * 10 - dy * 6, ayy - dy * 10 + dx * 6);
      ctx.lineTo(axx - dx * 10 + dy * 6, ayy - dy * 10 - dx * 6);
      ctx.closePath();
      ctx.fillStyle = '#f07e47';
      ctx.fill();
      // 退化点
      ctx.fillStyle = '#c43f52';
      ctx.beginPath(); ctx.arc(degX, degY, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('退化', degX - 20, degY + 36);
      // 干净点
      ctx.fillStyle = '#228d5c';
      ctx.beginPath(); ctx.arc(cleanX, cleanY, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('干净', cleanX - 16, cleanY + 36);
      // 当前点
      ctx.fillStyle = '#27446e';
      ctx.beginPath(); ctx.arc(zx, zy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('z_t', zx + 14, zy - 10);
      // t 值
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText('t = ' + s.t.toFixed(2), ax + aw - 160, ay + 50);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.t = v;
    setT(v);
    setFeedback(
      v < 0.3
        ? { text: '接近退化表示，仍带着模糊的结构。', cls: 'bad' }
        : v < 0.7
        ? { text: '正在跨过流匹配路径，速度场指向干净方向。', cls: '' }
        : { text: '逼近干净表示，结构已恢复。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          流匹配进度 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;

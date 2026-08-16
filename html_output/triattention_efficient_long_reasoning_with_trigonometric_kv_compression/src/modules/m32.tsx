import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const N = 20;
const ROT_SPAN = Math.PI * 2 * 0.95;

// 每个向量：基础方向（旋转前落在很窄的夹角内）+ 按位置分配的旋转量
function baseDir(i: number): number {
  return -1.15 + ((i % 5) - 2) * 0.12;
}
function rotOffset(i: number): number {
  return (i / N) * ROT_SPAN;
}
function vecLen(i: number): number {
  return 42 + (i % 4) * 4;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12): void {
  c.fillStyle = '#ffffff';
  roundRect(c, x, y, w, h, r);
  c.fill();
  c.strokeStyle = '#d7deea';
  c.lineWidth = 1;
  roundRect(c, x, y, w, h, r);
  c.stroke();
}

function drawArrow(
  c: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lw = 3,
  head = 9
): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.strokeStyle = color;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - head * Math.cos(ang - 0.42), y2 - head * Math.sin(ang - 0.42));
  c.lineTo(x2 - head * Math.cos(ang + 0.42), y2 - head * Math.sin(ang + 0.42));
  c.closePath();
  c.fill();
}

function pill(c: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string): void {
  c.font = 'bold 12px ' + FONT;
  const w = c.measureText(text).width + 16;
  c.fillStyle = bg;
  roundRect(c, x, y, w, 22, 11);
  c.fill();
  c.fillStyle = fg;
  c.textAlign = 'left';
  c.fillText(text, x + 8, y + 15);
}

export const M32: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点击开始，观察同一批向量在旋转前后的差别。', cls: 'guide' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { running: boolean; t: number }) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);
      const spread = Math.min(1, s.t / (Math.PI * 2));

      // 左面板：旋转前（聚集）
      panel(c, 16, 14, 252, 212);
      pill(c, '旋转前', 30, 28, 'rgba(34, 141, 92, 0.12)', '#228d5c');
      c.textAlign = 'left';
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText('方向一致，向量聚集', 30, 68);
      const cx1 = 142, cy1 = 158;
      for (let i = 0; i < N; i++) {
        const a = baseDir(i);
        const len = vecLen(i);
        drawArrow(c, cx1, cy1, cx1 + Math.cos(a) * len, cy1 + Math.sin(a) * len, '#27446e', 2.5, 7);
      }
      c.fillStyle = '#27446e';
      c.beginPath(); c.arc(cx1, cy1, 3.5, 0, Math.PI * 2); c.fill();
      pill(c, 'R ≈ 0.97（聚集）', 30, 196, 'rgba(34, 141, 92, 0.12)', '#228d5c');

      // 右面板：旋转后（散开）
      panel(c, 292, 14, 252, 212);
      pill(c, '旋转后', 306, 28, 'rgba(217, 119, 6, 0.14)', '#d97706');
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText('方向按位置旋转，散成圆弧', 306, 68);
      const cx2 = 418, cy2 = 158;
      c.strokeStyle = '#eef1f5';
      c.lineWidth = 1;
      c.beginPath(); c.arc(cx2, cy2, 64, 0, Math.PI * 2); c.stroke();
      if (s.t > 0.03) {
        c.strokeStyle = '#d97706';
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath(); c.arc(cx2, cy2, 52, 0, s.t); c.stroke();
      }
      for (let k = 0; k < 14; k++) {
        const ga = s.t - k * 0.07;
        if (ga < 0.02) break;
        c.fillStyle = 'rgba(217, 119, 6, ' + Math.max(0.05, 0.4 - k * 0.026).toFixed(3) + ')';
        c.beginPath(); c.arc(cx2 + Math.cos(ga) * 52, cy2 + Math.sin(ga) * 52, 2.6, 0, Math.PI * 2); c.fill();
      }
      const angs: number[] = [];
      const lens: number[] = [];
      for (let i = 0; i < N; i++) {
        const a = baseDir(i) + rotOffset(i) * spread + s.t;
        const len = vecLen(i);
        angs.push(a); lens.push(len);
        drawArrow(c, cx2, cy2, cx2 + Math.cos(a) * len, cy2 + Math.sin(a) * len, '#d97706', 2.5, 7);
      }
      c.fillStyle = '#d97706';
      c.beginPath(); c.arc(cx2, cy2, 3.5, 0, Math.PI * 2); c.fill();
      let sx = 0, sy = 0, sl = 0;
      angs.forEach((a, i) => { sx += Math.cos(a) * lens[i]; sy += Math.sin(a) * lens[i]; sl += lens[i]; });
      const R = Math.hypot(sx, sy) / Math.max(sl, 1e-6);
      const good = R >= 0.7;
      pill(c, 'R ≈ ' + R.toFixed(2), 306, 196, good ? 'rgba(34, 141, 92, 0.12)' : 'rgba(196, 63, 82, 0.10)', good ? '#228d5c' : '#c43f52');
    };

    let last = 0;
    const tick = (ts: number) => {
      const s = stateRef.current;
      if (s.running) {
        s.t = Math.min(Math.PI * 2, s.t + ((ts - last) / 1000) * 2.1);
      }
      last = ts;
      render(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onStart = () => {
    if (stateRef.current.running) return;
    stateRef.current.t = 0;
    stateRef.current.running = true;
    setRunning(true);
    setFeedback({ text: '旋转前（左）始终聚集；旋转后（右）方向按位置旋转，散成圆弧。', cls: 'good' });
    window.setTimeout(() => {
      stateRef.current.running = false;
      setRunning(false);
      setFeedback({ text: '对比完成：同一批向量，旋转前聚集、旋转后散开。', cls: 'good' });
    }, 3200);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={onStart} disabled={running}>开始旋转 ▶</button>
        <span>同一批向量 · 同步时间轴</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M32;
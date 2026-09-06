import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const OMEGA = 0.06; // 每单位位置的旋转角（弧度）

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ pq: 30, pk: 30 });
  const [pq, setPq] = useState(30);
  const [pk, setPk] = useState(30);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const arrow = (x1: number, y1: number, a: number, len: number, color: string, lw: number) => {
      const x2 = x1 + Math.cos(a) * len;
      const y2 = y1 + Math.sin(a) * len;
      c.strokeStyle = color;
      c.lineWidth = lw;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x2, y2);
      c.lineTo(x2 - 6 * Math.cos(a - 0.4), y2 - 6 * Math.sin(a - 0.4));
      c.lineTo(x2 - 6 * Math.cos(a + 0.4), y2 - 6 * Math.sin(a + 0.4));
      c.closePath();
      c.fill();
    };

    const render = (s: { pq: number; pk: number }) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);

      // 顶部标题
      c.fillStyle = '#21324a';
      c.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText('拖动 Q/K 位置，看点积随距离变化', 24, 26);

      const aq = OMEGA * s.pq;
      const ak = OMEGA * s.pk;
      const delta = Math.abs(s.pq - s.pk);
      const angle = OMEGA * delta;
      const dot = Math.cos(angle);

      // 左：表盘
      const cx = 150, cy = 128, r = 80;
      c.strokeStyle = '#d7deea';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(cx - r, cy); c.lineTo(cx + r, cy); c.stroke();
      c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx, cy + r); c.stroke();
      arrow(cx, cy, ak, 62, '#d97706', 3);
      arrow(cx, cy, aq, 70, '#27446e', 3);
      c.fillStyle = '#d97706';
      c.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText('K', cx + Math.cos(ak) * 76, cy + Math.sin(ak) * 76 + 4);
      c.fillStyle = '#27446e';
      c.fillText('Q', cx + Math.cos(aq) * 84, cy + Math.sin(aq) * 84 + 4);
      // 夹角弧
      if (angle > 0.05) {
        c.strokeStyle = '#228d5c';
        c.lineWidth = 2;
        c.beginPath(); c.arc(cx, cy, 34, Math.min(aq, ak), Math.max(aq, ak), false); c.stroke();
      }
      c.fillStyle = '#68778f';
      c.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText('夹角 = ω·Δ', cx - 42, cy + 96);

      // 右：数值面板
      c.fillStyle = '#ffffff';
      c.fillRect(300, 40, 236, 170);
      c.strokeStyle = '#d7deea';
      c.lineWidth = 1.5;
      c.strokeRect(300, 40, 236, 170);
      c.fillStyle = '#21324a';
      c.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText('旋转后的点积', 318, 66);
      const rows: [string, string][] = [
        ['距离 Δ', String(delta)],
        ['夹角 ω·Δ', (angle * 57.3).toFixed(1) + '°'],
        ['点积 Q·K', dot.toFixed(3)],
      ];
      rows.forEach(([k, v], i) => {
        const y = 96 + i * 34;
        c.fillStyle = '#68778f';
        c.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        c.fillText(k, 318, y);
        c.fillStyle = i === 2 ? (dot > 0.5 ? '#228d5c' : dot > 0 ? '#d97706' : '#c43f52') : '#21324a';
        c.font = 'bold 14px "Segoe UI", "PingFang SC", sans-serif';
        c.fillText(v, 430, y);
        if (i === 2) {
          const bw = clamp(dot, 0, 1) * 180;
          c.fillStyle = '#eef1f5';
          c.fillRect(318, y + 6, 180, 10);
          c.fillStyle = dot > 0.5 ? '#228d5c' : dot > 0 ? '#d97706' : '#c43f52';
          c.fillRect(318, y + 6, Math.max(0, bw), 10);
        }
      });
      c.fillStyle = '#8a93a6';
      c.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText('点积 ≈ cos(ω·Δ)，只由相对距离决定', 318, 196);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setPQ = (v: number) => { stateRef.current.pq = v; setPq(v); };
  const setPK = (v: number) => { stateRef.current.pk = v; setPk(v); };

  const delta = Math.abs(pq - pk);
  const dot = Math.cos(OMEGA * delta);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>Q 位置 <span className="val">{pq}</span></label>
        <input type="range" min={0} max={60} value={pq} onChange={(e) => setPQ(Number(e.target.value))} style={{ flex: 1 }} />
        <label>K 位置 <span className="val">{pk}</span></label>
        <input type="range" min={0} max={60} value={pk} onChange={(e) => setPK(Number(e.target.value))} style={{ flex: 1 }} />
      </div>
      <div className="ctrl">
        <button className="chip" onClick={() => { setPQ(31); setPK(30); }}>预设 Δ=1（相邻）</button>
        <button className="chip" onClick={() => { setPQ(60); setPK(10); }}>预设 Δ=50（很远）</button>
        <button className="chip" onClick={() => { setPQ(30); setPK(30); }}>重置</button>
      </div>
      <div className={`feedback ${dot > 0.5 ? 'good' : dot > 0 ? 'guide' : 'bad'}`}>
        {delta === 0 ? '距离为 0：Q 和 K 方向一致，点积最大。' : dot > 0.5 ? `距离 Δ=${delta}：夹角小，点积 ${dot.toFixed(2)}，注意力高。` : dot > 0 ? `距离 Δ=${delta}：夹角变大，点积 ${dot.toFixed(2)}，注意力降低。` : `距离 Δ=${delta}：夹角接近 180°，点积 ${dot.toFixed(2)}，几乎不被关注。`}
      </div>
    </div>
  );
};

export default M21;
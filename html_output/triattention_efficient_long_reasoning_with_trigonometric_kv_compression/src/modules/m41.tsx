import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const FREQS = [1.0, 2.2, 3.8];
const WAVE = ['#c7cfda', '#6f8fc7', '#e0a05a'];
const SUM = '#21324a';
const HEADS = [
  { id: 'A', type: '近距偏好', mean: '峰值在近距离 → 主要关注相邻 token（局部上下文）', w: [1.0, 0.5, 0.2], ph: [0.3, 1.2, 2.0] },
  { id: 'B', type: '远距偏好', mean: '峰值在远距离 → 检索远处关键 token（长程依赖）', w: [0.3, 0.6, 1.0], ph: [1.0, 2.2, 3.0] },
  { id: 'C', type: '多峰', mean: '在多个距离有峰 → 同时关注几个距离', w: [0.6, 0.9, 0.5], ph: [0.0, 2.4, 0.7] },
];

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const sRef = useRef({ delta: 5, nf: 3, head: 0 });
  const [delta, setDelta] = useState(5);
  const [nf, setNf] = useState(3);
  const [head, setHead] = useState(0);

  const sumAt = (d: number, hd: (typeof HEADS)[number]) => {
    let s = 0, tw = 0;
    hd.w.forEach((w, k) => { s += w * Math.cos(FREQS[k] * d + hd.ph[k]); tw += w; });
    return s / Math.max(tw, 1e-6); // -1..1
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { delta: number; nf: number; head: number }) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);
      const hd = HEADS[s.head];

      // 顶部标题
      c.fillStyle = '#21324a';
      c.font = 'bold 14px ' + FONT;
      c.textAlign = 'left';
      c.fillText('频率 → 叠加 → 距离偏好', 20, 24);

      // 曲线面板
      const bx = 24, by = 168, bw = 500, bh = 108;
      c.fillStyle = '#ffffff';
      c.fillRect(bx - 6, by - bh - 8, bw + 12, bh + 24);
      c.strokeStyle = '#d7deea';
      c.lineWidth = 1.5;
      c.strokeRect(bx - 6, by - bh - 8, bw + 12, bh + 24);
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.stroke();
      c.fillStyle = '#68778f';
      c.font = '11px ' + FONT;
      c.fillText('距离 Δ', bx + bw - 42, by + 14);

      const xOf = (d: number) => bx + (d / 12) * bw;
      const yOf = (v: number) => by - ((v * 0.5 + 0.5) * (bh - 14) + 7);

      // 单频波
      const drawWave = (i: number, color: string, lw: number, sum: boolean) => {
        c.strokeStyle = color;
        c.lineWidth = lw;
        c.beginPath();
        for (let d = 0; d <= 12.01; d += 0.15) {
          let v: number;
          if (sum) v = sumAt(d, hd);
          else v = Math.cos(FREQS[i] * d + hd.ph[i]);
          const x = xOf(d), y = yOf(v);
          if (d === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      };
      for (let i = 0; i < s.nf; i++) drawWave(i, WAVE[i], 1.2, false);
      drawWave(0, SUM, 2.6, true);

      // 距离标记：竖线 + 曲线上的点 + 注意力读数
      const att = (sumAt(s.delta, hd) + 1) / 2;
      const mx = xOf(s.delta), my = yOf(sumAt(s.delta, hd));
      c.strokeStyle = '#d97706';
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(mx, by - bh + 2); c.lineTo(mx, by); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#d97706';
      c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.stroke();
      const lbl = 'Δ=' + s.delta + ' → 注意力 ' + att.toFixed(2);
      const lw2 = c.measureText(lbl).width + 16;
      c.fillStyle = '#fdf3e7';
      c.beginPath();
      const lx = Math.min(Math.max(mx - lw2 / 2, bx), bx + bw - lw2);
      c.roundRect ? c.roundRect(lx, by - bh - 24, lw2, 18, 9) : c.rect(lx, by - bh - 24, lw2, 18);
      c.fill();
      c.fillStyle = '#7c4a03';
      c.font = '11px ' + FONT;
      c.fillText(lbl, lx + 8, by - bh - 10);

      // 频率图例
      c.fillStyle = '#8a93a6';
      c.font = '11px ' + FONT;
      c.fillText('灰/蓝/橙 = 单个频率的余弦，黑 = 叠加和（三角级数）', bx, by + 32);
      c.fillStyle = '#68778f';
      c.font = '11px ' + FONT;
      c.fillText('频率 = 旋转速度：低频周期长、影响远处；高频周期短、影响近处', bx, by + 48);

      // 头部含义
      c.fillStyle = '#21324a';
      c.font = 'bold 12px ' + FONT;
      c.fillText('头部 ' + hd.id + '（' + hd.type + '）', bx, by + 70);
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText(hd.mean, bx + 96, by + 70);
    };

    const tick = () => {
      render(sRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onDelta = (v: number) => { sRef.current.delta = v; setDelta(v); };
  const onNf = (v: number) => { sRef.current.nf = v; setNf(v); };
  const onHead = (v: number) => { sRef.current.head = v; setHead(v); };

  const hd = HEADS[head];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>距离 Δ <span className="val">{delta}</span></label>
        <input type="range" min={0} max={12} value={delta} onChange={(e) => onDelta(Number(e.target.value))} style={{ flex: 1 }} />
      </div>
      <div className="ctrl">
        <span style={{ fontSize: 13, color: '#68778f' }}>频带数</span>
        {[1, 2, 3].map((n) => (
          <button key={n} className="chip" style={nf === n ? { borderColor: '#27446e', background: '#27446e', color: '#fff' } : undefined} onClick={() => onNf(n)}>{n}</button>
        ))}
        <span style={{ fontSize: 13, color: '#68778f', marginLeft: 8 }}>头部</span>
        {HEADS.map((h, i) => (
          <button key={h.id} className="chip" style={head === i ? { borderColor: '#27446e', background: '#27446e', color: '#fff' } : undefined} onClick={() => onHead(i)}>{h.id} {h.type}</button>
        ))}
      </div>
      <div className={`feedback guide`}>
        频带数 1→2→3 看叠加过程；移动距离标记，读该距离 Key 的注意力；切换头部 {hd.id}（{hd.type}）：{hd.mean}。
      </div>
    </div>
  );
};

export default M41;
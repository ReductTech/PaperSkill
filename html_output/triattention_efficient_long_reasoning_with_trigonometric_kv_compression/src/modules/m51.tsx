import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', ORANGE = '#d97706', GREEN = '#228d5c', INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';
const KEYS = [1, 3, 5, 8, 11]; // 各 Key 的距离
const att = (d: number) => clamp(0.55 + 0.42 * Math.cos(1.3 * d + 0.5), 0.02, 1);

// 7.1：距离偏好分 S_trig —— 用 Q 中心代表未来查询，把 Key 的距离代进曲线读出分数。
export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selRef = useRef(0);
  const [sel, setSel] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);
      c.fillStyle = INK;
      c.font = 'bold 14px ' + FONT;
      c.textAlign = 'left';
      c.fillText('S_trig：用 Q 中心从曲线读出未来关注度', 20, 26);

      // 左面板：注意力-距离曲线
      const bx = 36, by = 196, bw = 272, bh = 140;
      c.fillStyle = '#ffffff';
      c.fillRect(bx - 12, by - bh - 12, bw + 24, bh + 30);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(bx - 12, by - bh - 12, bw + 24, bh + 30);
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.stroke();
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - bh); c.stroke();
      c.fillStyle = MUT;
      c.font = '11px ' + FONT;
      c.fillText('距离 Δ', bx + bw - 30, by + 14);
      c.fillText('注意力', bx - 30, by - bh - 4);

      // 曲线
      c.strokeStyle = BLUE;
      c.lineWidth = 2.5;
      c.beginPath();
      for (let d = 0; d <= 12.01; d += 0.1) {
        const x = bx + (d / 12) * bw;
        const y = by - att(d) * (bh - 16);
        if (d === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();

      // 选中 Key 的标记
      const d0 = KEYS[selRef.current];
      const mx = bx + (d0 / 12) * bw;
      const my = by - att(d0) * (bh - 16);
      c.strokeStyle = ORANGE;
      c.lineWidth = 2;
      c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(mx, by - bh); c.lineTo(mx, by); c.stroke();
      c.setLineDash([]);
      c.fillStyle = ORANGE;
      c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 2;
      c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.stroke();

      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('Q 中心 = 未来查询的代表', bx - 12, by + 24);

      // 右面板：Key 列表 + S_trig
      const px = 326, py = 40, pw = 218, ph = 170;
      c.fillStyle = '#ffffff';
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(px, py, pw, ph);
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText('每个 Key 的 S_trig', px + 12, py + 24);
      KEYS.forEach((d, i) => {
        const y = py + 40 + i * 26;
        const active = i === selRef.current;
        c.fillStyle = active ? '#eef3fb' : '#fff';
        c.fillRect(px + 10, y, 198, 22);
        c.strokeStyle = active ? BLUE : LINE;
        c.lineWidth = active ? 1.5 : 1;
        c.strokeRect(px + 10, y, 198, 22);
        c.fillStyle = INK;
        c.font = '12px ' + FONT;
        c.fillText('K' + (i + 1) + '（Δ=' + d + '）', px + 18, y + 15);
        c.fillStyle = GREEN;
        c.font = 'bold 12px ' + FONT;
        c.fillText(att(d).toFixed(2), px + 168, y + 15);
      });
      c.fillStyle = MUT;
      c.font = '11px ' + FONT;
      c.fillText('曲线高度 = S_trig', px + 12, py + ph + 18);

      // 底部说明
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('K3 在 Δ=5 附近，曲线最高 → S_trig 最高', 20, H - 10);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onSel = (i: number) => { selRef.current = i; setSel(i); setAuto(false); };
  const onAuto = () => {
    setAuto(true);
    let i = 0;
    const timer = window.setInterval(() => {
      selRef.current = i % KEYS.length;
      setSel(selRef.current);
      i++;
      if (i > KEYS.length) { window.clearInterval(timer); setAuto(false); }
    }, 900);
  };

  const d0 = KEYS[sel];
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {KEYS.map((d, i) => (
          <button key={d} className="chip" style={sel === i ? { borderColor: BLUE, background: BLUE, color: '#fff' } : undefined} onClick={() => onSel(i)}>K{i + 1} Δ={d}</button>
        ))}
        <button className="chip" onClick={onAuto} disabled={auto}>依次读分 ▶</button>
      </div>
      <div className="feedback guide">
        K{sel + 1} 在距离 Δ={d0}，曲线高度 {att(d0).toFixed(2)} → S_trig = {att(d0).toFixed(2)}。未来查询还没出现，用 Q 中心代替它来读分。
      </div>
    </div>
  );
};

export default M51;
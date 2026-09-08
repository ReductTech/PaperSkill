import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', ORANGE = '#d97706', PURPLE = '#7c3aed', INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';
const QDIR = -0.55;
const KEYS = [
  { id: 'V1', dir: 0.95, len: 0.9, note: '方向好、长度长：两个分数都高' },
  { id: 'V2', dir: 0.8, len: 0.25, note: '方向较好但很短：S_trig 较高、S_norm 低，综合分被拉低' },
  { id: 'V3', dir: 0.25, len: 0.85, note: '方向差但较长：靠 S_norm 补回一些' },
  { id: 'V4', dir: 0.55, len: 0.55, note: '方向与长度都中等' },
];

const label = (c: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, font: string) => {
  c.font = font;
  const w = c.measureText(text).width;
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.strokeStyle = '#e3e8ef';
  c.lineWidth = 1;
  const r = 6, h = 18;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w + r, y);
  c.arcTo(x + w + 2 * r, y, x + w + 2 * r, y + h, r);
  c.lineTo(x + w + 2 * r, y + h);
  c.arcTo(x + w + 2 * r, y + h, x + w + r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + h - r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = fill;
  c.fillText(text, x + r, y + 14);
};

// 7.2：范数分 S_norm —— 向量长度是补充信号：注意力 = 方向 × 大小，向量短则贡献小。
export const M52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selRef = useRef(1);
  const [sel, setSel] = useState(1);

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

    const render = () => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);
      c.fillStyle = INK;
      c.font = 'bold 14px ' + FONT;
      c.textAlign = 'left';
      c.fillText('S_norm：向量长度补上方向看走眼的缺口', 20, 26);

      // 左面板
      const bx = 20, by = 212, bw = 290, bh = 156;
      c.fillStyle = '#ffffff';
      c.fillRect(bx, by - bh, bw, bh);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(bx, by - bh, bw, bh);
      const cx = bx + 96, cy = by - 66;
      // Q 中心方向参考线
      c.strokeStyle = ORANGE;
      c.lineWidth = 2;
      c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(QDIR) * 108, cy + Math.sin(QDIR) * 108); c.stroke();
      c.setLineDash([]);
      label(c, 'Q 中心方向', cx + Math.cos(QDIR) * 108 - 34, cy + Math.sin(QDIR) * 108 - 26, ORANGE, 'bold 12px ' + FONT);
      // Key 向量
      KEYS.forEach((k, i) => {
        const a = QDIR + (1 - k.dir) * 1.25;
        const len = 26 + k.len * 66;
        const active = i === selRef.current;
        const tx = cx + Math.cos(a) * (len + 12);
        const ty = cy + Math.sin(a) * (len + 12);
        arrow(cx, cy, a, len, active ? BLUE : '#9fb0c8', active ? 3 : 2);
        label(c, k.id, tx - 10, ty - 13, active ? BLUE : MUT, '12px ' + FONT);
      });
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('箭头越长 = 向量越大', bx + 8, cy + 28);
      c.fillStyle = '#8a93a6';
      c.font = '11px ' + FONT;
      c.fillText('注意力 = 方向 × 大小：向量短 → 信息少、贡献小', bx + 8, by - 10);

      // 右面板：三个分数
      const px = 326, py = 40, pw = 218, ph = 176;
      c.fillStyle = '#ffffff';
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(px, py, pw, ph);
      const k = KEYS[selRef.current];
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText(k.id + ' 的三个分数', px + 12, py + 24);
      const rows: [string, number, string][] = [
        ['S_trig 距离偏好分', k.dir, BLUE],
        ['S_norm 范数分', k.len, PURPLE],
        ['综合分', (k.dir + k.len) / 2, '#228d5c'],
      ];
      rows.forEach(([rlabel, v, color], i) => {
        const y = py + 42 + i * 42;
        c.fillStyle = MUT;
        c.font = '12px ' + FONT;
        c.fillText(rlabel, px + 12, y);
        c.fillStyle = '#eef1f5';
        c.fillRect(px + 12, y + 6, 194, 12);
        c.fillStyle = color;
        c.fillRect(px + 12, y + 6, 194 * v, 12);
        c.fillStyle = INK;
        c.font = 'bold 12px ' + FONT;
        c.fillText(v.toFixed(2), px + 12, y + 34);
      });
      c.fillStyle = MUT;
      c.font = '11px ' + FONT;
      c.fillText('点击左侧向量查看', px + 12, py + ph - 8);
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

  const onSel = (i: number) => { selRef.current = i; setSel(i); };
  const k = KEYS[sel];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {KEYS.map((kk, i) => (
          <button key={kk.id} className="chip" style={sel === i ? { borderColor: BLUE, background: BLUE, color: '#fff' } : undefined} onClick={() => onSel(i)}>{kk.id}</button>
        ))}
      </div>
      <div className="feedback guide">
        {k.note}。为什么向量长度是补充信号：注意力点积 = 方向 × 大小，向量短说明这个 Key 携带的信息量小、对输出贡献小，只看方向会高估它。
      </div>
    </div>
  );
};

export default M52;
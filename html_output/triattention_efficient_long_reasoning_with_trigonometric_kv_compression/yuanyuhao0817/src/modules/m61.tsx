import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BLUE = '#27446e', GREEN = '#228d5c', ORANGE = '#d97706', RED = '#c43f52';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea';

// 注意力随未来偏移 δ 的变化：近处变化快、远处趋于平缓
const att = (d: number) => 0.85 * Math.exp(-d / 2.5) + 0.15;
const LINEAR = [1, 3, 5, 7, 9, 11, 13, 15];
const GEO = [1, 2, 4, 8, 16];

// 8.1：未来偏移量 —— 为什么用几何间隔：近密远疏，捕捉近处注意力快速变化。
export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'geo' | 'linear'>('geo');
  const modeRef = useRef<'geo' | 'linear'>('geo');

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
      c.fillText('未来偏移量：近处变化快，采样要密', 20, 26);

      const bx = 40, by = 200, bw = 300, bh = 150;
      const dmax = 16;

      // 左面板：注意力-偏移曲线 + 采样点
      c.fillStyle = '#ffffff';
      c.fillRect(bx - 12, by - bh - 14, bw + 24, bh + 34);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(bx - 12, by - bh - 14, bw + 24, bh + 34);
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by); c.stroke();
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - bh); c.stroke();
      c.fillStyle = MUT;
      c.font = '11px ' + FONT;
      c.fillText('未来偏移 δ', bx + bw - 52, by + 16);
      c.fillText('注意力', bx - 34, by - bh - 8);

      // 近处变化快区域
      c.fillStyle = 'rgba(217, 119, 6, 0.10)';
      c.fillRect(bx, by - bh, (4 / dmax) * bw, bh);

      // 曲线
      c.strokeStyle = BLUE;
      c.lineWidth = 2.5;
      c.beginPath();
      for (let d = 0; d <= dmax; d += 0.1) {
        const x = bx + (d / dmax) * bw;
        const y = by - att(d) * bh;
        if (d === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();

      // 采样点
      const pts = modeRef.current === 'geo' ? GEO : LINEAR;
      const color = modeRef.current === 'geo' ? GREEN : ORANGE;
      pts.forEach((d) => {
        const x = bx + (d / dmax) * bw;
        const y = by - att(d) * bh;
        c.fillStyle = color;
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.setLineDash([2, 3]);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, by); c.stroke();
        c.setLineDash([]);
      });

      // 右面板：解释
      const px = 360, py = 40, pw = 184, ph = 170;
      c.fillStyle = '#ffffff';
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = LINE;
      c.lineWidth = 1.5;
      c.strokeRect(px, py, pw, ph);
      c.fillStyle = INK;
      c.font = 'bold 13px ' + FONT;
      c.fillText(modeRef.current === 'geo' ? '几何间隔' : '线性间隔', px + 12, py + 24);
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      const lines = modeRef.current === 'geo'
        ? ['采样点：1、2、4、8、16…', '近处密集，远处稀疏', '正好覆盖注意力变化快', '的近处区域', '']
        : ['采样点：1、3、5、7…', '处处等距', '近处太疏，漏掉变化', '最剧烈的部分', '误差大'];
      lines.forEach((ln, i) => c.fillText(ln, px + 12, py + 46 + i * 20));
      c.fillStyle = modeRef.current === 'geo' ? GREEN : RED;
      c.font = 'bold 12px ' + FONT;
      c.fillText(modeRef.current === 'geo' ? '几何 45.8% ✓' : '线性 28.7% ✗', px + 12, py + ph - 22);
      c.fillStyle = '#8a93a6';
      c.font = '11px ' + FONT;
      c.fillText('AIME24 精度（附录 Table E）', px + 12, py + ph - 6);

      // 底部说明
      c.fillStyle = MUT;
      c.font = '12px ' + FONT;
      c.fillText('切换两种间隔，看采样点如何覆盖注意力曲线', 20, H - 10);
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

  const onMode = (m: 'geo' | 'linear') => { modeRef.current = m; setMode(m); };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" style={mode === 'geo' ? { borderColor: GREEN, background: GREEN, color: '#fff' } : undefined} onClick={() => onMode('geo')}>几何间隔（近密远疏）</button>
        <button className="chip" style={mode === 'linear' ? { borderColor: ORANGE, background: ORANGE, color: '#fff' } : undefined} onClick={() => onMode('linear')}>线性间隔（处处等距）</button>
      </div>
      <div className={`feedback ${mode === 'geo' ? 'good' : 'bad'}`}>
        {mode === 'geo'
          ? '注意力在近处变化最快，几何间隔 1、2、4、8、16 在近处密集采样，覆盖得更好——论文里几何间隔精度 45.8%，远高于线性间隔的 28.7%。'
          : '线性间隔处处等距，近处太疏，漏掉注意力变化最剧烈的部分——论文里线性间隔精度只有 28.7%。'}
      </div>
    </div>
  );
};

export default M61;
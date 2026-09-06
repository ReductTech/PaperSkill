import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const CX = 156, CY = 150;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const MEAN_A = -0.7; // 聚集后所有方向的共同朝向
// 14 个向量点：分散时落在不同角度、不同半径的圆环上
const OFF: { a: number; r: number }[] = [];
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2;
  const r = 26 + (i % 5) * 10;
  OFF.push({ a, r });
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

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [t, setT] = useState(0.5); // 0 分散, 1 聚集
  const tRef = useRef(0.5);

  // 聚集度 t 越大，方向越收向共同朝向，半径也向内收缩，R 随之升高。
  const points = () =>
    OFF.map(({ a, r }) => {
      const ang = lerp(a, MEAN_A, tRef.current);
      const rr = lerp(r, r * 0.22, tRef.current);
      return [CX + Math.cos(ang) * rr, CY + Math.sin(ang) * rr] as [number, number];
    });
  const calcR = () => {
    const pts = points();
    let mx = 0, my = 0, ml = 0;
    pts.forEach(([x, y]) => {
      mx += x - CX; my += y - CY; ml += Math.hypot(x - CX, y - CY);
    });
    const n = pts.length;
    mx /= n; my /= n; ml /= n;
    return clamp(Math.hypot(mx, my) / Math.max(ml, 1e-6), 0, 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let c: CanvasRenderingContext2D;
    try { c = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const tNow = tRef.current;
      const R = calcR();
      const state = tNow > 0.6 ? 'good' : tNow < 0.4 ? 'bad' : 'mid';
      const stateColor = state === 'good' ? '#228d5c' : state === 'bad' ? '#c43f52' : '#27446e';
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f5f8f0';
      c.fillRect(0, 0, W, H);

      // 左面板：点云
      panel(c, 16, 14, 280, 212);
      c.textAlign = 'left';
      c.fillStyle = '#21324a';
      c.font = 'bold 14px ' + FONT;
      c.fillText('Q/K 向量点云', 30, 36);
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText('拖动滑块改变聚集程度', 30, 55);

      [30, 46, 60, 72].forEach((rr, i) => {
        c.strokeStyle = i === 3 ? '#d7deea' : '#eef1f5';
        c.lineWidth = 1;
        c.beginPath(); c.arc(CX, CY, rr, 0, Math.PI * 2); c.stroke();
      });

      const pts = points();
      pts.forEach(([x, y]) => {
        c.fillStyle = '#27446e';
        c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.stroke();
      });

      c.strokeStyle = '#d97706';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(CX - 12, CY); c.lineTo(CX + 12, CY); c.stroke();
      c.beginPath(); c.moveTo(CX, CY - 12); c.lineTo(CX, CY + 12); c.stroke();
      const lbl = 'Q/K 中心';
      c.font = '11px ' + FONT;
      const lw = c.measureText(lbl).width + 10;
      c.fillStyle = '#fdf3e7';
      roundRect(c, CX - 14 - lw, CY - 26, lw, 18, 9);
      c.fill();
      c.fillStyle = '#d97706';
      c.fillText(lbl, CX - 14 - lw + 5, CY - 13);

      const statusText = state === 'good' ? '向量集中在中心附近（聚集）' : state === 'bad' ? '向量散在圆环上（分散）' : '向量介于分散与聚集之间';
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText(statusText, 30, 208);

      // 右面板：R 值
      panel(c, 306, 14, 238, 212);
      c.fillStyle = '#21324a';
      c.font = 'bold 14px ' + FONT;
      c.fillText('聚集度 R', 320, 36);
      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText('由 14 个向量的方向计算', 320, 55);

      c.fillStyle = stateColor;
      c.font = 'bold 28px ' + FONT;
      c.fillText('R = ' + R.toFixed(2), 320, 92);

      const barX = 320, barY = 108, barW = 206, barH = 14;
      c.fillStyle = '#eef1f5';
      roundRect(c, barX, barY, barW, barH, 7);
      c.fill();
      c.fillStyle = stateColor;
      const fillW = Math.max(8, barW * R);
      roundRect(c, barX, barY, fillW, barH, 7);
      c.fill();
      c.strokeStyle = '#d7deea';
      c.lineWidth = 1;
      roundRect(c, barX, barY, barW, barH, 7);
      c.stroke();
      c.fillStyle = '#8a93a6';
      c.font = '10px ' + FONT;
      c.fillText('0', barX, barY + barH + 14);
      c.fillText('1', barX + barW - 5, barY + barH + 14);
      c.fillStyle = stateColor;
      c.beginPath();
      c.moveTo(barX + fillW, barY - 4);
      c.lineTo(barX + fillW - 5, barY - 11);
      c.lineTo(barX + fillW + 5, barY - 11);
      c.closePath();
      c.fill();

      c.fillStyle = '#68778f';
      c.font = '12px ' + FONT;
      c.fillText('R 越接近 1 越聚集', 320, 150);
      c.fillStyle = stateColor;
      c.fillText(state === 'good' ? '当前：聚集，中心可靠' : state === 'bad' ? '当前：分散，中心不可靠' : '当前：过渡', 320, 172);
      c.fillStyle = '#8a93a6';
      c.font = '11px ' + FONT;
      c.fillText('R = 平均方向长度 ÷ 平均向量长度', 320, 196);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    tRef.current = v;
    setT(v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>聚集度 <span className="val">{t.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(t * 100)} onChange={onChange} style={{ flex: 1 }} />
      </div>
      <div className={`feedback ${t > 0.6 ? 'good' : t < 0.4 ? 'bad' : 'guide'}`}>
        {t > 0.6 ? '旋转前的 Q/K 向量都挤在中心附近，R 接近 1，这个中心很可靠。' : t < 0.4 ? '向量四处分散，R 接近 0，用一个中心代表所有向量不太靠谱。' : '调节聚集度，看看 R 值怎么跟着变化。'}
      </div>
    </div>
  );
};

export default M31;
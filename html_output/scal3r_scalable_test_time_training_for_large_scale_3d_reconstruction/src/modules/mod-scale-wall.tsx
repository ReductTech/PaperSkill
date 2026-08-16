import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 模块 1.1 —— 拖动序列长度 N，感受“帧数↑ → 代价 N²↑ → 越过红线就 OOM”。
const W = 560;
const H = 240;
const N_MIN = 4;
const N_MAX = 64;
const N_RED = 40; // 显存红线（示意 A800 上限）

interface Pt {
  x: number;
  y: number;
}
interface ScaleState {
  t: number;
  n: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.88, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: Pt[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

function drawSurveyor(ctx: CanvasRenderingContext2D, x: number, y: number, phase = 0, color = '#27446e') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  const s = Math.sin(phase) * 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x - 4 - s, y + 8);
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 4 + s, y + 8);
  ctx.stroke();
}

export const ModScaleWall: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ScaleState>({ t: 0, n: 8 });
  const rafRef = useRef<number | null>(null);
  const [n, setN] = useState(8);
  const [feedback, setFeedback] = useState({
    text: 'N=8，还装得下（代价≈64）。拖动滑块把序列拉长试试。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: ScaleState) => {
      const cost = s.n * s.n;
      const over = s.n >= N_RED;
      const near = s.n >= 34 && s.n < N_RED;
      const phase = s.t * 0.12;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // 顶部数值行
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`序列长度 N = ${s.n} 帧`, 20, 26);
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`代价 ≈ N² = ${cost}`, 20, 46);

      // 变长的路：长度 ∝ n
      const trailLen = map(s.n, N_MIN, N_MAX, 110, W - 150);
      const x0 = 22;
      const yBase = H * 0.66;
      const pts: Pt[] = [];
      const segs = 44;
      for (let i = 0; i <= segs; i++) {
        const f = i / segs;
        const x = x0 + f * trailLen;
        const y = yBase + Math.sin(f * Math.PI * 3 + phase) * 9;
        pts.push({ x, y });
      }
      drawTrail(ctx, pts);
      const end = pts[pts.length - 1];
      drawSurveyor(ctx, x0, yBase - 2, phase);

      // 小地图纸：越过红线出现红色裂纹 + 抖动
      const shake = over ? Math.sin(s.t * 0.6) * 2.2 : 0;
      const mpX = end.x - 34 + shake;
      const mpY = yBase - 78 + (over ? Math.cos(s.t * 0.55) * 1.5 : 0);
      ctx.fillStyle = '#fffef8';
      ctx.strokeStyle = over ? '#c43f52' : '#9aa7b8';
      ctx.lineWidth = 2;
      ctx.fillRect(mpX, mpY, 40, 30);
      ctx.strokeRect(mpX, mpY, 40, 30);
      if (over) {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mpX + 20, mpY);
        ctx.lineTo(mpX + 14, mpY + 12);
        ctx.lineTo(mpX + 24, mpY + 18);
        ctx.lineTo(mpX + 18, mpY + 30);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#9aa7b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mpX + 6, mpY + 10);
        ctx.lineTo(mpX + 34, mpY + 10);
        ctx.moveTo(mpX + 6, mpY + 20);
        ctx.lineTo(mpX + 34, mpY + 20);
        ctx.stroke();
      }

      // 右侧竖直“显存条”：高度 ∝ n²，按红线归一
      const barX = W - 92;
      const barW = 46;
      const barTop = 30;
      const barBottom = H - 28;
      const barMaxH = barBottom - barTop;
      const frac = clamp(cost / (N_MAX * N_MAX), 0, 1);
      const barH = frac * barMaxH;
      // 底槽
      ctx.fillStyle = '#e7ece3';
      ctx.fillRect(barX, barTop, barW, barMaxH);
      // 填充
      const barColor = over ? '#c43f52' : near ? '#d97706' : '#27446e';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barBottom - barH, barW, barH);
      // 红线：n=40 对应的高度
      const fracRed = (N_RED * N_RED) / (N_MAX * N_MAX);
      const redY = barBottom - fracRed * barMaxH;
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(barX - 6, redY);
      ctx.lineTo(barX + barW + 6, redY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#c43f52';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('显存上限', barX - 4, redY - 6);
      ctx.fillStyle = '#68778f';
      ctx.fillText('显存', barX + 8, barBottom + 16);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), N_MIN, N_MAX);
    stateRef.current.n = v;
    setN(v);
    const cost = v * v;
    if (v >= N_RED) {
      setFeedback({ text: `N=${v}，显存爆了：一次性注意力扛不住。`, cls: 'bad' });
    } else if (v >= 34) {
      setFeedback({ text: `快到显存上限了（代价≈${cost}）。`, cls: '' });
    } else {
      setFeedback({ text: `N=${v}，还装得下（代价≈${cost}）。`, cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          序列长度 N <span className="val">{n}</span>
        </label>
        <input type="range" min={N_MIN} max={N_MAX} value={n} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModScaleWall;

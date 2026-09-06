import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7 Module 2：LingBot-Depth 2.0 —— 换编码器 + 扩数据（保留一个数据缩放滑块）
const W = 460;
const H = 180;

// D_102 数据缩放（论文 Fig.8）
function curve(pts: Array<[number, number]>, x: number) {
  const lx = Math.log10(x);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (lx >= Math.log10(x1) && lx <= Math.log10(x2)) {
      const t = (lx - Math.log10(x1)) / (Math.log10(x2) - Math.log10(x1));
      return y1 + (y2 - y1) * t;
    }
  }
  return pts[pts.length - 1][1];
}
const OURS: Array<[number, number]> = [[3, 0.7], [20, 0.777], [150, 0.795]];
const DINO: Array<[number, number]> = [[3, 0.695], [20, 0.752], [150, 0.755]];

export const M72: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [data, setData] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '配方不变，只换编码器起点 + 把数据从 3M 扩到 150M——数据越多，LingBot-Vision 起点的优势越大。',
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
    const render = (d: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gx = 40;
      const gy = 24;
      const gw = 380;
      const gh = 130;
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('深度补全精度 D_102 ↑（数据规模 3M → 150M）', gx, gy - 6);

      const xOf = (v: number) => gx + (Math.log10(v) - Math.log10(3)) / (Math.log10(150) - Math.log10(3)) * gw;
      const yOf = (v: number) => gy + gh - ((v - 0.66) / (0.82 - 0.66)) * gh;
      const drawCurve = (pts: Array<[number, number]>, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let v = 3; v <= 150; v += 1) {
          const x = xOf(v);
          const y = yOf(curve(pts, v));
          if (v === 3) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawCurve(OURS, '#228d5c');
      drawCurve(DINO, '#c43f52');

      const curX = xOf(d);
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(curX, yOf(curve(OURS, d)), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c43f52';
      ctx.beginPath();
      ctx.arc(curX, yOf(curve(DINO, d)), 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 图例
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh + 18);
      ctx.lineTo(gx + 18, gy + gh + 18);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('LingBot 起点', gx + 22, gy + gh + 22);
      ctx.strokeStyle = '#c43f52';
      ctx.beginPath();
      ctx.moveTo(gx + 100, gy + gh + 18);
      ctx.lineTo(gx + 118, gy + gh + 18);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.fillText('DINOv2 起点', gx + 122, gy + gh + 22);

      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`当前数据 ${d}M　·　14 个基准领先`, gx, gy + gh + 42);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(20);
  stateRef.current = data;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value) / 100;
    const d = Math.round(3 * Math.pow(50, t));
    stateRef.current = d;
    setData(d);
    setFeedback(
      d >= 100
        ? { text: `${d}M：LingBot 起点继续提升（0.795），DINOv2 起点已在 20M 后饱和（0.755）——好起点放大数据红利。`, cls: 'good' }
        : d > 10
        ? { text: `${d}M：差距拉开——数据越多，LingBot-Vision 优势越大。`, cls: '' }
        : { text: `${d}M：两种起点几乎持平，刚开始还看不出差异。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          下游数据量 <span className="val">{data}M</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(Math.log10(data / 3) / Math.log10(50) * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M72;

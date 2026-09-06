import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 280;

type Mode = 'expert' | 'vlm' | 'vlm3' | 'all';

/** 五维能力：细粒度3D / 任务多样 / 设计简洁 / 可扩展 / 标准兼容 */
const AXES = ['细粒度3D', '任务多样', '设计简洁', '可扩展', '标准兼容'];

const SERIES: Record<'expert' | 'vlm' | 'vlm3', { name: string; color: string; fill: string; vals: number[] }> = {
  expert: {
    name: '专家',
    color: C.red,
    fill: 'rgba(196, 63, 82, 0.18)',
    vals: [0.95, 0.45, 0.2, 0.25, 0.15],
  },
  vlm: {
    name: '标准VLM',
    color: C.orange,
    fill: 'rgba(217, 119, 6, 0.16)',
    vals: [0.28, 0.65, 0.9, 0.55, 0.95],
  },
  vlm3: {
    name: 'VLM3',
    color: C.green,
    fill: 'rgba(34, 141, 92, 0.2)',
    vals: [0.9, 0.95, 0.85, 0.9, 0.95],
  },
};

function polar(cx: number, cy: number, r: number, i: number, n: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

/** 1.1：多边形能力图对比专家 / 标准VLM / VLM3 */
export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ focus: Mode }>({ focus: 'all' });
  const rafRef = useRef<number | null>(null);
  const [focus, setFocus] = useState<Mode>('all');
  const [feedback, setFeedback] = useState({
    text: '三层叠合：看谁更「又准又简」。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const cx = 250;
    const cy = 140;
    const R = 95;
    const n = AXES.length;

    const drawPoly = (vals: number[], stroke: string, fill: string, width: number, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const p = polar(cx, cy, R * v, i, n);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
      // 顶点
      vals.forEach((v, i) => {
        const p = polar(cx, cy, R * v, i, n);
        ctx.fillStyle = stroke;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    };

    const render = () => {
      const f = stateRef.current.focus;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // 网格环
      for (let ring = 1; ring <= 4; ring++) {
        const rr = (R * ring) / 4;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const p = polar(cx, cy, rr, i % n, n);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 轴线
      for (let i = 0; i < n; i++) {
        const p = polar(cx, cy, R, i, n);
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        const lab = polar(cx, cy, R + 22, i, n);
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(AXES[i], lab.x, lab.y);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const order: Array<'expert' | 'vlm' | 'vlm3'> = ['expert', 'vlm', 'vlm3'];
      order.forEach((k) => {
        const s = SERIES[k];
        const hi = f === 'all' || f === k;
        drawPoly(s.vals, s.color, s.fill, hi ? 2.8 : 1.2, hi ? 1 : 0.22);
      });

      // 图例
      const legendY = 48;
      order.forEach((k, i) => {
        const s = SERIES[k];
        const x = 430;
        const y = legendY + i * 36;
        const on = f === 'all' || f === k;
        ctx.globalAlpha = on ? 1 : 0.35;
        ctx.fillStyle = s.fill;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, 22, 22);
        ctx.strokeRect(x, y, 22, 22);
        ctx.fillStyle = s.color;
        ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(s.name, x + 30, y + 16);
        ctx.globalAlpha = 1;
      });
    };

    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.focus = m;
    setFocus(m);
    const tips: Record<Mode, { text: string; cls: string }> = {
      all: { text: '叠合对比：VLM3 兼顾精度与简洁。', cls: 'good' },
      expert: { text: '专家：细粒度 3D 强，设计/扩展弱。', cls: 'bad' },
      vlm: { text: '标准 VLM：简洁，细粒度 3D 弱。', cls: '' },
      vlm3: { text: 'VLM3：多样细粒度 3D ≈ 专家，且简洁可扩展。', cls: 'good' },
    };
    setFeedback(tips[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${focus === 'all' ? 'on' : ''}`} onClick={() => pick('all')}>全部</button>
        <button type="button" className={`chip ${focus === 'expert' ? 'on' : ''}`} onClick={() => pick('expert')}>专家</button>
        <button type="button" className={`chip ${focus === 'vlm' ? 'on' : ''}`} onClick={() => pick('vlm')}>标准 VLM</button>
        <button type="button" className={`chip ${focus === 'vlm3' ? 'on' : ''}`} onClick={() => pick('vlm3')}>VLM3</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;

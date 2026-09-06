import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 模块 9.2 —— 改进思路。针对 9.1 的两类失败，点选对应的缓解方向，
// Canvas 画“失败 → 改进”的箭头示意，反馈区给出思路要点。属方法外推（interpretation），
// 非论文明确主张，故以中性/绿色反馈呈现并标注“思路”。
const W = 560;
const H = 240;

type Idea = 'photo' | 'prior' | 'adapt';
interface State {
  t: number;
  idea: Idea;
}

const IDEAS: Record<
  Idea,
  { title: string; from: string; to: string; note: string }
> = {
  photo: {
    title: '① 光照鲁棒表征',
    from: '外观骤变',
    to: '光照不变特征',
    note: '思路：引入光照不变/光度归一化特征或曝光增强训练，降低跨块记忆对绝对亮度的敏感度。',
  },
  prior: {
    title: '② 几何先验补稀疏',
    from: '重叠不足',
    to: '先验约束',
    note: '思路：视角极稀疏时引入单目深度先验或跨块几何约束，补足缺失的公共桩以稳定对齐。',
  },
  adapt: {
    title: '③ 自适应块划分',
    from: '固定分块',
    to: '按重叠自适应',
    note: '思路：按帧间重叠度动态调整块大小与重叠带，在稀疏/突变区自动加密，稳住测试时更新。',
  },
};

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

export const ModImprove: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0, idea: 'photo' });
  const rafRef = useRef<number | null>(null);
  const [idea, setIdea] = useState<Idea>('photo');
  const [feedback, setFeedback] = useState({ text: IDEAS.photo.note, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);
      const cfg = IDEAS[s.idea];

      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(cfg.title, 18, 28);

      const cy = 120;
      // from box (red — the failure)
      ctx.fillStyle = '#fbe9ec';
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 2;
      ctx.fillRect(46, cy - 34, 180, 68);
      ctx.strokeRect(46, cy - 34, 180, 68);
      ctx.fillStyle = '#c43f52';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(cfg.from, 136 - ctx.measureText(cfg.from).width / 2, cy + 6);

      // arrow
      const ax = 236;
      const aw = 88;
      const glow = 0.5 + 0.5 * Math.sin(s.t * 0.08);
      ctx.strokeStyle = `rgba(34,141,92,${0.55 + 0.4 * glow})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ax, cy);
      ctx.lineTo(ax + aw, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + aw, cy);
      ctx.lineTo(ax + aw - 12, cy - 8);
      ctx.lineTo(ax + aw - 12, cy + 8);
      ctx.closePath();
      ctx.fillStyle = `rgba(34,141,92,${0.55 + 0.4 * glow})`;
      ctx.fill();

      // to box (green — the fix)
      ctx.fillStyle = '#eef4ea';
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.fillRect(334, cy - 34, 190, 68);
      ctx.strokeRect(334, cy - 34, 190, 68);
      ctx.fillStyle = '#228d5c';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(cfg.to, 429 - ctx.measureText(cfg.to).width / 2, cy + 6);
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

  const pick = (v: Idea) => {
    stateRef.current.idea = v;
    setIdea(v);
    setFeedback({ text: IDEAS[v].note, cls: 'good' });
  };

  const opts: { v: Idea; label: string }[] = [
    { v: 'photo', label: '光照鲁棒' },
    { v: 'prior', label: '几何先验' },
    { v: 'adapt', label: '自适应分块' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {opts.map((o) => (
          <button
            key={o.v}
            className={`chip ${idea === o.v ? 'selected' : ''}`}
            onClick={() => pick(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default ModImprove;

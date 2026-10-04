import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left three pans; right three controlled bars).
// m-recipe-chips — chapter 7 active module (P4 chips, hybrid).
// Learner switches 从零训练 / 只用机器人数据 / co-fine-tuning; three pans on the
// left get matching flame+food states and three controlled bars on the right
// show the paper's ablation ordering. Bars use the paper's recorded ordering
// only (no invented numbers): scratch lowest, fine-tuned mid, co-fine-tuned
// highest. Evidence: page 6 §3.2 Co-Fine-Tuning; page 10 §4.3 / Fig 6b / Table 6.
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

type Recipe = 'scratch' | 'finetune' | 'cofinetune';
const ORDER: Recipe[] = ['scratch', 'finetune', 'cofinetune'];
const NAMES: Record<Recipe, string> = {
  scratch: '从零训练',
  finetune: '只用机器人数据',
  cofinetune: 'co-fine-tuning',
};
// relative bar heights (illustrative ordering per Fig 6b, not fabricated values)
const BAR: Record<Recipe, number> = { scratch: 0.12, finetune: 0.5, cofinetune: 0.78 };
const COLOR: Record<Recipe, string> = { scratch: C.red, finetune: C.blue, cofinetune: C.green };
const FLAME: Record<Recipe, number> = { scratch: 0.25, finetune: 0.6, cofinetune: 1 };

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MRecipeChips: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const recipe = useRef<Recipe>('finetune');
  const [recipeUi, setRecipeUi] = useState<Recipe>('finetune');
  const [fb, setFb] = useState({ text: '切换三种学法，比较同一组未见场景上的表现。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, w, 30);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 190, w, h - 190);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(w, 190);
    ctx.stroke();

    // three pans
    const xs = [90, 200, 310];
    ORDER.forEach((r, i) => {
      const active = recipe.current === r;
      ctx.fillStyle = active ? '#5a5f66' : '#8b9099';
      ctx.beginPath();
      ctx.ellipse(xs[i], 196, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active ? '#3f444b' : '#9aa1aa';
      ctx.lineWidth = active ? 2.4 : 1.6;
      ctx.stroke();
      // flame
      const lv = FLAME[r];
      ctx.strokeStyle = `rgba(240,126,71,${0.3 + 0.6 * lv})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(xs[i], 216, 24 * (0.6 + 0.4 * lv), 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      // food doneness dot
      ctx.fillStyle = r === 'scratch' ? '#d8b48a' : r === 'finetune' ? '#b9772f' : '#8a5a1f';
      ctx.beginPath();
      ctx.ellipse(xs[i], 194, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = COLOR[r];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(xs[i], 196, 48, 21, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      label(ctx, xs[i] - 22, 244, NAMES[r], active ? C.ink : C.muted);
    });

    // bars
    const bx = 460;
    const by = 236;
    const bw = 50;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - 12, by);
    ctx.lineTo(bx + 230, by);
    ctx.stroke();
    ORDER.forEach((r, i) => {
      const x = bx + i * 70;
      const bh = BAR[r] * 170;
      ctx.fillStyle = COLOR[r];
      ctx.globalAlpha = recipe.current === r ? 1 : 0.55;
      ctx.fillRect(x, by - bh, bw, bh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, by - bh, bw, bh);
    });
    label(ctx, bx - 6, 46, '未见场景表现', C.muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (r: Recipe) => {
    recipe.current = r;
    setRecipeUi(r);
    setFb(
      r === 'cofinetune'
        ? { text: '网络知识与机器人数据一起学，换场景也稳。', cls: 'good' }
        : r === 'finetune'
        ? { text: '只用机器人数据，学会了，但换场景就吃力。', cls: '' }
        : { text: '从零训练，连简单场景都做不好。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-recipe-chips`} ref={canvasRef} width={W} height={H} aria-label="三种训练方式的泛化对比" />
      <div className="chip-row">
        {ORDER.map((r) => (
          <button
            key={r}
            type="button"
            className={`chip ${recipeUi === r ? 'selected' : ''}`}
            onClick={() => choose(r)}
          >
            {NAMES[r]}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MRecipeChips;

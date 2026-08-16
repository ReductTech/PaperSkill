import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch5 Module 1：因果消融 —— 逐步加料，看指标变化（Table 1）
const W = 560;
const H = 220;

type Recipe = 'base' | 'geo' | 'dual' | 'full' | 'semonly';

const RECIPES: Record<Recipe, { label: string; knn: number; delta: number; rmse: number; note: string; good: boolean }> = {
  base: { label: 'DINO+iBOT（基线）', knn: 81.6, delta: 81.4, rmse: 0.474, note: '随机掩码 + 纯语义：深度精度垫底。', good: false },
  geo: { label: '+ 边界几何目标', knn: 81.8, delta: 84.4, rmse: 0.446, note: '只加分类化几何目标：δ₁ 直接 +3.0，语义几乎不降——主要贡献来源。', good: true },
  dual: { label: '+ 双重监督', knn: 82.0, delta: 84.7, rmse: 0.443, note: '边界 token 语义+几何双监督：再 +0.3，语义也 +0.2。', good: true },
  full: { label: '+ RoPE（完整方案）', knn: 82.4, delta: 84.9, rmse: 0.440, note: '完整配方：k-NN 82.4、δ₁ 84.9、RMSE 0.440，双赢。', good: true },
  semonly: { label: '边界掩码 + 仅语义', knn: 81.4, delta: 81.2, rmse: 0.481, note: '把边界塞进掩码却只用语义重建：不升反降（81.2）——掩码换方向没用。', good: false },
};

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [recipe, setRecipe] = useState<Recipe>('base');
  const [feedback, setFeedback] = useState({
    text: RECIPES.base.note + ' 点击右上角配方切换，观察柱子的因果变化。',
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
    const render = (r: Recipe) => {
      const d = RECIPES[r];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gx = 60;
      const gy = 40;
      const gw = 380;
      const gh = 150;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('NYUv2 深度 δ₁ ↑', gx, gy - 8);

      // 基线参考线 81.4
      const yOf = (v: number) => gy + gh - ((v - 80) / 6) * gh;
      ctx.strokeStyle = '#9fb0c8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, yOf(81.4));
      ctx.lineTo(gx + gw, yOf(81.4));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('基线 81.4', gx + gw - 60, yOf(81.4) - 4);

      // 当前配方柱
      const barW = 80;
      const bx = gx + 40;
      const h = (d.delta - 80) * (gh / 6);
      const barColor = r === 'semonly' ? '#c43f52' : d.good ? '#228d5c' : '#27446e';
      ctx.fillStyle = barColor;
      ctx.fillRect(bx, gy + gh - h, barW, h);
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, gy + gh - h, barW, h);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(d.delta.toFixed(1), bx + barW / 2 - 14, gy + gh - h - 6);

      // 配方标签（下方）
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(d.label, gx + 20, gy + gh + 20);

      // 右：IN k-NN + RMSE 读数
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('IN-1K kNN ↑: ' + d.knn.toFixed(1), 470, 70);
      ctx.fillText('NYU RMSE ↓: ' + d.rmse.toFixed(3), 470, 100);
      if (r === 'semonly') {
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('✗ 无提升', 470, 140);
      } else if (r !== 'base') {
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('↑ 因果贡献', 470, 140);
      }

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

  const stateRef = useRef<Recipe>('base');
  stateRef.current = recipe;

  const setRecipeState = (r: Recipe) => {
    stateRef.current = r;
    setRecipe(r);
    setFeedback({ text: RECIPES[r].note, cls: RECIPES[r].good ? 'good' : 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${recipe === 'base' ? 'active' : ''}`} onClick={() => setRecipeState('base')}>
          Baseline
        </button>
        <button className={`chip ${recipe === 'geo' ? 'active' : ''}`} onClick={() => setRecipeState('geo')}>
          +Geometry
        </button>
        <button className={`chip ${recipe === 'dual' ? 'active' : ''}`} onClick={() => setRecipeState('dual')}>
          +Dual
        </button>
        <button className={`chip ${recipe === 'full' ? 'active' : ''}`} onClick={() => setRecipeState('full')}>
          +RoPE
        </button>
        <button className={`chip ${recipe === 'semonly' ? 'active' : ''}`} onClick={() => setRecipeState('semonly')}>
          掩码+仅语义
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;

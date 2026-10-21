import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 模块：采样批数 → 三个权重的 Fisher 估计直方图收敛（解释性演示）。
// 真值固定 0.30 / 0.55 / 0.80（绿色竖线）；柱宽与散布 ∝ 1/√批数；
// 当前估计 = 真值 + 确定性伪随机噪声（幅度 0.18/√批数，以批数作种子，渲染稳定）。

const W = 1080;
const H = 280;
const TRUES = [0.3, 0.55, 0.8];
const COLORS = ['#27446e', '#f07e47', '#7c3aed'];
const LABELS = ['权重1', '权重2', '权重3'];

interface SimState {
  batches: number;
}

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState>({ batches: 10 });
  const rafRef = useRef<number | null>(null);
  const [batches, setBatches] = useState(10);
  const [fb, setFb] = useState({
    text: '采样太少：估计值在真值附近大幅摆动，重要性可能判错。',
    cls: 'bad',
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

    const render = (s: SimState) => {
      const b = s.batches;
      const amp = 0.18 / Math.sqrt(b); // 噪声幅度
      const shrink = 1 / Math.sqrt(b / 10); // 柱宽收缩因子

      // 白色场
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const plotY0 = 62;
      const plotY1 = 232;

      // 坐标轴：三个面板的基线
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const px = 40 + k * 333;
        ctx.beginPath();
        ctx.moveTo(px + 10, plotY1);
        ctx.lineTo(px + 310, plotY1);
        ctx.stroke();
      }

      for (let k = 0; k < 3; k++) {
        const px = 40 + k * 333;
        const t = TRUES[k];
        const wMin = Math.max(0, t - 0.25);
        const wMax = Math.min(1, t + 0.25);
        const toX = (f: number) => px + ((f - wMin) / (wMax - wMin)) * 320;

        // 直方图柱：围绕真值、散布 ∝ 1/√批数
        for (let i = 0; i < 9; i++) {
          const off = Math.sin(i * 2.399 + k * 0.73);
          const fx = clamp(t + off * amp, wMin, wMax);
          const hgt = 26 + 62 * Math.exp(-(off * off) / 0.5);
          const bw = clamp(16 * shrink, 2, 16);
          const bx = toX(fx);
          ctx.fillStyle = 'rgba(39, 68, 110, 0.75)';
          ctx.fillRect(bx - bw / 2, plotY1 - hgt, bw, hgt);
        }

        // 真值（绿色竖线）
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(t), plotY0);
        ctx.lineTo(toX(t), plotY1);
        ctx.stroke();

        // 当前估计（确定性伪随机，同一批数渲染稳定）
        const n01 = Math.sin(b * 0.613 + k * 1.618) * 0.5 + 0.5;
        const est = clamp(t + (n01 * 2 - 1) * amp, 0.02, 0.98);
        const ex = toX(est);
        ctx.strokeStyle = COLORS[k];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ex, plotY0);
        ctx.lineTo(ex, plotY1);
        ctx.stroke();
        ctx.fillStyle = COLORS[k];
        ctx.beginPath();
        ctx.arc(ex, plotY0, 4, 0, Math.PI * 2);
        ctx.fill();

        // 裸数字：当前估计值
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(est.toFixed(2), px + 160, 46);
      }

      // 图例（≤3 项）
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      for (let k = 0; k < 3; k++) {
        const lx = 48 + k * 128;
        ctx.fillStyle = COLORS[k];
        ctx.fillRect(lx, 20, 10, 10);
        ctx.fillStyle = '#21324a';
        ctx.fillText(LABELS[k], lx + 16, 30);
      }

      // 边框
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.batches = v;
    setBatches(v);
    if (v < 50) {
      setFb({ text: '采样太少：估计值在真值附近大幅摆动，重要性可能判错。', cls: 'bad' });
    } else if (v <= 200) {
      setFb({ text: '采样增加，估计收窄——重要性逐渐可信。', cls: '' });
    } else {
      setFb({ text: '估计已稳定在真值附近：可以放心用来做保护刚度。', cls: 'good' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          采样批数 <span className="val">{batches}</span>
        </label>
        <input type="range" min={10} max={500} step={10} value={batches} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7Mod1;

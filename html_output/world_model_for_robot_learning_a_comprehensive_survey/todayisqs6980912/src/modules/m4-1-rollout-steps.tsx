import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawInkPath, drawBrush, drawLegend, strokePath } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 4.1 六步推演：误差怎么逐段传下去（P2 步进）。
// 上区：真实轨迹（虚线棕）与预测轨迹（实线蓝，逐段揭示），节点红晕 ∝ 误差；
// 下区：6 根误差条。err = [3,6,10,15,21,28]（示意，px 折算）。

const W = 720;
const H = 320;

const NODES = [
  { x: 100, y: 140 },
  { x: 215, y: 78 },
  { x: 330, y: 152 },
  { x: 445, y: 74 },
  { x: 560, y: 150 },
  { x: 665, y: 96 },
];
const ERRS = [3, 6, 10, 15, 21, 28];

export const M41RolloutSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 真实轨迹：过 6 节点的平滑 S 曲线；预测 = 真实 + 法向偏移逐节点放大
    const truePts = strokePath(NODES[0], NODES.slice(1, -1), NODES[NODES.length - 1], 96);
    const nodeIndexAt = (i: number) => Math.round((i / (truePts.length - 1)) * (NODES.length - 1));
    const predictedPts = truePts.map((p, i) => {
      const nIdx = nodeIndexAt(i);
      const nx = NODES[nIdx];
      const ny = NODES[Math.min(nIdx + 1, NODES.length - 1)];
      const dx = ny.x - nx.x;
      const dy = ny.y - nx.y;
      const len = Math.hypot(dx, dy) || 1;
      const nxv = -dy / len;
      const nyv = dx / len;
      const err = ERRS[nIdx];
      return { x: p.x + nxv * err, y: p.y + nyv * err };
    });
    const segLen = truePts.length / (NODES.length - 1);
    const upTo = (pts: { x: number; y: number }[], k: number) =>
      pts.slice(0, Math.max(2, Math.round(k * segLen)));

    const render = () => {
      const s = stateRef.current;
      const k = s.step;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 32, [
        { color: PALETTE.guide, text: '真实' },
        { color: PALETTE.blue, text: '预测' },
      ]);

      // 上区轨迹平面
      drawGuide(ctx, truePts);
      if (k > 0) {
        drawInkPath(ctx, upTo(predictedPts, k), { color: PALETTE.blue, width: 3 });
      }

      // 节点误差红晕（已揭示）
      for (let i = 0; i < Math.min(k, NODES.length); i++) {
        const n = NODES[i];
        const p = predictedPts[Math.round((i * segLen) % (predictedPts.length - 1))];
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + ERRS[i] * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.red;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 两枚毛笔笔尖（真实 / 预测各一）
      if (k > 0 && k < NODES.length) {
        const ti = Math.min(Math.round(k * segLen), truePts.length - 1);
        drawBrush(ctx, truePts[ti].x, truePts[ti].y, 0.2, 24);
        drawBrush(ctx, predictedPts[ti].x, predictedPts[ti].y, -0.2, 24, PALETTE.orange);
      }

      // 下区 6 根误差条
      const bx0 = 100;
      const bw = 78;
      const byBase = 300;
      const bhMax = 66;
      for (let i = 0; i < 6; i++) {
        const x = bx0 + i * bw + 10;
        ctx.save();
        ctx.fillStyle = i < k ? PALETTE.red : PALETTE.grid;
        const bh = (ERRS[i] / 28) * bhMax;
        ctx.fillRect(x, byBase - bh, 22, bh);
        if (i < k) {
          ctx.fillStyle = PALETTE.muted;
          ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(ERRS[i]), x + 11, byBase - bh - 6);
        }
        ctx.restore();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const onStep = () => {
    const s = stateRef.current;
    if (s.step >= 6) {
      s.step = 0;
      setStep(0);
    } else {
      s.step += 1;
      setStep(s.step);
    }
  };

  const fb =
    step === 0
      ? { text: '点击「推演一步」，看预测轨迹如何从真实轨迹上跑偏。', cls: '' }
      : step >= 6
      ? { text: '六步之后预测已面目全非：时域越长，越需要修正机制。', cls: 'bad' }
      : {
          text: `第 ${step} 步：误差 ≈ ${ERRS[step - 1]}——而且会原样传给下一段。`,
          cls: '',
        };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onStep}>
          {step >= 6 ? '重来' : '推演一步'}
        </button>
        <span className="step-label">
          已推演 <b>{step}</b> / 6 步
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M41RolloutSteps;

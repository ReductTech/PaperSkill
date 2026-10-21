import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m4-1 (reparam-steps) — 重参数化三步走：训练→合并→推理。

const W = 1080;
const H = 280;
const FEEDBACK = [
  { text: '训练时：小网络 f_θ 负责把文本嵌入改得更好用。', cls: '' },
  { text: '训练结束：把 f_θ 的效果折算进卷积核 K′。', cls: '' },
  { text: '推理时：结构和普通 YOLO 一模一样——增强，免费。', cls: 'good' },
];
const FORMULAS = ['Label = O · (f_θ(P))ᵀ', 'K′ = R(f_θ(P)) ⊛ Kᵀ', 'Label = I ⊛ K′'];
const COSTS = ['辅助网络参与训练', '两核相向合并', '0 额外开销'];

export const M4_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const block = (x: number, y: number, w: number, h: number, label: string, color: string, dash = false) => {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      if (dash) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h / 2 + 5);
      ctx.textAlign = 'left';
      ctx.restore();
    };
    const arrowTo = (x1: number, y1: number, x2: number, y2: number, color: string = PALETTE.muted) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(a - 0.42), y2 - 10 * Math.sin(a - 0.42));
      ctx.lineTo(x2 - 10 * Math.cos(a + 0.42), y2 - 10 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);
      const cy = 130;

      if (s.step === 1) {
        // P → [f_θ] → P̂，与 O 对比
        block(80, cy - 26, 110, 52, '文本嵌入 P', PALETTE.blue);
        block(280, cy - 30, 120, 60, 'f_θ', PALETTE.purple);
        drawSceneLabel(ctx, '只在训练时', 292, cy + 52, PALETTE.purple);
        block(490, cy - 26, 110, 52, 'P̂', PALETTE.purple);
        block(80, cy + 66, 110, 52, '锚点嵌入 O', PALETTE.ink);
        arrowTo(190, cy, 280, cy);
        arrowTo(400, cy, 490, cy);
        arrowTo(545, cy + 30, 200, cy + 78, PALETTE.green);
        drawSceneLabel(ctx, '对比', 330, cy + 92, PALETTE.green);
      } else if (s.step === 2) {
        // K 与 f_θ(P) 相向移动合并为 K′（橙色闪光）
        const osc = 0.5 + 0.5 * Math.sin(t * 4);
        block(120, cy - 26, 120, 52, '卷积核 K', PALETTE.ink);
        block(120, cy + 56, 140, 52, 'f_θ(P)', PALETTE.purple);
        arrowTo(240, cy + 82, 350 + osc * 20, cy + 30, PALETTE.orange);
        arrowTo(240, cy, 350 + osc * 20, cy + 6, PALETTE.orange);
        block(390, cy + 2, 130, 52, "K′", PALETTE.orange);
        drawSceneLabel(ctx, '合并', 430, cy + 84, PALETTE.orange);
        // 闪光
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.3 * osc;
        ctx.strokeStyle = PALETTE.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(455, cy + 28, 46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // 只剩单卷积 I⊛K′（绿），f_θ 虚线残影
        block(90, cy - 26, 130, 52, '输入特征 I', PALETTE.blue);
        block(330, cy - 26, 130, 52, "卷积 K′", PALETTE.green);
        block(570, cy - 26, 110, 52, 'Label', PALETTE.green);
        arrowTo(220, cy, 330, cy);
        arrowTo(460, cy, 570, cy);
        block(330, cy + 62, 130, 44, 'f_θ 已消失', PALETTE.muted, true);
        drawSceneLabel(ctx, '0 额外开销', 348, cy + 136, PALETTE.green);
      }

      // 右侧 inset：公式片段 + 开销标签
      insetBox(ctx, 740, 50, 300, 180);
      drawSceneLabel(ctx, '当前步骤', 764, 86, PALETTE.muted);
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(FORMULAS[s.step - 1], 764, 126);
      ctx.fillStyle = s.step === 3 ? PALETTE.green : s.step === 2 ? PALETTE.orange : PALETTE.purple;
      ctx.font = '15px sans-serif';
      ctx.fillText(COSTS[s.step - 1], 764, 168);
      ctx.restore();
    };

    const tick = () => {
      render(performance.now() / 1000);
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

  const go = (next: number) => {
    const v = Math.max(1, Math.min(3, next));
    stateRef.current.step = v;
    setStep(v);
    setFeedback(FEEDBACK[v - 1]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(step - 1)} disabled={step <= 1}>
          上一步
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step >= 3}>
          下一步
        </button>
        <label>
          第 <span className="val">{step}</span> / 3 步
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M4_1;

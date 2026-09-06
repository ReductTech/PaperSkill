import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

/** 2.1：VLM 三维探索如何启发本文（画布少文字） */
export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0 = useRef(performance.now());
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = (now: number) => {
      const st = stepRef.current;
      const t = (now - t0.current) / 1000;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // —— ① 物体级：粗框 + 额外挂件 ——
      const a0 = st >= 0 ? 1 : 0.3;
      ctx.globalAlpha = a0;
      ctx.fillStyle = '#fff7ed';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      roundRect(28, 36, 140, 160, 8);
      ctx.fill();
      ctx.stroke();
      drawWindow(ctx, 46, 54, 104, 78, C.orange);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(58, 72, 38, 34);
      ctx.strokeRect(98, 82, 34, 40);
      // 额外编码器挂件
      ctx.fillStyle = '#ffedd5';
      roundRect(50, 148, 30, 24, 4);
      ctx.fill();
      ctx.strokeRect(50, 148, 30, 24);
      roundRect(92, 148, 30, 24, 4);
      ctx.fill();
      ctx.strokeRect(92, 148, 30, 24);
      // 小「+」暗示附加模块
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(65, 156);
      ctx.lineTo(65, 164);
      ctx.moveTo(61, 160);
      ctx.lineTo(69, 160);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 阶段箭头 1→2
      ctx.strokeStyle = st >= 1 ? C.orange : C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(178, 116);
      ctx.lineTo(206, 116);
      ctx.stroke();
      if (st >= 1) {
        ctx.beginPath();
        ctx.moveTo(198, 110);
        ctx.lineTo(208, 116);
        ctx.lineTo(198, 122);
        ctx.stroke();
      }

      // —— ② 细粒度：像素深度（DepthLM 类） ——
      if (st >= 1) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        roundRect(214, 36, 150, 160, 8);
        ctx.fill();
        ctx.stroke();
        drawWindow(ctx, 232, 52, 114, 78, C.muted);
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 4; j++) {
            drawDot(ctx, 248 + i * 18, 66 + j * 16, 2 + ((i + j) % 3), C.orange);
          }
        }
        const depths = [30, 50, 38, 60, 44];
        depths.forEach((h, i) => {
          ctx.fillStyle = `rgba(217,119,6,${0.35 + i * 0.1})`;
          ctx.fillRect(240 + i * 22, 178 - h * 0.55, 16, h * 0.55);
        });
        // 与专家精度接近的对勾（小图标，无文字）
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(328, 48);
        ctx.lineTo(334, 54);
        ctx.lineTo(346, 40);
        ctx.stroke();
      }

      // 阶段箭头 2→3
      ctx.strokeStyle = st >= 2 ? C.green : C.border;
      ctx.lineWidth = 2 + (st >= 2 ? (Math.sin(t * 3) + 1) / 2 : 0);
      ctx.beginPath();
      ctx.moveTo(374, 116);
      ctx.lineTo(408, 116);
      ctx.stroke();
      if (st >= 2) {
        ctx.beginPath();
        ctx.moveTo(400, 110);
        ctx.lineTo(410, 116);
        ctx.lineTo(400, 122);
        ctx.stroke();
      }

      // —— ③ 启发 → VLM3 极简 ——
      if (st >= 2) {
        const glow = (Math.sin(t * 3) + 1) / 2;
        ctx.fillStyle = '#e8f7ef';
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.2;
        roundRect(418, 36, 110, 160, 8);
        ctx.fill();
        ctx.stroke();
        drawWindow(ctx, 440, 62, 66, 56, C.green);
        // 多样任务：四条细线从同一窗伸出（无挂件）
        const ends = [
          [448, 150],
          [468, 140],
          [488, 152],
          [508, 144],
        ] as const;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.8;
        ends.forEach(([ex, ey]) => {
          ctx.beginPath();
          ctx.moveTo(473, 118);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          drawDot(ctx, ex, ey, 3, C.green);
        });
        // 星光
        ctx.fillStyle = C.green;
        const sx = 473, sy = 48 + glow * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 7);
        ctx.lineTo(sx + 2.5, sy - 2);
        ctx.lineTo(sx + 7, sy);
        ctx.lineTo(sx + 2.5, sy + 2);
        ctx.lineTo(sx, sy + 7);
        ctx.lineTo(sx - 2.5, sy + 2);
        ctx.lineTo(sx - 7, sy);
        ctx.lineTo(sx - 2.5, sy - 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // 占位轮廓
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        roundRect(418, 36, 110, 160, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 底部三步进度点（无文字）
      for (let i = 0; i < 3; i++) {
        const on = i <= st;
        ctx.fillStyle = on ? (i === 2 ? C.green : C.orange) : C.border;
        ctx.beginPath();
        ctx.arc(200 + i * 80, 220, on ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        if (i < 2) {
          ctx.strokeStyle = i < st ? C.orange : C.border;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(208 + i * 80, 220);
          ctx.lineTo(272 + i * 80, 220);
          ctx.stroke();
        }
      }
    };

    const tick = (now: number) => {
      render(now);
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const feedback = [
    '物体级 VLM-3D：粗框理解为主，常挂额外模块，粒度仍偏粗。',
    '细粒度起步（如 DepthLM）：像素级度量深度可逼近专家，证明标准 VLM 能学 3D。',
    '受此启发：本文扩大任务广度与研究深度——极简设计下覆盖更多 3D 任务（→ VLM3）。',
  ][step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="chip"
          onClick={() => setStep((s) => Math.min(s + 1, 2))}
          disabled={step >= 2}
        >
          下一步
        </button>
        <button type="button" className="chip" onClick={() => setStep(0)}>重置</button>
      </div>
      <div className={`feedback ${step >= 2 ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export default Ch2Mod1;

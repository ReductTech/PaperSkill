import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawRuler,
  drawTokenChip,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './flatKit';
import type { WidgetProps } from './registry';

// Module 2.2 「誊进说明书」 — how the two rulers' readings become language:
// step through ① two encoders read separately ② channel-wise concatenation
// ③ the 2-layer MLP projector ④ tokens enter the Llama 2 sequence.
const W = 1080;
const H = 280;

const STEPS = 4;
const SUB = ['₁', '₂', '₃', '₄'];
const STEP_FB = [
  '第₁步：同一块场景，语义尺（SigLIP）与空间尺（DINOv2）各自读数——一个答「是什么」，一个答「在哪里」。',
  '第₂步：两路特征按通道拼接（并排誊写在同一条上）——语义与空间逐位置绑定，不丢任何一路信息。',
  '第₃步：两层 MLP 投影——把拼接后的视觉特征「翻译」成语言模型的输入格式（语言嵌入空间）。',
  '第₄步：视觉 token 进入 Llama 2 序列，与文字 token 排在一起——从此模型眼里图和话是同一种话。',
];

export const Ch2Project: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1 });
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: STEP_FB[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const st = stateRef.current.step;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // stage markers along the top
      const stages = ['双尺读数', '通道拼接', 'MLP 投影', '进 Llama 2'];
      stages.forEach((s, i) => {
        const sx = 120 + i * 280;
        const active = i === st - 1;
        const done = i < st - 1;
        ctx.save();
        ctx.fillStyle = active ? C.orange : done ? C.green : C.muted;
        ctx.font = (active ? 'bold ' : '') + '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s, sx, 34);
        // connector
        if (i < 3) {
          ctx.strokeStyle = i < st - 1 ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.setLineDash(i < st - 1 ? [] : [4, 3]);
          ctx.beginPath();
          ctx.moveTo(sx + 52, 34);
          ctx.lineTo(sx + 228, 34);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      });

      // ① two rulers reading (visible from step 1)
      drawRuler(ctx, 120, 120, 160, { semantic: true });
      drawRuler(ctx, 120, 168, 160, {});
      drawSceneLabel(ctx, 'SigLIP 语义', 292, 120, { color: C.blue });
      drawSceneLabel(ctx, 'DINOv2 空间', 292, 168, { color: C.orange });

      // ② concatenated strip (visible from step 2)
      if (st >= 2) {
        const y = 212;
        for (let k = 0; k < 8; k++) {
          const half = k % 2 === 0;
          ctx.fillStyle = half ? C.blue : C.orange;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(120 + k * 26, y - 10, 22, 20, 3);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawSceneLabel(ctx, '通道拼接（并排誊写）', 350, 212, { color: C.text });
      }

      // ③ MLP projector box (visible from step 3)
      if (st >= 3) {
        ctx.save();
        ctx.fillStyle = C.white;
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(560, 96, 150, 130, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.purple;
        ctx.font = '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MLP 投影', 635, 140);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText('2 层', 635, 164);
        ctx.fillText('视觉 → 语言空间', 635, 186);
        ctx.restore();
        // arrow from concat strip to MLP
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(360, 212);
        ctx.quadraticCurveTo(470, 212, 552, 161);
        ctx.stroke();
      }

      // ④ tokens into Llama 2 (visible from step 4)
      if (st >= 4) {
        const names = ['图¹', '图²', '图³', '指', '令'];
        names.forEach((n, k) => {
          drawTokenChip(ctx, 790 + k * 46, 161, n, k < 3 ? C.purple : C.blue);
        });
        ctx.save();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(762, 128, 268, 66, 10);
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Llama 2 词元序列', 770, 118);
        ctx.restore();
        drawVerdict(ctx, 1046, 161, true, { r: 14, pulse: ms / 400 });
      }

      drawLegend(
        ctx,
        [
          ['语义特征', C.blue],
          ['空间特征', C.orange],
          ['视觉 token', C.purple],
        ],
        30,
        H - 14
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const next = () => {
    const s = Math.min(STEPS, stateRef.current.step + 1);
    stateRef.current.step = s;
    setStep(s);
    setFeedback({ text: STEP_FB[s - 1], cls: s === STEPS ? 'good' : '' });
  };
  const prev = () => {
    const s = Math.max(1, stateRef.current.step - 1);
    stateRef.current.step = s;
    setStep(s);
    setFeedback({ text: STEP_FB[s - 1], cls: '' });
  };
  const reset = () => {
    stateRef.current.step = 1;
    setStep(1);
    setFeedback({ text: STEP_FB[0], cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={prev} disabled={step === 1}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={next} disabled={step === STEPS}>
          {step === STEPS ? '完成' : '下一步'}
        </button>
        <button type="button" className="tiny" onClick={reset} disabled={step === 1}>
          复位
        </button>
        <span className="step-label">
          {step} / {STEPS}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Project;

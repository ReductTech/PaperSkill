import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, sceneLabel, inset } from './scene-kit';

const W = 560;
const H = 260;

const STAGE_TEXTS = [
  '朴素做法：整段带梯度 → 显存爆炸（红色虚线为示意上限）。点「下一步」。',
  '第一阶段：无梯度跑完整段，只保留最终输出算 DMD 损失——全局监督信号几乎零开销。',
  '第二阶段：逐块带梯度重算（含 KV 缓存构建与去噪），算完立刻释放。',
];

// §9 M9.1 — P2 step-through of chunk-wise backpropagation (paper §3.2.1).
// Memory bar is schematic; the two-stage mechanism and FPS records are from
// the paper.
export const M9Backprop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0, sweep: 0, sweeping: false, done: false });
  const rafRef = useRef<number | null>(null);
  const sweepTs = useRef(0);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: STAGE_TEXTS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { stage: number; sweep: number; done: boolean }, time: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      sceneLabel(
        ctx,
        s.stage === 0 ? '阶段 0 · 朴素做法（对照）' : s.stage === 1 ? '阶段 1 · 无梯度全程推理' : '阶段 2 · 逐块重算 + 反传',
        20,
        28,
        false,
        13
      );
      // chunk tiles
      for (let i = 0; i < 5; i++) {
        const x = 32 + i * 82;
        let fill = '#ffffff';
        let stroke: string = C.border;
        if (s.stage === 0) {
          stroke = C.red;
        } else if (s.stage === 1) {
          fill = 'rgba(39,68,110,0.15)';
          stroke = C.blue;
        } else {
          if (i < s.sweep) {
            fill = 'rgba(184,201,167,0.4)';
            stroke = C.border;
          } else if (i === s.sweep && !s.done) {
            fill = 'rgba(34,141,92,0.2)';
            stroke = C.green;
          } else if (s.done) {
            fill = 'rgba(184,201,167,0.4)';
            stroke = C.border;
          }
        }
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.fillRect(x, 60, 70, 44);
        ctx.strokeRect(x, 60, 70, 44);
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`块 ${i + 1}`, x + 22, 86);
        // gradient arrow under the chunk being recomputed
        if (s.stage === 2 && i === s.sweep && !s.done) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 35, 116);
          ctx.lineTo(x + 35, 132);
          ctx.moveTo(x + 29, 124);
          ctx.lineTo(x + 35, 132);
          ctx.moveTo(x + 41, 124);
          ctx.lineTo(x + 35, 132);
          ctx.stroke();
          sceneLabel(ctx, '反传', x + 22, 148, true, 10);
        }
        if (s.stage === 2 && i === s.sweep - 1) {
          sceneLabel(ctx, '已释放', x + 14, 148, true, 10);
        }
      }
      if (s.stage >= 1) {
        // DMD loss tag on final output
        ctx.fillStyle = C.orange;
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText('DMD 损失', 32 + 4 * 82 + 4, 52);
      }
      // memory bar
      inset(ctx, 452, 44, 92, 172);
      sceneLabel(ctx, '显存峰值', 464, 60, true, 11);
      sceneLabel(ctx, '（示意）', 468, 74, true, 9);
      // naive ceiling
      ctx.strokeStyle = C.red;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(460, 84);
      ctx.lineTo(536, 84);
      ctx.stroke();
      ctx.setLineDash([]);
      sceneLabel(ctx, '朴素全图', 466, 96, true, 9);
      // single-chunk band
      ctx.fillStyle = 'rgba(34,141,92,0.12)';
      ctx.fillRect(460, 176, 76, 32);
      sceneLabel(ctx, '单块规模', 468, 196, true, 9);
      // current bar
      let level: number;
      if (s.stage === 0) level = 0.95;
      else if (s.stage === 1) level = 0.22;
      else level = 0.24 + (s.done ? 0 : Math.abs(Math.sin(time * 0.006)) * 0.06);
      const barH = level * 124;
      ctx.fillStyle = s.stage === 0 ? 'rgba(196,63,82,0.55)' : level < 0.4 ? C.green : C.blue;
      ctx.fillRect(486, 208 - barH, 26, barH);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(486, 84, 26, 124);
      sceneLabel(ctx, '实测：1.3B 模型 24 FPS（H 系列 GPU）· 10 FPS（RTX 4090）· FPS 越高越好', 32, 240, true, 11);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (s.sweeping) {
        const el = (t - sweepTs.current) / 500;
        const idx = Math.floor(el);
        if (idx >= 5) {
          s.sweeping = false;
          s.sweep = 5;
          s.done = true;
          setDone(true);
          setFeedback({
            text: '时间换空间：显存峰值=单块规模，链路全程可微，特征学得更准。旁注：再配 Tiny-VAE 与 torch.compile，1.3B 模型达 24 FPS（H 系列）/ 10 FPS（RTX 4090）。',
            cls: 'good',
          });
        } else {
          s.sweep = idx;
        }
      }
      render(s, t);
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

  const next = () => {
    const s = stateRef.current;
    if (s.stage === 0) {
      s.stage = 1;
      setStage(1);
      setFeedback({ text: STAGE_TEXTS[1], cls: '' });
    } else if (s.stage === 1) {
      s.stage = 2;
      s.sweep = 0;
      s.done = false;
      s.sweeping = true;
      sweepTs.current = performance.now();
      setStage(2);
      setFeedback({ text: STAGE_TEXTS[2], cls: '' });
    }
  };

  const prev = () => {
    const s = stateRef.current;
    if (s.stage === 2) {
      s.stage = 1;
      s.sweeping = false;
      s.done = false;
      s.sweep = 0;
      setStage(1);
      setDone(false);
      setFeedback({ text: STAGE_TEXTS[1], cls: '' });
    } else if (s.stage === 1) {
      s.stage = 0;
      setStage(0);
      setFeedback({ text: STAGE_TEXTS[0], cls: '' });
    }
  };

  const reset = () => {
    const s = stateRef.current;
    s.stage = 0;
    s.sweep = 0;
    s.sweeping = false;
    s.done = false;
    setStage(0);
    setDone(false);
    setFeedback({ text: STAGE_TEXTS[0], cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={prev} disabled={stage === 0}>
          上一步
        </button>
        <button className="chip" onClick={next} disabled={stage === 2}>
          {stage === 2 ? (done ? '已完成' : '进行中…') : '下一步'}
        </button>
        <button className="chip" onClick={reset}>
          重置
        </button>
        <label>
          阶段 <span className="val">{stage} / 2</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9Backprop;

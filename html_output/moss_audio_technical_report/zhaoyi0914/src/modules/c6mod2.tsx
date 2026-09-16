import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6.2 — ASR ensemble + forced alignment (P2 step-through, paper §3.2).
// Steps: multi-ASR pseudo-labels -> inter-system WER filtering -> forced
// alignment (word-level timestamps) -> sentence-level aggregation.
const W = 1080;
const H = 280;
const MAX_STEP = 4;
const STAGE = ['多 ASR 集成', 'WER 一致性筛选', '强制对齐', '句级聚合'];

export const C6Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，观察语音分支的 ASR 与时间戳对齐流程。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const x0 = 60;
    const x1 = W - 60;
    const xOf = (t: number) => x0 + (t / 10) * (x1 - x0);

    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '15px "Segoe UI", sans-serif';

      // audio timeline (bottom)
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, 230);
      ctx.lineTo(x1, 230);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      for (let s = 0; s <= 10; s += 2) {
        const x = xOf(s);
        ctx.beginPath();
        ctx.moveTo(x, 225);
        ctx.lineTo(x, 235);
        ctx.stroke();
        ctx.fillText(s + 's', x - 8, 252);
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('音频', x0, 270);

      if (k === 1) {
        const models = ['Qwen3-Omni', 'FunASR Nano', 'Qwen3-ASR'];
        models.forEach((m, i) => {
          const y = 40 + i * 52;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0, y, 320, 40);
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0, y, 320, 40);
          ctx.fillStyle = '#21324a';
          ctx.fillText(m, x0 + 12, y + 26);
          ctx.fillStyle = '#68778f';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText('→ 转写假设', x0 + 210, y + 26);
          ctx.font = '15px "Segoe UI", sans-serif';
        });
      } else if (k === 2) {
        const rows = [
          { m: 'Qwen3-Omni', wer: 'WER 11%', keep: true },
          { m: 'FunASR Nano', wer: 'WER 34%', keep: false },
          { m: 'Qwen3-ASR', wer: 'WER 29%', keep: false },
        ];
        rows.forEach((r, i) => {
          const y = 40 + i * 52;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0, y, 320, 40);
          ctx.strokeStyle = r.keep ? '#228d5c' : '#c43f52';
          ctx.lineWidth = 2;
          ctx.strokeRect(x0, y, 320, 40);
          ctx.fillStyle = '#21324a';
          ctx.font = '15px "Segoe UI", sans-serif';
          ctx.fillText(r.m, x0 + 12, y + 26);
          ctx.fillStyle = r.keep ? '#228d5c' : '#c43f52';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(r.wer + (r.keep ? ' · 保留' : ' · 丢弃'), x0 + 200, y + 26);
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('系统间 WER 越低越一致；分歧大的样本被丢弃', x0 + 380, 60);
      } else if (k === 3) {
        // word-level alignment on the timeline
        const words = [
          { w: '今天', t: 0.4 },
          { w: '天气', t: 2.2 },
          { w: '很好', t: 4.0 },
          { w: '我们', t: 6.1 },
          { w: '出发', t: 7.8 },
        ];
        words.forEach((it) => {
          const x = xOf(it.t);
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 150);
          ctx.lineTo(x, 230);
          ctx.stroke();
          ctx.fillStyle = '#27446e';
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText(it.w, x + 4, 145);
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('强制对齐（MMS_FA）：为每个词生成时间戳', x0, 60);
      } else if (k === 4) {
        // sentence-level aggregation
        const segs = [
          { a: 0.3, b: 5.0, label: '句 1 · 0.3–5.0s' },
          { a: 5.6, b: 8.6, label: '句 2 · 5.6–8.6s' },
        ];
        segs.forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#27446e' : '#7c3aed';
          ctx.fillRect(xOf(s.a), 170, xOf(s.b) - xOf(s.a), 34);
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(s.label, xOf(s.a) + 8, 192);
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('词级时间戳聚合为句级片段，得到句级时间戳', x0, 60);
      }
    };
    const tick = () => {
      render(stateRef.current.step);
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

  const go = (d: number) => {
    const s = Math.max(0, Math.min(MAX_STEP, step + d));
    stateRef.current.step = s;
    setStep(s);
    const msgs = [
      '点击下一步，观察语音分支的 ASR 与时间戳对齐流程。',
      '第 1 步：多个 ASR 系统分别生成转写假设（伪标签）。',
      '第 2 步：用系统间 WER 做一致性筛选，丢弃分歧大的样本。',
      '第 3 步：强制对齐（MMS_FA）为每个词生成时间戳。',
      '第 4 步：词级时间戳聚合为句级片段。',
    ];
    setFb({ text: msgs[s], cls: s === MAX_STEP ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === MAX_STEP}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">
          {step === 0 ? '未开始' : STAGE[step - 1]} · 第 {step} 步 / {MAX_STEP}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C6Mod2;

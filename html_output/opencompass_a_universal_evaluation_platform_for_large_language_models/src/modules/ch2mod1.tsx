import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch2 M2.1 — "Base vs Chat 模型" (P4 chips, technical view).
// Switch the evaluated object and see its inference paradigm: perplexity (base) vs generation (chat).
const W = 560;
const H = 220;
type Mode = 'base' | 'chat';

export const Ch2Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'base' });
  const [mode, setMode] = useState<Mode>('base');
  const [feedback, setFeedback] = useState({ text: 'Base 模型只会「续写」，用困惑度衡量它对文本的把握。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { mode: Mode }) => {
      clear(ctx, W, H);
      if (s.mode === 'base') {
        label(ctx, 'Base 模型：文本续写（perplexity 评测）', 40, 30, 14, C.ink, 'left', 700);
        ctx.fillStyle = '#fff';
        rr(ctx, 40, 50, 480, 56, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 40, 50, 480, 56, 6);
        ctx.stroke();
        label(ctx, '今天天气很好，', 56, 78, 16, C.muted, 'left', 600);
        label(ctx, '我们去公园散步。', 176, 78, 16, C.blue, 'left', 700);
        label(ctx, '前缀（已给）', 60, 128, 11, C.muted, 'left');
        label(ctx, '续写（模型预测）', 210, 128, 11, C.blue, 'left');
        label(ctx, '困惑度', 40, 158, 13, C.ink, 'left', 700);
        ctx.fillStyle = C.axis;
        ctx.fillRect(120, 148, 300, 20);
        ctx.fillStyle = C.green;
        ctx.fillRect(120, 148, 80, 20);
        label(ctx, '低 · 续写越流畅', 440, 158, 12, C.green, 'right', 700);
      } else {
        label(ctx, 'Chat 模型：指令跟随（生成式评测）', 40, 30, 14, C.ink, 'left', 700);
        ctx.fillStyle = C.blue;
        rr(ctx, 40, 50, 200, 40, 8);
        ctx.fill();
        label(ctx, '请用一句话总结本文', 140, 70, 13, '#fff', 'center', 700);
        ctx.fillStyle = '#fff';
        rr(ctx, 260, 50, 260, 56, 8);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 260, 50, 260, 56, 8);
        ctx.stroke();
        label(ctx, '本文提出统一评测平台。', 390, 78, 13, C.ink, 'center', 600);
        label(ctx, '指令', 140, 116, 11, C.muted, 'center');
        label(ctx, '生成作答', 390, 116, 11, C.green, 'center');
        label(ctx, '指令遵循度', 40, 158, 13, C.ink, 'left', 700);
        ctx.fillStyle = C.axis;
        ctx.fillRect(120, 148, 300, 20);
        ctx.fillStyle = C.green;
        ctx.fillRect(120, 148, 270, 20);
        label(ctx, '高 · 遵循指令', 440, 158, 12, C.green, 'right', 700);
      }
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(
      m === 'base'
        ? { text: 'Base 模型只会「续写」，用困惑度衡量它对文本的把握，推理范式是 perplexity。', cls: 'good' }
        : { text: 'Chat 模型通过「生成作答」被评测，衡量它能否遵循指令、多轮交互，推理范式是 generation。', cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'base' ? 'selected' : ''}`} onClick={() => choose('base')}>
          Base 模型
        </button>
        <button className={`chip ${mode === 'chat' ? 'selected' : ''}`} onClick={() => choose('chat')}>
          Chat 模型
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;

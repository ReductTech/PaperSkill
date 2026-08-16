import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, sheet, label } from './kit';

// Ch2 M2.2 — "客观 vs 主观评测" (P4 chips, technical view).
// The learner switches between the two evaluation families and reads their protocol.
const W = 560;
const H = 230;
type Mode = 'obj' | 'subj';

export const Ch2Mod2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'obj' });
  const [mode, setMode] = useState<Mode>('obj');
  const [feedback, setFeedback] = useState({ text: '客观评测有标准答案，规则即可判定对错。', cls: 'good' });

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
      if (s.mode === 'obj') {
        sheet(ctx, 30, 30, 300, 150, '#fff', 3);
        label(ctx, '巴黎是哪个国家的首都？', 44, 58, 14, C.ink, 'left', 700);
        const opts = ['A. 伦敦', 'B. 巴黎', 'C. 东京', 'D. 柏林'];
        for (let i = 0; i < 4; i++) {
          const y = 84 + i * 22;
          const correct = i === 1;
          ctx.fillStyle = correct ? C.green : '#fff';
          rr(ctx, 44, y, 250, 18, 4);
          ctx.fill();
          ctx.strokeStyle = correct ? C.green : C.axis;
          ctx.lineWidth = correct ? 2 : 1;
          rr(ctx, 44, y, 250, 18, 4);
          ctx.stroke();
          ctx.lineWidth = 1;
          label(ctx, opts[i], 54, y + 9, 12, correct ? '#fff' : C.ink, 'left', correct ? 700 : 400);
        }
        label(ctx, '规则匹配 → Accuracy', 180, 196, 13, C.green, 'center', 700);
        label(ctx, '标准答案可直接判定', 420, 110, 12, C.muted, 'center');
      } else {
        sheet(ctx, 30, 30, 260, 150, '#fff', 5);
        label(ctx, '开放式作答：写一段观点', 44, 58, 12, C.ink, 'left', 700);
        const dims = ['连贯性', '可用性', '指令遵循'];
        const scores = [82, 90, 74];
        for (let i = 0; i < 3; i++) {
          const y = 52 + i * 40;
          label(ctx, dims[i], 330, y, 12, C.ink, 'left', 700);
          ctx.fillStyle = C.axis;
          ctx.fillRect(400, y - 6, 120, 12);
          ctx.fillStyle = C.blue;
          ctx.fillRect(400, y - 6, (scores[i] / 100) * 120, 12);
          label(ctx, `${scores[i]}`, 530, y, 11, C.blue, 'right', 700);
        }
        label(ctx, 'LLM 裁判多维打分', 400, 180, 13, C.purple, 'center', 700);
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
      m === 'obj'
        ? { text: '客观评测：有唯一标准答案，用 Accuracy / EM / F1 等指标，完全可复现、成本低。', cls: 'good' }
        : { text: '主观评测：开放式生成没有唯一答案，需 LLM-as-a-Judge 做多维质量打分。', cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'obj' ? 'selected' : ''}`} onClick={() => choose('obj')}>
          客观评测
        </button>
        <button className={`chip ${mode === 'subj' ? 'selected' : ''}`} onClick={() => choose('subj')}>
          主观评测
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod2;

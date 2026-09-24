import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawArm,
  drawVerdict,
  drawTokenChip,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 4.2 「从口令还原动作」 — the inverse of discretization: step through
// the 8 tokens; each bin maps back to a continuous component (de-tokenize) and
// the arm executes it. This is exactly what the real robot does at inference.
const W = 1080;
const H = 280;

// the paper's 8-dim format "terminate Δposx Δposy Δposz Δrotx Δroty Δrotz
// gripper"; the paper's own example string prints 7 numbers (one dim short),
// so this instantiation follows the 8-dim format with the gripper token added.
// bin → value: v = (bin − 128) / 128 × range (pos ±0.1 m, rot ±30°, gripper 0..1)
const TOKENS = [
  { v: '1', dim: '终止位', val: '1' },
  { v: '128', dim: 'Δposₓ', val: '+0.000 m' },
  { v: '91', dim: 'Δpos_y', val: '−0.029 m' },
  { v: '241', dim: 'Δpos_z', val: '+0.088 m' },
  { v: '5', dim: 'Δrotₓ', val: '−28.8°' },
  { v: '101', dim: 'Δrot_y', val: '−6.3°' },
  { v: '127', dim: 'Δrot_z', val: '−0.2°' },
  { v: '30', dim: '夹爪', val: '合拢' },
];

const SUB = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈'];

export const Ch4Detoken: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 }); // 0..5 (0 = nothing yet)
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '按下一步：把口令逐个翻译回连续分量，机械臂照着走。',
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
    let raf: number | null = null;

    const render = (ms: number) => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // token row at top
      const gap = 100;
      const x0 = W / 2 - ((TOKENS.length - 1) * gap) / 2;
      TOKENS.forEach((tk, i) => {
        const done = i < st.step;
        const active = i === st.step - 1;
        drawTokenChip(ctx, x0 + i * gap, 58, tk.v, done ? (active ? C.orange : C.green) : '#cfd8e3');
        // arrow down when done
        if (done) {
          ctx.strokeStyle = active ? C.orange : C.green;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(x0 + i * gap, 76);
          ctx.lineTo(x0 + i * gap, 118);
          ctx.stroke();
          ctx.setLineDash([]);
          drawSceneLabel(ctx, tk.dim, x0 + i * gap, 140, {
            color: active ? C.orange : C.text,
            align: 'center',
          });
          drawSceneLabel(ctx, tk.val, x0 + i * gap, 162, {
            color: C.muted,
            align: 'center',
          });
        }
      });
      drawSceneLabel(ctx, '反 token 化：档位 → 连续分量', 30, 34, { color: C.purple });

      // the arm executes progressively: angle accumulates with each decoded
      // rotation token (tokens 5-7), gripper closes on the final token
      const rotTokens = [0, 0, 0, 0, -0.5, -0.11, -0.04, 0]; // per-token angle share
      let angle = 0.25;
      for (let i = 0; i < st.step; i++) angle += rotTokens[i] * 0.55;
      const gripClosed = st.step >= TOKENS.length;
      drawArm(ctx, W / 2, 250, {
        scale: 2.2,
        angle,
        grip: gripClosed ? 0.15 : 1,
      });
      const status = gripClosed
        ? '旋转并合拢夹爪'
        : st.step > 4
          ? '旋转中…'
          : st.step > 0
            ? '平移末端'
            : '待命';
      drawSceneLabel(ctx, status, W / 2 + 120, 230, {
        color: C.blue,
      });

      // final verdict
      if (st.step >= TOKENS.length) {
        drawVerdict(ctx, W - 90, 70, true, { r: 16, pulse: ms / 350 });
      }

      drawLegend(
        ctx,
        [
          ['已解码', C.green],
          ['当前', C.orange],
          ['未解码', C.muted],
        ],
        30,
        H - 16
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const tick = (ms: number) => {
      render(ms);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const next = () => {
    const st = stateRef.current;
    if (st.step >= TOKENS.length) return;
    st.step += 1;
    setStep(st.step);
    const tk = TOKENS[st.step - 1];
    if (st.step === 1) {
      setFeedback({ text: `第${SUB[0]}步：终止位 = ${tk.val}（先记下，任务完成时才触发）。`, cls: '' });
    } else if (st.step < TOKENS.length) {
      setFeedback({ text: `第${SUB[st.step - 1]}步：${tk.dim} 第 ${tk.v} 档 → ${tk.val}，机械臂照做。`, cls: '' });
    } else {
      setFeedback({
        text: '整串口令还原完毕：档位数变回连续分量，机械臂执行——这就是推理时的反 token 化。',
        cls: 'good',
      });
    }
  };
  const prev = () => {
    const st = stateRef.current;
    if (st.step <= 0) return;
    st.step -= 1;
    setStep(st.step);
    setFeedback({ text: `回退到第 ${st.step} 步。`, cls: '' });
  };
  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setFeedback({ text: '已复位。按下一步逐个解码。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="tiny" onClick={prev} disabled={step === 0}>
          上一步
        </button>
        <button type="button" className="tiny" onClick={next} disabled={step >= TOKENS.length}>
          {step >= TOKENS.length ? '完成' : '下一步'}
        </button>
        <button type="button" className="tiny" onClick={reset} disabled={step === 0}>
          复位
        </button>
        <span className="step-label">
          {step} / {TOKENS.length}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Detoken;

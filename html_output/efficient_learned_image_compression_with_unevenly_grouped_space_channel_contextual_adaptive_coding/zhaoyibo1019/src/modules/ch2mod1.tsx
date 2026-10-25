import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { photo } from './photokit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

const STEPS = [
  { label: '输入图 x', desc: '原始图像进入编码端。', judge: 'x 是原始图像。', cls: '' },
  { label: '潜变量 y', desc: '分析网络 ga 逐层下采样，得到连续潜变量 y。', judge: 'y 是连续的，尚未量化。', cls: '' },
  { label: '量化 ⌈·⌋', desc: '连续值取整到最近的整数。', judge: '量化取整，产生离散符号。', cls: 'good' },
  { label: '符号 ŷ', desc: '得到离散符号 ŷ，可送入熵编码。', judge: '得到离散 ŷ，可熵编码。', cls: 'good' },
];

// P2 step-through: image -> analysis -> quantization -> symbols.
export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0].judge, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawGrid = (gx: number, gy: number, gw: number, gh: number, cols: number, rows: number, q: number) => {
      const cw = gw / cols;
      const ch = gh / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = (c + r) / (cols + rows - 2);
          let val = v;
          if (q > 0) val = Math.round(v * 3) / 3;
          const gray = Math.round(80 + val * 120);
          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray + 20})`;
          ctx.fillRect(gx + c * cw + 2, gy + r * ch + 2, cw - 4, ch - 4);
        }
      }
    };

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const st = STEPS[s.step];
      if (st.label === '输入图 x') {
        photo(ctx, 60, 40, 300, 220, 1);
      } else {
        drawGrid(60, 40, 300, 220, 4, 3, st.label === '量化 ⌈·⌋' || st.label === '符号 ŷ' ? 1 : 0);
      }
      drawGrid(520, 40, 500, 220, 6, 4, st.label === '量化 ⌈·⌋' || st.label === '符号 ŷ' ? 1 : 0);

      ctx.fillStyle = '#27446e';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText(st.label, 60, 28);
    };

    const tick = () => {
      render(stateRef.current);
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
    const s = clamp(next, 0, STEPS.length - 1);
    stateRef.current.step = s;
    setStep(s);
    setFeedback({ text: STEPS[s].judge, cls: STEPS[s].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / {STEPS.length} · {STEPS[step].label}
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
          下一步 →
        </button>
      </div>
      <div className="step-desc">{STEPS[step].desc}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;

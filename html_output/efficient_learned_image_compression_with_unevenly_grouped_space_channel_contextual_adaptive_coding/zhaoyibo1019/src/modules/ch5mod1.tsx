import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const GROUPS = [16, 16, 32, 64, 192];

// P2 step-through: decode the 5 uneven groups one parallel step at a time.
export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '步进解码，看 5 个非均匀分组如何并行解完。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const total = GROUPS.reduce((a, b) => a + b, 0);
      const gap = 10;
      const areaW = W - 120;
      let cx = 80;
      const y = 90;
      const hh = 90;
      GROUPS.forEach((g, i) => {
        const gw = (g / total) * (areaW - gap * (GROUPS.length - 1));
        const done = i < s.step;
        ctx.fillStyle = done ? '#228d5c' : '#d7deea';
        ctx.fillRect(cx, y, gw, hh);
        ctx.fillStyle = done ? '#ffffff' : '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(String(g), cx + 8, y + 22);
        cx += gw + gap;
      });

      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('已解码组数 = ' + s.step, 80, 60);
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
    const s = clamp(next, 0, GROUPS.length);
    stateRef.current.step = s;
    setStep(s);
    if (s === 0) setFeedback({ text: '还没开始：5 个组都等着解码。', cls: '' });
    else if (s < 3) setFeedback({ text: '前 ' + s + ' 组已解：前面组通道少、含主要信息。', cls: 'good' });
    else if (s < GROUPS.length) setFeedback({ text: '继续：后面的组通道多、补细节。', cls: '' });
    else setFeedback({ text: '5 步解完——比 10 切片更快。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          <b>{step}</b> / {GROUPS.length} 组
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === GROUPS.length}>
          下一步 →
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;

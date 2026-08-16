import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, ruler, label } from './kit';

// Ch1 M1.1 — "碎片化的两大来源" (P1 sliders, hybrid view).
// 1) 基准数量越多，评分尺与刻度轴越失配；2) 同一模型换一种 prompt 措辞，分数就漂移。
const W = 560;
const H = 240;

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ n: 4, prompt: 0 });
  const [n, setN] = useState(4);
  const [prompt, setPrompt] = useState(0);
  const [feedback, setFeedback] = useState({ text: '拖动两个滑块，看基准增多与 prompt 措辞变化如何让评测失稳。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { n: number; prompt: number }) => {
      clear(ctx, W, H);
      const { n, prompt } = s;
      // 左：各基准的评分尺对不齐。
      const y0 = 20;
      const rowH = Math.max(13, 120 / n);
      for (let i = 0; i < n; i++) {
        const y = y0 + i * rowH + 8;
        const drift = (i % 3) * 5;
        ruler(ctx, 24, y + drift, 170, 8, i % 2 ? C.red : C.muted, C.red);
        label(ctx, `基准${i + 1}`, 24, y + drift - 8, 9, C.muted);
      }
      label(ctx, '各基准的评分尺对不齐', 108, 8, 11, C.ink, 'center', 700);
      // 右：不同刻度轴的分数不可比。
      const bx = 300;
      const bw = 230;
      const bh = 150;
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(bx, 20, bw, bh);
      const barW = Math.max(7, (bw - 20) / n - 6);
      for (let i = 0; i < n; i++) {
        const h = 15 + (i * 47) % (bh - 30);
        const x = bx + 12 + i * ((bw - 20) / n);
        ctx.fillStyle = i % 3 === 0 ? C.red : i % 3 === 1 ? C.orange : C.muted;
        ctx.fillRect(x, 20 + bh - h, barW, h);
      }
      label(ctx, '不同刻度轴，分数不可比', bx + bw / 2, 15, 10, C.red, 'center', 700);
      // 底部：prompt 敏感性——同一模型的分数随措辞漂移。
      const by = 196;
      label(ctx, '同一模型·同一基准，换个问法', 24, by - 14, 11, C.ink, 'left', 700);
      const baseline = 0.5;
      const score = baseline - (prompt / 100) * 0.28;
      ctx.fillStyle = C.axis;
      ctx.fillRect(24, by, 320, 16);
      const scoreW = Math.max(0.06, score) * 320;
      ctx.fillStyle = prompt > 50 ? C.red : prompt > 20 ? C.orange : C.green;
      ctx.fillRect(24, by, scoreW, 16);
      label(ctx, `${Math.round(score * 100)} 分`, 24 + scoreW + 6, by + 8, 11, C.ink, 'left', 700);
      ctx.strokeStyle = C.red;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(24 + (baseline - 0.28) * 320, by - 4);
      ctx.lineTo(24 + (baseline - 0.28) * 320, by + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, '分数随措辞漂移', 440, by + 8, 11, C.red, 'center', 700);
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

  const computeFb = (s: { n: number; prompt: number }) => {
    if (s.prompt > 50) {
      return { text: '换一种措辞，同一模型的分数大幅漂移（prompt 高度敏感）——评测结果不稳定。', cls: 'bad' };
    }
    if (s.n >= 8) {
      return { text: `${s.n} 套基准的评分尺与刻度轴互相失配，分数难以横向比较。`, cls: 'bad' };
    }
    if (s.n >= 5) {
      return { text: `${s.n} 套基准开始出现标准不一致，统一管理吃力。`, cls: '' };
    }
    return { text: `${s.n} 套基准尚少、措辞稳定时，还能靠手工勉强对齐。`, cls: 'good' };
  };

  const onN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Math.round(3 + (Number(e.target.value) / 100) * 7);
    stateRef.current.n = n;
    setN(n);
    setFeedback(computeFb(stateRef.current));
  };

  const onPrompt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Number(e.target.value);
    stateRef.current.prompt = p;
    setPrompt(p);
    setFeedback(computeFb(stateRef.current));
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          基准数量 <span className="val">{n}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(((n - 3) / 7) * 100)} onChange={onN} />
      </div>
      <div className="ctrl">
        <label>
          prompt 措辞差异 <span className="val">{prompt}</span>
        </label>
        <input type="range" min={0} max={100} value={prompt} onChange={onPrompt} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;

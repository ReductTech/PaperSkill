import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label, drawBar, drawCaptionPair } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 280;

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ qa: 4 });
  const rafRef = useRef<number | null>(null);
  const [qa, setQa] = useState(4);
  const [feedback, setFeedback] = useState({
    text: '拖动问答数：DepthLM 视觉标记要复制多图；VLM3 文本坐标同图打包，成本几乎不增。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const n = stateRef.current.qa;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);

      // —— 左：DepthLM 多图副本 ——
      label(ctx, 'DepthLM 视觉标记', 24, 22, C.red, 13);
      const copies = Math.min(n, 4);
      for (let i = 0; i < copies; i++) {
        const x = 24 + (i % 2) * 110;
        const y = 36 + Math.floor(i / 2) * 72;
        drawWindow(ctx, x, y, 92, 52, C.red);
        drawDot(ctx, x + 30 + i * 6, y + 26, 4, C.red);
        // 角标代替窗下文字，避免与下一行重叠
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(x + 14, y + 14, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x + 14, y + 14);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      if (n > 4) {
        label(ctx, '+' + (n - 4) + ' 图', 140, 188, C.red, 12);
      }
      drawBar(ctx, 24, 200, 200, 10, n / 10, C.red);

      // —— 右：VLM3 单图 + QA 列表 ——
      label(ctx, 'VLM3 文本坐标 + 打包', 300, 22, C.green, 13);
      drawWindow(ctx, 300, 40, 100, 70, C.blue);
      drawDot(ctx, 348, 72, 4, C.orange);
      label(ctx, '1 张图', 322, 128, C.green, 12);

      const show = Math.min(n, 5);
      for (let i = 0; i < show; i++) {
        const y = 40 + i * 24;
        ctx.fillStyle = '#e8f5ee';
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.5;
        ctx.fillRect(420, y, 110, 20);
        ctx.strokeRect(420, y, 110, 20);
        label(ctx, 'QA' + (i + 1), 452, y + 14, C.green, 11);
      }
      if (n > 5) {
        label(ctx, '…共 ' + n + ' QA', 430, 168, C.blue, 12);
      }
      drawBar(ctx, 300, 200, 230, 10, 0.12 + n * 0.015, C.green);

      drawCaptionPair(ctx, W, H, '成本 ' + n + ' 图', '成本≈1 图（如 10 QA）', C.red, C.green);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const onChange = (v: number) => {
    const n = clamp(v, 1, 10);
    stateRef.current.qa = n;
    setQa(n);
    setFeedback(n >= 8
      ? { text: '同图 ' + n + ' 问：旧法约需 ' + n + ' 张带标记图；VLM3 仍 1 张图 + 文本 QA。', cls: 'good' }
      : { text: '问答数 ' + n + '：DepthLM 成本×' + n + '；VLM3 用 [0,2000) 文本引用，几乎不增图成本。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>同图问答数 <span className="val">{qa}</span></label>
        <input type="range" min={1} max={10} value={qa} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;

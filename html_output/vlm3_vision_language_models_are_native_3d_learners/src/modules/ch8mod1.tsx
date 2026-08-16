import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label, drawBar } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(0);
  const info = [
    '① 统一焦距：resize 使有效 f→1000px，消相机歧义，可混数据训练。',
    '② 文本引用：像素/区域写入 [0,2000)，无需视觉标记或额外编码器。',
    '③ 配比 SFT：数据混合与规模放大 + 标准下一词训练。',
  ];
  const [feedback, setFeedback] = useState({ text: info[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const nodes = [
      { t: '统一焦距', x: 90 },
      { t: '文本引用', x: 280 },
      { t: '配比SFT', x: 470 },
    ];
    const render = () => {
      const st = stateRef.current.stage;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      nodes.forEach((n, i) => {
        ctx.beginPath();
        ctx.fillStyle = i === st ? C.purple : '#fff';
        ctx.strokeStyle = C.purple; ctx.lineWidth = i === st ? 3 : 2;
        ctx.arc(n.x, 100, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        label(ctx, n.t, n.x - 28, 160, i === st ? C.purple : C.muted, 13);
        if (i < 2) {
          ctx.strokeStyle = i < st ? C.green : C.border; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(n.x + 36, 100); ctx.lineTo(nodes[i + 1].x - 36, 100); ctx.stroke();
        }
      });
      label(ctx, 'VLM3 方法流水线（Fig. 2）', 150, 40, C.text, 14);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      nodes.forEach((n, i) => {
        const dx = x - n.x, dy = y - 100;
        if (dx * dx + dy * dy < 40 * 40) {
          stateRef.current.stage = i; setStage(i);
          setFeedback({ text: info[i] + (i === 2 ? '（绿）' : '（蓝）'), cls: i === 2 ? 'good' : '' });
        }
      });
    };
    canvas.addEventListener('click', onClick);
    return () => { stop(); d(); canvas.removeEventListener('click', onClick); };
  }, []);

  const pick = (i: number) => {
    stateRef.current.stage = i; setStage(i);
    setFeedback({ text: info[i] + (i === 2 ? '（绿）' : '（蓝）'), cls: i === 2 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        {['① 统一', '② 文本', '③ 配比'].map((n, i) => (
          <button key={n} type="button" className={`chip ${stage === i ? 'on' : ''}`} onClick={() => pick(i)}>{n}</button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;

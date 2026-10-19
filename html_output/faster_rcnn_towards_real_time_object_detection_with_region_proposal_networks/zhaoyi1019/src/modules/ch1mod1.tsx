import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const STAR = '#dfe7f5';
const RED = '#c43f52';
const GREEN = '#228d5c';

const TEXTS = [
  '外部提案还没开始，先扫视整片星空。',
  '提案在逐格扫描，非常慢：Selective Search 约 2 秒/张。',
  '找到候选区域了，但这一步已经和检测一样耗时。',
  '检测很快，瓶颈正是前面的提案，正是 Faster R-CNN 要解决的。',
];

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({ text: TEXTS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: number) => {
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 60, W, 60);
      // sky stars
      ctx.fillStyle = DIM;
      for (const [x, y] of [[80, 60], [220, 130], [360, 70], [500, 170], [640, 80], [780, 150], [920, 70], [1010, 130]] as const) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // scanning beam (stage 1)
      if (s >= 1) {
        const bx = 160 + s * 180;
        const g = ctx.createLinearGradient(bx - 70, 0, bx + 70, 0);
        g.addColorStop(0, 'rgba(196,63,82,0)');
        g.addColorStop(0.5, 'rgba(196,63,82,0.5)');
        g.addColorStop(1, 'rgba(196,63,82,0)');
        ctx.fillStyle = g;
        ctx.fillRect(bx - 70, 0, 140, H - 60);
      }
      // proposal box (stage 2/3)
      if (s >= 2) {
        const fx = 520;
        const fy = 120;
        ctx.strokeStyle = s >= 3 ? GREEN : RED;
        ctx.lineWidth = 3;
        ctx.strokeRect(fx - 40, fy - 40, 80, 80);
        ctx.fillStyle = STAR;
        ctx.beginPath();
        ctx.arc(fx, fy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s >= 3 ? GREEN : RED;
        ctx.font = '18px sans-serif';
        ctx.fillText(s >= 3 ? '检测：确认' : '提案：候选', fx - 50, fy + 60);
      }
      // progress
      ctx.fillStyle = '#21324a';
      ctx.fillRect(40, H - 40, (W - 80) * ((s + 1) / 4), 12);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(40, H - 40, W - 80, 12);
    };
    render(stage);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [stage]);

  const step = () => {
    const n = Math.min(3, stage + 1);
    setStage(n);
    setFeedback({ text: TEXTS[n], cls: n >= 3 ? 'good' : n >= 1 ? 'bad' : '' });
  };
  const reset = () => {
    setStage(0);
    setFeedback({ text: TEXTS[0], cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={step} disabled={stage >= 3}>
          {stage >= 3 ? '完成' : '下一步'}
        </button>
        <button type="button" onClick={reset}>
          重置
        </button>
        <span className="val">{stage + 1} / 4</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;

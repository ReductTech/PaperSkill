import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const STAR = '#dfe7f5';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const TUBE = '#8a97b8';
const TUBE_DARK = '#5c6b8f';
const BORDER = '#d7deea';

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '点击「开始」，同步比较共享与独立两套光路。',
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

    const star = (x: number, y: number, r = 5) => {
      ctx.fillStyle = STAR;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (p: number) => {
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 52, W, 52);
      ctx.strokeStyle = BORDER;
      ctx.strokeRect(30, 24, 500, 190);
      ctx.strokeRect(550, 24, 500, 190);

      // 左：共享光路 —— 一颗星，一束光分给寻星镜和目镜（同一镜筒）
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText('共享', 46, 46);
      star(150, 120);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(150, 120);
      ctx.lineTo(150 + p * 120, 100);
      ctx.moveTo(150, 120);
      ctx.lineTo(150 + p * 120, 150);
      ctx.stroke();
      ctx.fillStyle = TUBE;
      ctx.fillRect(270, 116, 90, 22);
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(270, 96, 70, 11);
      ctx.fillRect(270, 148, 54, 13);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.strokeRect(430, 78, 58, 58);

      // 右：独立光路 —— 两颗星，各自发光、各自收集（两套独立镜筒）
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText('独立', 566, 46);
      star(640, 80);
      star(640, 160);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(640, 80);
      ctx.lineTo(640 + p * 120, 80);
      ctx.moveTo(640, 160);
      ctx.lineTo(640 + p * 120, 160);
      ctx.stroke();
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(760, 74, 82, 12);
      ctx.fillRect(760, 154, 82, 12);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.strokeRect(880, 58, 44, 44);
      ctx.strokeRect(880, 138, 44, 44);

      // 底部耗时条
      const bw = p * 340;
      ctx.fillStyle = GREEN;
      ctx.fillRect(40, H - 40, 80 + bw * 0.55, 14);
      ctx.fillStyle = RED;
      ctx.fillRect(560, H - 40, 80 + bw, 14);
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '16px sans-serif';
      ctx.fillText('198ms · 5fps', 46, H - 48);
      ctx.fillText('1830ms · 0.5fps', 566, H - 48);
    };

    const tick = () => {
      const p = progressRef.current;
      if (running && p < 1) {
        progressRef.current = Math.min(1, p + 0.02);
        render(progressRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else if (!running && p > 0) {
        progressRef.current = Math.max(0, p - 0.03);
        render(progressRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        render(progressRef.current);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    if (running && progressRef.current < 1) start();
    else render(progressRef.current);
    return () => {
      stop();
      disconnect();
    };
  }, [running]);

  const run = () => {
    progressRef.current = 0;
    setRunning(true);
    setFeedback({
      text: '左：一颗星、一束光分给两个头（共享）。右：两颗星各自发光、两套镜筒各自收集（独立），因此更慢。',
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={run}>
          {running ? '运行中' : '开始'}
        </button>
        <button type="button" onClick={() => setRunning(false)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;

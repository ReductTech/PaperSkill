import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
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
const ORANGE = '#f07e47';
const TUBE = '#8a97b8';
const TUBE_DARK = '#5c6b8f';
const BORDER = '#d7deea';

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shared, setShared] = useState(true);
  const [feedback, setFeedback] = useState({
    text: '共享星光：一颗星、一束光分给寻星镜和目镜，提案边际成本约 10ms。',
    cls: 'good',
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

    const render = (activeShared: boolean) => {
      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = GLOW;
      ctx.fillRect(0, H - 52, W, 52);

      // 左：共享光路
      ctx.save();
      ctx.globalAlpha = activeShared ? 1 : 0.45;
      ctx.strokeStyle = activeShared ? ORANGE : BORDER;
      ctx.lineWidth = activeShared ? 4 : 1;
      ctx.strokeRect(30, 24, 500, 190);
      ctx.restore();
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText('共享光路', 46, 46);
      star(150, 120);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(150, 120);
      ctx.lineTo(270, 100);
      ctx.moveTo(150, 120);
      ctx.lineTo(270, 150);
      ctx.stroke();
      ctx.fillStyle = TUBE;
      ctx.fillRect(270, 116, 90, 22);
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(270, 96, 70, 11);
      ctx.fillRect(270, 148, 54, 13);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      ctx.strokeRect(430, 78, 58, 58);

      // 右：独立光路（两颗星，各自发光、各自收集）
      ctx.save();
      ctx.globalAlpha = activeShared ? 0.45 : 1;
      ctx.strokeStyle = activeShared ? BORDER : ORANGE;
      ctx.lineWidth = activeShared ? 1 : 4;
      ctx.strokeRect(550, 24, 500, 190);
      ctx.restore();
      ctx.fillStyle = DIM;
      ctx.font = '16px sans-serif';
      ctx.fillText('独立光路', 566, 46);
      star(640, 80);
      star(640, 160);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(640, 80);
      ctx.lineTo(760, 80);
      ctx.moveTo(640, 160);
      ctx.lineTo(760, 160);
      ctx.stroke();
      ctx.fillStyle = TUBE_DARK;
      ctx.fillRect(760, 74, 82, 12);
      ctx.fillRect(760, 154, 82, 12);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.strokeRect(880, 58, 44, 44);
      ctx.strokeRect(880, 138, 44, 44);

      // 底部耗时条
      ctx.fillStyle = GREEN;
      ctx.fillRect(40, H - 40, 90, 14);
      ctx.fillStyle = RED;
      ctx.fillRect(560, H - 40, 300, 14);
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '16px sans-serif';
      ctx.fillText('提案 10ms', 46, H - 48);
      ctx.fillText('独立提案 ~2s', 566, H - 48);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    render(shared);
  }, [shared]);

  const toggle = () => {
    const n = !shared;
    setShared(n);
    setFeedback(
      n
        ? { text: '共享星光：一颗星、一束光分给寻星镜和目镜，提案边际成本约 10ms。', cls: 'good' }
        : { text: '独立光路：两颗星各自发光、两套镜筒各自收集，提案回到约 2 秒，成为瓶颈。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={toggle}>
          {shared ? '共享光路' : '独立光路'}
        </button>
        <span className="val">{shared ? '共享' : '独立'}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod2;

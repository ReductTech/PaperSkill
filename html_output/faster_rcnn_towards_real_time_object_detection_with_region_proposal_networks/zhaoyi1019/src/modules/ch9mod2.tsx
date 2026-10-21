import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const GREEN = '#228d5c';
const RED = '#c43f52';
const BORDER = '#d7deea';

export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nms, setNms] = useState(true);
  const [feedback, setFeedback] = useState({
    text: 'NMS 后约 2000 个候选，取前 300，mAP 不降还更省。',
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
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW;
    ctx.fillRect(0, H - 50, W, 50);
    ctx.fillStyle = '#dfe7f5';
    ctx.beginPath();
    ctx.arc(320, 130, 7, 0, Math.PI * 2);
    ctx.fill();
    if (nms) {
      // keep one green box
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 4;
      ctx.strokeRect(270, 80, 100, 100);
      ctx.strokeStyle = BORDER;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(300, 100, 90, 90);
      ctx.strokeRect(250, 70, 110, 110);
      ctx.setLineDash([]);
      ctx.fillStyle = DIM;
      ctx.font = '15px sans-serif';
      ctx.fillText('只保留最高分候选', 400, 90);
    } else {
      // many red overlapping boxes
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      const offs = [[-30, -30], [10, -20], [-15, 10], [25, 15], [-5, -5], [20, 25], [-25, 5], [15, -25], [0, 0]];
      for (const [dx, dy] of offs) {
        ctx.strokeRect(280 + dx, 80 + dy, 80, 80);
      }
      ctx.fillStyle = DIM;
      ctx.font = '15px sans-serif';
      ctx.fillText('大量重叠候选（约 6000）', 420, 90);
    }
    // counts + mAP
    ctx.fillStyle = '#122346';
    ctx.fillRect(700, 50, 320, 130);
    ctx.fillStyle = '#dfe7f5';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(nms ? '约 2000 → 前 300' : '约 6000 候选', 720, 100);
    ctx.fillStyle = DIM;
    ctx.font = '15px sans-serif';
    ctx.fillText(nms ? 'mAP 不降，检测更省' : 'mAP 55.2%，更慢', 720, 140);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [nms]);

  const toggle = () => {
    const n = !nms;
    setNms(n);
    setFeedback(
      n
        ? { text: 'NMS 后约 2000 个候选，取前 300，mAP 不降还更省。', cls: 'good' }
        : { text: '关闭 NMS 后约有 6000 个重叠候选，检测质量相当但更慢（mAP 55.2%）。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={toggle}>
          {nms ? 'NMS 开' : 'NMS 关'}
        </button>
        <span className="val">{nms ? 'NMS 开' : 'NMS 关'}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod2;

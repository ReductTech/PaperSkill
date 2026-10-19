import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

const STAGES = [
  { name: '输入图像', shape: '600×1000 单尺度', txt: '短边缩放到 600，输入一张彩色图。' },
  { name: '共享卷积', shape: '约 60×40×512', txt: '13 层卷积提取特征，末层步长 16。' },
  { name: 'RPN 提案', shape: '每位置 9 锚框 + 分数', txt: '每个位置输出目标性分数与框坐标。' },
  { name: 'NMS + top-300', shape: '约 2000 → 前 300', txt: 'NMS 阈值 0.7 去重，取前 300 个提案。' },
  { name: 'RoI + 分类回归', shape: '类别 + 精修框', txt: 'Fast R-CNN 对每个 RoI 分类并精修边框。' },
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({ text: STAGES[0].txt, cls: '' });

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
    // 5 nodes
    const n = STAGES.length;
    const y = 70;
    const gap = (W - 80) / n;
    for (let i = 0; i < n; i++) {
      const x = 50 + i * gap + gap / 2;
      const done = i < stage;
      const active = i === stage;
      ctx.fillStyle = active ? BLUE : done ? GREEN : '#122346';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x, y + 5);
      ctx.textAlign = 'left';
      if (i < n - 1) {
        ctx.strokeStyle = i < stage ? GREEN : BORDER;
        ctx.beginPath();
        ctx.moveTo(x + 26, y);
        ctx.lineTo(x + gap - 26, y);
        ctx.stroke();
      }
      ctx.fillStyle = active ? '#dfe7f5' : DIM;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(STAGES[i].name, x, y + 46);
      ctx.textAlign = 'left';
    }
    // detail panel
    ctx.fillStyle = '#122346';
    ctx.fillRect(40, 140, W - 80, 74);
    ctx.fillStyle = activeColor(stage);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(STAGES[stage].shape, 60, 176);
    ctx.fillStyle = '#dfe7f5';
    ctx.font = '16px sans-serif';
    ctx.fillText(STAGES[stage].txt, 60, 204);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [stage]);

  const step = () => {
    const n = Math.min(4, stage + 1);
    setStage(n);
    setFeedback({ text: STAGES[n].txt, cls: n >= 3 ? 'good' : '' });
  };
  const reset = () => {
    setStage(0);
    setFeedback({ text: STAGES[0].txt, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={step} disabled={stage >= 4}>
          {stage >= 4 ? '完成' : '下一步'}
        </button>
        <button type="button" onClick={reset}>
          重置
        </button>
        <span className="val">{stage + 1} / 5</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

function activeColor(stage: number) {
  return stage === 4 ? GREEN : stage === 2 ? PURPLE : BLUE;
}

export default Ch6Mod1;

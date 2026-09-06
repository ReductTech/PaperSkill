import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1 Module：识别 vs 空间感知 —— 同一图像，两种读法（真实技术问题）
const W = 460;
const H = 220;

export const M1A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'recog' | 'spatial'>('recog');
  const [feedback, setFeedback] = useState({
    text: '同一张图：语义视角只回答“这是什么”；空间视角要回答“边界在哪、离我多远、结构如何”——后者才是深度/分割/机器人要的。',
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
    const render = (m: 'recog' | 'spatial') => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 底图：一条狗的语义色块
      const cx = 150;
      const cy = 120;
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 0, W, 150);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 150, W, H - 150);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - 60, cy - 30, 120, 60);
      ctx.beginPath();
      ctx.arc(cx + 70, cy - 30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 45, cy + 30, 18, 26);
      ctx.fillRect(cx - 5, cy + 30, 18, 26);

      if (m === 'recog') {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, W, 150);
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillText('“这是一条狗” ✓', 290, 60);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('语义分类：识别任务够用', 290, 90);
      } else {
        // 深度/边界：输出缺失
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 7]);
        ctx.strokeRect(cx - 60, cy - 30, 120, 60);
        ctx.beginPath();
        ctx.arc(cx + 70, cy - 30, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillText('“边界/深度在哪？” ✗', 250, 60);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('密集预测：特征没有空间结构', 250, 90);
        // 深度排线缺失
        ctx.strokeStyle = '#c43f52';
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(60 + i * 12, 150 + i * 4);
          ctx.lineTo(70 + i * 12, 190 + i * 4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 底部说明
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('空间感知：深度估计、语义分割、视频跟踪、机器人导航都需要', 20, H - 12);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef<'recog' | 'spatial'>('recog');
  stateRef.current = mode;

  const setModeState = (m: 'recog' | 'spatial') => {
    stateRef.current = m;
    setMode(m);
    setFeedback(
      m === 'recog'
        ? { text: '语义视角：分类/检索任务够用，但从不产生“边界在哪、深度多少”这样的空间输出。', cls: 'good' }
        : { text: '空间视角：深度、分割、视频跟踪、机器人导航都要像素级结构——而这正是主流预训练最弱的一环。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'recog' ? 'active' : ''}`} onClick={() => setModeState('recog')}>
          语义识别
        </button>
        <button className={`chip ${mode === 'spatial' ? 'active' : ''}`} onClick={() => setModeState('spatial')}>
          空间感知
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1A;

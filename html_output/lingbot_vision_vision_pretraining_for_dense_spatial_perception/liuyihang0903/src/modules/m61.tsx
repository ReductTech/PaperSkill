import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6 Module：WHERE · WHAT · HOW 三卡片 + 真实战绩
const W = 560;
const H = 220;

type Card = 'where' | 'what' | 'how';

const CARDS: Record<Card, { title: string; eq: string; note: string; color: string }> = {
  where: { title: 'WHERE 在哪学', eq: 'M⁺ = M ∪ B', note: '边界强制掩码：让结构决定掩码位置。', color: '#d97706' },
  what: { title: 'WHAT 学什么', eq: '边界几何（距离·方向·端点）', note: '显式几何：把边界结构变成可学习目标。', color: '#228d5c' },
  how: { title: 'HOW 怎么自举', eq: 'vote → validate → re-render', note: '教师预测→投票→NFA 验证→重渲染干净目标。', color: '#27446e' },
};

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [card, setCard] = useState<Card>('where');
  const [feedback, setFeedback] = useState({
    text: '点击三张卡片，回顾各自机制；再看右下角真实战绩。',
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
    const render = (c: Card) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 三张卡片
      (Object.keys(CARDS) as Card[]).forEach((k, i) => {
        const x = 20 + i * 180;
        const y = 24;
        const w = 160;
        const h = 120;
        const active = c === k;
        const d = CARDS[k];
        ctx.fillStyle = active ? d.color : '#ffffff';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = active ? d.color : '#d7deea';
        ctx.lineWidth = active ? 3 : 1.6;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText(d.title, x + 14, y + 30);
        ctx.font = 'bold 12px monospace';
        ctx.fillText(d.eq, x + 14, y + 60);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = active ? 'rgba(255,255,255,0.9)' : '#68778f';
        ctx.fillText(d.note, x + 14, y + 84);
      });

      // 战绩
      const gx = 20;
      const gy = 160;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx, gy, 520, 50);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(gx, gy, 520, 50);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('NYUv2 RMSE ↓', gx + 14, gy + 22);
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('LingBot 1B: 0.296', gx + 130, gy + 24);
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('vs DINOv3 7B: 0.309（7× 参数）· 0.3B 学生 ≈ 23× 更省', gx + 280, gy + 24);

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

  const stateRef = useRef<Card>('where');
  stateRef.current = card;

  const setCardState = (c: Card) => {
    stateRef.current = c;
    setCard(c);
    setFeedback({ text: `${CARDS[c].title}：${CARDS[c].eq} —— ${CARDS[c].note}`, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${card === 'where' ? 'active' : ''}`} onClick={() => setCardState('where')}>
          WHERE
        </button>
        <button className={`chip ${card === 'what' ? 'active' : ''}`} onClick={() => setCardState('what')}>
          WHAT
        </button>
        <button className={`chip ${card === 'how' ? 'active' : ''}`} onClick={() => setCardState('how')}>
          HOW
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7 Module：关键设计依据 —— 三个“为什么”（真实技术机制）
const W = 460;
const H = 220;

type Card = 'redundancy' | 'categorical' | 'validate';

const CARDS: Record<Card, { title: string; body: string[]; color: string }> = {
  redundancy: {
    title: '① 为什么冗余能自举（Finding 1）',
    body: [
      '边界场是“多像素对应一条线段”的冗余表示：线段附近每个像素都存着足够还原整条线的信息。',
      '所以哪怕场值一开始接近随机，只要角点固定、多像素投票聚合，就能拼出可信线段——边界结构从随机初始化就能“长出来”。',
    ],
    color: '#27446e',
  },
  categorical: {
    title: '② 为什么分类化比连续回归稳定',
    body: [
      '如果直接“猜连续数”来回归边界场，在 Teacher-Student 循环里目标会漂移、最终塌缩。',
      '把连续值离散成 K 个格子的概率分布后，就能套用 DINO 的 centering/sharpening 防塌缩机制——分类化让边界学习继承自蒸馏的稳定性。',
    ],
    color: '#d97706',
  },
  validate: {
    title: '③ 为什么先验证再教',
    body: [
      'Teacher 的原始边界预测可能把“幻觉”当目标——未验证的假边界会被学生学坏。',
      '先用统计检验（无结构零假设下方向均匀分布）剔除不支持的真假候选，再重渲染成干净目标，才配教给学生。',
    ],
    color: '#228d5c',
  },
};

export const M7A: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [card, setCard] = useState<Card>('redundancy');
  const [feedback, setFeedback] = useState({
    text: '这三个设计决策支撑了“边界从零自举”：点击卡片查看各自的机制依据。',
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

      // 三张卡片标题条
      (Object.keys(CARDS) as Card[]).forEach((k, i) => {
        const x = 16 + i * 150;
        const active = c === k;
        ctx.fillStyle = active ? CARDS[k].color : '#eef2f7';
        ctx.fillRect(x, 20, 138, 44);
        ctx.strokeStyle = active ? CARDS[k].color : '#d7deea';
        ctx.lineWidth = active ? 3 : 1.6;
        ctx.strokeRect(x, 20, 138, 44);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText(['冗余自举', '分类化稳定', '先验证再教'][i], x + 26, 47);
      });

      // 内容区
      const d = CARDS[c];
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 74, 430, 120);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(16, 74, 430, 120);
      ctx.fillStyle = d.color;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(d.title, 30, 100);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      let y = 126;
      d.body.forEach((line) => {
        // 简单换行
        const maxW = 400;
        let cur = '';
        for (const ch of line) {
          if (ctx.measureText(cur + ch).width > maxW && cur) {
            ctx.fillText(cur, 30, y);
            y += 20;
            cur = ch;
          } else {
            cur += ch;
          }
        }
        if (cur) {
          ctx.fillText(cur, 30, y);
          y += 22;
        }
      });

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

  const stateRef = useRef<Card>('redundancy');
  stateRef.current = card;

  const setCardState = (c: Card) => {
    stateRef.current = c;
    setCard(c);
    setFeedback({ text: CARDS[c].title + '：' + CARDS[c].body[0].slice(0, 30) + '…', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${card === 'redundancy' ? 'active' : ''}`} onClick={() => setCardState('redundancy')}>
          冗余自举
        </button>
        <button className={`chip ${card === 'categorical' ? 'active' : ''}`} onClick={() => setCardState('categorical')}>
          分类化稳定
        </button>
        <button className={`chip ${card === 'validate' ? 'active' : ''}`} onClick={() => setCardState('validate')}>
          先验证再教
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7A;

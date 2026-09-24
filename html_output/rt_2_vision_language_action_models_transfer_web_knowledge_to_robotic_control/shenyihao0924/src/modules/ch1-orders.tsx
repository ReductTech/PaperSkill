import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawOrderCard,
  drawMenuBoard,
  drawCookbook,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Module 1.1 「点单试验台」 — P4 chips. Switch among three order types and watch
// the old employee (RT-1-style closed-set policy, red) and the new chef
// (RT-2-style VLA, green) react on the same 1080x280 canvas.
const W = 1080;
const H = 280;

type OrderType = 'in' | 'paraphrase' | 'novel';

const CHIP_LABELS: [OrderType, string][] = [
  ['in', '菜单内'],
  ['paraphrase', '菜单外同义'],
  ['novel', '语义新知'],
];

const ORDER_LABEL: Record<OrderType, string> = {
  in: '拿可乐',
  paraphrase: '请把可乐取来',
  novel: '给戴眼镜的',
};

const FEEDBACK: Record<OrderType, { text: string; cls: string }> = {
  in: { text: '见过的指令：闭集策略也能做——基础功没丢。', cls: '' },
  paraphrase: { text: '换个说法就懵：闭集策略匹配不上任何按钮。', cls: 'bad' },
  novel: {
    text: '认字、认人、推理：这些知识机器人数据里根本没有——只能来自网页。',
    cls: 'good',
  },
};

const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.save();
  ctx.fillStyle = C.orange;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const b = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const Ch1Orders: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ orderType: 'in' as OrderType });
  const [orderType, setOrderType] = useState<OrderType>('in');
  const [feedback, setFeedback] = useState(FEEDBACK.in);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { orderType: OrderType }, ms: number) => {
      const t = ms / 1000;
      const ot = s.orderType;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // left 30% — the customer order card
      drawOrderCard(ctx, 168, 100, ORDER_LABEL[ot], ot === 'novel' ? C.orange : C.blue);
      // middle 35% — old employee + button menu board
      drawChef(ctx, 428, 246, 1.4, {
        mode: ot === 'in' ? 'cook' : 'shake',
        t,
        chefColor: C.red,
      });
      drawMenuBoard(ctx, 588, 210, 1.05);
      if (ot === 'paraphrase') {
        // scan the board button by button — no match
        const cell = Math.floor(ms / 130) % 12;
        const col = cell % 3;
        const row = Math.floor(cell / 3);
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(
          588 - 26 * 1.05 + col * 19 * 1.05,
          210 - 26 * 1.05 + row * 15 * 1.05,
          15 * 1.05,
          11 * 1.05,
          2
        );
        ctx.stroke();
        ctx.restore();
      }
      if (ot === 'in') drawVerdict(ctx, 428, 148, true, { r: 18, pulse: t });
      else drawVerdict(ctx, 428, 148, false, { r: 18, pulse: t });
      // right 35% — new chef + cookbooks (web knowledge)
      drawChef(ctx, 800, 246, 1.4, { mode: 'read', t, chefColor: C.green });
      drawCookbook(ctx, 950, 246, 1.5);
      drawVerdict(ctx, 800, 148, true, { r: 18, pulse: t });
      if (ot === 'novel') drawStar(ctx, 844, 138, 9);
      // typography
      drawSceneLabel(ctx, '老员工', 398, 266);
      drawSceneLabel(ctx, '新厨师', 768, 266);
      drawLegend(
        ctx,
        [
          ['闭集策略', C.red],
          ['VLA 策略', C.green],
          ['涌现', C.orange],
        ],
        36,
        26
      );
    };

    const tick = () => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (ot: OrderType) => {
    stateRef.current.orderType = ot;
    setOrderType(ot);
    setFeedback(FEEDBACK[ot]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {CHIP_LABELS.map(([key, label]) => (
          <button
            key={key}
            className={`chip ${orderType === key ? 'selected' : ''}`}
            onClick={() => select(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Orders;

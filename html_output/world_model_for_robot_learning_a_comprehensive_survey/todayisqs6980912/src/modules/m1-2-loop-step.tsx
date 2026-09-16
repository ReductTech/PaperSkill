import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 1.2 两张循环图：缺了哪一步？（P2 步进）
// 左圈「反应式」：感知→出笔→执行，想象/修正两个槽位为红色虚线空框 + ×。
// 右圈「世界模型」：感知→想象未来→对照修正→执行。
// 每侧一枚墨点 token 沿弧线移动；每侧一个当前节点短标签（≤2 字）。

const W = 720;
const H = 280;
const R = 72;

interface Node {
  ang: number;
  name: string;
}

const LEFT_NODES: Node[] = [
  { ang: -90, name: '感知' },
  { ang: 0, name: '出笔' },
  { ang: 90, name: '执行' },
];
// 反应式每步点亮的节点（step2 停留在出笔——它没有修正可点）
const LEFT_ACTIVE: number[] = [0, 1, 1, 2];
const LEFT_GHOSTS = [-45, 45];

const RIGHT_NODES: Node[] = [
  { ang: -90, name: '感知' },
  { ang: -30, name: '想象' },
  { ang: 30, name: '修正' },
  { ang: 90, name: '执行' },
];
const RIGHT_ACTIVE: number[] = [0, 1, 2, 3];

const FEEDBACK = [
  { text: '感知：看清当前墨迹。', cls: '' },
  { text: '反应式直接出笔；世界模型先想象未来。', cls: '' },
  { text: '世界模型对照字帖修正意图——反应式没有这一步。', cls: 'bad' },
  { text: '执行落笔，回到感知，误差被拉回。', cls: 'good' },
];

const pos = (cx: number, cy: number, angDeg: number) => {
  const a = (angDeg * Math.PI) / 180;
  return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
};

export const M12LoopStep: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });

      const lc = { x: 205, y: 148 };
      const rc = { x: 515, y: 148 };

      const drawLoop = (cx: number, cy: number) => {
        ctx.save();
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };
      drawLoop(lc.x, lc.y);
      drawLoop(rc.x, rc.y);

      // 箭头（顶部入口提示，两圈一致）
      const arrow = (cx: number, cy: number) => {
        const a = (-90 * Math.PI) / 180;
        const tip = { x: cx + (R - 22) * Math.cos(a), y: cy + (R - 22) * Math.sin(a) };
        ctx.save();
        ctx.fillStyle = PALETTE.muted;
        ctx.beginPath();
        ctx.moveTo(tip.x + 6, tip.y);
        ctx.lineTo(tip.x - 3, tip.y - 5);
        ctx.lineTo(tip.x - 3, tip.y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      arrow(lc.x, lc.y);
      arrow(rc.x, rc.y);

      // 左圈缺失槽位（红色虚线空框 + ×；step≥2 时脉冲强调）
      const ghostAlpha = s.step >= 2 ? 0.55 + 0.35 * Math.sin(s.anim / 160) : 0.4;
      for (const g of LEFT_GHOSTS) {
        const p = pos(lc.x, lc.y, g);
        ctx.save();
        ctx.globalAlpha = clamp(ghostAlpha, 0, 1);
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x - 16, p.y - 12, 32, 24);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y - 5);
        ctx.lineTo(p.x + 5, p.y + 5);
        ctx.moveTo(p.x + 5, p.y - 5);
        ctx.lineTo(p.x - 5, p.y + 5);
        ctx.stroke();
        ctx.restore();
      }

      const drawNodes = (cx: number, cy: number, nodes: Node[], activeIdx: number) => {
        nodes.forEach((n, i) => {
          const p = pos(cx, cy, n.ang);
          const lit = i <= activeIdx;
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
          ctx.fillStyle = lit ? PALETTE.blue : PALETTE.paper;
          ctx.fill();
          ctx.strokeStyle = lit ? PALETTE.blue : PALETTE.grid;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        });
      };
      drawNodes(lc.x, lc.y, LEFT_NODES, LEFT_ACTIVE[s.step]);
      drawNodes(rc.x, rc.y, RIGHT_NODES, RIGHT_ACTIVE[s.step]);

      // 墨点 token 沿弧线移动到当前节点
      const token = (cx: number, cy: number, nodes: Node[], activeIdx: number) => {
        const p = pos(cx, cy, nodes[activeIdx].ang);
        ctx.save();
        ctx.fillStyle = PALETTE.ink;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 24, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      token(lc.x, lc.y, LEFT_NODES, LEFT_ACTIVE[s.step]);
      token(rc.x, rc.y, RIGHT_NODES, RIGHT_ACTIVE[s.step]);

      // 每侧一个当前节点短标签
      const lp = pos(lc.x, lc.y, LEFT_NODES[LEFT_ACTIVE[s.step]].ang);
      const rp = pos(rc.x, rc.y, RIGHT_NODES[RIGHT_ACTIVE[s.step]].ang);
      drawSceneLabel(ctx, lp.x, lp.y + 30, LEFT_NODES[LEFT_ACTIVE[s.step]].name, {
        align: 'center',
        color: PALETTE.ink,
      });
      drawSceneLabel(ctx, rp.x, rp.y + 30, RIGHT_NODES[RIGHT_ACTIVE[s.step]].name, {
        align: 'center',
        color: PALETTE.ink,
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      stateRef.current.anim = ms;
      render();
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

  const onNext = () => {
    const next = (stateRef.current.step + 1) % 4;
    stateRef.current.step = next;
    setStep(next);
  };

  const fb = FEEDBACK[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onNext}>
          下一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 4 步
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M12LoopStep;

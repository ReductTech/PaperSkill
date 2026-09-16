import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-update-paths — 更新 Harness 的两条路：人工更新 vs 自动更新
// 点击路径卡展开各自的问题（论文 Introduction：人工循环跟不上模型演进；
// 自动更新面临轨迹信号被淹没、紧耦合框架两大障碍）。静态图，仅入场一次性淡入。

const W = 1080;
const H = 320;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  red: '#c43f52',
};

// 两张路径卡
const CARD_A = { x: 60, y: 30, w: 460, h: 84 };
const CARD_B = { x: 560, y: 30, w: 460, h: 84 };

function drawPathCard(
  ctx: CanvasRenderingContext2D,
  card: { x: number; y: number; w: number; h: number },
  title: string,
  sub: string,
  color: string,
  open: boolean,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, 10);
  ctx.fillStyle = open ? lerpColor(color, '#ffffff', 0.9) : C.panel;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 16px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, card.x + 20, card.y + 36);
  ctx.fillStyle = C.muted;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(sub, card.x + 20, card.y + 60);
  ctx.textAlign = 'right';
  ctx.fillText(open ? '收起 ▴' : '点击展开 ▾', card.x + card.w - 18, card.y + 36);
  ctx.restore();
}

function drawProblemCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tag: string,
  lines: string[],
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = C.red;
  ctx.stroke();
  // 问题标签
  ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
  const tw = ctx.measureText(tag).width;
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 12, tw + 16, 20, 10);
  ctx.fillStyle = C.red;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(tag, x + 22, y + 26);
  // 问题正文
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 16, y + 54 + i * 20);
  });
  ctx.restore();
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.border;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.muted;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('点击上方卡片，查看这条路径的问题', x + w / 2, y + h / 2 + 4);
  ctx.restore();
}

export const ModUpdatePaths: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ openA: false, openB: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let startTs = 0;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const elapsed = now - startTs;
      const a = (order: number) => clamp((elapsed - order * 70) / 240, 0, 1);
      const { openA, openB } = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 两张路径卡
      drawPathCard(ctx, CARD_A, '人工 Harness 更新', '开发者阅读轨迹 · 凭经验修改 · 重跑评估', C.steel, openA, a(0));
      drawPathCard(ctx, CARD_B, '自动更新', '让演化智能体根据经验自动优化组件', C.blue, openB, a(1));

      // 人工更新的问题
      if (openA) {
        drawProblemCard(
          ctx, CARD_A.x, 130, CARD_A.w, 96,
          '问题',
          [
            '基座模型快速演进，人工循环越来越跟不上——',
            '模型能力与释放其能力所需的 harness 之间缺口不断扩大。',
          ],
          a(2)
        );
      } else {
        drawPlaceholder(ctx, CARD_A.x, 130, CARD_A.w, 60, a(2));
      }

      // 自动更新的两个问题
      if (openB) {
        drawProblemCard(
          ctx, CARD_B.x, 130, CARD_B.w, 62,
          '问题 ①',
          ['长而杂乱的轨迹中，可执行的信号被淹没。'],
          a(3)
        );
        drawProblemCard(
          ctx, CARD_B.x, 202, CARD_B.w, 62,
          '问题 ②',
          ['harness 框架紧耦合，提示词之外的编辑容易出错。'],
          a(4)
        );
      } else {
        drawPlaceholder(ctx, CARD_B.x, 130, CARD_B.w, 60, a(3));
      }

      // 两条路都展开后的过渡句
      if (openA && openB) {
        ctx.save();
        ctx.globalAlpha = a(5);
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('两条路都难以为继——论文的答案见下方中心洞察。', W / 2, 300);
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      render(now);
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

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const inCard = (c: { x: number; y: number; w: number; h: number }) =>
      x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
    if (inCard(CARD_A)) {
      stateRef.current.openA = !stateRef.current.openA;
    } else if (inCard(CARD_B)) {
      stateRef.current.openB = !stateRef.current.openB;
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
    </div>
  );
};

export default ModUpdatePaths;

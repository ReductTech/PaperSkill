import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1：潜力缺口筛选：GRPO 样本挖掘（静态，每行一幅图）。
// 前四行 = 论文的四条淘汰线（各配一幅图）；第五行 = 单独一幅"潜力大"的图：
// r_max 明显高于 r_mean（缺口大）→ ✓ 选中进 top 8K。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

interface CaseDef {
  title: string;
  reason: string;
  badge: string;
  badgeColor: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
}

// 每行布局：标题(20, y+18) + 原因(20, y+38)；图区 x 300–470；徽章 x 536 右对齐。

// 太难：奖励条都在红色门槛线之下
function drawTooHard(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + 164, y + 12);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    const h = 4 + ((i * 7) % 10);
    ctx.fillStyle = AXIS;
    ctx.fillRect(x + 4 + i * 27, y + 36 - h, 18, h);
  }
}

// 太易：奖励条都在绿色门槛线之上
function drawTooEasy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(x, y + 22);
  ctx.lineTo(x + 164, y + 22);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    const h = 12 + ((i * 5) % 6);
    ctx.fillStyle = AXIS;
    ctx.fillRect(x + 4 + i * 27, y + 36 - h, 18, h);
  }
}

// 潜力小：平均线（r_mean）横贯全图，r_max 只高出一点点
function drawSmallGap(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y + 24);
  ctx.lineTo(x + 164, y + 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('r_mean（平均奖励）', x, y + 16);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x + 10, y + 24, 26, 14);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(x + 66, y + 10, 26, 14);
  ctx.fillStyle = INK;
  ctx.font = '10px sans-serif';
  ctx.fillText('r_max', x + 64, y + 50);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 100, y + 24);
  ctx.lineTo(x + 100, y + 10);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.font = '10px sans-serif';
  ctx.fillText('缺口', x + 108, y + 14);
}

// 奖励平坦：五条等高
function drawFlat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = AXIS;
    ctx.fillRect(x + 4 + i * 32, y + 12, 20, 24);
  }
}

// 潜力大：r_max 明显高于 r_mean（缺口大）→ 选中
function drawBigGap(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y + 24);
  ctx.lineTo(x + 164, y + 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('r_mean（平均奖励）', x, y + 16);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(x + 10, y + 24, 26, 14);
  // r_max：高出平均线一大截
  ctx.fillStyle = ORANGE;
  ctx.fillRect(x + 66, y + 0, 26, 24);
  ctx.fillStyle = INK;
  ctx.font = '10px sans-serif';
  ctx.fillText('r_max', x + 64, y + 50);
  // 大缺口箭头（绿色）
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 100, y + 24);
  ctx.lineTo(x + 100, y + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 100, y + 2);
  ctx.lineTo(x + 95, y + 8);
  ctx.moveTo(x + 100, y + 2);
  ctx.lineTo(x + 105, y + 8);
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.font = '10px sans-serif';
  ctx.fillText('缺口大', x + 108, y + 10);
}

const CASES: CaseDef[] = [
  {
    title: '太难：最高奖励仍低于门槛',
    reason: '策略永远够不到好输出，学不到方向。',
    badge: '✗ 淘汰',
    badgeColor: RED,
    draw: drawTooHard,
  },
  {
    title: '太易：平均奖励已过高',
    reason: '模型已经全会了，没有提升空间。',
    badge: '✗ 淘汰',
    badgeColor: RED,
    draw: drawTooEasy,
  },
  {
    title: '潜力小：缺口不够大',
    reason: '最好的一条也不比平均好多少。',
    badge: '✗ 淘汰',
    badgeColor: RED,
    draw: drawSmallGap,
  },
  {
    title: '奖励平坦：方差太低',
    reason: '组内没有相对差异，advantage 退化。',
    badge: '✗ 淘汰',
    badgeColor: RED,
    draw: drawFlat,
  },
  {
    title: '潜力大：缺口足够大',
    reason: '最好的一条明显好于平均——值得进 RL 训练集。',
    badge: '✓ 选中',
    badgeColor: GREEN,
    draw: drawBigGap,
  },
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

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
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      // 五行，每行一幅图
      const rowH = 44;
      CASES.forEach((c, i) => {
        const y = 8 + i * rowH;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, y, 536, rowH - 4);
        ctx.strokeStyle = c.badgeColor === GREEN ? GREEN : AXIS;
        ctx.lineWidth = c.badgeColor === GREEN ? 1.5 : 1;
        ctx.strokeRect(12.5, y + 0.5, 535, rowH - 5);

        ctx.fillStyle = INK;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(c.title, 20, y + 18);
        ctx.fillStyle = MUTED;
        ctx.font = '11px sans-serif';
        ctx.fillText(c.reason, 20, y + 36);

        c.draw(ctx, 300, y);

        ctx.fillStyle = c.badgeColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(c.badge, 536, y + 18);
        ctx.textAlign = 'left';
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const tick = () => render();
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback">
        前四行是论文的四条淘汰线；第五行是「潜力大」的情形——缺口大、生成不确定、奖励有区分度的样本被选中进 top 8K。U、V_r 与门槛阈值为示意。
      </div>
    </div>
  );
};

export default Ch6Mod1;

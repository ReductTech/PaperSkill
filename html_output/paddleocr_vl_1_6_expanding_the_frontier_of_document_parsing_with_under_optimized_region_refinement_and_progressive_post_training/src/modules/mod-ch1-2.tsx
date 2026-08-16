import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.2：两条路由：弱区如何被修复（P4 芯片）。
// 数据引擎把三类欠优化区域分进两条路由：
//   A 检索补数据：边界脆弱 + 覆盖稀疏 → 文档池定向检索 → 专家共识/Judge-Refine 标注
//   B 修正标签：监督不可靠 → 三位专家核对 → 保留 / 替换 / 精炼
// 芯片切换路由，选中路由高亮、另一条变暗。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

type Route = 'retrieve' | 'fix';

const FEEDBACK: Record<Route, { text: string; cls: 'good' | '' }> = {
  retrieve: {
    text: '路由 A：边界脆弱与覆盖稀疏样本作为<b>检索种子</b>，从内部文档池定向检索新样本，经专家共识与判定-修正标注后补入训练集。',
    cls: 'good',
  },
  fix: {
    text: '路由 B：监督不可靠样本的已有标签经<b>三位专家独立核对</b>——有支持就保留、至少两位专家一致就替换、全不一致进精炼，修正后的标签重新进入训练集。',
    cls: 'good',
  },
};

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fill: string,
  border: string,
  textColor: string
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = textColor;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const lines = label.split('\n');
  const lineH = 15;
  const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, startY + i * lineH + 4));
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7, y2 - 4);
  ctx.lineTo(x2 - 7, y2 + 4);
  ctx.closePath();
  ctx.fill();
}

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ route: Route }>({ route: 'retrieve' });
  const rafRef = useRef<number | null>(null);
  const [route, setRoute] = useState<Route>('retrieve');
  const [feedback, setFeedback] = useState(FEEDBACK.retrieve);

  const onChip = (r: Route) => {
    stateRef.current.route = r;
    setRoute(r);
    setFeedback(FEEDBACK[r]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { route: Route }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      const active = s.route;

      // ---- 路由 A（检索补数据，y 30–100）----
      const aAlpha = active === 'retrieve' ? 1 : 0.35;
      ctx.globalAlpha = aAlpha;
      ctx.fillStyle = MUTED;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('路由 A：检索补数据', 20, 26);
      box(ctx, 20, 40, 96, 44, '边界脆弱\n覆盖稀疏', '#eaf1f6', BLUE, INK);
      arrow(ctx, 122, 62, 160, 62, BLUE);
      box(ctx, 166, 40, 96, 44, '内部文档池', '#eaf1f6', BLUE, INK);
      arrow(ctx, 268, 62, 306, 62, BLUE);
      box(ctx, 312, 40, 228, 44, '新样本 → 专家共识 /\n判定-修正标注', '#eaf6ee', GREEN, INK);
      ctx.globalAlpha = 1;

      // ---- 路由 B（修正标签，y 130–200）----
      const bAlpha = active === 'fix' ? 1 : 0.35;
      ctx.globalAlpha = bAlpha;
      ctx.fillStyle = MUTED;
      ctx.fillText('路由 B：修正标签', 20, 116);
      box(ctx, 20, 130, 96, 44, '监督不可靠', '#fdecef', RED, INK);
      arrow(ctx, 122, 152, 160, 152, RED);
      box(ctx, 166, 130, 96, 44, '三位专家\n独立核对', '#fdf3ec', ORANGE, INK);
      arrow(ctx, 268, 152, 306, 152, RED);
      box(ctx, 312, 130, 228, 44, '保留 / 替换 /\n判定-修正', '#eaf6ee', GREEN, INK);
      ctx.globalAlpha = 1;

      // 底部注记（单行，保持在画布内）
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('两类弱区用于定向检索新数据，一类弱区用于修正已有标签 · 绿色框 = 修复后的训练数据', 20, 214);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(() => render(stateRef.current));
    };

    const tick = () => render(stateRef.current);
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
      <div className="chip-row">
        <button
          type="button"
          className={'chip' + (route === 'retrieve' ? ' selected' : '')}
          onClick={() => onChip('retrieve')}
          aria-pressed={route === 'retrieve'}
        >
          检索补数据
        </button>
        <button
          type="button"
          className={'chip' + (route === 'fix' ? ' selected' : '')}
          onClick={() => onChip('fix')}
          aria-pressed={route === 'fix'}
        >
          修正标签
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch1Mod2;

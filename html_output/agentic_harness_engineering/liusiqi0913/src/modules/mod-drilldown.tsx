import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 module — 三层证据，逐层钻取 (1080x280, P2 step-through)
// 左侧三层文档卡（当前层蓝色高亮 + 连接线），右侧 inset 面板显示该层迷你内容与 token 量级。

const W = 1080;
const H = 280;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
};

const LAYERS = [
  {
    key: 1,
    tag: 'L1 基准总览',
    file: 'overview.md',
    mag: '~10K tokens',
    fb: { text: '每轮迭代从这里开始：一张基准级总览', cls: '' },
  },
  {
    key: 2,
    tag: 'L2 单任务报告',
    file: 'task-*.md',
    mag: '每任务数百行',
    fb: { text: '可疑任务下钻到单任务报告：根因与成败状态已归纳', cls: '' },
  },
  {
    key: 3,
    tag: 'L3 原始轨迹',
    file: 'traces/',
    mag: '~10M tokens',
    fb: { text: '报告中的论断都能回到原始轨迹核对——证据可查，而非转述', cls: 'good' },
  },
];

const STACK = { x: 56, y: 26, w: 340, h: 216 };
const INSET = { x: 452, y: 26, w: 572, h: 216 };

function cardRect(i: number) {
  const gap = 12;
  const ch = (STACK.h - 2 * gap) / 3;
  return { x: STACK.x, y: STACK.y + i * (ch + gap), w: STACK.w, h: ch };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// mini content glyphs inside each document card (static thumbnail)
function drawCardThumb(ctx: CanvasRenderingContext2D, i: number, x: number, y: number) {
  ctx.fillStyle = '#b9c4d4';
  if (i === 0) {
    // aggregate bars
    for (let b = 0; b < 3; b++) ctx.fillRect(x, y + 26 - b * 9, 6, 8 + b * 9);
  } else if (i === 1) {
    // paragraph lines + status dot
    ctx.fillRect(x - 2, y + 2, 34, 3);
    ctx.fillRect(x - 2, y + 10, 26, 3);
    ctx.fillRect(x - 2, y + 18, 30, 3);
    ctx.beginPath();
    ctx.arc(x + 38, y + 6, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();
  } else {
    // dense message lines
    for (let b = 0; b < 5; b++) ctx.fillRect(x - 2, y + b * 6, 30 + ((b * 17) % 10), 2);
  }
}

export const ModDrilldown: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ layer: 1 as 1 | 2 | 3, hl: 0, fade: 1 });
  const [layer, setLayer] = useState<1 | 2 | 3>(1);
  const [feedback, setFeedback] = useState(LAYERS[0].fb);

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
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // document cards (L1 top → L3 bottom)
      for (let i = 0; i < 3; i++) {
        const r = cardRect(i);
        ctx.fillStyle = C.panel;
        roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.border;
        ctx.stroke();
        drawCardThumb(ctx, i, r.x + 22, r.y + r.h / 2 - 12);
        // card label + file name
        ctx.fillStyle = C.text;
        ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(LAYERS[i].tag, r.x + 78, r.y + r.h / 2 - 4);
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Consolas", "Courier New", monospace';
        ctx.fillText(LAYERS[i].file, r.x + 78, r.y + r.h / 2 + 14);
      }

      // animated blue highlight on current layer card
      const hr = cardRect(s.hl);
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      roundRect(ctx, hr.x - 3, hr.y - 3, hr.w + 6, hr.h + 6, 10);
      ctx.stroke();
      ctx.fillStyle = 'rgba(39,68,110,0.06)';
      ctx.fill();
      ctx.restore();

      // connector from current card to inset panel
      const cy = hr.y + hr.h / 2;
      const ix0 = INSET.x;
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hr.x + hr.w + 4, cy);
      ctx.lineTo(ix0 - 14, cy);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(ix0 - 12, cy);
      ctx.lineTo(ix0 - 20, cy - 5);
      ctx.lineTo(ix0 - 20, cy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // inset panel
      ctx.fillStyle = C.panel;
      roundRect(ctx, INSET.x, INSET.y, INSET.w, INSET.h, 8);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.border;
      ctx.stroke();

      const layerNow = Math.round(s.hl);
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, s.fade);
      const ix = INSET.x + 28;
      const iy = INSET.y + 34;
      if (layerNow === 0) {
        // L1: aggregate bars
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('基准总览 overview.md', ix, iy);
        const bars = [0.72, 0.55, 0.4, 0.3, 0.22];
        bars.forEach((b, i) => {
          ctx.fillStyle = i === 0 ? C.blue : '#b9c4d4';
          ctx.fillRect(ix, iy + 18 + i * 26, b * 420, 14);
        });
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('89 任务 · 失败模式聚类', ix + 430, iy + 6);
      } else if (layerNow === 1) {
        // L2: paragraph lines + pass/fail status dot
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('单任务报告（根因归纳）', ix, iy);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = '#b9c4d4';
          ctx.fillRect(ix, iy + 20 + i * 18, 380 - (i % 3) * 60, 6);
        }
        ctx.beginPath();
        ctx.arc(ix + 430, iy + 34, 8, 0, Math.PI * 2);
        ctx.fillStyle = C.red;
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('成败状态', ix + 400, iy + 60);
      } else {
        // L3: dense message-file lines
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText('原始轨迹 traces/（每消息一文件）', ix, iy);
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = i % 4 === 0 ? '#9fb0c6' : '#ccd6e2';
          ctx.fillRect(ix, iy + 14 + i * 12, 300 + ((i * 53) % 180), 3);
        }
      }
      ctx.restore();

      // magnitude tag (bare)
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(LAYERS[layerNow].mag, INSET.x + INSET.w - 22, INSET.y + INSET.h - 18);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      const s = stateRef.current;
      s.hl = lerp(s.hl, s.layer - 1, 0.16);
      s.fade = 1 - Math.min(1, Math.abs(s.hl - (s.layer - 1)) * 2);
      render();
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

  const go = (next: number) => {
    const v = Math.min(3, Math.max(1, next)) as 1 | 2 | 3;
    stateRef.current.layer = v;
    setLayer(v);
    setFeedback(LAYERS[v - 1].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          disabled={layer === 1}
          onClick={() => go(layer - 1)}
        >
          向上一层
        </button>
        <span className="step-label">
          当前层 <b>L{layer}</b>
        </span>
        <button
          type="button"
          className="tiny"
          disabled={layer === 3}
          onClick={() => go(layer + 1)}
        >
          向下一层
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModDrilldown;

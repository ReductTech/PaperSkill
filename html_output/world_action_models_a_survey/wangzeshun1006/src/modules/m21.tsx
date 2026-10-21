import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheetLabel,
  drawLegend,
  ROUTE,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m21 — 三条路：动作在哪里被解出（P5，画布热点 + DOM chip）。
// 三种设计哲学按"动作在推理路径上哪里被解出"划分。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Philosophy = 'render' | 'latent' | 'free';

interface Def {
  name: string;
  feedback: string;
  methods: string[];
}

const DEFS: Def[] = [
  {
    name: '渲染到底',
    feedback:
      '把视频生成骨架一直跑到像素，再从渲染出的未来解出动作（UniPi、GR-1 一线）：最能检查，也最贵。',
    methods: ['UniPi', 'GR-1'],
  },
  {
    name: '停在隐空间',
    feedback: '保留视频先验，但在像素解码之前就取动作信号（VPP、mimic-video 一线）：省掉渲染，失去直接可检查性。',
    methods: ['VPP', 'mimic-video'],
  },
  {
    name: '免视频生成',
    feedback:
      '预测路径里没有像素级视频骨干，改用 LLM/VLM、JEPA、紧凑几何或可供性未来（FLARE、PointWorld、PALM 一线）：最省，但要求替代表征足够。',
    methods: ['FLARE', 'PointWorld', 'PALM'],
  },
];

const ORDER: Philosophy[] = ['render', 'latent', 'free'];

// 推理路径几何
const PATH_Y = 140;
const LEFT_X = 60;
const LEFT_W = 150;
const BB_X = 360;
const BB_Y = 94;
const BB_W = 300;
const BB_H = 92;
const RIGHT_X = 888;
const RIGHT_W = 120;

// 三个解出点
const PTS: Record<Philosophy, number[]> = {
  latent: [710, PATH_Y],
  render: [822, PATH_Y],
  free: [549, 75],
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(ang - 0.42), y - size * Math.sin(ang - 0.42));
  ctx.lineTo(x - size * Math.cos(ang + 0.42), y - size * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

function seg(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  dashed?: boolean
): void {
  ctx.save();
  if (dashed) ctx.setLineDash([7, 6]);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(ang) * 4, y2 - Math.sin(ang) * 4);
  ctx.stroke();
  arrowHead(ctx, x2, y2, ang, 10);
  ctx.restore();
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const philRef = useRef<Philosophy>('render');
  const [philosophy, setPhilosophy] = useState<Philosophy | null>('render');
  const [feedback, setFeedback] = useState({ text: DEFS[0].feedback, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const p = philRef.current;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed / 260);
      const backboneOn = p !== 'free';

      clearField(ctx, W, H);

      // 旁路（免视频生成）
      const bypassOn = p === 'free';
      ctx.save();
      if (!bypassOn) ctx.setLineDash([6, 6]);
      ctx.strokeStyle = bypassOn ? ROUTE : LINE;
      ctx.lineWidth = bypassOn ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(LEFT_X + LEFT_W, PATH_Y);
      ctx.quadraticCurveTo(549, 10, RIGHT_X, PATH_Y);
      ctx.stroke();
      ctx.restore();
      if (bypassOn) {
        ctx.save();
        ctx.fillStyle = ROUTE;
        arrowHead(ctx, RIGHT_X, PATH_Y, Math.atan2(PATH_Y - 75, RIGHT_X - 549), 10);
        ctx.restore();
      }

      // 主路径：左 → 骨架 → 右
      seg(ctx, LEFT_X + LEFT_W, PATH_Y, BB_X, PATH_Y, ROUTE, 2.5);
      seg(ctx, BB_X + BB_W, PATH_Y, RIGHT_X, PATH_Y, ROUTE, backboneOn ? 2.5 : 2);

      // 左端：观测+指令
      ctx.save();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, LEFT_X, PATH_Y - 32, LEFT_W, 64, 10);
      ctx.fill();
      ctx.strokeStyle = ROUTE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = ROUTE;
      ctx.font = '600 22px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('o, l', LEFT_X + LEFT_W / 2, PATH_Y + 1);
      ctx.restore();

      // 中部：视频生成骨架
      ctx.save();
      if (backboneOn) {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, BB_X, BB_Y, BB_W, BB_H, 12);
        ctx.fill();
        ctx.strokeStyle = ROUTE;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        ctx.setLineDash([8, 7]);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        roundRect(ctx, BB_X, BB_Y, BB_W, BB_H, 12);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = backboneOn ? INK : MUTED;
      ctx.font = '600 18px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('视频生成骨架', BB_X + BB_W / 2, BB_Y + BB_H / 2);
      ctx.restore();

      // 右端：动作
      ctx.save();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, RIGHT_X, PATH_Y - 32, RIGHT_W, 64, 10);
      ctx.fill();
      ctx.strokeStyle = ROUTE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = ROUTE;
      ctx.font = '600 24px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('a', RIGHT_X + RIGHT_W / 2, PATH_Y + 1);
      ctx.restore();

      // 高亮当前路径段
      if (p === 'render') {
        seg(ctx, BB_X + BB_W, PATH_Y, PTS.render[0], PATH_Y, ROUTE, 4);
      } else if (p === 'latent') {
        seg(ctx, BB_X + BB_W, PATH_Y, PTS.latent[0], PATH_Y, ROUTE, 4);
      } else {
        ctx.save();
        ctx.strokeStyle = ROUTE;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(LEFT_X + LEFT_W, PATH_Y);
        ctx.quadraticCurveTo(549, 10, RIGHT_X, PATH_Y);
        ctx.stroke();
        ctx.restore();
      }

      // 三个解出点
      for (const key of ORDER) {
        const pt = PTS[key];
        const active = key === p;
        const c = active ? EMPH : MUTED;
        ctx.save();
        if (active) {
          ctx.globalAlpha = 0.16 + 0.16 * pulse;
          ctx.fillStyle = EMPH;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 22 + pulse * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = active ? EMPH : '#ffffff';
        ctx.strokeStyle = active ? EMPH : MUTED;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 选中解出点标签（≤8 字）
      const cur = DEFS[ORDER.indexOf(p)];
      const cp = PTS[p];
      drawSheetLabel(ctx, cur.name, cp[0] - 34, cp[1] - 22, EMPH);

      // 代表方法（≤1 legend，≤3 项）
      drawLegend(
        ctx,
        cur.methods.slice(0, 3).map((m) => ({ color: ROUTE, text: m })),
        BB_X,
        258
      );
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (p: Philosophy): void => {
    philRef.current = p;
    setPhilosophy(p);
    setFeedback({ text: DEFS[ORDER.indexOf(p)].feedback, cls: p === 'free' ? 'good' : '' });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;
    let best: Philosophy | null = null;
    let bestD = 30;
    for (const key of ORDER) {
      const pt = PTS[key];
      const d = Math.hypot(mx - pt[0], my - pt[1]);
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }
    if (best) pick(best);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {ORDER.map((p) => (
          <button
            key={p}
            className={'chip' + (philosophy === p ? ' selected on' : '')}
            onClick={() => pick(p)}
          >
            {DEFS[ORDER.indexOf(p)].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M21;

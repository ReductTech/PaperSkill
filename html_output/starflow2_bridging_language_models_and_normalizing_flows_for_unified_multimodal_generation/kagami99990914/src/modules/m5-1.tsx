import React, { useEffect, useRef, useState } from 'react';
import { lerpColor, map, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §5 模块 5.1：参照强度——注入多少才合适（1080×280，一个控件行 + 一个 .feedback）
const W = 1080;
const H = 280;

const OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '不参照' },
  { value: 0.472, label: '论文比例' },
  { value: 1, label: '完全覆盖' },
];

const CLR = {
  field: '#f5f8f0',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  inset: '#ffffff',
  muted: '#68778f',
  axis: '#d7deea',
  ink: '#21324a',
};

type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = CLR.field;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = CLR.axis;
  ctx.fillRect(0, h - 26, w, 8);
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: number[]
): void {
  ctx.fillStyle = CLR.loom;
  ctx.fillRect(16, 10, w - 32, 6);
  ctx.fillRect(16, 10, 6, 152);
  ctx.fillRect(w - 22, 10, 6, 152);
  ctx.lineWidth = 2;
  for (let i = 0; i < warpCount; i++) {
    const x = 24 + (i * (w - 48)) / Math.max(1, warpCount - 1);
    const st = warpState ? warpState[i] ?? 1 : 1;
    ctx.strokeStyle = st < 0.5 ? CLR.axis : st > 0.85 ? CLR.warpDeep : CLR.warp;
    ctx.lineWidth = st > 0.85 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 156);
    ctx.stroke();
  }
}

// 唯一运动主体：梭子
function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
): void {
  const w = 46 * scale;
  const h = 17 * scale;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 30 * scale, y);
  ctx.lineTo(x - w / 2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.quadraticCurveTo(x, y - h * 0.9, x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.quadraticCurveTo(x, y + h * 0.9, x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = CLR.loom;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Pt[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: string
): void {
  ctx.save();
  if (mode === 'corner') {
    ctx.fillStyle = CLR.done;
    ctx.fillRect(x, y, 9, 9);
  } else if (mode === 'band') {
    ctx.fillStyle = CLR.done;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, w, 5);
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = CLR.done;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant = 'primary'
): void {
  ctx.fillStyle = variant === 'muted' ? CLR.muted : CLR.ink;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { label: string; color: string }[]
): void {
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((it, i) => {
    const lx = x + i * 118;
    ctx.fillStyle = it.color;
    ctx.fillRect(lx, y - 9, 12, 9);
    ctx.fillStyle = CLR.muted;
    ctx.fillText(it.label, lx + 18, y);
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: Pt,
  to: Pt,
  color: string,
  width: number,
  dashed = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = CLR.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CLR.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  if (title) {
    ctx.fillStyle = CLR.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, x + 10, y + 18);
  }
}

function feedbackFor(guide: number): { text: string; cls: string } {
  if (guide === 0) {
    return { text: '完全不注入语义，生成只看低层纹理，高层指令跟不上。', cls: 'bad' };
  }
  if (guide === 0.472) {
    return {
      text:
        '论文在 50 条随机提示词上实测的视觉跳跃连接贡献比均值约 0.472，方向对齐接近零——注入的是互补信息而不是重复信息。',
      cls: 'good',
    };
  }
  return { text: '注入把低层视觉信息整个盖掉了，织面丢了原有纹理。', cls: 'bad' };
}

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ guide: 0.472 });
  const rafRef = useRef<number | null>(null);
  const [guide, setGuide] = useState(0.472);
  const [feedback, setFeedback] = useState(() => feedbackFor(0.472));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { guide: number }) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 44);

      const guide_ = s.guide;
      const uLen = 1 - guide_ * 0.62;
      const vlmLen = guide_;
      const ratio = vlmLen / (uLen + vlmLen);
      const fidelity = guide_ <= 0.472 ? 1 - guide_ * 0.55 : 0.74 - (guide_ - 0.472) * 1.4;

      // 左侧织机视图
      drawPathOrSupport(ctx, [{ x: 40, y: 150 }, { x: 560, y: 150 }], CLR.loom, 1.5);

      // 冻结的参照线：始终留在经线束里
      ctx.strokeStyle = CLR.weave;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, 22);
      ctx.lineTo(300, 150);
      ctx.stroke();
      ctx.fillStyle = CLR.loom;
      ctx.fillRect(293, 16, 14, 7);

      // 已织织面：随 guide 向参照线颜色靠拢
      ctx.strokeStyle = lerpColor(CLR.shuttle, CLR.weave, guide_);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(70, 138);
      ctx.lineTo(520, 138);
      ctx.stroke();

      // 低层纹理保留程度：fidelity 越低，橙色纹理线越细
      ctx.strokeStyle = CLR.shuttle;
      ctx.lineWidth = 1 + fidelity * 4;
      ctx.beginPath();
      ctx.moveTo(70, 126);
      ctx.lineTo(520, 126);
      ctx.stroke();

      // 完全覆盖：标出低层纹理丢失
      if (guide_ >= 1) {
        ctx.strokeStyle = CLR.bad;
        ctx.lineWidth = 1.5;
        for (let x = 90; x < 510; x += 34) {
          ctx.beginPath();
          ctx.moveTo(x, 130);
          ctx.lineTo(x + 10, 146);
          ctx.stroke();
        }
      }

      // 交叉点：参照线搭上梭线
      ctx.fillStyle = CLR.cross;
      ctx.beginPath();
      ctx.arc(300, 138, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CLR.axis;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 唯一运动主体：梭子
      drawSubject(ctx, 360 + guide_ * 120, 138, 1, CLR.shuttle);

      // 右侧向量长度与贡献比
      const ix = 620;
      const iy = 40;
      const iw = 420;
      const ih = 200;
      drawInsetFrame(ctx, ix, iy, iw, ih, '向量长度与贡献比');
      const barX = ix + 40;
      const barMax = 330;

      ctx.fillStyle = CLR.cross;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(barX, 86, barMax, 18);
      ctx.fillRect(barX, 126, barMax, 18);
      ctx.globalAlpha = 1;

      ctx.fillStyle = CLR.weave;
      ctx.fillRect(barX, 86, barMax * vlmLen, 18);
      ctx.fillStyle = CLR.shuttle;
      ctx.fillRect(barX, 126, barMax * uLen, 18);

      // 贡献比刻度尺与指针
      const rulerY = 178;
      drawThread(
        ctx,
        { x: barX, y: rulerY },
        { x: barX + barMax, y: rulerY },
        CLR.axis,
        1,
        false
      );
      [0, 0.472, 1].forEach((tick) => {
        const tx = barX + barMax * tick;
        drawThread(ctx, { x: tx, y: rulerY - 5 }, { x: tx, y: rulerY + 5 }, CLR.muted, 1, false);
      });
      const px = barX + barMax * ratio;
      ctx.fillStyle = CLR.cross;
      ctx.beginPath();
      ctx.moveTo(px, rulerY - 14);
      ctx.lineTo(px - 6, rulerY - 22);
      ctx.lineTo(px + 6, rulerY - 22);
      ctx.closePath();
      ctx.fill();

      drawLegend(ctx, 660, 258, [
        { label: '注入', color: CLR.weave },
        { label: '低层', color: CLR.shuttle },
        { label: '贡献比', color: CLR.cross },
      ]);

      drawSceneLabel(ctx, 30, 32, '冻结参照', 'muted');
    };

    const tick = () => {
      render(stateRef.current);
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

  const pick = (value: number) => {
    stateRef.current.guide = value;
    setGuide(value);
    setFeedback(feedbackFor(value));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span style={{ color: 'var(--slate)' }}>参照强度</span>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip${guide === o.value ? ' selected' : ''}`}
            aria-pressed={guide === o.value}
            onClick={() => pick(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;

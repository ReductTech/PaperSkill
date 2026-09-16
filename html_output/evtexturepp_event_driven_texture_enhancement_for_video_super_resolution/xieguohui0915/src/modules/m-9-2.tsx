import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawAxes,
  drawLegend,
  drawPrint,
  drawSceneLabel,
  PAPER,
} from './halftoneKit';
import type { WidgetProps } from './registry';

// §9.2 训练样本长什么样（制版台主题）
// 主操作：步进控件（上一步 / 下一步 / 重置），共 4 步。
// 左区（x 24–640）一条时间轴：片段条 → 15 个帧格 → 一格被 64×64 方框框住并放大 → 复制成 8 个小方块。
// 右区（x 656–1056）读数板：三个裸数字（帧数 / 尺寸 / 批大小），未到该步显示 —。

const W = 1080;
const H_WIDE = 280;
const H_NARROW = 480;
const STEPS = 4;
const FRAMES = 15;
const CROP_INDEX = 7;
const BATCH = 8;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Layout {
  strip: Rect;
  cells: Rect;
  cropSize: number;
  cropY: number;
  minis: { y: number; h: number; gap: number };
  readout: Rect;
  labelClip: { x: number; y: number };
  labelRead: { x: number; y: number };
  legend: { x: number; y: number };
}

const STEP_NAME = ['原始片段', '取 15 帧', '随机裁 64×64', '8 个一批'];

// 每步只说这一件事，且只说一句话——不堆其它步骤的数字。
const STEP_DESC = [
  '从 Vimeo-90K 或 REDS 里取一段连续视频。',
  '独立模型一次输入 15 帧；Vimeo-90K 的片段帧数不够，论文把序列翻转拼接来凑足。',
  '训练时随机裁出 64×64 的小块，再随机翻转做增强。',
  '一次取 8 个样本（batch size 8）。',
];

function feedbackFor(step: number): { text: string; cls: string } {
  const i = clamp(Math.round(step), 0, STEPS - 1);
  return { text: STEP_DESC[i], cls: i === STEPS - 1 ? 'good' : 'info' };
}

function layoutFor(narrow: boolean): Layout {
  if (narrow) {
    return {
      strip: { x: 40, y: 44, w: 960, h: 24 },
      cells: { x: 40, y: 82, w: 960, h: 40 },
      cropSize: 80,
      cropY: 140,
      minis: { y: 238, h: 26, gap: 8 },
      readout: { x: 40, y: 292, w: 960, h: 130 },
      labelClip: { x: 40, y: 36 },
      labelRead: { x: 40, y: 284 },
      legend: { x: 40, y: 450 },
    };
  }
  return {
    strip: { x: 40, y: 38, w: 560, h: 24 },
    cells: { x: 40, y: 74, w: 560, h: 38 },
    cropSize: 64,
    cropY: 130,
    minis: { y: 208, h: 26, gap: 7 },
    readout: { x: 656, y: 38, w: 400, h: 196 },
    labelClip: { x: 40, y: 30 },
    labelRead: { x: 656, y: 30 },
    legend: { x: 40, y: 264 },
  };
}

const READOUT: { color: string; label: string }[] = [
  { color: PAPER.blue, label: '帧数' },
  { color: PAPER.orange, label: '尺寸' },
  { color: PAPER.green, label: '批大小' },
];

/** 值：未到该步显示 —。 */
function valueAt(step: number, index: number): string {
  if (index === 0) return step >= 1 ? String(FRAMES) : '—';
  if (index === 1) return step >= 2 ? String(64) : '—';
  return step >= 3 ? String(BATCH) : '—';
}

function hatch(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  gap: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = -r.h; d < r.w; d += gap) {
    ctx.moveTo(r.x + d, r.y + r.h);
    ctx.lineTo(r.x + d + r.h, r.y);
  }
  ctx.stroke();
  ctx.restore();
}

function cellRect(L: Layout, i: number): Rect {
  const gap = 3;
  const cw = (L.cells.w - gap * (FRAMES - 1)) / FRAMES;
  return {
    x: L.cells.x + i * (cw + gap),
    y: L.cells.y,
    w: cw,
    h: L.cells.h,
  };
}

export const M9_2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(() => feedbackFor(0));

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let H = H_WIDE;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf = 0;
    let running = false;
    let ready = false;

    const frame = (now: number) => {
      const shownW = canvas.getBoundingClientRect().width;
      const narrow = shownW > 0 && shownW < 720;
      const wantH = narrow ? H_NARROW : H_WIDE;
      if (wantH !== H) {
        H = wantH;
        ctx = setupCanvas(canvas, W, H);
      }

      const s = clamp(stepRef.current, 0, STEPS - 1);
      const L = layoutFor(narrow);
      const pulse = 0.5 + 0.5 * Math.sin((now / 1200) * Math.PI * 2);

      clearScene(ctx, W, H);

      // ---- 左区：片段条 ----
      ctx.save();
      drawPrint(ctx, L.strip.x, L.strip.y, L.strip.w, L.strip.h);
      hatch(ctx, L.strip, 12, PAPER.screenLine, 0.4);
      ctx.restore();
      if (s === 0) {
        ctx.save();
        ctx.strokeStyle = PAPER.blue;
        ctx.lineWidth = 2.4;
        ctx.globalAlpha = 0.35 + 0.65 * pulse;
        ctx.strokeRect(L.strip.x + 1.2, L.strip.y + 1.2, L.strip.w - 2.4, L.strip.h - 2.4);
        ctx.restore();
      }

      // ---- 左区：15 个帧格 ----
      if (s >= 1) {
        for (let i = 0; i < FRAMES; i++) {
          const c = cellRect(L, i);
          ctx.save();
          ctx.fillStyle = PAPER.print;
          ctx.fillRect(c.x, c.y, c.w, c.h);
          hatch(ctx, c, 7, PAPER.screenLine, 0.32);
          ctx.strokeStyle = PAPER.printEdge;
          ctx.lineWidth = 1;
          ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
          ctx.restore();
        }
        if (s === 1) {
          ctx.save();
          ctx.strokeStyle = PAPER.blue;
          ctx.lineWidth = 2.4;
          ctx.globalAlpha = 0.35 + 0.65 * pulse;
          ctx.strokeRect(L.cells.x + 1.2, L.cells.y + 1.2, L.cells.w - 2.4, L.cells.h - 2.4);
          ctx.restore();
        }
      }

      // ---- 左区：一格被裁出并放大 ----
      const base = cellRect(L, CROP_INDEX);
      const cx = base.x + base.w / 2;
      const crop: Rect = {
        x: cx - L.cropSize / 2,
        y: L.cropY,
        w: L.cropSize,
        h: L.cropSize,
      };

      if (s >= 2) {
        ctx.save();
        ctx.strokeStyle = PAPER.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(base.x + 1, base.y + 1, base.w - 2, base.h - 2);

        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y + base.h);
        ctx.lineTo(crop.x, crop.y);
        ctx.moveTo(base.x + base.w, base.y + base.h);
        ctx.lineTo(crop.x + crop.w, crop.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        drawPrint(ctx, crop.x, crop.y, crop.w, crop.h);
        hatch(ctx, crop, 9, PAPER.screenLine, 0.34);
        ctx.save();
        ctx.strokeStyle = PAPER.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(crop.x + 1, crop.y + 1, crop.w - 2, crop.h - 2);
        if (s === 2) {
          ctx.globalAlpha = 0.35 + 0.65 * pulse;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(crop.x + 5.5, crop.y + 5.5, crop.w - 11, crop.h - 11);
        }
        ctx.restore();
      }

      // ---- 左区：复制成 8 个小方块 ----
      if (s >= 3) {
        const gap = L.minis.gap;
        const total = BATCH * L.minis.h + gap * (BATCH - 1);
        const x0 = cx - total / 2;
        for (let i = 0; i < BATCH; i++) {
          const mx = x0 + i * (L.minis.h + gap);
          ctx.save();
          ctx.fillStyle = 'rgba(34,141,92,0.16)';
          ctx.fillRect(mx, L.minis.y, L.minis.h, L.minis.h);
          hatch(ctx, { x: mx, y: L.minis.y, w: L.minis.h, h: L.minis.h }, 6, PAPER.green, 0.35);
          ctx.strokeStyle = PAPER.green;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(mx + 0.7, L.minis.y + 0.7, L.minis.h - 1.4, L.minis.h - 1.4);
          ctx.restore();
        }
      }

      // ---- 右区：读数板（三个裸数字，图例是它们的色键） ----
      drawAxes(ctx, L.readout.x, L.readout.y, L.readout.w, L.readout.h);
      ctx.save();
      ctx.textBaseline = 'middle';
      for (let i = 0; i < READOUT.length; i++) {
        const value = valueAt(s, i);
        if (narrow) {
          const colX = L.readout.x + (L.readout.w * (i + 0.5)) / 3;
          ctx.fillStyle = READOUT[i].color;
          ctx.fillRect(colX - 7, L.readout.y + 28, 14, 14);
          ctx.fillStyle = PAPER.ink;
          ctx.font = `46px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.fillText(value, colX, L.readout.y + 86);
        } else {
          const rowY = L.readout.y + (L.readout.h * (i + 0.5)) / 3;
          ctx.fillStyle = READOUT[i].color;
          ctx.fillRect(L.readout.x + 30, rowY - 6, 12, 12);
          ctx.fillStyle = PAPER.ink;
          ctx.font = `36px ${FONT}`;
          ctx.textAlign = 'left';
          ctx.fillText(value, L.readout.x + 60, rowY);
        }
      }
      ctx.restore();

      // ---- 短标签（至多 2 个）+ 图例 ----
      drawSceneLabel(ctx, L.labelClip.x, L.labelClip.y, '片段');
      drawSceneLabel(ctx, L.labelRead.x, L.labelRead.y, '读数');
      drawLegend(
        ctx,
        L.legend.x,
        L.legend.y,
        READOUT.map((r) => ({ color: r.color, label: r.label }))
      );

      if (!ready) {
        canvas.classList.add('is-ready');
        ready = true;
      }
      if (running) raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const v = clamp(next, 0, STEPS - 1);
    stepRef.current = v;
    setStep(v);
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H_WIDE} aria-label="训练样本步进器" />
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          上一步
        </button>
        <span className="step-label">
          <b>{STEP_NAME[step]}</b> · 第 {step + 1} / {STEPS} 步
        </span>
        <button
          type="button"
          className="tiny"
          onClick={() => go(step + 1)}
          disabled={step >= STEPS - 1}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9_2;

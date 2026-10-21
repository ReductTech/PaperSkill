import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const AXIS = '#d7deea';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, h - 18);
  ctx.lineTo(w - 20, h - 18);
  ctx.stroke();
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 7, y - 7, w + 14, h + 14);
  ctx.fillStyle = '#eaf1fb';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawOutside(ctx: CanvasRenderingContext2D, clip: Rect, clarity: number): void {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  ctx.globalAlpha = 0.2 + 0.8 * c;
  ctx.fillStyle = '#6fa96b';
  ctx.beginPath();
  ctx.moveTo(clip.x, clip.y + clip.h);
  ctx.lineTo(clip.x + clip.w * 0.28, clip.y + clip.h * 0.5);
  ctx.lineTo(clip.x + clip.w * 0.58, clip.y + clip.h * 0.78);
  ctx.lineTo(clip.x + clip.w, clip.y + clip.h * 0.42);
  ctx.lineTo(clip.x + clip.w, clip.y + clip.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(clip.x + clip.w * 0.76, clip.y + clip.h * 0.26, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFog(ctx: CanvasRenderingContext2D, clip: Rect, density: number, seed: number): void {
  const d = clamp(density, 0, 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  ctx.fillStyle = '#c4d2b6';
  const cells = 46;
  for (let i = 0; i < cells; i++) {
    const fx = ((i * 137 + seed * 41) % 997) / 997;
    const fy = ((i * 71 + seed * 23) % 991) / 991;
    const r = 10 + ((i * 13) % 18);
    if (i / cells < d) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(clip.x + fx * clip.w, clip.y + fy * clip.h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCloth(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = MUTED;
  ctx.fillRect(x - 2, y + r - 2, 4, 12);
}

function drawWipePath(ctx: CanvasRenderingContext2D, points: Pt[], progress: number, color: string): void {
  if (points.length < 2) return;
  const n = Math.max(1, Math.floor(clamp(progress, 0, 1) * (points.length - 1)) + 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, label: string): void {
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  drawSceneLabel(ctx, label, x + 20, y + 6);
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = TEXT;
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; text: string }>,
  x: number,
  y: number
): void {
  let cx = x;
  ctx.font = '15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 14, 14);
    ctx.fillStyle = MUTED;
    ctx.fillText(it.text, cx + 20, y + 1);
    cx += 20 + ctx.measureText(it.text).width + 26;
  });
}

type Flags = { groupNorm: boolean; dropout: boolean; flip: boolean; ema: boolean };

const ALL_ON: Flags = { groupNorm: true, dropout: true, flip: true, ema: true };

const CHIP_DEFS: Array<{ key: keyof Flags; label: string }> = [
  { key: 'groupNorm', label: '组归一化' },
  { key: 'dropout', label: 'dropout 0.1' },
  { key: 'flip', label: '随机水平翻转' },
  { key: 'ema', label: 'EMA 0.9999' },
];

function countOn(f: Flags): number {
  return (f.groupNorm ? 1 : 0) + (f.dropout ? 1 : 0) + (f.flip ? 1 : 0) + (f.ema ? 1 : 0);
}

function computeFeedback(f: Flags): { text: string; cls: string } {
  const count = countOn(f);
  if (count === 4) {
    return { text: '接近论文设置：CIFAR10 dropout 0.1、随机水平翻转、EMA 0.9999、组归一化（论文 Appendix B）。', cls: 'good' };
  }
  if (count === 1) {
    return { text: '（教学示意）只保留一项技巧，训练与采样会很不稳定。', cls: 'bad' };
  }
  if (!f.dropout) {
    return { text: '论文：CIFAR10 无 dropout 时出现类似未正则化 PixelCNN++ 的过拟合伪影（Appendix B）。', cls: '' };
  }
  if (!f.ema) {
    return { text: '论文未对 EMA 做消融（直接采用 0.9999）；此处为经验性提示：关闭后参数轨迹更抖、样本稳定性下降。', cls: '' };
  }
  return { text: '偏离论文设置：组归一化的作用是让实现更简单；随机水平翻转带来样本质量的小幅提升（Appendix B）。', cls: '' };
}

export const Ch9Trick: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ flags: Flags; t: number }>({ flags: { ...ALL_ON }, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [flags, setFlags] = useState<Flags>({ ...ALL_ON });
  const [feedback, setFeedback] = useState(computeFeedback(ALL_ON));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { flags: Flags; t: number }) => {
      clearScene(ctx, W, H);
      const f = s.flags;
      const count = countOn(f);
      const tightness = count / 4;
      const jitter = (1 - tightness) * 26 + 2;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(56, 46, 500, 196);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 2;
      ctx.strokeRect(56, 46, 500, 196);
      drawSceneLabel(ctx, '样本散布（教学示意）', 56, 34);

      const cx = 306;
      const cy = 146;
      const N = 72;
      ctx.fillStyle = count === 4 ? GREEN : count >= 2 ? BLUE : RED;
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < N; i++) {
        const a = i * 2.399963;
        const rad = 8 + 76 * Math.sqrt(i / N);
        const bx = cx + Math.cos(a) * rad;
        const by = cy + Math.sin(a) * rad * 0.72;
        const j1 = Math.sin(i * 12.9898 + 4.1);
        const j2 = Math.cos(i * 7.233 + 1.7);
        ctx.beginPath();
        ctx.arc(bx + j1 * jitter, by + j2 * jitter, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      drawSceneLabel(ctx, '稳定性', 620, 34);
      const bx0 = 620;
      const bw = 380;
      const by0 = 78;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx0, by0, bw, 34);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx0, by0, bw, 34);
      const stColor = count === 4 ? GREEN : count >= 2 ? ORANGE : RED;
      ctx.fillStyle = stColor;
      ctx.fillRect(bx0 + 2, by0 + 2, (bw - 4) * tightness, 30);
      ctx.fillStyle = TEXT;
      ctx.font = '700 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText('开启 ' + count + '/4 项技巧', bx0, by0 + 62);

      const hintY = 176;
      let hintLabel = '稳定性略有下降';
      let hintColor = ORANGE;
      if (!f.dropout) {
        hintLabel = '过拟合风险偏高';
        hintColor = ORANGE;
      } else if (!f.ema) {
        hintLabel = '样本抖动风险';
        hintColor = ORANGE;
      } else if (f.groupNorm && f.flip) {
        hintLabel = '训练配置接近论文';
        hintColor = GREEN;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(620, hintY - 26, 380, 44);
      ctx.strokeStyle = hintColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(620, hintY - 26, 380, 44);
      ctx.fillStyle = hintColor;
      ctx.fillRect(620, hintY - 26, 6, 44);
      ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(hintLabel, 642, hintY + 2);

      drawLegend(
        ctx,
        [
          { color: GREEN, text: '全部开启' },
          { color: ORANGE, text: '缺少关键技巧' },
          { color: RED, text: '接近关闭' },
        ],
        56,
        H - 26
      );
    };

    const tick = () => {
      stateRef.current.t += 1;
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

  const toggle = (key: keyof Flags) => {
    const current = stateRef.current.flags;
    if (current[key] && countOn(current) === 1) {
      setFeedback({ text: '至少保留一项技巧：全部关闭会让训练无法稳定收敛。', cls: '' });
      return;
    }
    const next: Flags = { ...current, [key]: !current[key] };
    stateRef.current.flags = next;
    setFlags(next);
    setFeedback(computeFeedback(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIP_DEFS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`chip ${flags[c.key] ? 'selected' : ''}`}
            aria-pressed={flags[c.key]}
            onClick={() => toggle(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Trick;

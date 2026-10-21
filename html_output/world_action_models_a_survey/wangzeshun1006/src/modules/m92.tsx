import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawRoute,
  drawSurveyor,
  drawSheetLabel,
  OK,
  EMPH,
  ROUTE,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m92 — 两段式验收与七个开放问题。上区为「筛图 → 试走 → 记账」验收场景，
// 下区为三步协议，第 3 步右侧浮现七个开放问题的短标签。步进器：上一步/下一步/重新开始。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type SurveyPose = 'sight' | 'draw' | 'walk' | 'plant' | 'check';

interface Stage {
  name: string;
  sub: string;
  pose: SurveyPose;
  fb: string;
}

const STAGES: Stage[] = [
  {
    name: '视觉筛查',
    sub: 'FVD/PSNR/SSIM',
    pose: 'draw',
    fb: '先便宜地筛：视觉保真度指标快、但和下游成败只有弱相关——世界模型分数不等于策略能力（MotuBrain 的观察）。',
  },
  {
    name: '闭环实测',
    sub: '仿真 / 真机',
    pose: 'walk',
    fb: '再选性地实测：仿真便宜、真机可信；平均分会掩盖失败模式——适合过渡的调度可能在精细交互翻车（HarmoWAM）。',
  },
  {
    name: '按预算报告',
    sub: '成功+延迟+时长+内存',
    pose: 'check',
    fb: '最后按预算报告：成功、延迟、持续时长、峰值内存放在同一轴上；七个问题仍开着——算多少未来、每段数据学什么、记忆、泛化、抽象动作接地、物理性、评测口径。',
  },
];

const TAGS = ['预算', '数据分工', '记忆', '泛化', '接地', '物理', '口径'];

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

export const M92: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ stage: 1, stageStart: 0 });
  const [stage, setStage] = useState(1);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: STAGES[0].fb, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    stateRef.current.stageStart = performance.now() - 500;

    const render = (now: number): void => {
      const s = stateRef.current;
      clearField(ctx, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 上区：验收场景 ──────────────────────────────────────────
      drawSheet(ctx, 60, 34, 180, 72);
      if (s.stage === 1) {
        // 快速筛图：三张缩略图。
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#ffffff';
          roundRect(ctx, 78 + i * 50, 54, 36, 32, 4);
          ctx.fill();
          ctx.strokeStyle = i === 1 ? EMPH : LINE;
          ctx.lineWidth = i === 1 ? 2.5 : 1.5;
          ctx.stroke();
        }
      } else if (s.stage === 2) {
        // 实地试走：一条路线。
        drawRoute(
          ctx,
          [
            [78, 92],
            [118, 72],
            [160, 58],
            [214, 50],
          ],
          ROUTE,
          2.5
        );
      } else {
        // 记账：几行账目。
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const y = 56 + i * 12;
          ctx.beginPath();
          ctx.moveTo(80, y);
          ctx.lineTo(220, y);
          ctx.stroke();
        }
        ctx.fillStyle = AUX;
        ctx.fillRect(80, 56, 90, 4);
      }
      drawSurveyor(ctx, 300, 104, 1.0, s.stage === 3 ? OK : INK, STAGES[s.stage - 1].pose);

      // ── 下区：三步协议 ──────────────────────────────────────────
      const bw = 180;
      const bh = 72;
      const by = 168;
      for (let i = 0; i < 3; i++) {
        const bx = 60 + i * 200;
        const idx = i + 1;
        const current = idx === s.stage;
        const visited = idx < s.stage;
        ctx.save();
        ctx.fillStyle = current ? EMPH : '#ffffff';
        ctx.globalAlpha = current ? 0.14 : 0.8;
        roundRect(ctx, bx, by, bw, bh, 9);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = current ? EMPH : visited ? ROUTE : LINE;
        ctx.lineWidth = current ? 2.5 : 1.5;
        roundRect(ctx, bx, by, bw, bh, 9);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = current ? EMPH : visited ? ROUTE : MUTED;
        ctx.font = 'bold 17px ' + FONT;
        ctx.fillText(`0${idx} ${STAGES[i].name}`, bx + 14, by + 30);
        ctx.fillStyle = MUTED;
        ctx.font = '13px ' + FONT;
        ctx.fillText(STAGES[i].sub, bx + 14, by + 52);

        if (i < 2) {
          ctx.strokeStyle = LINE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + bw + 6, by + bh / 2);
          ctx.lineTo(bx + bw + 14, by + bh / 2);
          ctx.stroke();
          ctx.fillStyle = LINE;
          ctx.beginPath();
          ctx.moveTo(bx + bw + 14, by + bh / 2);
          ctx.lineTo(bx + bw + 7, by + bh / 2 - 5);
          ctx.lineTo(bx + bw + 7, by + bh / 2 + 5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ── 第 3 步：七个开放问题标签 ───────────────────────────────
      if (s.stage === 3) {
        const cols = [700, 872];
        const rows = [162, 202, 242];
        for (let i = 0; i < TAGS.length; i++) {
          const col = i < 4 ? 0 : 1;
          const row = i < 4 ? i : i - 4;
          const tx = cols[col];
          const ty = rows[row];
          const appear = easeOutCubic(clamp((now - s.stageStart - i * 90) / 320, 0, 1));
          if (appear <= 0) continue;
          ctx.save();
          ctx.globalAlpha = appear;
          ctx.fillStyle = AUX;
          ctx.globalAlpha = appear * 0.16;
          roundRect(ctx, tx, ty, 152, 30, 15);
          ctx.fill();
          ctx.globalAlpha = appear;
          ctx.strokeStyle = AUX;
          ctx.lineWidth = 1.5;
          roundRect(ctx, tx, ty, 152, 30, 15);
          ctx.stroke();
          ctx.fillStyle = AUX;
          ctx.font = 'bold 15px ' + FONT;
          ctx.textAlign = 'left';
          ctx.fillText(TAGS[i], tx + 14, ty + 20);
          ctx.restore();
        }
      }

      drawSheetLabel(ctx, '验收', 60, 24, ROUTE);
      drawSheetLabel(ctx, '三步协议', 60, 152, EMPH);
    };

    const tick = (now: number): void => {
      render(now);
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

  const go = (next: number): void => {
    const s = stateRef.current;
    s.stage = next;
    s.stageStart = performance.now();
    setStage(next);
    setFb({ text: STAGES[next - 1].fb, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => go(stage - 1)} disabled={stage === 1}>
          上一步
        </button>
        <button className="chip" onClick={() => go(stage + 1)} disabled={stage === 3}>
          下一步
        </button>
        <button className="chip" onClick={() => go(1)}>
          重新开始
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M92;

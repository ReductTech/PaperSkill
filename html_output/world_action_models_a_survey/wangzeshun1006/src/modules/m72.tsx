import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawSheetLabel,
  drawPin,
  ROUTE,
  OK,
  BAD,
  AUX,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m72 — 防泄漏：双向去噪 vs 因果路径。两个面板共用同一时间轴：左边容忍未来信息回流，
// 在 rollout 里通关却在推理时空抓；右边用因果掩码挡住未来，两处一致。演示节奏只为看清机制。

const W = 1080;
const H = 280;
const DUR = 3200;
const HOLD_MS = 1500;
const CELLS = 8;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const CELL_W = 46;
const CELL_GAP = 6;
const CELL_Y = 118;
const CELL_H = 54;
const LEFT_X = 66;
const RIGHT_X = 596;

type Phase = 'idle' | 'run' | 'hold';

const F_INIT = '按「开始对比」，看双向去噪与因果路径在部署中的差别。';
const F_RUN = "左边正在'偷看'下一帧——rollout 里抓得准，不代表上线时抓得着。";
const F_DONE =
  '右边用因果掩码/token 流挡住未来：WorldVLA 用掩码控制动作块误差传播，CoT-VLA 只在短动作段用全注意力。';
const F_AGAIN =
  '想省延迟还有一招：动作优先推理——UD-VLA 报告约四倍于自回归的加速；LingBot-VA、MotuBrain、DreamZero 把预测与执行重叠起来。';

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

function cellX(start: number, i: number): number {
  return start + i * (CELL_W + CELL_GAP);
}

function badge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.font = `bold 15px ${FONT}`;
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y - 15, w, 26, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 10, y - 1);
}

export const M72: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as Phase, start: 0, holdStart: 0, tick: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [tick, setTick] = useState(0);
  const [ran, setRan] = useState(false);
  const [feedback, setFeedback] = useState({ text: F_INIT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const s = stateRef.current;
      const finished = s.phase === 'hold';
      clearField(ctx, W, H);

      drawSheet(ctx, 40, 38, 470, 190);
      drawSheet(ctx, 570, 38, 470, 190);

      // 左面板：双向去噪
      for (let i = 0; i < CELLS; i++) {
        const x = cellX(LEFT_X, i);
        const on = i < s.tick;
        ctx.fillStyle = on ? ROUTE : LINE;
        roundRect(ctx, x, CELL_Y, CELL_W, CELL_H, 6);
        ctx.fill();
      }
      if (s.tick >= 1) {
        const ax = cellX(LEFT_X, s.tick - 1) + CELL_W / 2;
        const ay = CELL_Y + CELL_H / 2;
        // 回流泄漏箭头：未来格指向当前动作
        if (s.tick >= 4 && s.tick <= CELLS) {
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = AUX;
          ctx.lineWidth = 2;
          for (let i = s.tick; i < CELLS; i++) {
            const fx = cellX(LEFT_X, i) + CELL_W / 2;
            ctx.beginPath();
            ctx.moveTo(fx, CELL_Y + 10);
            ctx.quadraticCurveTo((fx + ax) / 2, CELL_Y - 22, ax, ay - 14);
            ctx.stroke();
          }
          ctx.restore();
        }
        drawPin(ctx, ax, ay, finished ? BAD : INK, true);
      }
      if (finished) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = BAD;
        roundRect(ctx, 40, 38, 470, 190, 10);
        ctx.fill();
        ctx.restore();
        badge(ctx, '推理 ✗', 430, 30, BAD);
      }

      // 右面板：因果路径
      for (let i = 0; i < CELLS; i++) {
        const x = cellX(RIGHT_X, i);
        const on = i < s.tick;
        ctx.fillStyle = on ? ROUTE : LINE;
        roundRect(ctx, x, CELL_Y, CELL_W, CELL_H, 6);
        ctx.fill();
      }
      // 动作 token 只连向已过去的部分
      if (s.tick >= 1) {
        const ax = cellX(RIGHT_X, s.tick - 1) + CELL_W / 2;
        const ay = CELL_Y + CELL_H / 2;
        ctx.strokeStyle = ROUTE;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < s.tick - 1; i++) {
          const px = cellX(RIGHT_X, i) + CELL_W / 2;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(px, CELL_Y + CELL_H / 2);
          ctx.stroke();
        }
        drawPin(ctx, ax, ay, finished ? OK : INK, true);
      }
      // 掩码块挡在未来的格子上
      if (s.tick < CELLS) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = AUX;
        for (let i = s.tick; i < CELLS; i++) {
          roundRect(ctx, cellX(RIGHT_X, i), CELL_Y, CELL_W, CELL_H, 6);
          ctx.fill();
        }
        ctx.restore();
      }
      if (finished) badge(ctx, '推理一致', 856, 30, OK);

      // 底部共用结论（短标记，非散文）
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold 15px ${FONT}`;
      if (finished) {
        ctx.fillStyle = BAD;
        ctx.fillText('左空抓', 300, 254);
        ctx.fillStyle = OK;
        ctx.fillText('右一致', 780, 254);
      } else {
        ctx.fillStyle = MUTED;
        ctx.fillText('同速推进', 540, 254);
      }

      drawSheetLabel(ctx, '双向去噪', 56, 30, finished ? BAD : INK);
      drawSheetLabel(ctx, '因果路径', 586, 30, finished ? OK : INK);
    };

    const tickFn = (): void => {
      const s = stateRef.current;
      const now = performance.now();
      if (s.phase === 'run') {
        const p = clamp((now - s.start) / DUR, 0, 1);
        const nt = Math.min(CELLS, Math.ceil(p * CELLS));
        if (nt !== s.tick) {
          s.tick = nt;
          setTick(nt);
        }
        if (p >= 1) {
          s.phase = 'hold';
          s.holdStart = now;
          setPhase('hold');
          setRan(true);
          setFeedback({ text: F_DONE, cls: 'good' });
        }
      } else if (s.phase === 'hold') {
        if (now - s.holdStart > HOLD_MS) {
          s.phase = 'idle';
          s.tick = 0;
          setPhase('idle');
          setTick(0);
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tickFn);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tickFn);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = (): void => {
    const s = stateRef.current;
    if (s.phase === 'run') return;
    s.phase = 'run';
    s.start = performance.now();
    s.tick = 0;
    setPhase('run');
    setTick(0);
    setFeedback({ text: ran ? F_AGAIN : F_RUN, cls: '' });
  };

  const label = ran && phase !== 'run' ? '再跑一次' : '开始对比';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={'chip' + (phase === 'run' ? ' selected on' : '')} onClick={onStart} disabled={phase === 'run'}>
          {label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M72;

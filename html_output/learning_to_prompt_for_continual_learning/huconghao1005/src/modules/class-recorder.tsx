import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  drawField,
  drawSort,
  drawLink,
  drawLabel,
} from './letterpressKit';

const N = 14;
const TOTAL = N * N;

const LAY = {
  x: 40,
  w: 660,
  classY: 72,
  classH: 22,
  gridY: 134,
  gridH: 182,
  gap: 2,
};

function cellW(): number {
  return (LAY.w - LAY.gap * (N - 1)) / N;
}

function gridCellH(): number {
  return (LAY.gridH - LAY.gap * (N - 1)) / N;
}

function colX(col: number): number {
  return LAY.x + col * (cellW() + LAY.gap);
}

function patchY(row: number): number {
  return LAY.gridY + row * (gridCellH() + LAY.gap);
}

function drawClassRow(ctx: CanvasRenderingContext2D, speaker: number, started: boolean): void {
  const cw = cellW();
  const litCol = speaker >= TOTAL ? -1 : speaker % N;
  for (let c = 0; c < N; c++) {
    const x = colX(c);
    const filled = speaker >= TOTAL || (started && c === litCol);
    drawSort(ctx, x, LAY.classY, cw, LAY.classH, {
      fill: filled ? LP.aux : LP.dark,
      emphasis: filled,
      lift: filled ? 2 : 0,
    });
  }
}

function drawPatchGrid(ctx: CanvasRenderingContext2D, speaker: number): void {
  const cw = cellW();
  const ch = gridCellH();
  const activeRow = speaker >= TOTAL ? -1 : Math.floor(speaker / N);
  const activeCol = speaker >= TOTAL ? -1 : speaker % N;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const idx = r * N + c;
      const active = r === activeRow && c === activeCol;
      drawSort(ctx, colX(c), patchY(r), cw, ch, {
        fill: active ? LP.guide : LP.dark,
        emphasis: active,
        lift: active ? 3 : 0,
      });
    }
  }
}

function drawConvergence(ctx: CanvasRenderingContext2D, speaker: number): void {
  const cw = cellW();
  const ch = gridCellH();
  if (speaker < TOTAL) {
    const r = Math.floor(speaker / N);
    const c = speaker % N;
    drawLink(ctx, colX(c) + cw / 2, patchY(r) + ch / 2, colX(c) + cw / 2, LAY.classY + LAY.classH + 2, {
      color: LP.success,
      width: 3,
    });
  }
  for (let c = 0; c < N; c++) {
    const r = speaker >= TOTAL ? N - 1 : clamp(Math.floor(speaker / N), 0, N - 1);
    const y = patchY(r) + ch;
    drawLink(ctx, colX(c) + cw / 2, y, colX(c) + cw / 2, LAY.classY + LAY.classH + 2, {
      color: LP.support,
      dashed: true,
      width: 1,
    });
  }
}

function renderNormal(ctx: CanvasRenderingContext2D, speaker: number, started: boolean): void {
  drawField(ctx, 0, 0, 1080, 360);
  drawConvergence(ctx, speaker);
  drawClassRow(ctx, speaker, started);
  drawPatchGrid(ctx, speaker);
  drawLabel(ctx, '记录员', LAY.x, 62, { size: 12, weight: 600, color: LP.aux });
}

function renderAna(ctx: CanvasRenderingContext2D, t: number): void {
  drawField(ctx, 0, 0, 560, 140);
  const phase = clamp(t, 0, 1);
  const speaker = Math.floor(phase * (N * N + 1));
  const active = clamp(speaker, 0, N * N - 1);
  const r = Math.floor(active / N);
  const c = active % N;
  const cw = 14;
  const ch = 8;
  // 记录员那一行
  for (let i = 0; i < N; i++) {
    drawSort(ctx, 40 + i * (cw + 2), 24, cw, 12, {
      fill: i <= c ? LP.aux : LP.dark,
      emphasis: i <= c,
    });
  }
  // 方块阵列
  for (let rr = 0; rr < N; rr++) {
    for (let cc = 0; cc < N; cc++) {
      const idx = rr * N + cc;
      const act = rr === r && cc === c;
      drawSort(ctx, 40 + cc * (cw + 2), 52 + rr * (ch + 2), cw, ch, {
        fill: act ? LP.guide : LP.dark,
        emphasis: act,
      });
    }
  }
  drawLink(ctx, 40 + c * (cw + 2) + cw / 2, 52 + r * (ch + 2) + ch, 40 + c * (cw + 2) + cw / 2, 36, {
    color: LP.success,
    width: 2,
  });
  drawLabel(ctx, '记录员', 40, 18, { size: 12, weight: 600, color: LP.aux });
}

export const ClassRecorder: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? 560 : 1080;
  const H = isAna ? 140 : 360;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const stRef = useRef({ speaker: 0, running: false, done: false, t: 0, ana: 0 });

  const [speaker, setSpeaker] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    stRef.current.speaker = speaker;
    stRef.current.running = running;
    stRef.current.done = done;
  }, [speaker, running, done]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const draw = () => {
      try {
        if (isAna) renderAna(ctx, stRef.current.ana);
        else renderNormal(ctx, stRef.current.speaker, stRef.current.speaker > 0 || stRef.current.done);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      } catch {
        /* 单帧绘制失败不应中断循环 */
      }
    };
    const start = () => {
      cancelAnimationFrame(rafRef.current);
      const loop = () => {
        if (isAna) {
          stRef.current.ana = (stRef.current.ana + 0.004) % 1;
        } else if (stRef.current.running && stRef.current.speaker < TOTAL) {
          stRef.current.t += 1;
          if (stRef.current.t >= 8) {
            stRef.current.t = 0;
            const next = stRef.current.speaker + 1;
            setSpeaker(next);
            if (next >= TOTAL) {
              setRunning(false);
              setDone(true);
            }
          }
        }
        draw();
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const stop = () => cancelAnimationFrame(rafRef.current);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H, isAna]);

  const nextOne = () => {
    if (speaker >= TOTAL) return;
    const n = speaker + 1;
    setSpeaker(n);
    if (n >= TOTAL) setDone(true);
  };

  const runAll = () => {
    if (speaker >= TOTAL) return;
    stRef.current.t = 0;
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setSpeaker(0);
    stRef.current.t = 0;
  };

  const midText =
    speaker >= TOTAL
      ? '记录员手里这张总结，就是后面要拿去比对调料的东西 q(x) = f(x)[0,:]。'
      : `第 ${speaker + 1} 格正在发言……`;
  const tone: '' | 'good' = speaker >= TOTAL ? 'good' : '';

  return (
    <div className="widget">
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      {!isAna && (
        <>
          <div className="step-ctrl">
            <button type="button" className="tiny" onClick={nextOne} disabled={speaker >= TOTAL}>
              让下一格发言
            </button>
            <button type="button" className="tiny ghost" onClick={runAll} disabled={speaker >= TOTAL || running}>
              跑完全程
            </button>
            <button type="button" className="tiny ghost" onClick={reset}>
              重置
            </button>
            <span className="step-label">
              第 {speaker} / {TOTAL} 格
            </span>
          </div>

          <div className="step-desc">
            上面那一行是 <b>[class]</b> 记录员，它不来自任何一个字格，位置是模型自己留的；下面 {N}×{N} = {TOTAL}{' '}
            个格子逐个开口，把话都汇总到它手里。
          </div>

          <div className={`feedback ${tone}`}>{midText}</div>
        </>
      )}
    </div>
  );
};

export default ClassRecorder;

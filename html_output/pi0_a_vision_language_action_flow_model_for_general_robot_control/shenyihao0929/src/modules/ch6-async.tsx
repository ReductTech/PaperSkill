import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Module 6.1 (P3 synchronized + chips): two swimlanes advance on one shared
// clock (~2 s animation, then hold). TOP red = 档位词 VLA: long word-by-word
// 生成 blocks (stair glyph) broken by hatched 空等 gaps while the robot idles.
// BOTTOM green = π0: purple 推理下一段 blocks overlap green 执行上一段 blocks —
// the two rows never leave an idle gap. The wheel spins faster on the 50Hz
// chip; drawValueChip badges show 0.8s / 16 步 vs 0.5s / 25 步.
const W = 1080;
const H = 280;
const X0 = 140;
const X1 = 1040;
const DUR = 2000;
const FONT_TXT = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type LaneKind = 'gen' | 'wait' | 'exec';
const RED_BLOCKS: { f0: number; f1: number; kind: LaneKind }[] = [
  { f0: 0.0, f1: 0.3, kind: 'gen' },
  { f0: 0.3, f1: 0.38, kind: 'wait' },
  { f0: 0.38, f1: 0.48, kind: 'exec' },
  { f0: 0.48, f1: 0.78, kind: 'gen' },
  { f0: 0.78, f1: 0.86, kind: 'wait' },
  { f0: 0.86, f1: 0.96, kind: 'exec' },
  { f0: 0.96, f1: 1.0, kind: 'wait' },
];

const FB_20 = 'UR5e/Franka：每 0.8 秒推理一次、开环执行 16 步。';
const FB_50 = '双臂机：每 0.5 秒执行 25 步——50Hz 灵巧控制照跑（开环；动作集成实测反而伤性能）。';

function laneX(f: number): number {
  return X0 + f * (X1 - X0);
}

function blockText(ctx: CanvasRenderingContext2D, txt: string, x: number, w: number, y: number, col: string) {
  ctx.fillStyle = col;
  ctx.font = FONT_TXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, x + w / 2, y);
}

export const Ch6Async: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef({ startTs: -1, hz: 20, spin: 0, prevMs: 0 });
  const rafRef = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [hz, setHz] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '按「开始」看双泳道：上=档位词 VLA 逐词生成、机器人干等；下=π0 推一段演一段、没有空档。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const run = runRef.current;
      const dt = run.prevMs > 0 ? Math.max(0, ms - run.prevMs) : 16;
      run.prevMs = ms;
      const running = run.startTs > 0;
      const p = running ? clamp((ms - run.startTs) / DUR, 0, 1) : 0;
      const rate = !running ? 0.0012 : run.hz === 50 ? 0.0068 : 0.0028;
      run.spin = (run.spin + dt * rate) % (Math.PI * 2);

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // lane tracks (always visible)
      const tracks: [number, number, string][] = [
        [44, 38, '#f6efe9'],
        [134, 32, '#f2eefb'],
        [170, 32, '#ebf6f0'],
      ];
      tracks.forEach(([ty, th, col]) => {
        ctx.fillStyle = col;
        ctx.fillRect(X0, ty, X1 - X0, th);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(X0, ty, X1 - X0, th);
      });

      // blocks revealed by the shared clock
      ctx.save();
      ctx.beginPath();
      ctx.rect(X0, 40, (X1 - X0) * Math.max(p, 0.0001), 170);
      ctx.clip();

      RED_BLOCKS.forEach((b) => {
        const x = laneX(b.f0);
        const w = laneX(b.f1) - x;
        if (b.kind === 'gen') {
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.roundRect(x + 1, 44, w - 2, 38, 3);
          ctx.fill();
          // word-by-word stair glyph
          ctx.strokeStyle = C.white;
          ctx.lineWidth = 2.2;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 14, 74);
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(x + 14 + s * 13 + 13, 74 - s * 5.2);
            ctx.lineTo(x + 14 + s * 13 + 13, 74 - (s + 1) * 5.2);
          }
          ctx.stroke();
          blockText(ctx, '生成', x, w, 63, C.white);
        } else if (b.kind === 'wait') {
          ctx.fillStyle = '#e4e7ec';
          ctx.beginPath();
          ctx.roundRect(x + 1, 44, w - 2, 38, 3);
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 1, 44, w - 2, 38);
          ctx.clip();
          ctx.strokeStyle = C.muted;
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 1;
          for (let hx = x - 38; hx < x + w; hx += 9) {
            ctx.beginPath();
            ctx.moveTo(hx, 82);
            ctx.lineTo(hx + 38, 44);
            ctx.stroke();
          }
          ctx.restore();
          blockText(ctx, '空等', x, w, 63, C.muted);
        } else {
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.roundRect(x + 1, 44, w - 2, 38, 3);
          ctx.fill();
          blockText(ctx, '执行', x, w, 63, C.white);
        }
      });

      // π0 lane: purple inference row overlapping green execution row
      for (let i = 0; i < 4; i++) {
        const x = laneX(i / 4);
        const w = laneX((i + 1) / 4) - x;
        ctx.fillStyle = i % 2 === 0 ? C.purple : '#9567ea';
        ctx.beginPath();
        ctx.roundRect(x + 1, 134, w - 2, 32, 3);
        ctx.fill();
        blockText(ctx, '推理', x, w, 150, C.white);
        ctx.fillStyle = i % 2 === 0 ? C.green : '#3ba774';
        ctx.beginPath();
        ctx.roundRect(x + 1, 170, w - 2, 32, 3);
        ctx.fill();
        blockText(ctx, '执行', x, w, 186, C.white);
      }
      ctx.restore();

      // playhead while the clock runs
      if (running && p < 1) {
        const px = laneX(p);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, 38);
        ctx.lineTo(px, 212);
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(px - 5, 38);
        ctx.lineTo(px + 5, 38);
        ctx.lineTo(px, 46);
        ctx.closePath();
        ctx.fill();
      }

      // wheel (spins faster on 50Hz chip), labels, legend, badges
      drawWheel(ctx, 62, 150, 32, { spin: run.spin });
      drawSceneLabel(ctx, '档位词 VLA', X0, 30, { color: C.red });
      drawSceneLabel(ctx, 'π0', X0, 122, { color: C.green });
      drawLegend(
        ctx,
        [['推理', C.purple], ['执行', C.green], ['空等', C.muted]],
        X0,
        248
      );
      drawValueChip(ctx, 880, 248, run.hz === 20 ? '0.8s' : '0.5s', C.orange);
      drawValueChip(ctx, 946, 248, run.hz === 20 ? '16 步' : '25 步', C.purple);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applyFb = (chip: number) => {
    setFeedback(
      chip === 20 ? { text: FB_20, cls: '' } : { text: FB_50, cls: 'good' }
    );
  };

  const onStart = () => {
    runRef.current.startTs = performance.now();
    setStarted(true);
    applyFb(runRef.current.hz);
  };

  const chooseHz = (chip: number) => {
    runRef.current.hz = chip;
    setHz(chip);
    applyFb(chip);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="step-ctrl">
          <button className="tiny" onClick={onStart}>
            {started ? '重放' : '开始'}
          </button>
          <div className="chip-row">
            <button
              className={`chip${hz === 20 ? ' selected' : ''}`}
              onClick={() => chooseHz(20)}
            >
              20Hz
            </button>
            <button
              className={`chip${hz === 50 ? ' selected' : ''}`}
              onClick={() => chooseHz(50)}
            >
              50Hz
            </button>
          </div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Async;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawGuide,
  drawInkPath,
  drawBrush,
  drawLegend,
  drawSceneLabel,
  makeRng,
} from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 5.1 条件强度滑杆（P1 滑杆）：上轨指令轨迹（虚线棕）固定，
// 下轨生成轨迹 = 指令·w + 种子噪声·(1−w)，粗细 2+3w；
// 底部双横条：对齐度 al(w)=w^0.8（绿）、多样性 dv(w)=0.9(1−w)+0.1（橙）。

const W = 720;
const H = 300;

const X0 = 96;
const X1 = 648;
const Y_CMD = 86;
const Y_GEN = 178;

function wavePts(y0: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const rel = i / n;
    pts.push({
      x: X0 + rel * (X1 - X0),
      y: y0 + Math.sin(rel * Math.PI * 2) * 16 + Math.sin(rel * Math.PI * 4) * 4,
    });
  }
  return pts;
}

const CMD = wavePts(Y_CMD);
const rng = makeRng(20260505);
const NOISE = Array.from({ length: CMD.length }, () => (rng() * 2 - 1) * 26);

export const M51CondStrength: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ w: 0.6 });
  const rafRef = useRef<number | null>(null);
  const [w, setW] = useState(0.6);

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
      const wv = s.w;
      const gen = CMD.map((p, i) => ({
        x: p.x,
        y: clamp(p.y + NOISE[i] * (1 - wv), Y_GEN - 40, Y_GEN + 40),
      }));

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.guide, text: '指令' },
        { color: PALETTE.blue, text: '生成' },
      ]);

      // 上轨：指令轨迹（固定波浪）
      drawSceneLabel(ctx, 70, Y_CMD, '指令轨迹', { size: 12, align: 'right' });
      drawGuide(ctx, CMD);

      // 下轨：生成轨迹（即时重画）
      drawSceneLabel(ctx, 70, Y_GEN, '生成轨迹', { size: 12, align: 'right' });
      drawInkPath(ctx, gen, { color: PALETTE.blue, width: 2 + 3 * wv });

      // 毛笔停在生成轨迹末端附近
      const bi = Math.round(0.86 * (gen.length - 1));
      drawBrush(ctx, gen[bi].x, gen[bi].y, 0.16, 26);

      // 底部双横条
      const al = Math.pow(wv, 0.8);
      const dv = 0.9 * (1 - wv) + 0.1;
      const bar = (y: number, frac: number, color: string, label: string) => {
        drawSceneLabel(ctx, 40, y + 7, label, { size: 12 });
        const bx = 112;
        const bw = 440;
        ctx.fillStyle = PALETTE.grid;
        ctx.fillRect(bx, y, bw, 12);
        ctx.fillStyle = color;
        ctx.fillRect(bx, y, bw * frac, 12);
        drawSceneLabel(ctx, bx + bw + 10, y + 7, frac.toFixed(2), { size: 12, color });
      };
      bar(244, al, PALETTE.green, '对齐度');
      bar(270, dv, PALETTE.orange, '多样性');

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.w = v;
    setW(v);
  };

  const fb =
    w < 0.3
      ? { text: '条件太弱：生成自由发挥，不听指挥。', cls: 'bad' }
      : w <= 0.75
      ? { text: '适中：既跟得住指令，又留有生气。', cls: 'good' }
      : { text: '条件过强：千字一面，僵直呆板。', cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          条件强度 w <span className="val">{w.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(w * 100)}
          onChange={onChange}
          aria-label="条件强度"
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M51CondStrength;

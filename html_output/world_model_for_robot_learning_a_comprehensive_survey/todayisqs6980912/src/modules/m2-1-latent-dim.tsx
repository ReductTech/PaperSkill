import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor } from '../lib/canvasKit';
import { PALETTE, drawScene, drawGuide, drawInkPath, drawLegend, drawSceneLabel, makeRng, DEFAULT_GLYPH } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 2.1 潜在维度 d：压到多细刚好？（P1 滑杆）
// 滑杆在 {2,4,8,16,32,64} 六档间切换：原字墨点阵固定，重构字立即重画，
// 右侧两根竖条（重构误差 / 计算成本）缓动同步。d≤2 时笔画被拉向质心塌成墨团。

const W = 720;
const H = 320;
const DIMS = [2, 4, 8, 16, 32, 64];

const sigma = (d: number) => 14 * Math.pow(1 - d / 64, 1.5);
const errOf = (d: number) => 46 - 38 * (1 - Math.exp(-d / 9));
const costOf = (d: number) => (d * 1.1) / (64 * 1.1);

export const M21LatentDim: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ dIdx: 2, animErr: errOf(8) / 46, animCost: costOf(8) });
  const rafRef = useRef<number | null>(null);
  const [dIdx, setDIdx] = useState(2);
  const d = DIMS[dIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 原字墨点阵：把范字骨架栅格化到 16×16
    const cells = new Set<string>();
    for (const stroke of DEFAULT_GLYPH) {
      for (let i = 0; i < stroke.length - 1; i++) {
        for (let f = 0; f <= 1.001; f += 0.02) {
          const gx = stroke[i].x + (stroke[i + 1].x - stroke[i].x) * f;
          const gy = stroke[i].y + (stroke[i + 1].y - stroke[i].y) * f;
          cells.add(`${Math.round(gx * 15)},${Math.round(gy * 15)}`);
        }
      }
    }

    const render = () => {
      const s = stateRef.current;
      const dd = DIMS[s.dIdx];
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 34, [
        { color: PALETTE.ink, text: '原字' },
        { color: PALETTE.blue, text: '重构' },
      ]);

      // 左区：原字（淡棕字帖底 + 16×16 墨点阵）
      const lx = 34;
      const ly = 56;
      const cell = 9.6;
      const gw = cell * 15;
      const gh = cell * 15;
      drawGuide(
        ctx,
        DEFAULT_GLYPH.flatMap((stroke) =>
          stroke.map((p) => ({ x: lx + p.x * gw, y: ly + p.y * gh }))
        )
      );
      ctx.save();
      ctx.fillStyle = PALETTE.ink;
      ctx.globalAlpha = 0.82;
      for (const key of cells) {
        const [cx, cy] = key.split(',').map(Number);
        ctx.fillRect(lx + cx * cell - 1.5, ly + cy * cell - 1.5, 3.2, 3.2);
      }
      ctx.restore();

      // 中区：重构字（骨架 + 逐点高斯噪声；d≤2 塌向质心）
      const mx = 250;
      const my = 56;
      const mw = 150;
      const mh = 200;
      const rng = makeRng(1000 + dd);
      const sg = sigma(dd) * 1.6;
      const centroid = { x: mx + mw / 2, y: my + mh / 2 };
      const collapse = dd <= 2 ? 0.72 : 0;
      for (const stroke of DEFAULT_GLYPH) {
        const pts: { x: number; y: number }[] = [];
        let devSum = 0;
        for (const p of stroke) {
          const nx = (rng() * 2 - 1) * sg;
          const ny = (rng() * 2 - 1) * sg;
          let x = mx + p.x * mw + nx;
          let y = my + p.y * mh + ny;
          devSum += Math.hypot(nx, ny);
          x = lerp(x, centroid.x, collapse);
          y = lerp(y, centroid.y, collapse);
          pts.push({ x, y });
        }
        const dev = devSum / stroke.length;
        drawInkPath(ctx, pts, {
          color: dev > 13 ? PALETTE.red : PALETTE.blue,
          width: 3.5,
        });
      }

      // 右区：双竖条（误差 / 成本），缓动
      const targetErr = errOf(dd) / 46;
      const targetCost = costOf(dd);
      s.animErr = lerp(s.animErr, targetErr, 0.18);
      s.animCost = lerp(s.animCost, targetCost, 0.18);
      const barTop = 62;
      const barMax = 190;
      const drawBar = (x: number, v: number, color: string) => {
        const h = clamp(v, 0, 1) * barMax;
        ctx.save();
        ctx.fillStyle = PALETTE.paper;
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 1;
        ctx.fillRect(x, barTop, 36, barMax);
        ctx.strokeRect(x + 0.5, barTop + 0.5, 36, barMax);
        ctx.fillStyle = color;
        ctx.fillRect(x, barTop + barMax - h, 36, h);
        ctx.restore();
      };
      const errColor = lerpColor(PALETTE.red, PALETTE.green, 1 - clamp(s.animErr, 0, 1));
      drawBar(480, s.animErr, errColor);
      drawBar(590, s.animCost, PALETTE.orange);
      drawSceneLabel(ctx, 498, barTop + barMax + 18, '误差', { align: 'center' });
      drawSceneLabel(ctx, 608, barTop + barMax + 18, '成本', { align: 'center' });

      // 条顶裸数值
      ctx.save();
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `11px ${'"Segoe UI", "Microsoft YaHei", sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText(errOf(dd).toFixed(1), 498, barTop + barMax + 34);
      ctx.fillText((costOf(dd) * 100).toFixed(0), 608, barTop + barMax + 34);
      ctx.restore();

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

  useEffect(() => {
    stateRef.current.dIdx = dIdx;
  }, [dIdx]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDIdx(clamp(Number(e.target.value), 0, DIMS.length - 1));
  };

  const fb =
    d <= 4
      ? { text: '维度太少：间架结构丢了，只剩一团墨。', cls: 'bad' }
      : d <= 32
      ? { text: '适中：结构保住，算力还省——潜表征的意义正在于此。', cls: 'good' }
      : { text: '维度过多：连纸纹都想记，算力白白翻倍。', cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          潜在维度 d <span className="val">{d}</span>
        </label>
        <input
          type="range"
          min={0}
          max={DIMS.length - 1}
          step={1}
          value={dIdx}
          onChange={onChange}
          aria-label="潜在维度档位"
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M21LatentDim;

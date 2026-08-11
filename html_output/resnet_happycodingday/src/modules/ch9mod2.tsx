import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel, drawLegend } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch9 M9.2: P4 chips depth 20/32/44/56/110/1202 — train vs test error bars (Table 6).
const W = 560;
const H = 240;

const DEPTHS = [
  { depth: 20, train: 5.5, test: 8.75, note: '浅层基线' },
  { depth: 32, train: 4.2, test: 7.51, note: '深度红利' },
  { depth: 44, train: 3.6, test: 7.17, note: '深度红利' },
  { depth: 56, train: 3.1, test: 6.97, note: '深度红利' },
  { depth: 110, train: 2.5, test: 6.43, note: '甜点深度（6.43%，5 次均值 6.61±0.16）', best: true },
  { depth: 1202, train: 0.1, test: 7.93, note: '过拟合：训练 <0.1% 但测试回升', over: true },
];

export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ depth: 110 });
  const rafRef = useRef<number | null>(null);
  const [depth, setDepth] = useState(110);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { depth: number }) => {
      clearScene(ctx, W, H);
      const cur = DEPTHS.find((d) => d.depth === s.depth) || DEPTHS[4];
      const ox = 120;
      const oy = 200;
      const max = 10;
      const scale = (v: number) => (v / max) * 120;
      // axis
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 400, oy);
      ctx.stroke();
      drawSceneLabel(ctx, '错误率 %（越低越好）', ox + 8, 40, C.muted);
      // all depth points
      DEPTHS.forEach((d) => {
        const x = ox + (d.depth === 1202 ? 380 : mapLog(d.depth));
        const ty = oy - scale(d.train);
        const ety = oy - scale(d.test);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, ty, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = d.depth === s.depth ? (d.over ? C.orange : C.green) : C.red;
        ctx.beginPath();
        ctx.arc(x, ety, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      // current markers and values
      const cx = ox + (cur.depth === 1202 ? 380 : mapLog(cur.depth));
      const cty = oy - scale(cur.train);
      const cety = oy - scale(cur.test);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, oy - 130);
      ctx.lineTo(cx, oy);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`训练 ${cur.train}%`, cx, cty - 10);
      ctx.fillStyle = cur.over ? C.orange : C.green;
      ctx.fillText(`测试 ${cur.test}%`, cx, cety - 10);
      ctx.fillStyle = C.ink;
      ctx.fillText(`${cur.depth} 层`, cx, oy + 20);
      // note
      drawSceneLabel(ctx, cur.note, W / 2, 42, cur.over ? C.orange : cur.best ? C.green : C.ink, 'center');
      drawLegend(ctx, [
        { color: C.blue, label: '训练误差' },
        { color: C.green, label: '测试误差' },
        { color: C.orange, label: '过拟合' },
      ], ox, oy + 40);
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

  const pick = (d: number) => {
    stateRef.current.depth = d;
    setDepth(d);
  };

  const cur = DEPTHS.find((d) => d.depth === depth) || DEPTHS[4];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {DEPTHS.map((d) => (
          <button key={d.depth} className={`chip ${d.depth === depth ? 'active' : ''}`} onClick={() => pick(d.depth)}>
            {d.depth} 层
          </button>
        ))}
      </div>
      <div className={`feedback ${cur.over ? '' : cur.best ? 'good' : ''}`}>
        {cur.over
          ? '训练误差 <0.1% 但测试误差回升到 7.93%——小数据集上的过拟合（19.4M 参数）。'
          : `${cur.depth} 层：训练误差 ${cur.train}%，测试误差 ${cur.test}%。${cur.best ? '这是 CIFAR-10 上的甜点深度。' : '深度增加，测试误差持续下降：深度红利。'}`}
      </div>
    </div>
  );
};

function mapLog(d: number): number {
  return Math.round(Math.log10(d / 20) / Math.log10(110 / 20) * 300) + 10;
}

export default Ch9Mod2;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawSceneLabel,
  drawValueChip,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch6 module 6.1 — 环境数扩展 (P1 slider, snapping to 6 stops 3/12/22/53/82/104).
// TOP: trail of visited homes (capped at 10, ×N chip for the actual count).
// MIDDLE: four task bars rising with the stop (qualitative).
// BOTTOM: co-trained (green) ≈ test-home-trained control (green dashed,
// at 104) ≫ no-co-training baseline (red, even with test-home data).
const W = 1080;
const H = 280;
const STOPS = [3, 12, 22, 53, 82, 104];
const SHOWN_CAP = 10;
const TASKS = ['餐具入池', '物品入抽屉', '衣物入篮', '铺床'];
const TASK_OFFSET = [6, 2, 10, 0];
const BAR_W = 110;
const BAR_GAP = 78;
const BAR_X0 = (W - (TASKS.length * BAR_W + (TASKS.length - 1) * BAR_GAP)) / 2;
const BASELINE = 170;
const MAX_H = 58;
const STRIP_X = 170;
const STRIP_WMAX = 830;
const CTRL_WMAX = 0.93;
const BASE_WFRAC = 0.22;

interface Fb {
  text: string;
  cls: string;
}

const FEEDBACK: Fb[] = [
  { text: '3 家起步：换个抽屉就认不出了。', cls: '' },
  { text: '12 家：成绩开始爬坡——但没见过的布局仍会卡壳。', cls: '' },
  { text: '22 家：四项任务在涨，语言跟随也跟着涨。', cls: '' },
  { text: '53 家：见过的布局过半，新家里的失误越来越少。', cls: '' },
  { text: '82 家：逼近打平——只差最后一档。', cls: '' },
  {
    text: '与直接在测试家训练打平——<b>共训配方替代了在新房采数据</b>。',
    cls: 'good',
  },
];

export const Ch6Scaling: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 0, bars: TASK_OFFSET.map((o) => 12 + o) });
  const rafRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<Fb>(FEEDBACK[0]);
  const stop = STOPS[Math.max(0, Math.min(STOPS.length - 1, idx))];

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
      const stopN = STOPS[Math.max(0, Math.min(STOPS.length - 1, s.idx))];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- TOP: trail of visited homes ----
      drawSceneLabel(ctx, '走过的家', 24, 18, { color: C.blue });
      const shown = Math.min(stopN, SHOWN_CAP);
      for (let k = 0; k < shown; k++) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.5 * (k / Math.max(1, shown - 1));
        drawHome(ctx, 24 + k * 46, 34, 36, 30, { familiar: true, tidy01: 0.9 });
        ctx.restore();
      }
      const chipX = 24 + shown * 46 + 24;
      drawValueChip(ctx, chipX, 50, `×${stopN}`, C.blue);
      drawCrew(ctx, chipX + 58, 68, 1.0, { mode: 'work', t: performance.now() / 400, color: C.green });

      // separator
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 84);
      ctx.lineTo(W - 16, 84);
      ctx.stroke();

      // ---- MIDDLE: four task bars (qualitative) ----
      drawSceneLabel(ctx, '四任务成绩', 24, 104, { color: C.blue });
      const targets = TASK_OFFSET.map((o) => 12 + (s.idx / (STOPS.length - 1)) * 46 + o);
      for (let i = 0; i < TASKS.length; i++) {
        s.bars[i] = s.bars[i] + (targets[i] - s.bars[i]) * 0.16;
        const h = clamp(s.bars[i], 8, MAX_H + 10);
        const x = BAR_X0 + i * (BAR_W + BAR_GAP);
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(x, BASELINE - h, BAR_W, h, 5);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 8, BASELINE);
        ctx.lineTo(x + BAR_W + 8, BASELINE);
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TASKS[i], x + BAR_W / 2, 190);
      }

      // separator
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 202);
      ctx.lineTo(W - 16, 202);
      ctx.stroke();

      // ---- BOTTOM: comparison strip ----
      const font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      const rows: Array<{ y: number; label: string; w: number; kind: 'solid' | 'dash' | 'red' }> = [
        {
          y: 220,
          label: `共训 ${stopN} 家`,
          w: STRIP_WMAX * (0.3 + 0.65 * (s.idx / (STOPS.length - 1))),
          kind: 'solid',
        },
        { y: 242, label: '测试家特训对照', w: STRIP_WMAX * CTRL_WMAX, kind: 'dash' },
        { y: 264, label: '无共训基线', w: STRIP_WMAX * BASE_WFRAC, kind: 'red' },
      ];
      rows.forEach((r) => {
        ctx.fillStyle = r.kind === 'red' ? C.red : C.text;
        ctx.font = font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.label, 24, r.y + 8);
        if (r.kind === 'solid') {
          ctx.fillStyle = C.green;
          ctx.beginPath();
          ctx.roundRect(STRIP_X, r.y, r.w, 16, 8);
          ctx.fill();
        } else if (r.kind === 'dash') {
          ctx.save();
          ctx.fillStyle = 'rgba(34, 141, 92, 0.15)';
          ctx.beginPath();
          ctx.roundRect(STRIP_X, r.y, r.w, 16, 8);
          ctx.fill();
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.roundRect(STRIP_X, r.y, r.w, 16, 8);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.roundRect(STRIP_X, r.y, r.w, 16, 8);
          ctx.fill();
        }
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stopFn = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startFn = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, startFn, stopFn);
    return () => {
      stopFn();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(STOPS.length - 1, Math.round(Number(e.target.value))));
    stateRef.current.idx = v;
    setIdx(v);
    setFeedback(FEEDBACK[Math.max(0, Math.min(FEEDBACK.length - 1, v))]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          训练环境数 <span className="val">{stop} 家</span>
        </label>
        <input type="range" min={0} max={STOPS.length - 1} step={1} value={idx} onChange={onChange} />
        <span className="note">柱高为示意，结论以论文图 8 为准</span>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch6Scaling;

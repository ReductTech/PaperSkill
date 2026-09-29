import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawVerdict,
  drawArm,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Module 3.2 「多模态轨迹台」 — the same observation admits multiple valid
// trajectories (flow matching models a multimodal action distribution);
// unimodal regression would average them into one invalid middle route.
const W = 1080;
const H = 280;

type Mode = 'left' | 'right' | 'lift' | 'average';

interface Route {
  key: Mode;
  chip: string;
  label: string;
  pts: [number, number][];
  valid: boolean;
}

const CUP = { x: 540, y: 150 };
const START = { x: 120, y: 214 };
const GOAL = { x: 950, y: 214 };

const ROUTES: Route[] = [
  {
    key: 'left',
    chip: '左绕',
    label: '从杯子左侧绕行',
    pts: [[120, 214], [330, 214], [420, 128], [660, 128], [750, 214], [950, 214]],
    valid: true,
  },
  {
    key: 'right',
    chip: '右绕',
    label: '从杯子右侧绕行',
    pts: [[120, 214], [330, 214], [420, 268], [660, 268], [750, 214], [950, 214]],
    valid: true,
  },
  {
    key: 'lift',
    chip: '先抬后移',
    label: '抬高越过杯子',
    pts: [[120, 214], [400, 214], [540, 74], [680, 74], [820, 214], [950, 214]],
    valid: true,
  },
  {
    key: 'average',
    chip: '平均路线',
    label: '单模态回归的平均',
    pts: [[120, 214], [330, 214], [415, 160], [665, 160], [755, 214], [950, 214]],
    valid: false,
  },
];

export const Ch3Multimodal: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'left' });
  const [mode, setMode] = useState<Mode>('left');
  const [feedback, setFeedback] = useState({
    text: '同一个订单、同一张桌子——切挨看看，哪条路线走得通。',
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
    let raf = 0;

    const drawRoute = (pts: [number, number][], color: string, dashed: boolean) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      if (dashed) ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const m = stateRef.current.mode;
      const route = ROUTES.find((r) => r.key === m)!;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // table props: the cup obstacle (start & goal dishes)
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(CUP.x, CUP.y + 26, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CUP.x - 24, CUP.y + 26);
      ctx.lineTo(CUP.x - 24, CUP.y - 12);
      ctx.quadraticCurveTo(CUP.x, CUP.y - 30, CUP.x + 24, CUP.y - 12);
      ctx.lineTo(CUP.x + 24, CUP.y + 26);
      ctx.fillStyle = '#eef2ea';
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, '杯子', CUP.x, CUP.y - 42, { color: C.muted, align: 'center' });
      ctx.restore();
      // start/goal dishes
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(START.x, START.y + 6, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(GOAL.x, GOAL.y + 6, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, '起点', START.x, START.y - 22, { color: C.muted, align: 'center' });
      drawSceneLabel(ctx, '终点', GOAL.x, GOAL.y - 22, { color: C.muted, align: 'center' });
      ctx.restore();

      // ghost routes (the other valid ones, faint dashed)
      ROUTES.filter((r) => r.valid && r.key !== m).forEach((r) => {
        ctx.globalAlpha = 0.28;
        drawRoute(r.pts, C.green, true);
        ctx.globalAlpha = 1;
      });

      // the selected route, solid, with a moving hand along it
      const color = route.valid ? C.green : C.red;
      drawRoute(route.pts, color, false);
      // hand position along polyline by time
      const flat: [number, number][] = route.pts;
      const segs: { p: [number, number]; len: number }[] = [];
      let total = 0;
      for (let i = 1; i < flat.length; i++) {
        const len = Math.hypot(flat[i][0] - flat[i - 1][0], flat[i][1] - flat[i - 1][1]);
        segs.push({ p: flat[i - 1], len });
        total += len;
      }
      const t = (ms / 2600) % 1;
      let d = t * total;
      let hx = flat[0][0];
      let hy = flat[0][1];
      for (const s of segs) {
        if (d <= s.len) {
          const k = s.len === 0 ? 0 : d / s.len;
          const next = flat[flat.indexOf(s.p) + 1];
          hx = s.p[0] + (next[0] - s.p[0]) * k;
          hy = s.p[1] + (next[1] - s.p[1]) * k;
          break;
        }
        d -= s.len;
      }
      drawArm(ctx, hx, hy + 8, { scale: 1.1, angle: 0.5, grip: 0.4, color });
      // verdict
      drawVerdict(ctx, GOAL.x + 8, GOAL.y - 56, route.valid, { r: 15, pulse: ms / 350 });
      if (!route.valid) {
        drawSceneLabel(ctx, '撞上杯子', CUP.x, CUP.y + 58, { color: C.red, align: 'center' });
      }
      // route label
      drawSceneLabel(ctx, route.label, 40, 44, { color: route.valid ? C.green : C.red });
      drawLegend(
        ctx,
        [
          ['可行路线', C.green],
          ['当前', C.orange],
        ],
        40,
        H - 16
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    const route = ROUTES.find((r) => r.key === m)!;
    setFeedback(
      route.valid
        ? { text: '可行——左绕、右绕、先抬后移都是「对的」：flow matching 建模的是整条分布，不是唯一答案。', cls: 'good' }
        : { text: '单模态回归会把多条好路线平均成一条中间路线——直接撞上杯子。这就是为什么灵巧动作需要多模态。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ROUTES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`chip ${mode === r.key ? 'selected' : ''}`}
            onClick={() => pick(r.key)}
          >
            {r.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Multimodal;

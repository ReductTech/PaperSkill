import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawChef,
  drawCookbook,
  drawStove,
  drawValueChip,
  drawSceneLabel,
  drawLegend,
} from './chefKit';
import type { WidgetProps } from './registry';

// Ch5 module 5.1 「训练配方台」 — P4 chips + P1 slider, hybrid linked views.
// Left 45%: the batch schedule strip (cookbook cells = web data, stove cells =
// robot data, mixed by strategy/ratio). Right 55%: the five evidence bars from
// paper Table 6 (unseen avg %: 9 / 42 / 44 / 52 / 63); the current combo is
// highlighted green, the rest are muted blue. scratch+55B is invalid (the paper
// skipped it because scratch 5B was already too weak) so the 55B chip is
// disabled and the note is shown in the feedback.
const W = 1080;
const H = 280;
const N = 10; // schedule cells
const CELL = 40;
const GAP = 6;
const SX0 = 26; // strip left
const SY = 74; // strip top

type Strategy = 'scratch' | 'ft' | 'coft';
type Size = '5B' | '55B';

const BARS: { key: string; v: number }[] = [
  { key: 'scratch-5B', v: 9 },
  { key: 'ft-5B', v: 42 },
  { key: 'coft-5B', v: 44 },
  { key: 'ft-55B', v: 52 },
  { key: 'coft-55B', v: 63 },
];
const BAR_X = [601, 673, 745, 841, 913];
const BAR_W = 50;
const BASE_Y = 236;

function feedbackFor(s: Strategy, sz: Size): { text: string; cls: string } {
  if (s === 'scratch') {
    return {
      text: '从零练 5B 只有 9%：没有预训练知识寸步难行。（论文因 5B 从零过差而跳过 55B 从零）',
      cls: 'bad',
    };
  }
  if (s === 'ft') {
    return { text: '只用机器人数据：会做但容易忘掉网页概念——5B 42 / 55B 52。', cls: '' };
  }
  return {
    text: `混着练最优：${sz} 达到 ${sz === '55B' ? 63 : 44}%——保留网页概念又不丢实操。`,
    cls: 'good',
  };
}

function barPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

export const Ch5Recipe: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ strategy: 'coft' as Strategy, size: '55B' as Size, ratio: 0.5 });
  const [strategy, setStrategy] = useState<Strategy>('coft');
  const [size, setSize] = useState<Size>('55B');
  const [ratio, setRatio] = useState(0.5);
  const [feedback, setFeedback] = useState(() => feedbackFor('coft', '55B'));

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

    const render = (ms: number) => {
      const { strategy: st, size: sz, ratio: ra } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // ---- left 45%: schedule strip (true = practice/stove, false = theory/book) ----
      const types: boolean[] = [];
      if (st === 'coft') {
        const nP = Math.round(ra * N);
        let placed = 0;
        for (let i = 0; i < N; i++) {
          const want = Math.round(((i + 1) * nP) / N);
          if (want > placed) {
            types.push(true);
            placed++;
          } else {
            types.push(false);
          }
        }
      } else {
        for (let i = 0; i < N; i++) types.push(true); // all practice
      }
      // ft starts from the pre-trained weights: a cookbook sits on the strip end
      if (st === 'ft') drawCookbook(ctx, SX0 + 20, SY, 0.65);
      for (let i = 0; i < N; i++) {
        const practice = types[i];
        const x = SX0 + i * (CELL + GAP);
        ctx.fillStyle = practice ? '#e0f0e8' : '#e2ecf7';
        ctx.strokeStyle = practice ? C.green : C.blue;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, SY, CELL, CELL, 5);
        ctx.fill();
        ctx.stroke();
        if (practice) drawStove(ctx, x + CELL / 2, SY + CELL - 9, 0.45);
        else drawCookbook(ctx, x + CELL / 2, SY + CELL - 5, 0.42);
      }
      // the chef trains along the strip
      const wx = 60 + ((1 - Math.cos((ms / 1600) * 2 * Math.PI)) / 2) * 350;
      const mode =
        st === 'coft' ? (Math.floor(ms / 1100) % 2 === 0 ? 'read' : 'cook') : 'cook';
      drawChef(ctx, wx, H - 40, 0.8, { mode, t: ms / 500 });
      drawLegend(ctx, [['书本·网页数据', C.blue], ['灶台·机器人', C.green]], SX0, H - 12);

      // ---- right 55%: five evidence bars (Table 6 unseen avg %) ----
      const currentKey = `${st}-${sz}`;
      BARS.forEach((b, i) => {
        const cur = b.key === currentKey;
        const h = b.v * 2.4;
        ctx.fillStyle = cur ? C.green : C.muted;
        barPath(ctx, BAR_X[i], BASE_Y - h, BAR_W, h, 4);
        ctx.fill();
        drawValueChip(
          ctx,
          BAR_X[i] + BAR_W / 2,
          BASE_Y - h - 16,
          String(b.v),
          cur ? C.green : C.muted
        );
      });
      // baseline + 5B / 55B group divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(520, BASE_Y + 0.5);
      ctx.lineTo(1050, BASE_Y + 0.5);
      ctx.stroke();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(818, BASE_Y - 165);
      ctx.lineTo(818, BASE_Y + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      drawSceneLabel(ctx, '未见过平均 %', 520, 30);
      drawSceneLabel(ctx, '5B → 55B', 782, 262, { align: 'center' });

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

  const apply = (s: Strategy, sz: Size, r: number) => {
    stateRef.current = { strategy: s, size: sz, ratio: r };
    setStrategy(s);
    setSize(sz);
    setRatio(r);
    setFeedback(feedbackFor(s, sz));
  };
  const pickStrategy = (s: Strategy) => apply(s, s === 'scratch' ? '5B' : size, ratio);
  const pickSize = (sz: Size) => apply(strategy, sz, ratio);
  const onRatio = (e: React.ChangeEvent<HTMLInputElement>) =>
    apply('coft', size, Number(e.target.value) / 100);
  const ratioOn = strategy === 'coft';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step-label">策略</span>
        <button
          className={`chip${strategy === 'scratch' ? ' selected' : ''}`}
          onClick={() => pickStrategy('scratch')}
        >
          从零训练
        </button>
        <button
          className={`chip${strategy === 'ft' ? ' selected' : ''}`}
          onClick={() => pickStrategy('ft')}
        >
          只用机器人数据
        </button>
        <button
          className={`chip${strategy === 'coft' ? ' selected' : ''}`}
          onClick={() => pickStrategy('coft')}
        >
          co-fine-tuning 混合
        </button>
        <span className="step-label">规模</span>
        <button
          className={`chip${size === '5B' ? ' selected' : ''}`}
          onClick={() => pickSize('5B')}
        >
          5B
        </button>
        <button
          className={`chip${size === '55B' ? ' selected' : ''}`}
          onClick={() => pickSize('55B')}
          disabled={strategy === 'scratch'}
          title="论文因 5B 从零过差而跳过 55B 从零"
          style={strategy === 'scratch' ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
        >
          55B
        </button>
        <label
          style={{
            opacity: ratioOn ? 1 : 0.45,
            cursor: ratioOn ? 'pointer' : 'not-allowed',
            flex: 1,
            minWidth: 200,
          }}
        >
          机器人占比 <span className="val">{Math.round(ratio * 100)}%</span>
          <input
            type="range"
            min={10}
            max={90}
            value={Math.round(ratio * 100)}
            disabled={!ratioOn}
            onChange={onRatio}
          />
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Recipe;

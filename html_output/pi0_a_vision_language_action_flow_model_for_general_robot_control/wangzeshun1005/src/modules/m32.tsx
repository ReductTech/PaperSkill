import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawKeyboard,
  drawHand,
  drawPath,
  drawScore,
  drawSceneLabel,
  drawLegend,
  EMPH,
  OK,
  BAD,
  LINE,
} from './musicKit';
import type { WidgetProps } from './registry';

// P2 分步：对比 H = 1（一次一个音，抖）与 H = 50（一次一小节，稳）。
const W = 1080;
const H = 280;

interface Step {
  focus: number; // -1 两边都看，0 左，1 右
  cls: '' | 'good' | 'bad';
  text: string;
}

const STEPS: Step[] = [
  {
    focus: -1,
    cls: '',
    text: '第 1 / 6 步：左边每次只决定一个动作（H = 1），右边一次决定一整块（H = 50）。点「下一步」逐条对比。',
  },
  {
    focus: 0,
    cls: 'bad',
    text: '第 2 / 6 步：H = 1 时，策略每弹一个音就要重新观察一次、重新决策一次。',
  },
  {
    focus: 0,
    cls: 'bad',
    text: '第 3 / 6 步：不断重新决策的结果——手在每个音之间都要停顿和修正，轨迹是抖的。',
  },
  {
    focus: 1,
    cls: 'good',
    text: '第 4 / 6 步：H = 50 时一次输出 50 个连续动作，相当于一口气弹完一小节。',
  },
  {
    focus: 1,
    cls: 'good',
    text: '第 5 / 6 步：一整块动作一次成形，轨迹平滑连贯，中途不需要重新决策。',
  },
  {
    focus: -1,
    cls: 'good',
    text: '第 6 / 6 步：论文采用动作块 horizon H = 50，控制频率最高 50 Hz——高频灵巧动作因此更稳。',
  },
];

export const M32: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const stepAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    stepAtRef.current = performance.now();

    const smooth = (t: number): number => {
      const x = clamp(t, 0, 1);
      return x * x * (3 - 2 * x);
    };

    const render = (now: number): void => {
      clearScene(ctx, W, H);
      const prog = clamp((now - stepAtRef.current) / 1600, 0, 1);
      const focus = STEPS[stepRef.current].focus;

      // 中间分隔线
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(540, 36);
      ctx.lineTo(540, 258);
      ctx.stroke();

      // ---- 左：H = 1，一次一个音 ----
      drawScore(ctx, 70, 74, 420, 22, 10, 1, BAD);
      drawSceneLabel(ctx, 'H = 1', 70, 48, BAD);
      const lw = 420 / 10;
      const idx = Math.min(Math.floor(prog * 10), 9);
      const played: number[] = [];
      for (let i = 0; i < idx; i++) played.push(i);
      drawKeyboard(ctx, 70, 190, 420, 44, 10, played, BAD);
      drawKeyboard(ctx, 70, 190, 420, 44, 10, [idx], EMPH);
      const jp: number[][] = [];
      for (let i = 0; i <= idx; i++) jp.push([70 + lw * (i + 0.5), 172 + (i % 2 === 0 ? -9 : 9)]);
      drawPath(ctx, jp, BAD, 3);
      const shake = Math.sin(now / 62) * 3;
      drawHand(ctx, 70 + lw * (idx + 0.5) + shake, 170 + shake, 0.6, BAD);

      // ---- 右：H = 50，一次一小节 ----
      drawScore(ctx, 590, 74, 420, 22, 10, Math.round(prog * 10), OK);
      drawSceneLabel(ctx, 'H = 50', 590, 48, OK);
      const rw = 420 / 10;
      const rp: number[][] = [];
      for (let i = 0; i <= 48; i++) {
        const u = i / 48;
        if (u > prog) break;
        rp.push([590 + rw * 0.5 + rw * 9 * u, 176 - Math.sin(u * Math.PI) * 22]);
      }
      drawPath(ctx, rp, OK, 3);
      const rlit: number[] = [];
      for (let i = 0; i < Math.round(prog * 10); i++) rlit.push(i);
      drawKeyboard(ctx, 590, 190, 420, 44, 10, rlit, OK);
      const e = smooth(prog);
      drawHand(ctx, 590 + rw * 0.5 + rw * 9 * e, 172 - Math.sin(e * Math.PI) * 22, 0.6, OK);

      // 当前聚焦的一侧
      if (focus === 0 || focus === 1) {
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 3;
        ctx.strokeRect(focus === 0 ? 40 : 560, 34, 480, 226);
      }

      drawLegend(
        ctx,
        [
          { color: BAD, text: '逐音重新决策' },
          { color: OK, text: '一次输出整块' },
        ],
        60,
        268
      );
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

  const goto = (i: number): void => {
    const n = clamp(i, 0, STEPS.length - 1);
    stepRef.current = n;
    stepAtRef.current = performance.now();
    setStep(n);
  };

  const cur = STEPS[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip'} onClick={() => goto(step - 1)}>
          上一步
        </button>
        <button className={'chip'} onClick={() => goto(step + 1)}>
          下一步
        </button>
        <button className={'chip'} onClick={() => goto(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.text}</div>
    </div>
  );
};

export default M32;

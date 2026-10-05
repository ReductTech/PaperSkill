import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawKeyboard,
  drawHand,
  drawPath,
  drawNote,
  drawSceneLabel,
  drawLegend,
  OK,
  BAD,
  EMPH,
  MUTED,
} from './musicKit';
import type { WidgetProps } from './registry';

// P8 结果赛：上方基线、下方本文方法，同时开始。
// 论文对这些任务只给定性对比与成功/失败描述，没有逐任务百分数 —— 所以这里不画任何百分比条、
// 也不写任何数值，只画“过程是否连续、有没有中途停下”。

const W = 1080;
const H = 280;
const RUN_MS = 3800;

const TASKS = ['叠衣服', '清理桌面', '组装盒子', '微波炉'];
const TASK_DESC = [
  '论文描述中，本文方法能连续完成多次折叠，基线则常在中途停下、需要重新尝试。',
  '论文描述中，本文方法能把物品依次清理干净，基线常中途停下或漏掉后续物品。',
  '论文描述中，本文方法能把多步装配连贯做完，基线容易在步骤衔接处中断。',
  '论文描述中，本文方法能连贯完成开门、放入、关门、启动的整个过程，基线往往中途停下。',
];

const KB_X = 60;
const KB_W = 900;
const KEY_N = 18;
const KWW = KB_W / KEY_N;
const kx = (i: number): number => KB_X + i * KWW + (KWW - 2) / 2;

const BASE_KB_Y = 86;
const BASE_PATH_Y = 64;
const OUR_KB_Y = 200;
const OUR_PATH_Y = 178;

const IDLE_TEXT = '选一个任务，按「开始对比」，让基线与本文方法同时开始。';
const DONE_HEAD =
  '论文对这些任务以定性对比与成功/失败描述为主，并未报告逐任务的百分数，因此这里不展示任何具体数值，只看过程是否连续：';

type Phase = 'idle' | 'run' | 'done';

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ phase: Phase; startedAt: number; task: number }>({
    phase: 'idle',
    startedAt: 0,
    task: 0,
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [task, setTask] = useState(0);
  const [feedback, setFeedback] = useState({ text: IDLE_TEXT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 基线：跑到一小半就停下，剩下的路走不完
    const baseProg = (p: number): number => {
      const g = easeOutCubic(clamp(p / 0.34, 0, 1)) * 0.42;
      return p > 0.34 ? 0.42 + 0.004 * Math.sin(p * 120) : g;
    };
    // 本文方法：一路跑到最后
    const ourProg = (p: number): number => easeInOutQuad(clamp(p / 0.9, 0, 1));

    const render = (ts: number) => {
      clearScene(ctx, W, H);
      const s = stateRef.current;
      let p = 0;
      if (s.phase === 'run') {
        p = clamp((ts - s.startedAt) / RUN_MS, 0, 1);
        if (p >= 1) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({ text: DONE_HEAD + TASK_DESC[s.task], cls: 'good' });
        }
      } else if (s.phase === 'done') {
        p = 1;
      }

      const bp = baseProg(p);
      const op = ourProg(p);
      const kBase = clamp(Math.floor(bp * KEY_N), 0, KEY_N - 1);
      const kOur = clamp(Math.floor(op * KEY_N), 0, KEY_N - 1);

      // 基线：走到 kBase 就断掉，后面的路只留一条虚线
      drawKeyboard(ctx, KB_X, BASE_KB_Y, KB_W, 32, KEY_N, p > 0.02 ? [kBase] : [], BAD);
      const bpts: number[][] = [];
      for (let i = 0; i <= kBase; i++) bpts.push([kx(i), BASE_PATH_Y]);
      if (bpts.length > 1) drawPath(ctx, bpts, BAD, 3);
      const rest: number[][] = [];
      for (let i = kBase; i < KEY_N; i++) rest.push([kx(i), BASE_PATH_Y]);
      if (rest.length > 1) drawPath(ctx, rest, MUTED, 2, [6, 6]);
      const bhx = kx(kBase);
      const bhy = BASE_PATH_Y + 10 - (s.phase === 'run' && p < 0.34 ? 4 * Math.sin(p * Math.PI * 10) : 0);
      drawHand(ctx, bhx, bhy, 0.85, BAD);

      // 本文方法：一路走到底
      const opts: number[][] = [];
      for (let i = 0; i <= kOur; i++) opts.push([kx(i), OUR_PATH_Y]);
      if (opts.length > 1) drawPath(ctx, opts, OK, 3);
      const active: number[] = [];
      for (let i = 0; i <= kOur; i++) active.push(i);
      if (p > 0.02) drawKeyboard(ctx, KB_X, OUR_KB_Y, KB_W, 32, KEY_N, active, OK);
      const ohx = kx(kOur);
      const ohy = OUR_PATH_Y + 10 - (s.phase === 'run' ? 4 * Math.sin(p * Math.PI * 10) : 0);
      drawHand(ctx, ohx, ohy, 0.85, OK);

      // 正在冒出来的音
      if (s.phase === 'run') {
        const fr = (p * 9) % 1;
        ctx.globalAlpha = 0.85;
        drawNote(ctx, bhx, 52 - 10 * fr, 6.5, BAD);
        drawNote(ctx, ohx, 166 - 10 * fr, 6.5, OK);
        ctx.globalAlpha = 1;
      }

      // 收尾：上边停在半路，下边走完全程
      if (s.phase === 'done') {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bhx, BASE_PATH_Y, 11, 0, Math.PI * 2);
        ctx.stroke();
        drawPath(
          ctx,
          [
            [bhx - 6, BASE_PATH_Y - 6],
            [bhx + 6, BASE_PATH_Y + 6],
          ],
          BAD,
          3
        );
        drawPath(
          ctx,
          [
            [bhx - 6, BASE_PATH_Y + 6],
            [bhx + 6, BASE_PATH_Y - 6],
          ],
          BAD,
          3
        );
        drawPath(
          ctx,
          [
            [kx(KEY_N - 1) - 16, OUR_PATH_Y + 2],
            [kx(KEY_N - 1) - 4, OUR_PATH_Y + 14],
            [kx(KEY_N - 1) + 20, OUR_PATH_Y - 14],
          ],
          OK,
          5
        );
        drawSceneLabel(ctx, '中途停下', 740, 44, BAD);
        drawSceneLabel(ctx, '流畅完成', 780, 158, OK);
      }

      drawLegend(
        ctx,
        [
          { color: BAD, text: '基线方法' },
          { color: OK, text: '本文方法' },
          { color: EMPH, text: TASKS[s.task] },
        ],
        KB_X,
        36
      );
    };

    const tick = (ts: number) => {
      render(ts);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    stateRef.current.startedAt = performance.now();
    stateRef.current.phase = 'run';
    setPhase('run');
    setFeedback({ text: '正在对比「' + TASKS[task] + '」：上方基线，下方本文方法。', cls: '' });
  };
  const onPick = (i: number) => {
    stateRef.current.task = i;
    setTask(i);
    if (stateRef.current.phase !== 'idle') {
      stateRef.current.startedAt = performance.now();
      stateRef.current.phase = 'run';
      setPhase('run');
      setFeedback({ text: '正在对比「' + TASKS[i] + '」：上方基线，下方本文方法。', cls: '' });
    } else {
      setFeedback({ text: '已选择「' + TASKS[i] + '」。按「开始对比」同时跑基线与本文方法。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (phase === 'run' ? ' selected' : '')} onClick={onStart}>
          开始对比
        </button>
      </div>
      <div className="chip-row">
        {TASKS.map((name, i) => (
          <button key={name} className={'chip' + (i === task ? ' selected' : '')} onClick={() => onPick(i)}>
            {name}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M61;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { clearCrag, OK, EMPH, INK, MUTED, LINE } from './climbkit';
import type { WidgetProps } from './registry';

// m81 — 跨域成绩单：先选赛道，再看结果。
// 条带从 0 跑到论文里验证过的分数；数值以裸数字标在条带端点，协议提示画在底部一行。
// Atari100k 的 EfficientZero 用灰色虚线框单列，标记「协议不同」，不做直接对比。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type Kind = 'ours' | 'base' | 'proto';

interface Row {
  n: string;
  v: number;
  d: string;
  kind: Kind;
}

interface Bench {
  key: string;
  rows: Row[];
  note: string;
  fb: string;
}

const BENCH: Bench[] = [
  {
    key: 'Atari',
    rows: [
      { n: 'Dreamer', v: 830, d: '830', kind: 'ours' },
      { n: 'MuZero', v: 693, d: '693', kind: 'base' },
      { n: 'PPO', v: 180, d: '180', kind: 'base' },
    ],
    note: 'sticky actions · 200M 帧',
    fb: 'gamer 中位数：Dreamer 830% vs MuZero 693% / PPO 180%；协议：sticky actions、200M 帧。',
  },
  {
    key: 'Atari100k',
    rows: [
      { n: 'Dreamer', v: 125, d: '125', kind: 'ours' },
      { n: 'IRIS', v: 105, d: '105', kind: 'base' },
      { n: 'TWM', v: 96, d: '96', kind: 'base' },
      { n: 'EfficientZero', v: 190, d: '190', kind: 'proto' },
    ],
    note: '400K 帧 · 动作重复后 100K 步',
    fb: 'gamer 均值：Dreamer 125% vs IRIS 105% / TWM 96%；EfficientZero 的 190% 改了协议（提前重置关卡），不做直接对比。',
  },
  {
    key: 'ProcGen',
    rows: [
      { n: 'Dreamer', v: 66.01, d: '66.01', kind: 'ours' },
      { n: 'PPG', v: 64.89, d: '64.89', kind: 'base' },
      { n: 'PPO', v: 42.8, d: '42.80', kind: 'base' },
    ],
    note: '50M 步 · hard 难度',
    fb: '归一化均值：Dreamer 66.01 vs PPG 64.89 / PPO 42.80；50M 步、hard 难度。',
  },
  {
    key: 'DMLab',
    rows: [
      { n: 'Dreamer', v: 71.4, d: '71.4', kind: 'ours' },
      { n: 'IMPALA 100M', v: 31.0, d: '31.0', kind: 'base' },
      { n: 'IMPALA 1B', v: 66.3, d: '66.3', kind: 'base' },
      { n: 'PPO', v: 35.9, d: '35.9', kind: 'base' },
    ],
    note: '基线最多拿到 10–100× 数据',
    fb: 'human mean capped：Dreamer 一亿步 71.4% vs IMPALA 一亿步 31.0%、十亿步 66.3%；基线拿了最多 10–100 倍数据。',
  },
  {
    key: 'Minecraft',
    rows: [
      { n: 'Dreamer', v: 9.1, d: '9.1', kind: 'ours' },
      { n: 'IMPALA', v: 7.1, d: '7.1', kind: 'base' },
      { n: 'Rainbow', v: 6.3, d: '6.3', kind: 'base' },
      { n: 'PPO', v: 5.1, d: '5.1', kind: 'base' },
    ],
    note: '100M 步回报 · 钻石仅 0.4% 回合',
    fb: '100M 步回报：Dreamer 9.1 vs IMPALA 7.1 / Rainbow 6.3 / PPO 5.1；钻石只出现在 0.4% 的回合里。',
  },
  {
    key: 'BSuite',
    rows: [
      { n: 'Dreamer', v: 66, d: '66', kind: 'ours' },
      { n: 'Boot DQN', v: 60, d: '60', kind: 'base' },
    ],
    note: '23 环境 · 468 配置',
    fb: '任务均值 66% vs Boot DQN 60%；23 个环境、468 种配置，测的是信用分配与尺度鲁棒性。',
  },
];

const TRACK_X = 200;
const TRACK_W = 730;
const BAR_H = 26;
const GAP = 14;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ bench: number; running: boolean; runStart: number; done: boolean }>({
    bench: 0,
    running: false,
    runStart: 0,
    done: false,
  });
  const [bench, setBench] = useState(0);
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: BENCH[0].fb, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number): void => {
      const s = stateRef.current;
      const b = BENCH[s.bench];
      const rows = b.rows;
      const scale = Math.max(...rows.map((r) => r.v));
      const totalH = rows.length * BAR_H + (rows.length - 1) * GAP;
      const startY = 40 + (160 - totalH) / 2;
      const total = (rows.length - 1) * 180 + 1250;
      if (s.running && now - s.runStart > total) {
        s.running = false;
        s.done = true;
        setRunning(false);
      }

      clearCrag(ctx, W, H);
      ctx.textBaseline = 'alphabetic';

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const y = startY + i * (BAR_H + GAP);
        let anim = s.done ? 1 : 0;
        if (s.running) {
          anim = easeOutCubic(clamp((now - s.runStart - i * 180) / 1200, 0, 1));
        }
        const bw = TRACK_W * (r.v / scale) * anim;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, TRACK_X, y, TRACK_W, BAR_H, 6);
        ctx.fill();
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const color = r.kind === 'ours' ? OK : r.kind === 'base' ? MUTED : '#b9c2cf';
        ctx.fillStyle = color;
        if (bw > 0.5) {
          roundRect(ctx, TRACK_X, y, bw, BAR_H, 6);
          ctx.fill();
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = r.kind === 'ours' ? OK : MUTED;
        ctx.font = '15px ' + FONT;
        ctx.fillText(r.n, 192, y + 18);

        if (r.kind === 'proto') {
          ctx.save();
          ctx.setLineDash([7, 5]);
          ctx.strokeStyle = MUTED;
          ctx.lineWidth = 2;
          roundRect(ctx, TRACK_X, y, Math.max(bw, TRACK_W), BAR_H, 6);
          ctx.stroke();
          ctx.restore();
        }

        if (anim > 0.98) {
          ctx.textAlign = 'left';
          ctx.fillStyle = INK;
          ctx.font = '15px ' + FONT;
          ctx.fillText(r.d, TRACK_X + bw + 10, y + 18);
          if (r.kind === 'proto') {
            ctx.fillStyle = EMPH;
            ctx.fillText('协议不同', TRACK_X + bw + 20 + ctx.measureText(r.d).width, y + 18);
          }
        } else if (r.kind === 'proto') {
          ctx.textAlign = 'left';
          ctx.fillStyle = EMPH;
          ctx.font = '14px ' + FONT;
          ctx.fillText('协议不同', TRACK_X + 10, y + 18);
        }
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = EMPH;
      ctx.font = '15px ' + FONT;
      ctx.fillText('协议：' + b.note, TRACK_X, 236);
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

  const pick = (i: number): void => {
    const s = stateRef.current;
    s.bench = i;
    s.running = false;
    s.done = false;
    setBench(i);
    setRunning(false);
    setFb({ text: BENCH[i].fb, cls: 'good' });
  };

  const onStart = (): void => {
    const s = stateRef.current;
    s.runStart = performance.now();
    s.running = true;
    s.done = false;
    setRunning(true);
    setFb({ text: BENCH[s.bench].fb, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {BENCH.map((b, i) => (
          <button
            key={b.key}
            className={'chip' + (bench === i ? ' selected' : '')}
            onClick={() => pick(i)}
          >
            {b.key}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={'chip' + (running ? ' selected' : '')} onClick={onStart}>
          开始对比
        </button>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default M81;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawLabel,
  drawLegend,
  drawPlate,
  drawSpiceBottle,
  drawKitchenCounter,
} from './letterpressKit';

// chap-5 / 5.1 合盘 — 主导操作 P2 切换数据集 + P4 拖时间轴。
// 左：按「被选频率」上色的字盘；右：照论文图 3 的读法自造的频率面板（示意数据，非图 3 原始数值）。
// 想看到的现象：图 3 的说明是 CIFAR-100 的「任务内」相似度更高 → 同一批字条被反复用；5-datasets 各挑各的。

const WD = 1080;
const HD = 410;
const WA = 560;
const HA = 140;

// 时间轴只走前 5 个任务：图 3 的原话是「Split CIFAR-100 只画前 5 个任务，为了好读」。
const TASKS = 5;

type Ds = 'cifar' | 'five';

/** 池规模与字盘形状：CIFAR-100 系列按 §5.2 取 M = 10；5-datasets 取 M = 20。 */
const POOL: Record<Ds, { m: number; cols: number; rows: number }> = {
  cifar: { m: 10, cols: 5, rows: 2 },
  five: { m: 20, cols: 10, rows: 2 },
};

/** 任务总数：Split CIFAR-100 有 10 个任务（图 3 只展示前 5 个）；5-datasets 就是 5 个。 */
const TOTAL_TASKS: Record<Ds, number> = { cifar: 10, five: 5 };

// freq[ds][t][m] —— 本教程自造的示意数据，不是图 3 的原始数值：
// 某一列越深，说明越多任务都挑了这枚字条。
const FREQ: Record<Ds, number[][]> = {
  cifar: [
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  ],
  five: [
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  ],
};

const LX = 40;
const LW = 600;
const RX = 680;
const RW = 360;
const BAR_H = 320; // 字盘 / 参照面板高

function freqAt(ds: Ds, task: number, m: number): number {
  let c = 0;
  for (let t = 0; t < task; t++) if (FREQ[ds][t][m]) c++;
  return c / task;
}

/** 频率 0→1 映射成暖白→橙。 */
function ramp(v: number): string {
  return lerpColor(LP.bg, LP.accent, clamp(v, 0, 1));
}

interface St {
  ds: Ds;
  task: number;
  anim: number;
}

export const CombineCases: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? WA : WD;
  const H = isAna ? HA : HD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<St>({ ds: 'cifar', task: 1, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [ds, setDs] = useState<Ds>('cifar');
  const [task, setTask] = useState(1);
  const [feedback, setFeedback] = useState({
    text: '切换数据集，再拖动时间轴看第 t 个任务挑了哪些格子（右侧频率面板是示意数据）。',
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

    const renderAna = (s: St, t: number) => {
      const phase = (t / 1400) % 1;
      drawField(ctx, 0, 0, W, H);
      // 上面：两盘不同的菜
      drawPlate(ctx, 120, 40, 30, { withFood: true, foodColor: LP.accent });
      drawPlate(ctx, 440, 40, 30, { withFood: true, foodColor: LP.success });
      drawLabel(ctx, '川菜', 105, 15, { size: 12, weight: 600, color: LP.accent });
      drawLabel(ctx, '粤菜', 425, 15, { size: 12, weight: 600, color: LP.success });
      // 中间：同一个调料架
      const spiceColors = [LP.accent, LP.success, LP.aux, LP.failure, LP.guide];
      const picked1 = Math.floor(phase * 5) % 5;
      const picked2 = (picked1 + 2) % 5;
      for (let i = 0; i < 5; i++) {
        const bx = 180 + i * 45;
        const highlighted = i === picked1 || i === picked2;
        drawSpiceBottle(ctx, bx, 65, 25, 40, {
          color: spiceColors[i],
          highlighted,
        });
      }
      drawKitchenCounter(ctx, 170, 108, 220);
      // 连线：川菜挑左边的调料，粤菜挑右边的调料
      ctx.save();
      ctx.strokeStyle = LP.accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(120, 55);
      ctx.lineTo(180 + picked1 * 45 + 12, 65);
      ctx.stroke();
      ctx.strokeStyle = LP.success;
      ctx.beginPath();
      ctx.moveTo(440, 55);
      ctx.lineTo(180 + picked2 * 45 + 12, 65);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, '同一架调料，各挑各的味', 200, 125, { size: 12, color: LP.muted });
    };

    const drawMiniSheet = (phase: number) => {
      const x = 60 + phase * 320;
      ctx.save();
      ctx.fillStyle = '#fffefb';
      ctx.strokeStyle = LP.guide;
      ctx.lineWidth = LP_LW;
      lpRoundRect(ctx, x, 100, 58, 26, 3, true, true);
      ctx.restore();
    };

    const renderNormal = (s: St) => {
      drawField(ctx, 0, 0, W, H);

      const geo = POOL[s.ds];

      // ---- 左：字盘频率图
      drawLabel(ctx, s.ds === 'cifar' ? 'CIFAR100' : '5 数据集', LX, 34, {
        size: 13,
        color: LP.muted,
      });
      drawTypeCase(ctx, LX, 44, LW, BAR_H, {
        cols: geo.cols,
        rows: geo.rows,
        gap: 8,
        fill: (r, c) => ramp(freqAt(s.ds, s.task, r * geo.cols + c)),
        highlight: [],
      });
      // 两份原稿各自覆盖的格子（用 marker 标出「它们挑的是同一批」）
      const overlay = s.ds === 'cifar' ? [0, 1, 2, 4, 5, 6, 7, 9] : [0, 3, 6, 9, 11, 14, 16, 19];
      overlay.forEach((m, i) => {
        const r = Math.floor(m / geo.cols);
        const c = m % geo.cols;
        const gap = 8;
        const cw = (LW - gap * (geo.cols - 1)) / geo.cols;
        const ch = (BAR_H - gap * (geo.rows - 1)) / geo.rows;
        const cx = LX + c * (cw + gap);
        const cy = 44 + r * (ch + gap);
        ctx.save();
        ctx.strokeStyle = i % 2 === 0 ? LP.guide : LP.aux;
        ctx.lineWidth = LP_LW_EMPH;
        lpRoundRect(ctx, cx + 2, cy + 2, cw - 4, ch - 4, 4, false, true);
        ctx.restore();
      });
      // 当前任务的时间轴标记
      const markX = LX + ((s.task - 0.5) / TASKS) * LW;
      ctx.save();
      ctx.strokeStyle = LP.ink;
      ctx.lineWidth = LP_LW_EMPH;
      ctx.beginPath();
      ctx.moveTo(markX, 36);
      ctx.lineTo(markX, 44);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, `t${s.task}`, clamp(markX - 10, LX, LX + LW - 20), 32, {
        size: 12,
        color: LP.ink,
      });
      drawLegend(
        ctx,
        [
          { label: '选用频次', color: LP.accent },
          { label: '川菜', color: LP.guide },
          { label: '粤菜', color: LP.aux },
        ],
        LX,
        384,
        { size: 12 }
      );
      drawLabel(ctx, s.ds === 'cifar' ? '展示 5/10' : '共 5 个', LX + 340, 384, {
        size: 12,
        color: LP.muted,
      });

      // ---- 右：照论文图 3 的读法自造的面板（示意数据）
      lpRoundRect(ctx, RX, 44, RW, BAR_H, 8, false, true);
      drawLabel(ctx, '图 3 示意', RX + 10, 34, { size: 13, color: LP.muted });
      drawLabel(ctx, '非原始数据', RX + RW - 76, 34, { size: 12, color: LP.muted });
      const pool = POOL[s.ds].m;
      for (let m = 0; m < pool; m++) {
        const v = freqAt(s.ds, s.task, m);
        const bh = Math.max(1, (BAR_H - 40) * v);
        const bw = Math.max(2, (RW - 24) / pool - 3);
        const bx = RX + 12 + m * ((RW - 24) / pool);
        const by = 44 + BAR_H - 12 - bh;
        ctx.save();
        ctx.fillStyle = v > 0.75 ? LP.accent : v > 0 ? LP.guide : LP.light;
        ctx.globalAlpha = v > 0 ? 1 : 0.6;
        ctx.fillRect(bx, by, bw, bh);
        ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(RX + 8, 44 + BAR_H - 12);
      ctx.lineTo(RX + RW - 8, 44 + BAR_H - 12);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, '同一批', RX + 12, 44 + BAR_H - 2, { size: 12, color: LP.muted });
      drawLabel(ctx, '各挑各的', RX + RW - 70, 44 + BAR_H - 2, { size: 12, color: LP.muted });
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (isAna) renderAna(s, t);
      else renderNormal(s);
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
  }, [W, H, isAna]);

  const pickDs = (next: Ds) => {
    stateRef.current = { ...stateRef.current, ds: next };
    setDs(next);
    setFeedback(
      next === 'cifar'
        ? {
            text:
              '图 3 说的是 CIFAR-100 的「任务内」相似度更高（不是任务之间像）：所以 5 个任务把同一批调料翻来覆去地用。' +
              '这里只展示前 5 个任务，Split CIFAR-100 一共 10 个。',
            cls: 'good',
          }
        : { text: '5-datasets 的任务内相似度低，各任务挑的调料几乎没有重叠。', cls: 'good' }
    );
  };

  const dragTask = (v: number) => {
    const next = clamp(Math.round(v), 1, TASKS);
    stateRef.current = { ...stateRef.current, task: next };
    setTask(next);
    setFeedback(
      ds === 'cifar'
        ? {
            text: `第 ${next} 个任务挑的还是那几条：任务内相似度高，prompt 自然被共用（图 3 的读法）。`,
            cls: 'good',
          }
        : {
            text:
              `第 ${next} 个任务换了一批调料：任务越不一样，越该各用各的。` +
              '表 5 的消融也支持这一点——去掉多样化选择，5-datasets 从 81.14 掉到 62.26。',
            cls: '',
          }
    );
  };

  if (isAna) {
    return (
      <div>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
    );
  }

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          数据集 <span className="val">{ds === 'cifar' ? 'CIFAR-100' : '5-datasets'}</span>
        </label>
        <button className={`tiny${ds === 'cifar' ? '' : ' ghost'}`} aria-pressed={ds === 'cifar'} onClick={() => pickDs('cifar')}>
          Split CIFAR-100
        </button>
        <button className={`tiny${ds === 'five' ? '' : ' ghost'}`} aria-pressed={ds === 'five'} onClick={() => pickDs('five')}>
          5-datasets
        </button>
      </div>
      <div className="ctrl">
        <label>
          第 t 个任务 <span className="val">{task}</span>
        </label>
        <input
          type="range"
          min={1}
          max={TASKS}
          step={1}
          value={task}
          aria-label="任务时间轴"
          onChange={(e) => dragTask(Number(e.target.value))}
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="l">任务（展示 / 共）</span>
          <span className="v">{`${TASKS} / ${TOTAL_TASKS[ds]}`}</span>
        </div>
        <div className="metric">
          <span className="l">调料数 M</span>
          <span className="v">{POOL[ds].m}</span>
        </div>
        <div className="metric">
          <span className="l">共享调料</span>
          <span className="v">{ds === 'cifar' ? '多' : '少'}</span>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default CombineCases;

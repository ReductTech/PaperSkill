import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §10.1 module — 32 个示例的结果竞速。
// 一个主导操作：按一次「开始比较」，让本方法与此前最好零/少样本结果
// 在同一基准、同一指标、同一轴上从 0 出发跑一次；芯片切换任务时重置竞速并重标轴。
// 数值与协议来自 Table 1 / Table 2（只使用这些已验证数值）。

const W = 1080;
const H = 280;
const RACE_MS = 2000;

type Task = 'OKVQA' | 'COCO' | 'MSRVTTQA' | 'YouCook2';

interface Result {
  ours: number;
  rival: number;
  metric: string;
  metricShort: string;
  direction: 'higher';
  split: string;
  axisMax: number;
}

const RES: Record<Task, Result> = {
  OKVQA: {
    ours: 57.8,
    rival: 43.3,
    metric: 'top-1 准确率',
    metricShort: 'top-1',
    direction: 'higher',
    split: 'test',
    axisMax: 60,
  },
  COCO: {
    ours: 113.8,
    rival: 32.2,
    metric: 'CIDEr',
    metricShort: 'CIDEr',
    direction: 'higher',
    split: 'test',
    axisMax: 120,
  },
  MSRVTTQA: {
    ours: 31.0,
    rival: 12.2,
    metric: 'top-1 准确率',
    metricShort: 'top-1',
    direction: 'higher',
    split: 'test',
    axisMax: 35,
  },
  YouCook2: {
    ours: 86.8,
    rival: 39.4,
    metric: 'CIDEr',
    metricShort: 'CIDEr',
    direction: 'higher',
    split: 'valid',
    axisMax: 90,
  },
};

const TASKS: Task[] = ['OKVQA', 'COCO', 'MSRVTTQA', 'YouCook2'];

const LIMITS = ['分类偏弱', '会幻觉', '示例敏感'];

type ModState = { task: Task; race: 0 | 1; raceStart: number };
type ModUi = { task: Task; race: 0 | 1; done: boolean };

function easeOutCubic(x: number): number {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<ModState>({ task: 'OKVQA', race: 0, raceStart: 0 });
  const [ui, setUi] = useState<ModUi>({ task: 'OKVQA', race: 0, done: false });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const startRace = (): void => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stateRef.current.race = 1;
    stateRef.current.raceStart = reduce ? performance.now() - RACE_MS - 1000 : performance.now();
    setUi((u) => ({ ...u, race: 1, done: reduce }));
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setUi((u) => ({ ...u, done: true })),
      reduce ? 0 : RACE_MS
    );
  };

  const applyTask = (task: Task): void => {
    stateRef.current.task = task;
    stateRef.current.race = 0;
    stateRef.current.raceStart = 0;
    if (timer.current !== null) window.clearTimeout(timer.current);
    setUi({ task, race: 0, done: false });
  };

  const { ref, ready } = useCanvas<ModState>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const r = RES[s.task];
      const p = s.race === 1 ? easeOutCubic((time - s.raceStart) / RACE_MS) : 0;
      const rivalP = clamp(p / 0.7, 0, 1);
      const oursP = p;

      // 单轴：0 到该任务纵轴上界，两路从同一起点出发
      drawSignalPath(
        ctx,
        [
          [120, 34],
          [120, 150],
        ],
        { active: true, dashed: true }
      );

      const rivalFinal = r.rival / r.axisMax;
      const oursFinal = r.ours / r.axisMax;

      drawLevelMeter(ctx, 120, 60, 900, 28, rivalFinal * rivalP, {
        direction: 'up',
        muted: true,
        axisMax: r.axisMax,
      });
      drawLevelMeter(ctx, 120, 112, 900, 28, oursFinal * oursP, { direction: 'up' });

      if (rivalP >= 1) {
        drawLabel(ctx, String(r.rival), 1035, 56, { color: COLORS.muted, size: 15, align: 'right' });
      }
      if (oursP >= 1) {
        drawLabel(ctx, String(r.ours), 1035, 108, { color: COLORS.good, size: 15, align: 'right' });
        ctx.beginPath();
        ctx.arc(120 + 900 * oursFinal, 126, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.good;
        ctx.fill();
      }

      drawLabel(ctx, '对照', 40, 78, { color: COLORS.muted, size: 15 });
      drawLabel(ctx, '本方法', 40, 130, { color: COLORS.good, size: 15 });
      drawLabel(ctx, r.metricShort, 40, 44, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, r.split, 40, 62, { color: COLORS.muted, size: 13 });

      // 已知边界（完整句子在页面下方）
      drawLabel(ctx, '论文指出的边界', 40, 186, { color: COLORS.muted, size: 13 });
      LIMITS.forEach((text, i) => {
        const x = 60 + i * 340;
        ctx.beginPath();
        ctx.arc(x, 210, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.bad;
        ctx.fill();
        drawLabel(ctx, text, x + 16, 216, { color: COLORS.ink, size: 15 });
      });

    },
    W,
    H,
    stateRef
  );

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((event.clientY - rect.top) * H) / rect.height;
    if (ui.race === 0 && y >= 40 && y <= 150) startRace();
  };

  const r = RES[ui.task];
  const done = ui.done;
  const fb = done
    ? {
        text: `${ui.task}：本方法 ${r.ours}（${r.metric}，${r.split}），此前最好零/少样本 ${r.rival}；两者协议不同，这只是跨论文对比。`,
        cls: 'good',
      }
    : {
        text: '选择任务后按下开始，两条从同一起点出发；表格里写明了各自的指标与划分。',
        cls: '',
      };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label={ready ? '单轴结果竞速' : '加载中'}
      />
      <div className="ctrl">
        <div className="chip-row">
          {TASKS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${t === ui.task ? ' selected' : ''}`}
              aria-pressed={t === ui.task}
              onClick={() => applyTask(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="tiny"
          onClick={startRace}
          disabled={ui.race === 1 && !done}
        >
          {ui.race === 1 && !done ? '比较中…' : done ? '再跑一次' : '开始比较'}
        </button>
        <span className="step-label">
          指标 <b>{r.metric}</b>
        </span>
        <span className="step-label">
          划分 <b>{r.split}</b>
        </span>
        <span className="step-label">
          本方法 <b>{r.ours}</b>
        </span>
        <span className="step-label">
          对照 <b>{r.rival}</b>
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <table className="paper">
        <thead>
          <tr>
            <th>任务</th>
            <th>指标</th>
            <th>划分</th>
            <th>本方法（32 示例，不更新权重）</th>
            <th>对照（此前最好零/少样本）</th>
          </tr>
        </thead>
        <tbody>
          {TASKS.map((t) => {
            const row = RES[t];
            return (
              <tr key={t}>
                <td>{t === ui.task ? <b>{t}</b> : t}</td>
                <td>{row.metric}（越高越好）</td>
                <td>{row.split}</td>
                <td>{row.ours}</td>
                <td>{row.rival}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="note">
        <b>论文自己指出的边界</b>：分类能力仍不如最好的对比学习模型；开放式对话会出现幻觉与无依据猜测；
        上下文学习对示例的选择和顺序敏感，示例变多时推理成本线性上升、收益变差。
      </p>
    </div>
  );
};

export default Ch10Mod1;

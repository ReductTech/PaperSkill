// §9–§10 交互模块：消融对照、更长任务序列、结果赛跑、方法边界。
import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawBox,
  drawNode,
  drawArrow,
  drawCapo,
  bar,
  vbar,
  inset,
  label,
} from './scene';

const W = 1080;
const H = 280;

type Feedback = { text: string; cls: string; color?: string };

function feedbackStyle(f: Feedback): React.CSSProperties | undefined {
  if (!f.color) return undefined;
  return { color: f.color, borderLeftColor: f.color, fontStyle: 'normal' };
}

// 四个模块共用：HiDPI 画布、离屏暂停的循环、卸载时停止并断开观察。
function useCanvasLoop<S>(
  stateRef: React.MutableRefObject<S>,
  render: (ctx: CanvasRenderingContext2D, s: S, time: number) => void,
  onTick?: (s: S, time: number) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const renderRef = useRef(render);
  const tickRef = useRef(onTick);
  renderRef.current = render;
  tickRef.current = onTick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.height = 'auto';

    const tick = (time: number) => {
      tickRef.current?.(stateRef.current, time);
      renderRef.current(ctx, stateRef.current, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [stateRef]);

  return canvasRef;
}

/* ------------------------------------------------------------------ *
 * §9 消融：四枚 chip 切换列高亮与框架示意 —— P4
 * ------------------------------------------------------------------ */

type AblationConfig = 'full' | 'nopred' | 'swap' | 'ft';
type AblationState = { config: AblationConfig };

const ABL_CHIPS: { key: AblationConfig; text: string }[] = [
  { key: 'full', text: '完整框架' },
  { key: 'nopred', text: '去掉预测头' },
  { key: 'swap', text: '交换视图' },
  { key: 'ft', text: '只做微调' },
];

const ABL_FEEDBACK: Record<AblationConfig, Feedback> = {
  full: { text: '去掉任一部件都掉点，完整框架最好。', cls: 'good' },
  nopred: { text: '少了 g，等于把两个空间直接绑住。', cls: 'bad' },
  swap: { text: '交换视图在 BYOL 上掉得最明显。', cls: 'bad' },
  ft: { text: '只做微调时 BYOL 还会不稳定。', cls: 'bad' },
};

// Tab.2 / Tab.6：CIFAR100 class-inc 5 tasks，top-1 ↑，列序 Ours / No pred. / Swap / Fine-tuning。
const ABL_COLS = ['Ours', 'No pred.', 'Swap', 'Fine-tuning'];
const ABL_ROWS: { name: string; v: number[] }[] = [
  { name: 'SimCLR', v: [58.3, 52.6, 49.3, 48.9] },
  { name: 'Barlow', v: [60.4, 57.3, 57.4, 54.3] },
  { name: 'BYOL', v: [62.2, 58.6, 52.0, 52.7] },
];
const ABL_COL_OF: Record<AblationConfig, number> = { full: 0, nopred: 1, swap: 2, ft: 3 };
const ABL_COL_X = [150, 276, 402, 528];
const ABL_ACCENT: Record<AblationConfig, string> = {
  full: C.green,
  nopred: C.red,
  swap: C.red,
  ft: C.orange,
};

const ABL_TITLE: Record<AblationConfig, string> = {
  full: '完整',
  nopred: '无 g',
  swap: '交换',
  ft: '微调',
};

const ABL_Z1 = { x: 690, y: 92, w: 64, h: 30 };
const ABL_Z2 = { x: 690, y: 170, w: 64, h: 30 };
const ABL_B1 = { x: 878, y: 92, w: 64, h: 30 };
const ABL_B2 = { x: 878, y: 170, w: 64, h: 30 };

function drawAblationFrame(
  ctx: CanvasRenderingContext2D,
  cfg: AblationConfig,
  accent: string
): void {
  inset(ctx, 664, 12, 402, 256);
  label(ctx, ABL_TITLE[cfg], 690, 38, 13, accent);

  if (cfg === 'ft') {
    drawNode(ctx, 690, 124, 60, 34, 'f', 'active');
    drawNode(ctx, 790, 124, 60, 34, 'c', 'idle');
    drawNode(ctx, 890, 124, 56, 34, 'y', 'idle');
    drawArrow(ctx, 750, 141, 788, 141, accent, 3);
    drawArrow(ctx, 850, 141, 888, 141, accent, 3);
    return;
  }

  drawNode(ctx, ABL_Z1.x, ABL_Z1.y, ABL_Z1.w, ABL_Z1.h, 'z1', 'active');
  drawNode(ctx, ABL_Z2.x, ABL_Z2.y, ABL_Z2.w, ABL_Z2.h, 'z2', 'active');
  drawNode(ctx, ABL_B1.x, ABL_B1.y, ABL_B1.w, ABL_B1.h, 'z̄1', 'frozen');
  drawNode(ctx, ABL_B2.x, ABL_B2.y, ABL_B2.w, ABL_B2.h, 'z̄2', 'frozen');

  if (cfg !== 'nopred') {
    drawBox(ctx, 782, 126, 44, 30, C.white, C.purple, 8);
    label(ctx, 'g', 804, 141, 14, C.purple, 'center');
  }

  const crossed = cfg === 'swap';
  drawArrow(ctx, 754, 107, 878, crossed ? 185 : 107, accent, 3);
  drawArrow(ctx, 754, 185, 878, crossed ? 107 : 185, accent, 3);

  // 没有 g 时，两条通路被直接绑在一起。
  if (cfg === 'nopred') {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(816, 107);
    ctx.lineTo(816, 185);
    ctx.stroke();
    ctx.restore();
  }
}

export const Ch9Ablation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<AblationState>({ config: 'full' });
  const [config, setConfig] = useState<AblationConfig>('full');
  const [feedback, setFeedback] = useState<Feedback>(ABL_FEEDBACK.full);

  const canvasRef = useCanvasLoop(stateRef, (ctx, s) => {
    clearScene(ctx, W, H);
    inset(ctx, 14, 12, 640, 256);
    const activeCol = ABL_COL_OF[s.config];
    const accent = ABL_ACCENT[s.config];

    ABL_COLS.forEach((c, i) => {
      label(ctx, c, ABL_COL_X[i] + 40, 42, 11, i === activeCol ? accent : C.muted, 'center');
    });

    ABL_ROWS.forEach((r, ri) => {
      const y = 72 + ri * 66;
      label(ctx, r.name, 30, y + 9, 13, C.ink);
      r.v.forEach((v, ci) => {
        bar(
          ctx,
          ABL_COL_X[ci],
          y,
          80,
          18,
          v,
          70,
          ci === activeCol ? accent : C.light,
          v.toFixed(1)
        );
      });
    });

    drawAblationFrame(ctx, s.config, accent);
  });

  const select = (c: AblationConfig) => {
    stateRef.current = { config: c };
    setConfig(c);
    setFeedback(ABL_FEEDBACK[c]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ABL_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip ${config === c.key ? 'selected' : ''}`}
            onClick={() => select(c.key)}
            aria-pressed={config === c.key}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * §9 更长任务序列：拖动移调夹，数据块变短 —— P6
 * ------------------------------------------------------------------ */

type LongerState = { tasks: number };

const TRACK_X0 = 150;
const TRACK_X1 = 930;
const TRACK_Y = 62;

const longerColor = (n: number): string => (n <= 6 ? C.blue : n <= 8 ? C.orange : C.red);

const longerFeedback = (n: number): Feedback => {
  if (n <= 6) return { text: '五个任务时每份数据还算充足。', cls: '', color: C.blue };
  if (n <= 8)
    return { text: '任务变多，每个任务分到的数据变少，SSL 更不稳。', cls: '', color: C.orange };
  return {
    text: '十个任务下 SimCLR 掉得最狠，但 CaSSLe 仍明显优于微调。',
    cls: 'bad',
  };
};

export const Ch9Longer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<LongerState>({ tasks: 5 });
  const draggingRef = useRef(false);
  const [tasks, setTasks] = useState(5);
  const [feedback, setFeedback] = useState<Feedback>(longerFeedback(5));

  const canvasRef = useCanvasLoop(stateRef, (ctx, s) => {
    clearScene(ctx, W, H);
    const n = s.tasks;
    const accent = longerColor(n);

    // 上：横向轨道与任务数据块，纯示意。
    inset(ctx, 14, 10, 1052, 130);
    ctx.save();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(TRACK_X0, TRACK_Y);
    ctx.lineTo(TRACK_X1, TRACK_Y);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const x = TRACK_X0 + (i / 5) * (TRACK_X1 - TRACK_X0);
      ctx.save();
      ctx.strokeStyle = C.light;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, TRACK_Y - 7);
      ctx.lineTo(x, TRACK_Y + 7);
      ctx.stroke();
      ctx.restore();
    }

    const gap = 6;
    const bw = (TRACK_X1 - TRACK_X0 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      drawBox(ctx, TRACK_X0 + i * (bw + gap), 96, bw, 28, accent, undefined, 5);
    }

    const cx = TRACK_X0 + ((n - 5) / 5) * (TRACK_X1 - TRACK_X0);
    drawCapo(ctx, cx - 13, TRACK_Y, 26, accent);

    // 下：Appendix D Tab.D 真实值，不随拖拽变化。
    inset(ctx, 14, 152, 1052, 116);
    label(ctx, '5', 300, 168, 12, C.muted, 'center');
    label(ctx, '10', 670, 168, 12, C.muted, 'center');
    const rows = [
      { name: 'SimCLR', a: 39.3, b: 52.7, y: 184 },
      { name: 'BT', a: 49.9, b: 53.7, y: 222 },
    ];
    for (const r of rows) {
      label(ctx, r.name, 30, r.y + 9, 13, C.ink);
      bar(ctx, 150, r.y, 300, 18, r.a, 60, C.muted, r.a.toFixed(1));
      bar(ctx, 520, r.y, 300, 18, r.b, 60, C.green, r.b.toFixed(1));
    }
  });

  const applyTasks = (n: number) => {
    const v = clamp(Math.round(n), 5, 10);
    if (stateRef.current.tasks === v) return;
    stateRef.current = { tasks: v };
    setTasks(v);
    setFeedback(longerFeedback(v));
  };

  const tasksFromX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 5;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / rect.width);
    return 5 + ((x - TRACK_X0) / (TRACK_X1 - TRACK_X0)) * 5;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    applyTasks(tasksFromX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    applyTasks(tasksFromX(e.clientX));
  };
  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 指针已释放 */
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className="ctrl">
        <label>
          任务数 <span className="val">{tasks}</span>
        </label>
        <input
          type="range"
          min={5}
          max={10}
          step={1}
          value={tasks}
          onChange={(e) => applyTasks(Number(e.target.value))}
          aria-label="任务数"
        />
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * §10 结果赛跑：四条柱从同一基线涨起 —— P8
 * ------------------------------------------------------------------ */

type RaceMetric = 'A' | 'F';
type RaceState = { running: boolean; phase: number; startedAt: number; metric: RaceMetric };

const RACE_NAMES = ['Fine-tuning', 'EWC', 'POD', 'CaSSLe'];
const RACE_A = [52.7, 56.4, 57.9, 62.2];
const RACE_F = [0.1, 0.0, 0.0, 0.0];
const RACE_MAX_A = 75;
const RACE_MAX_F = 1;
const RACE_BASE_Y = 238;
const RACE_MAX_H = 168;
const RACE_X = [140, 360, 580, 800];
const RACE_W = 100;
const OFFLINE = 70.5;

const RACE_INITIAL: Feedback = {
  text: '点开始，看五种做法在同一协议下的分数。',
  cls: '',
};
const RACE_RUNNING: Feedback = {
  text: '四条柱从同一基线涨起，offline 是上界不是参赛者。',
  cls: '',
};

const raceDone = (m: RaceMetric): Feedback =>
  m === 'A'
    ? {
        text: 'CaSSLe 的 top-1 最高；CIFAR100 class-incremental 5 tasks，linear evaluation。',
        cls: 'good',
      }
    : {
        text: 'F 一列大家都接近 0，CIFAR100 上本来就没多少遗忘空间。',
        cls: '',
      };

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<RaceState>({
    running: false,
    phase: 0,
    startedAt: 0,
    metric: 'A',
  });
  const [metric, setMetric] = useState<RaceMetric>('A');
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(RACE_INITIAL);

  const canvasRef = useCanvasLoop(
    stateRef,
    (ctx, s) => {
      clearScene(ctx, W, H);
      const isA = s.metric === 'A';
      const vals = isA ? RACE_A : RACE_F;
      const max = isA ? RACE_MAX_A : RACE_MAX_F;
      const accent = C.green;
      const e = clamp(s.phase, 0, 1);

      label(ctx, isA ? 'A ↑' : 'F ↓', 96, 46, 13, C.muted);

      // 基线
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, RACE_BASE_Y);
      ctx.lineTo(950, RACE_BASE_Y);
      ctx.stroke();
      ctx.restore();

      // offline 上界：只出现在准确率面板，不参与赛跑。
      if (isA) {
        const oy = RACE_BASE_Y - RACE_MAX_H * (OFFLINE / RACE_MAX_A);
        ctx.save();
        ctx.setLineDash([8, 7]);
        ctx.strokeStyle = C.wood;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(110, oy);
        ctx.lineTo(950, oy);
        ctx.stroke();
        ctx.restore();
        label(ctx, 'offline', 958, oy - 16, 12, C.wood);
        label(ctx, '70.5', 958, oy + 2, 13, C.wood);
      }

      for (let i = 0; i < 4; i++) {
        const v = vals[i];
        const fullH = Math.max(2, RACE_MAX_H * (v / max));
        const top = RACE_BASE_Y - fullH;
        const color = i === 3 ? accent : C.muted;

        // 目标轮廓，完成后即为终态高度。
        drawBox(ctx, RACE_X[i], top, RACE_W, fullH, undefined, C.border, 5);
        vbar(ctx, RACE_X[i], RACE_BASE_Y, RACE_W, RACE_MAX_H, v * e, max, color);
      }

      for (let i = 0; i < 4; i++) {
        const v = vals[i];
        const fullH = Math.max(2, RACE_MAX_H * (v / max));
        const cy = RACE_BASE_Y - fullH - 13;
        ctx.save();
        ctx.fillStyle = C.bg;
        ctx.fillRect(RACE_X[i] + RACE_W / 2 - 24, cy - 10, 48, 20);
        ctx.restore();
        label(
          ctx,
          v.toFixed(1),
          RACE_X[i] + RACE_W / 2,
          cy,
          13,
          i === 3 ? accent : C.ink,
          'center'
        );
      }

      for (let i = 0; i < 4; i++) {
        label(ctx, RACE_NAMES[i], RACE_X[i] + RACE_W / 2, 260, 12, i === 3 ? accent : C.muted, 'center');
      }
    },
    (s, time) => {
      if (!s.running) return;
      s.phase = clamp((time - s.startedAt) / 1800, 0, 1);
      if (s.phase >= 1) {
        s.running = false;
        setDone(true);
        setFeedback(raceDone(s.metric));
      }
    }
  );

  const start = () => {
    stateRef.current = {
      running: true,
      phase: 0,
      startedAt: performance.now(),
      metric: stateRef.current.metric,
    };
    setDone(false);
    setFeedback(RACE_RUNNING);
  };

  const chooseMetric = (m: RaceMetric) => {
    const s = stateRef.current;
    stateRef.current = { ...s, metric: m };
    setMetric(m);
    setFeedback(done ? raceDone(m) : s.running ? RACE_RUNNING : RACE_INITIAL);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={start}>
          {done ? '再比一次' : '开始比较'}
        </button>
        <button
          className={`chip ${metric === 'A' ? 'selected' : ''}`}
          onClick={() => chooseMetric('A')}
          aria-pressed={metric === 'A'}
        >
          准确率 A(↑)
        </button>
        <button
          className={`chip ${metric === 'F' ? 'selected' : ''}`}
          onClick={() => chooseMetric('F')}
          aria-pressed={metric === 'F'}
        >
          遗忘 F(↓)
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * §10 方法边界：四张检查卡与同名 chip —— P5
 * ------------------------------------------------------------------ */

type LimitKey = 'boundary' | 'cost' | 'cluster' | 'byol';
type LimitState = { item: LimitKey };

const LIMIT_CHIPS: { key: LimitKey; text: string }[] = [
  { key: 'boundary', text: '任务边界' },
  { key: 'cost', text: '约 +30% 算力' },
  { key: 'cluster', text: '不做聚类' },
  { key: 'byol', text: 'BYOL 例外' },
];

const LIMIT_FEEDBACK: Record<LimitKey, Feedback> = {
  boundary: { text: '论文假设任务边界已知，方法本身不检测边界。', cls: '' },
  cost: {
    text: '多一次冻结前向与一次损失，显存与时间约增加 30%。',
    cls: '',
    color: C.orange,
  },
  cluster: { text: 'CaSSLe 不做聚类，仍需有监督线性分类器或聚类算法才能得到类别。', cls: '' },
  byol: {
    text: '数据增量下 BYOL 的 CaSSLe 73.3 低于微调 74.0，作者推测与动量编码器已携带过去信息有关。',
    cls: 'bad',
  },
};

const LIMIT_KEYS: LimitKey[] = ['boundary', 'cost', 'cluster', 'byol'];
const CARD_X0 = 24;
const CARD_STEP = 258;
const CARD_Y = 16;
const CARD_W = 246;
const CARD_H = 92;

const cardX = (i: number): number => CARD_X0 + i * CARD_STEP;

function drawCheck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  on: boolean,
  color: string
): void {
  drawBox(ctx, x, y, 16, 16, on ? color : C.white, on ? color : C.border, 4);
  if (!on) return;
  ctx.save();
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 8);
  ctx.lineTo(x + 7, y + 12);
  ctx.lineTo(x + 12, y + 4);
  ctx.stroke();
  ctx.restore();
}

export const Ch10Limits: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<LimitState>({ item: 'boundary' });
  const [item, setItem] = useState<LimitKey>('boundary');
  const [feedback, setFeedback] = useState<Feedback>(LIMIT_FEEDBACK.boundary);

  const canvasRef = useCanvasLoop(stateRef, (ctx, s) => {
    clearScene(ctx, W, H);

    LIMIT_CHIPS.forEach((c, i) => {
      const x = cardX(i);
      const on = s.item === c.key;
      if (on) drawBox(ctx, x - 3, CARD_Y - 3, CARD_W + 6, CARD_H + 6, undefined, C.blue, 11);
      drawBox(ctx, x, CARD_Y, CARD_W, CARD_H, C.white, on ? C.blue : C.border, 8);
      drawCheck(ctx, x + 16, CARD_Y + 16, on, C.blue);
      label(ctx, c.text, x + 42, CARD_Y + 25, 14, on ? C.blue : C.ink);
    });

    inset(ctx, 24, 120, 1020, 146);

    if (s.item === 'boundary') {
      drawBox(ctx, 70, 150, 170, 56, C.white, C.blue, 8);
      drawBox(ctx, 300, 150, 170, 56, C.white, C.blue, 8);
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(270, 140);
      ctx.lineTo(270, 216);
      ctx.stroke();
      ctx.restore();
      label(ctx, '边界已知', 520, 178, 18, C.blue);
    } else if (s.item === 'cost') {
      label(ctx, '+30%', 70, 166, 28, C.orange);
      drawBox(ctx, 260, 150, 160, 18, C.light, undefined, 4);
      drawBox(ctx, 260, 186, 208, 18, C.orange, undefined, 4);
      label(ctx, '算力', 70, 214, 13, C.muted);
    } else if (s.item === 'cluster') {
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.fillStyle = C.purple;
        ctx.beginPath();
        ctx.arc(100 + i * 40, 178, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      label(ctx, '需分类器', 260, 178, 18, C.ink);
    } else {
      label(ctx, 'FT', 62, 165, 12, C.muted);
      bar(ctx, 120, 156, 300, 16, 74.0, 80, C.muted, '74.0');
      label(ctx, 'CaSSLe', 50, 205, 12, C.red);
      bar(ctx, 120, 196, 300, 16, 73.3, 80, C.red, '73.3');
    }
  });

  const select = (k: LimitKey) => {
    stateRef.current = { item: k };
    setItem(k);
    setFeedback(LIMIT_FEEDBACK[k]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    LIMIT_KEYS.forEach((k, i) => {
      if (x >= cardX(i) && x <= cardX(i) + CARD_W && y >= CARD_Y && y <= CARD_Y + CARD_H) {
        select(k);
      }
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {LIMIT_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip ${item === c.key ? 'selected' : ''}`}
            onClick={() => select(c.key)}
            aria-pressed={item === c.key}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

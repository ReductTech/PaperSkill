import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawArrow,
  drawBox,
  drawNode,
  bar,
  label,
  inset,
} from './scene';
import type { NodeState } from './scene';

const W = 1080;
const H = 280;

// 条形比例刻度，仅用于绘图，不作为结果显示。
const BAR_MAX = 70;

// Canvas 点击换算：窄屏由 CSS 等比缩放，用 1080 / rect.width 还原逻辑坐标。
function toLocal(clientX: number, clientY: number, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (W / rect.width),
    y: (clientY - rect.top) * (H / rect.height),
  };
}

interface NodeSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  state: NodeState;
}

function paintNodes(ctx: CanvasRenderingContext2D, specs: NodeSpec[]): void {
  for (const n of specs) {
    drawNode(ctx, n.x, n.y, n.w, n.h, n.text, n.state);
  }
}

// 沿活动路径缓慢移动的点，使 rAF 循环可见；坐标只由 state 与 time 决定。
function travelDot(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  time: number
): void {
  const p = (time % 2800) / 2800;
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  drawBox(ctx, x - 3, y - 3, 6, 6, color, undefined, 3);
}

// 四个模块共用：HiDPI 画布、离屏暂停的 rAF 循环、卸载时停止并断开观察。
function useCanvasLoop<S>(
  stateRef: React.MutableRefObject<S>,
  render: (ctx: CanvasRenderingContext2D, s: S, time: number) => void,
  onPick?: (x: number, y: number) => void
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

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
      render(ctx, stateRef.current, time);
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
    const onClick = (e: MouseEvent) => {
      const fn = pickRef.current;
      if (!fn) return;
      const p = toLocal(e.clientX, e.clientY, canvas);
      fn(p.x, p.y);
    };
    canvas.addEventListener('click', onClick);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
  }, [stateRef, render]);

  return canvasRef;
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  opacity: disabled ? 0.45 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

/* ------------------------------------------------------------------ §4 */

type FreezeState = { step: number };

const FREEZE_FEEDBACK = [
  '旧模型被复制并冻结，之后不再更新。',
  '当前编码器从增强视图得到 z。',
  '冻结支路产出 z̄，并从计算图断开。',
  'g(z) 与 z̄ 送入同一个损失，梯度只走蓝色与绿色支路。',
];

const F_NODES = {
  x: { x: 30, y: 112, w: 120, h: 56, text: '图像 x' },
  enc: { x: 210, y: 44, w: 170, h: 56, text: '当前编码器 f^t' },
  g: { x: 470, y: 44, w: 120, h: 56, text: '预测头 g' },
  frozen: { x: 210, y: 180, w: 170, h: 56, text: '冻结编码器 f^{t-1}' },
  loss: { x: 860, y: 112, w: 160, h: 56, text: '损失 L_SSL' },
};

function renderFreeze(ctx: CanvasRenderingContext2D, s: FreezeState, time: number): void {
  clearScene(ctx, W, H);
  const step = s.step;
  const idle = C.border;

  // 复制支路：按下定格键。
  drawArrow(ctx, 295, 100, 295, 180, step === 1 ? C.blue : idle, step === 1 ? 3 : 2);
  // 当前支路。
  drawArrow(ctx, 150, 126, 208, 76, step >= 2 ? C.blue : idle, step >= 2 ? 3 : 2);
  drawArrow(
    ctx, 380, 72, 470, 72,
    step >= 4 ? C.green : step >= 2 ? C.blue : idle,
    step >= 2 ? 3 : 2
  );
  drawArrow(ctx, 590, 72, 860, 126, step >= 4 ? C.green : idle, step >= 4 ? 3 : 2);
  // 冻结支路，断点之后不再有梯度。
  const lower1 = step >= 3 && step < 4 ? C.blue : step >= 4 ? C.muted : idle;
  drawArrow(ctx, 150, 154, 208, 204, lower1, step >= 3 && step < 4 ? 3 : 2);
  drawArrow(ctx, 380, 208, 548, 208, lower1, step >= 3 && step < 4 ? 3 : 2);
  drawArrow(ctx, 576, 208, 860, 154, step >= 4 ? C.muted : idle, 2);

  if (step >= 3) {
    ctx.save();
    ctx.fillStyle = C.muted;
    ctx.fillRect(548, 205, 28, 6);
    ctx.restore();
  }

  paintNodes(ctx, [
    { ...F_NODES.x, state: step >= 2 ? 'active' : 'idle' },
    { ...F_NODES.enc, state: step >= 2 ? 'active' : 'idle' },
    { ...F_NODES.g, state: step >= 4 ? 'success' : 'idle' },
    { ...F_NODES.frozen, state: 'frozen' },
    { ...F_NODES.loss, state: step >= 4 ? 'success' : 'idle' },
  ]);

  if (step >= 2) label(ctx, 'z', 425, 54, 13, C.ink, 'center');
  if (step >= 3) label(ctx, 'z̄', 470, 232, 13, C.ink, 'center');

  if (step === 1) travelDot(ctx, 295, 100, 295, 180, C.blue, time);
  else if (step === 2) travelDot(ctx, 380, 72, 470, 72, C.blue, time);
  else if (step === 3) travelDot(ctx, 380, 208, 548, 208, C.blue, time);
  else travelDot(ctx, 590, 72, 860, 126, C.green, time);
}

export const Ch4Freeze: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<FreezeState>({ step: 1 });
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: FREEZE_FEEDBACK[0], cls: '' });
  const canvasRef = useCanvasLoop(stateRef, renderFreeze);

  const apply = (n: number) => {
    const v = clamp(n, 1, 4);
    stateRef.current = { step: v };
    setStep(v);
    setFeedback({ text: FREEZE_FEEDBACK[v - 1], cls: v === 4 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <span className="step-label">进度 <b>{step} / 4</b></span>
        <button className="chip" onClick={() => apply(step - 1)} disabled={step === 1} style={btnStyle(step === 1)}>上一步</button>
        <button className="chip" onClick={() => apply(step + 1)} disabled={step === 4} style={btnStyle(step === 4)}>下一步</button>
        <button className="chip" onClick={() => apply(1)}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ §5 */

type LossMode = 'same' | 'other' | 'weight';
type LossState = { mode: LossMode; w: number };

const LOSS_CHIPS: { key: LossMode; text: string }[] = [
  { key: 'same', text: '沿用本方法损失' },
  { key: 'other', text: '换一种损失' },
  { key: 'weight', text: '额外加权重 w' },
];

const LOSS_FEEDBACK: Record<LossMode, { text: string; cls: string; style?: React.CSSProperties }> = {
  same: { text: '同一损失换一对输入，无需为新目标设计目标函数。', cls: 'good' },
  other: {
    text: '蒸馏目标与本方法目标不一致，数值也不占优。',
    cls: '',
    style: { color: C.orange, borderLeftColor: C.orange },
  },
  weight: { text: '多出一个要调的系数，论文明确没有使用它。', cls: 'bad' },
};

// Appendix D Tab.F：CIFAR100 class-inc 2 tasks，top-1，列序 InfoNCE / 互相关 / MSE。
const LOSS_VALUES = [
  ['61.8', '60.1', '61.3'],
  ['64.5', '67.2', '64.6'],
  ['64.8', '65.8', '66.7'],
];
const LOSS_ROWS = ['SimCLR', 'BT', 'BYOL'];
const LOSS_COLS = ['InfoNCE', '互相关', 'MSE'];
const LOSS_COL_X = [190, 470, 750];
const LOSS_MODE_COL: Record<LossMode, number> = { same: 0, other: 1, weight: 2 };

function renderLoss(ctx: CanvasRenderingContext2D, s: LossState, time: number): void {
  clearScene(ctx, W, H);
  const { mode, w } = s;

  // 上区：两条示意下降曲线，不标任何数值。
  inset(ctx, 30, 14, 1020, 116);
  const x0 = 60;
  const x1 = 1020;
  const topY = 34;
  const botY = 120;
  const value = (kind: 'ssl' | 'ld', t: number) => {
    let v = 1 - 0.72 * t;
    if (mode === 'other' && kind === 'ld') v += 0.17 * Math.sin(t * Math.PI * 3);
    if (mode === 'weight' && kind === 'ld') v += 0.1 + 0.22 * w;
    return clamp(v, 0.05, 1.05);
  };
  const yOf = (v: number) => botY - (botY - topY) * v;
  const ldColor = mode === 'same' ? C.green : C.orange;
  const drawCurve = (kind: 'ssl' | 'ld', color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const px = x0 + (x1 - x0) * t;
      const py = yOf(value(kind, t));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  };
  drawCurve('ssl', C.blue);
  drawCurve('ld', ldColor);

  const p = (time % 2800) / 2800;
  drawBox(ctx, x0 + (x1 - x0) * p - 3, yOf(value('ld', p)) - 3, 6, 6, ldColor, undefined, 3);
  label(ctx, 'L_SSL', 70, 24, 13, C.blue);
  label(ctx, 'L_D', 150, 24, 13, ldColor);

  if (mode === 'weight') {
    const pulse = 0.5 + 0.5 * Math.sin(time / 420);
    const r = 10 + pulse * 3;
    drawBox(ctx, 760 - r, 62 - r, r * 2, r * 2, C.orange, undefined, 10);
    label(ctx, 'w', 760, 62, 13, C.white, 'center');
  }

  // 下区：固定真实值，只写裸数字；列为标识符。
  inset(ctx, 30, 138, 1020, 132);
  const activeCol = LOSS_MODE_COL[mode];
  const activeColor = mode === 'same' ? C.green : C.orange;
  for (let c = 0; c < 3; c++) {
    label(ctx, LOSS_COLS[c], LOSS_COL_X[c] + 85, 156, 12, c === activeCol ? activeColor : C.muted, 'center');
  }
  for (let r = 0; r < 3; r++) {
    const by = 176 + r * 36;
    label(ctx, LOSS_ROWS[r], 48, by + 9, 13, C.ink);
    for (let c = 0; c < 3; c++) {
      const v = LOSS_VALUES[r][c];
      bar(ctx, LOSS_COL_X[c], by, 170, 18, Number(v), BAR_MAX, c === activeCol ? activeColor : C.light, v);
    }
  }
}

export const Ch5Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<LossState>({ mode: 'same', w: 0.5 });
  const [mode, setMode] = useState<LossMode>('same');
  const [w, setW] = useState(0.5);
  const [feedback, setFeedback] = useState(LOSS_FEEDBACK.same);

  const select = (m: LossMode) => {
    stateRef.current = { ...stateRef.current, mode: m };
    setMode(m);
    setFeedback(LOSS_FEEDBACK[m]);
  };
  const onW = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current = { ...stateRef.current, w: v };
    setW(v);
  };
  const canvasRef = useCanvasLoop(stateRef, renderLoss, (x, y) => {
    if (y < 138) return;
    const col = x < 450 ? 0 : x < 730 ? 1 : 2;
    select(col === 0 ? 'same' : col === 1 ? 'other' : 'weight');
  });
  const weightMode = mode === 'weight';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {LOSS_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip${mode === c.key ? ' selected' : ''}`}
            onClick={() => select(c.key)}
            aria-pressed={mode === c.key}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>权重 w <span className="val">{w.toFixed(2)}</span></label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(w * 100)}
          disabled={!weightMode}
          onChange={onW}
        />
        {!weightMode && <span style={{ color: C.muted }}>该模式没有权重参数</span>}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedback.style}>{feedback.text}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ §6.1 */

type StepState = { step: number };

const STEP_FEEDBACK = [
  '两张增强视图就绪。',
  '当前编码器给出两个表征，先算本来的 SSL 损失。',
  '冻结编码器给出两个旧表征，不参与梯度。',
  '预测头把新表征投回旧空间，再算一次同一个损失。',
  '两项直接相加，没有系数。',
];

const STEP_CODE: [string, string][] = [
  ['x1, x2', 'aug'],
  ['z1, z2', 'L_SSL'],
  ['z̄1, z̄2', 'detach'],
  ['g(z)', 'L_SSL'],
  ['L_SSL', '+ L_D'],
];

const S_NODES = {
  x1: { x: 510, y: 44, w: 110, h: 38, text: 'x1' },
  x2: { x: 510, y: 96, w: 110, h: 38, text: 'x2' },
  z1: { x: 650, y: 44, w: 110, h: 38, text: 'z1' },
  z2: { x: 650, y: 96, w: 110, h: 38, text: 'z2' },
  gz1: { x: 790, y: 44, w: 110, h: 38, text: 'g(z1)' },
  gz2: { x: 790, y: 96, w: 110, h: 38, text: 'g(z2)' },
  zb1: { x: 650, y: 176, w: 110, h: 38, text: 'z̄1' },
  zb2: { x: 790, y: 176, w: 110, h: 38, text: 'z̄2' },
};

function renderStep(ctx: CanvasRenderingContext2D, s: StepState, time: number): void {
  clearScene(ctx, W, H);
  const step = s.step;
  const done = step >= 5;
  const flow = done ? C.green : C.blue;

  // 左：当前活跃的两行等宽短文字。
  inset(ctx, 20, 14, 450, 252);
  const [l1, l2] = STEP_CODE[step - 1];
  label(ctx, l1, 44, 110, 16, done ? C.green : C.ink);
  label(ctx, l2, 44, 150, 16, done ? C.green : C.muted);
  drawBox(ctx, 44, 70, 30 * step, 6, flow, undefined, 3);
  const p = (time % 2800) / 2800;
  drawBox(ctx, 44 + p * 380, 56, 8, 8, flow, undefined, 4);

  // 右：张量流与汇入的加号。
  inset(ctx, 490, 14, 570, 252);
  if (step >= 2) {
    drawArrow(ctx, 620, 63, 648, 63, flow, 3);
    drawArrow(ctx, 620, 115, 648, 115, flow, 3);
  }
  if (step >= 4) {
    drawArrow(ctx, 760, 63, 788, 63, flow, 3);
    drawArrow(ctx, 760, 115, 788, 115, flow, 3);
  }
  if (step >= 3) {
    drawArrow(ctx, 565, 134, 565, 174, C.muted, 2);
    drawArrow(ctx, 565, 195, 648, 195, C.muted, 2);
    ctx.save();
    ctx.fillStyle = C.muted;
    ctx.fillRect(553, 158, 24, 6);
    ctx.restore();
  }
  if (step >= 5) {
    drawArrow(ctx, 900, 63, 956, 122, C.green, 3);
    drawArrow(ctx, 900, 195, 956, 138, C.green, 3);
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(958, 130);
    ctx.lineTo(982, 130);
    ctx.moveTo(970, 118);
    ctx.lineTo(970, 142);
    ctx.stroke();
    ctx.restore();
  }

  const specs: NodeSpec[] = [];
  const push = (n: Omit<NodeSpec, 'state'>, at: number) => {
    if (step >= at) specs.push({ ...n, state: done ? 'success' : 'active' });
  };
  push(S_NODES.x1, 1);
  push(S_NODES.x2, 1);
  push(S_NODES.z1, 2);
  push(S_NODES.z2, 2);
  push(S_NODES.gz1, 4);
  push(S_NODES.gz2, 4);
  if (step >= 3) {
    specs.push({ ...S_NODES.zb1, state: 'frozen' });
    specs.push({ ...S_NODES.zb2, state: 'frozen' });
  }
  paintNodes(ctx, specs);
}

export const Ch6Step: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<StepState>({ step: 1 });
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: STEP_FEEDBACK[0], cls: '' });
  const canvasRef = useCanvasLoop(stateRef, renderStep);

  const apply = (n: number) => {
    const v = clamp(n, 1, 5);
    stateRef.current = { step: v };
    setStep(v);
    setFeedback({ text: STEP_FEEDBACK[v - 1], cls: v === 5 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <span className="step-label">进度 <b>{step} / 5</b></span>
        <button className="chip" onClick={() => apply(step - 1)} disabled={step === 1} style={btnStyle(step === 1)}>上一步</button>
        <button className="chip" onClick={() => apply(step + 1)} disabled={step === 5} style={btnStyle(step === 5)}>下一步</button>
        <button className="chip" onClick={() => apply(1)}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ §6.2 */

type SwapVariant = 'ours' | 'swap' | 'nopred';
type SwapState = { variant: SwapVariant; playStart: number | null };

const SWAP_CHIPS: { key: SwapVariant; text: string }[] = [
  { key: 'ours', text: '不交换（本文）' },
  { key: 'swap', text: '交换视图' },
  { key: 'nopred', text: '去掉预测头' },
];

const SWAP_FEEDBACK: Record<SwapVariant, { text: string; cls: string }> = {
  ours: { text: '不交换且保留预测头，三种方法都最好。', cls: 'good' },
  swap: { text: '交叉对齐反而变差；论文认为冻结编码器对当前任务并不具备不变性。', cls: 'bad' },
  nopred: { text: '没有 g 就只能强行拉近两个空间，可塑性受限。', cls: 'bad' },
};

// Tab.6：CIFAR100 class-inc 5 tasks，top-1，列序 Swap / No pred. / Ours。
const SWAP_VALUES = [
  ['49.3', '52.6', '58.3'],
  ['57.4', '57.3', '60.4'],
  ['52.0', '58.6', '62.2'],
];
const SWAP_ROWS = ['SimCLR', 'BT', 'BYOL'];
const SWAP_COLS = ['Swap', 'No pred.', 'Ours'];
const SWAP_COL_X = [190, 470, 750];
const SWAP_COL_OF: Record<SwapVariant, number> = { ours: 2, swap: 0, nopred: 1 };
const COL_VARIANT: SwapVariant[] = ['swap', 'nopred', 'ours'];

const SW_NODES = {
  z1: { x: 150, y: 51, w: 110, h: 38, text: 'z1' },
  z2: { x: 150, y: 96, w: 110, h: 38, text: 'z2' },
  zb1: { x: 860, y: 51, w: 110, h: 38, text: 'z̄1' },
  zb2: { x: 860, y: 96, w: 110, h: 38, text: 'z̄2' },
};

function renderSwap(ctx: CanvasRenderingContext2D, s: SwapState, time: number): void {
  clearScene(ctx, W, H);
  const { variant } = s;
  const phase = s.playStart === null ? 1 : clamp((time - s.playStart) / 2600, 0, 1);
  const e = 1 - Math.pow(1 - phase, 3);
  const good = variant === 'ours';
  const lineColor = good ? C.green : C.red;

  // 上区：当前表征到冻结表征的两条连线。
  inset(ctx, 30, 10, 1020, 126);
  if (variant !== 'nopred') {
    drawBox(ctx, 480, 14, 110, 30, C.white, C.purple, 8);
    label(ctx, 'g', 535, 29, 14, C.purple, 'center');
  }
  paintNodes(ctx, [
    { ...SW_NODES.z1, state: 'active' },
    { ...SW_NODES.z2, state: 'active' },
    { ...SW_NODES.zb1, state: 'frozen' },
    { ...SW_NODES.zb2, state: 'frozen' },
  ]);
  const link = (sx: number, sy: number, ex: number, ey: number) => {
    drawArrow(ctx, sx, sy, sx + (ex - sx) * e, sy + (ey - sy) * e, lineColor, 3);
  };
  if (variant === 'swap') {
    link(260, 70, 860, 115);
    link(260, 115, 860, 70);
  } else {
    link(260, 70, 860, 70);
    link(260, 115, 860, 115);
  }

  // 下区：固定真实值，当前 chip 对应列高亮。
  inset(ctx, 30, 145, 1020, 125);
  const activeCol = SWAP_COL_OF[variant];
  const activeColor = good ? C.green : C.red;
  for (let c = 0; c < 3; c++) {
    label(ctx, SWAP_COLS[c], SWAP_COL_X[c] + 85, 162, 12, c === activeCol ? activeColor : C.muted, 'center');
  }
  for (let r = 0; r < 3; r++) {
    const by = 182 + r * 36;
    label(ctx, SWAP_ROWS[r], 48, by + 8, 13, C.ink);
    for (let c = 0; c < 3; c++) {
      const v = SWAP_VALUES[r][c];
      bar(ctx, SWAP_COL_X[c], by, 170, 16, Number(v), BAR_MAX, c === activeCol ? activeColor : C.light, v);
    }
  }
}

export const Ch6Swap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<SwapState>({ variant: 'ours', playStart: null });
  const [variant, setVariant] = useState<SwapVariant>('ours');
  const [feedback, setFeedback] = useState(SWAP_FEEDBACK.ours);

  const select = (v: SwapVariant) => {
    stateRef.current = { variant: v, playStart: null };
    setVariant(v);
    setFeedback(SWAP_FEEDBACK[v]);
  };
  const play = () => {
    stateRef.current = { ...stateRef.current, playStart: performance.now() };
  };
  const canvasRef = useCanvasLoop(stateRef, renderSwap, (x, y) => {
    if (y < 145) return;
    const col = x < 450 ? 0 : x < 730 ? 1 : 2;
    select(COL_VARIANT[col]);
  });

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {SWAP_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip${variant === c.key ? ' selected' : ''}`}
            onClick={() => select(c.key)}
            aria-pressed={variant === c.key}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className="chip" onClick={play}>播放对齐过程</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

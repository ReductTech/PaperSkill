import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { C, clear, label, legend, paper, swatch, dot, bars, axis, well, arrow, frozenMark, polyline, track } from './wcKit';
import type { Ctx } from './wcKit';
import type { WidgetProps } from './registry';

function useCanvas(W: number, H: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    cv.classList.add('is-ready');
  }, [W, H]);
  return ref;
}

function begin(cv: HTMLCanvasElement, W: number, H: number): Ctx | null {
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clear(ctx, W, H);
  return ctx;
}

const EXPERT_COLORS = [C.blue, C.orange, C.green, C.purple, C.dark, C.light, C.muted, C.route];

// ===========================================================================
// 7.1  三种激活组合（P4 模式芯片，对应论文 Figure 3）
// ===========================================================================
const W1 = 1080;
const H1 = 320;

// mode: 0 = 两名专家都训练，1 = 一新一旧（混合），2 = 两名都冻结只训路由器
const MODES = ['都训练', '混合', '都冻结'];
const MODE_KEEP = [82.0, 85.0, NaN]; // Last（%）；“都冻结”未在论文中给出完整指标
const MODE_ADAPT = [0.9, 0.68, 0.32];

export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W1, H1);
  const [mode, setMode] = useState(1);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W1, H1);
    if (!ctx) return;
    const trainA = mode === 0 || mode === 1;
    const trainB = mode === 0;
    const experts = [
      { x: 90, y: 66, name: '专家 i', train: trainA, color: EXPERT_COLORS[0] },
      { x: 470, y: 66, name: '专家 j', train: trainB, color: EXPERT_COLORS[1] },
    ];
    experts.forEach((ex) => {
      paper(ctx, ex.x, ex.y, 220, 130);
      swatch(ctx, ex.x + 16, ex.y + 36, 188, 78, ex.color, ex.train ? 0.92 : 0.32);
      label(ctx, ex.name, ex.x + 110, ex.y + 20, C.ink, 15, 'center');
      ctx.strokeStyle = ex.train ? C.orange : C.blue;
      ctx.lineWidth = 3;
      ctx.strokeRect(ex.x + 1.5, ex.y + 1.5, 217, 127);
      if (!ex.train) frozenMark(ctx, ex.x + 190, ex.y + 52, 9);
    });
    // 路由器
    paper(ctx, 90, 232, 600, 60);
    ctx.strokeStyle = mode === 2 ? C.orange : C.muted;
    ctx.lineWidth = mode === 2 ? 3 : 2;
    ctx.strokeRect(91, 233, 598, 58);
    label(ctx, '路由器 t', 390, 262, mode === 2 ? C.orange : C.ink, 16, 'center');
    arrow(ctx, 200, 232, 200, 198, C.blue, 2.5);
    arrow(ctx, 580, 232, 580, 198, C.blue, 2.5);
    // 指标
    paper(ctx, 740, 66, 300, 226);
    label(ctx, '保持度', 764, 100, C.green, 15);
    track(ctx, 764, 110, 190, 16, clamp(MODE_KEEP[mode] / 100 || 0, 0, 1), mode === 1 ? C.green : C.red);
    label(ctx, mode === 2 ? '—' : MODE_KEEP[mode].toFixed(1), 1020, 118, C.ink, 16, 'right');
    label(ctx, '适应度', 764, 190, C.blue, 15);
    track(ctx, 764, 200, 190, 16, MODE_ADAPT[mode], mode === 1 ? C.green : C.muted);
    label(ctx, MODE_ADAPT[mode].toFixed(2), 1020, 208, C.ink, 16, 'right');
    legend(ctx, [{ color: C.orange, text: '可训练' }, { color: C.blue, text: '已冻结' }], 90, 306);
    ctx.restore();
  }, [mode, ref]);

  const fb = [
    '两名被激活的专家都可训练：新任务学得快，但旧任务用过的专家被改写，Last 只有 82.0。',
    '混合：新任务用到的专家可训练，旧任务用过的专家被冻结，二者协作，Last 升到 85.0。',
    '两名专家都冻结、只训练路由器：旧知识完全不动，但新任务几乎无法适应（论文未给出该组合的完整指标）。',
  ][mode];
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W1} height={H1} />
      <div className="chip-row">
        {MODES.map((m, i) => (
          <button key={m} className={`chip ${mode === i ? 'selected' : ''}`} onClick={() => setMode(i)}>
            {m}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 1 ? 'good' : mode === 2 ? 'bad' : ''}`}>{fb}</div>
    </div>
  );
};

// ===========================================================================
// 7.2  增量激活—冻结的逐步演化（P2 分步可视化）
// ===========================================================================
const W2 = 1080;
const H2 = 300;
const TOTAL_TASKS = 11;

function activation(task: number): number[] {
  return [(task * 3) % 8, (task * 3 + 2) % 8];
}

export const Mod72: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W2, H2);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W2, H2);
    if (!ctx) return;
    const current = step - 1;
    const frozen = new Set<number>();
    for (let t = 0; t < current; t += 1) activation(t).forEach((e) => frozen.add(e));
    const active = new Set(activation(current));
    label(ctx, '共享专家池', 46, 42, C.ink, 16);
    for (let i = 0; i < 8; i += 1) {
      const isFrozen = frozen.has(i);
      const isActive = active.has(i);
      const x = 60 + i * 76;
      paper(ctx, x, 66, 60, 104);
      swatch(ctx, x + 10, 88, 40, 60, EXPERT_COLORS[i], isFrozen ? 0.28 : isActive ? 1 : 0.5);
      ctx.strokeStyle = isFrozen ? C.blue : isActive ? C.orange : C.border;
      ctx.lineWidth = isFrozen || isActive ? 3 : 1.5;
      ctx.strokeRect(x + 1.5, 67.5, 57, 101);
      if (isFrozen) frozenMark(ctx, x + 30, 152, 8);
      label(ctx, String(i + 1), x + 30, 78, C.muted, 12, 'center');
    }
    // 路由器轨迹
    paper(ctx, 700, 66, 340, 198);
    label(ctx, '任务序列', 724, 96, C.ink, 15);
    for (let t = 0; t < TOTAL_TASKS; t += 1) {
      const x = 724 + t * 28;
      const done = t < current;
      const now = t === current;
      swatch(ctx, x, 118, 20, 44, done ? C.blue : now ? C.orange : C.border, done || now ? 0.95 : 1);
      label(ctx, String(t + 1), x + 10, 180, now ? C.orange : C.muted, 12, 'center');
    }
    label(ctx, `${step} / ${TOTAL_TASKS}`, 1016, 96, C.blue, 20, 'right');
    legend(
      ctx,
      [
        { color: C.blue, text: '已冻结' },
        { color: C.orange, text: '当前任务激活' },
        { color: C.border, text: '仍未使用' },
      ],
      60,
      288
    );
    ctx.restore();
  }, [step, ref]);

  const cur = step - 1;
  const frozenBefore = new Set<number>();
  for (let t = 0; t < cur; t += 1) activation(t).forEach((e) => frozenBefore.add(e));
  const act = activation(cur);
  const fb =
    step === 1
      ? '任务 1：没有任何专家被冻结，路由器 1 自由唤醒 2 个新专家。'
      : step === TOTAL_TASKS
      ? '任务 11：前十个任务用过的专家都已随训练结束被封存，路由器 11 让新专家与这些冻结专家协作。'
      : `任务 ${step} 训练中：路由器 ${step} 激活专家 ${act[0] + 1}、${act[1] + 1}；此前任务用过的 ${frozenBefore.size} 个专家保持冻结。`;
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W2} height={H2} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          ← 上一步
        </button>
        <span className="step-label">
          任务 <b>{step}</b> / {TOTAL_TASKS}
        </span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(TOTAL_TASKS, s + 1))} disabled={step === TOTAL_TASKS}>
          下一步 →
        </button>
        <button className="tiny" onClick={() => setStep(1)}>
          重置
        </button>
      </div>
      <div className="feedback">{fb}</div>
    </div>
  );
};

// ===========================================================================
// 8.1  MoE-Adapter 在 Transformer 块中的位置（P5 可点击热点）
// ===========================================================================
const W3 = 1080;
const H3 = 400;

interface Node { id: string; x: number; y: number; w: number; h: number; name: string; detail: string }

const NODES: Node[] = [
  { id: 'ln', x: 400, y: 48, w: 280, h: 46, name: '归一化', detail: '每个 Transformer 块以 LayerNorm 开始，稳定输入分布；这一层在持续学习中保持冻结。' },
  { id: 'mhsa', x: 400, y: 112, w: 280, h: 50, name: '多头注意力', detail: '多头注意力输出的 token x_t ∈ R^{n×d} 先送进 MoE-Adapter，再回到主干；图像塔为 197×768。' },
  { id: 'moe', x: 340, y: 190, w: 400, h: 130, name: 'MoE 适配器', detail: '每个 Transformer 块都插入一个 MoE-Adapter，并在两条编码塔上各持一套、参数不共享；论文中专家池 NE = 22。' },
  { id: 'rtr', x: 356, y: 222, w: 166, h: 82, name: '路由器', detail: '路由器是一个单层 MLP，只读入 [CLS] token c_t ∈ R^{1×d}，用 top-2 门控为 22 个专家产生归一化权重 W^t。' },
  { id: 'exp', x: 538, y: 222, w: 186, h: 82, name: '专家', detail: '专家是 LoRA 低秩适配器：把冻结的原始权重拆成低秩可训练空间，因此每个任务只增加极少量参数。' },
  { id: 'res', x: 790, y: 222, w: 230, h: 66, name: '残差', detail: 'MoE 的输出与主干输入相加后交回主干；因为两者形状一致（n×d），残差结构不被破坏。' },
];

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W3, H3);
  const [sel, setSel] = useState('moe');
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W3, H3);
    if (!ctx) return;
    // 残差旁路（从输入绕到 MoE 之后的相加点）
    ctx.strokeStyle = C.route;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(400, 62);
    ctx.lineTo(308, 62);
    ctx.lineTo(308, 255);
    ctx.lineTo(788, 255);
    ctx.stroke();
    arrow(ctx, 400, 71, 540, 71, C.blue, 2);
    arrow(ctx, 540, 94, 540, 112, C.blue, 2);
    arrow(ctx, 540, 162, 540, 190, C.blue, 2);
    arrow(ctx, 740, 255, 788, 255, C.blue, 2.5);
    for (const nd of NODES) {
      paper(ctx, nd.x, nd.y, nd.w, nd.h);
      const active = sel === nd.id;
      ctx.strokeStyle = active ? C.blue : C.border;
      ctx.lineWidth = active ? 4 : 2;
      ctx.strokeRect(nd.x + 1, nd.y + 1, nd.w - 2, nd.h - 2);
      const ly = nd.id === 'exp' ? nd.y + 24 : nd.y + nd.h / 2;
      label(ctx, nd.name, nd.x + nd.w / 2, ly, active ? C.blue : C.ink, 15, 'center');
    }
    // 容器标题
    label(ctx, 'MoE 适配器', 356, 206, sel === 'moe' ? C.blue : C.ink, 15);
    for (let i = 0; i < 4; i += 1) {
      well(ctx, 572 + i * 40, 286, 12, i === 1 || i === 3 ? EXPERT_COLORS[i] : C.border, 1);
    }
    ctx.restore();
  }, [sel, ref]);

  const cur = NODES.find((n) => n.id === sel) as Node;
  const pick = (cx: number, cy: number) =>
    NODES.find((n) => cx >= n.x && cx <= n.x + n.w && cy >= n.y && cy <= n.y + n.h)?.id ?? null;
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W3}
        height={H3}
        style={{ cursor: hover ? 'pointer' : 'default' }}
        onMouseMove={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          setHover(pick(((e.clientX - r.left) * W3) / r.width, ((e.clientY - r.top) * H3) / r.height));
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          const id = pick(((e.clientX - r.left) * W3) / r.width, ((e.clientY - r.top) * H3) / r.height);
          if (id) setSel(id);
        }}
      />
      <div className="chip-row">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${sel === n.id ? 'selected' : ''}`} onClick={() => setSel(n.id)}>
            {n.name}
          </button>
        ))}
      </div>
      <div className="wc-detail">
        <b>{cur.name}</b>
        <br />
        {cur.detail}
      </div>
    </div>
  );
};

// ===========================================================================
// 9.1  专家数量的稳健性与参数量（P1 实时滑块）
// ===========================================================================
const W4 = 1080;
const H4 = 320;

export const Mod91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W4, H4);
  const [ne, setNe] = useState(22);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = begin(cv, W4, H4);
    if (!ctx) return;
    const ox = 80;
    const oy = 244;
    const aw = 540;
    const ah = 176;
    axis(ctx, ox, oy, aw, ah);
    const pts = (key: number) => {
      const out: number[][] = [];
      for (let i = 0; i <= 18; i += 1) {
        const n = 4 + i;
        const jitter = Math.sin(n * 1.7 + key) * (n < 8 ? 2.6 : 1.1);
        const base = [68.9, 76.7, 85.0][key];
        out.push([ox + ((n - 4) / 18) * aw, oy - ((base + jitter) / 100) * ah]);
      }
      return out;
    };
    polyline(ctx, pts(0), C.blue, 2.5);
    polyline(ctx, pts(1), C.dark, 2.5);
    polyline(ctx, pts(2), C.green, 3);
    const cx = ox + ((ne - 4) / 18) * aw;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, oy);
    ctx.lineTo(cx, 62);
    ctx.stroke();
    ctx.setLineDash([]);
    paper(ctx, 680, 56, 360, 200);
    label(ctx, '训练参数量 (M)', 704, 86, C.ink, 15);
    track(ctx, 704, 100, 160, 16, 59.8 / 160, C.orange);
    label(ctx, '本文 59.8', 1016, 108, C.orange, 15, 'right');
    track(ctx, 704, 140, 160, 16, 149.6 / 160, C.muted);
    label(ctx, 'ZSCL 149.6', 1016, 148, C.muted, 15, 'right');
    legend(
      ctx,
      [
        { color: C.blue, text: 'Transfer' },
        { color: C.dark, text: 'Average' },
        { color: C.green, text: 'Last' },
      ],
      80,
      302
    );
    ctx.restore();
  }, [ne, ref]);

  const fb =
    ne <= 6
      ? '专家数偏少时，若迭代次数又很多，路由器可能误激活训练不充分的专家，指标出现轻微波动。'
      : ne >= 20
      ? '在 N_E = 22（论文取值）处：Transfer 68.9、Average 76.7、Last 85.0；训练参数量 59.8M，仅约 ZSCL 149.6M 的四成。'
      : '三条曲线整体平稳：指标对专家数量并不敏感，说明该设计具有稳健性（曲线为趋势示意，端点取值来自论文）。';
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W4} height={H4} />
      <div className="ctrl">
        <label>
          专家数量 N_E <span className="val">{ne}</span>
        </label>
        <input type="range" min={4} max={22} value={ne} onChange={(e) => setNe(Number(e.target.value))} />
      </div>
      <div className={`feedback ${ne >= 20 ? 'good' : ''}`}>{fb}</div>
    </div>
  );
};
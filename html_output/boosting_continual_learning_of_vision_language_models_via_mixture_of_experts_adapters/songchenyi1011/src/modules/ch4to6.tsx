import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { C, clear, label, legend, paper, swatch, dot, bars, axis, well, arrow, frozenMark } from './wcKit';
import type { Ctx } from './wcKit';
import type { WidgetProps } from './registry';

function setup(cv: HTMLCanvasElement, ctx: Ctx, W: number, H: number) {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clear(ctx, W, H);
}

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

// 8 个专家的示意打分与配色（专家池实际为 NE = 22）
const EXPERT_LOGITS = [0.95, 0.78, 0.52, 0.41, 0.3, 0.22, 0.14, 0.07];
const EXPERT_COLORS = [C.blue, C.orange, C.green, C.purple, C.dark, C.light, C.muted, C.route];

function softmaxTopK(k: number, spread: number): number[] {
  const lg = EXPERT_LOGITS.map((v) => v * (0.25 + spread * 3.2));
  const sorted = lg.slice().sort((a, b) => b - a);
  const thr = sorted[Math.max(0, Math.min(lg.length, k)) - 1];
  const kept = lg.map((v) => (v >= thr ? v : -Infinity));
  const mx = Math.max(...kept.filter((v) => Number.isFinite(v)));
  const ex = kept.map((v) => (Number.isFinite(v) ? Math.exp(v - mx) : 0));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((v) => v / s);
}

function mixColor(w: number[]): string {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < w.length; i += 1) {
    const hex = EXPERT_COLORS[i];
    r += parseInt(hex.slice(1, 3), 16) * w[i];
    g += parseInt(hex.slice(3, 5), 16) * w[i];
    b += parseInt(hex.slice(5, 7), 16) * w[i];
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// ===========================================================================
// 4.1  从专家池中选几个（P4 模式芯片）
// ===========================================================================
const W4 = 1080;
const H4 = 300;

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W4, H4);
  const [k, setK] = useState(2);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    setup(cv, ctx, W4, H4);
    const w = softmaxTopK(k, 0.65);
    for (let i = 0; i < 8; i += 1) {
      const on = w[i] > 0;
      well(ctx, 90 + i * 46, 92, 17, on ? EXPERT_COLORS[i] : C.border, on ? 1 : 0.7);
      label(ctx, String(i + 1), 90 + i * 46, 126, C.muted, 12, 'center');
    }
    bars(
      ctx,
      66,
      158,
      344,
      78,
      w,
      (i, v) => (v > 0 ? EXPERT_COLORS[i] : C.border)
    );
    label(ctx, '1.00', 420, 152, C.blue, 15, 'right');
    axis(ctx, 66, 236, 344, 78);
    // 混合结果
    paper(ctx, 520, 62, 480, 178);
    label(ctx, '混合输出', 546, 92, C.ink, 16);
    swatch(ctx, 546, 112, 200, 108, mixColor(w), 1);
    for (let i = 0; i < 8; i += 1) {
      label(ctx, w[i].toFixed(2), 776 + (i % 4) * 58, 126 + Math.floor(i / 4) * 26, w[i] > 0 ? C.ink : C.muted, 13);
    }
    legend(ctx, [{ color: C.green, text: '被激活的专家' }, { color: C.border, text: '未激活（置 −∞）' }], 66, 286);
    ctx.restore();
  }, [k, ref]);

  const fb =
    k === 1
      ? { t: '只取 1 个专家：输出等于单个适配器，失去专家组合带来的表示能力。', c: '' }
      : k === 3
      ? { t: '取 3 个专家：组合更多，但会引入冗余并增加计算量。', c: '' }
      : { t: '取 2 个专家：与论文设置一致（top-2 门控），两名专家按权重混合出目标色。', c: 'good' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W4} height={H4} />
      <div className="chip-row">
        {[1, 2, 3].map((v) => (
          <button key={v} className={`chip ${k === v ? 'selected' : ''}`} onClick={() => setK(v)}>
            top-{v}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

// ===========================================================================
// 4.2  Top-k 掩码与 Softmax 归一化（P1 实时滑块）
// ===========================================================================
const W5 = 1080;
const H5 = 300;

export const Mod42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W5, H5);
  const [spread, setSpread] = useState(0.5);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    setup(cv, ctx, W5, H5);
    const raw = softmaxTopK(8, spread);
    const masked = softmaxTopK(2, spread);
    const rel = (v: number[]) => {
      const m = Math.max.apply(null, v) || 1;
      return v.map((x) => x / m);
    };
    label(ctx, '未掩码', 46, 46, C.muted, 15);
    bars(ctx, 130, 22, 440, 92, rel(raw), () => C.muted);
    label(ctx, 'Top-k 后', 46, 168, C.muted, 15);
    bars(ctx, 130, 144, 440, 92, rel(masked), (i, v) => (v > 0 ? EXPERT_COLORS[i] : C.border));
    // 右侧说明柱：选中专家权重
    paper(ctx, 640, 40, 380, 200);
    const picks = masked.map((v, i) => ({ v, i })).filter((o) => o.v > 0).sort((a, b) => b.v - a.v);
    picks.forEach((o, n) => {
      well(ctx, 700, 108 + n * 62, 16, EXPERT_COLORS[o.i], 1);
      label(ctx, o.v.toFixed(3), 900, 108 + n * 62, C.ink, 17, 'right');
    });
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(668, 202);
    ctx.lineTo(996, 202);
    ctx.stroke();
    label(ctx, '1.000', 1010, 224, C.blue, 18, 'right');
    legend(ctx, [{ color: C.muted, text: '未掩码分布' }, { color: C.green, text: '保留的两位' }, { color: C.border, text: '置 −∞ 后为 0' }], 130, 276);
    ctx.restore();
  }, [spread, ref]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W5} height={H5} />
      <div className="ctrl">
        <label>
          路由器打分差距 <span className="val">{(0.25 + spread * 3.2).toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(spread * 100)} onChange={(e) => setSpread(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${spread < 0.25 ? 'bad' : ''}`}>
        {spread < 0.25
          ? '打分几乎相同：Softmax 之后权重接近平均，路由器无法区分该用哪位专家。'
          : spread > 0.75
          ? '打分差距很大：权重高度集中在少数专家上；Top-k 之外的分量被置为 −∞，概率归零。'
          : '打分差距适中：未被 Top-k 选中的专家被置为 −∞，Softmax 后概率为 0，权重之和始终归一化为 1.000。'}
      </div>
    </div>
  );
};

// ===========================================================================
// 5.1  任务专属路由器（P4 模式芯片）
// ===========================================================================
const W6 = 1080;
const H6 = 300;

const TASK_PICK: number[][] = [
  [0, 2],
  [1, 3],
  [2, 5],
  [4, 6],
];
const TASK_TINT = [C.blue, C.orange, C.green, C.purple];

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W6, H6);
  const [task, setTask] = useState(0);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    setup(cv, ctx, W6, H6);
    const picks = TASK_PICK[task];
    paper(ctx, 40, 56, 190, 190);
    cardStack(ctx, 62, 104, task);
    for (let i = 0; i < 8; i += 1) {
      const on = picks.indexOf(i) >= 0;
      well(ctx, 330 + i * 46, 116, 17, on ? EXPERT_COLORS[i] : C.border, on ? 1 : 0.7);
      if (on) label(ctx, (0.6 - picks.indexOf(i) * 0.2).toFixed(1), 330 + i * 46, 152, C.ink, 13, 'center');
    }
    label(ctx, '共享专家池', 330, 86, C.ink, 15);
    paper(ctx, 760, 56, 280, 190);
    label(ctx, '该任务的输出', 784, 86, C.ink, 15);
    swatch(ctx, 784, 104, 232, 118, TASK_TINT[task], 0.9);
    arrow(ctx, 700, 150, 758, 150, C.blue, 2.5);
    paper(ctx, 380, 216, 240, 50);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(381, 217, 238, 48);
    label(ctx, '路由器 t', 500, 241, C.blue, 15, 'center');
    arrow(ctx, 232, 180, 378, 238, C.blue, 2);
    arrow(ctx, 500, 216, 500, 168, C.blue, 2);
    ctx.restore();
  }, [task, ref]);

  const fbByTask = [
    '任务 1 的路由器把权重压在第 1、3 位专家上；原先未被使用过的专家被新任务唤醒。',
    '任务 2 新增一个路由器，激活第 2、4 位专家——专家池共享，只有路由器是任务专属的。',
    '任务 3 又换一组专家组合；不同任务因此可以共用专家、又保留各自的任务特征。',
    '任务 4 的路由器依旧只挑选少数专家；11 个任务共用 22 个专家与 11 个路由器。',
  ];
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W6} height={H6} />
      <div className="chip-row">
        {[0, 1, 2, 3].map((i) => (
          <button key={i} className={`chip ${task === i ? 'selected' : ''}`} onClick={() => setTask(i)}>
            任务 {i + 1}
          </button>
        ))}
      </div>
      <div className="feedback">{fbByTask[task]}</div>
    </div>
  );
};

function cardStack(ctx: Ctx, x: number, y: number, sel: number) {
  for (let i = 0; i < 4; i += 1) {
    const on = i === sel;
    paper(ctx, x, y + i * 32, 146, 28);
    swatch(ctx, x + 8, y + i * 32 + 8, 60, 12, on ? TASK_TINT[i] : C.border, 1);
    if (on) {
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1.5, y + i * 32 - 1.5, 149, 31);
    }
  }
}

// ===========================================================================
// 6.1  DDAS 判别阈值（P1 实时滑块）
// ===========================================================================
const W7 = 1080;
const H7 = 320;

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W7, H7);
  const [thres, setThres] = useState(0.065);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    setup(cv, ctx, W7, H7);
    const x0 = 70;
    const x1 = 690;
    const yb = 236;
    const maxD = 0.2;
    const px = (d: number) => x0 + (d / maxD) * (x1 - x0);
    // 未见过数据区
    ctx.fillStyle = 'rgba(196,63,82,0.10)';
    ctx.fillRect(px(thres), 60, x1 - px(thres), yb - 60);
    // 11 个任务的分布（示意）
    for (let i = 0; i < 11; i += 1) {
      const center = 0.018 + i * 0.0042;
      hump(ctx, px(center), yb, 26, 84, C.green, 0.22);
    }
    hump(ctx, px(0.1), yb, 88, 108, C.purple, 0.2);
    axis(ctx, x0, yb, x1 - x0, 150);
    label(ctx, '重建分数 d', 660, yb + 26, C.muted, 13, 'center');
    // 阈值线
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px(thres), 52);
    ctx.lineTo(px(thres), yb);
    ctx.stroke();
    label(ctx, 'Thres', px(thres), 40, C.orange, 14, 'center');
    dot(ctx, px(0.065), yb + 12, 5, C.orange);
    dot(ctx, px(0.06), yb + 26, 4, C.muted);
    // 指标
    paper(ctx, 740, 56, 300, 190);
    const tr = 71.4 - 38.5 * thres;
    const la = 82.5 + 38.5 * thres;
    label(ctx, 'Transfer', 764, 90, C.blue, 15);
    bars(ctx, 764, 100, 90, 20, [clamp(tr / 100, 0, 1)], () => C.blue);
    label(ctx, tr.toFixed(1), 872, 112, C.blue, 16);
    label(ctx, 'Last', 764, 158, C.green, 15);
    bars(ctx, 764, 168, 90, 20, [clamp(la / 100, 0, 1)], () => C.green);
    label(ctx, la.toFixed(1), 872, 180, C.green, 16);
    label(ctx, thres.toFixed(3), 1010, 220, C.orange, 17, 'right');
    legend(ctx, [{ color: C.green, text: '已见任务分布' }, { color: C.purple, text: '参考分布' }, { color: C.red, text: '判为未见过' }], 70, 300);
    ctx.restore();
  }, [thres, ref]);

  const fb =
    thres < 0.05
      ? { t: '阈值偏低：更多样本被判为“未见过”而交给原 CLIP，Transfer 更高，但已见任务的准确率下降。', c: 'bad' }
      : thres > 0.1
      ? { t: '阈值偏高：几乎所有样本都走 MoE 适配器，Last 更高，但零样本迁移能力被削弱。', c: 'bad' }
      : { t: '论文在 full-shot 取 0.065、few-shot 取 0.06：所有 d_t 都高于阈值才判为未见过并交给原 CLIP。', c: 'good' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W7} height={H7} />
      <div className="ctrl">
        <label>
          判别阈值 <span className="val">{thres.toFixed(3)}</span>
        </label>
        <input type="range" min={20} max={160} value={Math.round(thres * 1000)} onChange={(e) => setThres(Number(e.target.value) / 1000)} />
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

function hump(ctx: Ctx, cx: number, base: number, w: number, h: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w, base);
  ctx.quadraticCurveTo(cx, base - h * 2, cx + w, base);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
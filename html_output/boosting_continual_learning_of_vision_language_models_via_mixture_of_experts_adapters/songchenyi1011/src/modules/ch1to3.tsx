import React, { useEffect, useRef, useState } from 'react';
import { lerp, lerpColor, clamp } from '../lib/canvasKit';
import { C, clear, label, legend, paper, swatch, dot, bars, polyline, axis, arrow, brush, well } from './wcKit';
import type { Ctx } from './wcKit';
import type { WidgetProps } from './registry';

function useCanvas(W: number, H: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<Ctx | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    cv.classList.add('is-ready');
  }, [W, H, ctxRef]);
  return ref;
}

function useKeyboard(handler: (e: KeyboardEvent) => void, deps: unknown[]) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => handler(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ===========================================================================
// 1.1  微调幅度与灾难性遗忘（P1 实时滑块）
// ===========================================================================
const W1 = 1080;
const H1 = 300;

export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W1, H1);
  const [p, setP] = useState(0.25);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clear(ctx, W1, H1);
    // 旧任务色块
    for (let i = 0; i < 5; i += 1) {
      const x = 42 + i * 76;
      const col = lerpColor(C.green, C.red, p);
      swatch(ctx, x, 96, 64, 116, col, 1 - p * 0.45);
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = C.red;
      ctx.globalAlpha = p;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, 96.5, 63, 115);
      ctx.restore();
    }
    label(ctx, '旧任务', 42, 66, C.ink, 15);
    // 新任务
    well(ctx, 512, 154, 46, C.blue, 0.62 + p * 0.38);
    label(ctx, '新任务', 470, 66, C.ink, 15);
    // 技术内嵌：保持率 / 适应度
    const ox = 660;
    const oy = 268;
    const aw = 340;
    const ah = 190;
    axis(ctx, ox, oy, aw, ah);
    const keepPts: number[][] = [];
    const adaptPts: number[][] = [];
    for (let i = 0; i <= 20; i += 1) {
      const q = i / 20;
      keepPts.push([ox + q * aw, oy - ((100 - q * 44.1) / 100) * ah]);
      adaptPts.push([ox + q * aw, oy - ((65.3 + q * 23.9) / 100) * ah]);
    }
    polyline(ctx, keepPts, C.green, 3);
    polyline(ctx, adaptPts, C.blue, 3);
    const cx = ox + p * aw;
    dot(ctx, cx, oy - ((100 - p * 44.1) / 100) * ah, 6, C.green);
    dot(ctx, cx, oy - ((65.3 + p * 23.9) / 100) * ah, 6, C.blue);
    label(ctx, (100 - p * 44.1).toFixed(1), ox + aw - 4, oy - ((100 - p * 44.1) / 100) * ah - 16, C.green, 15, 'right');
    label(ctx, (65.3 + p * 23.9).toFixed(1), ox + aw - 4, oy - ((65.3 + p * 23.9) / 100) * ah + 18, C.blue, 15, 'right');
    legend(
      ctx,
      [
        { color: C.green, text: '旧任务保持' },
        { color: C.blue, text: '新任务适应' },
        { color: C.red, text: '遗忘' },
      ],
      42,
      H1 - 18
    );
    ctx.restore();
  }, [p, ref]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setP(Number(e.target.value) / 100);
  const fb =
    p < 0.3
      ? { t: '改动很小：旧任务的色块几乎原样保留，但新任务几乎没有学到东西。', c: '' }
      : p < 0.7
      ? { t: '中等幅度：新任务开始适应，旧任务的色块已经出现褪色。', c: '' }
      : { t: '改动很大：旧任务被新任务覆盖，出现灾难性遗忘——持续全量微调的 Average 只有 55.9。', c: 'bad' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W1} height={H1} />
      <div className="ctrl">
        <label>
          微调幅度 <span className="val">{(p * 100).toFixed(0)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(p * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

// ===========================================================================
// 2.1  CLIP 双塔图文对齐（P5 可点击热点）
// ===========================================================================
const W2 = 1080;
const H2 = 340;

interface Hot { id: string; x: number; y: number; w: number; h: number; name: string; detail: string }

const HOTS: Hot[] = [
  {
    id: 'img',
    x: 60,
    y: 74,
    w: 180,
    h: 176,
    name: '图像编码器',
    detail:
      'ViT-B/16 把图像切成 16×16 的块，加上 [CLS] 后得到 197 个 token，每个 768 维；这一塔只负责把“画了什么”编码成一个向量。',
  },
  {
    id: 'txt',
    x: 620,
    y: 74,
    w: 180,
    h: 176,
    name: '文本编码器',
    detail:
      '文本塔把类名（如 “a photo of a lotus”）编码成 77 个 token 的序列并取 [CLS] 特征；它与图像塔结构相同，但参数不共享。',
  },
  {
    id: 'cos',
    x: 400,
    y: 108,
    w: 180,
    h: 96,
    name: '余弦相似度',
    detail:
      '两塔输出投影到同一个 512 维空间后计算余弦相似度；相似度最高的类名即为预测结果，不需要额外的分类头。',
  },
  {
    id: 'pair',
    x: 300,
    y: 232,
    w: 400,
    h: 74,
    name: '图文配对',
    detail:
      '持续学习时这一“图文对照”机制被冻结保留：MoE-Adapter 只在这条通路上叠加少量可训练参数，因此零样本能力不会被动摇。',
  },
];

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W2, H2);
  const [sel, setSel] = useState('img');
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clear(ctx, W2, H2);
    // 塔体
    for (const h of HOTS) {
      if (h.id === 'pair') {
        paper(ctx, h.x, h.y, h.w, h.h);
      } else {
        paper(ctx, h.x, h.y, h.w, h.h);
      }
      const active = sel === h.id;
      ctx.strokeStyle = active ? C.blue : h.id === 'cos' ? C.purple : C.border;
      ctx.lineWidth = active ? 4 : 2;
      ctx.strokeRect(h.x + 1, h.y + 1, h.w - 2, h.h - 2);
      label(ctx, h.name, h.x + h.w / 2, h.y + 24, active ? C.blue : C.ink, 16, 'center');
    }
    // 塔内层
    for (let i = 0; i < 3; i += 1) {
      swatch(ctx, 84, 112 + i * 44, 132, 30, C.light, 0.55 + i * 0.12);
      swatch(ctx, 644, 112 + i * 44, 132, 30, C.light, 0.55 + i * 0.12);
    }
    // 通路
    arrow(ctx, 240, 162, 400, 156, C.blue, 2.5);
    arrow(ctx, 620, 162, 580, 156, C.blue, 2.5);
    arrow(ctx, 490, 204, 490, 232, C.blue, 2.5);
    dot(ctx, 490, 156, 7, C.orange);
    // 底部画稿与色卡
    paper(ctx, 60, 268, 150, 52);
    swatch(ctx, 74, 280, 56, 28, C.light, 1);
    swatch(ctx, 140, 280, 56, 28, C.blue, 1);
    for (let i = 0; i < 3; i += 1) {
      paper(ctx, 794 + i * 76, 274, 58, 40);
      swatch(ctx, 804 + i * 76, 284, 38, 20, i === 1 ? C.green : C.border, 1);
    }
    arcLinkMini(ctx, 212, 296, 400, 274, C.blue);
    ctx.restore();
  }, [sel, ref]);

  useKeyboard(
    (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const i = HOTS.findIndex((h) => h.id === sel);
      if (e.key === 'ArrowRight') setSel(HOTS[(i + 1) % HOTS.length].id);
      if (e.key === 'ArrowLeft') setSel(HOTS[(i - 1 + HOTS.length) % HOTS.length].id);
    },
    [sel]
  );

  const cur = HOTS.find((h) => h.id === sel) as Hot;
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W2}
        height={H2}
        onMouseMove={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) * W2) / r.width;
          const y = ((e.clientY - r.top) * H2) / r.height;
          const hit = HOTS.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
          setHover(hit ? hit.id : null);
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) * W2) / r.width;
          const y = ((e.clientY - r.top) * H2) / r.height;
          const hit = HOTS.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
          if (hit) setSel(hit.id);
        }}
        style={{ cursor: hover ? 'pointer' : 'default' }}
      />
      <div className="chip-row">
        {HOTS.map((h) => (
          <button key={h.id} className={`chip ${sel === h.id ? 'selected' : ''}`} onClick={() => setSel(h.id)}>
            {h.name}
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

function arcLinkMini(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 26, x2, y2);
  ctx.stroke();
  ctx.restore();
}

// ===========================================================================
// 3.1  冻结主干 + 轻量适配器：同步前后对比（P3）
// ===========================================================================
const W3 = 1080;
const H3 = 320;

export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useCanvas(W3, H3);
  const [prog, setProg] = useState(0);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 2600);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else setRun(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clear(ctx, W3, H3);
    const panels = [
      { x: 40, title: '全量微调', color: C.red, keep: 55.9 },
      { x: 560, title: '冻结主干 + 适配器', color: C.green, keep: 76.7 },
    ];
    panels.forEach((pl, pi) => {
      paper(ctx, pl.x, 56, 480, 196);
      label(ctx, pl.title, pl.x + 16, 34, pi === 0 ? C.red : C.green, 16);
      for (let i = 0; i < 11; i += 1) {
        const sx = pl.x + 20 + i * 41;
        const hit = clamp(prog * 11 - i, 0, 1);
        if (pi === 0) {
          swatch(ctx, sx, 96, 34, 92, lerpColor(C.green, C.red, hit), 1 - hit * 0.42);
        } else {
          swatch(ctx, sx, 96, 34, 92, C.green, 0.92 - hit * 0.1);
          if (i === 10 && hit > 0.2) swatch(ctx, sx, 96, 34, 92 * hit, C.purple, 0.85);
        }
      }
      label(ctx, pl.keep.toFixed(1), pl.x + 464, 226, pi === 0 ? C.red : C.green, 20, 'right');
    });
    ctx.strokeStyle = C.border;
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(540, 40);
    ctx.lineTo(540, 280);
    ctx.stroke();
    ctx.setLineDash([]);
    legend(
      ctx,
      [
        { color: C.green, text: '历史任务保留' },
        { color: C.red, text: '被覆盖 / 遗忘' },
        { color: C.purple, text: '新增适配器' },
      ],
      40,
      302
    );
    ctx.restore();
  }, [prog, ref]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W3} height={H3} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => setRun(true)} disabled={run}>
          {run ? '推进中…' : '开始对比'}
        </button>
        <button
          className="tiny"
          onClick={() => {
            setRun(false);
            setProg(0);
          }}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${prog >= 1 ? 'good' : ''}`}>
        {prog === 0
          ? '两侧从同一状态出发：都从零样本 CLIP 开始，依次学习同样的 11 个任务。'
          : prog < 1
          ? '同一时间轴上推进：左侧的旧任务色块正在被新任务的更新冲掉，右侧只在前端叠加紫色适配器。'
          : '结束时左侧只剩红色残影（持续全量微调 Average 55.9），右侧历史任务仍然可辨（本文 76.7）。'}
      </div>
    </div>
  );
};
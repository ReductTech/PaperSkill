import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 4.1（CCQGen · 方案丙：环形闭环 + 点节点展开）
// 命题：查询生成是一条闭环 —— 缺口 π → 采样 → 拼进提示生成 → 双通道把关 → 回填覆盖，回填后重算缺口。
// 画面：左侧五节点闭环（流动虚线箭头表示持续转动），右侧面板按选中节点展开该环节的细节。
// 自包含：只 import react 与 ../lib/canvasKit，具名导出 Ch5CcqgenRing。

const W = 1080;
const H = 440;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const C = {
  field: '#f5f8f0',
  ink: '#21324a',
  muted: '#68778f',
  faint: '#9aa3ae',
  line: '#d7deea',
  panel: '#ffffff',
  blue: '#185fa5',
  blueFill: '#e6f1fb',
  blueSoft: '#9dc2e8',
  green: '#228d5c',
  greenFill: '#e6f4ec',
  red: '#c43f52',
  redFill: '#fbe9ec',
  orange: '#f07e47',
  orangeFill: '#fdeee4',
  aux: '#7c3aed',
  auxFill: '#f1eafe',
  terrain: '#b8c9a7',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left',
  bold = false
) {
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600 ' : ''}${size}px ${SANS}`;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fg: string,
  bg: string,
  size = 12
) {
  ctx.font = `600 ${size}px ${SANS}`;
  const tw = ctx.measureText(label).width;
  const w = tw + 24;
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fillStyle = bg;
  ctx.fill();
  text(ctx, label, x + w / 2, y + 18, fg, size, 'center', true);
  return w;
}

function arrowDown(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y2 + 9);
  ctx.lineTo(x - 6, y2 - 1);
  ctx.lineTo(x + 6, y2 - 1);
  ctx.closePath();
  ctx.fill();
}

type NodeKey = 'gap' | 'sample' | 'generate' | 'filter' | 'backfill';

const NODES: { key: NodeKey; label: string; title: string; sub: string }[] = [
  { key: 'gap', label: '① 缺口', title: '① 算出缺口 π', sub: '目标分布 − 现状分布' },
  { key: 'sample', label: '② 采样', title: '② 按 π 采样', sub: '用采样，不用 top-k' },
  { key: 'generate', label: '③ 生成', title: '③ 拼进提示、生成查询', sub: 'q^m_d = LLM([P ; C])' },
  { key: 'filter', label: '④ 把关', title: '④ 双通道把关', sub: '文本 × 概念' },
  { key: 'backfill', label: '⑤ 回填', title: '⑤ 回填、重算', sub: '覆盖 +1，回到 ①' },
];

const CX = 252;
const CY = 224;
const RAD = 138;
const NODE_W = 104;
const NODE_H = 48;

const POS = NODES.map((_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return { x: CX + RAD * Math.cos(a), y: CY + RAD * Math.sin(a), a };
});

// 8 个待覆盖概念（推荐系统域，与第 2 / 3 页同域）
const CONCEPTS = ['推荐系统', '矩阵分解', '协同过滤', '长尾分布', '向量检索', '查询扩展', '冷启动', '过滤泡'];
const TARGET = [0.9, 0.7, 0.8, 0.6, 0.85, 0.5, 0.75, 0.65];
const COVERED = [true, false, true, false, false, false, false, false];
// π = 缺口归一化（和 = 1.00）
const PI = [0.16, 0.12, 0.14, 0.1, 0.15, 0.09, 0.13, 0.11];
const SAMPLE_PICK = [0, 4, 2, 6];
const TOPK_PICK = [0, 4];

interface Cand { name: string; t: number; c: number }
const CANDS: Cand[] = [
  { name: '协同过滤扩展', t: 0.8, c: 0.85 },
  { name: '矩阵补全技巧', t: 0.75, c: 0.7 },
  { name: '检索增强提示', t: 0.82, c: 0.6 },
  { name: '冷启长尾策略', t: 0.3, c: 0.8 },
  { name: '向量索引优化', t: 0.7, c: 0.55 },
  { name: '噪声词串扰', t: 0.65, c: 0.2 },
];

const FEEDBACK: Record<NodeKey, { text: string; cls: string }> = {
  gap: { text: '缺口 = 目标 − 现状。全部概念都还没说，缺口就是全部。', cls: 'bad' },
  sample: { text: '按 π 采样，不取 top-k —— 每个高缺口概念都有机会被选中。', cls: '' },
  generate: { text: 'P 原样保留，C 追加在后 —— 拼接，不是替换。', cls: '' },
  filter: { text: '文本通道挡噪声，概念通道救回「字面不像但概念像」的好查询。', cls: 'good' },
  backfill: { text: '覆盖 +1，缺口变小，下一轮从新的缺口重算。', cls: 'good' },
};

// ── 面板：① 缺口 ────────────────────────────────────────────────────────
function drawGap(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) {
  let cx = x0;
  cx += pill(ctx, cx, y0, '缺口合计 5.75', C.red, C.redFill) + 10;
  cx += pill(ctx, cx, y0, '已覆盖 0 / 8', C.muted, '#eef2f6') + 10;

  const base = y0 + 186;
  const maxH = 112;
  const step = 64;
  const gx0 = x0 + (w - step * 8) / 2 + step / 2;
  for (let i = 0; i < 8; i++) {
    const cxi = gx0 + i * step;
    const v = TARGET[i];
    ctx.fillStyle = C.terrain;
    ctx.fillRect(cxi - 17, base - v * maxH, 15, v * maxH);
    ctx.fillStyle = C.red;
    ctx.fillRect(cxi + 2, base - v * maxH, 15, v * maxH);
    text(ctx, CONCEPTS[i], cxi, base + 20, C.muted, 10.5, 'center');
  }
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, base + 2);
  ctx.lineTo(x0 + w, base + 2);
  ctx.stroke();
  text(ctx, '灰绿＝目标分布，红＝还没有任何查询说到的部分。', x0, base + 44, C.muted, 12);
  text(ctx, '负的缺口清零，再归一化成抽样概率 π。', x0, base + 66, C.ink, 12.5);
}

// ── 面板：② 采样 ────────────────────────────────────────────────────────
function drawSample(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) {
  const step = 64;
  const gx0 = x0 + (w - step * 8) / 2 + step / 2;
  const drawRow = (top: number, pick: number[]) => {
    for (let i = 0; i < 8; i++) {
      const on = pick.indexOf(i) !== -1;
      const x = gx0 + i * step - 23;
      roundRect(ctx, x, top, 46, 40, 7);
      ctx.fillStyle = on ? C.blueFill : '#f6f8fb';
      ctx.fill();
      ctx.strokeStyle = on ? C.blueSoft : C.line;
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.stroke();
      text(ctx, PI[i].toFixed(2), x + 23, top + 25, on ? C.blue : C.faint, 12, 'center', on);
    }
  };

  text(ctx, '按 π 采样 · 每个高缺口概念都有机会', x0, y0 + 12, C.muted, 12);
  drawRow(y0 + 22, SAMPLE_PICK);
  text(ctx, '若用 top-k · 只取最亮的 2 个', x0, y0 + 92, C.muted, 12);
  drawRow(y0 + 102, TOPK_PICK);

  text(ctx, '采样保留多样性 —— 不锁死在最亮的几个词上。', x0, y0 + 178, C.ink, 12.5);
  text(ctx, '用 top-k 时，少数概念会被反复选中，剩下的永远轮不到。', x0, y0 + 200, C.muted, 12);
}

// ── 面板：③ 生成 ────────────────────────────────────────────────────────
function drawGenerate(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) {
  const y1 = y0 + 40;
  const pw = 300;
  const cw = w - pw - 6;

  roundRect(ctx, x0, y1, pw, 66, 9);
  ctx.fillStyle = '#f1efe8';
  ctx.fill();
  ctx.strokeStyle = '#ddd8cd';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'P · 已有提示方案', x0 + 16, y1 + 27, '#4b4a45', 13.5, 'left', true);
  text(ctx, 'few-shot / pair-wise 等，原样保留', x0 + 16, y1 + 49, '#7a776e', 11.5);

  roundRect(ctx, x0 + pw + 6, y1, cw, 66, 9);
  ctx.fillStyle = C.blueFill;
  ctx.fill();
  ctx.strokeStyle = C.blueSoft;
  ctx.stroke();
  text(ctx, 'C · 本轮条件短语', x0 + pw + 22, y1 + 27, C.blue, 13.5, 'left', true);
  text(ctx, '由缺口 π 采样得到', x0 + pw + 22, y1 + 49, C.muted, 11.5);

  arrowDown(ctx, x0 + w / 2, y1 + 76, y1 + 106, C.blueSoft);

  const y2 = y1 + 116;
  roundRect(ctx, x0, y2, w, 58, 9);
  ctx.fillStyle = C.auxFill;
  ctx.fill();
  ctx.strokeStyle = '#d9c9f6';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'q^m_d = LLM([P ; C])', x0 + w / 2, y2 + 37, C.aux, 17, 'center', true);

  text(ctx, '拼接，不是替换 —— C 为空时，第一个查询退化成基线。', x0, y2 + 92, C.ink, 12.5);
}

// ── 面板：④ 把关 ────────────────────────────────────────────────────────
function drawFilter(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) {
  const cells = [
    { tx: '字面像', cx: '概念像', v: '保留', col: C.green, bg: C.greenFill, bd: '#b8ddc9' },
    { tx: '字面像', cx: '概念不像', v: '剔除', col: C.red, bg: C.redFill, bd: '#eec2c9' },
    { tx: '字面不像', cx: '概念像', v: '救回', col: C.orange, bg: C.orangeFill, bd: '#f6d3bd' },
    { tx: '字面不像', cx: '概念不像', v: '剔除', col: C.red, bg: C.redFill, bd: '#eec2c9' },
  ];
  const cw = 132;
  const chh = 84;
  const gx = 8;
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = x0 + col * (cw + gx);
    const y = y0 + 26 + row * (chh + gx);
    roundRect(ctx, x, y, cw, chh, 8);
    ctx.fillStyle = cells[i].bg;
    ctx.fill();
    ctx.strokeStyle = cells[i].bd;
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, `${cells[i].tx} × ${cells[i].cx}`, x + cw / 2, y + 30, C.ink, 10.5, 'center');
    text(ctx, cells[i].v, x + cw / 2, y + 62, cells[i].col, 17, 'center', true);
  }

  const lx = x0 + 300;
  text(ctx, '候选查询 · 文本分 / 概念分', lx, y0 + 12, C.muted, 11);
  const top = y0 + 26;
  const rowH = 30;
  for (let i = 0; i < CANDS.length; i++) {
    const s = CANDS[i];
    const y = top + i * rowH;
    const v = s.t >= 0.5 && s.c >= 0.5 ? 'keep' : s.t < 0.5 && s.c >= 0.5 ? 'rescued' : 'drop';
    const col = v === 'keep' ? C.green : v === 'rescued' ? C.orange : C.red;
    text(ctx, s.name, lx, y + 16, C.ink, 11.5);
    ctx.fillStyle = '#cbd5e0';
    ctx.fillRect(lx + 96, y + 7, s.t * 96, 6);
    ctx.fillStyle = C.blueSoft;
    ctx.fillRect(lx + 96, y + 17, s.c * 96, 6);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(lx + 210, y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, '概念通道专救「字面不像但概念像」的查询 —— 降低假阴性。', x0, y0 + 246, C.ink, 12.5);
}

// ── 面板：⑤ 回填 ────────────────────────────────────────────────────────
function drawBackfill(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) {
  let cx = x0;
  cx += pill(ctx, cx, y0, '已覆盖 2 / 8', C.green, C.greenFill) + 10;
  cx += pill(ctx, cx, y0, '缺口 5.75 → 4.05', C.blue, C.blueFill) + 10;
  cx += pill(ctx, cx, y0, '轮次 1 / 5', C.muted, '#eef2f6') + 10;

  const step = 64;
  const gx0 = x0 + (w - step * 8) / 2 + step / 2;
  const y1 = y0 + 64;
  for (let i = 0; i < 8; i++) {
    const on = COVERED[i];
    const x = gx0 + i * step - 23;
    roundRect(ctx, x, y1, 46, 40, 7);
    ctx.fillStyle = on ? C.greenFill : '#f6f8fb';
    ctx.fill();
    ctx.strokeStyle = on ? C.green : C.line;
    ctx.lineWidth = on ? 1.6 : 1;
    ctx.stroke();
    if (on) text(ctx, '✓', x + 23, y1 + 26, C.green, 15, 'center', true);
    else text(ctx, CONCEPTS[i].slice(0, 2), x + 23, y1 + 25, C.faint, 10.5, 'center');
  }

  const ay = y1 + 96;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + w - 34, ay);
  ctx.bezierCurveTo(x0 + w - 150, ay + 36, x0 + 150, ay + 36, x0 + 30, ay);
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.moveTo(x0 + 20, ay);
  ctx.lineTo(x0 + 32, ay - 6);
  ctx.lineTo(x0 + 32, ay + 6);
  ctx.closePath();
  ctx.fill();
  text(ctx, '回到 ① 重算缺口', x0 + w / 2, ay + 58, C.blue, 12.5, 'center', true);

  text(ctx, '每生成一个查询就重算缺口 —— 闭环，不是一次排好序。', x0, y0 + 246, C.ink, 12.5);
}

const PANELS: Record<
  NodeKey,
  (ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number) => void
> = {
  gap: drawGap,
  sample: drawSample,
  generate: drawGenerate,
  filter: drawFilter,
  backfill: drawBackfill,
};

export const Ch5CcqgenRing: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selRef = useRef<NodeKey>('gap');
  const [sel, setSel] = useState<NodeKey>('gap');
  const [feedback, setFeedback] = useState(FEEDBACK.gap);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const cur = selRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.field;
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';
      ctx.lineCap = 'butt';

      // ── 闭环（流动虚线 = 持续转动）
      ctx.strokeStyle = '#c9d6e4';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.lineDashOffset = -((t * 26) % 13);
      ctx.beginPath();
      ctx.arc(CX, CY, RAD, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── 五个顺时针箭头（节点之间）
      for (let i = 0; i < 5; i++) {
        const a = POS[i].a + Math.PI / 5;
        const x = CX + RAD * Math.cos(a);
        const y = CY + RAD * Math.sin(a);
        const on = NODES[i].key === cur || NODES[(i + 1) % 5].key === cur;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = on ? C.blue : '#a9b8c7';
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ── 节点卡
      for (let i = 0; i < 5; i++) {
        const p = POS[i];
        const on = NODES[i].key === cur;
        roundRect(ctx, p.x - NODE_W / 2, p.y - NODE_H / 2, NODE_W, NODE_H, 10);
        ctx.fillStyle = on ? C.blue : '#ffffff';
        ctx.fill();
        if (!on) {
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        text(ctx, NODES[i].label, p.x, p.y + 6, on ? '#ffffff' : C.ink, 14, 'center', on);
      }

      // ── 环中心
      text(ctx, 'CCQGen', CX, CY - 6, C.ink, 18, 'center', true);
      text(ctx, '闭环', CX, CY + 15, C.muted, 12.5, 'center');
      text(ctx, '点节点看细节', CX, CY + 36, C.faint, 11, 'center');

      // ── 右侧面板
      const PX = 470;
      const PY = 36;
      const PW = 575;
      const PH = 372;
      roundRect(ctx, PX, PY, PW, PH, 12);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.stroke();

      const node = NODES.find((n) => n.key === cur) as (typeof NODES)[number];
      text(ctx, node.title, PX + 22, PY + 34, C.ink, 15.5, 'left', true);
      text(ctx, node.sub, PX + 22, PY + 56, C.muted, 12);
      ctx.strokeStyle = '#eef1f5';
      ctx.beginPath();
      ctx.moveTo(PX + 22, PY + 70);
      ctx.lineTo(PX + PW - 22, PY + 70);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.rect(PX + 2, PY + 74, PW - 4, PH - 84);
      ctx.clip();
      PANELS[cur](ctx, PX + 22, PY + 84, PW - 44);
      ctx.restore();

      // ── 示意数据标注
      text(ctx, '示意数据 · 非论文实测', 40, 426, C.faint, 11);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (k: NodeKey) => {
    selRef.current = k;
    setSel(k);
    setFeedback(FEEDBACK[k]);
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < POS.length; i++) {
      if (Math.abs(x - POS[i].x) <= NODE_W / 2 && Math.abs(y - POS[i].y) <= NODE_H / 2) {
        pick(NODES[i].key);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        {NODES.map((n) => (
          <button
            type="button"
            key={n.key}
            className={sel === n.key ? 'on' : ''}
            onClick={() => pick(n.key)}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ── 完整链路 · 并行双链脉冲流水线（方案乙）──────────────────────────────
// ① 文档 d → ② 候选集 → ③ 索引 ȳ ─┬─ ④ CCQGen（训练侧 · 改数据）
//                                 └─ ⑤ CCExpand（推理侧 · 改打分）→ ⑥ 检索器
// 主导操作：跑一遍 / 只看训练侧 / 只看推理侧。
// 节点按编号依次脉冲点亮、连线流动；底部读数随站点更新（配置量纲，非实验对比）。

const FIELD = '#f5f8f0';
const LINE = '#d7deea';
const GUIDE = '#27446e';
const TRAIN = '#2f6fb5';
const INFER = '#228d5c';
const OUT = '#f07e47';
const TEXT = '#21324a';
const MUTED = '#68778f';

const W = 1080;
const H = 420;

const STEP = 640; // 相邻两站的推进间隔（ms）
const PULSE = 320; // 脉冲（光晕）持续
const FLOW = 340; // 连线流动窗口

type Mode = 'all' | 'train' | 'infer';

const SEQ: Record<Mode, number[]> = {
  all: [0, 1, 2, 3, 4, 5],
  train: [0, 1, 2, 3, 5],
  infer: [0, 1, 2, 4, 5],
};

type Side = 'spine' | 'train' | 'infer' | 'out';

const COLOR: Record<Side, string> = { spine: GUIDE, train: TRAIN, infer: INFER, out: OUT };

interface Station {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  side: Side;
  readout: string;
}

const STATIONS: Station[] = [
  {
    x: 56,
    y: 180,
    w: 150,
    h: 64,
    title: '文档 d',
    sub: '1 段文本',
    side: 'spine',
    readout: '① 文档 d —— 一篇文档压成一个向量，检索时只能给出一个相似度。',
  },
  {
    x: 246,
    y: 180,
    w: 160,
    h: 64,
    title: '候选集',
    sub: '主题 + 短语',
    side: 'spine',
    readout: '② 候选集 —— 主题侧与短语侧各自筛：top-10 / top-15，两种粒度（§4）。',
  },
  {
    x: 446,
    y: 180,
    w: 150,
    h: 64,
    title: '索引 ȳ',
    sub: 'ȳᵗ15 + ȳᵖ20',
    side: 'spine',
    readout: '③ 索引 ȳ —— 主题 15 项 + 短语 20 项归一化权重；两条链读的是同一张表。',
  },
  {
    x: 646,
    y: 66,
    w: 186,
    h: 64,
    title: 'CCQGen',
    sub: '训练侧 · 改数据',
    side: 'train',
    readout: '④ CCQGen —— 训练侧改数据：查询换成概念感知查询，推理时零额外成本。',
  },
  {
    x: 646,
    y: 294,
    w: 186,
    h: 64,
    title: 'CCExpand',
    sub: '推理侧 · 改打分',
    side: 'infer',
    readout: '⑤ CCExpand —— 推理侧改打分：文档离线切成 5 个片段，检索时只算向量相似度。',
  },
  {
    x: 882,
    y: 180,
    w: 150,
    h: 64,
    title: '检索器',
    sub: '排序输出',
    side: 'out',
    readout: '⑥ 检索器 —— 两处改动在这里合流，互不冲突，所以收益可以叠加。',
  },
];

interface Edge {
  a: number;
  b: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  side: Side;
}

const EDGES: Edge[] = [
  { a: 0, b: 1, x0: 206, y0: 212, x1: 246, y1: 212, side: 'spine' },
  { a: 1, b: 2, x0: 406, y0: 212, x1: 446, y1: 212, side: 'spine' },
  { a: 2, b: 3, x0: 596, y0: 212, x1: 646, y1: 98, side: 'train' },
  { a: 2, b: 4, x0: 596, y0: 212, x1: 646, y1: 326, side: 'infer' },
  { a: 3, b: 5, x0: 832, y0: 98, x1: 882, y1: 200, side: 'train' },
  { a: 4, b: 5, x0: 832, y0: 326, x1: 882, y1: 224, side: 'infer' },
];

const DEFAULT_READOUT = '点「跑一遍」，两条链按编号依次点亮；底部读数随站点更新。';

function panelPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawEdge(ctx: CanvasRenderingContext2D, e: Edge, prog: number, color: string, now: number) {
  const dx = e.x1 - e.x0;
  const dy = e.y1 - e.y0;
  if (prog <= 0) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.x0, e.y0);
    ctx.lineTo(e.x1, e.y1);
    ctx.stroke();
    return;
  }
  const mx = e.x0 + dx * prog;
  const my = e.y0 + dy * prog;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.setLineDash([9, 7]);
  ctx.lineDashOffset = -((now / 26) % 16);
  ctx.beginPath();
  ctx.moveTo(e.x0, e.y0);
  ctx.lineTo(mx, my);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  if (prog < 1) {
    ctx.beginPath();
    ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const ang = Math.atan2(dy, dx);
    const sz = 8;
    ctx.beginPath();
    ctx.moveTo(e.x1, e.y1);
    ctx.lineTo(e.x1 - sz * Math.cos(ang - 0.42), e.y1 - sz * Math.sin(ang - 0.42));
    ctx.lineTo(e.x1 - sz * Math.cos(ang + 0.42), e.y1 - sz * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  st: Station,
  idx: number,
  opt: { arrived: boolean; pulseT: number | null; bypass: boolean }
) {
  const color = COLOR[st.side];
  ctx.save();
  if (opt.bypass) ctx.globalAlpha = 0.3;
  if (opt.pulseT !== null) {
    const grow = 8 + 14 * opt.pulseT;
    ctx.globalAlpha = (opt.bypass ? 0.3 : 1) * 0.55 * (1 - opt.pulseT);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    panelPath(ctx, st.x - grow / 2, st.y - grow / 2, st.w + grow, st.h + grow, 13 + grow / 2);
    ctx.stroke();
    ctx.globalAlpha = opt.bypass ? 0.3 : 1;
  }
  ctx.fillStyle = opt.arrived ? '#ffffff' : '#fbfdf8';
  panelPath(ctx, st.x, st.y, st.w, st.h, 11);
  ctx.fill();
  ctx.strokeStyle = opt.arrived ? color : LINE;
  ctx.lineWidth = opt.arrived ? 2.4 : 1.4;
  ctx.stroke();

  const cx = st.x + 24;
  const cy = st.y + st.h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fillStyle = opt.arrived ? color : '#dfe6ef';
  ctx.fill();
  ctx.fillStyle = opt.arrived ? '#ffffff' : '#8d9aab';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(idx + 1), cx, cy + 0.5);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TEXT;
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.fillText(st.title, st.x + 46, st.y + 30);
  ctx.fillStyle = MUTED;
  ctx.font = '12.5px "Segoe UI", sans-serif';
  ctx.fillText(st.sub, st.x + 46, st.y + 50);
  ctx.restore();
}

export const Ch8Pipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const stRef = useRef<{ mode: Mode | null; t0: number }>({ mode: null, t0: 0 });
  const readRef = useRef<string>(DEFAULT_READOUT);
  const [mode, setMode] = useState<Mode | null>(null);
  const [feedback, setFeedback] = useState({ text: '两条链读的是同一张索引 ȳ，但改动的位置完全不同。', cls: '' });

  const FB: Record<Mode, { text: string; cls: string }> = {
    all: { text: '两条链同时跑：训练侧改数据、推理侧改打分，互不冲突。', cls: '' },
    train: { text: '只看训练侧：查询被换成概念感知查询，推理时零额外成本。', cls: '' },
    infer: { text: '只看推理侧：文档离线切成 5 个片段，检索时只算向量相似度。', cls: '' },
  };

  const run = (m: Mode) => {
    stRef.current = { mode: m, t0: performance.now() };
    readRef.current = STATIONS[0].readout;
    setMode(m);
    setFeedback(FB[m]);
    if (startRef.current) startRef.current();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (now: number) => {
      const s = stRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = FIELD;
      ctx.fillRect(0, 0, W, H);

      const running = s.mode !== null;
      const seq = s.mode ? SEQ[s.mode] : [];
      const elapsed = running ? now - s.t0 : -1;
      const posOf = (i: number) => seq.indexOf(i);
      const arrival = (i: number) => posOf(i) * STEP;

      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('一条索引 ȳ，两条链', 56, 44);
      ctx.fillText('训练侧 · 改训练数据', 646, 52);
      ctx.fillText('推理侧 · 改检索打分', 646, 388);

      for (const e of EDGES) {
        const pa = running ? posOf(e.a) : -1;
        const pb = running ? posOf(e.b) : -1;
        const adjacent = pa >= 0 && pb === pa + 1;
        let prog = 0;
        if (adjacent) {
          const arr = arrival(e.b);
          prog = elapsed >= arr ? 1 : elapsed >= arr - FLOW ? (elapsed - (arr - FLOW)) / FLOW : 0;
        }
        drawEdge(ctx, e, prog, COLOR[e.side], now);
      }

      for (let i = 0; i < STATIONS.length; i++) {
        const pos = running ? posOf(i) : -1;
        const arr = arrival(i);
        const arrived = pos >= 0 && elapsed >= arr;
        const pulseT = arrived && elapsed < arr + PULSE ? (elapsed - arr) / PULSE : null;
        drawStation(ctx, STATIONS[i], i, { arrived, pulseT, bypass: running && pos < 0 });
      }

      let last = -1;
      if (running) {
        for (const i of seq) {
          if (elapsed >= arrival(i)) last = i;
        }
      }
      if (last >= 0) {
        const txt = STATIONS[last].readout;
        if (readRef.current !== txt) readRef.current = txt;
      }

      ctx.fillStyle = TEXT;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(readRef.current, 56, 412);
    };
    const tick = () => {
      render(performance.now());
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
    startRef.current = start;
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      startRef.current = null;
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={mode === 'all' ? 'active' : ''} onClick={() => run('all')}>
          跑一遍
        </button>
        <button className={mode === 'train' ? 'active' : ''} onClick={() => run('train')}>
          只看训练侧
        </button>
        <button className={mode === 'infer' ? 'active' : ''} onClick={() => run('infer')}>
          只看推理侧
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { StageCanvas, TimeBar } from '../live/TimeBar';
import { useTimeline } from '../live/timeline';
import { clamp, rgba, rr, txt, useStage, markDirectInput, type Frame } from '../live/stage';
import { C, Feedback, Range, Readout, Seg, SpeedSeg, Swatch, Tag, type Speed } from './sv-kit';
import { COLS, ROWS, QUESTIONS, inRegion, paintStreet, salience, type Q } from './sv-m2-agnostic';
import type { WidgetProps } from './registry';

// 4.1 打分：每个评分员对 96 个图块的注意力（一行 P）→ 对评分员求平均 → 排序 → 保留前 k 个。
// 示意数据：沿用 2.1 的街景与问题；注意力按“评分员关心的区域 + 少量显著度”生成。画面、读数、反馈由同一个进度 p 驱动。

const RATERS: Record<Q, { w: string; focus: [number, number, number, number]; spread: number }[]> = {
  sign: [
    { w: 'blue', focus: [9, 1, 11, 2], spread: 2.4 },
    { w: 'sign', focus: [9, 1, 11, 2], spread: 1.2 },
    { w: 'written', focus: [9, 1, 11, 2], spread: 3.5 },
  ],
  bus: [
    { w: 'many', focus: [2, 5, 8, 6], spread: 4 },
    { w: 'buses', focus: [2, 5, 8, 6], spread: 1.4 },
    { w: 'image', focus: [0, 0, 11, 7], spread: 30 },
  ],
  roof: [
    { w: 'color', focus: [0, 1, 3, 2], spread: 3.2 },
    { w: 'roof', focus: [0, 1, 3, 2], spread: 1.2 },
  ],
};

function attnRow(focus: [number, number, number, number], spread: number) {
  const raw: number[] = [];
  const cx = (focus[0] + focus[2]) / 2;
  const cy = (focus[1] + focus[3]) / 2;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const inside = inRegion(c, r, focus) ? 1.2 : 0;
      raw.push(Math.exp(inside + 1.1 * Math.exp(-((c - cx) ** 2 + (r - cy) ** 2) / spread) + 0.6 * salience(c, r) + ((c * 5 + r * 11) % 7) * 0.03));
    }
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / s); // 这一行是一组注意力权重（示意），和为 1
}

const PHASES = [
  { at: 0, label: '① 取出 P 的各行' },
  { at: 0.32, label: '② 按列平均 → 分数 p̃' },
  { at: 0.56, label: '③ 排序取前 k' },
  { at: 0.8, label: '④ 剪掉其余' },
];
const SPEED_K: Record<Speed, number> = { slow: 0.6, mid: 1, fast: 1.7 };

export function SvScore(_: WidgetProps) {
  const [q, setQ] = useState<Q>('sign');
  const [k, setK] = useState(24);
  const [speed, setSpeed] = useState<Speed>('mid');
  const tl = useTimeline(10, SPEED_K[speed]);
  const raters = RATERS[q];
  const data = useMemo(() => {
    const rows = raters.map((r) => attnRow(r.focus, r.spread));
    const score = rows[0].map((_, j) => rows.reduce((a, row) => a + row[j], 0) / rows.length);
    const order = score.map((v, j) => [v, j] as [number, number]).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
    const rank = new Array<number>(score.length);
    order.forEach((j, i) => (rank[j] = i));
    return { rows, score, rank };
  }, [raters]);
  const region = QUESTIONS.find((x) => x.value === q)!.region;
  const regionCells = (region[2] - region[0] + 1) * (region[3] - region[1] + 1);
  let hit = 0;
  data.rank.forEach((rk, j) => {
    if (rk < k && inRegion(j % COLS, Math.floor(j / COLS), region)) hit++;
  });

  const draw = (f: Frame) => {
    const more = tl.tick(f.dt);
    paint(f, tl.pRef.current, data, raters.map((r) => r.w), k);
    return more;
  };
  const stage = useStage({ heightOf: (w) => (w >= 620 ? Math.round(w * 0.5) : Math.round(w * 1.15)), draw, live: tl.playing }, [data, k, tl.playing ? -1 : tl.p, tl.playing]);
  React.useEffect(() => {
    if (stage.animate) tl.onVisible(true);
  }, [stage.animate]); // eslint-disable-line react-hooks/exhaustive-deps

  const phase = tl.p < 0.32 ? 0 : tl.p < 0.56 ? 1 : tl.p < 0.8 ? 2 : 3;
  const fbs = [
    `代码在剪枝层算出注意力后，只取评分员（${raters.map((r) => r.w).join('、')}）这几行、视觉 token 这几列；每一行就是一个评分员“看”各个图块的权重。`,
    '对评分员求平均（Eq. 3），得到每个图块一个分数 p̃；颜色越深分数越高。',
    `按分数排序，取前 k = ${k} 个（代码在每个剪枝层按配额 topk）。`,
    `其余 ${COLS * ROWS - k} 个图块从后续各层的输入里删除；问题区域保留了 ${hit} / ${regionCells} 块。`,
  ];

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <StageCanvas s={stage} label={`打分过程：评分员 ${raters.map((r) => r.w).join('、')} 的注意力求平均后保留前 ${k} 个图块`} />
          <TimeBar tl={tl} phases={PHASES} label="打分进度" extra={<SpeedSeg value={speed} onChange={setSpeed} />} />
        </div>
        <div className="lv-side">
          <span className="sv-k">问题（与 2.1 同一张示意街景）</span>
          <Seg label="问题" value={q} onChange={setQ} options={QUESTIONS.map((x) => ({ value: x.value, label: x.label }))} />
          <Range
            label="保留个数 k"
            value={k}
            min={6}
            max={60}
            onChange={(v) => {
              markDirectInput();
              setK(v);
            }}
            display={`${k} / ${COLS * ROWS}`}
          />
          <div className="sv-reads">
            <Readout label="评分员" value={raters.length} tone="rater" sub={raters.map((r) => r.w).join(' · ')} />
            <Readout label="问题区域保留" value={`${hit} / ${regionCells}`} tone={hit / regionCells >= 0.8 ? 'green' : 'amber'} />
          </div>
          <Feedback k={`${phase}-${q}`}>{fbs[phase]}</Feedback>
          <div className="sv-legend">
            <span>
              <Swatch color={C.rater} />
              注意力 / 分数（越深越高）
            </span>
            <span>
              <Swatch color={C.vis} />
              保留（实线框）
            </span>
            <span>
              <Swatch color={C.pruned} dashed />
              剪掉
            </span>
          </div>
          <p className="sv-small">
            <Tag kind="demo" /> 96 个图块、2–3 个评分员与注意力数值均为示意；计算顺序（头平均 → 评分员行 → 平均 → topk）与 score.py 一致 <Tag kind="code" />。
          </p>
        </div>
      </div>
    </div>
  );
}

function paint(f: Frame, p: number, data: { rows: number[][]; score: number[]; rank: number[] }, words: string[], k: number) {
  const { ctx, w, h } = f;
  const wide = w >= 620;
  const a = clamp(p / 0.32, 0, 1);
  const b = clamp((p - 0.32) / 0.24, 0, 1);
  const c = clamp((p - 0.56) / 0.24, 0, 1);
  const d = clamp((p - 0.8) / 0.2, 0, 1);
  const R = data.rows.length;
  // 小图：每个评分员一行 P（排成一列或一行）
  const small = wide ? { x: 14, y: 26, w: Math.min(190, w * 0.28, ((h - 30) / R - 24) * (COLS / ROWS)) } : { x: 14, y: 26, w: (w - 28 - (R - 1) * 10) / R };
  const sh = small.w * (ROWS / COLS);
  const bigX = wide ? small.x + small.w + 50 : 14;
  const bigY = wide ? 26 : small.y + sh + 44;
  const bigW = wide ? w - bigX - 14 : w - 28;
  const bigH = Math.min(bigW * (ROWS / COLS), h - bigY - 12);
  const bw = bigH * (COLS / ROWS);
  txt(ctx, wide ? 'P 的各行' : 'P 的各行（每个评分员一行）', small.x, 12, { size: 12, weight: 700, color: C.muted });
  const maxRow = Math.max(...data.rows.flat());
  const maxScore = Math.max(...data.score);
  data.rows.forEach((row, i) => {
    const show = clamp(a * R - i, 0, 1);
    const ox = wide ? small.x : small.x + i * (small.w + 10);
    const oy = wide ? small.y + i * (sh + 22) : small.y;
    if (wide && oy + sh > h) return;
    const cw = small.w / COLS;
    const chh = sh / ROWS;
    ctx.save();
    ctx.globalAlpha = 0.2 + 0.8 * show;
    paintStreet(ctx, (cc) => ox + cc * cw, (r) => oy + r * chh, cw, chh, w, h, 0);
    for (let j = 0; j < row.length; j++) {
      const v = row[j] / maxRow;
      ctx.fillStyle = rgba(C.rater, (0.04 + 0.86 * Math.pow(v, 1.6)) * show);
      ctx.fillRect(ox + (j % COLS) * cw, oy + Math.floor(j / COLS) * chh, cw, chh);
    }
    ctx.restore();
    txt(ctx, words[i], ox + 2, oy + sh + 10, { size: 12, weight: 800, color: C.rater });
  });
  // 箭头
  if (wide) {
    ctx.fillStyle = C.line2;
    txt(ctx, '平均 →', small.x + small.w + 25, bigY + bigH / 2, { size: 13, weight: 800, color: b > 0 ? C.ink : C.faint, align: 'center' });
  }
  // 大图：分数 p̃、排序与保留
  const cw = bw / COLS;
  const chh = bigH / ROWS;
  const X = (cc: number) => bigX + cc * cw;
  const Y = (r: number) => bigY + r * chh;
  paintStreet(ctx, X, Y, cw, chh, w, h, 0);
  // 分数阶段先给底图罩一层白，热度才看得清
  if (b > 0) {
    ctx.fillStyle = rgba('#ffffff', 0.5 * b * (1 - 0.6 * d));
    ctx.fillRect(bigX, bigY, bw, bigH);
  }
  for (let j = 0; j < data.score.length; j++) {
    const cc = j % COLS;
    const r = Math.floor(j / COLS);
    const v = data.score[j] / maxScore;
    const kept = data.rank[j] < k;
    // ② 分数热度
    ctx.fillStyle = rgba(C.rater, (0.04 + 0.86 * Math.pow(v, 1.6)) * b * (1 - 0.7 * d));
    ctx.fillRect(X(cc), Y(r), cw, chh);
    // ③ 排名进度：前 k 个依次点亮
    const lit = c * (k + 4) - data.rank[j];
    if (kept && lit > 0) {
      ctx.strokeStyle = rgba(C.vis, Math.min(1, lit));
      ctx.lineWidth = 2;
      ctx.strokeRect(X(cc) + 1, Y(r) + 1, cw - 2, chh - 2);
    }
    // ④ 剪掉其余
    if (!kept && d > 0) {
      ctx.fillStyle = rgba('#eef1f6', 0.85 * d);
      ctx.fillRect(X(cc), Y(r), cw, chh);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = rgba(C.prunedLine, 0.5 * d);
      ctx.strokeRect(X(cc) + 1, Y(r) + 1, cw - 2, chh - 2);
      ctx.restore();
    }
  }
  ctx.strokeStyle = C.stageLine;
  ctx.lineWidth = 1;
  rr(ctx, bigX, bigY, bw, bigH, 6);
  ctx.stroke();
  const bigLabel = b > 0 ? (d > 0 ? `保留前 ${k} 个，其余剪掉` : c > 0 ? `排序：前 ${k} 个` : '分数 p̃（越深越高）') : '分数 p̃';
  // 窄画布时小图在上、大图在下：“对评分员求平均”与大图标题合成一行，避免两行叠在一起
  txt(ctx, wide ? bigLabel : `↓ 对评分员求平均 → ${bigLabel}`, bigX, bigY - 14, { size: 12, weight: wide ? 700 : 800, color: wide || b > 0 ? C.ink : C.faint });
}

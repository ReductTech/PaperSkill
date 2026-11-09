import React, { useMemo, useState } from 'react';
import { StageCanvas } from '../live/TimeBar';
import { Anim, arrowLine, rgba, rng, txt, useStage, type Frame } from '../live/stage';
import { Btn, C, Feedback, Readout, Seg, SpeedSeg, Swatch, Tag, useLiveVisible, useStepper, type Speed } from './sv-kit';
import { CLUSTER_DIV, RECYCLE_RATIO } from './sv-data';
import type { WidgetProps } from './registry';

// 6.1 回收七步。90 个被删 token 的二维位置与分数是示意数据；之后的每一步都按 utils.py 的同一套公式在这 90 个点上真实计算：
// 回收数 int(90 × 0.3) + 1 = 28，簇数 int(28 / 10) + 1 = 3；k 近邻取 k = 簇数（含自身，与 torch.topk 一致）；
// ρ = exp(−mean(d²))；δ = 到更密点的最近距离（最密点取全局最大距离）；score = ρ·δ 取前 C 个为中心；按欧氏距离归簇；组内平均。
// 画面、读数、步骤列表与反馈由同一个 step 状态驱动。

const STEPS = ['① 被删池', '② 取前 30%', '③ 密度 ρ', '④ 距离 δ', '⑤ 选中心', '⑥ 归簇', '⑦ 合并'];
const N_DEL = 90;

interface Pt {
  x: number;
  y: number;
  s: number;
}

function makeData() {
  const rand = rng(2025);
  const blobs = [
    { x: 0.28, y: 0.32, s: 0.09, w: 0.9 },
    { x: 0.66, y: 0.28, s: 0.08, w: 0.7 },
    { x: 0.55, y: 0.7, s: 0.1, w: 0.55 },
    { x: 0.18, y: 0.75, s: 0.07, w: 0.25 },
  ];
  const gauss = () => {
    const u = Math.max(1e-9, rand());
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pts: Pt[] = [];
  for (let i = 0; i < N_DEL; i++) {
    const b = blobs[i % blobs.length];
    pts.push({ x: Math.min(0.95, Math.max(0.05, b.x + gauss() * b.s)), y: Math.min(0.93, Math.max(0.07, b.y + gauss() * b.s)), s: b.w * (0.6 + 0.4 * rand()) + 0.15 * rand() });
  }
  return pts;
}

function compute(pts: Pt[]) {
  const nRec = Math.floor(N_DEL * RECYCLE_RATIO) + 1;
  const C_ = Math.floor(nRec / CLUSTER_DIV) + 1;
  const order = pts.map((p, i) => [p.s, i] as [number, number]).sort((a, b) => b[0] - a[0]);
  const rec = order.slice(0, nRec).map((x) => x[1]);
  const P = rec.map((i) => pts[i]);
  const dimNorm = Math.sqrt(2); // 代码：距离除以 √(特征维度)
  const D = P.map((a) => P.map((b) => Math.hypot(a.x - b.x, a.y - b.y) / dimNorm));
  const knn = D.map((row) => row.map((d, j) => [d, j] as [number, number]).sort((a, b) => a[0] - b[0]).slice(0, C_));
  const rho = knn.map((nb) => Math.exp(-nb.reduce((a, [d]) => a + d * d, 0) / C_));
  const dmax = Math.max(...D.flat());
  const delta: number[] = [];
  const parent: number[] = [];
  for (let i = 0; i < P.length; i++) {
    let best = dmax;
    let pj = -1;
    for (let j = 0; j < P.length; j++)
      if (rho[j] > rho[i] && D[i][j] < best) {
        best = D[i][j];
        pj = j;
      }
    delta.push(best);
    parent.push(pj);
  }
  const score = rho.map((r, i) => r * delta[i]);
  const centers = score.map((s, i) => [s, i] as [number, number]).sort((a, b) => b[0] - a[0]).slice(0, C_).map((x) => x[1]);
  const assign = P.map((_, i) => {
    const at = centers.indexOf(i);
    if (at >= 0) return at;
    let best = 0;
    for (let c = 1; c < centers.length; c++) if (D[i][centers[c]] < D[i][centers[best]]) best = c;
    return best;
  });
  const groups = centers.map((_, c) => P.filter((__, i) => assign[i] === c));
  const mean = groups.map((g) => ({ x: g.reduce((a, p) => a + p.x, 0) / g.length, y: g.reduce((a, p) => a + p.y, 0) / g.length, n: g.length }));
  return { rec, P, C_, nRec, knn, rho, delta, parent, centers, assign, mean };
}

export function SvRecycle(_: WidgetProps) {
  const pts = useMemo(makeData, []);
  const r = useMemo(() => compute(pts), [pts]);
  const [speed, setSpeed] = useState<Speed>('mid');
  const [merge, setMerge] = useState<'mean' | 'sum'>('mean');
  const [visRef, visible] = useLiveVisible<HTMLDivElement>('0px');
  const st = useStepper(STEPS.length, visible, speed);
  const step = st.step;
  const anim = useMemo(() => new Anim(), []);
  const draw = (f: Frame) => {
    anim.begin();
    paint(f, anim, pts, r, step, merge);
    return anim.moving;
  };
  const stage = useStage({ heightOf: (w) => Math.round(Math.min(420, Math.max(260, w * 0.62))), draw }, [step, merge]);

  const fbs = [
    `这一层删掉了 ${N_DEL} 个视觉 token（示意）。点的大小表示它在打分里的分数 p̃。`,
    `按分数取前 int(${N_DEL} × 0.3) + 1 = ${r.nRec} 个进回收池，其余 ${N_DEL - r.nRec} 个彻底丢弃。`,
    `簇数 C = int(${r.nRec} / 10) + 1 = ${r.C_}。每个点找 k = C 个近邻（含自己），近邻越近，密度 ρ 越大（光晕越大）。`,
    '每个点连到“比自己更密的最近点”，这段距离就是 δ；最密的点没有更密的点，取全局最大距离。',
    `按 ρ × δ 排序，取前 ${r.C_} 个当簇中心（星形）：它们又密、又离更密的点远。`,
    '其余点按欧氏距离分给最近的中心（论文正文写的是余弦相似度，代码用的是欧氏距离）。',
    merge === 'mean'
      ? `每簇平均成 1 个新 token（青色），共 ${r.C_} 个，插回保留的视觉 token 之后。平均后的点仍落在原来的点群里。`
      : '按 Eq. (10) 逐元素求和：向量长度约放大为组内 token 数倍，落到原有点群之外（示意坐标以画布中心为原点）。代码实际用的是平均。',
  ];

  return (
    <div className="sv-live sv-mod" ref={visRef}>
      <div className="lv-split">
        <div className="sv-col">
          <StageCanvas s={stage} label={`回收第 ${step + 1} 步：${STEPS[step]}`} />
          <div className="sv-row">
            <Btn onClick={st.prev} disabled={step === 0}>
              上一步
            </Btn>
            <Btn primary onClick={st.playing ? st.pause : st.play}>
              {st.playing ? '暂停' : step >= STEPS.length - 1 ? '从头播放' : '自动播放'}
            </Btn>
            <Btn onClick={st.next} disabled={step === STEPS.length - 1}>
              下一步
            </Btn>
            <SpeedSeg value={speed} onChange={setSpeed} />
          </div>
          <div className="lv-tbar-phases" role="group" aria-label="回收步骤">
            {STEPS.map((s, i) => (
              <button key={s} type="button" className={`lv-ph ${i === step ? 'is-cur' : ''}`} aria-pressed={i === step} onClick={() => st.setStep(i)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="lv-side">
          <div className="sv-reads">
            <Readout label="被删" value={N_DEL} />
            <Readout label="回收池" value={r.nRec} tone="merged" sub="int(删除数 × 0.3) + 1" />
            <Readout label="簇数 = 新 token" value={r.C_} tone="merged" sub="int(回收数 / 10) + 1" />
          </div>
          <Feedback k={`${step}-${merge}`}>{fbs[step]}</Feedback>
          {step === STEPS.length - 1 ? (
            <Seg
              label="合并方式"
              value={merge}
              onChange={setMerge}
              options={[
                { value: 'mean', label: '平均（代码）' },
                { value: 'sum', label: '求和（Eq. 10）' },
              ]}
            />
          ) : null}
          <div className="sv-legend">
            <span>
              <Swatch color={C.pruned} dashed />
              丢弃
            </span>
            <span>
              <Swatch color={C.pool} />
              回收池
            </span>
            <span>
              <Swatch color={C.merged} />
              合并后的 token
            </span>
          </div>
          <p className="sv-small">
            <Tag kind="demo" /> 点的位置与分数为示意（真实是 4096 维隐藏状态）；<Tag kind="code" /> 每一步的公式与常数取自 utils.py 与 modelling_sparse_llama.py。
          </p>
        </div>
      </div>
    </div>
  );
}

type R = ReturnType<typeof compute>;
const HUES = ['#0f97a6', '#3b7dd8', '#7a5bd6', '#d0832a', '#3aa36b'];

function paint(f: Frame, anim: Anim, pts: Pt[], r: R, step: number, merge: 'mean' | 'sum') {
  const { ctx, w, h, dt, final } = f;
  const pad = 22;
  const X = (x: number) => pad + x * (w - pad * 2);
  const Y = (y: number) => pad + y * (h - pad * 2);
  const inRec = new Set(r.rec);
  const maxRho = Math.max(...r.rho);
  // 丢弃的点
  pts.forEach((p, i) => {
    const isRec = inRec.has(i);
    const fade = anim.to(`f${i}`, step >= 1 && !isRec ? 0.18 : 1, dt, final, 10);
    if (isRec && step >= 6) return;
    const rad = 3 + p.s * 4;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = isRec && step >= 1 ? C.pool : C.pruned;
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.setLineDash(isRec && step >= 1 ? [] : [2, 2]);
    ctx.strokeStyle = isRec && step >= 1 ? C.merged : C.prunedLine;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });
  // 回到合并之前的步骤时，把合并动画的起点复位，下次进入第 ⑦ 步会重新播放
  if (step < 6) {
    r.P.forEach((_, i) => anim.to(`m${i}`, 0, dt, true));
    r.mean.forEach((m, c) => {
      anim.to(`cx${c}`, m.x, dt, true);
      anim.to(`cy${c}`, m.y, dt, true);
    });
  }
  if (step < 2) return;
  const P = r.P;
  // ③ 密度：近邻连线 + 光晕
  P.forEach((p, i) => {
    const k = r.rho[i] / maxRho;
    const halo = anim.to(`h${i}`, step >= 2 ? 1 : 0, dt, final, 8);
    ctx.fillStyle = rgba(C.merged, 0.12 * halo);
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), (6 + 18 * k) * halo, 0, Math.PI * 2);
    ctx.fill();
    if (step === 2) {
      r.knn[i].forEach(([, j]) => {
        if (j === i) return;
        ctx.strokeStyle = rgba(C.merged, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X(p.x), Y(p.y));
        ctx.lineTo(X(P[j].x), Y(P[j].y));
        ctx.stroke();
      });
    }
  });
  // ④ 距离 δ：指向更密的最近点
  if (step === 3 || step === 4) {
    P.forEach((p, i) => {
      const j = r.parent[i];
      if (j < 0) {
        txt(ctx, '最密', X(p.x) + 8, Y(p.y) - 10, { size: 11, weight: 800, color: C.merged });
        return;
      }
      arrowLine(ctx, X(p.x), Y(p.y), X(P[j].x), Y(P[j].y), 1, rgba(C.ink, step === 3 ? 0.55 : 0.2), 1.3, 6);
    });
  }
  // ⑤ 中心
  if (step >= 4 && step < 6) {
    r.centers.forEach((ci, c) => star(ctx, X(P[ci].x), Y(P[ci].y), 10, HUES[c % HUES.length]));
  }
  // ⑥ 归簇
  if (step === 5) {
    P.forEach((p, i) => {
      const ci = r.centers[r.assign[i]];
      ctx.strokeStyle = rgba(HUES[r.assign[i] % HUES.length], 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(X(p.x), Y(p.y));
      ctx.lineTo(X(P[ci].x), Y(P[ci].y));
      ctx.stroke();
      ctx.fillStyle = HUES[r.assign[i] % HUES.length];
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // ⑦ 合并：各点移向组内平均位置（或求和位置）
  if (step >= 6) {
    P.forEach((p, i) => {
      const c = r.assign[i];
      const m = r.mean[c];
      const tx = merge === 'mean' ? m.x : 0.5 + (m.x - 0.5) * m.n;
      const ty = merge === 'mean' ? m.y : 0.5 + (m.y - 0.5) * m.n;
      const k = anim.to(`m${i}`, 1, dt, final, 7);
      const x = p.x + (tx - p.x) * k;
      const y = p.y + (ty - p.y) * k;
      ctx.fillStyle = rgba(HUES[c % HUES.length], 0.35 * (1 - k));
      ctx.beginPath();
      ctx.arc(X(x), Y(y), 4, 0, Math.PI * 2);
      ctx.fill();
    });
    r.mean.forEach((m, c) => {
      const tx = merge === 'mean' ? m.x : 0.5 + (m.x - 0.5) * m.n;
      const ty = merge === 'mean' ? m.y : 0.5 + (m.y - 0.5) * m.n;
      const ax = anim.to(`cx${c}`, tx, dt, final, 7);
      const ay = anim.to(`cy${c}`, ty, dt, final, 7);
      const px = Math.min(w - 14, Math.max(14, X(ax)));
      const py = Math.min(h - 14, Math.max(14, Y(ay)));
      const out = px !== X(ax) || py !== Y(ay);
      ctx.fillStyle = out ? C.red : C.merged;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      txt(ctx, out ? `×${m.n}，超出画布 →` : `${m.n} 个 → 1`, px + (px > w - 120 ? -12 : 12), py, { size: 11.5, weight: 800, color: out ? C.red : C.merged, align: px > w - 120 ? 'right' : 'left' });
    });
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

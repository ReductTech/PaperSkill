import React, { useMemo, useState } from 'react';
import { StageCanvas } from '../live/TimeBar';
import { Anim, rgba, rr, txt, useStage, type Frame } from '../live/stage';
import { C, Feedback, Range, Readout, Seg, Swatch, Tag } from './sv-kit';
import { BUDGETS, D_FFN, D_MODEL, METHODS, N_LAYERS, NONVIS_FIT, SCHEDULE, TABLE1, VANILLA, layerFlops, prefillTFlops, scheduleSteps, type Budget, type Method } from './sv-data';
import type { WidgetProps } from './registry';

// ---------------------------------------------------------------- 9.1 FLOPs 复算器
type Cfg = 'vanilla' | '192' | '128' | '64';

export function SvFlops(_: WidgetProps) {
  const [cfg, setCfg] = useState<Cfg>('128');
  const [nonVis, setNonVis] = useState(NONVIS_FIT);
  const van = prefillTFlops(new Array(N_LAYERS).fill(576), nonVis);
  const b = cfg === 'vanilla' ? null : (Number(cfg) as Budget);
  const steps = b ? scheduleSteps(SCHEDULE[b]) : scheduleSteps([576, 576, 576]);
  const vis = steps.map((s) => s.enter);
  const ours = prefillTFlops(vis, nonVis);
  const uniform = b ? prefillTFlops(new Array(N_LAYERS).fill(b), nonVis) : van;
  const paper = b ? TABLE1[b].SparseVLM.flops : VANILLA.flops;
  const maxLayer = layerFlops(576 + nonVis);
  // 三项拆分（整次预填充）
  const parts = vis.reduce(
    (a, v) => {
      const n = v + nonVis;
      a.proj += 4 * n * D_MODEL * D_MODEL;
      a.attn += 2 * n * n * D_MODEL;
      a.ffn += 3 * n * D_MODEL * D_FFN;
      return a;
    },
    { proj: 0, attn: 0, ffn: 0 }
  );
  const tot = parts.proj + parts.attn + parts.ffn;
  const diff = ours - paper;

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <div className="sv-fl-cols" role="img" aria-label={`每层 FLOPs：${cfg === 'vanilla' ? '原模型' : `${cfg} 档`}，合计 ${ours.toFixed(2)} T`}>
            {vis.map((v, l) => (
              <div key={l} className="sv-fl-col" title={`第 ${l} 层：${v} 个视觉 token`}>
                <span className="sv-fl-van" />
                <span className="sv-fl-our" style={{ height: `${(layerFlops(v + nonVis) / maxLayer) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="sv-fl-axis">
            <span>第 0 层</span>
            <span>第 31 层</span>
          </div>
          <div className="sv-legend">
            <span>
              <Swatch color={C.vis} />
              {cfg === 'vanilla' ? '原模型每层' : 'SparseVLM 每层'}
            </span>
            <span>
              <Swatch color={C.stageLine} />
              原模型每层（满格）
            </span>
          </div>
          <div className="sv-fl-split">
            {[
              { k: '投影 4nd²', v: parts.proj, c: C.vis },
              { k: '注意力 2n²d', v: parts.attn, c: C.rater },
              { k: 'FFN 3ndm', v: parts.ffn, c: C.text },
            ].map((x) => (
              <span key={x.k} style={{ flexGrow: x.v / tot, background: x.c }} title={`${x.k}：${((x.v / tot) * 100).toFixed(1)}%`}>
                {x.v / tot > 0.12 ? `${x.k} ${((x.v / tot) * 100).toFixed(0)}%` : ''}
              </span>
            ))}
          </div>
          <p className="sv-small">三项占比：注意力一项与 n² 成正比，但 n 只有几百时它只占约 {((parts.attn / tot) * 100).toFixed(0)}%。</p>
        </div>
        <div className="lv-side">
          <Seg
            label="配置"
            value={cfg}
            onChange={setCfg}
            options={[
              { value: 'vanilla', label: '原模型' },
              ...BUDGETS.map((x) => ({ value: String(x) as Cfg, label: `${x} 档` })),
            ]}
          />
          <Range label="图像之外的 token 数" value={nonVis} min={40} max={300} step={1} onChange={setNonVis} display={`${nonVis}${nonVis === NONVIS_FIT ? '（反推值）' : ''}`} />
          <div className="sv-reads">
            <Readout label="本页复算（T）" value={ours.toFixed(2)} tone="blue" sub="代码计数式" />
            <Readout label="表 1（T）" value={paper.toFixed(2)} tone="green" sub="论文实测" />
            <Readout label="相对原模型" value={`${((ours / van) * 100).toFixed(1)}%`} sub={`表 1：${((paper / VANILLA.flops) * 100).toFixed(1)}%`} />
            {b ? <Readout label={`对照：32 层每层都 ${b} 个`} value={uniform.toFixed(2)} tone="amber" sub={`表 1 ToMe：${TABLE1[b].ToMe.flops} T`} /> : null}
          </div>
          <Feedback tone={Math.abs(diff) <= 0.03 ? 'ok' : 'warn'} k={`${cfg}-${Math.abs(diff) <= 0.03}`}>
            {Math.abs(diff) <= 0.03
              ? `复算 ${ours.toFixed(2)} T，与表 1 的 ${paper.toFixed(2)} T 相差 ${Math.abs(diff).toFixed(2)} T。${b ? `同样标“${b} 个”，若 32 层每层都只有 ${b} 个（ToMe 在进入语言模型之前就合并，接近这种情况），只要 ${uniform.toFixed(2)} T——SparseVLM 前 3 层满 576 个，所以同档 FLOPs 更高。` : ''}`
              : `图像之外取 ${nonVis} 个时复算为 ${ours.toFixed(2)} T，与表 1 差 ${diff.toFixed(2)} T。表中数字对应约 118 个（本页反推），论文没有报告文本长度。`}
          </Feedback>
          <p className="sv-small">
            <Tag kind="code" /> 计数式取自第 221 行（d = 4096，m = 11008，32 层）；<Tag kind="extrap" /> 复算与“每层都 R 个”的对照为本页计算；<Tag kind="paper" /> 表 1 TFLOPs。
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 9.2 精度 / FLOPs / 延迟
const MCOLOR: Record<Method | 'Vanilla', string> = { Vanilla: C.mVanilla, ToMe: C.mToMe, FastV: C.mFastV, PDrop: C.mPDrop, SparseVLM: C.mSparse };
interface Pt {
  id: string;
  m: Method | 'Vanilla';
  b: Budget | 576;
  acc: number;
  flops: number;
  lat: number;
}
const POINTS: Pt[] = [
  { id: 'Vanilla-576', m: 'Vanilla', b: 576, acc: 100, flops: VANILLA.flops, lat: VANILLA.lat },
  ...BUDGETS.flatMap((b) => METHODS.map((m) => ({ id: `${m}-${b}`, m, b, acc: TABLE1[b][m].avg, flops: TABLE1[b][m].flops, lat: TABLE1[b][m].lat }))),
];

export function SvTradeoff(_: WidgetProps) {
  const [axis, setAxis] = useState<'flops' | 'lat'>('flops');
  const [sel, setSel] = useState('SparseVLM-128');
  const p = POINTS.find((x) => x.id === sel)!;
  const anim = useMemo(() => new Anim(), []);
  const geo = useMemo(() => ({ hit: [] as { id: string; x: number; y: number }[] }), []);
  const draw = (f: Frame) => {
    anim.begin();
    paintScatter(f, anim, axis, sel, geo);
    return anim.moving;
  };
  const stage = useStage({ heightOf: (w) => Math.round(Math.min(380, Math.max(260, w * 0.6))), draw }, [axis, sel]);
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best: { id: string; d: number } | null = null;
    for (const h of geo.hit) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < 22 && (!best || d < best.d)) best = { id: h.id, d };
    }
    if (best) setSel(best.id);
  };
  const flopsCut = 1 - p.flops / VANILLA.flops;
  const latCut = 1 - p.lat / VANILLA.lat;

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <div className="sv-stage-wrap" onPointerUp={pick}>
            <StageCanvas s={stage} label={`散点：横轴为${axis === 'flops' ? '理论 FLOPs' : '实测延迟'}，纵轴为 8 项平均精度；选中 ${p.m} ${p.b}`} />
          </div>
          <div className="sv-pts" role="group" aria-label="数据点">
            {POINTS.map((x) => (
              <button key={x.id} type="button" aria-pressed={x.id === sel} onClick={() => setSel(x.id)}>
                <i className="sv-dot" style={{ background: MCOLOR[x.m] }} />
                {x.m === 'Vanilla' ? '原模型' : `${x.m} ${x.b}`}
              </button>
            ))}
          </div>
        </div>
        <div className="lv-side">
          <Seg
            label="横轴"
            value={axis}
            onChange={setAxis}
            options={[
              { value: 'flops', label: '理论 FLOPs（T）' },
              { value: 'lat', label: '实测延迟（ms）' },
            ]}
          />
          <div className="sv-reads">
            <Readout label="8 项平均" value={`${p.acc.toFixed(1)}%`} tone="green" />
            <Readout label="FLOPs" value={`${p.flops} T`} sub={p.m === 'Vanilla' ? '基准' : `−${(flopsCut * 100).toFixed(1)}%`} />
            <Readout label="延迟" value={`${p.lat} ms`} sub={p.m === 'Vanilla' ? '基准' : `${latCut >= 0 ? '−' : '+'}${Math.abs(latCut * 100).toFixed(1)}%`} />
          </div>
          <Feedback tone={p.m === 'PDrop' ? 'warn' : 'info'} k={sel}>
            {p.m === 'Vanilla'
              ? '原模型：576 个视觉 token、4.62 T、57.82 ms（单张 A100-80GB）。'
              : p.m === 'PDrop'
                ? `PDrop ${p.b}：FLOPs 比同档 SparseVLM 低（${p.flops} vs ${TABLE1[p.b as Budget].SparseVLM.flops} T），延迟却更高（${p.lat} vs ${TABLE1[p.b as Budget].SparseVLM.lat} ms）——实现方式对实测速度的影响不亚于 FLOPs。`
                : `理论 FLOPs 少 ${(flopsCut * 100).toFixed(1)}%，实测延迟少 ${(latCut * 100).toFixed(1)}%。两者不成比例，原因尚未拆分：论文没有给出分项耗时，固定代码的计时范围也与附录 F 的描述不同（见 §9 核对）。`}
          </Feedback>
          <p className="sv-small">
            <Tag kind="paper" /> 表 1 的精度、FLOPs 与延迟；<Tag kind="extrap" /> 降幅为本页按表计算。论文仅报告一组汇总结果，未交代批大小、重复运行次数和方差。
          </p>
        </div>
      </div>
    </div>
  );
}

function paintScatter(f: Frame, anim: Anim, axis: 'flops' | 'lat', sel: string, geo: { hit: { id: string; x: number; y: number }[] }) {
  const { ctx, w, h, dt, final } = f;
  const L = 46;
  const B = 34;
  const T = 14;
  const R = 14;
  const xs = POINTS.map((p) => (axis === 'flops' ? p.flops : p.lat));
  const xmin = axis === 'flops' ? 1 : 25;
  const xmax = axis === 'flops' ? 4.8 : 60;
  const ymin = 70;
  const ymax = 102;
  const X = (v: number) => L + ((v - xmin) / (xmax - xmin)) * (w - L - R);
  const Y = (v: number) => T + (1 - (v - ymin) / (ymax - ymin)) * (h - T - B);
  // 网格
  ctx.strokeStyle = C.stageLine;
  ctx.lineWidth = 1;
  for (let v = ymin; v <= ymax; v += 5) {
    ctx.beginPath();
    ctx.moveTo(L, Y(v));
    ctx.lineTo(w - R, Y(v));
    ctx.stroke();
    txt(ctx, `${v}%`, L - 6, Y(v), { size: 11, color: C.faint, align: 'right' });
  }
  const ticks = axis === 'flops' ? [1, 2, 3, 4] : [30, 40, 50, 60];
  ticks.forEach((t) => txt(ctx, axis === 'flops' ? `${t} T` : `${t} ms`, X(t), h - B + 14, { size: 11, color: C.faint, align: 'center' }));
  txt(ctx, axis === 'flops' ? '理论 FLOPs →' : '实测延迟 →', w - R, h - 8, { size: 11.5, weight: 700, color: C.muted, align: 'right' });
  txt(ctx, `8 项平均 ↑（纵轴从 ${ymin}% 起）`, L, 8, { size: 11.5, weight: 700, color: C.muted });
  // 同一方法按档位连线
  METHODS.forEach((m) => {
    const pts = POINTS.filter((p) => p.m === m);
    ctx.strokeStyle = rgba(MCOLOR[m], 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = anim.to(`x${p.id}`, X(axis === 'flops' ? p.flops : p.lat), dt, final, 9);
      const y = Y(p.acc);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  geo.hit = [];
  POINTS.forEach((p) => {
    const x = anim.to(`x${p.id}`, X(axis === 'flops' ? p.flops : p.lat), dt, final, 9);
    const y = Y(Math.max(ymin, p.acc));
    geo.hit.push({ id: p.id, x, y });
    const on = p.id === sel;
    ctx.fillStyle = MCOLOR[p.m];
    ctx.beginPath();
    ctx.arc(x, y, on ? 7.5 : 5, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();
      const label = p.m === 'Vanilla' ? '原模型' : `${p.m} ${p.b}`;
      ctx.save();
      ctx.font = `800 12px ${'system-ui, sans-serif'}`;
      const tw = ctx.measureText(label).width + 12;
      ctx.restore();
      const lx = Math.min(w - R - tw, Math.max(L, x + 12));
      const ly = y < T + 24 ? y + 18 : y - 18;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      rr(ctx, lx, ly - 10, tw, 20, 10);
      ctx.fill();
      txt(ctx, label, lx + 6, ly, { size: 12, weight: 800, color: C.blue });
    }
  });
}

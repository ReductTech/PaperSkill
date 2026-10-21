import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, rr, label, rgba, approach, toCanvas } from './stageKit';
import { LATENCY, MAIN, MainRow } from './paperData';
import { clamp, easeInOutQuad } from '../lib/canvasKit';
import { ChipGroup, useIsMobile, CanvasPan } from './ui';

// ============================================================================
//  模块 9.1（P8 结果赛跑）：按论文 Table 4 报告的单样本延迟同时出发
//  （速度只由实测延迟决定，与理论 FLOPs 无关）
// ============================================================================
const SCALE = 5.2; // 1 秒实测延迟 -> 5.2 秒动画

function raceLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 400, T0: 26, T1: 296, y0: 62, dy: 92, nameAbove: true, tx: 310 }
    : { W: 1080, H: 300, T0: 250, T1: 900, y0: 46, dy: 64, nameAbove: false, tx: 920 };
}

export const LatencyRace: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const Lay = useMemo(() => raceLayout(mobile), [mobile]);
  const LRef = useRef(Lay);
  LRef.current = Lay;
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const st = useRef({ run: 0, start: -1, lastRun: 0, doneSent: false });
  st.current.run = run;

  const canvasRef = useStage(Lay.W, Lay.H, (ctx, t) => {
    const s = st.current;
    const P = LRef.current;
    if (s.lastRun !== s.run) {
      s.lastRun = s.run;
      s.start = t;
      s.doneSent = false;
    }
    const el = s.start < 0 ? 0 : t - s.start;
    drawStage(ctx, P.W, P.H, t, 0.99);
    ctx.strokeStyle = 'rgba(232,238,248,0.5)';
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(P.T1, 16);
    ctx.lineTo(P.T1, P.H - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    let allDone = s.start >= 0;
    LATENCY.forEach((r, i) => {
      const y = P.y0 + i * P.dy;
      const col = r.fast ? C.good : C.emph;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      rr(ctx, P.T0 - 16, y - 18, P.T1 - P.T0 + 32, 36, 18);
      ctx.fill();
      if (P.nameAbove) label(ctx, r.name, P.T0 - 10, y - 32, 17, r.fast ? C.good : C.text, 'left', 700);
      else label(ctx, r.name, 30, y, 15, r.fast ? C.good : C.text, 'left', 700);
      const dur = r.lat * SCALE;
      const p = s.start < 0 ? 0 : clamp(el / dur, 0, 1);
      if (p < 1) allDone = false;
      const x = P.T0 + (P.T1 - P.T0) * easeInOutQuad(p);
      const tg = ctx.createLinearGradient(x - 160, 0, x, 0);
      tg.addColorStop(0, rgba(col, 0));
      tg.addColorStop(1, rgba(col, 0.55));
      ctx.fillStyle = tg;
      rr(ctx, Math.max(P.T0 - 16, x - 160), y - 5, Math.min(160, x - P.T0 + 16), 10, 5);
      ctx.fill();
      glow(ctx, x, y, 30, col, 0.7);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      const shown = p >= 1 ? r.lat : Math.min(r.lat, el / SCALE);
      label(ctx, `${shown.toFixed(3)} s`, P.tx, y - 9, mobile ? 18 : 15, p >= 1 ? col : C.muted, 'left', 800, true);
      if (p >= 1) label(ctx, `${r.score.toFixed(1)} · ${r.mem}G`, P.tx, y + 13, mobile ? 15 : 13, C.text, 'left', 700, true);
    });
    if (allDone && !s.doneSent) {
      s.doneSent = true;
      setTimeout(() => setDone(true), 0);
    }
  });

  return (
    <div>
      <CanvasPan fit>
        <canvas ref={canvasRef} width={Lay.W} height={Lay.H} aria-label="单样本推理延迟赛跑（Table 4）" />
      </CanvasPan>
      <div className="step-ctrl">
        <button
          className="tiny"
          onClick={() => {
            setDone(false);
            setRun((r) => r + 1);
          }}
        >
          {run === 0 ? '▶ 开跑' : '↻ 再跑一次'}
        </button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`}>
        {run === 0
          ? '按下「开跑」：四个配置处理同一道 A-OKVQA 选择题，速度只按 Table 4 报告的单样本延迟换算。注意这里的 FastV 是 K=0、R=50%，即进入语言模型前随机剪枝。'
          : done
          ? '13B + FastV（0.341 s）与原版 7B（0.344 s）速度基本追平，准确率 80.5 对 76.7；但显存 30G 对 19G，仍多 11G。7B + FastV 最快（0.230 s），准确率从 76.7 降到 75.3。'
          : '比赛进行中……绿色为 FastV（K=0、R=50%，随机剪枝）。'}
      </div>
      <div className="audit-table-wrap">
        <table className="paper">
          <thead>
            <tr>
              <th>Table 4 · 单张 A40 · A-OKVQA · FastV：K=0、R=50%</th>
              <th>总耗时</th>
              <th>显存</th>
              <th>准确率</th>
              <th>单样本延迟</th>
            </tr>
          </thead>
          <tbody>
            {LATENCY.map((r) => (
              <tr key={r.name} style={{ color: r.fast ? 'var(--green)' : undefined }}>
                <td>{r.name}</td>
                <td>{r.total}</td>
                <td>{r.mem}G</td>
                <td>{r.score.toFixed(1)}</td>
                <td>{r.lat.toFixed(3)} s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
//  模块 9.2（P5 点击散点）：论文报告的理论 FLOPs（B，按层平均）–平均分 前沿
// ============================================================================
const W2 = 1080;
const H2 = 380;
const PX0 = 90;
const PX1 = 760;
const PY0 = 30;
const PY1 = 330;
const FMAX = 165;
const YMIN = 38;
const YMAX = 76;

type Mk = '7B' | '13B' | 'QwenVL';
const MCOL: Record<Mk, string> = { '7B': C.img, '13B': C.sys, QwenVL: C.ins };
const MNAME: Record<Mk, string> = { '7B': 'LLaVA-1.5-7B', '13B': 'LLaVA-1.5-13B', QwenVL: 'Qwen-VL-Chat-7B' };
interface Pt extends MainRow {
  m: Mk;
  id: string;
}

const xOf = (f: number) => PX0 + (f / FMAX) * (PX1 - PX0);
const yOf = (v: number) => PY1 - ((v - YMIN) / (YMAX - YMIN)) * (PY1 - PY0);

export const Pareto: React.FC<WidgetProps> = () => {
  const pts: Pt[] = useMemo(
    () =>
      (Object.keys(MAIN) as Mk[]).flatMap((m) =>
        MAIN[m].map((r, i) => ({ ...r, m, id: `${m}-${i}` }))
      ),
    []
  );
  const [filter, setFilter] = useState<Mk | 'all'>('all');
  const [sel, setSel] = useState('13B-3');
  const st = useRef({ filter: 'all' as Mk | 'all', sel: '13B-3', hover: '', alpha: {} as Record<string, number> });
  st.current.filter = filter;
  st.current.sel = sel;

  const canvasRef = useStage(W2, H2, (ctx, t, dt) => {
    const s = st.current;
    drawStage(ctx, W2, H2, t, 0.99);
    // 网格
    ctx.strokeStyle = 'rgba(150,175,220,0.12)';
    for (let v = 40; v <= 75; v += 5) {
      ctx.beginPath();
      ctx.moveTo(PX0, yOf(v));
      ctx.lineTo(PX1, yOf(v));
      ctx.stroke();
      label(ctx, `${v}`, PX0 - 8, yOf(v), 12, C.muted, 'right', 700, true);
    }
    for (let f = 0; f <= 150; f += 25) label(ctx, `${f}B`, xOf(f), PY1 + 16, 12, C.muted, 'center', 700, true);
    // 7B 基线的参考十字：在它左上方 = 更省且更强
    const b7 = MAIN['7B'][0];
    ctx.fillStyle = 'rgba(60,207,142,0.07)';
    ctx.fillRect(PX0, PY0, xOf(b7.flops) - PX0, yOf(b7.avg) - PY0);
    ctx.strokeStyle = 'rgba(60,207,142,0.4)';
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(PX0, PY0, xOf(b7.flops) - PX0, yOf(b7.avg) - PY0);
    ctx.setLineDash([]);
    // 每个模型连线（按 FLOPs 排序）
    (Object.keys(MAIN) as Mk[]).forEach((m) => {
      const on = s.filter === 'all' || s.filter === m;
      const arr = pts.filter((p) => p.m === m && p.K !== 0).sort((a, b) => a.flops - b.flops);
      // 前沿：按 FLOPs 从小到大，只保留比所有更省配置得分更高的点
      const front: Pt[] = [];
      let best = -1;
      arr.forEach((p) => {
        if (p.avg > best) {
          front.push(p);
          best = p.avg;
        }
      });
      ctx.save();
      ctx.strokeStyle = rgba(MCOL[m], on ? 0.75 : 0.12);
      ctx.lineWidth = on ? 2.5 : 1.5;
      if (on) {
        ctx.shadowColor = MCOL[m];
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      front.forEach((p, i) => (i === 0 ? ctx.moveTo(xOf(p.flops), yOf(p.avg)) : ctx.lineTo(xOf(p.flops), yOf(p.avg))));
      ctx.stroke();
      ctx.restore();
    });
    // 点
    pts.forEach((p) => {
      const on = s.filter === 'all' || s.filter === p.m;
      const a = (s.alpha[p.id] = approach(s.alpha[p.id] ?? 1, on ? 1 : 0.15, dt, 6));
      const x = xOf(p.flops);
      const y = yOf(p.avg);
      const isSel = s.sel === p.id;
      const isHov = s.hover === p.id;
      const r = p.K === null ? 9 : 6;
      if (isSel) glow(ctx, x, y, 34, MCOL[p.m], 0.8);
      else if (isHov) glow(ctx, x, y, 22, MCOL[p.m], 0.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.K === 0 ? 'rgba(11,18,34,0.9)' : MCOL[p.m];
      ctx.strokeStyle = MCOL[p.m];
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (p.K === null) {
        // 基线：菱形
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
      } else ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (isSel) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 5 + Math.sin(t * 5), 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 右：选中点的四项分数（与基线对比）
    const p = pts.find((q) => q.id === s.sel);
    if (p) {
      const base = MAIN[p.m][0];
      const items: [string, number, number][] = [
        ['Nocaps', p.nocaps, base.nocaps],
        ['Flickr', p.flickr, base.flickr],
        ['A-OKVQA', p.aok, base.aok],
        ['MMMU', p.mmmu, base.mmmu],
      ];
      label(ctx, `${p.avg}`, 800, 60, 40, MCOL[p.m], 'left', 800, true);
      label(ctx, `${p.flops}B`, 1040, 60, 20, C.text, 'right', 800, true);
      items.forEach(([n, v, b], i) => {
        const y = 120 + i * 52;
        label(ctx, n, 800, y, 12, C.muted, 'left', 700);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, 800, y + 12, 240, 12, 6);
        ctx.fill();
        const frac = clamp(v / (b * 1.1), 0, 1);
        const d = v - b;
        const col = d >= -0.5 ? C.good : d >= -5 ? C.emph : C.bad;
        ctx.fillStyle = col;
        rr(ctx, 800, y + 12, Math.max(12, 240 * frac), 12, 6);
        ctx.fill();
        const bx = 800 + 240 * (1 / 1.1);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, y + 8);
        ctx.lineTo(bx, y + 28);
        ctx.stroke();
        label(ctx, `${v}${d === 0 ? '' : d > 0 ? ` (+${d.toFixed(1)})` : ` (${d.toFixed(1)})`}`, 1040, y, 12, col, 'right', 800, true);
      });
    }
  });

  const visible = pts.filter((p) => filter === 'all' || p.m === filter);
  const pickNear = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return '';
    const { x, y } = toCanvas(e, cv, W2, H2);
    let best = '';
    let bd = 18 * 18;
    visible.forEach((p) => {
      const d = (xOf(p.flops) - x) ** 2 + (yOf(p.avg) - y) ** 2;
      if (d < bd) {
        bd = d;
        best = p.id;
      }
    });
    return best;
  };
  const cycle = (dir: number) => {
    const arr = [...visible].sort((a, b) => a.flops - b.flops);
    const i = arr.findIndex((p) => p.id === sel);
    const n = arr[(i + dir + arr.length) % arr.length];
    if (n) setSel(n.id);
  };

  const p = pts.find((q) => q.id === sel) as Pt;
  const base = MAIN[p.m][0];
  const b7 = MAIN['7B'][0];
  const cfgText = p.K === null ? '完整模型（基线）' : `K=${p.K}，R=${Math.round((p.R as number) * 100)}%`;
  let extra = '';
  if (p.m === '13B' && p.K !== null && p.flops < b7.flops && p.avg > b7.avg)
    extra = `——理论 FLOPs 低于 LLaVA-1.5-7B 完整模型（${b7.flops}B），平均分却更高（${b7.avg}）。`;
  else if (p.K === 0) extra = '——K=0（进入语言模型前随机丢弃）在图像描述任务上损失明显；它同时改变了剪枝位置与排序依据。';
  if (p.m === '13B' && p.K === 2 && p.R === 0.75)
    extra += ' MMMU 36.4→38.1 是单次运行的小幅上升，不等于剪枝提升能力（论文称 development set；按 13B 基线 36.4 与 MMMU 论文验证集的分数比对，实为 900 题的验证集）。';
  const drop = base.avg - p.avg;
  const cls = p.K === null ? '' : drop <= 0.5 ? 'good' : drop <= 3 ? '' : 'bad';

  return (
    <div>
      <ChipGroup
        label="筛选模型"
        value={filter}
        onChange={(m) => {
          setFilter(m);
          if (m !== 'all' && !sel.startsWith(m + '-')) setSel(`${m}-3`);
        }}
        options={(['all', '7B', '13B', 'QwenVL'] as const).map((m) => ({ key: m, label: m === 'all' ? '全部模型' : MNAME[m] }))}
      />
      <CanvasPan>
      <canvas
        ref={canvasRef}
        width={W2}
        height={H2}
        tabIndex={0}
        aria-label="论文报告的理论 FLOPs 与平均分散点图：点击查看配置，左右方向键切换"
        onPointerMove={(e) => {
          const id = pickNear(e);
          st.current.hover = id;
          if (canvasRef.current) canvasRef.current.style.cursor = id ? 'pointer' : 'default';
        }}
        onPointerDown={(e) => {
          const id = pickNear(e);
          if (id) setSel(id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            cycle(e.key === 'ArrowLeft' ? -1 : 1);
          }
        }}
      />
      </CanvasPan>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => cycle(-1)}>
          ← 更省的配置
        </button>
        <span className="step-label">
          <b style={{ fontSize: '1.05rem' }}>{MNAME[p.m]}</b> · {cfgText}
        </span>
        <button className="tiny ghost" onClick={() => cycle(1)}>
          更贵的配置 →
        </button>
      </div>
      <div className={`feedback ${cls}`}>
        {MNAME[p.m]} · {cfgText}：Table 1 报告的理论 FLOPs {p.flops}B（{Math.round(p.ratio * 100)}%，按层平均的归一化量），平均分 {p.avg}（基线 {base.avg}）{extra || '。'}
        {' '}菱形为完整模型；空心点为 K=0；绿色虚线框内表示“比 7B 完整模型更省且更强”。
      </div>
    </div>
  );
};

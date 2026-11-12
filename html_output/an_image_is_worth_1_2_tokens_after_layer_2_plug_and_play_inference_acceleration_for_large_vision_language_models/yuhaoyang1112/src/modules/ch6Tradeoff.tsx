import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C, useStage, drawStage, glow, rr, label, rgba, approach, toCanvas, flopsReduction, MODEL_7B, MODEL_13B, mix, chartLayer,
  paperFlopsB, PAPER_13B,
} from './stageKit';
import { MAIN, OCR_CURVES, OCR_R } from './paperData';
import { clamp } from '../lib/canvasKit';
import { ChipGroup, Num, useIsMobile, CanvasPan, sliderFill } from './ui';
import { usePruning, setPoint } from './pruneState';
import { flopsStatus } from './ch5Prune';

const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();

function ramp(v: number) {
  const s = clamp(v / 0.85, 0, 1);
  if (s < 0.5) return mix('#edf3f7', '#76bcae', s / 0.5);
  return mix('#76bcae', '#155d60', (s - 0.5) / 0.5);
}

// ============================================================================
//  模块 6.1（P6 二维拖动 + 两个滑块）：K–R 平面上的理论 FLOPs 降幅
//  三种口径：13B 论文口径复算（默认，复现 Table 1）、13B 只计视觉、7B 教学（只计视觉）。
// ============================================================================
type Preset = 'paper13' | 'vis13' | 'vis7';
const PRESETS: { key: Preset; label: string; T: number }[] = [
  { key: 'paper13', label: '13B · 论文口径复算', T: 40 },
  { key: 'vis13', label: '13B · 只计视觉 token', T: 40 },
  { key: 'vis7', label: '7B · 教学（只计视觉）', T: 32 },
];
const RMAX = 0.95;
const BASE13 = paperFlopsB(0, 0, PAPER_13B);

function reduction(p: Preset, K: number, R: number) {
  if (p === 'paper13') return 1 - paperFlopsB(K, R, PAPER_13B) / BASE13;
  return flopsReduction(K, R, p === 'vis7' ? MODEL_7B : MODEL_13B);
}

function heatLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 384, GX0: 50, GX1: 404, GY0: 22, GY1: 330, panel: false }
    : { W: 1080, H: 360, GX0: 96, GX1: 690, GY0: 30, GY1: 316, panel: true };
}

export const KRHeatmap: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const L = useMemo(() => heatLayout(mobile), [mobile]);
  const LRef = useRef(L);
  LRef.current = L;
  const [preset, setPreset] = useState<Preset>('paper13');
  const shared = usePruning();
  const T = PRESETS.find((p) => p.key === preset)!.T;
  const pt = { K: Math.min(shared.K, T), R: shared.R };
  const setPt = (next: typeof pt | ((p: typeof pt) => typeof pt)) => {
    setPoint(typeof next === 'function' ? next(pt) : next);
  };
  const st = useRef({ preset: 'paper13' as Preset, pt: { K: 2, R: 0.5 } });
  const press = useRef<{ id: number; x: number; y: number } | null>(null);
  st.current.preset = preset;
  st.current.pt = pt;

  const grids = useMemo(() => {
    const out = {} as Record<Preset, number[][]>;
    PRESETS.forEach((p) => {
      out[p.key] = [];
      for (let k = 0; k <= p.T; k++) {
        const col: number[] = [];
        for (let r = 0; r <= 19; r++) col.push(reduction(p.key, k, (r / 19) * RMAX));
        out[p.key].push(col);
      }
    });
    return out;
  }, []);

  const baseMap = useMemo(() => chartLayer(L.W, L.H, ctx => {
    const { W, H, GX0, GX1, GY0, GY1, panel } = L;
    const PT = PRESETS.find((p) => p.key === preset)!.T;
    drawStage(ctx, W, H);
    const g = grids[preset];
    const cw = (GX1 - GX0) / (PT + 1);
    const ch = (GY1 - GY0) / 20;
    for (let k = 0; k <= PT; k++) {
      for (let r = 0; r <= 19; r++) {
        ctx.fillStyle = ramp(g[k][r]);
        ctx.fillRect(GX0 + k * cw, GY1 - (r + 1) * ch, cw + 0.5, ch + 0.5);
      }
    }
    // 等值线 25 / 50 / 75%
    [0.25, 0.5, 0.75].forEach((lv) => {
      ctx.strokeStyle = 'rgba(24,70,80,.56)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let started = false;
      for (let k = 0; k <= PT; k++) {
        if (reduction(preset, k, RMAX) < lv) {
          started = false;
          continue;
        }
        let lo = 0;
        let hi = 1;
        for (let it = 0; it < 22; it++) {
          const mid = (lo + hi) / 2;
          if (reduction(preset, k, mid) < lv) lo = mid;
          else hi = mid;
        }
        const x = GX0 + (k + 0.5) * cw;
        const y = GY1 - (hi / RMAX) * (GY1 - GY0);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
    // 论文实测配置
    const model = preset === 'vis7' ? '7B' : '13B';
    const base = MAIN[model][0].avg;
    const pts = MAIN[model].filter((r) => r.K !== null).map((r) => ({ K: r.K as number, R: r.R as number, drop: base - r.avg }));
    if (model === '13B') pts.push({ K: 0, R: 0.5, drop: NaN });
    pts.forEach((r) => {
      const x = GX0 + (r.K + 0.5) * cw;
      const y = GY1 - (r.R / RMAX) * (GY1 - GY0);
      const col = isNaN(r.drop) ? C.ins : r.drop <= 0.5 ? C.good : r.drop <= 3 ? C.emph : C.bad;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = rgba(col, 0.35);
      ctx.fill();
    });
  }), [L, preset, grids]);
  const canvasRef = useStage(L.W, L.H, (ctx, t) => {
    const { W, H, GX0, GX1, GY0, GY1, panel } = L;
    const s = st.current;
    const PT = T;
    const cw = (GX1 - GX0) / (PT + 1);
    ctx.drawImage(baseMap, 0, 0, W, H);
    // 准星
    const x = GX0 + (s.pt.K + 0.5) * cw;
    const y = GY1 - (s.pt.R / RMAX) * (GY1 - GY0);
    ctx.strokeStyle = 'rgba(26,53,73,.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GX0, y);
    ctx.lineTo(GX1, y);
    ctx.moveTo(x, GY0);
    ctx.lineTo(x, GY1);
    ctx.stroke();
    glow(ctx, x, y, 34, C.emph, 0.6 + 0.2 * Math.sin(t * 4));
    ctx.fillStyle = C.emph;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    const fs = W < 700 ? 15 : 12;
    for (const k of W < 700 ? [0, 10, 20, PT] : [0, 2, 5, 10, 20, PT]) label(ctx, `${k}`, GX0 + (k + 0.5) * cw, GY1 + 16, fs, C.muted, 'center', 700, true);
    for (const r of [0, 0.25, 0.5, 0.75, 0.9]) label(ctx, `${Math.round(r * 100)}%`, GX0 - 8, GY1 - (r / RMAX) * (GY1 - GY0), fs, C.muted, 'right', 700, true);
    label(ctx, 'K →', GX1, GY1 + 36, fs, C.muted, 'right', 700);
    label(ctx, 'R ↑', GX0 - 8, GY0 - 12, fs, C.muted, 'right', 700);

    if (panel) {
      const red = reduction(s.preset, s.pt.K, s.pt.R);
      label(ctx, `−${(red * 100).toFixed(1)}%`, 740, 80, 46, C.good, 'left', 800, true);
      if (s.preset === 'paper13') label(ctx, `${paperFlopsB(s.pt.K, s.pt.R).toFixed(1)}B`, 742, 138, 24, C.text, 'left', 800, true);
      ctx.fillStyle = '#dfe7ef';
      rr(ctx, 740, 170, 290, 12, 6);
      ctx.fill();
      const gg = ctx.createLinearGradient(740, 0, 1030, 0);
      gg.addColorStop(0, '#76bcae');
      gg.addColorStop(1, '#155d60');
      ctx.fillStyle = gg;
      rr(ctx, 740, 170, Math.max(12, 290 * red), 12, 6);
      ctx.fill();
      for (let q = 0; q < 100; q++) {
        ctx.fillStyle = ramp((q / 100) * 0.85);
        ctx.fillRect(740 + q * 2.9, 300, 3, 10);
      }
      label(ctx, '0%', 740, 290, 11, C.muted, 'left', 700, true);
      label(ctx, '85%', 1030, 290, 11, C.muted, 'right', 700, true);
    }
  }, false);

  const setFrom = (e: { clientX: number; clientY: number }) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x, y } = toCanvas(e, cv, L.W, L.H);
    if (x < L.GX0 - 14 || x > L.GX1 + 14 || y < L.GY0 - 14 || y > L.GY1 + 14) return;
    const cw = (L.GX1 - L.GX0) / (T + 1);
    const K = clamp(Math.floor((x - L.GX0) / cw), 0, T);
    const R = clamp(Math.round(((L.GY1 - y) / (L.GY1 - L.GY0)) * RMAX * 20) / 20, 0, 0.95);
    setPt({ K, R });
  };

  const red = reduction(preset, pt.K, pt.R);
  const model = preset === 'vis7' ? '7B' : '13B';
  const row = MAIN[model].find((r) => r.K === pt.K && r.R !== null && Math.abs((r.R as number) - pt.R) < 1e-6);
  const status = preset === 'paper13' ? flopsStatus(pt.K, pt.R) : null;
  let note: string;
  if (preset === 'paper13') note = `${status!.text}。B 值为“全模型公式 ÷ 层数”的归一化理论量，不是实测运算量。`;
  else if (preset === 'vis13') note = '只计 576 个视觉 token（n=576）：K=2、R=50% 时降幅约 48.1%，比论文口径（约 45%）高，因为没有计入不剪的文字 token。';
  else note = '7B 教学口径：只计 576 个视觉 token，只显示比例，不复现论文的 7B 基线 99.3B。';
  let fb: { text: string; cls: string };
  if (row) {
    const drop = MAIN[model][0].avg - row.avg;
    fb = {
      text: `Table 1（LLaVA-1.5-${model}，K=${pt.K}，R=${Math.round(pt.R * 100)}%）报告的四项平均分为 ${row.avg}（基线 ${MAIN[model][0].avg}）。${drop <= 0.5 ? '几乎无损。' : drop <= 3 ? '略有下降。' : '下降明显——剪得太早或太狠。'}`,
      cls: drop <= 0.5 ? 'good' : drop <= 3 ? '' : 'bad',
    };
  } else {
    fb = {
      text: `按公式估算：第 ${pt.K} 层之后剪掉 ${Math.round(pt.R * 100)}% 的视觉 token，理论 FLOPs 降幅约 ${(red * 100).toFixed(1)}%。带圆圈的点是论文测过的配置（紫色圈 = Table 5 的 K=0、R=50%）。`,
      cls: '',
    };
  }

  return (
    <div>
      <ChipGroup
        label="计算口径"
        value={preset}
        onChange={(p) => {
          setPreset(p);
          const t2 = PRESETS.find((x) => x.key === p)!.T;
          setPt((q) => ({ K: Math.min(q.K, t2), R: q.R }));
        }}
        options={PRESETS.map((p) => ({ key: p.key, label: p.label }))}
      />
      <CanvasPan fit>
        <canvas
          ref={canvasRef}
          width={L.W}
          height={L.H}
          tabIndex={0}
          aria-label="K/R 平面，轻点选点或用鼠标拖动准星，下方滑杆或方向键可微调"
          style={{ touchAction: 'pan-y pinch-zoom', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            if (!e.isPrimary || e.button !== 0) {
              press.current = null;
              return;
            }
            press.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            if (e.pointerType !== 'touch') {
              e.currentTarget.setPointerCapture(e.pointerId);
              setFrom(e);
            }
          }}
          onPointerMove={(e) => {
            const start = press.current;
            if (!start || start.id !== e.pointerId) return;
            if (e.pointerType !== 'touch') setFrom(e);
            else if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) press.current = null;
          }}
          onPointerUp={(e) => {
            const start = press.current;
            if (!start || start.id !== e.pointerId) return;
            press.current = null;
            if (e.pointerType === 'touch' && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 8) {
              setFrom(e);
            }
          }}
          onPointerCancel={() => { press.current = null; }}
          onLostPointerCapture={() => { press.current = null; }}
          onKeyDown={(e) => {
            const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] };
            const v = d[e.key];
            if (!v) return;
            e.preventDefault();
            e.stopPropagation();
            setPt((p) => ({ K: clamp(p.K + v[0], 0, T), R: clamp(Math.round((p.R + v[1]) * 20) / 20, 0, 0.95) }));
          }}
        />
      </CanvasPan>
      <div className="ctrl-pair">
        <div className="ctrl">
          <label>
            剪枝层 K <span className="val">{pt.K}</span>
          </label>
          <input type="range" min={0} max={T} step={1} value={pt.K} style={sliderFill(pt.K, 0, T)} onChange={(e) => setPt((p) => ({ ...p, K: Number(e.target.value) }))} onKeyDown={stopKeys} aria-label="剪枝层 K" />
        </div>
        <div className="ctrl">
          <label>
            剪枝比例 R <span className="val">{Math.round(pt.R * 100)}%</span>
          </label>
          <input type="range" min={0} max={95} step={1} value={Math.round(pt.R * 100)} style={sliderFill(pt.R, 0, .95)} onChange={(e) => setPt((p) => ({ ...p, R: Number(e.target.value) / 100 }))} onKeyDown={stopKeys} aria-label="剪枝比例 R" />
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">K / R</div>
          <div className="v">
            <Num value={pt.K} /> / <Num value={pt.R * 100} format={(v) => `${Math.round(v)}%`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">理论 FLOPs{preset === 'paper13' ? '（按层平均）' : ''}</div>
          <div className="v">{preset === 'paper13' ? <Num value={paperFlopsB(pt.K, pt.R)} format={(v) => `${v.toFixed(1)}B`} /> : '只显示比例'}</div>
        </div>
        <div className="metric">
          <div className="l">理论降幅</div>
          <div className="v">
            <Num value={red * 100} format={(v) => `${v.toFixed(1)}%`} />
          </div>
        </div>
      </div>
      <div className={`flops-status ${status ? status.cls : 'extra'}`}>{note}</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ============================================================================
//  模块 6.2（P4 切换）：OCR-VQA 上不同 K 的 Rouge-L–R 曲线（Fig. 6 读图近似值）
// ============================================================================

const KS = [1, 2, 5, 10, 15, 20];

const PY0 = 36;
const PY1 = 276;
const YMIN = 0.32;
const YMAX = 0.57;

export const OcrCurves: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const W2 = mobile ? 420 : 1080, H2 = mobile ? 580 : 320;
  const PX0 = mobile ? 44 : 90, PX1 = mobile ? 388 : 620;
  const [k, setK] = useState(1);
  const st = useRef({ k: 1, draw: 0, last: 1 });
  st.current.k = k;

  const canvasRef = useStage(W2, H2, (ctx, t, dt) => {
    const s = st.current;
    if (s.last !== s.k) {
      s.draw = 0;
      s.last = s.k;
    }
    s.draw = Math.min(1, s.draw + dt * 7);
    drawStage(ctx, W2, H2, t, 0.99);
    const xOf = (i: number) => PX0 + 30 + (i / (OCR_R.length - 1)) * (PX1 - PX0 - 60);
    const yOf = (v: number) => PY1 - ((v - YMIN) / (YMAX - YMIN)) * (PY1 - PY0);
    ctx.strokeStyle = '#d1dbe5';
    for (const v of [0.35, 0.4, 0.45, 0.5, 0.55]) {
      ctx.beginPath();
      ctx.moveTo(PX0, yOf(v));
      ctx.lineTo(PX1, yOf(v));
      ctx.stroke();
      label(ctx, v.toFixed(2), PX0 - 8, yOf(v), 12, C.muted, 'right', 700, true);
    }
    OCR_R.forEach((r, i) => label(ctx, `${r * 100}%`, xOf(i), PY1 + 16, 12, C.muted, 'center', 700, true));
    label(ctx, 'R', PX1 + 4, PY1 + 16, 12, C.muted, 'left', 700);
    ctx.strokeStyle = rgba(C.bad, 0.7);
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(PX0, yOf(0.55));
    ctx.lineTo(PX1, yOf(0.55));
    ctx.stroke();
    ctx.setLineDash([]);
    KS.forEach((kk) => {
      if (kk === s.k) return;
      ctx.strokeStyle = '#bbc8d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      OCR_CURVES[kk].forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
      ctx.stroke();
    });
    const pts = OCR_CURVES[s.k].map((v, i) => ({ x: xOf(i), y: yOf(v), v }));
    const segs = pts.length - 1;
    const prog = s.draw * segs;
    ctx.save();
    ctx.strokeStyle = C.out;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = C.out;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < segs; i++) {
      const f = clamp(prog - i, 0, 1);
      if (f <= 0) break;
      ctx.lineTo(pts[i].x + (pts[i + 1].x - pts[i].x) * f, pts[i].y + (pts[i + 1].y - pts[i].y) * f);
    }
    ctx.stroke();
    ctx.restore();
    pts.forEach((p, i) => {
      if (i > prog + 0.01) return;
      const col = p.v >= 0.545 ? C.good : p.v >= 0.5 ? C.emph : C.bad;
      glow(ctx, p.x, p.y, 18, col, 0.6);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, p.v.toFixed(2), p.x, p.y - 18, 13, C.text, 'center', 800, true);
    });

    // 右：同样 R 下的理论 FLOPs 降幅（13B · 论文口径复算）
    const bx0 = mobile ? 28 : 690;
    const bw = 330;
    OCR_R.forEach((r, i) => {
      const y = (mobile ? 363 : 70) + i * 52;
      const red = 1 - paperFlopsB(s.k, r) / BASE13;
      ctx.fillStyle = '#dfe7ef';
      rr(ctx, bx0 + 60, y, bw - 60, 18, 9);
      ctx.fill();
      const w = (bw - 60) * (red / 0.85) * Math.min(1, s.draw * 1.5);
      const g = ctx.createLinearGradient(bx0 + 60, 0, bx0 + 60 + w, 0);
      g.addColorStop(0, '#76bcae');
      g.addColorStop(1, '#155d60');
      ctx.fillStyle = g;
      rr(ctx, bx0 + 60, y, Math.max(18, w), 18, 9);
      ctx.fill();
      label(ctx, `${r * 100}%`, bx0 + 50, y + 9, 12, C.muted, 'right', 700, true);
      label(ctx, `${Math.round(red * 100)}%`, bx0 + bw + 8, y + 9, 13, C.text, 'left', 800, true);
    });
    label(ctx, 'FLOPs↓', bx0 + 60, mobile ? 337 : 44, 14, C.muted, 'left', 700);
  });

  const c = OCR_CURVES[k];
  let fb: { text: string; cls: string };
  if (k === 1) fb = { text: 'K=1 剪得太早：R=87.5% 时 Rouge-L 从 0.55 跌到约 0.34；把 R 降到 50% 才基本恢复（约 0.54）。', cls: 'bad' };
  else if (k <= 5) fb = { text: `K=${k}：R=50% 时已与不剪枝持平（约 0.55），只有极端的 R=87.5% 才明显掉分（约 ${c[0].toFixed(2)}）。`, cls: '' };
  else fb = { text: `K=${k}：剪枝发生在较深的层，各个 R 下都几乎不掉分（R=87.5% 时约 ${c[0].toFixed(2)}），但能省的计算也更少。`, cls: 'good' };

  return (
    <div>
      <ChipGroup label="剪枝层 K" value={k} onChange={setK} options={KS.map((kk) => ({ key: kk, label: `K = ${kk}` }))} />
      <CanvasPan>
        <canvas ref={canvasRef} width={W2} height={H2} aria-label="OCR-VQA 上 Rouge-L 随剪枝比例变化" />
      </CanvasPan>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

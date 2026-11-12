import React, { useMemo, useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  C, useStage, drawStage, glow, rr, label, sceneCanvas, rgba, toCanvas, GRID, syntheticAttention, rankOrder,
  rand, paperFlopsB, PAPER_13B, REPORTED_13B, reportedKey,
} from './stageKit';
import { setK, setR, setMode, usePruning } from './pruneState';
import { MAIN } from './paperData';
import { clamp, lerp } from '../lib/canvasKit';
import { ChipGroup, Num, useIsMobile, CanvasPan, sliderFill } from './ui';
import { Ev } from './panels';
import './ch5Labs.css';

const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();

// ============================================================================
//  模块 5.1（P6 拖动 + 滑块）：设置 R；按注意力 / 随机两种排序
//  桌面：左图右曲线；手机：图在上、曲线在下，另配独立滑块。
// ============================================================================
const N = GRID * GRID;
const baseScores = syntheticAttention();
const referenceOrder = rankOrder(baseScores);

// K=2 沿用父版示意。其他层使用同一张图及固定的轻微分数扰动，便于复现和比较。
const layerRanks = new Map<number, { scores: number[]; order: number[]; maxScore: number }>();
function ranksAt(K: number) {
  const cached = layerRanks.get(K);
  if (cached) return cached;
  const raw = K === 0 || K === 2 ? baseScores : baseScores.map((s, i) => s * (0.76 + 0.48 * rand(i * 11 + K * 29)));
  const sum = raw.reduce((a, b) => a + b, 0);
  const scores = raw.map(s => s / sum);
  const order = rankOrder(scores);
  const layer = { scores, order, maxScore: scores[order[0]] };
  layerRanks.set(K, layer);
  return layer;
}
const randomOrder = referenceOrder
  .map((idx) => ({ idx, k: rand(idx * 7.13 + 2.1) }))
  .sort((a, b) => a.k - b.k)
  .map((o) => o.idx);

function usePruneResult() {
  const { K, R, mode: selectedMode } = usePruning();
  return useMemo(() => {
    const mode = K === 0 ? 'rand' : selectedMode;
    const effectiveR = K === PAPER_13B.T ? 0 : R;
    const ranks = ranksAt(K);
    const order = mode === 'attn' ? ranks.order : randomOrder;
    const kept = new Set(order.slice(0, Math.round(N * (1 - effectiveR))));
    let mass = 0;
    kept.forEach(index => { mass += ranks.scores[index]; });

    const full = effectiveR === 0;
    const attentionRow = MAIN['13B'].find(row => row.K === K && row.R === R);
    const scoreRow = full ? MAIN['13B'][0] : mode === 'attn' ? attentionRow : undefined;
    const score = scoreRow?.avg.toFixed(1);
    let explanation: string;
    if (full) {
      explanation = `实际剪除 0%，40 层均处理 ${N}/${N} 个视觉 token。当前读数对应完整 13B 模型。`;
    } else if (mode === 'rand') {
      const ref = attentionRow ? `同一 K/R 按注意力排序的四项均分为 ${attentionRow.avg.toFixed(1)}。` : '';
      const entry = K === 0 ? '进入第 1 层前还没有上一层注意力可读，' : '';
      explanation = `${entry}随机保留 ${kept.size} 个视觉 token。Table 1 未报告当前随机配置的四项均分。${ref}`;
    } else {
      const performance = score ? `Table 1 报告该配置的 13B 四项均分为 ${score}。` : 'Table 1 未报告当前配置的四项均分。';
      explanation = `前 ${K} 层处理完整序列，从第 ${K + 1} 层起按注意力排序保留 ${kept.size} 个视觉 token。${performance}`;
    }
    return { K, R, mode, effectiveR, full, ranks, kept, coverage: Math.round(mass * 100), score, explanation };
  }, [K, R, selectedMode]);
}

/** 只绘制保留的相邻区间，避免遮盖小数像素坐标时留下原图行缝。 */
function drawRetained(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, kept: Set<number>) {
  const image = sceneCanvas();
  const cell = size / GRID;
  const patch = image.width / GRID;
  ctx.fillStyle = '#e1e8ed';
  ctx.fillRect(x, y, size, size);
  for (let row = 0; row < GRID; row++) {
    let start = -1;
    for (let col = 0; col <= GRID; col++) {
      const present = col < GRID && kept.has(row * GRID + col);
      if (present && start < 0) start = col;
      if (!present && start >= 0) {
        const length = col - start;
        ctx.drawImage(image, start * patch, row * patch, length * patch, patch,
          x + start * cell, y + row * cell, length * cell, cell);
        start = -1;
      }
    }
  }
}

function pruneLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 530, IX: 42, IY: 18, PS: 14, CX0: 24, CX1: 396, CY0: 418, CY1: 486 }
    : { W: 1080, H: 340, IX: 34, IY: 34, PS: 11, CX0: 360, CX1: 1040, CY0: 70, CY1: 260 };
}

export const RankPrune: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const L = useMemo(() => pruneLayout(mobile), [mobile]);
  const result = usePruneResult();
  const { R, K, mode, effectiveR, ranks: { scores, order, maxScore }, kept, coverage } = result;
  const st = useRef({ R: 0.5, cutR: 0.5, grip: 0, dragging: false, hover: false });
  st.current.R = effectiveR;
  const pulse = useRef({ previous: kept, changed: [] as number[], since: 0 });
  const keptRef = useRef(kept);
  keptRef.current = kept;
  const LRef = useRef(L);
  LRef.current = L;

  const canvasRef = useStage(L.W, L.H, (ctx, t, dt) => {
    const s = st.current;
    const ks = keptRef.current;
    const { W, H, IX, IY, PS, CX0, CX1, CY0, CY1 } = LRef.current;
    drawStage(ctx, W, H, t);
    drawRetained(ctx, IX, IY, PS * GRID, ks);
    const transition = pulse.current;
    const now = performance.now();
    if (ks !== transition.previous) {
      const changed: number[] = [];
      for (let idx = 0; idx < N; idx++) {
        if (transition.previous.has(idx) !== ks.has(idx)) changed.push(idx);
      }
      // 抽取分布在整幅图上的变化位置，大幅拖动时依然能看清图像本身。
      const stride = Math.max(1, Math.ceil(changed.length / 42));
      transition.changed = changed.filter((_, i) => i % stride === 0);
      transition.previous = ks;
      transition.since = now;
    }
    const fade = Math.max(0, 1 - (now - transition.since) / 170);
    const highlighting = dt < 1 && fade > 0 && transition.changed.length > 0;
    if (highlighting) {
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineWidth = 2;
      for (const idx of transition.changed) {
        ctx.strokeStyle = ks.has(idx) ? C.good : C.emph;
        ctx.strokeRect(IX + (idx % GRID) * PS + 1, IY + Math.floor(idx / GRID) * PS + 1, PS - 2, PS - 2);
      }
      ctx.restore();
    }
    ctx.strokeStyle = rgba(C.good, 0.7);
    ctx.lineWidth = 1.5;
    rr(ctx, IX - 5, IY - 5, PS * GRID + 10, PS * GRID + 10, 6);
    ctx.stroke();

    // 排序曲线
    s.cutR = s.R;
    s.grip = s.dragging ? 1 : s.hover ? 0.5 : 0;
    const cw = CX1 - CX0;
    const bw = cw / N;
    const cutX = CX0 + cw * (1 - s.cutR);
    if (mode === 'attn') {
      ctx.fillStyle = 'rgba(60,207,142,0.06)';
      ctx.fillRect(CX0, CY0 - 10, cutX - CX0, CY1 - CY0 + 10);
      ctx.fillStyle = 'rgba(239,93,114,0.05)';
      ctx.fillRect(cutX, CY0 - 10, CX1 - cutX, CY1 - CY0 + 10);
    }
    for (let rk = 0; rk < N; rk++) {
      const idx = order[rk];
      const h = Math.sqrt(scores[idx] / maxScore) * (CY1 - CY0);
      const v = ks.has(idx) ? 1 : 0;
      ctx.fillStyle = v > 0.5 ? rgba(C.good, 0.35 + 0.55 * v) : rgba(C.bad, 0.18 + 0.2 * (1 - v));
      ctx.fillRect(CX0 + rk * bw, CY1 - h, Math.max(0.8, bw - 0.2), h);
    }
    ctx.save();
    ctx.strokeStyle = C.sys;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.sys;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    let cum = 0;
    for (let rk = 0; rk < N; rk++) {
      cum += scores[order[rk]];
      const x = CX0 + (rk + 1) * bw;
      const y = CY1 - cum * (CY1 - CY0);
      if (rk === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // 剪枝线把手
    glow(ctx, cutX, (CY0 + CY1) / 2, 40, C.emph, s.dragging || s.hover ? 0.55 : 0.3 + 0.15 * (0.5 + 0.5 * Math.sin(t * 4)));
    ctx.strokeStyle = C.emph;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cutX, CY0 - 22);
    ctx.lineTo(cutX, CY1 + 10);
    ctx.stroke();
    ctx.fillStyle = C.emph;
    const gw = 22 + 8 * s.grip;
    const gh = 22 + 4 * s.grip;
    rr(ctx, cutX - gw / 2, CY1 + 8, gw, gh, 6);
    ctx.fill();
    label(ctx, '⇔', cutX, CY1 + 8 + gh / 2, 13, '#ffffff', 'center', 800);
    label(ctx, '保留注意力', CX0 + (mobile ? 68 : 80), CY0 - 30, mobile ? 13 : 16, C.muted);
    label(ctx, '注意力排序 →', CX1, CY1 + (mobile ? 21 : 22), 14, C.muted, 'right');
    label(ctx, `${coverage}%`, CX0 + 4, CY0 - 30, 24, C.sys, 'left', 800, true);
    label(ctx, `实际剪除 ${Math.round(s.R * 100)}%`, CX1, CY0 - 30, 19, C.emph, 'right', 800, true);
    return highlighting;
  }, false);

  const setFromX = (clientX: number, clientY: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x } = toCanvas({ clientX, clientY }, cv, L.W, L.H);
    const r = clamp(1 - (x - L.CX0) / (L.CX1 - L.CX0), 0, 0.95);
    setR(Math.round(r * 100) / 100);
  };
  const inCurve = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return false;
    const { x, y } = toCanvas(e, cv, L.W, L.H);
    return x >= L.CX0 - 20 && y >= L.CY0 - 40;
  };

  return (
    <div className="prune-lab">
      <div className="prune-strategies">
        {K === 0 ? <p className="lab-context">K = 0 · 进入第 1 层前随机选取。</p> : <ChipGroup
          label="排序方式"
          value={mode}
          onChange={setMode}
          options={[
            { key: 'attn', label: '按注意力排序（FastV）' },
            { key: 'rand', label: '随机丢弃' },
          ]}
        />}
        <span className="prune-origin">保留位置与注意力覆盖率均为教学示意</span>
      </div>
      <div className="prune-config-band">
        <PruneControls K={K} R={R} />
        <PruneSummary result={result} showCoverage />
      </div>
      <CanvasPan fit>
        <canvas
          ref={canvasRef}
          width={L.W}
          height={L.H}
          tabIndex={0}
          aria-label="拖动剪枝线设置剪枝比例 R（方向键微调）"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={(e) => {
            if (!inCurve(e)) return;
            st.current.dragging = true;
            canvasRef.current?.setPointerCapture(e.pointerId);
            setFromX(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            const cv = canvasRef.current;
            if (!cv) return;
            const h = inCurve(e);
            st.current.hover = h;
            cv.style.cursor = st.current.dragging ? 'grabbing' : h ? 'grab' : 'default';
            if (st.current.dragging) setFromX(e.clientX, e.clientY);
          }}
          onPointerUp={() => (st.current.dragging = false)}
          onPointerCancel={() => (st.current.dragging = false)}
          onPointerLeave={() => (st.current.hover = false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              e.stopPropagation();
              setR((r) => clamp(Math.round((r + (e.key === 'ArrowLeft' ? 0.05 : -0.05)) * 100) / 100, 0, 0.95));
            }
          }}
        />
      </CanvasPan>
      <div className="prune-legend" aria-label="图例">
        <span><i className="kept" />保留</span>
        <span><i className="dropped" />剪除</span>
        <span><i className="curve" />累计注意力</span>
        {mode === 'rand' && !result.full && <span className="prune-budget">橙线表示保留数量，绿柱标出随机保留的位置。</span>}
      </div>
      {result.full && <div className="feedback">{result.explanation}</div>}
      <details className="prune-notes">
        <summary>出处与口径</summary>
        <p>热气球被分成 24 × 24 个图块。柱子按示意分数从高到低排列，金线给出从左端累加的注意力。覆盖率把实际留下的图块分数相加。两种策略使用同一幅图和同一组分数，随机顺序固定，方便来回对照。</p>
        <p>13B 四项均分取自论文的 Nocaps、Flickr30k、A-OKVQA 和 MMMU。只有与当前策略和参数相符的配置才显示论文分数。<Ev k="tab1" /></p>
        <p>论文另在重训的 7B 模型上比较两种策略。按注意力排序在四项任务上分别高 0.6、1.7、0.2、0.4 分，论文未报告随机试验的重复次数或方差。<Ev k="tab7" /></p>
      </details>
    </div>
  );
};

// ============================================================================
//  模块 5.2（P5 点击层塔 + 滑块）：选择剪枝层 K 与比例 R，按「13B · 论文口径复算」给出理论 FLOPs
// ============================================================================
function PruneControls({ K, R }: { K: number; R: number }) {
  return <div className="ctrl-pair">
    <div className="ctrl"><label>剪枝层 K <span className="val">{K}</span></label>
      <input type="range" min={0} max={PAPER_13B.T} value={K} style={sliderFill(K, 0, PAPER_13B.T)} aria-label="剪枝层 K" onChange={e => setK(Number(e.target.value))} onKeyDown={stopKeys} />
    </div>
    <div className="ctrl"><label>{K === PAPER_13B.T ? '设定剪枝比例 R' : '剪枝比例 R'} <span className="val">{Math.round(R * 100)}%</span></label>
      <input type="range" min={0} max={95} step={1} value={Math.round(R * 100)} style={sliderFill(R, 0, .95)} aria-label="剪枝比例 R" onChange={e => setR(Number(e.target.value) / 100)} onKeyDown={stopKeys} />
    </div>
  </div>;
}

function PruneSummary({ result, showCoverage = false }: { result: ReturnType<typeof usePruneResult>; showCoverage?: boolean }) {
  const { K, mode, full, kept, coverage, score } = result;
  const layer = full ? '实际剪除 0%' : K === 0 ? '进入第 1 层前随机剪枝' : `第 ${K + 1} 层起缩短序列`;
  return <div className="prune-path">
    {!showCoverage && <span><small>剪枝位置</small><strong>{layer}</strong></span>}
    <span><small>保留视觉 token</small><strong>{kept.size} / {N}</strong></span>
    {showCoverage && <span><small>注意力覆盖 · 教学示意</small><strong>{coverage}%</strong></span>}
    <span><small>13B 四项均分 <Ev k="tab1" /></small><strong>{score ? `${score}${full ? '（完整模型）' : ''}` : mode === 'rand' ? '随机配置未报告' : '此配置未报告'}</strong></span>
  </div>;
}

const T = PAPER_13B.T;
const SYS = 36; // 论文口径复算中的文字 token（长度假设）
const IMG = 576;

function gateLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 522, TX: 203, TW: 152, TY0: 279, LH: 4.5, LG: 1.5, px0: 59, px1: 394, py0: 366, py1: 489, numX: 32, numY: 323 }
    : { W: 1080, H: 360, TX: 60, TW: 328, TY0: 330, LH: 5.8, LG: 1.7, px0: 705, px1: 1040, py0: 120, py1: 320, numX: 705, numY: 70 };
}

const BASE_B = paperFlopsB(0, 0);

export function flopsStatus(K: number, R: number) {
  const rep = REPORTED_13B[reportedKey(K, R)];
  const calc = paperFlopsB(K, R);
  if (!rep) return { calc, rep: null as number | null, src: '', text: '论文未报告该配置：公式外推', cls: 'extra' };
  if (Math.abs(rep.b - calc) < 0.05) return { calc, rep: rep.b, src: rep.src, text: `与 ${rep.src} 报告值一致`, cls: 'ok' };
  return { calc, rep: rep.b, src: rep.src, text: `${rep.src} 报告 ${rep.b}B，与本页复算不一致，原因未知`, cls: 'warn' };
}

export const LayerGate: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const L = useMemo(() => gateLayout(mobile), [mobile]);
  const LRef = useRef(L);
  LRef.current = L;
  const result = usePruneResult();
  const { K, R, effectiveR, kept } = result;
  const st = useRef({ K: 2, R: 0.5, gate: 2, hover: -1 });
  st.current.K = K;
  st.current.R = effectiveR;

  const canvasRef = useStage(L.W, L.H, (ctx, t, dt) => {
    const s = st.current;
    const { W, H, TX, TW, TY0, LH, LG, px0, px1, py0, py1, numX, numY } = LRef.current;
    const layerY = (l: number) => TY0 - l * (LH + LG);
    s.gate = s.K;
    drawStage(ctx, W, H, t, 0.98);
    const FULL = SYS + IMG;
    const scale = TW / FULL;
    const keepImg = Math.round(IMG * (1 - s.R));
    for (let l = 1; l <= T; l++) {
      const y = layerY(l);
      const pruned = l > s.gate;
      const imgN = pruned ? keepImg : IMG;
      let x = TX;
      const hov = s.hover === l;
      ctx.fillStyle = rgba(C.sys, hov ? 0.95 : 0.7);
      ctx.fillRect(x, y, SYS * scale - 1, LH);
      x += SYS * scale;
      ctx.fillStyle = rgba(C.img, hov ? 0.95 : 0.62);
      ctx.fillRect(x, y, imgN * scale - 1, LH);
      if (pruned && s.R > 0) {
        ctx.strokeStyle = 'rgba(239,93,114,0.28)';
        ctx.setLineDash([2, 3]);
        ctx.strokeRect(x + imgN * scale + 0.5, y + 0.5, (IMG - imgN) * scale - 1, LH - 1);
        ctx.setLineDash([]);
      }
    }
    for (let q = 0; q < 3; q++) {
      const u = (t * 0.35 + q / 3) % 1;
      const l = 1 + u * (T - 1);
      const y = layerY(Math.floor(l)) + LH / 2;
      const w = (l > s.gate + 0.5 ? SYS + keepImg : FULL) * scale;
      glow(ctx, TX + w * ((t * 0.7 + q * 0.37) % 1), y, 22, '#e6f0ff', 0.35);
    }
    const gy = s.K === 0 ? TY0 + 2 : layerY(Math.round(s.gate)) - LG / 2;
    ctx.save();
    ctx.shadowColor = C.good;
    ctx.shadowBlur = 3;
    ctx.strokeStyle = C.good;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -t * 24;
    if (s.R > 0) {
      ctx.beginPath();
      ctx.moveTo(TX - 22, gy);
      ctx.lineTo(TX + TW + 12, gy);
      ctx.stroke();
    }
    ctx.restore();
    if (s.R > 0) label(ctx, '✂', TX - 36, gy, 18, C.good, 'center', 700);
    label(ctx, `K=${s.K}`, TX + TW + (W < 700 ? 8 : 18), gy, W < 700 ? 13 : 15, C.good, 'left', 800, true);

    // 保留的 patch 放回同一张图的原始坐标。
    const imageSize = mobile ? 146 : 178;
    const imageX = mobile ? 17 : 456;
    const imageY = mobile ? 74 : 108;
    drawRetained(ctx, imageX, imageY, imageSize, kept);
    label(ctx, `${kept.size} / 576`, imageX + imageSize / 2, imageY + imageSize + (mobile ? 22 : 18), mobile ? 22 : 17, C.img, 'center', 760, true);
    label(ctx, '保留位置 · 示意', imageX + imageSize / 2, imageY - 17, mobile ? 18 : 14, C.muted, 'center');
    label(ctx, '40 层 · 序列长度', TX, mobile ? 15 : 20, 14, C.muted);
    label(ctx, '13B 理论 FLOPs · 公式复算', numX, numY - (mobile ? 26 : 33), mobile ? 15 : 16, C.muted);
    label(ctx, '理论降幅', px0, py0 - 13, mobile ? 16 : 14, C.muted);
    label(ctx, '100%', px0 - 5, py0 + 4, mobile ? 15 : 13, C.muted, 'right');
    label(ctx, '0%', px0 - 5, py1 - 3, mobile ? 15 : 13, C.muted, 'right');
    label(ctx, 'K = 0', px0, py1 + 18, mobile ? 16 : 13, C.muted);
    label(ctx, 'K = 40', px1, py1 + 16, 13, C.muted, 'right');
    // 降幅随 K 变化（当前 R，论文口径复算）
    ctx.strokeStyle = '#c2ceda';
    ctx.lineWidth = 1;
    ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
    const red = (k: number) => 1 - paperFlopsB(k, s.R) / BASE_B;
    const pxOf = (k: number) => px0 + (k / T) * (px1 - px0);
    const pyOf = (v: number) => py1 - v * (py1 - py0);
    const grad = ctx.createLinearGradient(0, py0, 0, py1);
    grad.addColorStop(0, rgba(C.good, 0.35));
    grad.addColorStop(1, rgba(C.good, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pxOf(0), py1);
    for (let k = 0; k <= T; k++) ctx.lineTo(pxOf(k), pyOf(red(k)));
    ctx.lineTo(pxOf(T), py1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.good;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= T; k++) (k === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, pxOf(k), pyOf(red(k)));
    ctx.stroke();
    const gk = clamp(s.gate, 0, T);
    const gv = lerp(red(Math.floor(gk)), red(Math.min(T, Math.ceil(gk))), gk - Math.floor(gk));
    glow(ctx, pxOf(gk), pyOf(gv), 22, C.emph, 0.8);
    ctx.fillStyle = C.emph;
    ctx.beginPath();
    ctx.arc(pxOf(gk), pyOf(gv), 6, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, `${paperFlopsB(s.K, s.R).toFixed(1)}B`, numX, numY, mobile ? 26 : 34, C.good, 'left', 800, true);
    label(ctx, gv > 0 ? `−${(gv * 100).toFixed(1)}%` : '0.0%', px1, numY, mobile ? 20 : 22, C.text, 'right', 800, true);
  });

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, click: boolean) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x, y } = toCanvas(e, cv, L.W, L.H);
    let l = -1;
    if (x > L.TX - 40 && x < L.TX + L.TW + 60) {
      const k = Math.round((L.TY0 + L.LH / 2 - y) / (L.LH + L.LG));
      if (k >= 1 && k <= T) l = k;
    }
    st.current.hover = l;
    cv.style.cursor = l > 0 ? 'pointer' : 'default';
    if (click && l > 0) setK(l);
  };

  const status = flopsStatus(K, effectiveR);
  const red = 1 - status.calc / BASE_B;

  return (
    <div className="prune-lab">
      <div className="prune-config-band">
        <PruneControls K={K} R={R} />
        <PruneSummary result={result} />
      </div>
      <CanvasPan fit>
        <canvas
          ref={canvasRef}
          width={L.W}
          height={L.H}
          tabIndex={0}
          aria-label="点击层塔选择剪枝层 K（上下方向键微调）"
          onPointerMove={(e) => onPointer(e, false)}
          onPointerDown={(e) => onPointer(e, true)}
          onPointerLeave={() => (st.current.hover = -1)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              e.stopPropagation();
              setK((k) => clamp(k + (e.key === 'ArrowUp' ? 1 : -1), 0, T));
            }
          }}
        />
      </CanvasPan>
      <p className="prune-gate-reading">只屏蔽位置时，FFN 仍会处理这些 token。<strong>实际缩短序列，后续层才少算。</strong></p>
      <div className={`feedback ${result.mode === 'attn' && result.score && !result.full ? 'good' : ''}`}>{result.explanation}</div>
      <div className={`metrics prune-flops ${status.cls}`}>
        <p>按 13B 配置复算的理论 FLOPs 为 <strong><Num value={status.calc} format={v => `${v.toFixed(1)}B`} /></strong>，较完整模型的 154.6B 降低 <strong><Num value={red * 100} format={v => `${v.toFixed(1)}%`} /></strong>。</p>
        <p>{status.text}。</p>
      </div>
      <details className="prune-notes">
        <summary>出处与口径</summary>
        <p>复算采用 LLaVA-1.5-13B 的 40 层、576 个视觉 token 与 36 个文字 token。先分别计算剪枝前后各层的注意力和 FFN 开销，再对 40 层取平均。B 表示十亿次运算。<Ev k="sec42" /> <Ev k="eq5" /></p>
        <p>表内理论 FLOPs 可与复算结果核对，包括 Table 5 中 K=0、R=50% 的差异。实际耗时另见单张 A40 上的测量，其配置为 K=0、R=50% 的随机剪枝。<Ev k="tab5" /> <Ev k="tab4" /></p>
      </details>
    </div>
  );
};

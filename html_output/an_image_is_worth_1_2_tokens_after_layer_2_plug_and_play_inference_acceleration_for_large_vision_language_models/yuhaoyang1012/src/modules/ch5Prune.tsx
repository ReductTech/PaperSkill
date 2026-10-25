import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C, useStage, drawStage, glow, rr, label, sceneCanvas, rgba, approach, toCanvas, GRID, syntheticAttention, rankOrder,
  rand, paperFlopsB, PAPER_13B, REPORTED_13B, reportedKey,
} from './stageKit';
import { clamp, lerp } from '../lib/canvasKit';
import { ChipGroup, Num, useIsMobile, CanvasPan } from './ui';

const stopKeys = (e: React.KeyboardEvent) => e.stopPropagation();

// ============================================================================
//  模块 5.1（P6 拖动 + 滑块）：设置 R；按注意力 / 随机两种排序
//  桌面：左图右曲线；手机：图在上、曲线在下，另配独立滑块。
// ============================================================================
const N = GRID * GRID;
const scores = syntheticAttention();
const order = rankOrder(scores);
const maxScore = scores[order[0]];
const randomOrder = order
  .map((idx) => ({ idx, k: rand(idx * 7.13 + 2.1) }))
  .sort((a, b) => a.k - b.k)
  .map((o) => o.idx);

function keptSet(R: number, mode: 'attn' | 'rand') {
  const keep = Math.round(N * (1 - R));
  const src = mode === 'attn' ? order : randomOrder;
  return new Set(src.slice(0, keep));
}

function pruneLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 530, IX: 42, IY: 18, PS: 14, CX0: 24, CX1: 396, CY0: 418, CY1: 486 }
    : { W: 1080, H: 340, IX: 34, IY: 34, PS: 11, CX0: 360, CX1: 1040, CY0: 70, CY1: 260 };
}

export const RankPrune: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const L = useMemo(() => pruneLayout(mobile), [mobile]);
  const [R, setR] = useState(0.5);
  const [mode, setMode] = useState<'attn' | 'rand'>('attn');
  const st = useRef({ R: 0.5, cutR: 0.5, grip: 0, vis: new Float32Array(N).fill(1), dragging: false, hover: false });
  st.current.R = R;
  const kept = useMemo(() => keptSet(R, mode), [R, mode]);
  const keptRef = useRef(kept);
  keptRef.current = kept;
  const LRef = useRef(L);
  LRef.current = L;

  const canvasRef = useStage(L.W, L.H, (ctx, t, dt) => {
    const s = st.current;
    const ks = keptRef.current;
    const { W, H, IX, IY, PS, CX0, CX1, CY0, CY1 } = LRef.current;
    for (let i = 0; i < N; i++) s.vis[i] = approach(s.vis[i], ks.has(i) ? 1 : 0, dt, 7 + (i % 7));
    drawStage(ctx, W, H, t, 0.97);
    const img = sceneCanvas();
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const i = r * GRID + c;
        const v = s.vis[i];
        const x = IX + c * PS;
        const y = IY + r * PS;
        const shrink = (1 - v) * PS * 0.27;
        ctx.globalAlpha = 0.15 + 0.85 * v;
        ctx.drawImage(img, c * 14, r * 14, 14, 14, x + shrink, y + shrink, PS - 2 * shrink, PS - 2 * shrink);
        ctx.globalAlpha = 1;
        if (v < 0.95) {
          ctx.fillStyle = `rgba(11,18,34,${0.6 * (1 - v)})`;
          ctx.fillRect(x, y, PS, PS);
        }
      }
    }
    ctx.strokeStyle = rgba(C.good, 0.7);
    ctx.lineWidth = 1.5;
    rr(ctx, IX - 5, IY - 5, PS * GRID + 10, PS * GRID + 10, 6);
    ctx.stroke();

    // 排序曲线
    s.cutR = approach(s.cutR, s.R, dt, 22);
    s.grip = approach(s.grip, s.dragging ? 1 : s.hover ? 0.5 : 0, dt, 14);
    const cw = CX1 - CX0;
    const bw = cw / N;
    const cutX = CX0 + cw * (1 - s.cutR);
    ctx.fillStyle = 'rgba(60,207,142,0.06)';
    ctx.fillRect(CX0, CY0 - 10, cutX - CX0, CY1 - CY0 + 10);
    ctx.fillStyle = 'rgba(239,93,114,0.05)';
    ctx.fillRect(cutX, CY0 - 10, CX1 - cutX, CY1 - CY0 + 10);
    for (let rk = 0; rk < N; rk++) {
      const idx = order[rk];
      const h = Math.sqrt(scores[idx] / maxScore) * (CY1 - CY0);
      const v = s.vis[idx];
      ctx.fillStyle = v > 0.5 ? rgba(C.good, 0.35 + 0.55 * v) : rgba(C.bad, 0.18 + 0.2 * (1 - v));
      ctx.fillRect(CX0 + rk * bw, CY1 - h, Math.max(0.8, bw - 0.2), h);
    }
    ctx.save();
    ctx.strokeStyle = C.sys;
    ctx.lineWidth = 2;
    ctx.shadowColor = C.sys;
    ctx.shadowBlur = 10;
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
    label(ctx, '⇔', cutX, CY1 + 8 + gh / 2, 13, '#0b1222', 'center', 800);
    let mass = 0;
    ks.forEach((i) => (mass += scores[i]));
    label(ctx, `${Math.round(mass * 100)}%`, CX0 + 4, CY0 - 30, 24, C.sys, 'left', 800, true);
    label(ctx, `R = ${Math.round(s.R * 100)}%`, CX1, CY0 - 30, 19, C.emph, 'right', 800, true);
  });

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

  const keepN = Math.round(N * (1 - R));
  let mass = 0;
  kept.forEach((i) => (mass += scores[i]));
  let fb: { text: string; cls: string };
  if (mode === 'rand') {
    fb = {
      text: `随机丢弃时，保住的注意力（${Math.round(mass * 100)}%）大致等于保留比例（${Math.round((1 - R) * 100)}%）。论文 Table 7 中，注意力排序相对随机在四项任务上高 +0.6、+1.7、+0.2、+0.4——但随机只跑了一次、没有方差，不能排除这些小差异来自噪声。`,
      cls: '',
    };
  } else if (R === 0) {
    fb = { text: '还没有剪枝：576 个图像 token 全部保留。向左拖动剪枝线或拖动下方滑块试试。', cls: '' };
  } else if (R <= 0.55) {
    fb = {
      text: `剪掉 ${Math.round(R * 100)}%（${N - keepN} 个）后，留下的 ${keepN} 个 token 握有这份示意分布中 ${Math.round(mass * 100)}% 的注意力。论文默认 R=50%。注意：这是合成数据，论文没有报告“保住的注意力”这一量。`,
      cls: 'good',
    };
  } else if (R <= 0.8) {
    fb = {
      text: `R=${Math.round(R * 100)}%：保住的注意力降到 ${Math.round(mass * 100)}%（示意）。论文 Table 1 中，LLaVA-1.5-7B（K=2）在 R=75% 时平均分从 69.8 降到 67.1。`,
      cls: '',
    };
  } else {
    fb = {
      text: `R=${Math.round(R * 100)}% 已很激进：只剩 ${keepN} 个图像 token。Table 1 中 7B（K=2、R=90%）平均分跌到 55.2，Nocaps 从 99.8 掉到 72.1。`,
      cls: 'bad',
    };
  }

  return (
    <div>
      <ChipGroup
        label="排序方式"
        value={mode}
        onChange={setMode}
        options={[
          { key: 'attn', label: '按注意力排序（FastV）' },
          { key: 'rand', label: '随机丢弃' },
        ]}
      />
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
      <div className="ctrl">
        <label>
          剪枝比例 R <span className="val">{Math.round(R * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={95}
          step={5}
          value={Math.round(R * 100)}
          onChange={(e) => setR(Number(e.target.value) / 100)}
          onKeyDown={stopKeys}
          aria-label="剪枝比例 R"
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">剪枝比例 R</div>
          <div className="v">
            <Num value={R * 100} format={(v) => `${Math.round(v)}%`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">保留的图像 token</div>
          <div className="v">
            <Num value={keepN} /> / {N}
          </div>
        </div>
        <div className="metric">
          <div className="l">保住的注意力（示意）</div>
          <div className="v">
            <Num value={mass * 100} format={(v) => `${Math.round(v)}%`} />
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ============================================================================
//  模块 5.2（P5 点击层塔 + 滑块）：选择剪枝层 K 与比例 R，按「13B · 论文口径复算」给出理论 FLOPs
// ============================================================================
const T = PAPER_13B.T;
const SYS = 36; // 论文口径复算中的文字 token（长度假设）
const IMG = 576;

function gateLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 560, TX: 50, TW: 300, TY0: 332, LH: 5.2, LG: 1.8, px0: 50, px1: 396, py0: 400, py1: 544, numX: 50, numY: 370 }
    : { W: 1080, H: 360, TX: 70, TW: 430, TY0: 330, LH: 5.8, LG: 1.7, px0: 640, px1: 1040, py0: 120, py1: 320, numX: 640, numY: 70 };
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
  const [K, setK] = useState(2);
  const [R, setR] = useState(0.5);
  const st = useRef({ K: 2, R: 0.5, gate: 2, hover: -1 });
  st.current.K = K;
  st.current.R = R;

  const canvasRef = useStage(L.W, L.H, (ctx, t, dt) => {
    const s = st.current;
    const { W, H, TX, TW, TY0, LH, LG, px0, px1, py0, py1, numX, numY } = LRef.current;
    const layerY = (l: number) => TY0 - l * (LH + LG);
    s.gate = approach(s.gate, s.K, dt, 7);
    drawStage(ctx, W, H, t, 0.98);
    const FULL = SYS + IMG;
    const scale = TW / FULL;
    const keepImg = IMG * (1 - s.R);
    for (let l = 1; l <= T; l++) {
      const y = layerY(l);
      const pruned = l > s.gate + 0.5;
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
    ctx.shadowBlur = 14;
    ctx.strokeStyle = C.good;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -t * 24;
    ctx.beginPath();
    ctx.moveTo(TX - 22, gy);
    ctx.lineTo(TX + TW + 12, gy);
    ctx.stroke();
    ctx.restore();
    label(ctx, '✂', TX - 36, gy, 18, C.good, 'center', 700);
    label(ctx, `K=${s.K}`, TX + TW + (W < 700 ? 8 : 18), gy, W < 700 ? 13 : 15, C.good, 'left', 800, true);

    // 降幅随 K 变化（当前 R，论文口径复算）
    ctx.strokeStyle = 'rgba(150,175,220,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
    const red = (k: number) => 1 - paperFlopsB(k, s.R) / BASE_B;
    const pxOf = (k: number) => px0 + (k / T) * (px1 - px0);
    const pyOf = (v: number) => py1 - (v / 0.9) * (py1 - py0);
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
    label(ctx, `${paperFlopsB(s.K, s.R).toFixed(1)}B`, numX, numY, mobile ? 28 : 34, C.good, 'left', 800, true);
    label(ctx, `−${(gv * 100).toFixed(1)}%`, px1, numY, mobile ? 20 : 22, C.text, 'right', 800, true);
  });

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, click: boolean) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x, y } = toCanvas(e, cv, L.W, L.H);
    let l = -1;
    if (x > L.TX - 40 && x < L.TX + L.TW + 60) {
      const k = Math.ceil((L.TY0 - y) / (L.LH + L.LG));
      if (k >= 1 && k <= T) l = k;
    }
    st.current.hover = l;
    cv.style.cursor = l > 0 ? 'pointer' : 'default';
    if (click && l > 0) setK(l);
  };

  const status = flopsStatus(K, R);
  const red = 1 - status.calc / BASE_B;
  let fb: { text: string; cls: string };
  if (K === 0) {
    fb = {
      text: 'K=0：图像 token 在进入语言模型前就被丢弃，此时没有注意力可用，只能随机选。注意它同时改变了“剪枝位置”和“排序依据”两件事，所以 K=0 的损失（如 7B、R=90% 时 Nocaps 从 99.8 跌到 7.0）不能单独证明“必须在语言模型内部剪”。',
      cls: 'bad',
    };
  } else if (K <= 3) {
    fb = {
      text: `K=${K}：前 ${K} 层用全部 token 计算，之后只留 ${Math.round(IMG * (1 - R))} 个图像 token。论文 Table 1 中，13B 在 K=2、R=50% 时平均分仍为 73.6（与完整模型相同）。`,
      cls: 'good',
    };
  } else {
    fb = {
      text: `K=${K}：剪得越晚越稳妥，但省得越少（理论降幅 ${(red * 100).toFixed(1)}%）。Fig. 6 显示 K 较大时 R 对 OCR-VQA 几乎没有影响。`,
      cls: '',
    };
  }

  return (
    <div>
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
      <div className="ctrl-pair">
        <div className="ctrl">
          <label>
            剪枝层 K <span className="val">{K}</span>
          </label>
          <input type="range" min={0} max={T} step={1} value={K} onChange={(e) => setK(Number(e.target.value))} onKeyDown={stopKeys} aria-label="剪枝层 K" />
        </div>
        <div className="ctrl">
          <label>
            剪枝比例 R <span className="val">{Math.round(R * 100)}%</span>
          </label>
          <input type="range" min={0} max={90} step={5} value={Math.round(R * 100)} onChange={(e) => setR(Number(e.target.value) / 100)} onKeyDown={stopKeys} aria-label="剪枝比例 R" />
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">理论 FLOPs（13B · 论文口径复算）</div>
          <div className="v">
            <Num value={status.calc} format={(v) => `${v.toFixed(1)}B`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">理论降幅（相对 154.6B）</div>
          <div className="v">
            <Num value={red * 100} format={(v) => `${v.toFixed(1)}%`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">与论文对照</div>
          <div className={`v status ${status.cls}`}>{status.cls === 'ok' ? '一致 ✓' : status.cls === 'warn' ? '不一致' : '外推'}</div>
        </div>
      </div>
      <div className={`flops-status ${status.cls}`}>{status.text}。理论 FLOPs 为按层平均的归一化量，不是实测运算量。</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

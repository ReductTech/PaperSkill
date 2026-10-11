import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawSort,
  drawLabel,
  drawLink,
  lpTone,
  drawSpiceBottle,
  drawChefHand,
} from './letterpressKit';

// ── 第 9 章 9.1「三个旋钮」 · 主导操作 P1：拖动 M / L_p / N 三个滑块 ──
// 画面：操作台左侧的调料架（宽 ∝ M、格高 ∝ L_p，一只手在推架 / 拉长瓶身），
// 右侧是论文 Figure 4 两张热力图的调料架格复刻（格内数字是论文印出的真实值），
// 下方那条 M 轴柱是示意读数（右图未印数值，按趋势估读，不是论文数据）。中右
// 下方是三个分区显示的交叉核对区（论文正文声明、官方代码实现、本教程复算）。

const W_NORMAL = 1080;
const H_NORMAL = 620;
const W_ANA = 560;
const H_ANA = 140;

const D = 768; // 嵌入维度
const DK = 768; // key 的维度，等于 D

type DsKey = 'cifar' | 'five';

interface DsInfo {
  key: DsKey;
  short: string;
  name: string;
  source: string;
  nOptions: number[];
  /** 热力图左上角是哪几种 N（论文 Figure 4 真实列）。 */
  heatN: number[];
  heat: number[][];
  poolM: number[];
  poolV: number[];
  poolNote: string;
  segment: string;
}

const DS: Record<DsKey, DsInfo> = {
  cifar: {
    key: 'cifar',
    short: 'CIFAR',
    name: 'Split CIFAR-100',
    source: '热力图 · 实测数值',
    nOptions: [1, 5, 10, 20],
    heatN: [1, 5, 10, 20],
    heat: [
      [77.01, 82.49, 83.39, 83.15],
      [82.88, 83.5, 83.39, 82.84],
      [83.28, 83.18, 83.13, 81.84],
      [83.4, 82.6, 81.6, 79.65],
    ],
    poolM: [5, 10, 15, 20, 25, 30],
    // 示意读数：论文 Figure 4 右图没有印任何数值，这六个数是按该图趋势估读的。
    poolV: [83.0, 83.2, 83.5, 83.6, 83.7, 83.8],
    poolNote: '池子从 5 涨到 30，CIFAR 上提升有限',
    segment: '75,83.4,88',
  },
  five: {
    key: 'five',
    short: '5-ds',
    name: '5-datasets',
    source: '热力图 · 实测数值',
    nOptions: [1, 2, 4, 8, 10, 20],
    heatN: [1, 2, 4, 8],
    heat: [
      [70.87, 78.34, 79.26, 79.5],
      [75.3, 80.65, 80.68, 80.83],
      [74.82, 81.14, 80.84, 79.81],
      [77.2, 76.54, 77.25, 76.03],
    ],
    poolM: [5, 10, 15, 20, 25, 30],
    // 示意读数：论文 Figure 4 右图没有印任何数值，这六个数是按该图趋势估读的。
    poolV: [70.9, 75.4, 78.1, 79.6, 80.3, 80.8],
    poolNote: '池子从 5 涨到 30，5-datasets 总体在涨',
    segment: '69,82,88',
  },
};

const LP_OPTIONS = [1, 5, 10, 20];
const M_OPTIONS = [5, 10, 15, 20, 25, 30];

// 热力图区
const HX = 626;
const HY = 80;
const HCW = 26;
const HCCH = 76;

// 示意柱：平均准确率 vs 池大小 M（右图未印数值，按趋势估读，不是论文数据）
const BX = 40;
const BY = 520;
const BH = 70;
const BW = (580 - 5 * 6) / 6;

// 调料架区
const CSE_X = 60;
const CSE_TOP = 96;

interface Snap {
  M: number;
  Lp: number;
  N: number;
  ds: DsKey;
}

interface Tone {
  text: string;
  cls: string;
}

function paramsOf(M: number, Lp: number): number {
  return M * Lp * D + M * DK;
}

function heatText(v: number): string {
  return v.toFixed(2);
}

function heatColor(v: number, lo: number, hi: number): string {
  const t = clamp((v - lo) / Math.max(0.001, hi - lo), 0, 1);
  return `rgb(${Math.round(lerp(250, 217, t))},${Math.round(lerp(249, 119, t))},${Math.round(
    lerp(245, 87, t)
  )})`;
}

function allowedN(ds: DsKey, M: number): number[] {
  return DS[ds].nOptions.filter((n) => n <= M);
}

/** 把 N 夹到「不超过池子、且论文 Figure 4 热力图印出了数值」的最近取值，并给出可见理由。 */
function clampN(ds: DsKey, M: number, wanted: number): { value: number; note: Tone | null } {
  const pool = allowedN(ds, M);
  const table = DS[ds].heatN;
  const valid = pool.filter((n) => table.indexOf(n) >= 0);
  const maxPool = pool.length ? pool[pool.length - 1] : 1;
  const maxValid = valid.length ? valid[valid.length - 1] : maxPool;
  const cap = Math.min(maxPool, maxValid);
  if (wanted <= cap) return { value: wanted, note: null };
  if (wanted > maxPool) {
    return { value: cap, note: { text: '不能选超过池子里有的。', cls: '' } };
  }
  return {
    value: cap,
    note: { text: 'N 已夹到 ' + cap + '：热力图只印了这几个 N。', cls: '' },
  };
}

/** 复刻 Figure 4 的热力图格 + 池大小柱：真实的裸数字画在格内。 */
function drawFigure(ctx: CanvasRenderingContext2D, info: DsInfo, M: number, Lp: number, N: number) {
  const vals = info.heat.map((r) => r.slice());
  const flat: number[] = [];
  for (let r = 0; r < vals.length; r += 1) {
    for (let c = 0; c < vals[r].length; c += 1) flat.push(vals[r][c]);
  }
  const lo = Math.min.apply(null, flat);
  const hi = Math.max.apply(null, flat);

  ctx.save();
  ctx.strokeStyle = LP.dark;
  ctx.lineWidth = 2;
  lpRoundRect(ctx, HX - 10, HY - 10, 1040 - HX + 22, HCCH * 4 + HCW * 3 + 20, 8, false, true);
  ctx.restore();

  const hiRow = LP_OPTIONS.indexOf(Lp);
  const hiCol = info.heatN.indexOf(N);

  drawTypeCase(ctx, HX, HY, 1040 - HX, HCCH * 4 + HCW * 3, {
    cols: 4,
    rows: 4,
    gap: HCW,
    fill: (r, c) => heatColor(vals[r][c], lo, hi),
    cellText: (r, c) => heatText(vals[r][c]),
    highlight: hiRow >= 0 && hiCol >= 0 ? [[hiRow, hiCol]] : [],
  });

  if (info.poolV.length > 1) {
    const pLo = Math.min.apply(null, info.poolV);
    const pHi = Math.max.apply(null, info.poolV);
    ctx.save();
    ctx.strokeStyle = LP.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(BX - 8, BY + 2);
    ctx.lineTo(BX + 6 * BW + 5 * 6 + 8, BY + 2);
    ctx.stroke();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = LP.success;
    ctx.beginPath();
    ctx.moveTo(BX - 8, BY - BH * 0.94);
    ctx.lineTo(BX + 6 * BW + 5 * 6 + 8, BY - BH * 0.94);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < info.poolV.length; i += 1) {
      const t = (info.poolV[i] - pLo) / Math.max(0.001, pHi - pLo);
      const barH = clamp(BH * (0.1 + 0.84 * t), 6, BH);
      const bx = BX + i * (BW + 6);
      ctx.fillStyle = info.poolM[i] === M ? LP.accent : LP.dark;
      lpRoundRect(ctx, bx, BY - barH, BW, barH, 3, true, false);
      if (info.poolM[i] === M) {
        ctx.strokeStyle = LP.accent;
        ctx.lineWidth = 3;
        lpRoundRect(ctx, bx, BY - barH, BW, barH, 3, false, true);
      }
    }
    // 柱是示意读数：Figure 4 右图未印数值，必须在画面上申明。
    drawLabel(ctx, '示意读数', BX, BY + 16, { size: 11, color: LP.muted });
    drawLabel(ctx, '未印数值', BX + 72, BY + 16, { size: 11, color: LP.muted });
    if (N > info.heatN[info.heatN.length - 1]) {
      const probe = HX + (1040 - HX) * 0.92;
      ctx.fillStyle = LP.aux;
      ctx.beginPath();
      ctx.arc(probe, BY + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = LP.aux;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(probe, BY + 4);
      ctx.lineTo(probe, BY - 16);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

/** 一只手：手掌 + 四指。用来说明「换一个更大的调料架 / 把瓶身拉长」是一次真实搬运。 */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, lift: number) {
  const a = clamp(lift, 0, 1);
  ctx.save();
  ctx.fillStyle = LP.dark;
  ctx.strokeStyle = LP.support;
  ctx.lineWidth = 2;
  ctx.translate(0, -a * 6);
  lpRoundRect(ctx, x - 32, y + 6, 64, 30, 12, true, true);
  ctx.beginPath();
  ctx.moveTo(x - 26, y + 8);
  ctx.lineTo(x - 18, y - 6 - a * 6);
  ctx.lineTo(x - 10, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 4);
  ctx.lineTo(x + 1, y - 12 - a * 6);
  ctx.lineTo(x + 9, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 6);
  ctx.lineTo(x + 19, y - 5 - a * 6);
  ctx.lineTo(x + 25, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 手腕
  ctx.fillStyle = LP.dark;
  lpRoundRect(ctx, x - 12, y + 34, 24, 34, 9, true, true);
  ctx.restore();
}

export const ThreeKnobs: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_NORMAL;
  const H = isAna ? H_ANA : H_NORMAL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<Snap>({ M: 20, Lp: 5, N: 4, ds: 'five' });
  const animRef = useRef({
    caseW: 352,
    caseH: 53,
    grab: 0,
    phase: 0,
    dsFade: 1,
    dsFrom: 'five' as DsKey,
  });
  const rafRef = useRef<number | null>(null);
  const [st, setSt] = useState<Snap>({ M: 20, Lp: 5, N: 4, ds: 'five' });
  const [fb, setFb] = useState<Tone>({
    text: '先按默认配置摆好，再动其中一个旋钮。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('three-knobs: canvas ref is null', { isAna, W, H });
      return;
    }
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch (e) {
      console.error('three-knobs: setupCanvas failed', e);
      return;
    }
    console.log('three-knobs: canvas initialized', { isAna, W, H, width: canvas.width, height: canvas.height });

    let last = 0;
    const tick = (now: number) => {
      try {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const s = stRef.current;
      const a = animRef.current;

      const info = DS[s.ds];
      const caseW = 140 + ((s.M - 5) / 25) * 440;
      const caseH = 24 + ((s.Lp - 1) / 19) * 150;

      if (isAna) {
        // 类比卡：紧凑自动循环——调料架变宽（M），调料瓶变高（L_p），选中的瓶子发光（N）
        a.phase += dt;
        const cyc = a.phase % 5.2;
        const zoom = cyc < 2.2 ? 0 : cyc < 2.5 ? (cyc - 2.2) / 0.3 : 1;
        const tgtW = lerp(176, 352, zoom);
        const tgtPulse = lerp(0.2, 0.95, zoom);
        a.caseW = lerp(a.caseW, tgtW, 1 - Math.exp(-dt * 7));
        a.caseH = lerp(a.caseH, 44, 1 - Math.exp(-dt * 7));
        a.grab = lerp(a.grab, cyc > 2.5 && cyc < 4.4 ? 1 : 0, 1 - Math.exp(-dt * 5));

        drawField(ctx, 0, 0, W, H);
        // 台面
        ctx.save();
        ctx.strokeStyle = LP.light;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, 116);
        ctx.lineTo(W - 18, 116);
        ctx.stroke();
        ctx.restore();

        // 调料架（宽度随 M 变化）
        const spiceCount = 8;
        const rackW = a.caseW;
        const rackX = 46;
        const rackY = 36;
        const bottleW = (rackW - 4 * (spiceCount - 1)) / spiceCount;
        const bottleH = 30 + (a.caseH - 24) * 2; // 高度随 L_p 变化
        const spiceColors = [LP.accent, LP.success, LP.aux, LP.failure, LP.guide, LP.support, LP.accent, LP.success];
        const activeN = Math.floor(cyc * 2) % 3 + 1; // 同时选中的数量 N

        // 架子
        ctx.fillStyle = LP.support;
        lpRoundRect(ctx, rackX - 4, rackY + bottleH + 4, rackW + 8, 8, 2, true, false);

        // 调料瓶
        for (let i = 0; i < spiceCount; i++) {
          const bx = rackX + i * (bottleW + 4);
          const highlighted = i < activeN;
          drawSpiceBottle(ctx, bx, rackY + (40 - bottleH), bottleW, bottleH, {
            color: spiceColors[i % spiceColors.length],
            highlighted,
          });
        }

        drawLink(ctx, rackX + rackW + 26, 96, rackX + rackW + 4, 96, { color: LP.support, arrow: true });
        const M_val = Math.round(clamp((a.caseW - 140) / 440, 0, 1) * 25 + 5);
        drawLabel(ctx, `M=${M_val}  L_p=${Math.round(bottleH / 5)}  N=${activeN}`, W - 22, 24, {
          size: 12,
          color: LP.muted,
          align: 'right',
        });
        drawChefHand(ctx, rackX + rackW + 30, 60, { action: 'hold', time: a.phase });
      } else {
        const tgtW = caseW;
        const tgtH = caseH;
        a.caseW = lerp(a.caseW, tgtW, 1 - Math.exp(-dt * 7));
        a.caseH = lerp(a.caseH, tgtH, 1 - Math.exp(-dt * 7));
        const wantGrab = s.Lp > 1 ? 1 : 0.25;
        a.grab = lerp(a.grab, wantGrab, 1 - Math.exp(-dt * 5));
        a.dsFade = lerp(a.dsFade, 1, 1 - Math.exp(-dt * 6));

        const dispW = a.caseW;
        const dispH = a.caseH;
        const gap = 4;
        const cw = Math.max(6, (dispW - gap * (s.M - 1)) / s.M);

        // 参数读出用的字身条（三条：M / L_p / N 的容量对照）
        const segs: Array<[string, number, string]> = [
          [String(s.M), s.M / 30, LP.guide],
          [String(s.Lp), s.Lp / 20, LP.accent],
          [String(s.N), s.N / 20, LP.aux],
        ];

        drawField(ctx, 0, 0, W, H);
        ctx.save();
        ctx.strokeStyle = LP.light;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(26, 604);
        ctx.lineTo(W - 26, 604);
        ctx.stroke();
        ctx.restore();

        // 调料架：宽 ∝ M，格高 ∝ L_p
        for (let i = 0; i < s.M; i += 1) {
          const sx = CSE_X + i * (cw + gap);
          drawSort(ctx, sx, CSE_TOP, cw, dispH, {
            fill: i % 2 === 0 ? LP.support : LP.dark,
          });
          ctx.save();
          ctx.fillStyle = LP.light;
          ctx.globalAlpha = 0.9;
          const inner = clamp(cw * 0.34, 4, cw - 5);
          lpRoundRect(
            ctx,
            sx + (cw - inner) / 2,
            CSE_TOP + clamp(dispH * 0.2, 3, dispH * 0.3),
            inner,
            clamp(dispH * 0.46, 5, dispH * 0.6),
            2,
            true,
            false
          );
          ctx.restore();
        }

        drawLink(
          ctx,
          CSE_X + dispW + 30,
          CSE_TOP + dispH * 0.5,
          CSE_X + dispW + 6,
          CSE_TOP + dispH * 0.5,
          { color: LP.support, arrow: true }
        );
        drawHand(ctx, CSE_X + dispW + 36, CSE_TOP + dispH * 0.5, a.grab);

        // 三个旋钮的容量条
        for (let i = 0; i < segs.length; i += 1) {
          const bx = 60 + i * 176;
          const by = 556;
          const seg = segs[i];
          ctx.save();
          ctx.fillStyle = LP.light;
          lpRoundRect(ctx, bx, by, 150, 13, 6, true, false);
          ctx.fillStyle = seg[2];
          lpRoundRect(ctx, bx, by, Math.max(9, 150 * clamp(seg[1], 0.02, 1)), 13, 6, true, false);
          ctx.restore();
        }

        // 热力图：论文 Figure 4 的真实格
        ctx.save();
        ctx.globalAlpha = a.dsFade;
        drawFigure(ctx, info, s.M, s.Lp, s.N);
        ctx.restore();

        // Canvas 内只留两个短标签
        drawLabel(ctx, `调料架 ${s.M}`, 60, 614, { size: 13, color: LP.muted });
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.error('three-knobs render error:', e);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      last = 0;
    };
    const start = () => {
      if (!rafRef.current) {
        console.log('three-knobs: animation started');
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start(); // 强制启动，避免 IntersectionObserver 检测失败
    return () => {
      stop();
      disconnect();
    };
  }, [isAna, W, H]);

  const apply = (next: Partial<Snap>) => {
    const cur = stRef.current;
    const ds: DsKey = next.ds ?? cur.ds;
    const M = next.M ?? cur.M;
    const Lp = next.Lp ?? cur.Lp;
    const wanted = next.ds && next.N === undefined ? cur.N : next.N ?? cur.N;
    const res = clampN(ds, M, wanted);
    const snap: Snap = { ds, M, Lp, N: res.value };

    if (next.ds && next.ds !== cur.ds) {
      animRef.current.dsFrom = cur.ds;
      animRef.current.dsFade = 0;
    }
    stRef.current = snap;
    setSt(snap);

    if (res.note) {
      setFb(res.note);
      return;
    }
    if (snap.ds === 'five' && snap.Lp === 10 && snap.N === 2) {
      setFb({
        text:
          '这一格是 81.14——但热力图中格写的却是 80.68；81.14 出现在 (L_p = 10, N = 2)。两处对不上。',
        cls: 'bad',
      });
      return;
    }
    if (snap.Lp === 1) {
      setFb({ text: 'L_p 太小，永远是最差的一档（CIFAR 上 77.01）。', cls: 'bad' });
      return;
    }
    if (snap.Lp === 20) {
      setFb({ text: 'L_p 过大反而欠拟合（CIFAR 上 79.65）。', cls: 'bad' });
      return;
    }
    if (snap.N === 1) {
      setFb({ text: 'Split CIFAR-100 只剩 77.01。', cls: '' });
      return;
    }
    const pool = DS[snap.ds].poolV;
    const seg = DS[snap.ds].segment.split(',').map(Number);
    setFb({
      text:
        `M = ${snap.M}、L_p = ${snap.Lp}、N = ${snap.N}：` +
        `prompt 参数 ${paramsOf(snap.M, snap.Lp).toLocaleString('en-US')} 个（M·L_p·D + M·D_k）。` +
        `${DS[snap.ds].poolNote}；下方柱是示意读数 ${pool[0]} → ${pool[pool.length - 1]}。`,
      cls: lpTone(pool[pool.length - 1], seg[1], seg[0]),
    });
  };

  if (isAna) {
    return (
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    );
  }

  const info = DS[st.ds];
  const params = paramsOf(st.M, st.Lp);
  const headParams = 768 * 100;
  const maxPool = allowedN(st.ds, st.M);
  const nLocked = maxPool.length === 0;

  return (
    <div>
      <div className="ctrl">
        <label>池大小 M</label>
        <input
          type="range"
          min={0}
          max={M_OPTIONS.length - 1}
          step={1}
          value={Math.max(0, M_OPTIONS.indexOf(st.M))}
          onChange={(e) => apply({ M: M_OPTIONS[Number(e.target.value)] ?? 20 })}
        />
        <span className="val">{st.M}</span>
      </div>

      <div className="ctrl">
        <label>单条长度 L_p</label>
        <input
          type="range"
          min={0}
          max={LP_OPTIONS.length - 1}
          step={1}
          value={Math.max(0, LP_OPTIONS.indexOf(st.Lp))}
          onChange={(e) => apply({ Lp: LP_OPTIONS[Number(e.target.value)] ?? 5 })}
        />
        <span className="val">{st.Lp}</span>
      </div>

      <div className="ctrl">
        <label>选择数 N</label>
        <input
          type="range"
          min={0}
          max={Math.max(0, info.nOptions.indexOf(maxPool[maxPool.length - 1]) )}
          step={1}
          disabled={nLocked}
          value={Math.max(0, info.nOptions.indexOf(st.N))}
          onChange={(e) => apply({ N: info.nOptions[Number(e.target.value)] ?? st.N })}
        />
        <span className="val">{st.N}</span>
      </div>

      <div className="ctrl">
        <label>基准数据集</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {(Object.keys(DS) as DsKey[]).map((k) => (
            <button
              key={k}
              type="button"
              className={k === st.ds ? 'chip selected' : 'chip'}
              onClick={() => apply({ ds: k })}
            >
              {DS[k].name}
            </button>
          ))}
        </div>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="metrics">
        <div className="metric">
          <div className="l">M · L_p · D + M · D_k</div>
          <div className="v">{params.toLocaleString('en-US')}</div>
        </div>
        <div className="metric">
          <div className="l">池容量 M</div>
          <div className="v">{st.M} × {st.Lp}</div>
        </div>
        <div className="metric">
          <div className="l">当前选择的 N 个</div>
          <div className="v">{st.N}</div>
        </div>
      </div>

      <div className="step-desc">
        左边调料架的宽度就是 <b>M</b>，每一格的高度就是 <b>L_p</b>；右边是两张热力图的
        <b>实测数值复刻</b>——每格里的数字是平均准确率，橙框圈住你当前选的 (L_p, N)。下方两排小柱是
        <b>示意读数</b>：在 <b>CIFAR-100 上升有限</b>、在 <b>5-datasets 上总体在涨</b>——
        任务彼此很像时池子帮不上忙，任务差得远时池子越大越装得下。{info.source}
      </div>

      <div className="feedback">{fb.text}</div>

      <div className="three-col-demo" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="three-col-panel clean">
          <div className="three-col-label">正文声明</div>
          <div className="step-desc" style={{ textAlign: 'left' }}>
            CIFAR-100 系与 CORe50 取 <b>M = 10, N = 5, L_p = 5</b>；5-datasets 取
            <b> M = 20, N = 4, L_p = 5</b>；λ「对所有数据集统一取 0.5」；优化器写的是 <b>Adam</b>。
          </div>
        </div>
        <div className="three-col-panel noisy">
          <div className="three-col-label">代码实现</div>
          <div className="step-desc" style={{ textAlign: 'left' }}>
            直接读取上游仓库 <code>google-research/l2p</code> 的 <code>configs/</code>
            文件：<b>pool_size = 10</b>（5-datasets 是 20）、<b>length = 10、top_k = 4</b>
            （CORe50 的 <b>length = 5</b>）；<b>pull_constraint_coeff</b> 只有 5-datasets 是 0.5，
            另外三个是 1.0；CORe50 写 <b>optim = "sgd"</b>（正文写 Adam）。
          </div>
        </div>
        <div className="three-col-panel recover">
          <div className="three-col-label">复算核对</div>
          <div className="step-desc" style={{ textAlign: 'left' }}>
            按 L_p = 10 算：Split CIFAR-100 系是 10×10×768 + 10×768 = <b>84,480</b>，
            5-datasets 是 20×10×768 + 20×768 = <b>168,960</b>；而 224×224×3 = <b>150,528</b>，
            所以「最大 prompt 空间小于一张 224×224 图片」<b>在发布配置下不成立</b>。
            0.05% / 0.11% 对应的是 46,080 与 92,160。100 类头是 768×100 =
            <b>{headParams.toLocaleString('en-US')}</b>，比 46,080 的池子还大。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeKnobs;

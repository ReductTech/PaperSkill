import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawLabel,
  drawLegend,
} from './letterpressKit';

// chap-6 / 6.2 一次捏几个 — 主导操作 P1 滑块。
// N 越大，版头越宽（左），精度先涨后平（右下），注意力代价按序列长度平方往上翻（左下）。
// 精度只取自论文图 4 左格 L_p = 1 那一行印出的数值：N = 1 → 77.01、5 → 82.49、
// 10 → 83.39、20 → 83.15；中间只做相邻数值点之间的线性读数。注意该图 caption 的条件是 M = 20，
// 与 §5.2 的 M = 10 不是同一个设置——所以这几个数只用来演示「N 的影响」这一条趋势。
// 右下那条注意力代价曲线不是论文的数值，是本教程按序列长度平方自算的示意量（见 costNorm）。
// 序列行数按 Eq.2 记：N·L_p 行 prompt + 1 行 [class] + 196 行 patch，N = 5 时是 222 行。
// §5.2 的 CIFAR-100 系列取 M = 10、N = 5（官方代码 top_k = 4）；本图按图 4 左格固定 M = 20。

const WD = 1080;
const HD = 380;
const WA = 560;
const HA = 140;

const M = 20; // 池中 prompt 总数（按图 4 左格固定；§5.2 的 CIFAR-100 系列是 M = 10）
const LP_ = 5; // 单条 prompt 行数
const L = 196; // patch 数
const CLS = 1; // [class] 行，夹在 prompt 行与 patch 行之间

/** x_p 的总行数：N·L_p 行 prompt + 1 行 [class] + 196 行 patch。N = 5 时是 222。 */
function seqLen(n: number): number {
  return clamp(Math.round(n), 1, M) * LP_ + CLS + L;
}

// 论文图 4 左图印出的数值（L_p = 1，M = 20）
const MEASURED: { n: number; acc: number }[] = [
  { n: 1, acc: 77.01 },
  { n: 5, acc: 82.49 },
  { n: 10, acc: 83.39 },
  { n: 20, acc: 83.15 },
];

function accAt(n: number): number {
  const v = clamp(Math.round(n), 1, M);
  for (let i = 0; i < MEASURED.length - 1; i++) {
    const a = MEASURED[i];
    const b = MEASURED[i + 1];
    if (v >= a.n && v <= b.n) {
      return lerp(a.acc, b.acc, (v - a.n) / (b.n - a.n));
    }
  }
  return MEASURED[MEASURED.length - 1].acc;
}

/** 序列长度的平方项归一化（示意量，非论文数据）：N = 1 → 0，N = 20 → 1。 */
function costNorm(n: number): number {
  const len = (v: number) => seqLen(v) * seqLen(v);
  const a = len(1);
  const b = len(M);
  return clamp((len(clamp(n, 1, M)) - a) / (b - a), 0, 1);
}

interface St {
  n: number;
}

export const SelectCount: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? WA : WD;
  const H = isAna ? HA : HD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<St>({ n: 5 });
  const rafRef = useRef<number | null>(null);
  const [n, setN] = useState(5);
  const [feedback, setFeedback] = useState({
    text:
      '图 4 左格把池子固定成 M = 20 条；§5.2 的 CIFAR-100 系列是 M = 10、N = 5（官方代码 top_k = 4）。' +
      '拖动 N：从池中挑出最近的 N 种，看调料多宽、准确率怎么动。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const GX = 40;
    const GW = 580;
    const GY = 54;
    const GH = 230;
    const RX = 660;
    const RW = 380;
    const ACC_Y = 60;
    const ACC_H = 120;
    const COST_Y = 240;
    const COST_H = 110;

    const renderAna = (s: St, t: number) => {
      const phase = (t / 1800) % 1;
      const nNow = 1 + Math.round(phase * (M - 1));
      drawField(ctx, 0, 0, W, H);
      const headW = 60 + (nNow / M) * 300;
      ctx.fillStyle = LP.accent;
      lpRoundRect(ctx, 40, 34, headW, 40, 4, true, false);
      ctx.strokeStyle = LP.dark;
      ctx.lineWidth = LP_LW;
      lpRoundRect(ctx, 40, 34, headW, 40, 4, false, true);
      ctx.fillStyle = LP.light;
      lpRoundRect(ctx, 40 + headW, 34, 460 - headW, 40, 4, true, false);
      drawLabel(ctx, `N=${nNow}`, 40, 100, { size: 13, color: LP.ink });
    };

    const renderNormal = (s: St) => {
      drawField(ctx, 0, 0, W, H);
      const nv = clamp(s.n, 1, M);
      const acc = accAt(nv);

      // ---- 左：调料行数与序列
      drawLabel(ctx, '调料', GX, 40, { size: 12, color: LP.muted });
      const headRows = Math.max(1, Math.round((nv / M) * 8));
      drawTypeCase(ctx, GX, GY, GW, GH, {
        cols: 8,
        rows: 8,
        gap: 6,
        fill: (r) => (r < headRows ? LP.accent : LP.bg),
      });
      drawLabel(ctx, `N=${nv}`, GX + 2, GY + GH + 22, { size: 13, weight: 700, color: LP.ink });
      drawLabel(ctx, `序列 ${seqLen(nv)}`, GX + 110, GY + GH + 22, {
        size: 13,
        color: LP.muted,
      });
      drawLegend(
        ctx,
        [
          { label: '调料行', color: LP.accent },
          { label: 'patch 行', color: LP.bg },
        ],
        GX + 280,
        GY + GH + 16,
        { size: 12 }
      );

      // ---- 右上：准确率读数（横轴 76–84）
      lpRoundRect(ctx, RX, ACC_Y, RW, ACC_H, 8, false, true);
      const ax0 = RX + 40;
      const ax1 = RX + RW - 26;
      const accX = (v: number) => ax0 + ((clamp(v, 76, 84) - 76) / 8) * (ax1 - ax0);
      const ay = ACC_Y + 74;
      ctx.save();
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(ax0, ay);
      ctx.lineTo(ax1, ay);
      ctx.stroke();
      ctx.restore();
      // 原图印出的数值点
      MEASURED.forEach((p) => {
        ctx.save();
        ctx.fillStyle = LP.muted;
        ctx.beginPath();
        ctx.arc(accX(p.acc), ay, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // 当前 N 的标记：只有落在原图印出的数值点附近才用绿/橙，其余保持中性
      const atMeasured = MEASURED.some((p) => p.n === nv);
      const markColor = atMeasured
        ? acc >= 83.3
          ? LP.success
          : LP.accent
        : LP.ink;
      ctx.save();
      ctx.strokeStyle = markColor;
      ctx.lineWidth = LP_LW_EMPH;
      ctx.beginPath();
      ctx.moveTo(accX(acc), ay - 22);
      ctx.lineTo(accX(acc), ay + 22);
      ctx.stroke();
      ctx.fillStyle = markColor;
      ctx.beginPath();
      ctx.arc(accX(acc), ay - 26, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawLabel(ctx, acc.toFixed(2), clamp(accX(acc) - 22, ax0, ax1 - 40), ay - 36, {
        size: 15,
        weight: 700,
        color: markColor,
      });
      drawLabel(ctx, '76', ax0 - 8, ay + 20, { size: 11, color: LP.muted });
      drawLabel(ctx, '84', ax1 - 12, ay + 20, { size: 11, color: LP.muted });
      drawLabel(ctx, '准确率', RX + 12, ACC_Y + 24, { size: 12, color: LP.muted });

      // ---- 右下：注意力代价（序列长度平方）
      lpRoundRect(ctx, RX, COST_Y, RW, COST_H, 8, false, true);
      drawLabel(ctx, '注意力代价示意', RX + 12, COST_Y + 22, { size: 12, color: LP.muted });
      const cx0 = RX + 40;
      const cx1 = RX + RW - 26;
      const cy0 = COST_Y + COST_H - 22;
      const cy1 = COST_Y + 34;
      ctx.save();
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = LP_LW;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx1, cy0);
      ctx.stroke();
      ctx.strokeStyle = LP.aux;
      ctx.lineWidth = LP_LW_EMPH;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const v = 1 + (k / 60) * (M - 1);
        const px = cx0 + ((v - 1) / (M - 1)) * (cx1 - cx0);
        const py = cy0 - costNorm(v) * (cy0 - cy1);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      // 当前 N 在曲线上的位置
      const px = cx0 + ((nv - 1) / (M - 1)) * (cx1 - cx0);
      const py = cy0 - costNorm(nv) * (cy0 - cy1);
      ctx.save();
      ctx.fillStyle = LP.aux;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = LP.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, `${seqLen(nv)}`, clamp(px - 16, cx0, cx1 - 30), py - 12, {
        size: 11,
        color: LP.ink,
      });
      // 横轴右端是 N = M = 20：序列 20×5 + 1 + 196 = 297 行
      drawLabel(ctx, `${seqLen(M)}`, cx1 - 26, cy0 + 16, { size: 11, color: LP.muted });
    };

    const tick = (t: number) => {
      if (isAna) renderAna(stateRef.current, t);
      else renderNormal(stateRef.current);
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
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H, isAna]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 1, M);
    stateRef.current = { n: v };
    setN(v);
    if (v === 1) {
      setFeedback({ text: 'Split CIFAR-100 只剩 77.01。', cls: 'bad' });
    } else if (v === 5) {
      setFeedback({ text: 'N = 5 → 82.49（83.39 是 N = 10）。', cls: 'good' });
    } else if (v >= 18) {
      setFeedback({ text: '83.15，几乎不再涨，注意力代价却翻了几倍（代价曲线为示意）。', cls: 'bad' });
    } else if (accAt(v) >= 83.3) {
      setFeedback({ text: `${accAt(v).toFixed(2)}，已经在原图印出的高位。`, cls: 'good' });
    } else {
      setFeedback({ text: `${accAt(v).toFixed(2)}，还在爬坡。`, cls: '' });
    }
  };

  if (isAna) {
    return (
      <div>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
    );
  }

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          每次取 N <span className="val">{n}</span>
        </label>
        <input
          type="range"
          min={1}
          max={M}
          step={1}
          value={n}
          aria-label="每次检索的 prompt 条数 N"
          onChange={onChange}
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="l">准确率</span>
          <span className="v">{accAt(n).toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="l">序列长度</span>
          <span className="v">{seqLen(n)}</span>
        </div>
        <div className="metric">
          <span className="l">池中条数 M（图 4）</span>
          <span className="v">{M}</span>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default SelectCount;

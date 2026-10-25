import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, rr, txt, clamp, lerp, easeOut, easeInOut, glow, rng } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Feedback, Seg, Tag, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { StageSplit, fitStageH } from '../ui/StageSplit';
import { TimeBar, type Phase } from '../ui/TimeBar';
import { useTimeline } from '../lib/timeline';
import { emitPulse } from '../lib/bus';

// 1.1 一张图碎成视觉 token（主角交互）。
// 阶段：一张图 → 切成 24×24 块 → 飞进输入序列（35 个系统 token + 576 个视觉 token + 约 30 个指令 token）
// → 整段序列在 32 层里逐层付费。
// 数字口径：576 与 35 来自论文正文；文字 token 约 65（35 系统 + 约 30 指令）由表 2 的 8.48 TFLOPs 反推（公式外推）；
// 视觉占一层计算量的比例按 Eq. (1) 外推。图片是本页画的示意图。

const SYS = 35;
const INS = 30;
const LAYERS = 32;

const MODES = {
  l15: { label: 'LLaVA-1.5：576 个', cols: 24, rows: 24, V: 576, note: '576 个（论文正文）' },
  next: { label: '高分辨率：约 1990 个', cols: 45, rows: 44, V: 1980, note: '约 1990 个（由表 2 反推的 LLaVA-NeXT 平均值，公式外推；画面按 45×44 = 1980 块示意）' },
} as const;
type ModeKey = keyof typeof MODES;

const PHASES: Phase[] = [
  { at: 0, label: '一张图' },
  { at: 0.16, label: '切块' },
  { at: 0.36, label: '排进序列' },
  { at: 0.66, label: '逐层付费' },
];

/** 画一张示意图：月夜海港（只用于本页演示） */
function paintPicture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, '#1b2a6b');
  sky.addColorStop(0.45, '#6b4f9e');
  sky.addColorStop(0.62, '#f2a46b');
  sky.addColorStop(0.63, '#1d4f7a');
  sky.addColorStop(1, '#0a1f3a');
  g.fillStyle = sky;
  g.fillRect(0, 0, size, size);
  // 月亮
  g.fillStyle = '#fff3d6';
  g.beginPath();
  g.arc(size * 0.72, size * 0.24, size * 0.09, 0, Math.PI * 2);
  g.fill();
  // 远山
  g.fillStyle = '#2b2350';
  g.beginPath();
  g.moveTo(0, size * 0.62);
  g.lineTo(size * 0.18, size * 0.44);
  g.lineTo(size * 0.34, size * 0.58);
  g.lineTo(size * 0.52, size * 0.4);
  g.lineTo(size * 0.7, size * 0.6);
  g.lineTo(size, size * 0.5);
  g.lineTo(size, size * 0.63);
  g.lineTo(0, size * 0.63);
  g.fill();
  // 月光倒影
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(255,236,200,${0.5 - i * 0.05})`;
    g.fillRect(size * 0.66 - i * 2, size * (0.66 + i * 0.035), size * 0.12 + i * 4, size * 0.012);
  }
  // 小船
  g.fillStyle = '#f0d2a8';
  g.beginPath();
  g.moveTo(size * 0.2, size * 0.78);
  g.lineTo(size * 0.42, size * 0.78);
  g.lineTo(size * 0.38, size * 0.83);
  g.lineTo(size * 0.24, size * 0.83);
  g.fill();
  g.fillStyle = '#e8e6f0';
  g.beginPath();
  g.moveTo(size * 0.31, size * 0.77);
  g.lineTo(size * 0.31, size * 0.6);
  g.lineTo(size * 0.4, size * 0.76);
  g.fill();
  return c;
}

export const M1Shatter: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<ModeKey>('l15');
  const M = MODES[mode];
  const tl = useTimeline(11);
  const pic = useRef<HTMLCanvasElement | null>(null);
  const colors = useRef<string[]>([]);
  const firedFill = useRef(false);

  const total = SYS + M.V + INS;
  const visShare = useMemo(() => {
    const h = 4096;
    const s = total;
    const layer = 2 * s * s * h + 12 * s * h * h;
    const text = 2 * (SYS + INS) ** 2 * h + 12 * (SYS + INS) * h * h;
    return (layer - text) / layer;
  }, [total]);

  // 预先取样每个图块的颜色
  const sample = (cols: number, rows: number) => {
    if (!pic.current) pic.current = paintPicture(240);
    const g = pic.current.getContext('2d')!;
    const out: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const d = g.getImageData(Math.floor(((c + 0.5) / cols) * 240), Math.floor(((r + 0.5) / rows) * 240), 1, 1).data;
        out.push(`rgb(${d[0]},${d[1]},${d[2]})`);
      }
    colors.current = out;
  };

  useEffect(() => {
    sample(M.cols, M.rows);
  }, [M.cols, M.rows]);

  const jitter = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 2000 }, () => r());
  }, []);

  const s = useStage(
    {
      heightOf: (w) => (w < 560 ? fitStageH(w, Math.round((w - 42) * 0.47 + 150), 260, true) : fitStageH(w, clamp(w * 0.68, 380, 520), 340)),
      live: tl.playing,
      draw: ({ ctx, w, h, dt, final }) => {
        if (!final) tl.tick(dt);
        const p = tl.pRef.current;
        if (colors.current.length !== M.cols * M.rows) sample(M.cols, M.rows);
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 560;
        const pad = 14;
        // 区域
        // 窄屏也是“图在左、序列在右、逐层柱在下”，舞台更矮，控件能紧跟其后
        const imgY = pad + 16;
        const S = narrow ? Math.min((w - pad * 2 - 14) * 0.47, h - imgY - 104) : Math.min(h * 0.6, w * 0.36);
        const imgX = pad;
        const seqX = imgX + S + (narrow ? 14 : 26);
        const seqY = imgY;
        const seqW = w - seqX - pad;
        const stripH = Math.max(narrow ? 60 : 70, h - imgY - S - 38);
        const seqH = S;
        const stripY = h - stripH - 10;
        // 序列网格尺寸
        const cell = Math.max(2.2, Math.floor(Math.sqrt((seqW * seqH) / total) * 10) / 10);
        const scols = Math.max(8, Math.floor(seqW / cell));
        const seqPos = (i: number) => ({ x: seqX + (i % scols) * cell, y: seqY + Math.floor(i / scols) * cell });

        // 阶段进度
        const pCut = clamp((p - 0.16) / 0.18, 0, 1);
        const pFly = clamp((p - 0.36) / 0.28, 0, 1);
        const pPay = clamp((p - 0.66) / 0.3, 0, 1);

        txt(ctx, '一张图（示意图）', imgX, imgY - 9, { size: 11, color: C.ink2, weight: 600 });
        txt(ctx, narrow ? '输入序列（1 格 = 1 token）' : '输入序列：每个小方块 = 1 个 token', seqX, seqY - 9, { size: 11, color: C.ink2, weight: 600 });

        // 原图（切块前完整可见，切块后淡出）
        if (pic.current && pFly < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - pCut * 0.85;
          ctx.drawImage(pic.current, imgX, imgY, S, S);
          ctx.restore();
        }
        // 切块网格线（扫描式出现）
        if (pCut > 0 && pFly < 1) {
          ctx.strokeStyle = rgba(C.moon, 0.35 * (1 - pFly));
          ctx.lineWidth = 0.6;
          const lines = Math.floor(pCut * (M.cols + 1));
          ctx.beginPath();
          for (let k = 0; k <= lines && k <= M.cols; k++) {
            const x = imgX + (k / M.cols) * S;
            ctx.moveTo(x, imgY);
            ctx.lineTo(x, imgY + S);
            const y = imgY + (k / M.rows) * S;
            ctx.moveTo(imgX, y);
            ctx.lineTo(imgX + S, y);
          }
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        // 序列中的系统 token（先到）与指令 token（最后到）
        const sysIn = clamp(pFly / 0.12, 0, 1);
        for (let i = 0; i < SYS; i++) {
          const q = clamp(sysIn * 1.4 - i / SYS * 0.4, 0, 1);
          if (q <= 0) continue;
          const { x, y } = seqPos(i);
          ctx.fillStyle = rgba(C.sys, 0.9 * q);
          ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
        }
        const insIn = clamp((pFly - 0.85) / 0.15, 0, 1);
        for (let i = 0; i < INS; i++) {
          const q = clamp(insIn * 1.4 - i / INS * 0.4, 0, 1);
          if (q <= 0) continue;
          const { x, y } = seqPos(SYS + M.V + i);
          ctx.fillStyle = rgba(C.ins, 0.95 * q);
          ctx.fillRect(x, y, cell - 0.6, cell - 0.6);
        }
        // 视觉 token：从图中的位置飞到序列里
        const tw = S / M.cols;
        const th = S / M.rows;
        let arrived = 0;
        for (let i = 0; i < M.V; i++) {
          const c = i % M.cols;
          const r = Math.floor(i / M.cols);
          const gap = pCut * Math.min(1.6, tw * 0.25);
          const sx = imgX + c * tw + gap / 2;
          const sy = imgY + r * th + gap / 2;
          const q = easeInOut(clamp((pFly - 0.08 - (i / M.V) * 0.62) / 0.22, 0, 1));
          if (q >= 1) arrived++;
          const { x: tx, y: ty } = seqPos(SYS + i);
          const arc = Math.sin(q * Math.PI) * (narrow ? 20 : 40) * (jitter[i % jitter.length] - 0.5);
          const x = lerp(sx, tx, q);
          const y = lerp(sy, ty, q) + arc;
          const sz = lerp(Math.max(1, tw - gap), cell - 0.6, q);
          if (pCut <= 0 && q <= 0) continue; // 切块前直接显示原图
          ctx.fillStyle = q > 0.98 ? rgba(C.vis, 0.85) : colors.current[i] ?? C.vis;
          ctx.fillRect(x, y, sz, sz);
        }
        // 序列满载时的光（关键时刻）
        if (pFly >= 1 && pPay < 0.25) {
          glow(ctx, seqX + seqW / 2, seqY + seqH / 2, Math.max(seqW, seqH) * 0.6, C.vis, 0.25 * (1 - pPay / 0.25));
        }
        // 逐层付费：序列扫过每一层，柱子依次亮起（每层都一样贵）
        const lanes = LAYERS;
        const lw = (w - pad * 2) / lanes;
        const paid = pPay * lanes;
        txt(ctx, narrow ? `${LAYERS} 层，每层都算一遍` : `${LAYERS} 层：整段序列每层都要算一遍`, pad, stripY - 8, { size: 11, color: C.ink2, weight: 600 });
        for (let l = 0; l < lanes; l++) {
          const x = pad + l * lw + 1;
          const k = clamp(paid - l, 0, 1);
          const bh = stripH - 14;
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          rr(ctx, x, stripY, lw - 2, bh, 2);
          ctx.fill();
          if (k > 0) {
            const hh = bh * easeOut(k);
            ctx.fillStyle = rgba(C.ins, 0.9);
            rr(ctx, x, stripY + bh - hh, lw - 2, hh, 2);
            ctx.fill();
            ctx.fillStyle = rgba(C.vis, 0.9);
            rr(ctx, x, stripY + bh - hh, lw - 2, hh * visShare, 2);
            ctx.fill();
          }
        }
        if (pPay > 0 && pPay < 1) {
          const x = pad + paid * lw;
          glow(ctx, x, stripY + (stripH - 14) / 2, 26, C.moon, 0.7);
          // 扫描光同时扫过序列：表示这一层把整段序列算了一遍
          const sy = seqY + ((paid % 1) * seqH);
          ctx.fillStyle = rgba(C.moon, 0.14);
          ctx.fillRect(seqX, sy - 3, seqW, 6);
        }
        // 关键时刻的结论：原图位置变成“结论区”（原图只剩残影，表示它已经全部变成了 token）
        if (pFly >= 1 && pic.current) {
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.drawImage(pic.current, imgX, imgY, S, S);
          ctx.restore();
          ctx.strokeStyle = rgba(C.vis, 0.25);
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(imgX + 0.5, imgY + 0.5, S - 1, S - 1);
          ctx.setLineDash([]);
          const a1 = clamp((p - 0.62) / 0.05, 0, 1);
          const a2 = clamp((p - 0.95) / 0.04, 0, 1);
          const cxm = imgX + S / 2;
          ctx.globalAlpha = a1;
          txt(ctx, `${M.V}`, cxm, imgY + S * 0.3, { size: Math.min(46, S * 0.2), color: C.vis, align: 'center', weight: 800 });
          txt(ctx, `个视觉 token / 约 ${total} 个`, cxm, imgY + S * 0.3 + Math.min(34, S * 0.14), { size: narrow ? 11 : 13, color: C.moon, align: 'center', weight: 700 });
          ctx.globalAlpha = a2;
          txt(ctx, `约占每层计算的 ${Math.round(visShare * 100)}%`, cxm, imgY + S * 0.68, { size: narrow ? 13 : 16, color: C.moon, align: 'center', weight: 800 });
          txt(ctx, '（Eq. 1 外推）', cxm, imgY + S * 0.68 + 20, { size: 10, color: C.ink3, align: 'center' });
          ctx.globalAlpha = 1;
          if (a2 > 0) glow(ctx, cxm, imgY + S * 0.68, S * 0.45, C.vis, 0.12 * a2);
        }
        // 关键时刻通知背景（只在正向播放时）
        if (tl.playing && pFly >= 1 && !firedFill.current) {
          firedFill.current = true;
          emitPulse('fill');
        }
        if (p < 0.36) firedFill.current = false;
        // 计数
        const inSeq = (sysIn > 0 ? SYS : 0) + arrived + (insIn >= 1 ? INS : 0);
        if (narrow) txt(ctx, `序列 ${inSeq} / 约 ${total}`, w - pad, stripY - 8, { size: 11, color: C.moon, align: 'right', weight: 700 });
        else txt(ctx, `序列长度 ${inSeq} / 约 ${total}`, seqX + seqW, seqY - 9, { size: 11, color: C.moon, align: 'right', weight: 700 });
        return tl.playing;
      },
    },
    // 播放中由循环自己推进；暂停 / 拖动时按新的 p 重画
    [mode, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  const phase = [...PHASES].reverse().find((ph) => tl.p >= ph.at)?.label ?? '一张图';
  const lead: Record<string, React.ReactNode> = {
    一张图: <>这是一张普通的图。大模型看不懂像素，要先把它变成一个个 token。</>,
    切块: <>图被切成 {M.cols}×{M.rows} 个小块，每块经过视觉编码器和投影，变成一个视觉 token。</>,
    排进序列: (
      <>
        视觉 token 排进输入序列，夹在 35 个系统 token 和约 30 个指令 token 中间——它们占了大头。
      </>
    ),
    逐层付费: (
      <>
        整段序列要在 {LAYERS} 层里各算一遍。按 Eq. (1) 外推，每一层里视觉 token 约占 <b>{Math.round(visShare * 100)}%</b> 的计算。
      </>
    ),
  };

  return (
    <StageSplit
      stage={
        <StageBox
          s={s}
          label={`示意：一张图被切成 ${M.V} 个视觉 token，排进约 ${total} 个 token 的输入序列；按 Eq.(1) 外推，视觉 token 约占每层计算的 ${Math.round(visShare * 100)}%`}
        />
      }
      side={
        <>
          <TimeBar tl={tl} phases={PHASES} label="从图片到账单的进度" />
          <Feedback tone="info" k={`${phase}-${mode}`} lead={lead[phase]} more={<p>视觉 token 数：{M.note}。文字 token 约 65（35 个系统 + 约 30 个指令）由表 2 的 8.48 TFLOPs 反推，属于公式外推；指令 token 的实际数量随问题变化。比例按 Eq. (1) 计算（h = 4096），只是理论计算量，不是实测时间。</p>} />
          <div className="stage-top">
            <Seg
              small
              label="图像分辨率"
              value={mode}
              onChange={(m) => {
                setMode(m);
                tl.replay();
              }}
              options={(Object.keys(MODES) as ModeKey[]).map((k) => ({ value: k, label: MODES[k].label }))}
            />
            <span className="stage-tags">
              <EvChip id="rw576" />
            </span>
          </div>
        </>
      }
    />
  );
};

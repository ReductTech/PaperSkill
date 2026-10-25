import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, rr, txt, clamp, lerp, easeOut, glow, rng, pill } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Feedback, Slider, Tag, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { StageSplit, fitStageH } from '../ui/StageSplit';
import { TimeBar, type Phase } from '../ui/TimeBar';
import { useTimeline } from '../lib/timeline';
import { computeFlops } from '../lib/flops';
import { emitPulse } from '../lib/bus';

// 5.1 撤出穿越（主角交互）。LLaVA-1.5-7B 的 32 层；K 按官方代码口径：先完整处理 K 层，在第 K+1 层入口撤走视觉 token。
// 光柱 = token 通道（数量是示意，不是真实 token 数）；右侧计算量按 Eq. (1) 外推（s ≈ 641、V = 576）。

const N = 32;
const LANES: ('sys' | 'vis' | 'txt')[] = ['sys', 'sys', 'sys', ...Array<'vis'>(16).fill('vis'), 'txt', 'txt', 'txt', 'txt'];
const BURST = 0.1; // 爆散持续的进度长度
// “算账”提示在 [SETTLE0, SETTLE1] 内淡入；“算账”阶段按钮落在 SETTLE1，点击后直接是完全清楚的终态
const SETTLE0 = 0.84;
const SETTLE1 = 0.9;

export const M5Withdraw: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(16);
  const tl = useTimeline(9);
  const fired = useRef(false);
  const parts = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 90 }, () => ({ lane: Math.floor(r() * 16), vx: (r() - 0.5) * 2, vy: -0.3 - r() * 1.2, life: 0.5 + r() * 0.5, size: 1 + r() * 2.4 }));
  }, []);

  const flops = useMemo(() => computeFlops({ model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K, R: 0.5, conv: 'code', scope: 'all' }), [K]);
  // 爬升占进度的前 82%，之后停在终态
  const climbEnd = 0.82;
  const pK = (K / N) * climbEnd; // 光波到达第 K+1 层入口的进度

  const phases: Phase[] = [
    { at: 0, label: `前 ${K} 层：全部 token` },
    { at: pK, label: `第 ${K + 1} 层入口：撤出` },
    { at: Math.min(SETTLE0 - 0.02, pK + BURST + 0.02), label: '只剩文字继续' },
    { at: SETTLE1, label: '算账' },
  ];

  const s = useStage(
    {
      heightOf: (w) => (w < 520 ? fitStageH(w, clamp(w * 0.95, 340, 440), 320, true) : fitStageH(w, clamp(w * 0.75, 400, 540), 360)),
      live: tl.playing,
      draw: ({ ctx, w, h, t, dt, final }) => {
        if (!final) tl.tick(dt);
        const p = tl.pRef.current;
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 520;
        const meterW = narrow ? w - 28 : Math.min(240, w * 0.3);
        const meterH = narrow ? 80 : h - 40;
        const towerX = 34;
        const towerW = narrow ? w - towerX - 12 : w - meterW - towerX - 40;
        const towerY = 18;
        const towerH = narrow ? h - meterH - 54 : h - 40;
        const rh = towerH / N;
        const lw = towerW / LANES.length;
        const Y = (l: number) => towerY + towerH - rh * (l + 1); // 第 l 层（0 起）的顶部
        const front = clamp(p / climbEnd, 0, 1) * N; // 光波到达的层数
        const crossed = front >= K;
        const q = clamp((p - pK) / BURST, 0, 1); // 爆散进度
        // 层号
        for (let l = 0; l < N; l++) if ((l === 0 || (l + 1) % 8 === 0 || l === K || l === K - 1) && !(rh < 15 && Math.abs(l - (K - 1)) === 1)) txt(ctx, `L${l + 1}`, towerX - 6, Y(l) + rh / 2, { size: 9, color: l < K ? C.ink2 : C.ink4, align: 'right' });
        // 撤出后留下的空白：一块淡淡的“退潮区”，表示省下的计算
        const visL = towerX + lw * 3;
        const visR = towerX + lw * 19;
        if (crossed) {
          const yTop = towerY;
          const yK = Y(K - 1);
          const a = 0.5 * clamp(q * 2, 0, 1);
          const g = ctx.createLinearGradient(0, yK, 0, yTop);
          g.addColorStop(0, rgba(C.vis, 0.1 * a));
          g.addColorStop(1, rgba(C.vis, 0));
          ctx.fillStyle = g;
          ctx.fillRect(visL, yTop, visR - visL, yK - yTop);
          ctx.strokeStyle = rgba(C.vis, 0.25 * a);
          ctx.setLineDash([4, 5]);
          ctx.strokeRect(visL + 1, yTop + 1, visR - visL - 2, yK - yTop - 2);
          ctx.setLineDash([]);
        }
        // 光柱（token 通道）
        LANES.forEach((ty, j) => {
          const x = towerX + lw * j + lw * 0.18;
          const ww = lw * 0.64;
          const col = ty === 'sys' ? C.sys : ty === 'vis' ? C.vis : C.ins;
          const top = ty === 'vis' ? Math.min(front, K) : front;
          // 已计算部分
          for (let l = 0; l < N; l++) {
            const lit = clamp(top - l, 0, 1);
            const y = Y(l) + 1;
            if (ty === 'vis' && l >= K) continue;
            ctx.fillStyle = rgba(col, 0.08 + 0.72 * lit);
            ctx.fillRect(x, y, ww, rh - 2);
          }
          // 光柱头部的亮点
          if (top > 0 && top < N && !(ty === 'vis' && crossed)) {
            glow(ctx, x + ww / 2, Y(Math.floor(top)) + rh * (1 - (top % 1)), lw * 1.2, col, 0.8);
          }
        });
        // 撤出边界：潮线
        const yK = Y(K - 1);
        ctx.strokeStyle = rgba(C.vis, crossed ? 0.95 : 0.45);
        ctx.lineWidth = crossed ? 2.2 : 1;
        ctx.setLineDash(crossed ? [] : [5, 5]);
        ctx.beginPath();
        for (let x = towerX; x <= towerX + towerW; x += 4) {
          const yy = yK + (crossed ? Math.sin(x * 0.06 + t * 3) * 1.8 : 0);
          if (x === towerX) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        // 冲击：闪光 + 粒子爆散
        if (crossed && q < 1) {
          const flash = 1 - q;
          const g = ctx.createLinearGradient(0, yK - 40, 0, yK + 40);
          g.addColorStop(0, rgba(C.moon, 0));
          g.addColorStop(0.5, rgba('#bff7fa', 0.55 * flash));
          g.addColorStop(1, rgba(C.moon, 0));
          ctx.fillStyle = g;
          ctx.fillRect(visL - 20, yK - 40, visR - visL + 40, 80);
          for (const pt of parts) {
            if (q > pt.life) continue;
            const k = q / pt.life;
            const x0 = visL + lw * (pt.lane + 0.5);
            const x = x0 + pt.vx * 90 * easeOut(k);
            const y = yK + pt.vy * 110 * easeOut(k) + 60 * k * k;
            glow(ctx, x, y, pt.size * 3, C.vis, (1 - k) * 0.9);
          }
        }
        // 右侧：计算量账单（Eq. 1 外推）
        const mx = narrow ? 14 : towerX + towerW + 36;
        const my = narrow ? h - meterH - 10 : towerY;
        const climbed = clamp(p / climbEnd, 0, 1);
        const baseNow = climbed; // 原模型：每层同样贵
        const fullFrac = K / N;
        const textRatio = flops.ratio / 100; // VTW 总比例
        const perDeep = (textRatio - fullFrac) / Math.max(1e-6, 1 - fullFrac); // 深层每层相对成本
        const vtwNow = Math.min(climbed, fullFrac) + Math.max(0, climbed - fullFrac) * perDeep;
        const bars = [
          { label: '原模型', v: baseNow, col: C.base },
          { label: `VTW（K = ${K}）`, v: vtwNow, col: C.vis },
        ];
        txt(ctx, '累计计算量（Eq. 1 外推）', mx, my + 6, { size: 11, color: C.ink2, weight: 600 });
        bars.forEach((b, i) => {
          if (narrow) {
            const y = my + 22 + i * 32;
            const bw = meterW - 70;
            txt(ctx, b.label, mx, y + 6, { size: 10, color: C.ink3 });
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            rr(ctx, mx + 70, y, bw, 12, 6);
            ctx.fill();
            ctx.fillStyle = rgba(b.col, 0.9);
            rr(ctx, mx + 70, y, bw * b.v, 12, 6);
            ctx.fill();
          } else {
            const bw = (meterW - 30) / 2;
            const x = mx + i * (bw + 30);
            const top = my + 26;
            const H = meterH - 70;
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            rr(ctx, x, top, bw, H, 10);
            ctx.fill();
            const hh = H * b.v;
            const g = ctx.createLinearGradient(0, top + H - hh, 0, top + H);
            g.addColorStop(0, rgba(b.col, 0.95));
            g.addColorStop(1, rgba(b.col, 0.45));
            ctx.fillStyle = g;
            rr(ctx, x, top + H - hh, bw, hh, 10);
            ctx.fill();
            txt(ctx, b.label, x + bw / 2, top + H + 14, { size: 10, color: C.ink2, align: 'center' });
          }
        });
        // 标签最后画（带深色底），不会被光柱或光点挡住。
        // 两段提示各占独立位置：“省下多少”在塔顶，“撤走后”在撤出区内、与塔顶留出间距。
        // 撤出区太矮放不下两者时（K 很大，或手机舞台较矮），两段提示共用“入口”标签下方的同一位置，
        // 在算账进度过半时直接切换（不交叉淡化），任何暂停 / 拖动位置都只有一段清楚的文字。
        const yLine = Y(K - 1);
        const saveH = 30;
        const pillH = (narrow ? 11 : 12) + 9;
        const minY = towerY + 4 + saveH + 10 + pillH / 2;
        const maxY = yLine - 6 - pillH / 2;
        const fits = minY <= maxY;
        const slotTop = fits ? towerY + 4 : yLine + 13 + 10 + 8; // 不够时放到入口标签下方
        const labelY = fits ? clamp((yLine + towerY) / 2, minY, maxY) : slotTop + saveH / 2;
        const settle = clamp((p - SETTLE0) / (SETTLE1 - SETTLE0), 0, 1); // 算账提示的出现进度
        const showWithdrawn = crossed && front >= Math.min(K + 3, N);
        const showSave = fits ? settle > 0 : settle >= 0.5;
        const aWithdrawn = showWithdrawn && (fits || !showSave) ? 1 : 0;
        // 出现方式：从 60% 不透明度、略低 8px 处滑入，中途暂停也清楚可读
        const kSave = fits ? settle : 1;
        if (aWithdrawn > 0) pill(ctx, fits ? '撤走后：这一片不再计算' : '↑ 撤走后，上方不再计算', (visL + visR) / 2, labelY, { size: narrow ? 11 : 12, color: C.vis, align: 'center' });
        pill(ctx, `第 ${K + 1} 层入口`, towerX + towerW, yLine + 13, { size: 10, color: C.vis, align: 'right' });
        // 算账时刻：省下多少
        if (showSave) {
          const saved = 100 - flops.ratio;
          const label = `约省 ${saved.toFixed(0)}% 的计算（外推）`;
          const fs = narrow ? 13 : 15;
          ctx.globalAlpha = 0.6 + 0.4 * kSave;
          ctx.font = `800 ${fs}px system-ui, sans-serif`;
          const tw = ctx.measureText(label).width + 24;
          const bx = clamp(towerX + towerW / 2 - tw / 2, 4, w - tw - 4);
          const by = slotTop + 8 * (1 - kSave);
          ctx.fillStyle = 'rgba(6,12,34,0.94)';
          rr(ctx, bx, by, tw, saveH, 15);
          ctx.fill();
          ctx.strokeStyle = rgba(C.vis, 0.9);
          rr(ctx, bx, by, tw, saveH, 15);
          ctx.stroke();
          txt(ctx, label, bx + 12, by + 15, { size: fs, color: C.moon, weight: 800 });
          ctx.globalAlpha = 1;
        }
        // 正向播放越过边界时，让背景海面泛起涟漪
        if (tl.playing && crossed && !fired.current) {
          fired.current = true;
          emitPulse('withdraw');
        }
        if (!crossed) fired.current = false;
        return tl.playing;
      },
    },
    [K, tl.playing ? -1 : tl.p, tl.playing]
  );

  useEffect(() => tl.onVisible(s.animate), [s.animate, tl]);

  const p = tl.p;
  const crossed = p >= pK;
  const done = p >= (SETTLE0 + SETTLE1) / 2; // 与画面上“约省 x%”出现的时刻一致

  return (
    <StageSplit
      stage={
        <StageBox
          s={s}
          label={`示意：32 层的 LLaVA-1.5-7B。前 ${K} 层计算全部 token，第 ${K + 1} 层入口撤走视觉 token，之后只剩系统与文字 token；按 Eq.(1) 外推，总计算量约为原模型的 ${flops.ratio.toFixed(1)}%`}
        />
      }
      side={
        <>
          <TimeBar tl={tl} phases={phases} label="token 穿过 32 层的进度" />
          <div className="ctrls">
            <Slider
              label="K：先完整处理几层"
              value={K}
              min={1}
              max={N - 1}
              onChange={(v) => {
                setK(v);
              }}
              display={`K = ${K}（第 ${K + 1} 层入口撤出）`}
            />
            <Btn onClick={() => setK(16)} disabled={K === 16}>
              恢复表 2 的 K = 16
            </Btn>
          </div>
          <Feedback
            tone="info"
            k={`${crossed}-${done}-${K}`}
            lead={
              !crossed ? (
                <>
                  前 {K} 层照常计算：视觉、系统、指令 token 一起往上走。
                </>
              ) : !done ? (
                <>
                  <b>第 {K + 1} 层入口：</b>视觉 token 被一次性撤走。剩下的文字 token 带着它们在前 {K} 层里吸收的图像信息继续往上。
                </>
              ) : (
                <>
                  K = {K} 时，计算量约为原模型的 <b>{flops.ratio.toFixed(1)}%</b>（按 Eq. 1 外推；论文表 2 的 K = 16 为 55.19%）。
                </>
              )
            }
            more={
              <p>
                K 的含义按官方代码：<code>layer_idx == k</code>（0 起计）时撤出，所以 K = 16 表示前 16 层完整计算、从第 17 层开始没有视觉 token。Eq. (5) 字面是前 K−1 层，差一层，见本章底部“第 K 层还是第 K+1 层？”。光柱数量只是示意；外推用 s ≈ 641、V = 576（由表 2 反推）。撤出只发生在预填充，解码步怎么读缓存，看下一个模块。
              </p>
            }
          />
          <span className="stage-tags">
            <EvChip id="cDrop" />
          </span>
        </>
      }
    />
  );
};

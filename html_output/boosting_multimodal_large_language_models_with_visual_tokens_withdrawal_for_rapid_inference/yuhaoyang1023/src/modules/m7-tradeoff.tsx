import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Feedback, Slider, Tag, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { computeFlops } from '../lib/flops';
import { TABLE5 } from '../data/tables';
import { emitPulse } from '../lib/bus';

// 7.1 选 K 的取舍（主角交互）：LLaVA-1.5-7B，SQA_Image。
// - 青色曲线：准确率，形状按图 8(a) 手绘（教学示意）；实心点是论文实测（表 5：K = 12–15；表 2：K = 16 为 69.66）。
// - 沙色曲线：计算量比例，按 Eq. (1) 外推（s ≈ 641、V = 576，代码口径）。
// - 三个分区（过早 / 合理 / 过晚）是本页按图 8(a) 的形状划的示意区间，不是论文给出的阈值。

const KMIN = 1;
const KMAX = 31;
const BASE = 69.61; // 表 2 原模型 SQA_Img
// 图 8(a) 形状（示意）；K = 12–16 与实测点一致
const SHAPE: [number, number][] = [
  [1, 64.0], [2, 65.3], [3, 65.2], [4, 65.4], [5, 66.0], [6, 66.5], [7, 66.6], [8, 68.1], [9, 66.9], [10, 67.1], [11, 67.8],
  [12, 69.01], [13, 69.26], [14, 69.46], [15, 69.7], [16, 69.66], [18, 69.65], [20, 69.6], [22, 69.66], [24, 69.62], [26, 69.6], [28, 69.64], [31, 69.6],
];
const MEASURED: { K: number; acc: number; src: string }[] = [
  ...TABLE5.filter((r, i, a) => a.findIndex((x) => x.K === r.K) === i).map((r) => ({ K: r.K, acc: r.acc, src: '表 5' })),
  { K: 16, acc: 69.66, src: '表 2' },
];
const accAt = (k: number) => {
  for (let i = 1; i < SHAPE.length; i++) {
    const [k1, a1] = SHAPE[i];
    const [k0, a0] = SHAPE[i - 1];
    if (k <= k1) return a0 + ((a1 - a0) * (k - k0)) / (k1 - k0);
  }
  return SHAPE[SHAPE.length - 1][1];
};
const zoneOf = (k: number): 'early' | 'ok' | 'late' => (k < 12 ? 'early' : k <= 20 ? 'ok' : 'late');
const ZONE = {
  early: { name: '过早', col: C.warn },
  ok: { name: '合理', col: C.vis },
  late: { name: '过晚', col: C.base },
};

export const M7Tradeoff: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(16);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.8)).current;
  const lastZone = useRef(zoneOf(16));
  const ratios = useMemo(() => {
    const out: number[] = [];
    for (let k = KMIN; k <= KMAX; k++) out[k] = computeFlops({ model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K: k, R: 0.5, conv: 'code', scope: 'all' }).ratio;
    return out;
  }, []);
  const zone = zoneOf(K);
  const measured = MEASURED.find((m) => m.K === K);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.58, 300, 420),
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = 44;
        const right = w - 46;
        const top = 34;
        const bottom = h - 40;
        const X = (k: number) => left + ((k - KMIN) / (KMAX - KMIN)) * (right - left);
        const accY = (a: number) => bottom - ((a - 63.5) / (70.3 - 63.5)) * (bottom - top);
        const ratY = (r: number) => bottom - (r / 100) * (bottom - top);
        // 分区底色
        (['early', 'ok', 'late'] as const).forEach((z) => {
          const [a, b] = z === 'early' ? [KMIN, 11.5] : z === 'ok' ? [11.5, 20.5] : [20.5, KMAX];
          const on = zone === z ? 1 : 0;
          const v = anim.to(`z-${z}`, on, dt, final, 8);
          ctx.fillStyle = rgba(ZONE[z].col, 0.05 + 0.1 * v);
          ctx.fillRect(X(a), top - 18, X(b) - X(a), bottom - top + 18);
          txt(ctx, ZONE[z].name, (X(a) + X(b)) / 2, top - 8, { size: 11, color: rgba(ZONE[z].col, 0.6 + 0.4 * v), align: 'center', weight: 800 });
        });
        // 原模型准确率参考线
        ctx.strokeStyle = rgba(C.moon, 0.45);
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(left, accY(BASE));
        ctx.lineTo(right, accY(BASE));
        ctx.stroke();
        ctx.setLineDash([]);
        txt(ctx, '原模型 69.61', left + 2, accY(BASE) - 8, { size: 9, color: C.ink3 });
        // 计算量曲线（外推）
        ctx.strokeStyle = rgba(C.ins, 0.85);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = KMIN; k <= KMAX; k++) (k === KMIN ? ctx.moveTo : ctx.lineTo).call(ctx, X(k), ratY(ratios[k]));
        ctx.stroke();
        // 准确率曲线（示意）
        ctx.strokeStyle = rgba(C.vis, 0.9);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let k = KMIN; k <= KMAX; k += 0.25) (k === KMIN ? ctx.moveTo : ctx.lineTo).call(ctx, X(k), accY(accAt(k)));
        ctx.stroke();
        ctx.lineWidth = 1;
        // 实测点
        MEASURED.forEach((m) => {
          ctx.fillStyle = C.moon;
          ctx.beginPath();
          ctx.arc(X(m.K), accY(m.acc), 3.6, 0, Math.PI * 2);
          ctx.fill();
        });
        // 坐标标注
        [1, 8, 16, 24, 31].forEach((k) => txt(ctx, String(k), X(k), bottom + 12, { size: 9, color: C.ink3, align: 'center' }));
        txt(ctx, 'K（先完整处理的层数）', (left + right) / 2, bottom + 27, { size: 10, color: C.ink3, align: 'center' });
        txt(ctx, '准确率', left - 6, top - 24, { size: 9, color: C.vis, align: 'right' });
        txt(ctx, '计算量', right + 6, top - 24, { size: 9, color: C.ins });
        [25, 50, 75, 100].forEach((r) => txt(ctx, `${r}%`, right + 6, ratY(r), { size: 9, color: C.ink4 }));
        [64, 66, 68, 70].forEach((a) => txt(ctx, String(a), left - 6, accY(a), { size: 9, color: C.ink4, align: 'right' }));
        // K 游标：平滑移动的光柱
        const kx = X(anim.to('K', K, dt, final, 10, 1.01));
        const g = ctx.createLinearGradient(kx - 16, 0, kx + 16, 0);
        g.addColorStop(0, rgba(ZONE[zone].col, 0));
        g.addColorStop(0.5, rgba(ZONE[zone].col, 0.22));
        g.addColorStop(1, rgba(ZONE[zone].col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(kx - 16, top - 18, 32, bottom - top + 18);
        ctx.strokeStyle = rgba(ZONE[zone].col, 0.95);
        ctx.beginPath();
        ctx.moveTo(kx, top - 18);
        ctx.lineTo(kx, bottom);
        ctx.stroke();
        const ay = accY(accAt(anim.get('K', K)));
        const ry = ratY(ratios[K]);
        glow(ctx, kx, ay, 14, C.vis, 0.9);
        glow(ctx, kx, ry, 12, C.ins, 0.9);
        // 读数标签
        const lab = `计算量约 ${ratios[K].toFixed(0)}%（外推）`;
        ctx.font = '700 11px system-ui, sans-serif';
        const lw = ctx.measureText(lab).width + 16;
        const lx = clamp(kx + 10, left, right - lw);
        ctx.fillStyle = 'rgba(6,12,34,0.85)';
        rr(ctx, lx, ry - 26, lw, 20, 10);
        ctx.fill();
        txt(ctx, lab, lx + 8, ry - 16, { size: 11, color: C.ins, weight: 700 });
        const pp = pulse.p(t, final);
        if (pp >= 0) {
          ripple(ctx, kx, ay, easeOut(pp), ZONE[zone].col, 34);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [K, zone]
  );

  const go = (k: number) => {
    setK(k);
    const z = zoneOf(k);
    if (z !== lastZone.current) {
      lastZone.current = z;
      pulse.fire(performance.now() / 1000);
      if (z === 'ok') emitPulse('soft');
    }
  };

  const lead =
    zone === 'early' ? (
      <>
        <b>过早：</b>只完整算了 {K} 层，图像信息还没迁移完，准确率明显低于原模型（图 8a 的形状）。计算量虽然只剩约 {ratios[K].toFixed(0)}%，但答案变差了。
      </>
    ) : zone === 'ok' ? (
      <>
        <b>合理：</b>准确率回到原模型附近
        {measured ? `（${measured.src}实测 ${measured.acc.toFixed(2)}）` : '（图 8a 的形状）'}，计算量约 {ratios[K].toFixed(0)}%。
      </>
    ) : (
      <>
        <b>过晚：</b>准确率不会再提高，但视觉 token 多算了很多层，计算量回升到约 {ratios[K].toFixed(0)}%。
      </>
    );

  return (
    <div className="mod-stack">
      <div className="stage-top">
        <div className="ctrl-row">
          <Btn onClick={() => go(6)} pressed={K === 6}>
            过早：K = 6
          </Btn>
          <Btn onClick={() => go(16)} pressed={K === 16}>
            合理：K = 16
          </Btn>
          <Btn onClick={() => go(28)} pressed={K === 28}>
            过晚：K = 28
          </Btn>
        </div>
        <span className="stage-tags">
          <EvChip id="fig8" />
        </span>
      </div>
      <StageBox
        s={s}
        label={`K = ${K}，处于“${ZONE[zone].name}”区间；计算量按 Eq.(1) 外推约 ${ratios[K].toFixed(0)}%${measured ? `；${measured.src}实测准确率 ${measured.acc}` : ''}`}
      />
      <div className="legend-row">
        <span>
          <i className="lc lc-vis" /> 准确率（图 8a 形状，示意）
        </span>
        <span>
          <i className="lc lc-moon" /> 论文实测点（表 5、表 2）
        </span>
        <span>
          <i className="lc lc-ins" /> 计算量（Eq. 1 外推）
        </span>
      </div>
      <Slider label="拖动 K" value={K} min={KMIN} max={KMAX} onChange={go} display={`K = ${K}（${ZONE[zone].name}）`} />
      <Feedback
        tone={zone === 'early' ? 'warn' : 'info'}
        k={`${zone}-${K}`}
        lead={lead}
        more={
          <p>
            三个分区是本页按图 8(a) 的形状划的示意区间。论文用 KL 校准自动选 K（下一个模块）：在 SQA 上，η = 0.003 选出 K = 15（表 5）；表 2 的 K = 16 是为了让 VTW 的 FLOPs 低于 FastV 而手动设定的。曲线只来自 LLaVA-1.5-7B 在 SQA 上的消融，其他模型、任务的拐点可能不同。
          </p>
        }
      />
    </div>
  );
};

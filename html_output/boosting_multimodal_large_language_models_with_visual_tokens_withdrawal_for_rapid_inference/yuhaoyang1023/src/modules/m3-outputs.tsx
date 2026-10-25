import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp } from '../lib/stage';
import { C, rgba, TYPE_COLOR, TYPE_NAME, type TokType } from '../lib/palette';
import { Feedback, Slider, Btn } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { outputShares } from './attnCurves';

// 3.2 回答越长，越少看图（按图 5 的形状手绘的示意曲线，对层取平均，LLaVA-1.5-7B）。
const TYPES: TokType[] = ['sys', 'vis', 'ins', 'out'];
const MAXN = 400;

export const M3Outputs: React.FC<WidgetProps> = () => {
  const [n, setN] = useState(0);
  const anim = useRef(new Anim()).current;
  const sh = outputShares(n);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.42, 220, 300),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const narrow = w < 520;
        const chartW = narrow ? w : w * 0.62;
        const left = 30;
        const top = 12;
        const bottom = narrow ? h * 0.58 : h - 24;
        const cw = chartW - left - 8;
        // 曲线：只画视觉与输出两条，避免拥挤；纵轴 0–0.35
        const ymax = 0.35;
        const X = (i: number) => left + (i / MAXN) * cw;
        const Y = (v: number) => bottom - (Math.min(v, ymax) / ymax) * (bottom - top);
        ctx.strokeStyle = rgba(C.ink3, 0.3);
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left + cw, bottom);
        ctx.stroke();
        txt(ctx, '0.3', left - 4, Y(0.3), { size: 9, color: C.ink3, align: 'right' });
        txt(ctx, '0', left - 4, bottom, { size: 9, color: C.ink3, align: 'right' });
        (['vis', 'ins', 'out'] as TokType[]).forEach((ty) => {
          ctx.strokeStyle = TYPE_COLOR[ty];
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i <= MAXN; i += 5) {
            const v = outputShares(i)[ty];
            if (i === 0) ctx.moveTo(X(i), Y(v));
            else ctx.lineTo(X(i), Y(v));
          }
          ctx.stroke();
        });
        ctx.lineWidth = 1;
        // 曲线图例（短标签，放在曲线末端）
        (['vis', 'ins', 'out'] as TokType[]).forEach((ty) => {
          const v = outputShares(MAXN)[ty];
          txt(ctx, TYPE_NAME[ty], X(MAXN) - 2, Y(v) - 8, { size: 10, color: TYPE_COLOR[ty], align: 'right', weight: 700 });
        });
        const cur = anim.to('n', n, dt, final, 10, 5.01);
        ctx.strokeStyle = rgba(C.moon, 0.8);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(X(cur), top);
        ctx.lineTo(X(cur), bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        txt(ctx, `第 ${n} 个输出 token`, clamp(X(cur), left + 50, left + cw - 50), bottom + 12, { size: 10, color: C.moon, align: 'center' });
        // 当前位置的四根柱（系统 token 太高，单独标数字）
        const bx0 = narrow ? 10 : chartW + 16;
        const by0 = narrow ? bottom + 30 : top + 4;
        const bw = narrow ? w - 20 : w - chartW - 26;
        const rowH = narrow ? (h - by0 - 4) / 4 : (bottom - top) / 4;
        TYPES.forEach((ty, i) => {
          const v = anim.to(`b-${ty}`, sh[ty], dt, final, 8 - i, 0.05);
          const y = by0 + i * rowH;
          const labelW = 44;
          ctx.fillStyle = rgba(TYPE_COLOR[ty], 0.85);
          rr(ctx, bx0 + labelW, y + 3, Math.max(2, (bw - labelW - 44) * Math.min(1, v / 0.75)), rowH - 8, 4);
          ctx.fill();
          txt(ctx, TYPE_NAME[ty], bx0, y + rowH / 2, { size: 10, color: C.ink2 });
          txt(ctx, `约 ${v.toFixed(1)}`, bx0 + bw, y + rowH / 2, { size: 10, color: C.ink, align: 'right', weight: 700 });
        });
        return anim.moving;
      },
    },
    [n]
  );

  return (
    <div className="mod-stack">
      <StageBox s={s} label={`示意曲线：第 ${n} 个输出 token 时，看图像的比例${n > 100 ? '已经很低' : '在下降'}，看自己输出的比例${n > 100 ? '较高' : '在上升'}`} />
      <div className="ctrls">
        <Slider label="第几个输出 token" value={n} min={0} max={MAXN} step={5} onChange={setN} display={`第 ${n} 个`} />
        <Btn onClick={() => setN(0)} disabled={n === 0}>
          回到起点
        </Btn>
      </div>
      <Feedback
        tone="info"
        k={`n${Math.round(n / 50)}`}
        lead={
          n < 40 ? (
            <>刚开始回答时，模型还在看问题和图像：视觉、指令两束都还比较粗。</>
          ) : (
            <>
              写到第 {n} 个词，模型越来越多地看自己写过的输出（沙白色曲线上升），看图像的比例越来越小（青色曲线下降）。
            </>
          )
        }
        more={<p>曲线按图 5 的形状手绘，对所有层和注意力头取平均；论文这张图用了 4 个数据集各 20 个样本。系统 token 一直占 0.6 以上，因此纵轴没有画它。</p>}
      />
    </div>
  );
};

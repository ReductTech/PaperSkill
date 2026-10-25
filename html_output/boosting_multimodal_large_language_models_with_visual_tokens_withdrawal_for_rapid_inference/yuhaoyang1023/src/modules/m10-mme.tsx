import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt } from '../lib/stage';
import { C, rgba, METHOD_COLOR } from '../lib/palette';
import { Feedback, Seg, EvChip, Tag } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { MME_SUB, TABLE9 } from '../data/tables';

// 10.2 MME 子任务（arXiv v3 附录表 9，AAAI 正式版没有）。
// 发散条形：相对原模型的差值；颜色只表示方法。下方核对“子项相加是否等于总分”。

export const M10Mme: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState<'7b' | '13b' | 'next'>('7b');
  const [meth, setMeth] = useState<'vtw' | 'fastv'>('vtw');
  const anim = useRef(new Anim()).current;
  const base = TABLE9.find((r) => r.model === model && r.method === 'base')!;
  const row = TABLE9.find((r) => r.model === model && r.method === meth)!;
  const d = row.v.map((v, i) => v - base.v[i]);

  const s = useStage(
    {
      heightOf: () => MME_SUB.length * 24 + 16,
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const labW = w < 420 ? 62 : 76;
        const mid = labW + (w - labW - 50) / 2;
        const half = (w - labW - 50) / 2;
        const max = 20;
        const rowH = (h - 10) / MME_SUB.length;
        ctx.strokeStyle = rgba(C.moon, 0.4);
        ctx.beginPath();
        ctx.moveTo(mid, 2);
        ctx.lineTo(mid, h - 4);
        ctx.stroke();
        MME_SUB.forEach((name, i) => {
          const y = 4 + i * rowH;
          txt(ctx, name, 2, y + rowH / 2, { size: 11, color: i >= 10 ? C.ink3 : C.ink2 });
          const v = anim.to(`${model}-${meth}-${i}`, Math.max(-max, Math.min(max, d[i])) / max, dt, final, 9 - i * 0.3);
          const bw = half * Math.abs(v);
          ctx.fillStyle = rgba(METHOD_COLOR[meth], 0.88);
          rr(ctx, v >= 0 ? mid : mid - bw, y + 4, bw, rowH - 8, 3);
          ctx.fill();
          const label = `${d[i] >= 0 ? '+' : '−'}${Math.abs(d[i]).toFixed(2)}`;
          if (Math.abs(d[i]) > 1e-9) txt(ctx, label, v >= 0 ? mid + bw + 4 : mid - bw - 4, y + rowH / 2, { size: 10, color: C.ink, align: v >= 0 ? 'left' : 'right', weight: 700 });
          else txt(ctx, '0', mid + 4, y + rowH / 2, { size: 10, color: C.ink3 });
        });
        txt(ctx, '−20', mid - half, h - 2, { size: 9, color: C.ink4, align: 'center', baseline: 'bottom' });
        txt(ctx, '+20', mid + half, h - 2, { size: 9, color: C.ink4, align: 'center', baseline: 'bottom' });
        return anim.moving;
      },
    },
    [model, meth]
  );

  const sum = row.v.reduce((a, b) => a + b, 0);
  const sumOk = Math.abs(sum - row.total) < 0.02;
  const baseSum = base.v.reduce((a, b) => a + b, 0);
  const baseOk = Math.abs(baseSum - base.total) < 0.02;

  return (
    <div className="mod-stack">
      <div className="mod-toolbar">
        <Seg
          small
          label="模型"
          value={model}
          onChange={setModel}
          options={[
            { value: '7b', label: '7B' },
            { value: '13b', label: '13B' },
            { value: 'next', label: 'NeXT-7B' },
          ]}
        />
        <Seg
          small
          label="方法"
          value={meth}
          onChange={setMeth}
          options={[
            { value: 'vtw', label: 'VTW' },
            { value: 'fastv', label: 'FastV' },
          ]}
        />
        <Tag kind="paper" />
        <EvChip id="axT9" />
      </div>
      <StageBox s={s} label={`${row.label} 相对原模型的 MME 子任务差值：${MME_SUB.map((n, i) => `${n} ${d[i].toFixed(2)}`).join('，')}`} />
      <div className="sumcheck">
        <div className={`sumcheck-item ${baseOk ? 'is-ok' : 'is-warn'}`}>
          <b>{baseOk ? '✓' : '!'}</b> 原模型：子项相加 {baseSum.toFixed(2)}，表中总分 {base.total.toFixed(2)}
        </div>
        <div className={`sumcheck-item ${sumOk ? 'is-ok' : 'is-warn'}`}>
          <b>{sumOk ? '✓' : '!'}</b> {row.label}：子项相加 {sum.toFixed(2)}，表中总分 {row.total.toFixed(2)}
          {sumOk ? '' : `（差 ${(sum - row.total).toFixed(2)}，原因未知）`}
        </div>
        <span className="note">
          本页核对 <Tag kind="extrap" />
        </span>
      </div>
      <Feedback
        tone={sumOk ? 'info' : 'warn'}
        k={`${model}-${meth}`}
        lead={
          !sumOk && model === '7b' && meth === 'vtw' ? (
            <>
              这一行子项相加比总分少 23.91：“名人”与“场景”都是 135.59，疑为误抄（若场景实为 159.50，正好相符——仅为推断）。
            </>
          ) : (
            <>
              最大的变化在“{MME_SUB[d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs)))]}”（{d[d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs)))] >= 0 ? '+' : '−'}
              {Math.abs(d[d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs)))]).toFixed(2)}）。
            </>
          )
        }
        more={
          <p>
            附录正文称 VTW 在位置、海报、OCR 等任务上略有下降。每个子任务的题量远小于整套基准，单次运行的这些差值无法区分方法效应与评测波动；前 10 项为感知、后 4 项（灰色名称）为认知。arXiv 附录表 9 把 13B 的 VTW 标为 K = 16，但数字与表 2 的 K = 20 一行相同。
          </p>
        }
      />
    </div>
  );
};

import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp, glow } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Controls, Feedback, Seg, Slider, Btn } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { useTween } from '../lib/hooks';

// 1.1 逐层计费：按 Eq. (1) 拆开一层的账单，再把 N 层排成一列。
// 默认值：V = 576（LLaVA-1.5），文字 T = 65（由表 2 的 8.48 TFLOPs 反推，公式外推）。

const MODELS = {
  '7b': { label: 'LLaVA-1.5-7B', h: 4096, N: 32 },
  '13b': { label: 'LLaVA-1.5-13B', h: 5120, N: 40 },
} as const;
type MK = keyof typeof MODELS;

export const M1Bill: React.FC<WidgetProps> = () => {
  const [mk, setMk] = useState<MK>('7b');
  const [V, setV] = useState(576);
  const [T, setT] = useState(65);
  const [view, setView] = useState<'base' | 'vtw'>('base');
  const anim = useRef(new Anim()).current;
  const m = MODELS[mk];
  const K = mk === '7b' ? 16 : 20;

  const calc = useMemo(() => {
    const s = V + T;
    const h = m.h;
    const linV = 12 * V * h * h;
    const linT = 12 * T * h * h;
    const quadAll = 2 * s * s * h;
    const quadT = 2 * T * T * h;
    const quadV = quadAll - quadT; // 涉及视觉 token 的注意力项
    const layer = linV + linT + quadAll;
    const textLayer = linT + quadT;
    const base = 2 * m.N * layer;
    const vtw = 2 * (K * layer + (m.N - K) * textLayer);
    return { s, layer, textLayer, parts: [linV, quadV, linT, quadT], base, vtw, visShare: (linV + quadV) / layer };
  }, [V, T, m, K]);

  const tf = useTween((view === 'base' ? calc.base : calc.vtw) / 1e12);
  const share = useTween(calc.visShare * 100);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.52, 260, 360),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const pad = 14;
        // 一层的账单（横条）
        txt(ctx, '一层的账单（Eq. 1）', pad, 14, { size: 11, color: C.ink2, weight: 600 });
        const total = calc.layer;
        const cols = [C.vis, rgba(C.vis, 0.55), C.ins, rgba(C.ins, 0.55)];
        const names = ['视觉·线性', '视觉·注意力', '文字·线性', '文字·注意力'];
        let x = pad;
        const bw = w - pad * 2;
        const by = 28;
        const bh = 22;
        calc.parts.forEach((v, i) => {
          const ww = anim.to(`p${i}`, (v / total) * bw, dt, final, 10, 10);
          ctx.fillStyle = cols[i];
          rr(ctx, x, by, Math.max(0, ww - 1), bh, 4);
          ctx.fill();
          if (ww > 64) txt(ctx, names[i], x + 6, by + bh / 2, { size: 10, color: '#06102A', weight: 600 });
          x += ww;
        });
        // N 层排成一列（柱状）
        const top = by + bh + 34;
        const bottom = h - 26;
        const colW = (w - pad * 2) / m.N;
        txt(ctx, `${m.N} 层逐层计费（柱高 = 该层计算量）`, pad, top - 14, { size: 11, color: C.ink2, weight: 600 });
        for (let l = 0; l < m.N; l++) {
          const withdrawn = view === 'vtw' && l >= K;
          const target = withdrawn ? calc.textLayer / calc.layer : 1;
          // 依次升起 / 降下：深层稍晚
          const hFrac = anim.to(`l${l}`, target, dt, final, 9 - l * 0.12, 0.03);
          const fullH = bottom - top;
          const visFrac = withdrawn ? 0 : (calc.parts[0] + calc.parts[1]) / calc.layer;
          const hh = fullH * hFrac;
          const xx = pad + l * colW + 1;
          const ww = Math.max(1, colW - 2);
          ctx.fillStyle = C.ins;
          rr(ctx, xx, bottom - hh, ww, hh, 2);
          ctx.fill();
          const vh = fullH * Math.min(hFrac, visFrac);
          if (vh > 0.5) {
            ctx.fillStyle = C.vis;
            rr(ctx, xx, bottom - hh, ww, vh, 2);
            ctx.fill();
          }
          if (l === K && view === 'vtw') {
            ctx.strokeStyle = rgba(C.moon, 0.8);
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xx - 1, top - 4);
            ctx.lineTo(xx - 1, bottom + 4);
            ctx.stroke();
            ctx.setLineDash([]);
            glow(ctx, xx - 1, top, 14, C.moon, 0.6);
          }
          if (l === 0 || l === m.N - 1 || (view === 'vtw' && (l === K - 1 || l === K))) {
            txt(ctx, String(l + 1), xx + ww / 2, bottom + 12, { size: 9, color: C.ink3, align: 'center' });
          }
        }
        if (view === 'vtw') txt(ctx, `前 ${K} 层完整 · 之后只剩文字`, w - pad, top - 14, { size: 10, color: C.moon, align: 'right' });
        return anim.moving;
      },
    },
    [calc, view, mk]
  );

  const visPct = calc.visShare * 100;
  const ratio = (100 * calc.vtw) / calc.base;
  const isDefault = V === 576 && T === 65;

  return (
    <div className="mod-grid">
      <StageBox s={s} label={`一层的账单：视觉 token 占 ${visPct.toFixed(1)}%；${view === 'vtw' ? `VTW 后总量为原来的 ${ratio.toFixed(1)}%` : '原模型每层计算量相同'}`} />
      <div className="mod-side">
        <Controls>
          <Seg
            small
            label="模型"
            value={mk}
            onChange={setMk}
            options={[
              { value: '7b', label: '7B（32 层）' },
              { value: '13b', label: '13B（40 层）' },
            ]}
          />
          <Seg
            small
            label="视图"
            value={view}
            onChange={setView}
            options={[
              { value: 'base', label: '原模型' },
              { value: 'vtw', label: `VTW（K=${K}）` },
            ]}
          />
          <Slider label="视觉 token 数 V" value={V} min={0} max={2880} step={16} onChange={setV} display={`${V}`} hint="LLaVA-1.5 为 576；高分辨率的 LLaVA-NeXT 最多约 2880" />
          <Slider label="文字 token 数 T" value={T} min={10} max={600} step={5} onChange={setT} display={`${T}`} hint="65 是由表 2 反推的 MME 平均值（公式外推）" />
          <Btn onClick={() => { setV(576); setT(65); setMk('7b'); setView('base'); }} disabled={isDefault && mk === '7b' && view === 'base'}>
            回到默认（576 / 65）
          </Btn>
        </Controls>
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-v">{share.toFixed(1)}%</div>
            <div className="kpi-l">视觉 token 占一层的计算量</div>
          </div>
          <div className="kpi">
            <div className="kpi-v">{tf.toFixed(2)}</div>
            <div className="kpi-l">TFLOPs（Eq.1 × 2，{view === 'base' ? '原模型' : `VTW K=${K}`}）</div>
          </div>
        </div>
        <Feedback
          tone="info"
          k={`${mk}-${V}-${T}-${view}`}
          lead={
            V === 0 ? (
              <>没有视觉 token 时，账单全是文字——VTW 也就没什么可省的。</>
            ) : view === 'base' ? (
              <>
                视觉 token 占这一层计算量的 <b>{visPct.toFixed(1)}%</b>，而且每一层都一样。
              </>
            ) : (
              <>
                前 {K} 层照付，之后只付文字的账：总量降到 <b>{ratio.toFixed(1)}%</b>。
              </>
            )
          }
          more={
            <p>
              s = {calc.s} 时，线性项 12sh² 占一层的 {((100 * (calc.parts[0] + calc.parts[2])) / calc.layer).toFixed(1)}%，平方项只占{' '}
              {((100 * (calc.parts[1] + calc.parts[3])) / calc.layer).toFixed(1)}%。{isDefault && mk === '7b' ? '默认配置下原模型 ≈ 8.48 TFLOPs，与表 2 一致——这正是本页反推 T = 65 的依据，不是独立核对。' : '这一配置论文没有报告，数字属于公式外推。'}
            </p>
          }
        />
      </div>
    </div>
  );
};

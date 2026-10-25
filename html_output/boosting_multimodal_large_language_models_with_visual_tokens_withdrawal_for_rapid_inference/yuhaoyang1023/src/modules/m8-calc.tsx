import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp, glow } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Controls, Feedback, Seg, Slider, Select, Tag } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { useTween } from '../lib/hooks';
import { MODELS, PRESETS, computeFlops, checkAgainst, modelOf, omega, presetOf, type FlopsConfig } from '../lib/flops';

// 8.1 TFLOPs 复算器。
// - 选论文预设：显示本页复算与论文数字的比较（一致 = 绿；不一致 = 琥珀“原因未知”；反推锚点 = 中性）。
// - 改任何控件：自动切到“自定义”，并完整复制当前全部配置（模型、s、V、方法、K、R、层号口径、计量口径）；
//   未改动时结果与预设完全一致。切换模型时在同一次状态更新里约束 K 的上限。

interface State {
  preset: string; // 预设 id 或 'custom'
  from: string; // 自定义配置复制自哪个预设
  cfg: FlopsConfig;
}

const START = PRESETS[0];
const fmt1 = (v: number) => (Math.abs(v % 1) > 1e-9 ? v.toFixed(1) : String(v));

function clampCfg(c: FlopsConfig): FlopsConfig {
  const m = modelOf(c.model);
  const K = Math.max(1, Math.min(m.N - 1, Math.round(c.K)));
  const s = Math.max(50, c.s);
  const V = Math.max(0, Math.min(c.V, s));
  return { ...c, K, s, V };
}

export const M8Calc: React.FC<WidgetProps> = () => {
  const [st, setSt] = useState<State>({ preset: START.id, from: START.id, cfg: { ...START.cfg } });
  const anim = useRef(new Anim()).current;
  const cfg = st.cfg;
  const m = modelOf(cfg.model);
  const res = useMemo(() => computeFlops(cfg), [cfg]);
  const p = st.preset === 'custom' ? undefined : presetOf(st.preset);
  const check = checkAgainst(p, res, cfg);
  const tRatio = useTween(res.ratio);
  const tTf = useTween(res.tflops ?? 0);

  // 任何控件改动：切到自定义（完整复制当前配置后再改这一项）
  const edit = (patch: Partial<FlopsConfig>) =>
    setSt((prev) => ({ preset: 'custom', from: prev.preset === 'custom' ? prev.from : prev.preset, cfg: clampCfg({ ...prev.cfg, ...patch }) }));

  const choosePreset = (id: string) => {
    if (id === 'custom') {
      setSt((prev) => ({ preset: 'custom', from: prev.preset === 'custom' ? prev.from : prev.preset, cfg: { ...prev.cfg } }));
      return;
    }
    const pr = presetOf(id)!;
    setSt({ preset: id, from: id, cfg: { ...pr.cfg } });
  };
  const restore = () => {
    const pr = presetOf(st.from) ?? START;
    setSt({ preset: pr.id, from: pr.id, cfg: { ...pr.cfg } });
  };
  const restart = () => setSt({ preset: START.id, from: START.id, cfg: { ...START.cfg } });

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.36, 200, 260),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = 12;
        const top = 26;
        const bottom = h - 22;
        const N = m.N;
        const cw = (w - left * 2) / N;
        const full = res.full;
        const fullCost = cfg.scope === 'vision' ? 1 : omega(cfg.s, m.h);
        const layerCost = (l: number) => {
          if (cfg.method === 'base' || l < full) return 1;
          if (cfg.scope === 'vision') return cfg.method === 'fastv' ? 1 - cfg.R : 0;
          const rest = cfg.method === 'vtw' ? cfg.s - cfg.V : cfg.s - cfg.V * cfg.R;
          return omega(rest, m.h) / fullCost;
        };
        txt(ctx, cfg.scope === 'vision' ? '每层的视觉 token 成本（相对原模型）' : '每层的计算量（相对原模型）', left, 12, { size: 10, color: C.ink2 });
        for (let l = 0; l < N; l++) {
          const x = left + l * cw + 1;
          const ww = Math.max(1, cw - 2);
          const v = anim.to(`l${l}-${N}`, layerCost(l), dt, final, 9 - (l % 20) * 0.2, 0.02);
          const H = bottom - top;
          ctx.strokeStyle = rgba(C.base, 0.5);
          ctx.setLineDash([2, 2]);
          rr(ctx, x, top, ww, H, 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = l < full || cfg.method === 'base' ? rgba(C.vis, 0.85) : cfg.method === 'fastv' ? rgba(C.fastv, 0.85) : rgba(C.ins, 0.85);
          rr(ctx, x, top + H * (1 - v), ww, H * v, 2);
          ctx.fill();
        }
        if (cfg.method !== 'base' && full < N) {
          const x = left + full * cw;
          ctx.strokeStyle = rgba(C.moon, 0.8);
          ctx.beginPath();
          ctx.moveTo(x, top - 6);
          ctx.lineTo(x, bottom + 4);
          ctx.stroke();
          glow(ctx, x, top - 4, 12, C.moon, 0.6);
          txt(ctx, `前 ${full} 层完整`, clamp(x, 50, w - 50), bottom + 13, { size: 10, color: C.moon, align: 'center' });
        }
        return anim.moving;
      },
    },
    [cfg]
  );

  const tone = check.kind === 'match' ? 'ok' : check.kind === 'mismatch' ? 'warn' : 'info';
  const presetOptions = [...PRESETS.map((x) => ({ value: x.id, label: x.label })), { value: 'custom', label: st.preset === 'custom' ? `自定义（复制自 ${presetOf(st.from)?.label ?? '预设'}）` : '自定义（复制当前配置）' }];

  return (
    <div className="mod-stack">
      <div className="calc-top">
        <Select label="配置" value={st.preset} options={presetOptions} onChange={choosePreset} />
        <div className="ctrl-row">
          <Btn onClick={restart} disabled={st.preset === START.id}>
            回到起点
          </Btn>
          <Btn onClick={restore} disabled={st.preset !== 'custom'}>
            恢复论文默认
          </Btn>
        </div>
      </div>
      {p ? <p className="note">来源：{p.where}{p.anchor ? `。${p.anchor}` : ''}</p> : <p className="note">自定义配置 · 复制自“{presetOf(st.from)?.label}”，论文没有报告时结果属于公式外推 <Tag kind="extrap" /></p>}
      <StageBox s={s} label={`当前配置：${m.label}，${cfg.method === 'base' ? '原模型' : cfg.method === 'vtw' ? `VTW，前 ${res.full} 层带视觉 token` : `FastV，第 ${cfg.K} 层后剪掉 ${(cfg.R * 100).toFixed(0)}% 视觉 token`}；比例 ${res.ratio.toFixed(2)}%`} />
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-v">{tRatio.toFixed(2)}%</div>
          <div className="kpi-l">本页复算比例</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{res.tflops === null ? '—' : tTf.toFixed(2)}</div>
          <div className="kpi-l">{res.tflops === null ? '只计视觉 token：不给绝对值' : `TFLOPs（原模型 ${res.baseTflops!.toFixed(2)}）`}</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{p?.paperRatio !== undefined && check.kind !== 'none' ? `${p.paperRatio}%` : '—'}</div>
          <div className="kpi-l">{p?.paperTf !== undefined && check.kind !== 'none' ? `论文：${p.paperTf} TFLOPs` : '论文值'}</div>
        </div>
      </div>
      <Feedback
        tone={tone}
        k={`${st.preset}-${JSON.stringify(cfg)}`}
        lead={<>{check.text}</>}
        more={
          <p>
            口径：{cfg.scope === 'all' ? 'Eq. (1) 的每层复杂度 × 2（1 次乘加 = 2 次浮点运算，本页推断）' : '只计视觉 token：每层成本 ∝ 该层的视觉 token 数（表 3、附录表 8 的口径）'}；预填充、单个样本，不含视觉编码器与解码步。s、V
            的取值见来源说明；FastV 按“第 K 层后剪掉比例 R 的视觉 token”计算（默认 K = 2、R = 50%，VTW 论文没有写明 FastV 的配置）。
          </p>
        }
      />
      <details className="calc-adv" open>
        <summary>调整配置（会自动切到“自定义”）</summary>
        <Controls>
          <Select
            label="模型"
            value={cfg.model}
            options={MODELS.map((x) => ({ value: x.id, label: `${x.label}（${x.N} 层）` }))}
            onChange={(id) => edit({ model: id, K: Math.min(cfg.K, modelOf(id).N - 1) })}
          />
          <Seg
            small
            label="方法"
            value={cfg.method}
            onChange={(v) => edit({ method: v })}
            options={[
              { value: 'base', label: '原模型' },
              { value: 'vtw', label: 'VTW' },
              { value: 'fastv', label: 'FastV' },
            ]}
          />
          <Seg
            small
            label="计量口径"
            value={cfg.scope}
            onChange={(v) => edit({ scope: v })}
            options={[
              { value: 'all', label: '全部 token（Eq.1×2）' },
              { value: 'vision', label: '只计视觉 token' },
            ]}
          />
          {cfg.method === 'vtw' ? (
            <Seg
              small
              label="层号口径"
              value={cfg.conv}
              onChange={(v) => edit({ conv: v })}
              options={[
                { value: 'code', label: '代码：前 K 层' },
                { value: 'eq5', label: 'Eq.(5)：前 K−1 层' },
              ]}
            />
          ) : null}
          {cfg.method !== 'base' ? (
            <Slider label={cfg.method === 'vtw' ? '撤出层 K' : 'FastV 剪枝层 K'} value={cfg.K} min={1} max={m.N - 1} onChange={(v) => edit({ K: v })} display={`K = ${cfg.K}`} />
          ) : null}
          {cfg.method === 'fastv' ? (
            <Slider label="FastV 剪掉的比例 R" value={Math.round(cfg.R * 100)} min={0} max={100} step={5} onChange={(v) => edit({ R: v / 100 })} display={`R = ${Math.round(cfg.R * 100)}%`} />
          ) : null}
          {cfg.scope === 'all' ? (
            <>
              <Slider label="平均输入长度 s" value={cfg.s} min={50} max={3000} step={0.1} onChange={(v) => edit({ s: Math.round(v * 10) / 10 })} display={`s = ${fmt1(cfg.s)}`} />
              <Slider label="视觉 token 数 V" value={cfg.V} min={0} max={cfg.s} step={0.1} onChange={(v) => edit({ V: Math.round(v * 10) / 10 })} display={`V = ${fmt1(cfg.V)}`} />
            </>
          ) : null}
        </Controls>
      </details>
    </div>
  );
};

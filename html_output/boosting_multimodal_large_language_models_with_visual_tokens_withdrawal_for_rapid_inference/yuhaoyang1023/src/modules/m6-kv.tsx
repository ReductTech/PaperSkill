import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Controls, Feedback, Seg, Slider } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { useTween } from '../lib/hooks';
import { useTimeline } from '../lib/timeline';
import { TimeBar } from '../ui/TimeBar';

const TMAX = 512;

// 6.2 KV Cache 逐层堆叠（公式外推）。按标准 KV 缓存口径：每层每个 token 存 K、V 各 h 个 fp16 数。
// s 与 V 用表 2 口径（7B：641 / 576；13B：642 / 576）。代码口径：前 K 层缓存含视觉 token。

const MODELS = {
  '7b': { N: 32, h: 4096, s: 641, V: 576, K: 16, label: 'LLaVA-1.5-7B' },
  '13b': { N: 40, h: 5120, s: 642, V: 576, K: 20, label: 'LLaVA-1.5-13B' },
} as const;
type MK = keyof typeof MODELS;

export const M6Kv: React.FC<WidgetProps> = () => {
  const [mk, setMk] = useState<MK>('7b');
  const [K, setK] = useState(16);
  // 解码进度：时间轴 = 已生成多少个词（0–512）；默认停在 0，按播放开始“边生成边存缓存”
  const tl = useTimeline(8, { autoplay: false });
  useEffect(() => {
    tl.scrub(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const t = Math.round(tl.p * TMAX);
  const anim = useRef(new Anim()).current;
  const m = MODELS[mk];

  const r = useMemo(() => {
    const per = 2 * m.h * 2; // 每层每 token 的字节数（K 与 V，fp16）
    const baseTok = m.N * (m.s + t);
    const vtwTok = K * (m.s + t) + (m.N - K) * (m.s - m.V + t);
    return { baseMB: (baseTok * per) / 2 ** 20, vtwMB: (vtwTok * per) / 2 ** 20, ratio: vtwTok / baseTok };
  }, [m, K, t]);
  const tb = useTween(r.baseMB);
  const tv = useTween(r.vtwMB);

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.42, 220, 300),
      live: tl.playing,
      draw: ({ ctx, w, h, dt, final }) => {
        if (!final) tl.tick(dt);
        anim.begin();
        const t = Math.round(tl.pRef.current * TMAX);
        ctx.clearRect(0, 0, w, h);
        const left = 34;
        const top = 22;
        const bottom = h - 28;
        const cw = (w - left - 8) / m.N;
        const maxTok = m.s + 512;
        const Y = (n: number) => bottom - (n / maxTok) * (bottom - top);
        // 纵轴
        [0, 500, 1000].forEach((v) => {
          if (v > maxTok) return;
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.beginPath();
          ctx.moveTo(left, Y(v));
          ctx.lineTo(w - 8, Y(v));
          ctx.stroke();
          txt(ctx, String(v), left - 4, Y(v), { size: 9, color: C.ink3, align: 'right' });
        });
        txt(ctx, '每层缓存的 token 数', left, 10, { size: 10, color: C.ink2 });
        for (let l = 0; l < m.N; l++) {
          const x = left + l * cw + 1;
          const ww = Math.max(1, cw - 2);
          const baseN = m.s + t;
          const vtwN = l < K ? m.s + t : m.s - m.V + t;
          const vb = anim.to(`b${l}`, baseN, dt, final, 8, 20);
          const vv = anim.to(`v${l}-${mk}`, vtwN, dt, final, 8 - (l % 16) * 0.25, 20);
          // 原模型：虚线轮廓
          ctx.strokeStyle = rgba(C.base, 0.6);
          ctx.setLineDash([2, 2]);
          rr(ctx, x, Y(vb), ww, bottom - Y(vb), 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // VTW：视觉部分（青）+ 文字部分（沙）
          const textN = Math.min(vv, m.s - m.V + t);
          ctx.fillStyle = rgba(C.ins, 0.85);
          rr(ctx, x, Y(textN), ww, bottom - Y(textN), 2);
          ctx.fill();
          if (vv > textN + 0.5) {
            ctx.fillStyle = rgba(C.vis, 0.85);
            ctx.fillRect(x, Y(vv), ww, Y(textN) - Y(vv));
          }
          // 柱子太窄时只标第 K 层，避免 K 与 K+1 两个层号挤在一起
          if (l === 0 || l === m.N - 1 || l === K - 1 || (l === K && ww >= 14)) txt(ctx, String(l + 1), x + ww / 2, bottom + 10, { size: 9, color: C.ink3, align: 'center' });
        }
        txt(ctx, '层（1 起计）', w - 8, bottom + 22, { size: 9, color: C.ink4, align: 'right' });
        return anim.moving;
      },
    },
    [mk, K, tl.playing ? -1 : t, tl.playing]
  );

  return (
    <div className="mod-stack">
      <StageBox s={s} label={`${m.label}：原模型 KV 缓存约 ${r.baseMB.toFixed(0)} MB，VTW（前 ${K} 层带视觉）约 ${r.vtwMB.toFixed(0)} MB，为 ${(r.ratio * 100).toFixed(1)}%`} />
      <TimeBar tl={tl} label={`解码进度：已生成 ${t} 个词`} phases={[{ at: 0, label: '预填充刚结束' }, { at: 0.5, label: '生成 256 个词' }, { at: 1, label: '生成 512 个词' }]} />
      <div className="legend-row">
        <span>
          <i className="lc lc-vis" /> 缓存中的视觉 token
        </span>
        <span>
          <i className="lc lc-ins" /> 缓存中的文字 token
        </span>
        <span>
          <i className="lc lc-dash" /> 原模型
        </span>
      </div>
      <Controls>
        <Seg
          small
          label="模型"
          value={mk}
          onChange={(v) => {
            setMk(v);
            setK(MODELS[v].K); // 同一次更新里把 K 约束到该模型的范围
          }}
          options={[
            { value: '7b', label: '7B（32 层）' },
            { value: '13b', label: '13B（40 层）' },
          ]}
        />
        <Slider label="撤出层 K（前 K 层带视觉）" value={K} min={1} max={m.N - 1} onChange={setK} display={`K = ${K}`} />

        <Btn
          onClick={() => {
            setK(m.K);
            tl.scrub(0);
          }}
          disabled={K === m.K && t === 0}
        >
          恢复论文默认（K = {m.K}，t = 0）
        </Btn>
      </Controls>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-v">{tb.toFixed(0)} MB</div>
          <div className="kpi-l">原模型 KV 缓存</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{tv.toFixed(0)} MB</div>
          <div className="kpi-l">VTW KV 缓存</div>
        </div>
        <div className="kpi">
          <div className="kpi-v">{(r.ratio * 100).toFixed(1)}%</div>
          <div className="kpi-l">比例</div>
        </div>
      </div>
      <Feedback
        tone="info"
        k={`${mk}-${K}-${Math.round(t / 64)}`}
        lead={
          <>
            KV 缓存降到 <b>{(r.ratio * 100).toFixed(1)}%</b>；回答越长，文字缓存越多，这个比例会{t > 0 ? '向 100% 回升' : '随 t 增大而回升'}。
          </>
        }
        more={
          <p>
            本页按 2 × h × 2 字节 / token / 层计算（fp16，K 与 V 各一份），论文没有给出这个估算。表 4 实测的是 LLaVA-NeXT-7B 在 SQA 上的整体显存：单样本 3.1 → 2.0 G（0.65×），其中还包括激活值、视觉编码器等，不能与这里的 KV 缓存数字直接对比。
          </p>
        }
      />
    </div>
  );
};

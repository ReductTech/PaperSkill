import React, { useEffect, useState } from 'react';
import { easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Tier = '12B' | '84B' | '562B';

const TIERS: Record<Tier, { paLM: number; paLME: number; drop: number; label: string }> = {
  '12B': { paLM: 32, paLME: 4, drop: 87.3, label: '8B LLM + 4B ViT' },
  '84B': { paLM: 48, paLME: 18, drop: 61.6, label: '62B + 22B' },
  '562B': { paLM: 52, paLME: 50, drop: 3.9, label: '540B + 22B' },
};

/**
 * §7 P4 规模档位选择 + P8 成对条对比：切换档位查看 PaLM（橙）与 PaLM-E（蓝）成对条，
 * 右侧读数为相对退化（非保留率）；结论只对应端到端微调路线。
 */
export const ScaleForgetting: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [tier, setTier] = useState<Tier>('12B');
  const [grow, setGrow] = useState(0);

  useEffect(() => {
    if (grow >= 1) return;
    const start = performance.now();
    let raf: number | null = null;
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      setGrow(easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [grow < 1]);

  const d = TIERS[tier];
  const groups = [
    { label: 'PaLM 基线', value: d.paLM, color: '#f07e47' },
    { label: 'PaLM-E', value: d.paLME, color: '#27446e' },
  ];

  const feedback =
    tier === '562B'
      ? { text: '562B 相对退化约 3.9%，规模越大语言能力保留越多。', cls: 'good' }
      : { text: '该规模 PaLM 与继承权重的 PaLM-E 在 NLG 平均上的差距为相对退化（非保留率）。', cls: '' };

  return (
    <div>
      <div className="dual-panel">
        <div className="panel-box">
          <h5>成对条对比（NLG 平均 0–60）</h5>
          <div className="bar-chart" id={`${chapterId}-${moduleId}`}>
            {groups.map((g) => (
              <div className="bar-row" key={g.label}>
                <span className="bar-label">{g.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(g.value / 60) * 100 * grow}%`, background: g.color }} />
                </div>
                <span className="bar-value">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-box">
          <h5>相对退化读数</h5>
          <div className="panel-body" style={{ fontSize: 22, fontWeight: 600, color: '#c43f52' }}>
            {d.drop}%
          </div>
          <div className="panel-body" style={{ marginTop: 8 }}>{d.label}；相对退化 = PaLM 基线 − PaLM-E。</div>
        </div>
      </div>

      <div className="chip-row" role="group" aria-label="选择规模档位">
        {(Object.keys(TIERS) as Tier[]).map((t) => (
          <button key={t} type="button" className={`chip ${tier === t ? 'selected' : ''}`} onClick={() => setTier(t)}>
            {t}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => setGrow(0)}>
          重新生长
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <p className="module-desc" style={{ marginTop: 8 }}>
        口径提醒：这是相对退化百分比，不是保留率；结论只对应端到端微调路线，不套用到冻结 LLM 路线。
      </p>
    </div>
  );
};

export default ScaleForgetting;

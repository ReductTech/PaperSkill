import React, { useState } from 'react';
import { SC } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 10.2 Metric-caliber warning desk. Case A: DualPrompt's misleading Fgt
// (Table 2: ImageNet best 24.55 / final 8.61 vs MoDE 80.67 / 14.67, UB 91.88).
// Case B: FID vs text alignment (Table 1).
type CaseKey = 'A' | 'B';
type View = 'only' | 'both';

function Bar({
  label,
  value,
  max,
  color,
  suffix,
  deep,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
  deep?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '132px 1fr 70px', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ fontSize: 12, color: SC.ink }}>{label}</div>
      <div style={{ background: '#ece9df', borderRadius: 4, height: deep ? 18 : 14, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, transition: 'width 0.9s ease' }} />
      </div>
      <div style={{ fontSize: 12, color, textAlign: 'right' }}>
        {value.toFixed(suffix && suffix.length > 2 ? 4 : 2)}
        {suffix ? <span style={{ color: SC.muted }}> {suffix}</span> : null}
      </div>
    </div>
  );
}

export const M102Metric: React.FC<WidgetProps> = () => {
  const [kase, setKase] = useState<CaseKey>('A');
  const [view, setView] = useState<View>('only');

  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${kase === 'A' ? 'selected' : ''}`} onClick={() => setKase('A')}>
          案例 A：Fgt=6.82 的真相
        </button>
        <button className={`chip ${kase === 'B' ? 'selected' : ''}`} onClick={() => setKase('B')}>
          案例 B：FID ≠ 听提示
        </button>
        <button className={`chip ${view === 'both' ? 'selected' : ''}`} onClick={() => setView(view === 'only' ? 'both' : 'only')}>
          {view === 'only' ? '只看单一指标' : '峰值 + 相关指标一起看'}
        </button>
      </div>

      {kase === 'A' ? (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: 13, color: SC.muted, marginBottom: 8 }}>ImageNet 上的准确率（表2，越高越好；虚线为逐任务单独微调上界 91.88）</div>
          <Bar label="DualPrompt·最好" value={24.55} max={95} color={view === 'both' ? SC.red : SC.blue} deep />
          <Bar label="DualPrompt·最终" value={8.61} max={95} color={SC.red} />
          {view === 'both' ? (
            <>
              <Bar label="MoDE·最好" value={80.67} max={95} color={SC.green} deep />
              <Bar label="MoDE·最终" value={14.67} max={95} color={SC.green} />
            </>
          ) : null}
          <div style={{ borderTop: `2px dashed ${SC.shade}`, width: `${(91.88 / 95) * 100}%`, marginTop: 6 }} />
          <div style={{ fontSize: 11, color: SC.muted, marginTop: 2 }}>上界 91.88</div>
        </div>
      ) : (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: 13, color: SC.muted, marginBottom: 8 }}>MoDE 的生成成绩 vs 零样本（表1）</div>
          <Bar label="FID（低=好）" value={53.74} max={60} color={view === 'both' ? SC.orange : SC.green} deep />
          <Bar label="零样本 FID" value={52.13} max={60} color={SC.shade} />
          {view === 'both' ? (
            <>
              <Bar label="MoDE 文本对齐" value={0.2458} max={0.3} color={SC.orange} deep />
              <Bar label="零样本文本对齐" value={0.2592} max={0.3} color={SC.shade} />
              <Bar label="DualPrompt 文本对齐" value={0.2648} max={0.3} color={SC.blue} />
            </>
          ) : null}
        </div>
      )}

      <div className={`feedback ${kase === 'A' && view === 'both' ? 'good' : kase === 'A' && view === 'only' ? '' : ''}`}>
        {kase === 'A' && view === 'only'
          ? '只看 Fgt：DualPrompt 6.82 全场最低，看似最稳。'
          : kase === 'A'
          ? '一起看：它 ImageNet 最好只到 24.55，而其他方法都超过 70——没学会，自然没得忘（论文原文解释）。MoDE 峰值 80.67、最终 14.67，遗忘真的发生了，但学到了真东西。'
          : view === 'only'
          ? '只看 FID：53.74 贴着零样本 52.13，「像不像」像是保住了。'
          : '一起看：文本对齐 0.2458 低于零样本 0.2592、也低于 DualPrompt 0.2648——FID 管「像不像」，文本对齐才管「听不听提示」。'}
      </div>
    </div>
  );
};
export default M102Metric;

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch7：结果与局限。数字来自论文量化/稀疏结果表（文献卡片 §关键实验数据），加速需 INT4 稀疏 GEMM。
const STATS: { label: string; value: string; unit: string; tone: 'green' | 'blue' }[] = [
  { label: 'Llama2-7B · PPL 降幅', value: '1.4', unit: '联合 vs FP16-dense', tone: 'green' },
  { label: 'Llama2-70B · 与全精度差距', value: '1.37', unit: 'PPL 差距', tone: 'green' },
  { label: '推理加速', value: '4.72×', unit: '· 显存减少 6.4×', tone: 'blue' },
];
const GAINS = [
  '首个免训练 W4A4KV4 + 50% 稀疏。',
  '补偿是闭式解，无梯度下降。',
  '继承 Optimal Brain 误差补偿血脉。',
  '官方代码 + HF 校准模型。',
];
const LIMITS = [
  '依赖 INT4-sparse GEMM 硬件。',
  '二阶泰勒 + 行解耦是近似。',
  '依赖旋转底座质量。',
  '偏量化 + 稀疏，不碰训练侧。',
];

export function ResultsLimits(_props: WidgetProps) {
  const [tab, setTab] = useState<'gain' | 'limit'>('gain');
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel obr-chart-panel">
        <div className="obr-heading">关键结果（论文实测）</div>
        <div className="obr-stat-grid">
          {STATS.map((s) => (
            <div key={s.label} className={`obr-stat-card tone-${s.tone}`}>
              <b>{s.value}</b>
              <span>{s.label}</span>
              <em>{s.unit}</em>
            </div>
          ))}
        </div>
        <div className="obr-note">数据来自论文量化/稀疏结果表：W4A4KV4 + 50% 稀疏，覆盖 Llama2 / Llama3 / Qwen2.5；加速需 INT4 稀疏 GEMM kernel。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">收益与局限</div>
        <div className="obr-controls">
          <SegButton active={tab === 'gain'} onClick={() => setTab('gain')}>收益</SegButton>
          <SegButton active={tab === 'limit'} onClick={() => setTab('limit')}>局限</SegButton>
        </div>
        <ul className="obr-limit-list">
          {(tab === 'gain' ? GAINS : LIMITS).map((t) => <li key={t}>{t}</li>)}
        </ul>
        <Feedback tone={tab === 'gain' ? 'green' : 'orange'}>
          {tab === 'gain'
            ? '联合压缩在更低 bit + 更高稀疏下仍守住精度，是单一量化逼近极限后的自然下一步。'
            : '加速收益有硬件前提；补偿假设与旋转底座是它的边界。'}
        </Feedback>
        <p className="obr-body muted">
          <SymbolHint meaning="W4A4KV4：权重/激活 4-bit、KV cache 4-bit。">W4A4KV4</SymbolHint>
          {' + 50% 稀疏是论文主打设置。'}
        </p>
      </div>
    </div>
  );
}

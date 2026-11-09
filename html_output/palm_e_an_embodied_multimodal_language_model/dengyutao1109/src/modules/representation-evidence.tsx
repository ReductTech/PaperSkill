import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type BarId = 'finetune-mixture' | 'finetune-single' | 'no-pretrain' | 'frozen-mixture' | 'frozen-single';

const BARS: Record<BarId, { label: string; value: number; premise: string; tone: 'good' | 'neutral' | 'bad' }> = {
  'finetune-mixture': { label: '端到端微调 · 完整混合', value: 94.9, premise: '预训练 + 完整混合 + 微调，规划成功率最高。', tone: 'good' },
  'finetune-single': { label: '端到端微调 · 单机器人', value: 48.6, premise: '预训练 + 单机器人数据 + 微调。', tone: 'neutral' },
  'no-pretrain': { label: '未预训练', value: 42.9, premise: '从零训练，缺少预训练语言先验，分布外泛化很弱。', tone: 'bad' },
  'frozen-mixture': { label: '冻结 · 完整混合', value: 74.3, premise: '冻结 LLM，仅编码器训练，完整混合数据。', tone: 'neutral' },
  'frozen-single': { label: '冻结 · 单机器人', value: 31.8, premise: '冻结 LLM，仅编码器训练，单机器人数据。', tone: 'bad' },
};

const ORDER: BarId[] = ['finetune-mixture', 'finetune-single', 'no-pretrain', 'frozen-mixture', 'frozen-single'];

const TONE_COLOR: Record<string, string> = { good: '#228d5c', neutral: '#5b86c4', bad: '#c43f52' };

/**
 * §6 P5 横条热点：选择一条横条，高亮并在面板读出训练前提与报告成功率；
 * 五条顺序与百分比保持原图口径，不新增未报告行。
 */
export const RepresentationEvidence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [active, setActive] = useState<BarId | null>(null);
  const current = active ? BARS[active] : null;

  return (
    <div>
      <div className="bar-chart" id={`${chapterId}-${moduleId}`} role="group" aria-label="五种训练条件横条">
        {ORDER.map((id) => {
          const b = BARS[id];
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              className="bar-row"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              aria-pressed={isActive}
              onClick={() => setActive(isActive ? null : id)}
            >
              <span className="bar-label">{b.label}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${b.value}%`, background: TONE_COLOR[b.tone], opacity: isActive ? 1 : 0.55 }}
                />
              </div>
              <span className="bar-value">{b.value.toFixed(1)}%</span>
            </button>
          );
        })}
      </div>

      <div className="chip-row" role="group" aria-label="训练条件键盘等价选择">
        {ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${active === id ? 'selected' : ''}`}
            aria-pressed={active === id}
            onClick={() => setActive(active === id ? null : id)}
          >
            {BARS[id].label}
          </button>
        ))}
      </div>

      {current ? (
        <div className="feedback">
          <strong>{current.label}</strong>：成功率 {current.value}%。{current.premise}
        </div>
      ) : (
        <div className="feedback">选一条横条，看它的训练前提和成功率。</div>
      )}
    </div>
  );
};

export default RepresentationEvidence;

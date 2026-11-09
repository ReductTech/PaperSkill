import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Route = 'frozen' | 'end2end';

const SCALES = ['8B LLM + 4B ViT = 12B', '62B + 22B = 84B', '540B + 22B = 562B'];

const SCOPE = [
  { key: 'enc', label: '观测编码器', frozenActive: true, e2eActive: true },
  { key: 'proj', label: '投影 ψ', frozenActive: true, e2eActive: true },
  { key: 'llm', label: 'PaLM LLM', frozenActive: false, e2eActive: true },
];

// 玩具 token 序列：前缀段（观测嵌入 + 问题）不计损失；目标文本段才算交叉熵。
const PREFIX_TOKENS = ['观测嵌入', '观测嵌入', 'Q: grasp?'];
const TARGET_TOKENS = ['First', 'grasp', 'the', 'block'];

/**
 * §5 训练配方：路线芯片切换参数作用域；上方 token 序列标出损失只作用在目标文本段；
 * 下方横条呈现 8.9% 具身数据的采样频率口径与规模组合，不调整任何基准数字。
 */
export const TrainingRecipe: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [route, setRoute] = useState<Route | null>(null);

  const feedback =
    route === 'frozen'
      ? { text: '冻结路线：语言模型权重不动，只训练输入编码器与投影。', cls: '' }
      : route === 'end2end'
        ? { text: '端到端路线：全部参数一起微调，语言能力保留情况随规模变化（见 §7）。', cls: '' }
        : { text: '两条路线都是在同一多模态句子目标上训练，区别在更新哪些参数。', cls: '' };

  return (
    <div>
      <div className="dual-panel">
        <div className="panel-box">
          <h5>损失作用域（token 序列）</h5>
          <div className="token-row">
            {PREFIX_TOKENS.map((t, i) => (
              <span key={`p-${i}`} className="token-chip">{t}</span>
            ))}
            {TARGET_TOKENS.map((t, i) => (
              <span key={`t-${i}`} className="token-chip obs-purple">{t}</span>
            ))}
          </div>
          <div className="panel-body" style={{ marginTop: 8 }}>
            前缀（观测嵌入 + 问题文本）不计损失；交叉熵只平均在右侧目标文本 token 上。
          </div>
          <div className="scope-legend" style={{ marginTop: 8 }}>
            <span><span className="swatch" style={{ background: '#eef1f5' }} />前缀：不计损失</span>
            <span><span className="swatch" style={{ background: '#7c3aed' }} />目标文本：算交叉熵</span>
          </div>
        </div>
        <div className="panel-box">
          <h5>数据口径与规模组合</h5>
          <div className="bar-row" style={{ gridTemplateColumns: '110px 1fr 64px' }}>
            <span className="bar-label">具身数据</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: '8.9%', background: '#f07e47' }} />
            </div>
            <span className="bar-value">8.9%</span>
          </div>
          <div className="panel-body" style={{ marginTop: 6 }}>其余为网络 VLI / VQA / COCO 等数据；8.9% 为采样频率占比，不是样本条数比例。</div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 16, display: 'grid', gap: 4 }}>
            {SCALES.map((s) => (
              <li key={s} className="panel-body">{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="widget-grid three">
        {SCOPE.map((s) => {
          const frozenOn = route === 'frozen' && s.frozenActive;
          const e2eOn = route === 'end2end' && s.e2eActive;
          const inactive = route === 'frozen' && !s.frozenActive;
          const bg = frozenOn ? '#27446e' : e2eOn ? '#f07e47' : '#eef1f5';
          return (
            <div key={s.key} className="tap-card" style={{ cursor: 'default' }}>
              <div className="card-title">{s.label}</div>
              <div className="card-sub">
                {inactive ? '权重冻结，不参与更新' : frozenOn || e2eOn ? '本路线参与参数更新' : '选择路线后查看更新范围'}
              </div>
              <div className="scope-legend" style={{ marginTop: 8 }}>
                <span className="swatch" style={{ background: bg }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="chip-row" role="group" aria-label="选择微调路线">
        <button
          type="button"
          className={`chip ${route === 'frozen' ? 'selected' : ''}`}
          aria-pressed={route === 'frozen'}
          onClick={() => setRoute('frozen')}
        >
          冻结 LLM，只训编码器
        </button>
        <button
          type="button"
          className={`chip ${route === 'end2end' ? 'selected' : ''}`}
          aria-pressed={route === 'end2end'}
          onClick={() => setRoute('end2end')}
        >
          端到端微调全部参数
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default TrainingRecipe;

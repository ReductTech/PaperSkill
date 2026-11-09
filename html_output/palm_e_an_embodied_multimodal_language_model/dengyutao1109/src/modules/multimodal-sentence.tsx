import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ObsKind = 'image' | 'state' | 'slot';

const OBS: Record<ObsKind, { label: string; short: string; cls: string; desc: string }> = {
  image: { label: '图像 <img>', short: '图像', cls: 'obs', desc: '2D 图像经 ViT 编码成视觉 token。' },
  state: { label: '状态向量', short: '状态', cls: 'obs-purple', desc: '位姿 / 尺寸 / 颜色等结构化状态经 MLP 接入。' },
  slot: { label: '3D 槽位', short: '槽位', cls: 'obs-purple', desc: '物体中心 3D 槽位表示，按物体身份接入。' },
};

const ORDER: ObsKind[] = ['image', 'state', 'slot'];
const SAMPLE = 'Q: How to grasp the blue block?';
const TRAIL = ['First,', 'grasp', 'the', 'yellow', 'block', 'and ...'];

/**
 * §3 P6 拖拽/点击插入观测 + P2 步进自回归：左侧工单生活视图、右侧 token 技术视图，
 * 同一插入状态与步长同时驱动两侧；点“下一步”点亮下一个预测 token。
 */
export const MultimodalSentence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [inserted, setInserted] = useState<ObsKind[]>([]);
  const [step, setStep] = useState(0);

  const toggleObs = (kind: ObsKind) => {
    setInserted((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));
  };
  const next = () => setStep((s) => Math.min(s + 1, TRAIL.length));
  const reset = () => {
    setInserted([]);
    setStep(0);
  };

  const feedback =
    inserted.length === 0
      ? { text: '前缀没有观测 token，只能给出笼统回答，指不到具体物体。', cls: 'bad' }
      : step >= 4
        ? { text: '输出点名了具体物体和子步骤：观测嵌入已经进入前缀并影响续写。', cls: 'good' }
        : { text: '已插入观测，前缀同时包含文字与现场条目；点“下一步”看自回归续写。', cls: '' };

  return (
    <div>
      <div className="dual-panel">
        <div className="panel-box">
          <h5>工单（生活视图）</h5>
          <div className="panel-body">{SAMPLE}</div>
          <div className="token-row">
            {inserted.map((kind) => (
              <span key={kind} className={`token-chip ${OBS[kind].cls}`}>{OBS[kind].short}</span>
            ))}
            {inserted.length === 0 && <span className="token-chip">前缀仅有文字</span>}
          </div>
          <div className="token-row">
            {TRAIL.slice(0, step).map((t, i) => (
              <span key={t} className={`token-chip ${i === step - 1 ? 'pred' : ''}`}>{t}</span>
            ))}
          </div>
        </div>
        <div className="panel-box">
          <h5>token 序列（技术视图）</h5>
          <div className="panel-body">文本 token w₁ … wₙ 与观测嵌入交错排列；续写遵循 p(wₙ₊₁:L | w₁:n)。</div>
          <div className="token-row">
            {inserted.map((kind) => (
              <span key={kind} className={`token-chip ${OBS[kind].cls}`}>{OBS[kind].short} 嵌入</span>
            ))}
          </div>
          <div className="token-row">
            {TRAIL.slice(0, step).map((t, i) => (
              <span key={t} className={`token-chip ${i === step - 1 ? 'pred' : ''}`}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="chip-row" role="group" aria-label="插入或移除观测卡片">
        {ORDER.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`chip ${inserted.includes(kind) ? 'selected' : ''}`}
            aria-pressed={inserted.includes(kind)}
            onClick={() => toggleObs(kind)}
          >
            {inserted.includes(kind) ? '移除' : '插入'}{OBS[kind].label}
          </button>
        ))}
        <button type="button" className="chip" onClick={next} disabled={step >= TRAIL.length}>
          下一步（自回归一步）
        </button>
        <button type="button" className="chip" onClick={reset}>
          重置
        </button>
      </div>

      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <p className="module-desc" style={{ marginTop: 8 }}>
        {inserted.length > 0
          ? inserted.map((k) => OBS[k].desc).join('　')
          : '对比态：先不插入任何观测，观察笼统输出；再加入图像等观测，对比输出如何点名具体物体。'}
      </p>
    </div>
  );
};

export default MultimodalSentence;

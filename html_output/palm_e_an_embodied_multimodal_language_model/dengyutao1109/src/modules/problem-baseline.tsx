import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Baseline = 'text-only' | 'affordance-only';

const BASELINES: Record<
  Baseline,
  {
    title: string;
    card: string;
    point: string;
    feedback: string;
    cls: 'bad' | 'bad';
    failTag: string;
  }
> = {
  'text-only': {
    title: '只凭文本（零样本 VLM）',
    card: '手上只有一张空白文本单，桌上有什么完全看不见；模型知道“去抓蓝块”，却不知道蓝块在哪。',
    point: '缺少感知锚定：词汇与现场物体、位置之间没有对应，零样本搬到机器人任务上答非所问。',
    feedback: '只凭文字：模型不知道桌上有什么，零样本 VLM 无法锚定到具体物体。',
    cls: 'bad',
    failTag: '失败：答非所问',
  },
  'affordance-only': {
    title: '只判断当下可行动性（SayCan 式）',
    card: '眼睛只盯着眼前这口锅，只评估当前动作能不能做；下一步往哪走、先后顺序排不出来。',
    point: '缺少长程规划约束：可行动性只判断当下可行性，信息不足以拼出有先后约束的多步操作。',
    feedback: '只看一步：可行动性只判断当下可行性，撑不起有先后约束的长程规划。',
    cls: 'bad',
    failTag: '失败：卡在眼前一步',
  },
};

const ORDER: Baseline[] = ['text-only', 'affordance-only'];

/**
 * §1 P3 同步前后对比 + P4 离散选择：两张旧路径卡片并列，点击切换查看各自卡点。
 * 失败态统一用红系；本模块不出现成功态。
 */
export const ProblemBaseline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [selected, setSelected] = useState<Baseline>('text-only');
  const active = BASELINES[selected];

  return (
    <div>
      <div className="widget-grid two" role="group" aria-label="两条旧路径对照">
        {ORDER.map((key) => {
          const b = BASELINES[key];
          const isActive = key === selected;
          return (
            <button
              key={key}
              type="button"
              className={`tap-card ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
              onClick={() => setSelected(key)}
              id={`${chapterId}-${moduleId}-${key}`}
            >
              <div className="card-title">{b.title}</div>
              <div className="card-sub">{b.card}</div>
              <div className="scope-legend" style={{ marginTop: 10 }}>
                <span className="bar-label" style={{ color: '#c43f52' }}>✕ {b.failTag}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className={`feedback ${active.cls}`}>{active.feedback}</div>
      <p className="module-desc" style={{ marginTop: 8 }}>{active.point}</p>
    </div>
  );
};

export default ProblemBaseline;

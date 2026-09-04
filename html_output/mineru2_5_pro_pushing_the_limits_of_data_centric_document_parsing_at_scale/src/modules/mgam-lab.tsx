import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { GlossaryText, Term } from '../components/Glossary';

type InteractiveWidgetProps = WidgetProps & {
  mode?: string;
  guidedState?: string | number;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
};

const PREDICTION_BLOCKS = ['∫ f(x)dx', '= F(b)', '− F(a)'] as const;

export const MgamLab: React.FC<InteractiveWidgetProps> = ({
  chapterId,
  moduleId,
  mode = 'explore',
  guidedState,
  onInteract,
  onStateChange,
}) => {
  const [cuts, setCuts] = useState<[boolean, boolean]>([true, true]);
  const feedbackId = `feedback-${chapterId}-${moduleId}`;

  useEffect(() => {
    if (guidedState === undefined) return;
    const targetGroups = typeof guidedState === 'number'
      ? Math.max(1, Math.min(3, 3 - guidedState))
      : Math.max(1, Math.min(3, Number(guidedState.match(/^partition-(\d)$/)?.[1] ?? 3)));
    if (targetGroups === 3) setCuts([true, true]);
    else if (targetGroups === 2) setCuts([false, true]);
    else setCuts([false, false]);
  }, [guidedState]);

  const groupCount = 1 + cuts.filter(Boolean).length;
  const fullyMerged = groupCount === 1;

  const outcome = useMemo(() => {
    if (fullyMerged) {
      return {
        label: '合理匹配',
        feedback: '两个分隔线都被移除后，预测侧连续三块组成与固定 GT 对齐的一组；MGAM 恢复合理匹配。',
      };
    }
    if (groupCount === 2) {
      return {
        label: '仍需继续合并',
        feedback: '已经尝试一个连续分组，但预测仍有两组；继续移除另一处分隔线。',
      };
    }
    return {
      label: '旧匹配：接近 0',
      feedback: '教学示意：内容相同的公式被预测成三个块，一对一匹配会因粒度不同而严重误罚。',
    };
  }, [fullyMerged, groupCount]);

  const toggleCut = (index: 0 | 1) => {
    setCuts((current) => {
      const next: [boolean, boolean] = [...current];
      next[index] = !next[index];
      const nextGroupCount = 1 + next.filter(Boolean).length;
      onStateChange?.(`partition-${nextGroupCount}`);
      return next;
    });
    onInteract?.();
  };

  return (
    <section
      className={`lab-root lab-mgam ${fullyMerged ? 'is-matched' : 'is-searching'}`}
      data-mode={mode}
      data-guided-state={guidedState}
      data-groups={groupCount}
      aria-label="MGAM 预测粒度匹配实验"
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">MGAM · PREDICTION-SIDE ONLY</p>
          <h5>参考答案不动，只重新组合预测块</h5>
        </div>
        <div className="lab-tags" aria-label="内容标记">
          <span className="lab-tag lab-tag--fact">论文事实</span>
          <span className="lab-tag lab-tag--demo">“接近 0”为教学示意</span>
        </div>
      </header>

      <div className="lab-inline-glossary" aria-label="点击解释图中评测术语">
        <span>图内解释</span>
        <Term id="mgam">MGAM</Term>
        <Term id="bipartite-matching">Π 与连续分组</Term>
        <Term id="held-out">HELD-OUT TEST</Term>
        <Term id="gt">GT</Term>
      </div>

      <aside className="lab-heldout">
        <strong>HELD-OUT TEST · 296 页 Hard</strong>
        <span>完全隔离：未进入 Stage 1、Stage 2 或 Stage 3</span>
      </aside>

      <div className="lab-mgam__board">
        <section className="lab-mgam__row lab-mgam__row--gt" aria-label="固定参考答案">
          <header>
            <Term id="gt">GT</Term>
            <strong>LOCKED</strong>
          </header>
          <div className="lab-mgam__blocks">
            <span>∫ f(x)dx = F(b) − F(a)</span>
          </div>
        </section>

        <section className="lab-mgam__row lab-mgam__row--prediction" aria-label={`预测侧当前分为 ${groupCount} 组`}>
          <header>
            <span>PREDICTION</span>
            <strong>{groupCount} 组</strong>
          </header>
          <div
            className={`lab-mgam__blocks lab-mgam__blocks--groups-${groupCount}`}
            data-left-cut={cuts[0] ? 'cut' : 'joined'}
            data-right-cut={cuts[1] ? 'cut' : 'joined'}
          >
            {PREDICTION_BLOCKS.map((block, index) => (
              <React.Fragment key={block}>
                <span className="lab-mgam__block" data-block={index + 1}>{block}</span>
                {index < PREDICTION_BLOCKS.length - 1 ? (
                  <button
                    type="button"
                    className={`lab-mgam__divider ${cuts[index] ? 'is-cut' : 'is-joined'}`}
                    aria-pressed={!cuts[index]}
                    aria-label={
                      cuts[index]
                        ? `移除第 ${index + 1} 个分隔线并合并相邻预测块`
                        : `恢复第 ${index + 1} 个分隔线`
                    }
                    aria-describedby={feedbackId}
                    onClick={() => toggleCut(index as 0 | 1)}
                  >
                    <span aria-hidden="true">{cuts[index] ? '│' : '↔'}</span>
                    <small>{cuts[index] ? '点击合并' : '已合并'}</small>
                  </button>
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className={`lab-mgam__score ${fullyMerged ? 'is-good' : ''}`} role="status">
          <span>当前匹配</span>
          <strong key={outcome.label} className="lab-mgam__score-value">{outcome.label}</strong>
          <small>{fullyMerged ? '粒度对齐' : '粒度错配'}</small>
          <i className="lab-mgam__score-meter" aria-hidden="true" />
        </div>
      </div>

      <div className="lab-mgam__formula" aria-label="预测侧连续分组候选数量">
        <span><Term id="bipartite-matching">n′ = 3 个预测块</Term></span>
        <strong><Term id="mgam">|Π| = 2<sup>(n′−1)</sup> = 4</Term></strong>
        <small>两个间隙各有“保留/移除”两种选择</small>
      </div>

      <p
        id={feedbackId}
        className={`lab-feedback ${fullyMerged ? 'lab-feedback--good' : groupCount === 2 ? 'lab-feedback--warn' : ''}`}
        aria-live="polite"
      >
        {outcome.feedback}
      </p>

      <p className="lab-boundary">
        <GlossaryText text="边界：MGAM 缓解分块粒度偏差，不判断语义等价；枚举量随预测块数按" /> 2<sup>(n′−1)</sup> 增长。
      </p>
    </section>
  );
};

export default MgamLab;

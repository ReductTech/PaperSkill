import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineIcon } from '../components/LineIcon';
import type { WidgetProps } from './registry';
import {
  updateChapter2Scene,
  useChapter2Scene,
  type RecognitionPolicy,
} from './ppocrv6-ch2-state';

type LessonStage = 'predict' | 'generate' | 'align' | 'reveal';

const SOURCE_TOKENS = ['T', 'E', 'H', '2', '0', '2', '6'];
const PRIOR_TOKENS = ['T', 'H', 'E', '2', '0', '2', '6'];
const OUTPUT_CHARS = Array.from('THE 2026');

const stageIndex: Record<LessonStage, number> = {
  predict: 0,
  generate: 1,
  align: 2,
  reveal: 3,
};

export const Analogy1: React.FC<WidgetProps> = () => {
  const shared = useChapter2Scene();
  const [stage, setStage] = useState<LessonStage>('predict');
  const [generatedCount, setGeneratedCount] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (stage === 'generate') {
      setGeneratedCount(0);
      OUTPUT_CHARS.forEach((_, index) => {
        timers.current.push(window.setTimeout(() => setGeneratedCount(index + 1), 180 * (index + 1)));
      });
      timers.current.push(window.setTimeout(() => setStage('align'), 2050));
    }
    if (stage === 'align') {
      timers.current.push(window.setTimeout(() => setStage('reveal'), 2200));
    }
    return clearTimers;
  }, [stage]);

  const predictionFeedback = useMemo(() => {
    if (shared.predictionChoice === 'THE 2026') {
      return '这正是语言模型很容易做出的选择：更合理，但不忠实。';
    }
    if (shared.predictionChoice === 'TEH 2026') {
      return '对 OCR 而言，忠实优先于通顺。';
    }
    return '先看图像中的字符，再决定 OCR 应该保留哪一串文字。';
  }, [shared.predictionChoice]);

  const choosePrediction = (choice: 'TEH 2026' | 'THE 2026') => {
    updateChapter2Scene({ predictionChoice: choice });
  };

  const startLesson = () => {
    clearTimers();
    updateChapter2Scene({ policy: 'prior', lessonRevealed: false });
    setStage('generate');
  };

  const setPolicy = (policy: RecognitionPolicy) => {
    updateChapter2Scene({ policy, lessonRevealed: true });
  };

  const replay = () => {
    clearTimers();
    setGeneratedCount(0);
    setStage('predict');
    updateChapter2Scene({ predictionChoice: null, policy: 'prior', lessonRevealed: false });
  };

  return (
    <div className="prior-lesson">
      <div className="prior-note">教学示例，行为模式对应论文 Figure 8</div>
      <ol className="prior-stage-strip" aria-label="核验过程">
        {['先判断', '看生成', '逐位核验', '切换约束'].map((label, index) => (
          <li key={label} className={index <= stageIndex[stage] ? 'active' : ''} aria-current={index === stageIndex[stage] ? 'step' : undefined}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      <div className={`prior-workbench stage-${stage}`}>
        <section className="prior-evidence" aria-label="图像中的视觉证据">
          <div className="prior-panel-label">图像中的真实文字</div>
          <div className="prior-ticket">
            <span className="prior-ticket-rule" />
            <strong>TEH 2026</strong>
            <span className="prior-ticket-rule short" />
            <span className="prior-scan" aria-hidden="true" />
          </div>
          <div className="prior-evidence-caption">扫描框只检查图里实际存在的字符</div>
        </section>

        <section className="prior-decision" aria-live="polite">
          {stage === 'predict' ? (
            <>
              <div className="prior-panel-label">你认为 OCR 应该输出什么？</div>
              <div className="prior-choice-row" role="group" aria-label="预测 OCR 输出">
                {(['TEH 2026', 'THE 2026'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={shared.predictionChoice === choice ? 'selected' : ''}
                    aria-pressed={shared.predictionChoice === choice}
                    onClick={() => choosePrediction(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
              <p className={`prior-feedback ${shared.predictionChoice ? 'answered' : ''}`}>{predictionFeedback}</p>
              <button className="prior-primary" type="button" disabled={!shared.predictionChoice} onClick={startLesson}>
                查看识别过程
              </button>
            </>
          ) : null}

          {stage === 'generate' ? (
            <>
              <div className="prior-panel-label">语言先验优先：逐字生成</div>
              <div className="prior-generated" aria-label={`当前生成 ${OUTPUT_CHARS.slice(0, generatedCount).join('')}`}>
                {OUTPUT_CHARS.map((char, index) => (
                  <span key={`${char}-${index}`} className={`${index < generatedCount ? 'visible' : ''} ${index === 1 || index === 2 ? 'rewritten' : ''}`}>
                    {char === ' ' ? '\u00a0' : char}
                  </span>
                ))}
              </div>
              <p className="prior-plausible">{generatedCount >= 3 ? '更像一个正常单词' : '模型正在补全更可能出现的字符序列…'}</p>
            </>
          ) : null}

          {stage === 'align' ? (
            <>
              <div className="prior-panel-label">把图像与输出逐位对齐</div>
              <div className="prior-alignment" aria-label="TEH 2026 与 THE 2026 逐位核验">
                {SOURCE_TOKENS.map((source, index) => {
                  const output = PRIOR_TOKENS[index];
                  const mismatch = source !== output;
                  return (
                    <div key={`${source}-${index}`} className={`prior-char-pair ${mismatch ? 'mismatch' : ''} ${index === 3 ? 'after-gap' : ''}`}>
                      <span>{source}</span>
                      <i aria-hidden="true" />
                      <b>{output}</b>
                    </div>
                  );
                })}
              </div>
              <p className="prior-mismatch-note">E/H 的位置对不上：读顺了，但抄错了。</p>
            </>
          ) : null}

          {stage === 'reveal' ? (
            <>
              <div className="prior-panel-label">选择识别约束</div>
              <div className="prior-policy" role="group" aria-label="选择识别约束">
                <button type="button" className={shared.policy === 'prior' ? 'selected' : ''} aria-pressed={shared.policy === 'prior'} onClick={() => setPolicy('prior')}>
                  语言先验优先
                </button>
                <button type="button" className={shared.policy === 'visual' ? 'selected visual' : ''} aria-pressed={shared.policy === 'visual'} onClick={() => setPolicy('visual')}>
                  视觉证据优先
                </button>
              </div>
              <div className="prior-final-compare" aria-label="语言先验与视觉证据两种输出对比">
                <article className={shared.policy === 'prior' ? 'selected prior' : 'prior'}>
                  <div><span>语言先验优先</span><em>更像人话</em></div>
                  <strong>THE 2026</strong>
                  <small>更像一个正常词</small>
                </article>
                <b aria-hidden="true">vs.</b>
                <article className={shared.policy === 'visual' ? 'selected visual' : 'visual'}>
                  <div><span>视觉证据优先</span><em>更像原图</em></div>
                  <strong>TEH 2026{shared.policy === 'visual' ? ' ✓' : ''}</strong>
                  <small>与图像一致</small>
                </article>
              </div>
              <p className="prior-conclusion">
                {shared.policy === 'visual'
                  ? 'OCR 的目标不是替原文改错，而是尽可能忠实地读取原文。'
                  : '输出更像正常英文，但它没有忠实保留图像中的 TEH。'}
              </p>
              <p className="prior-verdict">更通顺 ≠ 更忠实。</p>
              <button className="prior-replay ui-replay" type="button" onClick={replay}><LineIcon name="rotate" />重新演示</button>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
};

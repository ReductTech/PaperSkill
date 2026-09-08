import { useState } from 'react';
import type { Analogy } from '../types';
import { GlossaryText } from './Glossary';
import { AnalogyVisual } from './AnalogyVisual';

const EXAM_STEP_COPY = [
  '点任意一步，看它在备考节奏里的位置。',
  '第一步通读课本：先建立覆盖，对应 65.5M 广覆盖数据。',
  '第二步攻错题本：专修难例，对应 3.9M 困难样本（并回放防遗忘）。',
  '第三步按评分规则模拟：对齐最终指标，对应 192K 任务对齐数据。',
];

/**
 * 引入节 (PaperSkill §2.3): bridge card explains this chapter's role in the
 * five-problem journey; the analogy band stretches full width — self-built
 * scene pinned left (§4: one subject, one verb, one goal), copy plus an
 * optional mini interaction right.
 */
export function ChapterIntro({ bridge, analogy }: { bridge: string; analogy: Analogy }) {
  const [extras, setExtras] = useState(0);
  const [sameTeacher, setSameTeacher] = useState(false);
  const [examStep, setExamStep] = useState(0);

  return (
    <div className="chapter-intro">
      <div className="chap-bridge">
        <span>本节作用</span>
        <p><GlossaryText text={bridge} /></p>
      </div>
      <aside className="analogy-card" aria-label={`生活类比：${analogy.title}`}>
        <AnalogyVisual
          visual={analogy.visual}
          state={analogy.interaction === 'add-cabbage' ? { extras }
            : analogy.interaction === 'same-teacher' ? { correlated: sameTeacher }
              : analogy.interaction === 'exam-steps' ? { step: examStep }
                : undefined}
        />
        <div className="analogy-card__body">
          <header>
            <span>生活类比</span>
            <b>{analogy.title}</b>
          </header>
          <p><GlossaryText text={analogy.text} /></p>
          {analogy.interaction === 'add-cabbage' ? <div className="analogy-play">
            <button type="button" disabled={extras >= 3} onClick={() => setExtras((count) => Math.min(count + 1, 3))}>再装一颗白菜</button>
            <p role="status">样本 <b data-testid="cabbage-count">{4 + extras}</b> 颗白菜 · 长尾 <b data-testid="longtail-count">0</b> 朵香菇{extras >= 3 ? '——篮子满了，香菇还是没进篮' : ''}</p>
          </div> : null}
          {analogy.interaction === 'same-teacher' ? <div className="analogy-play">
            <button type="button" aria-pressed={sameTeacher} onClick={() => setSameTeacher((value) => !value)}>换成同一个老师</button>
            <p role="status">{sameTeacher ? '同出一个老师：两人的错法都一样——共识 ≠ 真值。' : '默认两位同学独立作答；拨上开关看看相关性。'}</p>
          </div> : null}
          {analogy.interaction === 'exam-steps' ? <div className="analogy-play">
            <div role="group" aria-label="备考三步">
              {['① 通读课本', '② 攻错题本', '③ 模拟考'].map((label, index) => <button
                key={label}
                type="button"
                aria-pressed={examStep === index + 1}
                onClick={() => setExamStep(index + 1)}
              >{label}</button>)}
            </div>
            <p role="status">{EXAM_STEP_COPY[examStep]}</p>
          </div> : null}
        </div>
      </aside>
    </div>
  );
}

export default ChapterIntro;

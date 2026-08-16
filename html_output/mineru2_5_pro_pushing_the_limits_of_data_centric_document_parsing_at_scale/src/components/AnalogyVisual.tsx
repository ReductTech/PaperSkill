import React from 'react';
import type { AnalogyVisualId } from '../types';

const SCENE_LABELS: Record<AnalogyVisualId, string> = {
  'grocery-budget': '菜篮问题：固定预算与装载',
  'melon-picking': '摘瓜场景：大篮装了很多',
  'answer-checking': '答案核对：同一句是否一致',
  'dish-tasting': '菜肴比喻：试菜与品控流程',
  'exam-prep': '考试备考：课本错题与模拟考',
  'puzzle-grading': '拼图评分：3块与5块判分',
};

function GroceryBudget({ extras = 0 }: { extras?: number }) {
  return (
    <>
      <path className="av-line" d="M40 62 L184 62 L170 118 L54 118 Z" />
      <path className="av-line" d="M86 62 C86 34 138 34 138 62" />
      {[62, 90, 118, 146].map((cx) => (
        <g key={cx}>
          <circle className="av-leaf" cx={cx} cy={86} r={17} />
          <path className="av-vein" d={`M${cx - 10} 86 Q${cx} 78 ${cx + 10} 86`} />
          <path className="av-vein" d={`M${cx - 8} 94 Q${cx} 88 ${cx + 8} 94`} />
        </g>
      ))}
      {Array.from({ length: Math.min(extras, 3) }, (_, index) => (
        <g key={`extra-${index}`} data-extra-cabbage={index + 1}>
          <circle className="av-leaf" cx={170 + index * 26} cy={30} r={10} />
          <text className="av-mark" x={170 + index * 26} y={52}>✗</text>
        </g>
      ))}
      <g transform="translate(212,96)">
        <path className="av-shroom" d="M-14 0 A14 14 0 0 1 14 0 Z" />
        <rect className="av-shroom-stem" x={-5} y={0} width={10} height={16} rx={3} />
      </g>
      <path className="av-dash" d="M196 78 C184 60 166 52 150 48" />
      <text className="av-mark" x={143} y={44}>✗</text>
    </>
  );
}

function MelonPicking() {
  return (
    <>
      <rect className="av-zone" x={14} y={18} width={128} height={94} rx={10} />
      {[[38, 42], [66, 42], [94, 42], [38, 70], [66, 70], [94, 70], [52, 96], [80, 96], [108, 62], [114, 92]].map(
        ([cx, cy]) => <circle key={`${cx}-${cy}`} className="av-melon" cx={cx} cy={cy} r={11} />,
      )}
      <text className="av-note" x={78} y={30}>大果园</text>
      <rect className="av-zone av-zone--rare" x={160} y={18} width={70} height={94} rx={10} />
      <circle className="av-melon av-melon--picked" cx={195} cy={74} r={13} />
      <text className="av-note" x={195} y={30}>小果园</text>
      <path className="av-tap" d="M176 52 Q168 60 172 70" />
      <path className="av-tap" d="M214 52 Q222 60 218 70" />
      <text className="av-mark av-mark--ok" x={228} y={104}>✓</text>
    </>
  );
}

function AnswerChecking({ correlated = false }: { correlated?: boolean }) {
  return (
    <g data-correlated={correlated ? 'true' : undefined}>
      <g>
        <rect className="av-sheet" x={18} y={22} width={64} height={86} rx={6} />
        <text className="av-note" x={50} y={40}>学生A</text>
        <path className="av-vein" d="M30 52 h40 M30 62 h40" />
        <text className="av-answer" x={50} y={92}>A</text>
        {correlated ? <text className="av-mark" x={66} y={92}>✗</text> : null}
      </g>
      <g>
        <rect className="av-sheet" x={96} y={22} width={64} height={86} rx={6} />
        <text className="av-note" x={128} y={40}>学生B</text>
        <path className="av-vein" d="M108 52 h40 M108 62 h40" />
        <text className="av-answer" x={128} y={92}>A</text>
        {correlated ? <text className="av-mark" x={144} y={92}>✗</text> : null}
      </g>
      <text className="av-eq" x={89} y={72}>=</text>
      {correlated ? (
        <>
          <path className="av-dash" d="M50 22 Q89 6 128 22" />
          <text className="av-note" x={89} y={14}>一致</text>
        </>
      ) : null}
      <g>
        <rect className="av-sheet av-sheet--truth" x={184} y={22} width={48} height={86} rx={6} />
        <text className="av-note" x={208} y={40}>答案</text>
        <text className="av-answer av-answer--unknown" x={208} y={90}>?</text>
      </g>
      <text className="av-mark" x={168} y={72}>≠</text>
    </g>
  );
}

function DishTasting() {
  return (
    <>
      <rect className="av-sheet" x={16} y={20} width={78} height={92} rx={6} />
      <text className="av-note" x={55} y={38}>食材</text>
      <path className="av-vein" d="M28 50 h54 M28 62 h54 M28 74 h54 M28 86 h36" />
      <text className="av-mark av-mark--ok" x={82} y={106}>✓</text>
      <path className="av-dash" d="M104 66 H128" />
      <path className="av-line" d="M138 78 h76 v14 a38 22 0 0 1 -76 0 Z" />
      <path className="av-line" d="M132 78 h88" />
      <path className="av-steam" d="M156 66 q4 -8 0 -14 M176 66 q4 -8 0 -14 M196 66 q4 -8 0 -14" />
      <path className="av-line" d="M206 30 L188 76" />
      <ellipse className="av-line" cx={186} cy={80} rx={7} ry={5} />
      <text className="av-note" x={176} y={122}>先出锅</text>
    </>
  );
}

function ExamPrep({ step = 0 }: { step?: number }) {
  const stepProps = (n: number) => ({
    ...(step === n ? { 'data-step-active': String(n) } : {}),
    className: step > 0 ? (step === n ? 'av-step av-step--active' : 'av-step--dim') : 'av-step',
  });
  return (
    <>
      <g {...stepProps(1)}>
        <path className="av-book" d="M22 46 h26 v52 h-26 Z M48 46 h26 v52 h-26 Z" />
        <path className="av-vein" d="M28 58 h14 M28 68 h14 M54 58 h14 M54 68 h14" />
        <text className="av-note" x={48} y={116}>课本</text>
      </g>
      <path className="av-dash" d="M82 72 H96" />
      <g {...stepProps(2)}>
        <rect className="av-sheet av-sheet--warn" x={100} y={34} width={56} height={72} rx={6} />
        <text className="av-x" x={114} y={60}>x</text>
        <text className="av-x" x={136} y={86}>x</text>
        <path className="av-vein" d="M110 96 h34" />
        <text className="av-note" x={128} y={116}>错题</text>
      </g>
      <path className="av-dash" d="M164 72 H178" />
      <g {...stepProps(3)}>
        <rect className="av-sheet av-sheet--goal" x={182} y={34} width={50} height={72} rx={6} />
        <text className="av-note" x={207} y={52}>模考</text>
        <text className="av-answer av-answer--score" x={207} y={88}>A+</text>
        <text className="av-note" x={207} y={116}>成绩</text>
      </g>
    </>
  );
}

function PuzzleGrading() {
  const picture = (x: number) => (
    <g transform={`translate(${x},0)`}>
      <circle className="av-sun" cx={40} cy={46} r={12} />
      <path className="av-hill" d="M14 96 L44 64 L62 84 L74 72 L96 96 Z" />
    </g>
  );
  return (
    <>
      <rect className="av-zone" x={12} y={18} width={112} height={96} rx={8} />
      <g transform="translate(14,20)">
        {picture(0)}
        <path className="av-cut" d="M54 0 V80 M0 44 H108" />
      </g>
      <text className="av-note" x={68} y={126}>3块拼图</text>
      <text className="av-eq" x={126} y={72}>=</text>
      <rect className="av-zone" x={132} y={18} width={112} height={96} rx={8} />
      <g transform="translate(134,20)">
        {picture(0)}
        <path className="av-cut" d="M36 0 V80 M72 0 V80 M0 28 H108 M0 54 H108" />
      </g>
      <text className="av-note" x={188} y={126}>5块拼图</text>
      <text className="av-mark av-mark--ok" x={206} y={30}>✓</text>
    </>
  );
}

export interface AnalogySceneState {
  extras?: number;
  correlated?: boolean;
  step?: number;
}

const SCENES: Record<AnalogyVisualId, (state: AnalogySceneState) => React.JSX.Element> = {
  'grocery-budget': GroceryBudget,
  'melon-picking': MelonPicking,
  'answer-checking': AnswerChecking,
  'dish-tasting': DishTasting,
  'exam-prep': ExamPrep,
  'puzzle-grading': PuzzleGrading,
};

export function AnalogyVisual({ visual, state }: { visual: AnalogyVisualId; state?: AnalogySceneState }) {
  const Scene = SCENES[visual];
  return (
    <svg
      className="analogy-visual"
      data-visual={visual}
      viewBox="0 0 244 130"
      role="img"
      aria-label={SCENE_LABELS[visual]}
    >
      <Scene {...(state ?? {})} />
    </svg>
  );
}

export default AnalogyVisual;

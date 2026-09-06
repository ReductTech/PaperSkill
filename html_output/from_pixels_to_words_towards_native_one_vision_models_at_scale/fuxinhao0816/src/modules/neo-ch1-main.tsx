import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type QuestionKey = 'where' | 'color' | 'nearby';

const steps = ['① 看见什么？', '② 它在哪里？', '③ 问题要什么？', '④ 怎样回答？'];

const questions: Array<{ id: QuestionKey; label: string; evidence: string }> = [
  { id: 'where', label: '红色汽车停在哪里？', evidence: '目标识别 · 空间关系' },
  { id: 'color', label: '汽车是什么颜色？', evidence: '目标识别 · 颜色属性' },
  { id: 'nearby', label: '汽车附近有什么？', evidence: '目标识别 · 邻近对象' },
];

const feedbackByStep = [
  '先识别场景中的对象：这里有红色汽车、道路、路口和建筑。',
  '还要理解空间关系：红车位于道路右侧，并靠近路口。',
  '问题决定哪些视觉证据重要：颜色帮助锁定目标，而“在哪里”要求我们关注空间关系。',
  '模型需要把与问题相关的视觉证据组织成语言回答。',
];

const lessonByStep = [
  '只知道“有一辆红车”，还不能回答“在哪里”。',
  '识别到“红车”与知道它“在何处”是两个不同判断。',
  '同一张图片，问题不同，需要关注的视觉证据也不同。',
  '视觉证据只有被组织起来，才会成为对问题有用的回答。',
];

function StreetScene({ step, question }: { step: number; question: QuestionKey }) {
  const grounding = step >= 2;
  const showSpatial = step === 1 || (grounding && (question === 'where' || question === 'nearby'));
  const showColor = grounding && question === 'color';
  const showNearby = grounding && question === 'nearby';
  const showLabels = step === 0;
  const muteContext = grounding && question === 'color';
  const muteFarObjects = grounding && question === 'where';

  return (
    <svg className="ch1-street-svg" viewBox="0 0 720 420" role="img" aria-label="包含红色汽车、道路、路口与建筑的街景示意">
      <defs>
        <linearGradient id="ch1-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dceaf6" />
          <stop offset="1" stopColor="#f5f8fb" />
        </linearGradient>
        <marker id="ch1-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#27446e" />
        </marker>
      </defs>

      <rect width="720" height="420" rx="18" fill="url(#ch1-sky)" />
      <rect y="192" width="720" height="228" fill="#d8e0d4" />

      <g className={`ch1-scene-object ch1-building-left ${muteContext || muteFarObjects ? 'is-muted' : ''}`}>
        <rect x="42" y="54" width="155" height="145" rx="7" fill="#d8c9b5" stroke="#8d7b66" strokeWidth="3" />
        <rect x="58" y="75" width="30" height="31" rx="3" fill="#8fb6cd" />
        <rect x="105" y="75" width="30" height="31" rx="3" fill="#8fb6cd" />
        <rect x="152" y="75" width="29" height="31" rx="3" fill="#8fb6cd" />
        <rect x="58" y="122" width="30" height="31" rx="3" fill="#8fb6cd" />
        <rect x="105" y="122" width="30" height="31" rx="3" fill="#8fb6cd" />
        <rect x="151" y="119" width="31" height="80" rx="3" fill="#806d59" />
      </g>

      <g className={`ch1-scene-object ch1-building-right ${muteContext ? 'is-muted' : ''} ${showNearby ? 'is-evidence' : ''}`}>
        <rect x="548" y="72" width="133" height="132" rx="7" fill="#c9d4df" stroke="#768da2" strokeWidth="3" />
        {[0, 1, 2].map((col) => [0, 1].map((row) => (
          <rect key={`${col}-${row}`} x={564 + col * 37} y={91 + row * 43} width="23" height="25" rx="3" fill="#f8d98a" />
        )))}
        <rect x="598" y="158" width="31" height="46" rx="3" fill="#65798d" />
      </g>

      <g className={`ch1-scene-object ch1-tree ${muteContext || muteFarObjects ? 'is-muted' : ''}`}>
        <rect x="224" y="118" width="12" height="79" rx="5" fill="#80644d" />
        <circle cx="230" cy="104" r="38" fill="#76a66a" />
        <circle cx="207" cy="118" r="23" fill="#86b779" />
      </g>

      <g className={`ch1-road ${muteContext ? 'is-muted' : ''}`}>
        <path d="M0 232 H720 V366 H0 Z" fill="#657180" />
        <path d="M278 154 H443 V420 H278 Z" fill="#657180" />
        <path d="M0 218 H272 V232 H0 Z M449 218 H720 V232 H449 Z" fill="#b9c3c9" />
        <path d="M0 366 H272 V380 H0 Z M449 366 H720 V380 H449 Z" fill="#b9c3c9" />
        <path d="M264 154 H278 V218 H264 Z M443 154 H457 V218 H443 Z" fill="#b9c3c9" />
        <line x1="0" y1="299" x2="258" y2="299" stroke="#f4df7b" strokeWidth="5" strokeDasharray="30 22" />
        <line x1="463" y1="299" x2="720" y2="299" stroke="#f4df7b" strokeWidth="5" strokeDasharray="30 22" />
        <line x1="360" y1="154" x2="360" y2="220" stroke="#f4df7b" strokeWidth="5" strokeDasharray="24 18" />
        <line x1="360" y1="382" x2="360" y2="420" stroke="#f4df7b" strokeWidth="5" strokeDasharray="24 18" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={446 + i * 15} y="238" width="9" height="44" fill="#edf1f4" opacity="0.92" />)}
      </g>

      <g className={`ch1-intersection ${showSpatial || showNearby ? 'is-evidence' : ''}`}>
        <rect x="282" y="229" width="158" height="137" rx="12" fill="none" stroke="#27446e" strokeWidth="4" strokeDasharray="10 8" opacity={showSpatial || showNearby ? 0.9 : 0} />
      </g>

      <g className={`ch1-scene-object ch1-sign ${muteContext || muteFarObjects ? 'is-muted' : ''} ${showNearby ? 'is-evidence' : ''}`}>
        <rect x="523" y="176" width="8" height="70" rx="4" fill="#536476" />
        <rect x="507" y="160" width="41" height="28" rx="5" fill="#27446e" />
        <path d="M517 174 H539" stroke="white" strokeWidth="4" markerEnd="url(#ch1-arrow)" />
      </g>

      {showSpatial ? (
        <g className="ch1-spatial-evidence">
          <rect x="452" y="235" width="238" height="124" rx="14" fill="#dceafb" opacity="0.34" stroke="#27446e" strokeWidth="3" />
          <path d="M496 270 C460 247 433 252 410 276" fill="none" stroke="#27446e" strokeWidth="4" strokeDasharray="9 7" markerEnd="url(#ch1-arrow)" />
          <rect x="440" y="205" width="238" height="36" rx="18" fill="#ffffff" stroke="#27446e" strokeWidth="2" />
          <text x="559" y="229" textAnchor="middle" className="ch1-scene-label ch1-label-strong">道路右侧 · 靠近路口</text>
        </g>
      ) : null}

      <g className={`ch1-car ${showColor ? 'is-color-evidence' : ''}`}>
        <ellipse cx="536" cy="340" rx="79" ry="17" fill="#263446" opacity="0.18" />
        <path d="M469 304 L491 272 Q499 261 516 261 H558 Q573 262 584 278 L599 304 Z" fill="#c43f52" stroke="#762638" strokeWidth="4" />
        <rect x="454" y="301" width="160" height="49" rx="15" fill="#cf3d52" stroke="#762638" strokeWidth="4" />
        <path d="M502 269 H552 Q563 270 574 291 H489 Z" fill="#b9d5e5" stroke="#762638" strokeWidth="3" />
        <line x1="532" y1="270" x2="532" y2="291" stroke="#762638" strokeWidth="3" />
        <circle cx="490" cy="350" r="17" fill="#273545" stroke="#f3f5f7" strokeWidth="5" />
        <circle cx="578" cy="350" r="17" fill="#273545" stroke="#f3f5f7" strokeWidth="5" />
        <rect x="599" y="314" width="13" height="10" rx="4" fill="#f5d379" />
        <rect x="456" y="314" width="13" height="10" rx="4" fill="#f5d379" />
        <rect className="ch1-car-focus" x="444" y="252" width="180" height="114" rx="22" fill="none" stroke="#d97706" strokeWidth={showColor ? 7 : 4} />
      </g>

      {showLabels ? (
        <g className="ch1-object-labels">
          <path d="M477 277 L419 235" stroke="#27446e" strokeWidth="3" />
          <rect x="335" y="204" width="122" height="34" rx="17" fill="white" stroke="#27446e" strokeWidth="2" />
          <text x="396" y="227" textAnchor="middle" className="ch1-scene-label">红色汽车</text>
          <rect x="32" y="257" width="82" height="34" rx="17" fill="white" stroke="#68778f" strokeWidth="2" />
          <text x="73" y="280" textAnchor="middle" className="ch1-scene-label">道路</text>
          <rect x="307" y="310" width="100" height="34" rx="17" fill="white" stroke="#68778f" strokeWidth="2" />
          <text x="357" y="333" textAnchor="middle" className="ch1-scene-label">路口</text>
          <rect x="567" y="35" width="92" height="34" rx="17" fill="white" stroke="#68778f" strokeWidth="2" />
          <text x="613" y="58" textAnchor="middle" className="ch1-scene-label">建筑</text>
        </g>
      ) : null}

      {showNearby ? (
        <g className="ch1-nearby-evidence">
          <path d="M590 282 C628 255 632 226 621 203" fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="8 7" markerEnd="url(#ch1-arrow)" />
          <rect x="530" y="214" width="159" height="34" rx="17" fill="white" stroke="#7c3aed" strokeWidth="2" />
          <text x="609" y="237" textAnchor="middle" className="ch1-scene-label ch1-label-nearby">附近：路口与建筑</text>
        </g>
      ) : null}
    </svg>
  );
}

function QuestionText({ question, grounded }: { question: QuestionKey; grounded: boolean }) {
  if (question === 'where') {
    return <><span className={grounded ? 'is-target' : ''}>红色汽车</span><span className={grounded ? 'is-focus' : ''}>停在哪里？</span></>;
  }
  if (question === 'color') {
    return <><span className={grounded ? 'is-target' : ''}>汽车</span><span className={grounded ? 'is-focus' : ''}>是什么颜色？</span></>;
  }
  return <><span className={grounded ? 'is-target' : ''}>汽车</span><span className={grounded ? 'is-focus' : ''}>附近有什么？</span></>;
}

function AnswerComposition({ question }: { question: QuestionKey }) {
  const content = question === 'where'
    ? { first: '目标：红色汽车', second: '空间关系：道路右侧 · 靠近路口', answer: '红色汽车停在道路右侧、靠近路口的位置。' }
    : question === 'color'
      ? { first: '目标：汽车', second: '颜色属性：红色', answer: '汽车是红色的。' }
      : { first: '目标：汽车', second: '邻近对象：路口 · 建筑', answer: '汽车附近有路口和一栋建筑。' };

  return (
    <div className="ch1-composition" aria-label="从视觉证据组合成语言回答">
      <div className="ch1-evidence-pair"><span>{content.first}</span><b>+</b><span>{content.second}</span></div>
      <div className="ch1-compose-arrow" aria-hidden="true">↓</div>
      <div className="ch1-final-answer">{content.answer}</div>
    </div>
  );
}

export const NeoCh1Main: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState<QuestionKey>('where');
  const currentQuestion = questions.find((item) => item.id === question) ?? questions[0];
  const feedback = step === 2 && question === 'color'
    ? '问题决定哪些视觉证据重要：“什么颜色”让我们关注汽车车身的红色。'
    : step === 2 && question === 'nearby'
      ? '问题要求寻找邻近对象：路口和建筑成为当前最重要的视觉证据。'
      : feedbackByStep[step];

  const chooseQuestion = (next: QuestionKey) => {
    setQuestion(next);
    setStep(2);
  };

  return (
    <div className="ch1-cognition-lab">
      <div className="ch1-lab-heading">
        <span>互动实验</span>
        <p>点击下面的步骤，看看同一个问题需要哪些不同证据。</p>
      </div>
      <div className="ch1-question-bar">
        <div>
          <span className="ch1-question-kicker">当前问题</span>
          <div className={`ch1-question-text ${step >= 2 ? 'is-grounded' : ''}`}>
            <QuestionText question={question} grounded={step >= 2} />
          </div>
        </div>
        <div className="ch1-question-focus"><span>重点证据</span><b>{currentQuestion.evidence}</b></div>
      </div>

      <div className="ch1-question-switch" role="group" aria-label="换一个问题">
        <span>换一个问题</span>
        {questions.map((item) => (
          <button key={item.id} type="button" className={question === item.id ? 'is-active' : ''} aria-pressed={question === item.id} onClick={() => chooseQuestion(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="ch1-scene-wrap">
        <StreetScene step={step} question={question} />
      </div>

      <div className="ch1-judgments" role="group" aria-label="一次回答中逐渐建立的判断">
        {steps.map((label, index) => (
          <button key={label} type="button" className={step === index ? 'is-active' : ''} aria-pressed={step === index} onClick={() => setStep(index)}>
            {label}
          </button>
        ))}
      </div>

      {step === 3 ? <AnswerComposition question={question} /> : null}

      <div className="ch1-feedback" aria-live="polite">
        <p>{feedback}</p>
        <strong>{lessonByStep[step]}</strong>
      </div>
    </div>
  );
};

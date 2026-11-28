import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Camera, FrameStrip, Person, Room } from './sceneKit';

type Op = 'view' | 'interp' | 'cont' | 'act';

const OPS: { key: Op; label: string }[] = [
  { key: 'view', label: '换机位' },
  { key: 'interp', label: '补中间帧' },
  { key: 'cont', label: '继续拍' },
  { key: 'act', label: '挪动物件再拍' },
];

const QUESTIONS: { text: string; answer: Op; frames: string[]; badFrames: string[] }[] = [
  {
    text: '相机绕到房间另一侧，会看到什么？',
    answer: 'view',
    frames: ['当前视角', '转过去', '另一侧'],
    badFrames: ['当前', '当前', '当前'],
  },
  {
    text: '这两张之间，杯子是被谁碰倒的？',
    answer: 'interp',
    frames: ['开始时', '中间', '结束时'],
    badFrames: ['之后', '之后', '之后'],
  },
  {
    text: '松手之后，红球会先碰到谁？',
    answer: 'cont',
    frames: ['松手', '下落', '先碰到蓝'],
    badFrames: ['换个视角', '换个视角', '换个视角'],
  },
  {
    text: '把橙色方块拿走，蓝色方块会倒吗？',
    answer: 'act',
    frames: ['拿走橙块', '受力改变', '蓝块仍站住'],
    badFrames: ['原地不动', '原地不动', '原地不动'],
  },
];

export function S3Ops(_props: WidgetProps) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Op | null>(null);
  const question = QUESTIONS[index];
  const correct = chosen === question.answer;
  const answered = chosen !== null;
  const pick = (op: Op) => setChosen(op);
  const next = () => { setIndex((index + 1) % QUESTIONS.length); setChosen(null); };
  return (
    <div className="ps-page s3-page">
      <div className="ps-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label="相机与四种拍摄动作">
          <Room />
          <Person x={330} y={524} scale={1.2} />
          <Camera x={520} y={470} scale={1.6} />
          <g transform="translate(40 28)">
            <rect x="0" y="0" width="820" height="88" rx="16" fill="#ffffff" stroke="#d7deea" strokeWidth="2" />
            <text x="28" y="56" fontSize="30" fontWeight="700" fill="#21324a">{question.text}</text>
          </g>
          <g opacity=".9">
            <rect x="628" y="168" width="216" height="150" rx="12" fill="#fdf3f4" stroke="#c43f52" strokeWidth="3" strokeDasharray="12 9" />
            <text x="736" y="234" textAnchor="middle" fontSize="26" fontWeight="700" fill="#c43f52">缺的那段画面</text>
            <text x="736" y="272" textAnchor="middle" fontSize="22" fill="#b76070">还没生成</text>
          </g>
        </svg>
      </div>
      <div className="ps-right">
        <div className="ps-opgrid">
          {OPS.map(op => {
            const on = chosen === op.key;
            const good = on && op.key === question.answer;
            return (
              <button key={op.key} className={`ps-op ${on ? (good ? 'is-good' : 'is-bad') : ''}`} onClick={() => pick(op.key)}>
                <span className="ps-op-name">{op.label}</span>
              </button>
            );
          })}
        </div>
        <div className="ps-strip">
          {answered ? (
            <svg viewBox="0 0 520 170" role="img" aria-label={`生成的片段：${(correct ? question.frames : question.badFrames).join('、')}`}>
              <FrameStrip x={6} y={6} labels={correct ? question.frames : question.badFrames}
                states={correct ? ['ok', 'ok', 'ok'] : ['bad', 'bad', 'bad']} width={156} height={100} dashed={!correct} />
            </svg>
          ) : (
            <div className="ps-empty">选一个操作，看看世界模型会生成什么</div>
          )}
        </div>
        <div className={`ps-feedback ${answered ? (correct ? 'is-success' : 'is-fail') : 'is-neutral'}`} aria-live="polite">
          {!answered ? '先读题：这段缺口需要哪种画面？'
            : correct ? '这段证据正好回答当前问题：缺口被补上。'
              : `这段证据回答了另一个问题——这里需要「${OPS.find(op => op.key === question.answer)!.label}」。`}
        </div>
        {answered ? <button className="ps-next" onClick={next}>下一个问题</button> : null}
      </div>
    </div>
  );
}

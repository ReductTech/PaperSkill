import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const BLUE = '#27446e';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

type PeCase = 'aime' | 'rpg' | 'web';
type PeMode = 'raw' | '3b' | 'large';

const CASES: Record<PeCase, { label: string }> = {
  aime: { label: '白板数学' },
  rpg: { label: 'RPG界面' },
  web: { label: '网页布局' },
};

const MODES: Record<PeMode, { label: string; color: string }> = {
  raw: { label: '无PE', color: BLUE },
  '3b': { label: '3B PE', color: GREEN },
  large: { label: '更大LM PE', color: PURPLE },
};

const IMAGES: Record<PeCase, Record<PeMode, string>> = {
  aime: {
    raw: '/images/pe-aime-raw.jpg',
    '3b': '/images/pe-aime-3b.jpg',
    large: '/images/pe-aime-large.jpg',
  },
  rpg: {
    raw: '/images/pe-rpg-raw.jpg',
    '3b': '/images/pe-rpg-3b.jpg',
    large: '/images/pe-rpg-large.jpg',
  },
  web: {
    raw: '/images/pe-web-raw.jpg',
    '3b': '/images/pe-web-3b.jpg',
    large: '/images/pe-web-large.jpg',
  },
};

const caseOrder: PeCase[] = ['aime', 'rpg', 'web'];
const modeOrder: PeMode[] = ['raw', '3b', 'large'];

export const Ch5PeWidget: React.FC<WidgetProps> = () => {
  const [peCase, setPeCase] = useState<PeCase>('aime');
  const [peMode, setPeMode] = useState<PeMode>('raw');

  const cycleCase = (delta: number) =>
    setPeCase(caseOrder[(caseOrder.indexOf(peCase) + delta + caseOrder.length) % caseOrder.length]);
  const cycleMode = (delta: number) =>
    setPeMode(modeOrder[(modeOrder.indexOf(peMode) + delta + modeOrder.length) % modeOrder.length]);

  const feedback =
    peMode === 'raw'
      ? '无 PE 状态保留原始短提示；当前案例的结构、文字和场景约束没有被主动展开。'
      : peMode === '3b'
      ? '在论文展示的这组案例中，3B PE 补充了结构化约束；这是定性观察，不是量化提升。'
      : '论文定性说明更大语言模型 PE 对需要更多推理或世界知识的任务还能提供帮助。';

  return (
    <div>
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="论文定性案例"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            cycleCase(-1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            cycleCase(1);
          }
        }}
      >
        {caseOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={'chip ' + (peCase === item ? 'selected' : '')}
            aria-pressed={peCase === item}
            onClick={() => setPeCase(item)}
          >
            {CASES[item].label}
          </button>
        ))}
      </div>
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="PE模式"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            cycleMode(-1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            cycleMode(1);
          }
        }}
      >
        {modeOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={'chip ' + (peMode === item ? 'selected' : '')}
            aria-pressed={peMode === item}
            onClick={() => setPeMode(item)}
          >
            {MODES[item].label}
          </button>
        ))}
      </div>

      <div className="three-col-demo" aria-label={CASES[peCase].label + '论文原始定性对比'}>
        {modeOrder.map((item) => (
          <figure
            key={item}
            className={'three-col-panel ' + (peMode === item ? 'clean' : '')}
            style={{ borderColor: peMode === item ? MODES[item].color : BORDER }}
          >
            <div className="three-col-label">{MODES[item].label}</div>
            <img
              src={IMAGES[peCase][item]}
              alt={CASES[peCase].label + '案例的' + MODES[item].label + '论文原图'}
              loading="lazy"
              style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 6 }}
            />
          </figure>
        ))}
      </div>

      <div className={'feedback ' + (peMode === 'raw' ? '' : 'good')} aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};

export default Ch5PeWidget;

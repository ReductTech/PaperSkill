import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PAL } from './kit';

type ModelInfo = {
  name: string;
  role: string;
  color: string;
};

type SceneInfo = {
  background: string;
  light: string;
  position: string;
  clutter: string;
  objectLeft: number;
  lightMode: string;
};

const models: ModelInfo[] = [
  { name: 'RT-1', role: '强策略基线', color: PAL.orange },
  { name: 'VC-1', role: '视觉表征基线', color: PAL.blue },
  { name: 'RT-2-PaLI-X', role: '本文 55B', color: PAL.purple },
  { name: 'RT-2-PaLM-E', role: '本文 12B', color: PAL.green },
];

const sharedScene: SceneInfo = {
  background: '同一背景',
  light: '同一光照',
  position: '同一物体位置',
  clutter: '同一干扰物',
  objectLeft: 46,
  lightMode: 'normal',
};

const separateScenes: SceneInfo[] = [
  { background: '浅色墙', light: '偏暗', position: '物体在左侧', clutter: '较少', objectLeft: 24, lightMode: 'dark' },
  { background: '木纹墙', light: '正常', position: '物体在中间', clutter: '较多', objectLeft: 48, lightMode: 'normal' },
  { background: '白板背景', light: '偏亮', position: '物体在右侧', clutter: '中等', objectLeft: 70, lightMode: 'bright' },
  { background: '灰色墙', light: '有阴影', position: '物体更靠前', clutter: '较少', objectLeft: 38, lightMode: 'shadow' },
];

const LockIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
    <rect x="4.5" y="9" width="11" height="8" rx="2" fill={PAL.green} />
    <path d="M7 9V6.8a3 3 0 0 1 6 0V9" fill="none" stroke={PAL.green} strokeWidth="1.8" />
    <circle cx="10" cy="13" r="1.2" fill="#ffffff" />
  </svg>
);

const WarnIcon: React.FC = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
    <path d="M10 3.2 17.5 16.2H2.5L10 3.2Z" fill={PAL.red} />
    <path d="M10 8.2v3.4" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="10" cy="14" r="1" fill="#ffffff" />
  </svg>
);

export const ABTesting: React.FC<WidgetProps> = () => {
  const [paired, setPaired] = useState(true);
  const [turn, setTurn] = useState(0);
  const scene = paired ? sharedScene : separateScenes[turn];
  const conditionRows = [
    ['背景', scene.background],
    ['光照', scene.light],
    ['物体位置', scene.position],
    ['干扰物', scene.clutter],
  ];

  return (
    <div className="ab72">
      <div className="ab72-mode-grid" role="group" aria-label="选择评估方式">
        <button
          type="button"
          className={`ab72-mode is-bad ${!paired ? 'is-active' : ''}`}
          onClick={() => setPaired(false)}
        >
          <span className="ab72-mode-kicker">错误比较方式</span>
          <strong>各测各的</strong>
          <small>批次变化时，背景、光照和物体位置也在变</small>
          <span className="ab72-mode-badge">混入场景噪声</span>
        </button>
        <button
          type="button"
          className={`ab72-mode is-good ${paired ? 'is-active' : ''}`}
          onClick={() => setPaired(true)}
        >
          <span className="ab72-mode-kicker">论文采用方式</span>
          <strong>同一时段轮转</strong>
          <small>场景先锁定，四款模型再按顺序上场</small>
          <span className="ab72-mode-badge">控制变量</span>
        </button>
      </div>

      <div className={`ab72-stage ${paired ? 'is-paired' : 'is-separate'}`}>
        <section className="ab72-card ab72-scene-card">
          <div className="ab72-card-head">
            <h4>{paired ? '锁定的场景条件' : `批次 ${turn + 1} 的场景条件`}</h4>
            <span className="ab72-status">{paired ? '场景不变' : '场景会变'}</span>
          </div>

          <div className={`ab72-tabletop light-${scene.lightMode}`}>
            <span className="ab72-clutter c1" />
            <span className="ab72-clutter c2" />
            <span className="ab72-object" style={{ left: `${scene.objectLeft}%` }} />
            <span className="ab72-light" />
          </div>

          <div className="ab72-conditions">
            {conditionRows.map(([label, value]) => (
              <div className="ab72-condition" key={label}>
                <span>{label}</span>
                <b>{value}</b>
                <i>{paired ? <LockIcon /> : <WarnIcon />}</i>
              </div>
            ))}
          </div>
        </section>

        <section className="ab72-card ab72-model-card">
          <div className="ab72-card-head">
            <h4>四款模型上场顺序</h4>
            <span className="ab72-status">RT-1 → VC-1 → RT-2-PaLI-X → RT-2-PaLM-E</span>
          </div>
          <div className="ab72-model-list">
            {models.map((model, index) => {
              const active = index === turn;
              return (
                <button
                  type="button"
                  key={model.name}
                  className={`ab72-model ${active ? 'is-active' : ''}`}
                  onClick={() => setTurn(index)}
                  style={{ '--model-color': model.color } as React.CSSProperties}
                >
                  <span className="ab72-model-dot" />
                  <span className="ab72-model-name">
                    <b>{model.name}</b>
                    <small>{model.role}</small>
                  </span>
                  <span className="ab72-model-scene">
                    {paired ? '同一场景' : `场景 ${String.fromCharCode(65 + index)}`}
                  </span>
                  <span className="ab72-model-state">
                    {active ? (paired ? '当前上场' : '当前批次') : paired ? '等待上场' : '另一批次'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="rt2-controls">
        <button
          type="button"
          className="rt2-btn"
          onClick={() => setTurn((value) => (value + 1) % models.length)}
        >
          {paired ? '下一棒' : '换下一批'}
        </button>
        <button
          type="button"
          className="rt2-btn"
          onClick={() => setTurn(0)}
        >
          回到第一棒
        </button>
      </div>

      <div className={`ab72-formula ${paired ? 'is-good' : 'is-bad'}`}>
        {paired
          ? '观测差异 ≈ 模型差异：背景、光照、物体位置和干扰物被固定，场景差异被控制住'
          : '观测差异 = 模型差异 + 背景差异 + 光照差异 + 物体位置差异，无法直接归因给模型'}
      </div>

      <p className={`rt2-note ${paired ? 'is-good' : 'is-bad'}`}>
        {paired
          ? '论文让四款模型在完全相同的条件下一个接一个评估，从而降低实验方差。它不是让结果完全不波动，而是先把会干扰比较的场景条件固定下来。'
          : '各测各的时，模型分数可能同时受到环境变化影响。即使最后分数不同，也不能直接判断差异来自模型能力。'}
      </p>
    </div>
  );
};

export default ABTesting;

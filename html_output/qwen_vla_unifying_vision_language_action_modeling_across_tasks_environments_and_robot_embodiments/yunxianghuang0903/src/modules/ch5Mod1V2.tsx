import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PsButton, PsChip, PsFeedback } from '../components/ps-controls';
import TrainingRecipeTheater, { type TrainStage } from './trainingRecipeTheater';
import type { WidgetProps } from './registry';

type RailNode = 't2a' | 'cpt' | 'sft-mt' | 'sft-rr' | 'rl';

const AUTO_SEQUENCE: { node: RailNode; stage: TrainStage; dur: number }[] = [
  { node: 't2a', stage: 't2a', dur: 3000 },
  { node: 'cpt', stage: 'cpt', dur: 3200 },
  { node: 'sft-mt', stage: 'sft', dur: 2800 },
  { node: 'sft-rr', stage: 'sft', dur: 2400 },
  { node: 'rl', stage: 'rl', dur: 3400 },
];

const STATUS: Record<TrainStage, string> = {
  t2a: 'T2A：视觉关闭、VLM 冻结，先建立 language + embodiment → action prior。',
  cpt: 'CPT：打开视觉，VLM + DiT 联合训练，让动作条件落到具体场景。',
  sft: 'SFT：从 CPT checkpoint 分叉到 Multi-task SFT 与 Real-robot SFT。',
  rl: 'RL：从 Multi-task SFT 继续，在 SimplerEnv rollout 中优化闭环任务成功。',
};

const MAIN_STAGE: { id: TrainStage; label: string; zh: string }[] = [
  { id: 't2a', label: 'T2A', zh: '动作先验' },
  { id: 'cpt', label: 'CPT', zh: '视觉落地' },
  { id: 'sft', label: 'SFT', zh: '任务专精' },
  { id: 'rl', label: 'RL', zh: '闭环优化' },
];

export const Ch5Mod1V2: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<TrainStage>('t2a');
  const [activeNode, setActiveNode] = useState<RailNode>('t2a');
  const [auto, setAuto] = useState(false);
  const [rlSuccess, setRlSuccess] = useState(true);
  const [autoIndex, setAutoIndex] = useState(0);
  const timerRef = useRef<number>(0);

  const stageIndex = useMemo(() => MAIN_STAGE.findIndex((s) => s.id === stage), [stage]);

  const pickNode = (node: RailNode) => {
    window.clearTimeout(timerRef.current);
    setAuto(false);
    setActiveNode(node);
    if (node === 't2a') setStage('t2a');
    else if (node === 'cpt') setStage('cpt');
    else if (node === 'sft-mt' || node === 'sft-rr') setStage('sft');
    else setStage('rl');
  };

  const applyAutoStep = (index: number) => {
    const step = AUTO_SEQUENCE[index];
    setActiveNode(step.node);
    setStage(step.stage);
    setAutoIndex(index);
  };

  const startAuto = () => {
    window.clearTimeout(timerRef.current);
    setAuto(true);
    applyAutoStep(0);
    let i = 0;
    const runNext = () => {
      const current = AUTO_SEQUENCE[i];
      timerRef.current = window.setTimeout(() => {
        i += 1;
        if (i >= AUTO_SEQUENCE.length) {
          setAuto(false);
          return;
        }
        applyAutoStep(i);
        runNext();
      }, current.dur);
    };
    runNext();
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const sftBranch = activeNode === 'sft-rr' ? 'real' : activeNode === 'sft-mt' ? 'multi' : 'both';

  const clickMainStage = (target: TrainStage) => {
    if (target === 't2a') pickNode('t2a');
    if (target === 'cpt') pickNode('cpt');
    if (target === 'sft') pickNode('sft-mt');
    if (target === 'rl') pickNode('rl');
  };

  return (
    <div className="ch5-course-lab">
      <div className="ch5-course-map" aria-label="四阶段训练路线">
        <div className="ch5-course-track" aria-hidden="true">
          <span className="ch5-course-track-base" />
          <span className="ch5-course-track-live" style={{ width: `${stageIndex * 33.333}%` }} />
        </div>
        {MAIN_STAGE.map((item, idx) => {
          const isActive = item.id === stage;
          const isDone = idx < stageIndex;
          return (
            <button
              key={item.id}
              type="button"
              className={`ch5-course-node${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
              onClick={() => clickMainStage(item.id)}
            >
              <span className="ch5-course-dot"><i /></span>
              <strong>{item.label}</strong>
              <small>{item.zh}</small>
            </button>
          );
        })}
      </div>

      {stage === 'sft' ? (
        <div className="ch5-sft-branch-picker">
          <span>从 CPT checkpoint 分叉：</span>
          <PsChip selected={activeNode === 'sft-mt'} onClick={() => pickNode('sft-mt')}>Multi-task SFT</PsChip>
          <PsChip selected={activeNode === 'sft-rr'} onClick={() => pickNode('sft-rr')}>Real-robot SFT</PsChip>
        </div>
      ) : null}

      <TrainingRecipeTheater stage={stage} sftBranch={sftBranch} rlSuccess={rlSuccess} spotlight={auto} />

      <div className="ch5-course-controls">
        <div className="ch5-course-status">
          <span className="ch5-course-status-dot" />
          <span>{auto ? `自动演示 ${autoIndex + 1}/${AUTO_SEQUENCE.length}` : '手动探索'}</span>
          <strong>{STATUS[stage]}</strong>
        </div>
        <div className="ps-controls-row ch5-course-buttons">
          <PsButton variant="primary" active={auto} onClick={startAuto}>{auto ? '正在播放训练流程' : '▶ 自动播放训练流程'}</PsButton>
          <PsChip selected={stage === 't2a'} onClick={() => pickNode('t2a')}>T2A</PsChip>
          <PsChip selected={stage === 'cpt'} onClick={() => pickNode('cpt')}>CPT</PsChip>
          <PsChip selected={stage === 'sft'} onClick={() => pickNode('sft-mt')}>SFT</PsChip>
          <PsChip selected={stage === 'rl'} onClick={() => pickNode('rl')}>RL</PsChip>
          {stage === 'rl' ? <PsChip selected={!rlSuccess} onClick={() => setRlSuccess((v) => !v)}>切换 R={rlSuccess ? '1→0' : '0→1'}</PsChip> : null}
        </div>
      </div>

      <PsFeedback tone="good">{STATUS[stage]}</PsFeedback>
    </div>
  );
};

export default Ch5Mod1V2;

import { useEffect, useMemo, useRef, useState } from 'react';
import { Term } from '../components/Glossary';
import { PAPER_FACTS } from '../data/facts';
import { usePlaybackTimeline } from '../hooks/usePlaybackTimeline';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-training.css';

const DURATION_MS = 24_000;
const STAGE_BEATS = [0, 8_000, 16_000, 24_000] as const;

type TaskId = 'text' | 'formula' | 'table' | 'layout';
type MetricState = 'metric-edit-distance' | 'metric-cdm' | 'metric-teds' | 'metric-iou';

const TASKS: readonly { id: TaskId; label: string; metric: string; state: MetricState; glossaryId: string }[] = [
  { id: 'text', label: '文本指标', metric: PAPER_FACTS.rewards[0], state: 'metric-edit-distance', glossaryId: 'edit-distance' },
  { id: 'formula', label: '公式指标', metric: PAPER_FACTS.rewards[1], state: 'metric-cdm', glossaryId: 'cdm' },
  { id: 'table', label: '表格指标', metric: PAPER_FACTS.rewards[2], state: 'metric-teds', glossaryId: 'teds' },
  { id: 'layout', label: '版面指标', metric: PAPER_FACTS.rewards[3], state: 'metric-iou', glossaryId: 'iou' },
] as const;

const CANDIDATES = [
  { id: 'candidate-a', label: '候选 A', scores: { text: 81, formula: 74, table: 89, layout: 77 } },
  { id: 'candidate-b', label: '候选 B', scores: { text: 96, formula: 83, table: 78, layout: 86 } },
  { id: 'candidate-c', label: '候选 C', scores: { text: 88, formula: 97, table: 94, layout: 72 } },
  { id: 'candidate-d', label: '候选 D', scores: { text: 79, formula: 86, table: 82, layout: 98 } },
] as const;

const stageFromState = (state?: string) => state === 'stage-3' ? 2 : state === 'stage-2' ? 1 : 0;

const taskFromState = (state?: string): TaskId => TASKS.find((task) => task.state === state)?.id ?? 'text';

const timeLabel = (milliseconds: number) => `00:${String(Math.floor(milliseconds / 1000)).padStart(2, '0')}`;

const STAGE_DIAGRAM_LABELS = [
  '预训练：广覆盖数据流入模型',
  '微调：难例经 Replay 回到训练回环',
  '强化学习：rollout 分支、任务奖励与梯度回流',
] as const;

const ROLLOUT_BRANCH_Y = [90, 126, 162, 198] as const;

/**
 * 自制教学示意图：模型数据流随 data-stage 演化——
 * 阶段 1 点亮数据流入，阶段 2 出现 Replay 回环，阶段 3 展开 rollout 分支与奖励回流。
 */
function ModelStageDiagram({ stage }: { stage: number }) {
  const label = STAGE_DIAGRAM_LABELS[stage] ?? STAGE_DIAGRAM_LABELS[0];
  return <svg className="tt-model-diagram" data-testid="model-stage-diagram" data-stage={stage + 1} viewBox="0 0 420 300" role="img" aria-label={`自制教学示意：第 ${stage + 1} 阶段，${label}`}>
    <defs>
      <marker id="tt-arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#56718e" /></marker>
      <marker id="tt-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8fd0ff" /></marker>
      <marker id="tt-arrow-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f0a45c" /></marker>
      <marker id="tt-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7fd6a8" /></marker>
    </defs>

    <g className="tt-scaffold">
      <rect x={18} y={112} width={92} height={68} rx={10} className="tt-node" />
      <rect x={30} y={126} width={68} height={6} rx={3} className="tt-node-bar" />
      <rect x={30} y={140} width={68} height={6} rx={3} className="tt-node-bar" />
      <rect x={30} y={154} width={68} height={6} rx={3} className="tt-node-bar" />
      <text x={64} y={104} textAnchor="middle" className="tt-label">数据引擎</text>

      <rect x={156} y={64} width={116} height={164} rx={12} className="tt-node tt-node--model" />
      <text x={214} y={86} textAnchor="middle" className="tt-title">策略模型</text>
      <rect x={170} y={98} width={88} height={14} rx={3} className="tt-layer tt-layer--1" />
      <rect x={170} y={124} width={88} height={14} rx={3} className="tt-layer tt-layer--2" />
      <rect x={170} y={150} width={88} height={14} rx={3} className="tt-layer tt-layer--3" />
      <rect x={170} y={176} width={88} height={14} rx={3} className="tt-layer tt-layer--4" />
      <text x={214} y={210} textAnchor="middle" className="tt-label tt-label--dim">参数层 · 教学填充</text>
      <text x={214} y={246} textAnchor="middle" className="tt-label">策略模型（教学示意）</text>

      <rect x={320} y={112} width={82} height={68} rx={10} className="tt-node" />
      <rect x={332} y={126} width={58} height={5} rx={2.5} className="tt-node-bar" />
      <rect x={332} y={139} width={58} height={5} rx={2.5} className="tt-node-bar" />
      <rect x={332} y={152} width={58} height={5} rx={2.5} className="tt-node-bar" />
      <text x={361} y={104} textAnchor="middle" className="tt-label">结构化输出</text>

      <path d="M 112 146 H 150" className="tt-flow" markerEnd="url(#tt-arrow-gray)" />
      <path d="M 274 146 H 314" className="tt-flow tt-flow--out" markerEnd="url(#tt-arrow-gray)" />
    </g>

    <g className="tt-s1" aria-hidden="true">
      <path d="M 112 146 H 150" className="tt-flow-hl" markerEnd="url(#tt-arrow-blue)" />
      <path d="M 274 146 H 314" className="tt-flow-hl" markerEnd="url(#tt-arrow-blue)" />
      <text x={131} y={132} textAnchor="middle" className="tt-note-s1">广覆盖数据</text>
      <text x={294} y={132} textAnchor="middle" className="tt-note-s1">SFT</text>
    </g>

    <g className="tt-s2" aria-hidden="true">
      <path d="M 361 184 C 361 240, 64 240, 64 186" className="tt-replay" markerEnd="url(#tt-arrow-orange)" />
      <text x={212} y={260} textAnchor="middle" className="tt-note-s2">难例 Replay 回放</text>
    </g>

    <g className="tt-s3" aria-hidden="true">
      {ROLLOUT_BRANCH_Y.map((y) => <path key={`out-${y}`} d={`M 272 146 C 288 146, 292 ${y}, 301 ${y}`} className="tt-branch tt-branch--out" />)}
      {ROLLOUT_BRANCH_Y.map((y) => <path key={`in-${y}`} d={`M 311 ${y} C 316 ${y}, 316 146, 320 146`} className="tt-branch" />)}
      {ROLLOUT_BRANCH_Y.map((y, index) => <circle key={`dot-${y}`} cx={306} cy={y} r={5} className={index === 0 ? 'tt-rollout-dot tt-rollout-dot--best' : 'tt-rollout-dot'} />)}
      <path d="M 306 90 C 298 46, 246 42, 220 58" className="tt-grad" markerEnd="url(#tt-arrow-green)" />
      <path d="M 336 62 A 26 26 0 0 1 388 62" className="tt-gauge-arc" />
      <path d="M 362 62 L 379 47" className="tt-gauge-needle" />
      <text x={362} y={30} textAnchor="middle" className="tt-note-s3">任务奖励</text>
      <text x={256} y={36} textAnchor="middle" className="tt-note-s3">梯度回流</text>
    </g>
  </svg>;
}

export function TrainingTimeline({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const restoredStage = restoredModuleState?.moduleId === 'grpo-lab'
    ? 2
    : stageFromState(restoredModuleState?.state);
  const timeline = usePlaybackTimeline({ durationMs: DURATION_MS, beatMs: STAGE_BEATS, initialMs: STAGE_BEATS[restoredStage] });
  const [task, setTask] = useState<TaskId>(() => taskFromState(restoredModuleState?.moduleId === 'grpo-lab' ? restoredModuleState.state : undefined));
  const previousBeat = useRef(timeline.activeBeat);
  const completed = useRef(false);
  const stage = Math.min(timeline.activeBeat, 2);

  useEffect(() => {
    if (!restoredModuleState) return;
    if (restoredModuleState.moduleId === 'grpo-lab') {
      timeline.pause();
      timeline.seek(2 / 3);
      setTask(taskFromState(restoredModuleState.state));
      previousBeat.current = 2;
      return;
    }
    if (restoredModuleState.moduleId === 'stage-training') {
      const nextStage = stageFromState(restoredModuleState.state);
      timeline.pause();
      timeline.seek(STAGE_BEATS[nextStage] / DURATION_MS);
      previousBeat.current = nextStage;
    }
  // The timeline methods are stable callbacks; restoration follows only the deep-link value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredModuleState]);

  useEffect(() => {
    const nextBeat = Math.min(timeline.activeBeat, 2);
    if (nextBeat === previousBeat.current) return;
    previousBeat.current = nextBeat;
    onInteract('stage-training');
    onStateChange({ moduleId: 'stage-training', state: `stage-${nextBeat + 1}` });
  }, [onInteract, onStateChange, timeline.activeBeat]);

  const rankedCandidates = useMemo(
    () => [...CANDIDATES].sort((left, right) => right.scores[task] - left.scores[task]),
    [task],
  );
  const activeTask = TASKS.find((candidate) => candidate.id === task) ?? TASKS[0];

  const seekStage = (nextStage: number) => {
    const safeStage = Math.max(0, Math.min(2, nextStage));
    timeline.pause();
    timeline.seek(STAGE_BEATS[safeStage] / DURATION_MS);
    previousBeat.current = safeStage;
    onInteract('stage-training');
    onStateChange({ moduleId: 'stage-training', state: `stage-${safeStage + 1}` });
  };

  const chooseTask = (nextTask: TaskId) => {
    const definition = TASKS.find((candidate) => candidate.id === nextTask) ?? TASKS[0];
    setTask(nextTask);
    onInteract('grpo-lab');
    onStateChange({ moduleId: 'grpo-lab', state: definition.state });
    if (stage >= 2 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  return <section className="training-timeline" aria-label="训练与 GRPO 播放器" data-stage={stage + 1}>
    <header className="training-timeline__header">
      <div><span className="source-tag teaching">自制教学示意</span><h3>让数据包沿训练路线进入 <Term id="grpo">GRPO</Term></h3></div>
      <p>24 秒内依次查看三阶段；只有到达第三阶段并查看任务排名才完成。</p>
    </header>

    <div className="training-timeline__cinema">
      <div className="training-timeline__model">
        <span className="training-timeline__model-chip">教学示意 · 随阶段演化</span>
        <ModelStageDiagram stage={stage} />
        <p className="training-timeline__model-caption">模型数据流随训练阶段演化：预训练广覆盖 → 难例 Replay 回环 → GRPO rollout 与奖励回流。</p>
      </div>
      <div className="training-timeline__route" aria-live="polite">
        <div className="training-timeline__stage-copy">
          <span>{stage === 0 ? <Term id="pre-training">Stage 1 · 预训练</Term> : stage === 1 ? <Term id="fine-tuning">Stage 2 · 微调</Term> : <Term id="reinforcement-learning">Stage 3 · 强化学习</Term>}</span>
          {stage === 0 ? <><strong>{PAPER_FACTS.data.stage1.split(' ')[0]}</strong><p>跨任务数据进入监督微调，先建立广覆盖能力。</p></> : null}
          {stage === 1 ? <><strong>{PAPER_FACTS.data.stage2.split(' ')[0]}</strong><b>其中 {PAPER_FACTS.data.expertHard.split(' ')[0]} Hard</b><p>筛选后的难例通过 <Term id="replay">Replay</Term> 回放返回训练回环。</p></> : null}
          {stage === 2 ? <><strong>{PAPER_FACTS.data.stage3.split(' ')[0]}</strong><p>高质量集合进入 GRPO，同一输入展开 <Term id="rollout">rollout 候选</Term>。</p></> : null}
        </div>
        <div className="training-timeline__packets" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
          {stage === 1 ? <span className="training-timeline__replay">↺</span> : null}
        </div>
        {stage === 2 ? <div className="training-timeline__rollouts" data-testid="rollout-field" aria-label={`${PAPER_FACTS.data.rollouts} 个 rollout`}>
          {Array.from({ length: PAPER_FACTS.data.rollouts }, (_, index) => <i key={index} data-testid="rollout-dot" style={{ '--rollout-index': index } as React.CSSProperties} />)}
        </div> : null}
      </div>
    </div>

    <div className="training-timeline__controls" role="group" aria-label="训练播放控制">
      <button type="button" onClick={timeline.toggle} disabled={timeline.reducedMotion} aria-label={timeline.playing ? '暂停训练过程' : '播放训练过程'}>{timeline.playing ? '暂停' : '播放'}</button>
      <button type="button" onClick={() => seekStage(stage - 1)} disabled={stage === 0}>上一阶段</button>
      <button type="button" onClick={() => seekStage(stage + 1)} disabled={stage === 2}>下一阶段</button>
      <button type="button" onClick={() => { timeline.replay(); previousBeat.current = 0; onInteract('stage-training'); onStateChange({ moduleId: 'stage-training', state: 'stage-1' }); }} disabled={timeline.reducedMotion}>重播</button>
      <span>{timeLabel(timeline.currentMs)} / 00:24</span>
    </div>
    {timeline.reducedMotion ? <p className="training-timeline__motion-note">已启用减少动态效果：自动播放关闭，请用阶段按钮或时间轴查看关键帧。</p> : null}
    <label className="training-timeline__slider">训练时间轴
      <input type="range" min="0" max="100" value={Math.round(timeline.progress * 100)} aria-label="训练时间轴" onChange={(event) => {
        const progress = Number(event.target.value) / 100;
        const nextStage = progress >= 2 / 3 ? 2 : progress >= 1 / 3 ? 1 : 0;
        timeline.pause();
        timeline.seek(progress);
        previousBeat.current = nextStage;
        onInteract('stage-training');
        onStateChange({ moduleId: 'stage-training', state: `stage-${nextStage + 1}` });
      }} />
    </label>

    {stage === 2 ? <div className="training-timeline__grpo">
      <div className="training-timeline__tasks" role="group" aria-label="选择 GRPO 任务指标">
        {TASKS.map((definition) => <button key={definition.id} type="button" data-active={task === definition.id} onClick={() => chooseTask(definition.id)}>{definition.label}</button>)}
      </div>
      <div className="training-timeline__ranking">
        <p>用 <Term id="task-reward">任务奖励</Term> 按 <Term id={activeTask.glossaryId}>{activeTask.metric}</Term> 重排；这些分数仅用于展示排序机制。</p>
        <ol data-testid="candidate-ranking">
          {rankedCandidates.map((candidate) => <li key={candidate.id} data-candidate-id={candidate.id}><span>{candidate.label}</span><b>{candidate.scores[task]}</b></li>)}
        </ol>
      </div>
    </div> : null}
    <p className="experience-boundary">事实边界：三阶段数据规模与奖励类型来自论文；左侧模型图为自制教学示意，数据包运动、候选内容与教学分数不是论文训练日志。</p>
  </section>;
}

export default TrainingTimeline;

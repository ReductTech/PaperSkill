import { useEffect, useMemo, useRef, useState } from 'react';
import { PaperMedia } from '../components/PaperMedia';
import { PAPER_FACTS } from '../data/facts';
import { usePlaybackTimeline } from '../hooks/usePlaybackTimeline';
import type { ChapterExperienceProps } from '../types';
import '../styles/experience-training.css';

const DURATION_MS = 24_000;
const STAGE_BEATS = [0, 8_000, 16_000, 24_000] as const;

type TaskId = 'text' | 'formula' | 'table' | 'layout';
type MetricState = 'metric-edit-distance' | 'metric-cdm' | 'metric-teds' | 'metric-iou';

const TASKS: readonly { id: TaskId; label: string; metric: string; state: MetricState }[] = [
  { id: 'text', label: '文本指标', metric: PAPER_FACTS.rewards[0], state: 'metric-edit-distance' },
  { id: 'formula', label: '公式指标', metric: PAPER_FACTS.rewards[1], state: 'metric-cdm' },
  { id: 'table', label: '表格指标', metric: PAPER_FACTS.rewards[2], state: 'metric-teds' },
  { id: 'layout', label: '版面指标', metric: PAPER_FACTS.rewards[3], state: 'metric-iou' },
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
      <div><span className="source-tag teaching">基于论文重绘</span><h3>让数据包沿训练路线进入 GRPO</h3></div>
      <p>24 秒内依次查看三阶段；只有到达 Stage 3 并查看任务排名才完成。</p>
    </header>

    <div className="training-timeline__cinema">
      <PaperMedia assetId="mineru-data-engine" cropId="trainingRoutes" label="论文原图节选" caption="Figure 2 的训练去向用于核对路线；下方数据包和候选排序是教学动画。" className="training-timeline__paper" />
      <div className="training-timeline__route" aria-live="polite">
        <div className="training-timeline__stage-copy">
          <span>Stage {stage + 1}</span>
          {stage === 0 ? <><strong>{PAPER_FACTS.data.stage1.split(' ')[0]}</strong><p>跨任务数据进入监督微调，先建立广覆盖能力。</p></> : null}
          {stage === 1 ? <><strong>{PAPER_FACTS.data.stage2.split(' ')[0]}</strong><b>其中 {PAPER_FACTS.data.expertHard.split(' ')[0]} Hard</b><p>筛选后的难例通过回放机制返回训练回环。</p></> : null}
          {stage === 2 ? <><strong>{PAPER_FACTS.data.stage3.split(' ')[0]}</strong><p>高质量集合进入 GRPO，同一输入展开多候选。</p></> : null}
        </div>
        <div className="training-timeline__packets" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
          {stage === 1 ? <span className="training-timeline__replay">Replay</span> : null}
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
        <p>按 <strong>{activeTask.metric}</strong> 重排；这些分数仅用于展示排序机制。</p>
        <ol data-testid="candidate-ranking">
          {rankedCandidates.map((candidate) => <li key={candidate.id} data-candidate-id={candidate.id}><span>{candidate.label}</span><b>{candidate.scores[task]}</b></li>)}
        </ol>
      </div>
    </div> : null}
    <p className="experience-boundary">事实边界：数据规模与奖励类型来自论文；数据包运动、候选内容和教学分数不是论文训练日志。OmniDocBench 页面只代表类似挑战属性。</p>
  </section>;
}

export default TrainingTimeline;

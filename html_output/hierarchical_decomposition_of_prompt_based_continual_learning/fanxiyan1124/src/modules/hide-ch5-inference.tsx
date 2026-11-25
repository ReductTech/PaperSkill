import React, { useEffect, useRef, useState } from 'react';
import {
  HideBadge,
  HideFormula,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSymbol,
} from './hide-kit';

type StationId = 'negative' | 'identity' | 'prompt' | 'instructed' | 'class';

type Station = {
  id: StationId;
  index: string;
  label: string;
  short: string;
  artifact: string;
  copy: string;
};

const STATIONS: Station[] = [
  {
    id: 'negative',
    index: '01',
    label: '未受提示表征',
    short: '负片',
    artifact: 'fθ(x)',
    copy: '测试图先经过冻结的 ViT，得到未受任何任务提示影响的表征。',
  },
  {
    id: 'identity',
    index: '02',
    label: '任务身份推断',
    short: '找任务行',
    artifact: 'ĥω → T3',
    copy: '任务头只在已见任务行上判别，给出本次应调用哪一条提示。',
  },
  {
    id: 'prompt',
    index: '03',
    label: '对应任务提示',
    short: '取提示',
    artifact: 'p3',
    copy: '从已冻结的提示柜取出所选提示，准备重新显影同一张测试负片。',
  },
  {
    id: 'instructed',
    index: '04',
    label: '受提示表征',
    short: '再显影',
    artifact: 'fθ(x; p3)',
    copy: '同一张图经过任务提示，得到任务内分类所需的受提示表征。',
  },
  {
    id: 'class',
    index: '05',
    label: '任务内类别输出',
    short: '查类别格',
    artifact: 'T3 · D',
    copy: '共享输出层只在所选任务行的类别范围内比较，给出最终类别。',
  },
];

const TASK_COUNT = 5;
const CLASS_COUNT = 4;
const HEAD_CHOICE = 2;
const CLASS_LETTERS = ['A', 'B', 'C', 'D'];
const taskProbabilities = [0.12, 0.19, 0.54, 0.09, 0.06];

function stationIndex(id: StationId) {
  return STATIONS.findIndex((station) => station.id === id);
}

export function HideCh5Inference() {
  const [station, setStation] = useState<StationId>('negative');
  const [selectedTask, setSelectedTask] = useState(HEAD_CHOICE);
  const timersRef = useRef<number[]>([]);

  const currentIndex = stationIndex(station);
  const currentStation = STATIONS[currentIndex];
  const selectedClassIndex = (selectedTask + 1) % CLASS_COUNT;
  const selectedClass = CLASS_LETTERS[selectedClassIndex];
  const isReview = selectedTask !== HEAD_CHOICE;
  const featureLayer = currentIndex >= 3 ? `fθ(x; p${selectedTask + 1})` : 'fθ(x)';
  const finalReadout = station === 'class' ? `T${selectedTask + 1} · ${selectedClass}` : '待输出';

  const clearRunTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const selectStation = (id: StationId) => {
    clearRunTimers();
    setStation(id);
  };

  const runInference = (taskIndex: number) => {
    clearRunTimers();
    setSelectedTask(taskIndex);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStation('class');
      return;
    }

    setStation('negative');
    const sequence: StationId[] = ['identity', 'prompt', 'instructed', 'class'];
    timersRef.current = sequence.map((id, index) => window.setTimeout(
      () => setStation(id),
      (index + 1) * 220,
    ));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable
        || target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT'
      )) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      setStation((current) => {
        const index = stationIndex(current);
        const next = event.key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : Math.min(STATIONS.length - 1, index + 1);
        return STATIONS[next].id;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <HideScene
      chapter="暗房架 05 · 自动选提示"
      cue={isReview ? '错行复核仍在所选任务内输出' : '先定位任务行，再检查类别格'}
      tone={isReview ? 'orange' : 'blue'}
    >
      <div className="hide-grid hide-ch5-layout">
        <HidePanel
          title="五站推理光路"
          meta={`${currentStation.index} / 05 · ← → 切换`}
          tone={isReview ? 'orange' : 'blue'}
          className="hide-ch5-stage-panel"
        >
          <div className="hide-ch5-station-tabs" role="group" aria-label="五个推理站点">
            {STATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === station ? 'hide-ch5-station-button hide-is-active' : 'hide-ch5-station-button'}
                aria-pressed={item.id === station}
                onClick={() => selectStation(item.id)}
              >
                <span>{item.index}</span>
                <strong>{item.short}</strong>
              </button>
            ))}
          </div>

          <div className="hide-ch5-progress" aria-hidden="true">
            <span style={{ width: `${(currentIndex + 1) / STATIONS.length * 100}%` }} />
          </div>

          <div className="hide-ch5-storyboard" role="group" aria-label="推理过程示意">
            {STATIONS.map((item, index) => (
              <article
                key={item.id}
                className={[
                  'hide-ch5-story-step',
                  index < currentIndex ? 'hide-is-complete' : '',
                  index === currentIndex ? 'hide-is-active' : '',
                  index > currentIndex ? 'hide-is-pending' : '',
                ].filter(Boolean).join(' ')}
              >
                <header>
                  <span>{item.index}</span>
                  <strong>{item.label}</strong>
                </header>
                <div className={`hide-ch5-artifact hide-ch5-artifact-${item.id}`} aria-hidden="true">
                  {item.id === 'negative' ? (
                    <div className="hide-ch5-negative">
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : null}
                  {item.id === 'identity' ? (
                    <div className="hide-ch5-task-frame">
                      <span>{`T${HEAD_CHOICE + 1}`}</span>
                      <small>任务头首选</small>
                    </div>
                  ) : null}
                  {item.id === 'prompt' ? (
                    <div className="hide-ch5-prompt-strip">
                      <span>{`p${selectedTask + 1}`}</span>
                      <small>冻结提示</small>
                    </div>
                  ) : null}
                  {item.id === 'instructed' ? (
                    <div className="hide-ch5-print">
                      <i />
                      <b>{`T${selectedTask + 1}`}</b>
                    </div>
                  ) : null}
                  {item.id === 'class' ? (
                    <div className="hide-ch5-class-frame">
                      <span>{selectedClass}</span>
                      <small>{`T${selectedTask + 1} 内类别`}</small>
                    </div>
                  ) : null}
                </div>
                <small>{item.artifact}</small>
              </article>
            ))}
          </div>

          <div className="hide-ch5-active-readout" aria-live="polite">
            <div className="hide-ch5-active-heading">
              <HideBadge tone={isReview ? 'orange' : 'blue'}>{`第 ${currentIndex + 1} 站`}</HideBadge>
              <strong>{currentStation.label}</strong>
            </div>
            <p>{currentStation.copy}</p>
            <HideFormula
              lead="任务自适应推理"
              note="两阶段使用同一张输入、同一冻结主干；第一阶段只为第二阶段选出任务提示。"
            >
              <HideSymbol symbol="i" meaning="由任务头预测出的任务身份，不是测试集提供的标签" />
              {' = '}
              <HideSymbol symbol="ĥω" meaning="任务身份推断头，只在已见任务上输出" />
              {'('}
              <HideSymbol symbol="fθ(x)" meaning="冻结 ViT 产生的未受提示表征" />
              {');  '}
              <HideSymbol symbol="y" meaning="最终任务内类别预测" />
              {' = '}
              <HideSymbol symbol="hψ" meaning="共享的输出层，在任务提示后比较类别" />
              {'('}
              <HideSymbol symbol="fθ(x; pᵢ)" meaning="使用选中任务提示得到的受提示表征" />
              {')'}
            </HideFormula>
          </div>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel title="任务头只看已见任务" meta="教学示意分布" tone="blue">
            <div className="hide-ch5-task-head">
              <div className="hide-ch5-task-head-note">
                <HideBadge tone="blue">{`首选 T${HEAD_CHOICE + 1}`}</HideBadge>
                <span>不是测试标签</span>
              </div>
              {taskProbabilities.map((probability, index) => (
                <div
                  key={index}
                  className={[
                    'hide-ch5-probability-row',
                    index === HEAD_CHOICE ? 'hide-is-head-choice' : '',
                    index === selectedTask ? 'hide-is-selected' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span>{`T${index + 1}`}</span>
                  <i>
                    <b style={{ width: `${probability * 100}%` }} />
                  </i>
                  <strong>{`${Math.round(probability * 100)}%`}</strong>
                </div>
              ))}
            </div>
            <div className="hide-ch5-route-readout">
              <HideMetric
                label="当前提示"
                value={`p${selectedTask + 1}`}
                tone={isReview ? 'orange' : 'blue'}
                note={isReview ? '手工错行复核' : '任务头首选'}
              />
              <HideMetric
                label="特征层"
                value={featureLayer}
                tone="green"
                note={currentIndex >= 3 ? '已经提示' : '未受提示'}
              />
              <HideMetric
                label="最终类别"
                value={finalReadout}
                tone={station === 'class' ? 'orange' : 'neutral'}
                note={`只在 T${selectedTask + 1} 的 ${CLASS_COUNT} 格`}
              />
            </div>
          </HidePanel>

          <HidePanel
            title="已见任务接触表"
            meta="点击任务行 · 五步联动"
            tone={isReview ? 'orange' : 'green'}
          >
            <div className="hide-ch5-contact-sheet" role="group" aria-label="点击已见任务行执行完整推理">
              {taskProbabilities.map((probability, row) => (
                <button
                  key={row}
                  type="button"
                  className={[
                    'hide-ch5-contact-row',
                    row === selectedTask ? 'hide-is-selected' : '',
                    row === HEAD_CHOICE ? 'hide-is-head-choice' : '',
                  ].filter(Boolean).join(' ')}
                  aria-pressed={row === selectedTask}
                  aria-label={`选择任务 ${row + 1} 并执行五步推理${row === HEAD_CHOICE ? '，与任务头首选一致' : '，作为错行复核'}`}
                  onClick={() => runInference(row)}
                >
                  <span>{`T${row + 1}`}</span>
                  <span className="hide-ch5-contact-cells" aria-hidden="true">
                    {CLASS_LETTERS.map((letter, column) => (
                      <i
                        key={letter}
                        className={row === selectedTask && column === selectedClassIndex ? 'hide-is-final' : ''}
                      >
                        {letter}
                      </i>
                    ))}
                  </span>
                  <b>{`${Math.round(probability * 100)}%`}</b>
                </button>
              ))}
            </div>
            <HideNote
              title={isReview ? '错行复核：提示与任务头首选不同' : '任务头选择不是分类标签'}
              tone={isReview ? 'orange' : 'blue'}
            >
              {isReview
                ? `任务头首选 T${HEAD_CHOICE + 1}，当前手工走 T${selectedTask + 1}。后续 hψ 仍只比较这一行的 ${CLASS_COUNT} 个类别，因此错误提示会把候选限制在错误任务内；流程不会读取真实任务身份。`
                : `任务头只在 ${TASK_COUNT} 个已见任务中输出 T${HEAD_CHOICE + 1}。这里没有测试编号，也没有用真实类别去纠正提示选择。`}
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}

import React, { useEffect, useState } from 'react';
import {
  HideBadge,
  HideContactGrid,
  HideFigure,
  HideFormula,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
  HideSymbol,
} from './hide-kit';

type Phase = 'identity' | 'within' | 'tap';

const phaseText: Record<Phase, { title: string; copy: string; figure: string; alt: string }> = {
  identity: {
    title: 'TII · 先找任务行',
    copy: '任务头只看未受提示表征，在已见任务之间给出任务身份分布。',
    figure: './images/fig3-tii.png',
    alt: 'Figure 3 task identity inference panel',
  },
  within: {
    title: 'WTP · 再找类别格',
    copy: '选中任务提示后，共享输出层在该任务的类别范围内给出任务内预测。',
    figure: './images/fig3-wtp.png',
    alt: 'Figure 3 within-task prediction panel',
  },
  tap: {
    title: 'TAP · 直接比较全类',
    copy: '把所有已见任务行里的类别格放进共享输出层，一次跨过显式两阶段链。',
    figure: './images/fig3-tap.png',
    alt: 'Figure 3 task-adaptive prediction panel',
  },
};

export function HideCh3Decomposition() {
  const [phase, setPhase] = useState<Phase>('identity');
  const [task, setTask] = useState(1);
  const [classIndex, setClassIndex] = useState(1);
  const data = phaseText[phase];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1') setPhase('identity');
      if (event.key === '2') setPhase('within');
      if (event.key === '3') setPhase('tap');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <HideScene chapter="暗房架 03 · 概率接触表" cue="先任务，后类别；或直接跨层" tone="blue">
      <div className="hide-grid hide-ch3-layout">
        <HidePanel title="接触表路径" meta={`任务 ${task + 1} · 类别 ${String.fromCharCode(65 + classIndex)}`} tone="blue" className="hide-ch3-grid-panel">
          <HideSegment
            value={phase}
            onChange={setPhase}
            label="切换层级预测阶段"
            options={[
              { value: 'identity', label: '1 TII' },
              { value: 'within', label: '2 WTP' },
              { value: 'tap', label: '3 TAP' },
            ]}
          />
          <div className="hide-ch3-worktable">
            <HideContactGrid
              tasks={5}
              classes={5}
              task={task}
              classIndex={classIndex}
              phase={phase}
              onTask={setTask}
              onClass={setClassIndex}
            />
            <div className={phase === 'tap' ? 'hide-ch3-shared-output is-live' : 'hide-ch3-shared-output'}>
              <span>{phase === 'tap' ? '全部已见类' : '共享输出层'}</span>
              <i>{phase === 'tap' ? 'TAP' : 'ψ'}</i>
              <b>{phase === 'tap' ? '直接比较' : '等待层级路径'}</b>
            </div>
          </div>
          <div className="hide-ch3-flow-strip">
            <div className="is-current">
              <span>阶段一</span>
              <strong>任务行</strong>
              <small>TII</small>
            </div>
            <i />
            <div className={phase === 'within' || phase === 'tap' ? 'is-current' : ''}>
              <span>阶段二</span>
              <strong>类别格</strong>
              <small>WTP</small>
            </div>
            <i />
            <div className={phase === 'tap' ? 'is-current is-emphasis' : ''}>
              <span>跨层</span>
              <strong>全类格</strong>
              <small>TAP</small>
            </div>
          </div>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel title={data.title} meta={`按键 1 / 2 / 3`} tone={phase === 'tap' ? 'orange' : 'blue'}>
            <div className="hide-ch3-explanation">
              <p>{data.copy}</p>
              <HideFormula
                lead="贝叶斯分解"
                note="类别增量学习中，不同任务的类别不重叠，因此可以先确定任务再确定类别。"
              >
                P(x ∈ X<sub>i,j</sub>) = P(x ∈ X<sub>i,j</sub> | x ∈ X<sub>i</sub>) · P(x ∈ X<sub>i</sub>)
                <br />
                <small style={{marginTop: '0.5rem', display: 'block'}}>
                  = <strong>WTP</strong> × <strong>TII</strong>
                </small>
              </HideFormula>
              <div className="hide-metric-pair">
                <HideMetric
                  label="WTP"
                  value="任务内预测"
                  tone="green"
                  note="已知任务 i，预测该任务内的类别 j"
                />
                <HideMetric
                  label="TII"
                  value="任务身份推断"
                  tone="blue"
                  note="从未受提示表征推断任务编号 i"
                />
              </div>
              {phase === 'tap' && (
                <HideNote title="为什么还要 TAP？" tone="orange">
                  WTP × TII 是显式的两阶段链，但：
                  <br />• TII 的准确率可能不够高（自监督预训练下 &lt;40%）
                  <br />• 单头输出层可以部分补偿（Figure 2e），但还不够
                  <br />• TAP 直接在全部已见类上预测，绕过显式任务选择
                  <br /><br />
                  <strong>Theorem 1</strong>: L ∈ [0, max{'{δ+ε, η}'}]
                  <br />δ=WTP误差, ε=TII误差, η=TAP误差
                  <br />最终误差取两条路径的较大者，因此<strong>两条路径都要优化</strong>。
                </HideNote>
              )}
            </div>
            <HideFigure
              src={data.figure}
              alt={data.alt}
              caption={`Fig.3 · ${phase === 'identity' ? 'TII' : phase === 'within' ? 'WTP' : 'TAP'} 原图面板`}
              tone={phase === 'tap' ? 'orange' : 'blue'}
              className="hide-ch3-source-figure"
            />
          </HidePanel>

          <HideNote title="定理给的是上界" tone="purple">
            {"L ∈ [0, max{"}
            <HideSymbol symbol="δ" meaning="任务身份误差项" />
            {" + "}
            <HideSymbol symbol="ε" meaning="任务内预测误差项" />
            {", "}
            <HideSymbol symbol="η" meaning="直接全类预测误差项" />
            {"}]；它不是实测误差，也不表示两个误差会相加。"}
          </HideNote>
        </div>
      </div>
    </HideScene>
  );
}

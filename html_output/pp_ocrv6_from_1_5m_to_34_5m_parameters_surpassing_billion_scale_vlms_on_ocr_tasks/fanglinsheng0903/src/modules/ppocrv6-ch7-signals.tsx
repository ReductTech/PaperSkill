import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Signal = 'loss' | 'deep' | 'nrtr' | 'distill';
type Phase = 'training' | 'inference';
type MatrixSignal = Signal;

const SIGNALS: Record<Signal, {
  label: string;
  source: string;
  target: string;
  role: string;
  deploy: string;
}> = {
  loss: {
    label: 'Dice + Focal',
    source: 'Ground-truth detection maps',
    target: 'shrink / binary pixel predictions',
    role: 'Dice 关注区域整体重叠，Focal 补充逐像素困难样本监督。threshold map 使用 L1。',
    deploy: 'Loss 不进入 inference graph；留下训练后的 Detection Model 参数。',
  },
  deep: {
    label: 'P2/P3/P4 深监督',
    source: 'Ground-truth DB supervision',
    target: 'P2 / P3 / P4 auxiliary predictions',
    role: '让 intermediate feature 获得更直接的梯度信号，并发挥 regularization 作用。λP2=0.4、λP3=0.3、λP4=0.2。',
    deploy: 'Aux DB Heads 全部移除；Main DB Head 保留。',
  },
  nrtr: {
    label: 'NRTR 辅助',
    source: 'Ground-truth text labels',
    target: 'Shared Recognition Feature → NRTR Head',
    role: 'NRTR 接受 ground-truth cross-entropy / label smoothing，作为 implicit language model 式的辅助 regularizer。',
    deploy: 'NRTR Head 被移除；CTC Head 和 LightSVTR shared representation 保留。',
  },
  distill: {
    label: 'Tiny 蒸馏',
    source: 'Vocabulary-matched frozen Medium Teacher',
    target: 'Tiny CTC per-timestep distribution',
    role: '通过 CTC logits/probability 的 KL 对齐补偿 Tiny 容量下降；Tiny 仍同时接受 GT CTC 与 GT NRTR。',
    deploy: 'Teacher、KL 与全部蒸馏箭头移除；Tiny 只保留 Reshape + FC → CTC 主路径。',
  },
};

function SegmentedButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={onClick}>{children}</button>;
}

function signalClass(signal: Signal, selected: Signal) {
  return `r8-signal-${signal} ${selected === signal ? 'selected' : ''}`;
}

function TrainingPath({ phase }: { phase: Phase }) {
  return (
    <div className={`r8-phase-banner r8-phase-${phase}`}>
      <span>{phase === 'training' ? 'Training' : 'Inference'}</span>
      <strong>{phase === 'training' ? '监督信号全部可见' : '只保留部署路径'}</strong>
    </div>
  );
}

export const Ch7Signals: React.FC<WidgetProps> = () => {
  const [signal, setSignal] = useState<Signal>('loss');
  const [phase, setPhase] = useState<Phase>('training');
  const [showVocabularyReason, setShowVocabularyReason] = useState(false);
  const selected = SIGNALS[signal];
  const training = phase === 'training';

  return (
    <div id="r8-map" className={`r8-map-lab r8-map-${signal} r8-phase-${phase}`}>
      <div className="r8-map-controls">
        <div className="r8-signal-tabs" role="group" aria-label="选择一种训练信号">
          {(Object.keys(SIGNALS) as Signal[]).map((key) => (
            <button type="button" key={key} className={signalClass(key, signal)} aria-pressed={signal === key} onClick={() => setSignal(key)}>{SIGNALS[key].label}</button>
          ))}
        </div>
        <div className="r8-phase-tabs" role="group" aria-label="切换训练图与推理图">
          <SegmentedButton selected={phase === 'training'} onClick={() => setPhase('training')}>Training</SegmentedButton>
          <SegmentedButton selected={phase === 'inference'} onClick={() => setPhase('inference')}>Inference</SegmentedButton>
        </div>
      </div>

      <p className="r8-map-instruction">选择一种训练信号，观察三件事：<strong>它从哪里来、监督谁、部署时是否还存在。</strong></p>

      <section className="r8-training-map" aria-label="PP-OCRv6 固定训练信号地图">
        <TrainingPath phase={phase} />

        <div className={`r8-lane r8-detection-lane ${signal === 'loss' || signal === 'deep' ? 'focus' : ''}`}>
          <header><span>Lane A · Detection{training ? ' Training' : ''}</span><strong>{training ? '像素目标 + 中间层监督' : 'Main DB Head 部署路径'}</strong></header>
          <div className="r8-forward-path">
            <span>Image</span><b>→</b><span>LCNetV4 Det Backbone</span><b>→</b><span>P1 / P2 / P3 / P4</span><b>→</b><strong>RepLKFPN</strong><b>→</b><span>Main DB Head</span><b>→</b><em>Detection Output</em>
          </div>
          <div className={`r8-aux-row ${training ? 'visible' : ''} ${signal === 'deep' ? 'focus' : ''}`} aria-hidden={!training}>
            <span>P2</span><b>→</b><strong>Aux DB Head</strong><small>λP2 = 0.4</small>
            <span>P3</span><b>→</b><strong>Aux DB Head</strong><small>λP3 = 0.3</small>
            <span>P4</span><b>→</b><strong>Aux DB Head</strong><small>λP4 = 0.2</small>
          </div>
          <div className={`r8-loss-node ${training && signal === 'loss' ? 'focus' : ''}`} aria-hidden={!training}>DB prediction maps → <strong>Dice + Focal</strong><small>shrink / binary</small></div>
        </div>

        <div className={`r8-lane r8-medium-lane ${signal === 'nrtr' ? 'focus' : ''}`}>
          <header><span>Lane B · Medium / Small Recognition{training ? ' Training' : ''}</span><strong>{training ? 'Shared Representation + 双训练 Head' : 'LightSVTR → CTC'}</strong></header>
          <div className="r8-forward-path">
            <span>Text Line</span><b>→</b><span>LCNetV4 Rec Backbone</span><b>→</b><strong>LightSVTR</strong><b>→</b><em>Shared Recognition Feature</em>
          </div>
          <div className="r8-rec-heads">
            <div className="r8-ctc-head"><span>Shared Feature</span><b>↓</b><strong>CTC Head</strong><small>online</small></div>
            <div className={`r8-nrtr-head ${training ? 'visible' : ''} ${signal === 'nrtr' ? 'focus' : ''}`} aria-hidden={!training}><span>Shared Feature</span><b>↓</b><strong>NRTR Head</strong><small>Train only · auxiliary regularizer</small></div>
          </div>
        </div>

        <div className={`r8-lane r8-tiny-lane ${signal === 'distill' ? 'focus' : ''}`}>
          <header><span>Lane C · Tiny Recognition{training ? ' Training' : ''}</span><strong>{training ? '更小容量 + 外部 Teacher' : 'Reshape + FC → CTC'}</strong></header>
          <div className="r8-tiny-student-path">
            <div className="r8-forward-path"><span>Text Line</span><b>→</b><span>Tiny Backbone</span><b>→</b><strong>Reshape + FC</strong><b>→</b><em>Shared Tiny Feature</em></div>
            <div className="r8-tiny-heads">
              <div><span>Shared Tiny Feature</span><b>↓</b><strong>Tiny CTC Head</strong><small>GT CTC</small></div>
              <div><span>Shared Tiny Feature</span><b>↓</b><strong>Tiny NRTR Head</strong><small>GT NRTR</small></div>
            </div>
          </div>
          <div className={`r8-teacher-path ${training ? 'visible' : ''} ${signal === 'distill' ? 'focus' : ''}`} aria-hidden={!training}>
            <div className="r8-teacher-card"><span>Dedicated Medium Teacher</span><strong>Vocabulary matched ✓</strong><small>Frozen during distillation</small></div>
            <b>CTC distribution → KL →</b>
            <div className="r8-student-distribution"><span>Tiny CTC distribution</span><code>D<sub>KL</sub>(p<sub>teacher,t</sub> ∥ p<sub>student,t</sub>)</code></div>
          </div>
        </div>
      </section>

      <aside className="r8-signal-card" aria-live="polite">
        <header><span>当前信号 · {selected.label}</span><strong>{training ? 'Training' : 'Inference'}</strong></header>
        <div className="r8-signal-facts">
          <div><small>信号来自哪里？</small><strong>{selected.source}</strong></div>
          <div><small>监督谁？</small><strong>{selected.target}</strong></div>
          <div><small>作用是什么？</small><p>{selected.role}</p></div>
          <div><small>推理时留下什么？</small><p>{training ? selected.deploy : selected.deploy}</p></div>
        </div>
        <div className={`r8-tiny-formula ${signal === 'distill' && training ? 'visible' : ''}`} aria-hidden={signal !== 'distill' || !training}>
          <code>L_tiny = L_GT<sup>CTC</sup> + L_GT<sup>NRTR</sup> + λ L_KL<sup>CTC</sup></code>
          <code>L_KL<sup>CTC</sup> = (1/T) Σ<sub>t</sub> D<sub>KL</sub>(p<sub>teacher,t</sub> ∥ p<sub>student,t</sub>)</code>
          <span>λ = 1.0 · Teacher 与 Tiny 使用相同 dictionary · NRTR 不参与 Teacher 蒸馏</span>
          <button type="button" aria-expanded={showVocabularyReason} onClick={() => setShowVocabularyReason((value) => !value)}>为什么必须同词典？</button>
          <p className={showVocabularyReason ? 'visible' : ''}>CTC 在每个时间步比较整套字符分布。师生只有使用同一字符集合与相同索引，KL 的每一维才指向同一个字符；论文没有额外的 vocabulary projection。</p>
        </div>
      </aside>

      <div className={`r8-map-conclusion ${training ? '' : 'visible'}`}>
        <strong>{training ? 'Training Map：四种帮助都在各自的位置提供约束。' : '训练信号改变的是“怎样学”，而不是永久增加“怎样跑”。'}</strong>
        <span>{training ? '它们形式不同：Loss、监督位置、辅助 Head、Teacher 信号。' : 'Loss、Aux Heads、NRTR、Teacher 与 KL 已移除；Detection 主路径、Medium / Small CTC、Tiny Reshape + FC → CTC 保留。'}</span>
      </div>
    </div>
  );
};

const MATRIX: Array<{ key: MatrixSignal; change: string; target: string; inference: string }> = [
  { key: 'loss', change: 'Loss formulation', target: 'Pixel predictions', inference: 'Loss 消失' },
  { key: 'deep', change: 'Supervision location', target: 'P2 / P3 / P4', inference: 'Aux Heads 移除' },
  { key: 'nrtr', change: 'Auxiliary head', target: 'Shared recognition representation', inference: 'NRTR Head 移除' },
  { key: 'distill', change: 'Supervision source', target: 'Tiny CTC distribution', inference: 'Teacher / KL 移除' },
];

export const TrainingSignalMatrix: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<MatrixSignal>('distill');
  return (
    <div id="r8-matrix" className={`r8-matrix-lab r8-matrix-${selected}`}>
      <p className="r8-matrix-lead">四种机制都属于训练帮助，但它们改变的对象并不相同。</p>
      <div className="r8-matrix" role="table" aria-label="四种训练帮助分类矩阵">
        <div className="r8-matrix-head" role="row"><span>机制</span><span>改变什么</span><span>主要对象</span><span>推理时</span></div>
        {MATRIX.map((row) => (
          <button type="button" key={row.key} className={`r8-matrix-row r8-signal-${row.key} ${selected === row.key ? 'selected' : ''}`} role="row" aria-pressed={selected === row.key} onClick={() => setSelected(row.key)}>
            <strong>{SIGNALS[row.key].label}</strong><span>{row.change}</span><span>{row.target}</span><em>{row.inference}</em>
          </button>
        ))}
      </div>
      <div className="r8-source-groups">
        <div><span>来自 Ground Truth</span><strong>Dice + Focal · Deep Supervision · NRTR</strong><small>直接约束真实标签对应的目标。</small></div>
        <div><span>来自 Teacher Model</span><strong>Tiny CTC KL</strong><small>Tiny 不是只听 Teacher；它同时继续接受 GT CTC 与 GT NRTR。</small></div>
      </div>
      <div className="feedback good" role="status">{SIGNALS[selected].label} 改变的是 {MATRIX.find((row) => row.key === selected)?.change}，不是一种统一的“辅助头”。</div>
    </div>
  );
};

function EvidenceCard({ title, rows, note }: { title: string; rows: Array<{ label: string; value: string; delta?: string }>; note: string }) {
  return (
    <article className="r8-evidence-card">
      <h5>{title}</h5>
      {rows.map((row) => <div className="r8-evidence-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong>{row.delta ? <em>{row.delta}</em> : null}</div>)}
      <p>{note}</p>
    </article>
  );
}

export const TrainingSignalEvidence: React.FC<WidgetProps> = () => {
  return (
    <div className="r8-evidence-lab">
      <section className="r8-evidence-section">
        <header><span>论文证据</span><strong>这些训练帮助有对应实验吗？</strong></header>
        <div className="r8-evidence-grid">
          <EvidenceCard title="Detection · Appendix Table 13" rows={[{ label: '+ Auxiliary Deep Supervision', value: '80.28', delta: '+0.53' }, { label: '+ Focal Loss', value: '81.43', delta: '+1.15' }]} note="PP-OCRv6_small detection · 1/5 training data · sequential ablation，每行建立在上一行之上。" />
          <EvidenceCard title="Recognition · Appendix Table 14" rows={[{ label: 'CTC only', value: '79.08' }, { label: 'CTC + NRTR-384', value: '80.24', delta: '+1.16' }]} note="Recognition decoder 小组；不要与 Tiny distillation 的数字跨组累计。" />
          <EvidenceCard title="Tiny · Appendix Table 14" rows={[{ label: 'Without distillation', value: '71.83' }, { label: '+ CTC KL distillation', value: '74.52', delta: '+2.69' }]} note="Tiny distillation 小组；Teacher 与 student 使用匹配字典。" />
        </div>
        <p className="r8-evidence-boundary">Table 13 与 Table 14 的实验分组、模型档位和训练条件不同；增益只能在各自协议内解释，不能跨表相加。</p>
      </section>

      <div className="r8-final-takeaway">
        <strong>轻量化不是“少训练”</strong><span>而是把额外学习能力留在训练阶段，再把简洁结构交给部署。</span>
      </div>

    </div>
  );
};

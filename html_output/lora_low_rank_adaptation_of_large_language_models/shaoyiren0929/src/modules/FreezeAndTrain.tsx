import React, { useMemo, useState } from 'react';

type PartName = 'W' | 'A' | 'B';
type PartMode = 'freeze' | 'train';

const copyByChoice: Record<string, { tone: 'danger' | 'warn' | 'success'; title: string; body: string }> = {
  FFF: { tone: 'warn', title: '引擎完全静止', body: 'W、A、B 都被冻结。基座被保护了，但适配支路也无法学习，这个新任务不会留下任何更新。' },
  FFT: { tone: 'warn', title: '只有 B 在发力', body: '你只训练 B，却把 A 固定住了。支路表达能力被一个未经共同学习的投影限制，无法完整执行低秩适配。' },
  FTF: { tone: 'warn', title: '只有 A 在发力', body: '你只训练 A，却把 B 固定住了。若 B 仍处于论文的零初始化，更新甚至无法传到主路径。' },
  FTT: { tone: 'success', title: '低秩支路开始学习', body: '正确：W 保留预训练知识，A 与 B 共同学习任务相关的更新。只有小支路需要梯度与优化器状态。' },
  TFF: { tone: 'danger', title: '又回到了改写主机', body: '你训练了巨大的 W，却冻结了适配支路。这等于绕开低秩方案，参数、梯度与优化器成本再次压向整台机器。' },
  TFT: { tone: 'danger', title: '主机和半条支路同时改写', body: 'W 与 B 都在训练，但 A 被固定。成本仍由巨大的 W 主导，同时低秩支路还不完整。' },
  TTF: { tone: 'danger', title: '主机和半条支路同时改写', body: 'W 与 A 都在训练，但 B 被固定。你既失去冻结基座的成本优势，也没有让 A、B 协同学习。' },
  TTT: { tone: 'danger', title: '所有阀门全开', body: 'W、A、B 全部训练会产生有效更新，但大模型的梯度与优化器状态仍全部存在，ACT 0 的成本危机并没有被解决。' },
};

function MechanicalPart({ name, mode, onChange }: { name: PartName; mode: PartMode; onChange: (mode: PartMode) => void }) {
  const descriptions: Record<PartName, { title: string; subtitle: string }> = {
    W: { title: 'W₀', subtitle: 'PRE-TRAINED WEIGHT' },
    A: { title: 'A', subtitle: 'DOWN PROJECTION' },
    B: { title: 'B', subtitle: 'UP PROJECTION' },
  };
  const part = descriptions[name];
  return (
    <div className={`ft-part ft-part-${name.toLowerCase()} is-${mode}`}>
      <div className="ft-part-cap"><i /><span>{part.subtitle}</span><i /></div>
      <div className="ft-part-machine" aria-hidden="true">
        <div className="ft-part-gear"><i /></div>
        <div className="ft-part-core">{part.title}</div>
        <div className="ft-part-pipe" />
      </div>
      <div className="ft-switchbox" role="group" aria-label={`${part.title} 的训练模式`}>
        <button className={mode === 'freeze' ? 'active' : ''} onClick={() => onChange('freeze')}>
          <span>❄</span> FREEZE
        </button>
        <button className={mode === 'train' ? 'active' : ''} onClick={() => onChange('train')}>
          <span>⚙</span> TRAIN
        </button>
      </div>
      <div className="ft-part-status"><i />{mode === 'freeze' ? 'LOCKED · NO GRADIENT' : 'ACTIVE · GRADIENT ON'}</div>
    </div>
  );
}

export function FreezeAndTrain({ onNext }: { onNext: () => void }) {
  const [modes, setModes] = useState<Record<PartName, PartMode>>({ W: 'freeze', A: 'freeze', B: 'freeze' });
  const [testedKey, setTestedKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const choiceKey = `${modes.W === 'freeze' ? 'F' : 'T'}${modes.A === 'freeze' ? 'F' : 'T'}${modes.B === 'freeze' ? 'F' : 'T'}`;
  const result = useMemo(() => testedKey ? copyByChoice[testedKey] : null, [testedKey]);

  const setPart = (name: PartName, mode: PartMode) => {
    setModes((current) => ({ ...current, [name]: mode }));
    setTestedKey(null);
    setRevealed(false);
  };

  const revealPaperChoice = () => {
    setModes({ W: 'freeze', A: 'train', B: 'train' });
    setTestedKey('FTT');
    setRevealed(true);
  };

  return (
    <section className={`freeze-stage ${revealed ? 'is-revealed' : ''}`} aria-labelledby="freeze-title">
      <header className="freeze-header">
        <div><span>ACT 4 · GRADIENT CONTROL WORKSHOP</span><h1 id="freeze-title">FREEZE &amp; TRAIN</h1></div>
        <div className="freeze-brief"><b>你的任务</b><span>哪些部件保留，哪些部件学习？</span></div>
      </header>

      <div className="freeze-lab">
        <div className="freeze-overhead" aria-hidden="true"><i /><i /><i /><b>GRADIENT SUPPLY</b></div>
        <div className="freeze-question">
          <span>先做出预测</span>
          <h2>为了保留预训练知识，同时只学习任务更新，你会打开哪些训练阀门？</h2>
          <p>每个组件只能选择 Freeze 或 Train。配置完成后，启动一次训练脉冲。</p>
        </div>

        <div className="ft-parts">
          {(['W', 'A', 'B'] as PartName[]).map((name) => (
            <MechanicalPart key={name} name={name} mode={modes[name]} onChange={(mode) => setPart(name, mode)} />
          ))}
          <div className="ft-energy-line" aria-hidden="true"><i /><i /><i /></div>
        </div>

        <div className="freeze-console">
          <div className="freeze-readout">
            <span>CURRENT CONFIGURATION</span>
            <strong>W₀ {modes.W.toUpperCase()} · A {modes.A.toUpperCase()} · B {modes.B.toUpperCase()}</strong>
          </div>
          <button className="freeze-test" onClick={() => { setTestedKey(choiceKey); setRevealed(false); }}>启动训练脉冲</button>
        </div>

        {result && !revealed ? (
          <div className={`freeze-result is-${result.tone}`} aria-live="polite">
            <div className="freeze-result-lamp" />
            <div><small>EXPERIMENT RESULT</small><h3>{result.title}</h3><p>{result.body}</p></div>
            <button onClick={revealPaperChoice}>查看论文的选择</button>
          </div>
        ) : null}

        {revealed ? (
          <div className="paper-choice" aria-live="polite">
            <div className="paper-choice-diagram" aria-hidden="true">
              <div className="choice-base"><span>FROZEN</span><b>W₀</b><small>保留通用知识</small></div>
              <div className="choice-plus">+</div>
              <div className="choice-branch"><span>TRAINABLE</span><div><b>B</b><em>×</em><b>A</b></div><small>学习任务更新 ΔW</small></div>
            </div>
            <div className="paper-choice-copy">
              <span>THE PAPER'S DESIGN</span>
              <h2>冻结巨大的 W₀，只训练小型 A 与 B</h2>
              <p>预训练主机不再被重写；任务知识被引导进低秩支路。于是梯度、优化器状态和任务 checkpoint 都只围绕 A、B 产生。</p>
              <div className="choice-ledger"><b>W₀</b><span>Freeze</span><b>A + B</b><span>Train</span></div>
            </div>
          </div>
        ) : null}

        {revealed ? (
          <div className="freeze-exit">
            <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}>
              <span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b>
            </button>
            {detailsOpen ? (
              <div className="freeze-details">
                <div><small>FORWARD PASS</small><strong>h = W₀x + (α / r)BAx</strong><p>W₀ 继续参与前向计算，但不接收参数更新；BA 是任务相关的可训练增量。</p></div>
                <div><small>GRADIENT FLOW</small><strong>∇W₀ = 0 · ∇A, ∇B ≠ 0</strong><p>Freeze 不等于删除：W₀ 仍提供能力，只是不为它保存梯度和优化器状态。</p></div>
                <div><small>INITIALIZATION</small><strong>B = 0 at start</strong><p>论文将一个低秩因子初始化为零，使训练开始时 BA = 0，模型最初行为与预训练模型一致。</p></div>
                <div><small>SCALING</small><strong>ΔW = (α / r)BA</strong><p>α / r 调节支路更新的尺度；r 是低秩瓶颈宽度，下一关将由你亲自选择。</p></div>
              </div>
            ) : null}
            <button className="freeze-next" onClick={onNext}><span>NEXT EXPERIMENT</span>进入 Rank Roulette →</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

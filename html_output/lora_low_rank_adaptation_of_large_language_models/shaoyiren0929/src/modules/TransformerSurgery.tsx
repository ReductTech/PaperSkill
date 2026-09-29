import React, { useMemo, useState } from 'react';

type Pipe = 'Q' | 'K' | 'V' | 'O';
type Phase = 'anatomy' | 'allocation' | 'result';

const pipeCopy: Record<Pipe, { question: string; detail: string }> = {
  Q: { question: '“我要找什么？”', detail: 'Query：当前 token 发出的检索问题，用来寻找与自己相关的信息。' },
  K: { question: '“我知道什么？”', detail: 'Key：每个 token 提供的匹配标签，帮助 Query 判断该关注谁。' },
  V: { question: '“我需要传递什么内容？”', detail: 'Value：匹配完成后真正被加权汇聚并传递的内容。' },
  O: { question: '“结果如何传递出去？”', detail: 'Output：把多个注意力头的结果重新投影回模型通道。' },
};

const resultCopy = (selection: Pipe[]) => {
  if (!selection.length) return { tone: 'neutral', title: '等待手术方案', body: '请先分配固定参数预算。' };
  const key = [...selection].sort().join('');
  if (key === 'QV') return { tone: 'best', title: '你的切口与论文强方案一致', body: '在论文的 GPT-3、WikiSQL/MNLI、固定 18M 参数预算实验中，把 LoRA 分配给 Wq 与 Wv 的整体结果很强。' };
  if (selection.length === 1) return { tone: 'warn', title: '预算集中，但位置过于单一', body: `你把更高 rank 全压在 W${selection[0].toLowerCase()}。论文实验显示，单个 projection 的更高 rank 未必胜过把预算分配到互补位置。` };
  return { tone: 'neutral', title: '分散预算是有价值的方向', body: `你选择了 W${selection[0].toLowerCase()} + W${selection[1].toLowerCase()}。在论文这组固定预算实验里，Wq + Wv 的整体表现更强；这是一项有条件的实验发现，不是所有模型的永久定律。` };
};

function Brain({ active, visited, selected, onPipe }: { active: Pipe | null; visited: Set<Pipe>; selected: Pipe[]; onPipe: (pipe: Pipe) => void }) {
  return (
    <div className="surgery-brain-wrap">
      <div className={`mechanical-brain ${active ? `active-${active.toLowerCase()}` : ''}`}>
        <div className="brain-hemisphere left"><i /><i /><i /></div>
        <div className="brain-hemisphere right"><i /><i /><i /></div>
        <div className="brain-core"><span>SELF</span><b>ATTENTION</b><i /></div>
        <div className="brain-bridge" aria-hidden="true" />
        {(['Q', 'K', 'V', 'O'] as Pipe[]).map((pipe, index) => (
          <button key={pipe} className={`brain-pipe pipe-${pipe.toLowerCase()} ${active === pipe ? 'is-active' : ''} ${visited.has(pipe) ? 'is-visited' : ''} ${selected.includes(pipe) ? 'is-selected' : ''}`} onClick={() => onPipe(pipe)} aria-label={`${pipe} 管道：${pipeCopy[pipe].question}`}>
            <span>{pipe}</span><b>W{pipe.toLowerCase()}</b><i style={{ '--pipe-index': index } as React.CSSProperties} />
          </button>
        ))}
        <div className="brain-base"><span>MECHANICAL COGNITION ENGINE</span></div>
      </div>
    </div>
  );
}

export function TransformerSurgery({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<Phase>('anatomy');
  const [activePipe, setActivePipe] = useState<Pipe | null>(null);
  const [visited, setVisited] = useState<Set<Pipe>>(() => new Set());
  const [selected, setSelected] = useState<Pipe[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const rank = selected.length === 1 ? 8 : selected.length === 2 ? 4 : 0;
  const usedBudget = selected.length ? 18 : 0;
  const outcome = useMemo(() => resultCopy(selected), [selected]);

  const inspectPipe = (pipe: Pipe) => {
    if (phase !== 'anatomy') return;
    setActivePipe(pipe);
    setVisited((current) => new Set([...current, pipe]));
  };

  const toggleProjection = (pipe: Pipe) => {
    setActivePipe(pipe);
    setSelected((current) => {
      if (current.includes(pipe)) return current.filter((item) => item !== pipe);
      if (current.length >= 2) return current;
      return [...current, pipe];
    });
  };

  return (
    <section className={`surgery-stage phase-${phase}`} aria-labelledby="surgery-title">
      <header className="surgery-header">
        <div><span>ACT 6 · ATTENTION OPERATING THEATRE</span><h1 id="surgery-title">TRANSFORMER SURGERY</h1></div>
        <div className="surgery-case"><small>PROCEDURE</small><b>{phase === 'anatomy' ? '01 · TRACE Q/K/V/O' : phase === 'allocation' ? '02 · ALLOCATE 18M' : '03 · REVIEW EVIDENCE'}</b></div>
      </header>

      {phase === 'anatomy' ? (
        <div className="anatomy-theatre">
          <Brain active={activePipe} visited={visited} selected={[]} onPipe={inspectPipe} />
          <aside className="anatomy-console">
            <span>MECHANICAL BRAIN · PIPE MAP</span>
            <h2>先理解四根管道，再决定在哪里动手术</h2>
            <p>点击 Q、K、V、O。每根管道承担不同的信息角色。</p>
            <div className="pipe-readout" aria-live="polite">
              {activePipe ? <><small>PIPE {activePipe} RESPONDS</small><strong>{pipeCopy[activePipe].question}</strong><p>{pipeCopy[activePipe].detail}</p></> : <><small>AWAITING PROBE</small><strong>选择一根管道</strong><p>机械脑正在等待你的诊断探针。</p></>}
            </div>
            <div className="pipe-progress">{(['Q', 'K', 'V', 'O'] as Pipe[]).map((pipe) => <i key={pipe} className={visited.has(pipe) ? 'done' : ''}>{pipe}</i>)}</div>
            <button className="open-budget" disabled={visited.size < 4} onClick={() => { setPhase('allocation'); setActivePipe(null); }}>
              {visited.size < 4 ? `还需检查 ${4 - visited.size} 根管道` : '领取 18M 参数预算'}
            </button>
          </aside>
        </div>
      ) : null}

      {phase === 'allocation' ? (
        <div className="allocation-theatre">
          <div className="allocation-brain"><Brain active={activePipe} visited={visited} selected={selected} onPipe={toggleProjection} /></div>
          <aside className="budget-console">
            <div className="budget-display"><small>FIXED SURGICAL BUDGET</small><strong>18M</strong><span>PARAMETERS</span></div>
            <h2>预算放在哪里？</h2>
            <p>点击 Wq、Wk、Wv、Wo。最多选择两个 projection。</p>
            <div className="projection-selector">
              {(['Q', 'K', 'V', 'O'] as Pipe[]).map((pipe) => <button key={pipe} className={selected.includes(pipe) ? 'active' : ''} onClick={() => toggleProjection(pipe)} disabled={!selected.includes(pipe) && selected.length >= 2}>W{pipe.toLowerCase()}<small>{selected.includes(pipe) ? `rank ${rank}` : 'unassigned'}</small></button>)}
            </div>
            <div className="budget-ledger">
              <div><span>SELECTED</span><b>{selected.length ? selected.map((item) => `W${item.toLowerCase()}`).join(' + ') : '—'}</b></div>
              <div><span>RANK / PROJECTION</span><b>{rank || '—'}</b></div>
              <div><span>BUDGET USED</span><b>{usedBudget}M / 18M</b></div>
            </div>
            <div className="budget-bar"><i style={{ width: `${selected.length ? 100 : 0}%` }} /></div>
            <div className="scheme-examples"><span><b>方案 A</b>单个 projection · rank 8</span><span><b>方案 B</b>两个 projections · 各 rank 4</span></div>
            <button className="place-surgery-bet" disabled={!selected.length} onClick={() => setPhase('result')}>锁定手术方案 · 揭示实验</button>
          </aside>
        </div>
      ) : null}

      {phase === 'result' ? (
        <div className="surgery-result">
          <div className="result-brain"><Brain active={null} visited={visited} selected={selected} onPipe={() => undefined} /></div>
          <aside className={`result-console is-${outcome.tone}`}>
            <span>PAPER RESULT · FIXED 18M BUDGET</span>
            <h2>{outcome.title}</h2>
            <p>{outcome.body}</p>
            <div className="paper-allocation">
              <div><small>CONCENTRATED</small><b>Wq</b><em>rank 8</em><i><span style={{ width: '82%' }} /></i></div>
              <div className="is-winner"><small>DISTRIBUTED</small><b>Wq + Wv</b><em>rank 4 + 4</em><i><span style={{ width: '96%' }} /></i></div>
            </div>
            <div className="surgery-insight"><small>IMPORTANT RECOGNITION</small><strong>Where you adapt matters as much as how much you adapt.</strong><p>同样的预算，位置选择可以与 rank 大小同样重要。</p></div>
          </aside>
        </div>
      ) : null}

      {phase === 'result' ? (
        <div className="surgery-exit">
          <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}><span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b></button>
          {detailsOpen ? <div className="surgery-details"><div><small>EXPERIMENT CONDITION</small><strong>Fixed 18M trainable parameters</strong><p>比较来自论文 GPT-3、WikiSQL/MNLI 的固定预算消融；结论应保留这一实验条件。</p></div><div><small>ATTENTION PROJECTIONS</small><strong>Wq · Wk · Wv · Wo</strong><p>它们分别作用于 Query、Key、Value 和注意力输出投影，而不是 Transformer 的四个独立层。</p></div><div><small>DESIGN LESSON</small><strong>Allocation beats blind scaling</strong><p>更高 rank 全压在单个 projection 上未必更好；位置与容量需要联合选择。</p></div></div> : null}
          <div className="surgery-transition"><small>NEXT</small><p>手术位置已经确定。接下来进入竞技场，在参数量与任务表现上正面对比不同适配方法。</p><button onClick={onNext}>进入 Performance Arena →</button></div>
        </div>
      ) : null}
    </section>
  );
}

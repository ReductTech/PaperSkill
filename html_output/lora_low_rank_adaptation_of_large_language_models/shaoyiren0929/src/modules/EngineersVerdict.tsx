import React, { useMemo, useState } from 'react';

type VerdictCard = {
  id: string;
  text: string;
  mark: string;
};

const correctChain: VerdictCard[] = [
  { id: 'model', text: '超大型预训练模型', mark: 'W₀' },
  { id: 'cost', text: '全量微调成本高昂', mark: '175B' },
  { id: 'delta', text: '任务相关的变化是 ΔW', mark: 'ΔW' },
  { id: 'rank', text: 'ΔW 可能具有很低的内在秩', mark: 'rank' },
  { id: 'factor', text: 'ΔW = BA', mark: 'B×A' },
  { id: 'freeze', text: '冻结 W₀，只训练 A/B', mark: 'freeze' },
  { id: 'small-r', text: '很小的 r 可能已经足够', mark: 'r ≪ d' },
  { id: 'matrix', text: '将 LoRA 应用于关键 Transformer 矩阵', mark: 'Wq / Wv' },
  { id: 'performance', text: '以极少可训练参数获得有竞争力的任务表现', mark: 'results' },
  { id: 'merge', text: '将 BA 合并进 W', mark: 'W₀ + BA' },
  { id: 'switch', text: '实现高效存储与任务切换', mark: 'ready' },
];

const shuffledIds = ['cost', 'model', 'delta', 'factor', 'rank', 'small-r', 'freeze', 'performance', 'matrix', 'switch', 'merge'];

const answers = [
  { id: 'A', text: '大模型不需要任何任务适配。' },
  { id: 'B', text: '每个下游任务都需要一个新的完整模型。' },
  { id: 'C', text: '任务相关的权重更新可能位于比完整参数空间低得多的秩空间中，因此可以冻结预训练权重，只学习紧凑更新。' },
  { id: 'D', text: 'Rank 1 永远是最优选择。' },
];

export function EngineersVerdict() {
  const [order, setOrder] = useState<string[]>(shuffledIds);
  const [dragged, setDragged] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  const cardsById = useMemo(() => new Map(correctChain.map((card) => [card.id, card])), []);
  const aligned = order.filter((id, index) => correctChain[index].id === id).length;
  const chainComplete = aligned === correctChain.length;

  const moveCard = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setSubmitted(false);
    setOrder((current) => {
      const next = [...current];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      return next;
    });
  };

  const nudge = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setSubmitted(false);
    setOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submitBlueprint = () => {
    setSubmitted(true);
    if (!chainComplete) {
      setSelectedAnswer(null);
      setApproved(false);
    }
  };

  const chooseAnswer = (id: string) => {
    setSelectedAnswer(id);
    setApproved(id === 'C');
  };

  return (
    <section className={`engineers-verdict ${approved ? 'is-approved' : ''}`} aria-labelledby="verdict-title">
      <header className="verdict-room-header">
        <div><small>FACTORY SUMMIT · FINAL REVIEW</small><h1 id="verdict-title">ENGINEER'S VERDICT</h1></div>
        <div className="review-seal"><span>CHIEF</span><b>ENGINEER</b></div>
      </header>

      <div className="verdict-intro">
        <small>THE LAST INSPECTION</small>
        <h2>把证据接成一张完整的工程蓝图</h2>
        <p>你的 Engineer Notebook 已经摊在桌上。拖动知识卡，重建从微调危机到任务切换的完整推理。</p>
      </div>

      <section className="blueprint-table" aria-labelledby="blueprint-title">
        <header><div><small>ROYAL MODEL WORKS · DRAWING № 10</small><h2 id="blueprint-title">LOW-RANK ADAPTATION LOGIC</h2></div><span>{submitted ? `${aligned} / 11 JOINTS ALIGNED` : 'ARRANGE THE NOTEBOOK CARDS'}</span></header>
        <div className="blueprint-grid" />
        <div className="logic-chain">
          {order.map((id, index) => {
            const card = cardsById.get(id)!;
            const alignedHere = submitted && correctChain[index].id === id;
            const misaligned = submitted && !alignedHere;
            return (
              <React.Fragment key={id}>
                <article
                  className={`notebook-card ${dragged === id ? 'is-dragging' : ''} ${alignedHere ? 'is-aligned' : ''} ${misaligned ? 'is-misaligned' : ''}`}
                  onPointerEnter={() => {
                    if (dragged && dragged !== id) moveCard(dragged, id);
                  }}
                  onPointerUp={() => setDragged(null)}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(event) => { event.preventDefault(); moveCard(event.dataTransfer.getData('text/plain') || dragged || '', id); setDragged(null); }}
                >
                  <div
                    className="notebook-grip"
                    aria-hidden="true"
                    draggable
                    onPointerDown={() => setDragged(id)}
                    onDragStart={(event) => { setDragged(id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); }}
                    onDragEnd={() => setDragged(null)}
                  ><i /><i /><i /></div>
                  <span className="notebook-index">{String(index + 1).padStart(2, '0')}</span>
                  <div><small>ENGINEER NOTEBOOK</small><strong>{card.text}</strong></div>
                  <em>{card.mark}</em>
                  <div className="card-nudges">
                    <button onClick={() => nudge(index, -1)} disabled={index === 0} aria-label={`将 ${card.text} 上移`}>↑</button>
                    <button onClick={() => nudge(index, 1)} disabled={index === order.length - 1} aria-label={`将 ${card.text} 下移`}>↓</button>
                  </div>
                </article>
                {index < order.length - 1 ? <div className={`chain-joint ${submitted && correctChain[index].id === id && correctChain[index + 1].id === order[index + 1] ? 'is-live' : ''}`}><i /><span>↓</span><i /></div> : null}
              </React.Fragment>
            );
          })}
        </div>
        <footer className="blueprint-submit">
          <div>
            {!submitted ? <><b>审查提示</b><span>从“我们面对什么”开始，以“我们最终获得什么”结束。</span></> : chainComplete ? <><b>LOGIC CIRCUIT COMPLETE</b><span>每一处因果接头都已闭合。可以进行最终裁决。</span></> : <><b>BLUEPRINT NEEDS REVISION</b><span>已有 {aligned} 张卡位于正确位置；继续检查因果先后。</span></>}
          </div>
          <button onClick={submitBlueprint}>{chainComplete && submitted ? '蓝图已签核 ✓' : '提交工程蓝图'}</button>
        </footer>
      </section>

      {submitted && chainComplete ? (
        <section className="central-question" aria-labelledby="central-question-title">
          <header><small>FINAL ORAL EXAMINATION</small><h2 id="central-question-title">LoRA 的核心思想是什么？</h2></header>
          <div className="verdict-answers">
            {answers.map((answer) => (
              <button key={answer.id} className={`${selectedAnswer === answer.id ? 'is-selected' : ''} ${approved && answer.id === 'C' ? 'is-approved' : ''}`} onClick={() => chooseAnswer(answer.id)}>
                <b>{answer.id}</b><span>{answer.text}</span>
              </button>
            ))}
          </div>
          {selectedAnswer && !approved ? <div className="answer-feedback"><b>DESIGN NOT APPROVED</b><span>{selectedAnswer === 'A' ? '下游任务仍然需要适配；问题在于是否必须改动全部权重。' : selectedAnswer === 'B' ? '这正是全量微调带来的存储危机，而不是 LoRA 的核心。' : '论文只说明很小的 rank 在部分设置中足够，并没有证明 rank 1 永远最佳。'}</span></div> : null}
        </section>
      ) : null}

      {approved ? (
        <section className="factory-restart" aria-live="polite">
          <div className="approval-banner"><i /><div><small>ROYAL ENGINEERING BOARD</small><h2>ENGINE DESIGN APPROVED</h2></div><i /></div>
          <div className="restart-machine">
            <div className="restart-tower"><i /><i /><i /><b>W₀</b></div>
            <div className="restart-gears"><i /><i /><i /><i /></div>
            <div className="restart-status">
              <div><small>BOILER PRESSURE</small><b>SAFE</b><span><i /></span></div>
              <div><small>STORAGE LOAD</small><b>LOW</b><span><i /></span></div>
              <div><small>TASK SWITCHING</small><b>READY</b><span><i /></span></div>
            </div>
          </div>
          <div className="final-manifesto">
            <small>THE FACTORY IS RUNNING AGAIN</small>
            <h2>DON'T REBUILD THE WHOLE ENGINE.</h2>
            <h3>LEARN THE SMALL CHANGE THAT MATTERS.</h3>
            <p>LoRA — Low-Rank Adaptation of Large Language Models</p>
          </div>
          <details className="research-notes">
            <summary><span>RESEARCH NOTES</span><b>仍然打开的问题</b><i>＋</i></summary>
            <div>
              <p>这份设计获得批准，不代表它是万能解决方案。论文给出了强有力的工程方法与实验依据，但仍留下边界：</p>
              <ul>
                <li>LoRA 应该放在哪些矩阵上，仍大量依赖经验。</li>
                <li>很小的 rank 并非适合所有任务。</li>
                <li>论文没有系统探索所有 MLP、LayerNorm 等结构。</li>
                <li>LoRA 与其他参数高效微调方法的组合仍有研究空间。</li>
              </ul>
              <p className="research-boundary">工程师的结论：在论文测试的条件下，LoRA 是高效而有竞争力的选择；新的模型、任务与部署约束仍需要重新验证。</p>
            </div>
          </details>
        </section>
      ) : null}
    </section>
  );
}

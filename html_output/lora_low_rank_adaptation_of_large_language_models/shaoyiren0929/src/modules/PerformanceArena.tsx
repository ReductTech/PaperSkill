import React, { useMemo, useState } from 'react';

type Method = 'full' | 'adapter' | 'prefix' | 'lora';
type Dataset = 'WikiSQL' | 'MNLI' | 'SAMSum';

const methods: Array<{ id: Method; name: string; subtitle: string; params: number; paramsLabel: string }> = [
  { id: 'full', name: 'FULL FT', subtitle: 'THE COLOSSUS', params: 175255.8, paramsLabel: '175,255.8M' },
  { id: 'adapter', name: 'ADAPTER', subtitle: 'THE INSERTION ENGINE', params: 40.1, paramsLabel: '40.1M' },
  { id: 'prefix', name: 'PREFIX', subtitle: 'THE TOKEN LOCOMOTIVE', params: 20.2, paramsLabel: '20.2M' },
  { id: 'lora', name: 'LoRA', subtitle: 'THE LOW-RANK CHALLENGER', params: 4.7, paramsLabel: '4.7M / 37.7M' },
];

const datasets: Record<Dataset, { metric: string; scores: Record<Method, number>; note: string }> = {
  WikiSQL: { metric: 'Accuracy ↑', scores: { full: 73.8, adapter: 73.2, prefix: 70.1, lora: 74.0 }, note: 'LoRA 37.7M configuration' },
  MNLI: { metric: 'Matched Accuracy ↑', scores: { full: 89.5, adapter: 91.5, prefix: 89.5, lora: 91.7 }, note: 'LoRA 4.7M configuration' },
  SAMSum: { metric: 'ROUGE-L ↑', scores: { full: 44.5, adapter: 45.1, prefix: 43.5, lora: 45.9 }, note: 'LoRA 4.7M configuration' },
};

const reactions: Record<Method, { title: string; body: string }> = {
  full: { title: '你押了整台巨兽', body: 'Full FT 是强大的质量基线，但它为每个任务训练并保存整套权重。看看参数赛道是否会吞没它。' },
  adapter: { title: '你押了插入式改装', body: 'Adapter 在部分任务上很有竞争力；代价是额外模块会加深推理路径。' },
  prefix: { title: '你押了前缀列车', body: 'Prefix 用较少参数改写输入侧，但会占用可用序列长度；结果还要由任务检验。' },
  lora: { title: '你押了低秩挑战者', body: 'LoRA 的参数票很轻。现在真正的问题是：它能否在任务得分上守住基线？' },
};

function ArenaMachine({ method, selected, locked, onSelect }: { method: typeof methods[number]; selected: boolean; locked: boolean; onSelect: () => void }) {
  return (
    <button className={`arena-machine machine-${method.id} ${selected ? 'is-selected' : ''}`} onClick={onSelect} disabled={locked} aria-pressed={selected}>
      <span className="machine-banner">{method.subtitle}</span>
      <div className="machine-body" aria-hidden="true">
        <i className="machine-gear gear-a" /><i className="machine-gear gear-b" />
        <b>{method.id === 'full' ? '175B' : method.id === 'adapter' ? '+│+' : method.id === 'prefix' ? 'P₁ P₂' : 'B × A'}</b>
        <em />
      </div>
      <strong>{method.name}</strong>
      <small>{locked ? 'BET LOCKED' : selected ? 'YOUR BET' : 'PLACE BET'}</small>
    </button>
  );
}

export function PerformanceArena({ onNext }: { onNext: () => void }) {
  const [bet, setBet] = useState<Method | null>(null);
  const [lockedBet, setLockedBet] = useState<Method | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [dataset, setDataset] = useState<Dataset>('WikiSQL');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const scoreRange = useMemo(() => {
    const values = Object.values(datasets[dataset].scores);
    return { min: Math.min(...values) - 1.5, max: Math.max(...values) + 0.5 };
  }, [dataset]);

  const scoreHeight = (value: number) => `${Math.max(12, ((value - scoreRange.min) / (scoreRange.max - scoreRange.min)) * 100)}%`;
  const paramWidth = (value: number) => `${12 + (Math.log10(value) / Math.log10(175255.8)) * 88}%`;

  return (
    <section className={`performance-arena ${revealed ? 'is-revealed' : ''}`} aria-labelledby="arena-title">
      <header className="arena-header">
        <div><span>ACT 7 · PARAMETER PERFORMANCE COLOSSEUM</span><h1 id="arena-title">PERFORMANCE ARENA</h1></div>
        <div className="arena-scoreboard"><small>ARENA STATUS</small><b>{!lockedBet ? 'BETTING OPEN' : !revealed ? 'BET LOCKED' : 'EVIDENCE REVEALED'}</b></div>
      </header>

      {!lockedBet ? (
        <div className="arena-betting">
          <div className="arena-question"><small>ENGINEER'S WAGER</small><h2>谁能用最少的可训练参数，守住最好的任务表现？</h2><p>先下注。所有参数量和分数在锁定前保持封印。</p></div>
          <div className="machine-lineup">{methods.map((method) => <ArenaMachine key={method.id} method={method} selected={bet === method.id} locked={false} onSelect={() => setBet(method.id)} />)}</div>
          <div className="betting-dais"><span>{bet ? `YOUR BET · ${methods.find((m) => m.id === bet)?.name}` : 'SELECT ONE MACHINE'}</span><button disabled={!bet} onClick={() => setLockedBet(bet)}>锁定下注 · 关闭闸门</button></div>
        </div>
      ) : null}

      {lockedBet && !revealed ? (
        <div className="arena-reveal-gate">
          <div className="gate-machine"><i /><i /><b>?</b><span>SEALED EVIDENCE</span></div>
          <div className="gate-copy"><small>BET RECORDED · {methods.find((m) => m.id === lockedBet)?.name}</small><h2>{reactions[lockedBet].title}</h2><p>{reactions[lockedBet].body}</p><button onClick={() => setRevealed(true)}>拉下揭晓杠杆</button></div>
        </div>
      ) : null}

      {revealed && lockedBet ? (
        <>
          <div className="arena-result-intro"><span>PAPER TABLE 4 · GPT-3</span><h2>两条赛道，两种胜负</h2><p>先看训练了多少，再看任务做得怎样。参数少不自动等于分数高；两份证据必须一起读。</p></div>
          <div className="arena-charts">
            <section className="parameter-race" aria-labelledby="parameter-title">
              <header><div><small>TRACK A</small><h3 id="parameter-title">Trainable Parameters</h3></div><em>LOG SCALE</em></header>
              <div className="horizontal-bars">
                {methods.map((method) => <div className={`horizontal-bar bar-${method.id}`} key={method.id}><span>{method.name}</span><i><b style={{ width: paramWidth(method.params) }} /></i><strong>{method.paramsLabel}</strong></div>)}
              </div>
              <p className="chart-caption">对数刻度只为让小选手可见；标签给出论文表格中的真实参数量。LoRA 报告两种配置。</p>
            </section>

            <section className="task-race" aria-labelledby="task-title">
              <header><div><small>TRACK B</small><h3 id="task-title">Task Performance</h3></div><em>ZOOMED AXIS</em></header>
              <div className="dataset-switcher">{(Object.keys(datasets) as Dataset[]).map((name) => <button key={name} className={dataset === name ? 'active' : ''} onClick={() => setDataset(name)}>{name}</button>)}</div>
              <div className="vertical-bars" aria-label={`${dataset} ${datasets[dataset].metric}`}>
                {methods.map((method) => <div className={`vertical-bar bar-${method.id}`} key={method.id}><strong>{datasets[dataset].scores[method.id].toFixed(1)}</strong><i style={{ height: scoreHeight(datasets[dataset].scores[method.id]) }} /><span>{method.name}</span></div>)}
              </div>
              <div className="metric-readout"><b>{dataset}</b><span>{datasets[dataset].metric}</span><small>{datasets[dataset].note}</small></div>
              <p className="chart-caption">此图使用局部放大、非零起点，只用于看清小差异；请以柱顶精确数值为准。</p>
            </section>
          </div>

          <div className="arena-verdict">
            <div className="verdict-medal"><span>BEST</span><b>TRADE-OFF</b><i>IN THIS ARENA</i></div>
            <div><small>EXPERIMENTAL CONCLUSION</small><h2>少量可训练参数，也能守住强任务表现。</h2><p><strong>在论文测试的这些任务和设置里，LoRA 以极少可训练参数达到竞争性、甚至部分指标更好的结果。</strong> 结论仅适用于当前模型、任务、预算和指标；条件改变后需要重新实验。</p><div className="bet-outcome">你押了 <b>{methods.find((m) => m.id === lockedBet)?.name}</b> · {lockedBet === 'lora' ? '这次你找到了最强参数—性能折中。' : '你的选手有自己的优势，但这组证据把参数—性能折中判给了 LoRA。'}</div></div>
          </div>

          <div className="arena-exit">
            <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}><span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b></button>
            {detailsOpen ? <div className="arena-details">
              <div><small>ROWS USED</small><strong>Comparable GPT-3 settings</strong><p>Full FT 175,255.8M；AdapterH 40.1M；PrefixLayer 20.2M；LoRA 4.7M / 37.7M。不同 LoRA 配置的最佳分数随任务变化。</p></div>
              <div><small>METRICS</small><strong>Do not compare across tasks</strong><p>WikiSQL 与 MNLI 使用 accuracy；SAMSum 展示 ROUGE-L。三个任务的数值尺度不同，只能在同一任务内横向比较方法。</p></div>
              <div><small>VARIABILITY</small><strong>Small gaps need caution</strong><p>论文报告波动约为 WikiSQL ±0.5、MNLI-m ±0.1，SAMSum ROUGE-L ±0.1；微小差距不应被讲成普适胜利。</p></div>
            </div> : null}
            <div className="arena-transition"><small>NEXT · DEPLOYMENT</small><p>挑战者已证明自己可以轻装上阵。下一步，把旁路更新真正合回主机器。</p><button onClick={onNext}>进入 Merge Room →</button></div>
          </div>
        </>
      ) : null}
    </section>
  );
}

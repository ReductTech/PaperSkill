import React, { useMemo, useState } from 'react';

type Bet = 'A' | 'B' | 'C';

const ranks = [1, 2, 4, 8, 64];
const scores = [73.4, 73.3, 73.7, 73.8, 73.5];
const betCopy: Record<Bet, { label: string; short: string; verdict: string }> = {
  A: { label: '必须越大越好', short: 'HIGH RANK', verdict: '你的直觉把“容量”当成了“保证”。更大的 r 能提供更多自由度，但论文实验没有显示性能会随 r 单调上升。' },
  B: { label: '小 rank 可能已经够', short: 'LOW MAY WORK', verdict: '这与论文在部分任务上的观察最接近：极低 rank 已能取得有竞争力的结果，说明有效更新方向可能很少。' },
  C: { label: '看任务', short: 'TASK DEPENDENT', verdict: '这是最稳健的工程判断。论文的低-rank 结果很强，但作者也明确提醒：不能据此推断所有任务都只需要同一个极低 r。' },
};

function Curve({ index }: { index: number }) {
  const coords = scores.map((score, i) => ({ x: 42 + i * 104, y: 194 - (score - 73.2) * 180 }));
  const active = coords.slice(0, index + 1);
  const path = active.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  return (
    <svg className="roulette-chart" viewBox="0 0 500 240" role="img" aria-label={`WikiSQL 上 Wq 加 Wv 设置在 rank ${ranks[index]} 时的验证准确率`}>
      <defs><linearGradient id="rankArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6a35d" stopOpacity=".5"/><stop offset="1" stopColor="#d6a35d" stopOpacity="0"/></linearGradient></defs>
      {[40, 80, 120, 160, 200].map((y) => <line key={y} x1="38" y1={y} x2="468" y2={y} className="chart-grid" />)}
      <line x1="38" y1="18" x2="38" y2="204" className="chart-axis"/><line x1="38" y1="204" x2="468" y2="204" className="chart-axis"/>
      {active.length > 1 ? <path d={`${path} L ${active[active.length - 1].x} 204 L ${active[0].x} 204 Z`} fill="url(#rankArea)" /> : null}
      {path ? <path d={path} className="chart-path" /> : null}
      {coords.map((point, i) => (
        <g key={ranks[i]} className={i <= index ? 'is-seen' : ''}>
          <circle cx={point.x} cy={i <= index ? point.y : 204} r={i === index ? 8 : 5} className="chart-dot" />
          <text x={point.x} y="224" textAnchor="middle">r={ranks[i]}</text>
        </g>
      ))}
      <text x="12" y="116" transform="rotate(-90 12 116)" textAnchor="middle" className="chart-label">WIKISQL ACCURACY (%)</text>
    </svg>
  );
}

export function RankRoulette({ onNext }: { onNext: () => void }) {
  const [draftBet, setDraftBet] = useState<Bet | null>(null);
  const [lockedBet, setLockedBet] = useState<Bet | null>(null);
  const [rankIndex, setRankIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const currentScore = scores[rankIndex];
  const parameterRatio = useMemo(() => ranks[rankIndex] / 64, [rankIndex]);

  const lockBet = () => {
    if (!draftBet) return;
    setLockedBet(draftBet);
    setRankIndex(0);
    setFurthest(0);
    setRevealed(false);
  };

  const moveRank = (value: number) => {
    setRankIndex(value);
    setFurthest((old) => Math.max(old, value));
  };

  return (
    <section className={`roulette-stage ${lockedBet ? 'is-table-open' : ''} ${revealed ? 'is-revealed' : ''}`} aria-labelledby="roulette-title">
      <div className="casino-lamps" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <i key={i} />)}</div>
      <header className="roulette-header">
        <div><span>ACT 5 · THE INTRINSIC RANK CASINO</span><h1 id="roulette-title">RANK ROULETTE</h1></div>
        <div className="roulette-bank"><small>EXPERIMENT CREDIT</small><b>£ 64</b></div>
      </header>

      {!lockedBet ? (
        <div className="betting-hall">
          <div className="casino-sign"><span>PLACE YOUR BET</span><h2>“Rank 越大越好吗？”</h2><p>先凭直觉下注。筹码落下后，实验开始前不会揭晓答案。</p></div>
          <div className="betting-table">
            <div className="roulette-wheel" aria-hidden="true"><i /><b>r</b><span>1 · 2 · 4 · 8 · 64</span></div>
            <div className="bet-options">
              {(['A', 'B', 'C'] as Bet[]).map((bet) => (
                <button key={bet} className={draftBet === bet ? 'is-selected' : ''} onClick={() => setDraftBet(bet)}>
                  <b>{bet}</b><span>{betCopy[bet].label}</span><small>{betCopy[bet].short}</small>
                  {draftBet === bet ? <i className="bet-chip">£</i> : null}
                </button>
              ))}
            </div>
            <button className="lock-bet" disabled={!draftBet} onClick={lockBet}>锁定下注 · 开启实验</button>
          </div>
        </div>
      ) : (
        <div className="rank-table">
          <div className="rank-chart-panel">
            <div className="chart-curtain"><span>PAPER TABLE 6 · GPT-3 · WIKISQL VALIDATION</span><b>你的下注：{lockedBet} · {betCopy[lockedBet].label}</b></div>
            <Curve index={rankIndex} />
            <div className="rank-observation" aria-live="polite">
              <small>OBSERVATION</small>
              <strong>{rankIndex <= 1 ? '很小的 r 已迅速获得大部分表现' : rankIndex <= 3 ? '继续增加容量，收益开始变得有限' : '参数继续增长，但性能没有同步直线上升'}</strong>
            </div>
          </div>

          <aside className="rank-croupier">
            <span>RANK CONTROL</span>
            <div className="rank-dial"><i style={{ transform: `rotate(${-125 + rankIndex * 50}deg)` }} /><b>{ranks[rankIndex]}</b><small>RANK</small></div>
            <label htmlFor="rank-roulette-slider"><span>拖动筹码，提高 rank</span><b>r = {ranks[rankIndex]}</b></label>
            <input id="rank-roulette-slider" type="range" min="0" max={ranks.length - 1} step="1" value={rankIndex} onChange={(event) => moveRank(Number(event.target.value))} />
            <div className="rank-ticks">{ranks.map((rank) => <span key={rank}>{rank}</span>)}</div>
            <div className="rank-meters">
              <div><label>WIKISQL ACCURACY (%)</label><b>{currentScore.toFixed(1)}</b><i><em style={{ width: `${currentScore}%` }} /></i></div>
              <div><label>TRAINABLE CAPACITY</label><b>{Math.round(parameterRatio * 100)}%</b><i><em style={{ width: `${parameterRatio * 100}%` }} /></i></div>
            </div>
            {!revealed ? (
              <button className="reveal-rank" disabled={furthest < ranks.length - 1} onClick={() => setRevealed(true)}>
                {furthest < ranks.length - 1 ? `还需探索 ${ranks.length - 1 - furthest} 个刻度` : '揭晓赌局结果'}
              </button>
            ) : null}
          </aside>
        </div>
      )}

      {revealed && lockedBet ? (
        <div className="rank-verdict" aria-live="polite">
          <div className="verdict-stamp"><small>YOUR BET</small><b>{lockedBet}</b><span>{betCopy[lockedBet].label}</span></div>
          <div className="verdict-copy">
            <span>THE PAPER'S EVIDENCE</span>
            <h2>极低 rank 在部分任务上已经足够</h2>
            <p>{betCopy[lockedBet].verdict}</p>
            <div className="verdict-core"><b>支持的判断</b><span>适配更新可能具有很低的 intrinsic rank。</span><b>必须保留的边界</b><span>这不意味着所有模型、所有任务都只需要极低 rank。</span></div>
          </div>
        </div>
      ) : null}

      {revealed ? (
        <div className="roulette-transition">
          <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}><span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b></button>
          {detailsOpen ? (
            <div className="roulette-details">
              <div><small>PARAMETER GROWTH</small><strong>r(d + k)</strong><p>对于 d×k 的权重，A 与 B 的可训练参数量随 r 线性增长。</p></div>
              <div><small>SCALING</small><strong>ΔW = (α / r)BA</strong><p>α/r 用来控制不同 rank 下支路更新的尺度，rank 增大并不自动保证性能更好。</p></div>
              <div><small>EVIDENCE BOUNDARY</small><strong>Low rank ≠ universal rank</strong><p>论文报告部分 GPT-3 任务中 r=1 仍具竞争力，同时明确指出不同任务可能需要不同 rank。</p></div>
            </div>
          ) : null}
          <div className="transition-summary"><small>TRANSITION</small><p>现在你知道支路可以很窄。下一步要决定：这些低秩支路究竟接入 Transformer 的哪些矩阵？</p><button onClick={onNext}>进入 Transformer Surgery →</button></div>
        </div>
      ) : null}
    </section>
  );
}

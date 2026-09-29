import React, { useEffect, useRef, useState } from 'react';

type Phase = 'ready' | 'merging' | 'merged';

export function MergeRoom({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const merge = () => {
    if (phase !== 'ready') return;
    setPhase('merging');
    timer.current = window.setTimeout(() => setPhase('merged'), 1750);
  };

  const reset = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setDetailsOpen(false);
    setPhase('ready');
  };

  return (
    <section className={`merge-room phase-${phase}`} aria-labelledby="merge-title">
      <header className="merge-header">
        <div><span>ACT 8 · DEPLOYMENT FOUNDRY</span><h1 id="merge-title">MERGE ROOM</h1></div>
        <div className="merge-status"><small>FOUNDRY STATUS</small><b>{phase === 'ready' ? 'TWO PATHS DETECTED' : phase === 'merging' ? 'ALLOYING WEIGHTS…' : 'SINGLE INFERENCE PATH'}</b></div>
      </header>

      <div className="foundry-question">
        <small>DEPLOYMENT PROBLEM</small>
        <h2>训练时需要旁路，推理时也必须带着它吗？</h2>
        <p>主权重和任务更新拥有相同形状。亲手把它们铸成一块。</p>
      </div>

      <div className="foundry-floor">
        <div className="weight-vat vat-base">
          <div className="vat-label"><small>PRETRAINED WEIGHT</small><strong>W₀</strong><span>冻结的主机器</span></div>
          <div className="vat-window"><i /><i /><i /><b>BASE</b></div>
          <div className="vat-pipe"><i /></div>
        </div>

        <div className="central-furnace" aria-live="polite">
          <div className="furnace-stack"><i /><i /><i /></div>
          <div className="furnace-crown">WEIGHT FOUNDRY · SHAPE MATCH</div>
          <div className="furnace-mouth">
            <span className="furnace-flame" /><span className="furnace-flame" /><span className="furnace-flame" />
            <div className="formula-plate">
              {phase === 'ready' ? <><small>AWAITING MERGE</small><strong>W₀&nbsp;&nbsp; + &nbsp;&nbsp;BA</strong></> : null}
              {phase === 'merging' ? <><small>RECASTING DEPLOYMENT WEIGHT</small><strong>W = W₀ + BA</strong></> : null}
              {phase === 'merged' ? <><small>MERGED WEIGHT READY</small><strong>W = W₀ + BA</strong><em>ONE MATRIX · ONE PATH</em></> : null}
            </div>
            <div className="furnace-gear gear-one" /><div className="furnace-gear gear-two" />
          </div>
          <div className="furnace-base"><b>{phase === 'merged' ? 'W' : '∑'}</b><span>{phase === 'merged' ? 'DEPLOYMENT WEIGHT' : 'MERGE CHAMBER'}</span></div>
        </div>

        <div className="weight-vat vat-lora">
          <div className="vat-label"><small>LEARNED UPDATE</small><strong>BA</strong><span>LoRA 低秩旁路</span></div>
          <div className="vat-window"><i /><i /><i /><b>B × A</b></div>
          <div className="vat-pipe"><i /></div>
        </div>

        <div className="merge-control">
          <div className={`merge-lever ${phase !== 'ready' ? 'is-down' : ''}`}><i /><b /></div>
          <button onClick={merge} disabled={phase !== 'ready'}>{phase === 'ready' ? '拉下 MERGE' : phase === 'merging' ? '正在合并…' : 'MERGED ✓'}</button>
        </div>
      </div>

      {phase === 'ready' ? <div className="merge-prompt"><i />训练图中仍有两条路径：W₀x 与 BAx。拉下控制杆，决定部署时保留几条。</div> : null}
      {phase === 'merging' ? <div className="merge-progress"><span>BA UPDATE ENTERING MAIN WEIGHT</span><i><b /></i><strong>旁路机械正在被主机器吸收</strong></div> : null}

      {phase === 'merged' ? (
        <div className="merged-evidence">
          <section className="inference-gauges" aria-label="合并后的推理开销仪表">
            <div className="zero-gauge"><small>EXTRA INFERENCE MODULES</small><div><i /><b>0</b></div><span>没有额外层留在推理图中</span></div>
            <div className="zero-gauge"><small>ADDITIONAL LATENCY</small><div><i /><b>0</b></div><span>由 LoRA 分支引入的额外延迟</span></div>
          </section>

          <section className="merge-conclusion">
            <div className="single-path-diagram"><span>x</span><i /><b>W</b><i /><span>h</span></div>
            <div><small>ENGINEERING PAYOFF</small><h2>旁路消失，能力留在主权重里。</h2><p>因为 <strong>BA 与 W₀ 形状一致</strong>，部署时可以直接合并权重，所以不会像 Adapter 一样增加额外推理层。合并后仍执行原来的一次矩阵乘法。</p></div>
          </section>

          <div className="merge-exit">
            <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}><span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b></button>
            {detailsOpen ? <div className="merge-details">
              <div><small>TRAINING GRAPH</small><strong>h = W₀x + (α/r)BAx</strong><p>训练时冻结 W₀，只更新 A、B。缩放 α/r 控制低秩更新的幅度。</p></div>
              <div><small>DEPLOYMENT MERGE</small><strong>W = W₀ + (α/r)BA</strong><p>W₀ 与 BA 的形状相同，因此可先逐元素相加，再用合并后的 W 完成普通线性投影。</p></div>
              <div><small>BOUNDARY</small><strong>Zero LoRA-branch overhead</strong><p>“0”指合并后 LoRA 分支不增加模块或推理路径；它不表示模型本身没有推理耗时。切换任务时需替换或重新合并对应更新。</p></div>
            </div> : null}
            <div className="merge-actions"><button className="merge-again" onClick={reset}>重新演示合并</button><div><small>NEXT · INTRINSIC RANK</small><p>合并解决了部署时的额外路径，却还没回答更深的问题：为什么如此低的 rank 竟然能装下有效的任务更新？</p></div><button className="merge-next" onClick={onNext}>下潜至 Low-Rank Abyss →</button></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

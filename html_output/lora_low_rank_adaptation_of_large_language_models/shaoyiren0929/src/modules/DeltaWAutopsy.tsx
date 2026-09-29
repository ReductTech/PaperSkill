import React, { useMemo, useState } from 'react';

type MatrixKind = 'base' | 'delta' | 'fine';

function WeightMatrix({ kind, strength, locked = false }: { kind: MatrixKind; strength: number; locked?: boolean }) {
  const changed = useMemo(() => new Set([2, 6, 9, 14, 17, 20, 25, 28, 31, 37, 42, 46]), []);
  return (
    <div className={`autopsy-matrix is-${kind} ${locked ? 'is-locked' : ''}`}>
      {Array.from({ length: 48 }).map((_, index) => {
        const isChanged = changed.has(index);
        const intensity = Math.max(0, Math.min(1, strength / 100));
        const style = kind === 'delta'
          ? { opacity: isChanged ? .12 + intensity * .88 : .05 }
          : kind === 'fine' && isChanged
            ? { background: `rgba(210, 130, 55, ${.2 + intensity * .8})`, boxShadow: intensity > .55 ? `0 0 ${intensity * 12}px rgba(230,145,65,.75)` : 'none' }
            : undefined;
        return <i key={index} className={isChanged ? 'is-change' : ''} style={style} />;
      })}
      {locked ? <span className="autopsy-lock" aria-label="W0 已锁定">⌾<b>LOCKED</b></span> : null}
    </div>
  );
}

export function DeltaWAutopsy({ onNext }: { onNext: () => void }) {
  const [strength, setStrength] = useState(0);
  const [locked, setLocked] = useState(false);
  const [final, setFinal] = useState(false);
  const revealed = strength >= 75;

  if (final) {
    return (
      <section className="autopsy-stage autopsy-finale" aria-label="ACT 2 结论">
        <div className="final-specimens">
          <div className="final-base">
            <span>PRE-TRAINED BASE</span>
            <WeightMatrix kind="base" strength={100} locked />
            <b>W₀</b>
          </div>
          <div className="final-plus">+</div>
          <div className="final-delta">
            <span>TASK UPDATE</span>
            <WeightMatrix kind="delta" strength={100} />
            <b>ΔW</b>
          </div>
        </div>
        <h1>What if ΔW is much simpler than it looks?</h1>
        <div className="story-transition story-transition-dark">
          <small>下一步·检查 ΔW 的内部结构</small>
          <p>我们已把“适配模型”改写成“学习任务更新 ΔW”。现在问题从“要改多少权重”变成了“ΔW 真的需要那么多个独立方向吗？”</p>
          <button onClick={onNext}>进入 Low-Rank Lab →</button>
        </div>
      </section>
    );
  }

  return (
    <section className={`autopsy-stage ${locked ? 'is-locked' : ''}`} aria-labelledby="autopsy-title">
      <div className="autopsy-tiles" aria-hidden="true" />
      <header className="autopsy-header">
        <div>
          <span>ACT 2 · WEIGHT CHANGE EXAMINATION</span>
          <h1 id="autopsy-title">ΔW AUTOPSY</h1>
        </div>
        <div className="autopsy-case">CASE FILE 175B–FT · TASK-SPECIFIC CHANGE</div>
      </header>

      <div className="autopsy-question">
        <span>解剖记录</span>
        <p>微调后的权重与预训练权重之间，究竟多出了什么？</p>
      </div>

      <div className="autopsy-table">
        <div className="autopsy-lamp lamp-left" aria-hidden="true" /><div className="autopsy-lamp lamp-right" aria-hidden="true" />
        <article className="specimen base-specimen">
          <div className="specimen-tag"><small>ORIGINAL SPECIMEN</small><strong>预训练权重</strong></div>
          <WeightMatrix kind="base" strength={strength} locked={locked} />
          <div className="specimen-symbol">W₀</div>
          <p>训练开始前已经存在的模型知识</p>
        </article>

        <div className="autopsy-operator">+</div>

        <article className={`specimen delta-specimen ${strength > 0 ? 'is-visible' : ''}`}>
          <div className="specimen-tag"><small>EXTRACTED CHANGE</small><strong>任务相关更新</strong></div>
          <WeightMatrix kind="delta" strength={strength} />
          <div className="specimen-symbol">ΔW</div>
          <p>{strength === 0 ? '等待显影' : `已显影 ${strength}%`}</p>
        </article>

        <div className="autopsy-operator">=</div>

        <article className="specimen fine-specimen">
          <div className="specimen-tag"><small>FINE-TUNED SPECIMEN</small><strong>微调后权重</strong></div>
          <WeightMatrix kind="fine" strength={strength} />
          <div className="specimen-symbol">W′</div>
          <p>基座权重与任务更新叠加后的结果</p>
        </article>
      </div>

      <div className="autopsy-console">
        <div className="autopsy-equation" aria-label="W prime equals W zero plus delta W">
          <b>W′</b><span>=</span><b>W₀</b><span>+</span><b className={strength > 0 ? 'delta-lit' : ''}>ΔW</b>
        </div>
        <label htmlFor="delta-strength">
          <span>显影任务更新</span>
          <strong>{strength}%</strong>
        </label>
        <input
          id="delta-strength"
          type="range"
          min="0"
          max="100"
          step="1"
          value={strength}
          disabled={locked}
          onChange={(event) => setStrength(Number(event.target.value))}
          aria-label="显影任务更新 ΔW"
        />
        <div className="autopsy-track-labels"><span>只有 W₀</span><span>完整 W′</span></div>
        <div className="autopsy-observation" aria-live="polite">
          {strength === 0 ? (
            <p>拖动滑杆，对比原始权重与微调后的权重。</p>
          ) : !revealed ? (
            <p>W′ 正在改变，但这些变化始终叠加在原来的 W₀ 上。</p>
          ) : !locked ? (
            <><strong>观察成立：W′ = W₀ + ΔW</strong><p>微调不是凭空制造一个模型，而是在预训练权重基础上产生任务相关更新。</p></>
          ) : (
            <><strong>W₀ 已锁定。</strong><p>基座保持不动；现在只有任务相关的 ΔW 在发光。</p></>
          )}
        </div>
        <div className="autopsy-actions">
          {!locked ? (
            <button onClick={() => setLocked(true)} disabled={!revealed}>LOCK W₀</button>
          ) : (
            <button onClick={() => setFinal(true)}>提出下一问题</button>
          )}
        </div>
      </div>
    </section>
  );
}

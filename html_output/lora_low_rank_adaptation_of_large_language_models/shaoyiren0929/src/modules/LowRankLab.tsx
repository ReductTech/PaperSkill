import React, { useState } from 'react';

type LabPhase = 'wall' | 'music' | 'scanner';

function GearField({ count, active = true, tiny = false }: { count: number; active?: boolean; tiny?: boolean }) {
  return (
    <div className={`rank-gear-field ${tiny ? 'is-tiny' : ''} ${active ? 'is-active' : ''}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => <i key={index} style={{ '--gear-index': index } as React.CSSProperties}><b /></i>)}
    </div>
  );
}

export function LowRankLab({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<LabPhase>('wall');
  const [crank, setCrank] = useState(0);
  const [opened, setOpened] = useState(false);
  const [scan, setScan] = useState(0);
  const detected = scan >= 92;

  return (
    <section className={`ranklab-stage phase-${phase} ${detected ? 'is-detected' : ''}`} aria-labelledby="ranklab-title">
      <header className="ranklab-header">
        <div>
          <span>ACT 3 · STRUCTURE ANALYSIS CHAMBER</span>
          <h1 id="ranklab-title">LOW-RANK LAB</h1>
        </div>
        <div className="ranklab-phase">{phase === 'wall' ? '01 / MATRIX WALL' : phase === 'music' ? '02 / MECHANICAL MUSIC BOX' : '03 / INTRINSIC DIMENSION SCANNER'}</div>
      </header>

      {phase === 'wall' ? (
        <div className="matrix-wall-scene">
          <div className="matrix-wall">
            <div className="matrix-wall-corners" aria-hidden="true" />
            <GearField count={96} />
            <div className="matrix-wall-name">ΔW</div>
            <div className="matrix-wall-dim">4096 × 4096</div>
          </div>
          <aside className="parameter-counter">
            <span>FULL MATRIX CAPACITY</span>
            <strong>16,777,216</strong>
            <b>PARAMETERS</b>
            <p>如果每个位置都独立变化，我们必须记录整面墙。</p>
            <button onClick={() => setPhase('music')}>检查“独立”究竟意味着什么</button>
          </aside>
        </div>
      ) : null}

      {phase === 'music' ? (
        <div className="musicbox-scene">
          <div className={`mechanical-musicbox ${opened ? 'is-opened' : ''}`}>
            <div className="musicbox-lid"><span>MECHANICAL MUSIC BOX</span><b>100 MOVING GEARS</b></div>
            <div className="musicbox-window">
              <div className="musicbox-shafts" aria-hidden="true"><i /><i /><i /></div>
              <GearField count={100} active={crank > 0} tiny />
              {opened ? <div className="shaft-labels"><span>DRIVE 01</span><span>DRIVE 02</span><span>DRIVE 03</span></div> : null}
            </div>
            <button
              className="musicbox-crank"
              style={{ transform: `rotate(${crank * 120}deg)` }}
              onClick={() => setCrank((value) => Math.min(3, value + 1))}
              disabled={crank >= 3}
              aria-label="转动音乐盒摇柄"
            ><i /><b /></button>
          </div>
          <div className="musicbox-console">
            {!opened ? (
              <>
                <span>实验：让 100 个齿轮全部运动</span>
                <p>转动摇柄三次，先观察表面上有多少个动作。</p>
                <div className="crank-progress"><i style={{ width: `${(crank / 3) * 100}%` }} /></div>
                <strong>{crank} / 3</strong>
                <button onClick={() => setOpened(true)} disabled={crank < 3}>打开传动背板</button>
              </>
            ) : (
              <div className="rank-reveal">
                <p>Many visible motions.</p>
                <p>Few independent driving directions.</p>
                <strong>100 个可见齿轮，其实只由 3 根主轴驱动。</strong>
                <div className="rank-definition"><b>RANK</b><span>一个巨大系统真正独立的信息方向数量。</span></div>
                <button onClick={() => setPhase('scanner')}>用这个直觉扫描 ΔW</button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {phase === 'scanner' ? (
        <div className="scanner-scene">
          <div className="scanner-wall">
            <GearField count={96} active />
            <div className="scanner-wall-symbol">ΔW</div>
            <div className="scanner-beam" style={{ left: `calc(${scan}% - 18px)` }}><i /></div>
            {detected ? <div className="hidden-drives" aria-hidden="true"><i /><i /><i /></div> : null}
          </div>
          <aside className="scanner-console">
            <span>INTRINSIC DIMENSION SCANNER</span>
            <div className="scanner-scope"><i style={{ width: `${scan}%` }} /><b style={{ left: `${scan}%` }} /></div>
            <label htmlFor="rank-scan"><span>SCAN PROGRESS</span><strong>{scan}%</strong></label>
            <input id="rank-scan" type="range" min="0" max="100" value={scan} onChange={(event) => setScan(Number(event.target.value))} aria-label="扫描 ΔW 的 intrinsic dimension" />
            <div className={`scanner-status ${detected ? 'is-positive' : ''}`} aria-live="polite">
              {detected ? (
                <><small>STRUCTURE MATCH</small><strong>Possible low-rank structure detected.</strong></>
              ) : (
                <><small>ANALYSIS RUNNING</small><strong>沿矩阵墙移动扫描器</strong></>
              )}
            </div>
            {detected ? (
              <div className="scanner-conclusion">
                <p>墙上看似有 16,777,216 个可变位置，但有效变化可能由少数独立方向驱动。</p>
                <strong>论文的核心假设：适配过程中的权重更新可能具有低 intrinsic rank，因此不必用完整矩阵表示。</strong>
                <div className="story-transition">
                  <small>下一步·把假设变成可训练结构</small>
                  <p>扫描器只告诉我们“可能存在低秩结构”。接下来要真正搭出 A、B 与 W₀，决定谁训练、谁冻结。</p>
                  <button onClick={onNext}>进入 Freeze &amp; Train →</button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}

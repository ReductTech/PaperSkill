import React, { useEffect, useMemo, useRef, useState } from 'react';

type Stage = 'elevator' | 'descending' | 'subspace' | 'engine';

const rays8 = [8, 37, 82, 126, 174, 221, 274, 326];
const rays64 = [5, 18, 31, 47, 62, 78, 94, 109, 126, 142, 158, 176, 194, 211, 229, 247, 265, 283, 302, 321, 340, 354];

function DirectionDisk({ rank, rays, overlap }: { rank: 8 | 64; rays: number[]; overlap: number }) {
  const rotation = rank === 8 ? -18 + overlap * .18 : 22 - overlap * .22;
  const shift = overlap * .56 * (rank === 8 ? 1 : -1);
  return (
    <div className={`rank-disk rank-${rank}`} style={{ transform: `translateX(${shift}px) rotate(${rotation}deg)` }} aria-label={`rank ${rank} singular directions`}>
      <div className="disk-rings"><i /><i /><i /></div>
      {rays.map((angle, index) => {
        const major = index === 1 || index === 7 || index === (rank === 8 ? 4 : 14);
        const alignedAngle = major && overlap > 68 ? (index === 1 ? 35 : index === 7 ? 318 : 176) : angle;
        return <span key={`${rank}-${angle}`} className={major ? 'major-direction' : 'minor-direction'} style={{ '--ray-angle': `${alignedAngle}deg`, '--ray-length': `${major ? 43 : 26 + (index % 4) * 3}%` } as React.CSSProperties} />;
      })}
      <b>r = {rank}</b>
      <small>{rank === 8 ? '8 DIRECTIONS' : '64 DIRECTIONS · SIMPLIFIED VIEW'}</small>
    </div>
  );
}

function WeightEngine({ boost }: { boost: number }) {
  const paths = useMemo(() => [18, 33, 46, 58, 71, 84], []);
  return (
    <div className="pretrained-engine" style={{ '--boost': boost } as React.CSSProperties}>
      <div className="engine-nameplate"><small>PRETRAINED WEIGHT ENGINE</small><b>W₀</b></div>
      <div className="engine-vault">
        {paths.map((top, index) => <div key={top} className={`drive-direction ${index === 1 || index === 4 ? 'is-useful' : ''}`} style={{ top: `${top}%`, '--path-index': index } as React.CSSProperties}><i /><span>{index === 1 || index === 4 ? 'USEFUL · QUIET' : 'EXISTING DIRECTION'}</span><b /></div>)}
        <div className="engine-core"><i /><strong>PRETRAINED</strong><span>DIRECTIONS</span></div>
        <div className="boost-assembly"><span>ΔW</span><i /><b>PRESSURE</b></div>
      </div>
      <div className="engine-foundation">NOT NEW MACHINERY · REWEIGHTED MOTION</div>
    </div>
  );
}

export function LowRankAbyss({ onNext }: { onNext: () => void }) {
  const [stage, setStage] = useState<Stage>('elevator');
  const [depth, setDepth] = useState(0);
  const [overlap, setOverlap] = useState(12);
  const [boost, setBoost] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const descentTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (descentTimer.current !== null) window.clearInterval(descentTimer.current);
  }, []);

  const descend = () => {
    if (stage !== 'elevator') return;
    setStage('descending');
    descentTimer.current = window.setInterval(() => {
      setDepth((current) => {
        const next = Math.min(100, current + 4);
        if (next === 100 && descentTimer.current !== null) {
          window.clearInterval(descentTimer.current);
          descentTimer.current = null;
          window.setTimeout(() => setStage('subspace'), 380);
        }
        return next;
      });
    }, 65);
  };

  const aligned = overlap >= 76;
  const amplified = boost >= 72;

  if (stage === 'elevator' || stage === 'descending') {
    return (
      <section className={`abyss-elevator ${stage === 'descending' ? 'is-descending' : ''}`} aria-labelledby="abyss-entry-title">
        <div className="elevator-shaft"><i /><i /><i /><i /></div>
        <div className="elevator-cage">
          <header><small>ACT 9 · DESCENT AUTHORIZATION</small><h1 id="abyss-entry-title">LOW-RANK ABYSS</h1></header>
          <div className="abyss-entry-brief">
            <small>承接 MERGE ROOM · 从“如何部署”追问“为何有效”</small>
            <p>上一幕证明了 BA 可以并入 W₀，因此部署时不增加额外路径。但一个关键疑问还留在熔炉底部：<strong>为什么很小的 r 就可能足够？</strong></p>
            <p>乘升降机进入内在秩实验室，先比较 r=8 与 r=64 的重要方向，再观察 ΔW 与预训练权重 W₀ 的关系。</p>
          </div>
          <div className="cage-window"><div className="passing-levels">{[1,2,3,4,5,6].map((n) => <i key={n}><span>LEVEL −{n}</span></i>)}</div><b>{stage === 'descending' ? 'DESCENDING' : 'FACTORY FLOOR'}</b></div>
          <div className="depth-gauge"><span>DEPTH</span><i><b style={{ height: `${depth}%`, '--depth': `${depth}%` } as React.CSSProperties} /></i><strong>−{depth * 12} m</strong></div>
          <div className="ambient-console"><span><i /> MECHANICAL ECHO</span><span><i /> WATER DRIP</span><span><i /> WEAK ARC</span></div>
          <button onClick={descend} disabled={stage === 'descending'}>{stage === 'descending' ? '下降中…' : '带着“为什么”启动升降机'}</button>
          <p>{stage === 'descending' ? '工厂的轰鸣正在远去。只剩钢索、滴水与电弧的回声。' : '答案不在生产线上。它藏在权重更新最深处。'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`intrinsic-lab stage-${stage}`} aria-labelledby="intrinsic-title">
      <div className="abyss-drips" aria-hidden="true"><i /><i /><i /><i /></div>
      <header className="intrinsic-header">
        <div><span>DEPTH −1200M · RESTRICTED RESEARCH LEVEL</span><h1 id="intrinsic-title">THE INTRINSIC RANK LAB</h1></div>
        <div className="silence-meter"><small>AMBIENT MACHINERY</small><b>NEAR SILENT</b></div>
      </header>

      {stage === 'subspace' ? (
        <div className="subspace-chamber">
          <div className="abyss-question"><small>RESEARCH QUESTION 01</small><h2>为什么这么低的 rank 居然够用？</h2><p>把两个不同容量的更新空间推到一起，观察哪些方向会留下。</p></div>
          <div className="disk-observatory" style={{ '--overlap': overlap } as React.CSSProperties}>
            <DirectionDisk rank={8} rays={rays8} overlap={overlap} />
            <div className={`overlap-core ${aligned ? 'is-aligned' : ''}`}><i /><b>{aligned ? 'CORE DIRECTIONS MATCH' : 'SEARCHING FOR COMMON AXES'}</b></div>
            <DirectionDisk rank={64} rays={rays64} overlap={overlap} />
          </div>
          <div className="subspace-control">
            <div className="brass-knob" style={{ transform: `rotate(${-130 + overlap * 2.6}deg)` }}><i /><b /></div>
            <label htmlFor="subspace-overlap">空间重合旋钮 <strong>{overlap}%</strong></label>
            <input id="subspace-overlap" type="range" min="0" max="100" value={overlap} onChange={(event) => setOverlap(Number(event.target.value))} />
            <div className="overlap-reading">
              {!aligned ? <><small>OBSERVATION INCOMPLETE</small><p>继续转动。大量细小方向还在彼此错开。</p></> : <><small>STABLE CORE DETECTED</small><p>增加 rank 会增加更多方向，但真正稳定、重复出现的重要方向可能只有少数几个。</p></>}
            </div>
            <button disabled={!aligned} onClick={() => setStage('engine')}>{aligned ? '进入 W₀ 深层机舱 →' : '先找到稳定重合方向'}</button>
          </div>
        </div>
      ) : null}

      {stage === 'engine' ? (
        <div className="engine-chamber">
          <div className="abyss-question"><small>RESEARCH QUESTION 02</small><h2>ΔW 是在安装新机械，还是重新强调已有传动？</h2><p>推动增压器，观察预训练权重中原本较弱、但与任务相关的方向。</p></div>
          <div className="engine-experiment">
            <WeightEngine boost={boost} />
            <aside className="boost-console">
              <span>ΔW DIRECTION AMPLIFIER</span>
              <h3>放大已有的有用方向</h3>
              <p>这里不添加一台全新的发动机。增压只作用于 W₀ 内已经存在的传动方向。</p>
              <label htmlFor="direction-boost">AMPLIFICATION PRESSURE <b>{boost}%</b></label>
              <input id="direction-boost" type="range" min="0" max="100" value={boost} onChange={(event) => setBoost(Number(event.target.value))} />
              <div className="pressure-tube"><i style={{ height: `${boost}%` }} /><b>DIRECTION GAIN</b></div>
              <div className={`interpretation-seal ${amplified ? 'is-visible' : ''}`}>
                <small>INTERPRETIVE EVIDENCE · NOT A PROOF</small>
                <strong>“LoRA 并不是从零安装一整套新知识。”</strong>
                <strong>“它可能放大预训练权重中已经存在、但尚未被强调的任务相关特征方向。”</strong>
                <p>这是基于论文权重与更新方向分析得到的直觉解释，不是严格理论证明。</p>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      <div className="abyss-lab-footer">
        <button className="technical-drawer-trigger" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}><span>技术细节</span><b>{detailsOpen ? '收起 −' : '展开 +'}</b></button>
        {detailsOpen ? <div className="abyss-details">
          <div><small>SVD</small><strong>ΔW = UΣVᵀ</strong><p>奇异值分解把更新矩阵拆成方向与强度。较大的奇异值对应更重要的变化方向。</p></div>
          <div><small>SINGULAR VECTORS</small><strong>Directions, not extra modules</strong><p>U 与 V 中的奇异向量描述输入、输出空间里的主要方向；这里比较的是不同 rank 解学到了哪些方向。</p></div>
          <div><small>SUBSPACE SIMILARITY</small><strong>Compare leading spans</strong><p>论文比较 r=8 与 r=64 更新矩阵的主要奇异子空间：头部方向有明显重合，新增的次要方向一致性较弱。主故事不需要推导 Grassmann distance。</p></div>
        </div> : null}
        {stage === 'engine' && amplified ? <div className="engineer-notebook"><div><small>ENGINEER NOTEBOOK · FINAL ENTRY</small><span>OBSERVATION CONFIRMED</span></div><strong>调整会在低秩空间中进行</strong><p>低 rank 的力量不一定来自“装得更多”，而可能来自抓住少量、稳定且与任务相关的方向。</p><button onClick={onNext}>前往 Task Cartridge Vault →</button></div> : <div className="notebook-locked"><i /> ENGINEER NOTEBOOK 等待最终观察</div>}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Formula } from '../components/Formula';
import type { FormulaDef } from '../types';
import type { WidgetProps } from './registry';

const stages = ['S1 探索', 'S2 定位与救援', 'S3 返回', 'S4 定位与交接'];

const tcrFormula: FormulaDef = {
  source: '来源：论文 Section 3.2',
  lead: '任务完成率（TCR）统计所有 episode 中，完整完成四阶段救援的比例。',
  unicode:
    '<span class="eq-line"><span>TCR</span> = <span class="frac"><span>|{ i : <span>S</span><sub>1i</sub> ∧ <span>S</span><sub>2i</sub> ∧ <span>S</span><sub>3i</sub> ∧ <span>S</span><sub>4i</sub> }|</span><span>N</span></span><span class="eq-number">(1)</span></span>',
  symbols: [
    { sym: 'TCR', desc: '任务完成率：完整完成四阶段救援的 episode 占全部 episode 的比例。' },
    { sym: 'S', desc: 'S<sub>1i</sub> 到 S<sub>4i</sub> 分别表示 episode i 的四个阶段是否成功。' },
    { sym: 'N', desc: '参与统计的 episode 总数。' },
  ],
};

const tsFormula: FormulaDef = {
  source: '来源：论文 Section 3.2',
  lead: '任务分数（TS）由四个阶段的连续得分相加得到；每阶段最高 25 分，总分范围为 0–100。',
  unicode:
    '<span class="eq-line"><span>TS</span><sub>i</sub> = ∑<sub>k∈{1,2,3,4}</sub> <span>StageScore</span><sub>k,i</sub></span>',
  symbols: [
    { sym: 'TS', desc: 'episode i 的任务分数，取值范围为 0 到 100。' },
    { sym: 'StageScore', desc: '阶段 k 的连续得分，每个阶段最高 25 分。' },
  ],
};

const stageScoreFormula: FormulaDef = {
  source: '来源：论文 Section 3.2 · 公式 (2)',
  lead: '阶段得分衡量：相比阶段开始时，智能体曾经向当前阶段目标推进了多少。',
  unicode:
    '<span class="eq-line stage-score-equation"><span>StageScore</span><sub>k,i</sub> = 25 · clip<span class="eq-paren">(</span>1 − <span class="frac"><span>d<sub>k</sub><sup>best</sup></span><span>max<span class="eq-paren">(</span>d<sub>k</sub><sup>init</sup>, ε<span class="eq-paren">)</span></span></span>,&nbsp; 0,&nbsp; 1<span class="eq-paren">)</span>. <span class="eq-number">(2)</span></span>',
  symbols: [
    { sym: 'StageScore', desc: 'episode i 中阶段 k 的连续得分，按论文定义裁剪到 0 到 25。' },
    { sym: 'best', desc: 'd<sup>best</sup><sub>k</sub>：阶段执行过程中曾经达到的最佳距离；不是当前距离或最终距离。' },
    { sym: 'init', desc: 'd<sup>init</sup><sub>k</sub>：阶段开始时到当前阶段目标的距离。' },
    { sym: 'ε', desc: '防止分母为零的极小正数。' },
  ],
};

export function FailureEpisodesV2(_: WidgetProps) {
  const [mode, setMode] = useState<'early' | 'near'>('early');
  const status = mode === 'early'
    ? ['失败', '未到达', '未到达', '未到达']
    : ['完成', '完成', '完成', '未完成'];

  return (
    <div className="metric-failure-v2">
      <div className="metric-tabs" role="group" aria-label="切换失败位置">
        <button type="button" className={mode === 'early' ? 'selected' : ''} onClick={() => setMode('early')}>早期失败</button>
        <button type="button" className={mode === 'near' ? 'selected' : ''} onClick={() => setMode('near')}>接近完成</button>
      </div>
      <div className="metric-result-ribbon bad" aria-live="polite">
        <span>完整任务</span><strong>失败</strong>
      </div>
      <div className="episode-stage-grid" aria-live="polite">
        {stages.map((stage, index) => (
          <section key={stage} className={status[index] === '完成' ? 'done' : status[index] === '失败' || status[index] === '未完成' ? 'failed' : 'unreached'}>
            <span>{stage}</span>
            <strong>{status[index]}</strong>
            <i aria-hidden="true" />
          </section>
        ))}
      </div>
      <p className="metric-judgment">完整完成率必须严格，但只看最终的 0 / 1，会把完全不同的失败程度压成同一个结果。</p>
    </div>
  );
}

export function TcrJudgeV2(_: WidgetProps) {
  const [success, setSuccess] = useState([true, true, true, false]);
  const complete = success.every(Boolean);
  const toggleStage = (index: number) => setSuccess((current) => current.map((value, i) => i === index ? !value : value));

  return (
    <div className="tcr-judge-v2">
      <div className="tcr-stage-chain" role="group" aria-label="切换四阶段是否成功">
        {stages.map((stage, index) => (
          <button type="button" key={stage} className={success[index] ? 'success' : 'failure'} aria-pressed={success[index]} onClick={() => toggleStage(index)}>
            <span>{success[index] ? '✓' : '×'}</span>
            <strong>{stage}</strong>
            <small>{success[index] ? '成功' : '失败'}</small>
          </button>
        ))}
      </div>
      <div className={`metric-result-ribbon ${complete ? 'success' : 'bad'}`} aria-live="polite">
        <span>S1 ∧ S2 ∧ S3 ∧ S4</span>
        <strong>{complete ? '本次任务完成' : '本次任务未完成'}</strong>
      </div>
      <Formula formula={tcrFormula} />
    </div>
  );
}

const clip = (value: number) => Math.min(1, Math.max(0, value));
const scoreFromBest = (best: number) => 25 * clip(1 - best / Math.max(10, 1e-6));

export function StageScoreDistanceV2(_: WidgetProps) {
  const [currentDistance, setCurrentDistance] = useState(10);
  const [bestDistance, setBestDistance] = useState(10);
  const [dragging, setDragging] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [autoStep, setAutoStep] = useState(0);

  useEffect(() => {
    setAutoStep(0);
    const approach = window.setTimeout(() => setAutoStep(1), 700);
    const retreat = window.setTimeout(() => setAutoStep(2), 1900);
    return () => { window.clearTimeout(approach); window.clearTimeout(retreat); };
  }, [animationKey]);

  const updateDistance = (distance: number) => {
    const rounded = Math.round(Math.min(10, Math.max(0, distance)) * 10) / 10;
    setCurrentDistance(rounded);
    setBestDistance((best) => Math.min(best, rounded));
  };
  const updateFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging && event.type !== 'pointerdown') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 700;
    updateDistance(((660 - x) / 620) * 10);
  };
  const reset = () => { setCurrentDistance(10); setBestDistance(10); };
  const stageScore = useMemo(() => scoreFromBest(bestDistance), [bestDistance]);
  const autoCurrent = autoStep === 0 ? 10 : autoStep === 1 ? 3 : 6;
  const autoBest = autoStep === 0 ? 10 : 3;
  const autoScore = scoreFromBest(autoBest);
  const agentX = 660 - currentDistance * 62;
  const autoX = 660 - autoCurrent * 62;

  return (
    <div className="stage-score-v2">
      <section className="distance-lab-card">
        <div className="metric-readouts" aria-live="polite">
          <span>初始距离<strong>10.0 m</strong></span>
          <span>当前距离<strong>{currentDistance.toFixed(1)} m</strong></span>
          <span className="best">最佳距离<strong>{bestDistance.toFixed(1)} m</strong></span>
          <span className="score">阶段得分<strong>{stageScore.toFixed(1)} / 25</strong></span>
        </div>
        <svg className="stage-distance-scene" viewBox="0 0 700 170" role="img" aria-label={`当前距离 ${currentDistance.toFixed(1)} 米，最佳距离 ${bestDistance.toFixed(1)} 米`} onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); updateFromPointer(event); }} onPointerMove={updateFromPointer} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
          <rect className="metric-field" x="20" y="18" width="660" height="130" rx="16" />
          <line className="metric-route" x1="40" y1="105" x2="660" y2="105" />
          <g className="metric-target"><circle cx="660" cy="105" r="24" /><path d="M650 105l8 8 15-19" /></g>
          <g className="metric-agent" transform={`translate(${agentX} 105)`}><circle r="18" /><path d="M-9 0h18M0-9v18" /></g>
          <text x="40" y="138">起点 · 10 m</text><text x="612" y="138">阶段目标 · 0 m</text>
        </svg>
        <div className="distance-lab-controls">
          <label><span>拖动智能体靠近目标</span><input aria-label="推进距离" type="range" min="0" max="10" step="0.1" value={10 - currentDistance} onInput={(event) => updateDistance(10 - Number(event.currentTarget.value))} /></label>
          <button type="button" onClick={reset}>回到起点</button>
        </div>
        <p className="metric-judgment">距离目标越近，阶段得分越高；真正到达时可获得该阶段最高 25 分。</p>
      </section>

      <section className="best-distance-card">
        <header><div><span>为什么使用最佳距离？</span><strong>靠近后退，进展不会被抹掉</strong></div><button type="button" onClick={() => setAnimationKey((key) => key + 1)}>重新播放</button></header>
        <svg className="best-distance-scene" viewBox="0 0 700 130" role="img" aria-label={`动画当前距离 ${autoCurrent} 米，最佳距离 ${autoBest} 米`}>
          <line x1="40" y1="75" x2="660" y2="75" />
          <circle className="best-marker" cx={660 - 3 * 62} cy="75" r="8" />
          <g className="metric-target"><circle cx="660" cy="75" r="22" /><path d="M650 75l8 8 14-18" /></g>
          <g className="metric-agent animated" transform={`translate(${autoX} 75)`}><circle r="17" /><path d="M-8 0h16M0-8v16" /></g>
          <text x="40" y="106">10 m</text><text x={660 - 3 * 62 - 20} y="106">最佳 3 m</text><text x="630" y="106">目标</text>
        </svg>
        <div className="auto-readouts" aria-live="polite">
          <span>当前距离<strong>{autoCurrent.toFixed(1)} m</strong></span>
          <span>最佳距离<strong>{autoBest.toFixed(1)} m</strong></span>
          <span>阶段得分<strong>{autoScore.toFixed(1)} / 25</strong></span>
        </div>
        <p className="metric-judgment">阶段得分记录智能体曾经最接近目标的进展，而不是只看 episode 最后停在哪里。</p>
      </section>
    </div>
  );
}

const profiles = {
  front: { label: '前强后弱', values: [20, 18, 4, 2], note: '前两阶段推进明显，返回与交接阶段掉分。' },
  even: { label: '各阶段均衡偏弱', values: [12, 11, 11, 10], note: '四个阶段都取得部分进展，但没有一个阶段接近满分。' },
} as const;

export function StageProfileV2(_: WidgetProps) {
  const [profile, setProfile] = useState<keyof typeof profiles>('front');
  const current = profiles[profile];
  const total = current.values.reduce((sum, value) => sum + value, 0);
  return (
    <div className="stage-profile-v2">
      <div className="metric-tabs" role="group" aria-label="切换阶段得分分布">
        {(Object.keys(profiles) as Array<keyof typeof profiles>).map((key) => <button type="button" key={key} className={profile === key ? 'selected' : ''} onClick={() => setProfile(key)}>{profiles[key].label}</button>)}
      </div>
      <div className="profile-total"><span>任务分数（TS）</span><strong>{total}</strong><small>/ 100</small></div>
      <div className="profile-bars" aria-live="polite">
        {stages.map((stage, index) => <div key={stage}><span>{stage}</span><i><b style={{ width: `${current.values[index] / 25 * 100}%` }} /></i><strong>{current.values[index]} / 25</strong></div>)}
      </div>
      <p className="metric-judgment">{current.note} 两种分布的总分都是 44，但失败位置完全不同。</p>
      <div className="stage-profile-formulas">
        <Formula formula={tsFormula} />
        <Formula formula={stageScoreFormula} />
      </div>
    </div>
  );
}

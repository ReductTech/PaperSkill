import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { useCoverPlayback } from '../components/CoverPlayback';
import { Choice, Frame, IntegerChoice, Range, Road, gold, mint, sky } from './road-scenes';
import { greedyCoverage, hit, objective, sampleRoad, type Point } from './road-model';
import { conflictDistance, conflictSamples, conflictWindow, initialMixture, laplace,
  mixtureLoss, mixtureStep, optimizeDistance, trainingOutcomes, type Mixture } from './learning-model';

function Equation({ children, meaning }: { children: string; meaning: string }) {
  return <div className="td-equation"><SymbolHint meaning={meaning}>{children}</SymbolHint></div>;
}

const hitCount = (picks: Point[]) => conflictSamples.filter(sample => picks.some(pick => hit(pick, sample, .6))).length;

export function CoverMetric() {
  const { progress } = useCoverPlayback();
  return <Road picks={progress < .5 ? conflictDistance : conflictWindow}
    animate={progress} note={progress < .5 ? '只看少量候选 · 距离取向' : '只看少量候选 · 覆盖取向'} />;
}

export function CoverDistribution() {
  const { progress } = useCoverPlayback();
  return <Road samples={conflictSamples} picks={progress < .5 ? conflictDistance : conflictWindow}
    animate={progress} note={progress < .5 ? '预测分布固定 · 距离策略' : '预测分布固定 · 窗口策略'} />;
}

export function Conflict() {
  const [strategy, setStrategy] = useState(0);
  const picks = strategy === 0 ? conflictDistance : conflictWindow;
  const baselineDistance = objective(conflictSamples, conflictDistance);
  const chosenDistance = objective(conflictSamples, picks);
  return <div className="td-conflict">
    <div className="td-wide-toolbar">
      <p>固定 96 个可能终点，只给两个候选名额。</p>
      <Choice items={['距离策略', '窗口策略']} current={strategy} select={setStrategy} />
    </div>
    <div className="td-conflict-main">
      <Road samples={conflictSamples} picks={picks} note="同一分布 · 两个候选 · 教学示意" />
      <div className="td-conflict-metrics">
        <section><h2>平均最近距离 ↓</h2><strong>{chosenDistance.toFixed(2)} m</strong>
          <p>{strategy === 0 ? '更多照顾样本密集的主方向。' : '比距离策略增加 ' + (chosenDistance - baselineDistance).toFixed(2) + ' m。'}</p></section>
        <section><h2>窗口命中数 ↑</h2><strong>{hitCount(picks)} / 96</strong>
          <p>只统计是否命中，不按距离远近继续加分。</p></section>
      </div>
    </div>
    <p className="td-wide-conclusion">两个目标偏好不同摆法。若训练也追随这种摆法，学到的分布会受何影响？</p>
  </div>;
}

const bridgeSamples = sampleRoad(24);
const bridgeDistance = optimizeDistance(bridgeSamples, 3);
const bridgeWindow = greedyCoverage(bridgeSamples, 3, 1).selected.map(row => row.point);

export function Decoupling() {
  const [stage, setStage] = useState(0);
  const [policy, setPolicy] = useState(0);
  return <div className="td-bridge">
    <div className="td-bridge-text">
      <Choice items={['训练阶段', '评测阶段']} current={stage} select={setStage} />
      <h2>{stage === 0 ? '用真实未来学习分布' : '固定模型，再选择输出'}</h2>
      <p>{stage === 0 ? '输入历史和地图。真实未来提供监督，用负对数似然更新模型的均值、尺度和权重。'
        : '同一组权重产生同一分布。当前指标决定怎样将分布压缩成有限候选。'}</p>
      <div className="td-stage-row"><b className={stage === 0 ? 'td-active' : ''}>DONUT-NLL</b>
        <span>预测分布 p</span><b className={stage === 1 ? 'td-active' : ''}>TraDiE</b></div>
      {stage === 1 && <Choice items={['按 minFDE 选', '按窗口选']} current={policy} select={setPolicy} />}
      <p className="td-quiet">{stage === 0 ? '训练优化分布的似然，不直接追逐 minFDE 或 mAP。第 5 节介绍训练。'
        : '选点只用模型样本。真实未来在输出确定后才用于评分。第 4 节介绍策略。'}</p>
    </div>
    <div className="td-bridge-road"><Road samples={bridgeSamples}
      picks={stage === 0 ? [] : policy === 0 ? bridgeDistance : bridgeWindow}
      note={stage === 0 ? '先保留未来的多种可能' : '分布未变，选择规则改变'} /></div>
  </div>;
}

function besselI0(value: number) {
  let sum = 1;
  let term = 1;
  for (let i = 1; i <= 30; i++) {
    term *= value * value / (4 * i * i);
    sum += term;
  }
  return sum;
}

export function Density() {
  const [angle, setAngle] = useState(35);
  const [scale, setScale] = useState(1.2);
  const local = Array.from({ length: 49 }, (_, i) => ({
    x: (i % 7 - 3) * .5, y: (Math.floor(i / 7) - 3) * .5,
  }));
  const pos = laplace(.8, 0, scale) * laplace(.25, 0, .45);
  const heading = Math.exp(4 * Math.cos((55 - angle) * Math.PI / 180)) / (2 * Math.PI * besselI0(4));
  return <Frame visual={<svg className="td-density" viewBox="0 0 980 600" aria-label="预测航向对齐的位置密度">
    <rect width="980" height="600" rx="28" fill="#102b2e" />
    <path d="M90 480 H890 M490 70 V530" stroke="#537273" strokeWidth="3" />
    <g transform={'translate(490 315) rotate(' + -angle + ')'}>
      {local.map((p, i) => <circle key={i} cx={p.x * scale * 100} cy={p.y * 45}
        r={9 + laplace(p.x, 0, 1) * laplace(p.y, 0, 1) * 35} fill={sky} opacity=".5" />)}
      <path d="M-290 0 H290 M0 -135 V135" stroke={mint} strokeWidth="4" strokeDasharray="12 12" />
      <rect x="-45" y="-23" width="90" height="46" rx="14" fill={mint} />
      <rect x="13" y="-17" width="20" height="34" rx="5" fill="#20464a" />
      <path d="M80 -36 l9 9 -9 9 -9 -9Z" fill={gold} />
      <foreignObject x="200" y="-65" width="95" height="44"><div className="td-axis-label">纵向</div></foreignObject>
      <foreignObject x="16" y="-145" width="95" height="44"><div className="td-axis-label">横向</div></foreignObject>
    </g>
    <text x="45" y="558" fill="#a4c0be" fontSize="28">一个运动模式 · 局部坐标密度示意</text>
  </svg>}>
    <h2>位置、方向与变化范围</h2>
    <Range label="预测航向（度）" min={0} max={90} value={angle} onChange={setAngle} />
    <Range label="纵向尺度 b" min={.6} max={1.6} step={.1} value={scale} onChange={setScale} />
    <Equation meaning="一个模式在一个时刻的密度，由纵向拉普拉斯、横向拉普拉斯和冯·米塞斯航向密度相乘得到。">L纵 × L横 × vM</Equation>
    <p>局部位置偏差固定，航向观测为 55°。密度乘积为 {(pos * heading).toFixed(3)}。</p>
    <p className="td-quiet">均值管位置，尺度管宽度，混合权重管模式的重要性。</p>
  </Frame>;
}

function MixtureChart({ model }: { model: Mixture }) {
  const x = (v: number) => 70 + (v + 7) / 14 * 840;
  const y = (v: number) => 450 - v * 850;
  const parts = model.means.map((mean, i) => Array.from({ length: 141 }, (_, j) => {
    const value = -7 + j / 10;
    const weight = i === 0 ? model.leftWeight : 1 - model.leftWeight;
    return x(value) + ',' + y(weight * laplace(value, mean, 1.25));
  }).join(' '));
  return <svg viewBox="0 0 980 600" className="td-density" aria-label="训练样本与两个混合分量">
    <rect width="980" height="600" rx="28" fill="#102b2e" />
    <path d="M70 450 H910" stroke="#779795" strokeWidth="3" />
    {parts.map((points, i) => <polyline key={i} points={points} fill="none" stroke={i === 0 ? gold : sky} strokeWidth="5" />)}
    {trainingOutcomes.map((value, i) => <g key={i} transform={'translate(' + x(value) + ' 475)'}>
      <rect x="-8" y="-10" width="16" height="27" rx="4" fill={mint} />
    </g>)}
    {model.means.map((mean, i) => <g key={i}>
      <line x1={x(mean)} y1="180" x2={x(mean)} y2="450" stroke={i === 0 ? gold : sky} strokeWidth="2" strokeDasharray="9 8" />
      <text x={x(mean)} y="155" textAnchor="middle" fill={i === 0 ? gold : sky} fontSize="28">μ{i + 1} {mean.toFixed(2)}</text>
    </g>)}
    <text x="70" y="550" fill="#a4c0be" fontSize="28">绿车为 8 次真实观测 · 纵向一维教学数据</text>
  </svg>;
}

export function LearnMixture() {
  const [model, setModel] = useState(initialMixture);
  const [method, setMethod] = useState(1);
  const [steps, setSteps] = useState(0);
  function update() {
    let next = model;
    for (let i = 0; i < 10; i++) next = mixtureStep(next, method === 0);
    setModel(next); setSteps(steps + 10);
  }
  function reset(nextMethod = method) {
    setMethod(nextMethod); setModel(initialMixture); setSteps(0);
  }
  return <Frame visual={<MixtureChart model={model} />}>
    <h2>训练更新模型参数</h2>
    <Choice items={['WTA 回归', '混合 NLL']} current={method} select={reset} />
    <p className="td-number">{mixtureLoss(model, method === 0).toFixed(3)}</p>
    <p>{method === 0 ? '每个观测选最近模式，只更新该模式均值。这里单独演示回归项。'
      : '先对两个分量加权求和，再取负对数。均值和权重共同影响真实观测的密度。'}</p>
    <div className="td-buttons"><button onClick={update}>训练 10 步</button><button onClick={() => reset()}>重置训练</button></div>
    <p className="td-quiet">已训练 {steps} 步 · 左分量权重 {model.leftWeight.toFixed(2)} · 尺度固定</p>
  </Frame>;
}

export function TemporalWeights() {
  const [stepwise, setStepwise] = useState(0);
  const [early, setEarly] = useState(.8);
  const [late, setLate] = useState(.2);
  const weightLate = stepwise ? late : early;
  const densities = [[.8, .1], [.2, .7]];
  const first = early * .8 + (1 - early) * .2;
  const second = weightLate * .1 + (1 - weightLate) * .7;
  const probability = stepwise ? first * second : early * .8 * .1 + (1 - early) * .2 * .7;
  return <div className="td-temporal">
    <div className="td-wide-toolbar"><Choice items={['Traj-NLL', 'Step-NLL']} current={stepwise} select={setStepwise} />
      <p>同一条真实未来，两个时刻、两个模式的密度。</p></div>
    <div className="td-temporal-columns">
      {['早期观测', '后期观测'].map((label, t) => <section key={label}>
        <h2>{label}</h2>
        <div className="td-weight-cars">{[0, 1].map(k => <div key={k}>
          <span className={'td-car td-car-' + k}
            style={{ width: 36 + 30 * (k === 0 ? t === 0 ? early : weightLate : 1 - (t === 0 ? early : weightLate)) }} />
          <span>模式 {k + 1}</span><strong>{densities[k][t].toFixed(1)}</strong>
        </div>)}</div>
        <Range label={t === 0 ? '早期模式 1 权重' : stepwise ? '后期模式 1 权重' : '同一组模式权重'}
          value={t === 0 ? early : weightLate} min={.1} max={.9} step={.1}
          onChange={t === 0 || !stepwise ? setEarly : setLate} />
      </section>)}
      <section className="td-temporal-answer">
        <h2>{stepwise ? '各时刻先混合' : '各模式先跨时间'}</h2>
        <Equation meaning={stepwise ? '逐时刻混合密度再相乘，等价于逐时刻负对数似然求和。'
          : '各模式内部跨时间相乘，再用贯穿整段的模式权重混合。'}>{stepwise ? '(Σ π早 p早) × (Σ π后 p后)' : 'Σ π × (p早 × p后)'}</Equation>
        <p className="td-number">{(-Math.log(probability)).toFixed(3)}</p>
        <p>{stepwise ? '权重可随时刻改变，边缘分布更灵活；时间上的联系也更弱。'
          : '一组权重贯穿整段。单个模式需要解释两个时刻。'}</p>
      </section>
    </div>
    <p className="td-wide-conclusion">原式（15）、（16）的两时刻小例子。数值是教学似然与损失。</p>
  </div>;
}

export function ClusterContrast() {
  const [position, setPosition] = useState(2);
  const samples = [0, 0, 0, 0, 10];
  const absolute = samples.reduce((sum, x) => sum + Math.abs(position - x), 0) / 5;
  const squared = samples.reduce((sum, x) => sum + (position - x) ** 2, 0) / 5;
  return <Frame visual={<svg viewBox="0 0 980 600" className="td-density" aria-label="未平方距离与平方距离的比较">
    <rect width="980" height="600" rx="28" fill="#102b2e" />
    <path d="M90 420 H890" stroke="#73918e" strokeWidth="3" />
    {samples.map((value, i) => <g key={i} transform={'translate(' + (110 + value * 73) + ' ' + (180 + i % 4 * 55) + ')'}>
      <line x1="0" y1="0" x2={73 * (position - value)} y2={420 - 180 - (i % 4) * 55} stroke={sky} opacity=".4" />
      <rect width="32" height="19" x="-16" y="-9" rx="6" fill={mint} />
    </g>)}
    <line x1={110 + position * 73} y1="120" x2={110 + position * 73} y2="443" stroke={gold} strokeWidth="4" />
    <text x="110" y="472" fill="#d8eee7" fontSize="28">0</text><text x="840" y="472" fill="#d8eee7" fontSize="28">10</text>
    <text x="80" y="554" fill="#a4c0be" fontSize="28">四次停在 0，一次到 10 · 仅一个候选名额</text>
  </svg>}>
    <h2>目标不同，中心也不同</h2>
    <Range label="候选位置 a" min={0} max={10} step={.1} value={position} onChange={setPosition} />
    <p>平均距离 <strong>{absolute.toFixed(2)} m</strong></p>
    <p>平均平方距离 <strong>{squared.toFixed(2)} m²</strong></p>
    <div className="td-buttons"><button onClick={() => setPosition(0)}>距离最优 0</button>
      <button onClick={() => setPosition(2)}>k-means 最优 2</button></div>
    <p>TraDiE 对准 minFDE 的未平方距离。窗口策略则是另一类覆盖问题。</p>
  </Frame>;
}

export function ConfidenceLedger() {
  const [round, setRound] = useState(1);
  const samples = sampleRoad(24);
  const result = greedyCoverage(samples, 4, 1);
  const selected = result.selected.slice(0, round);
  const total = selected.reduce((sum, row) => sum + row.newlyHit.length, 0);
  return <div className="td-confidence">
    <div className="td-confidence-road"><Road samples={samples} picks={selected.map(row => row.point)}
      note="同一个模型的 96 个终点样本" /></div>
    <div className="td-confidence-math">
      <h2>每轮只计算新增命中</h2>
      <IntegerChoice label="累计选取轮数" values={[1, 2, 3, 4]} value={round} onChange={setRound} />
      <div className="td-ledger"><header><span>候选</span><span>新增窗口</span><span>置信度</span></header>
        {selected.map((row, i) => <div key={i}><span>{i + 1}</span><strong>{row.newlyHit.length}</strong>
          <span>{row.newlyHit.length} ÷ 96 = {row.confidence.toFixed(2)}</span></div>)}</div>
      <Equation meaning="新增命中数除以原始样本总数，得到该候选成为首次真阳性的概率估计。分母固定。">π = 新增命中 / 原样本数</Equation>
      <p>累计覆盖 {total} / 96。置信度之和为 {(total / 96).toFixed(2)}，剩余可能性仍可未覆盖。</p>
    </div>
  </div>;
}

export function SameWeights() {
  const [policy, setPolicy] = useState(0);
  const values = [[.5018, 1.3280], [.1649, 1.0304]];
  return <div className="td-proof">
    <div className="td-wide-toolbar"><Choice items={['窗口策略提交', '距离策略提交']} current={policy} select={setPolicy} />
      <p>同一组 DONUT-NLL 权重 · Step-NLL＋广义高斯</p></div>
    <div className="td-proof-body">
      <div className="td-proof-road"><Road samples={bridgeSamples}
        picks={policy === 0 ? bridgeWindow : bridgeDistance} note="候选为策略示意，右侧为论文实测" /></div>
      <div className="td-proof-charts">{['soft mAP ↑', 'minFDE ↓（m）'].map((label, metric) => <section key={label}>
        <h2>{label}</h2>
        {values.map((row, i) => <div key={i} className={'td-proof-row ' + (i === policy ? 'is-selected' : '')}>
          <span>{i === 0 ? '窗口' : '距离'}</span><i style={{ width: row[metric] / (metric === 0 ? .55 : 1.4) * 250,
            background: i === policy ? mint : '#779b9e' }} /><strong>{row[metric].toFixed(4)}</strong>
        </div>)}
      </section>)}</div>
    </div>
    <p className="td-wide-conclusion">论文表 4 · Waymo 测试集。同一模型适应两类指标，靠的是两套策略输出。</p>
  </div>;
}

export function Horizons() {
  const [last, setLast] = useState(0);
  const [rank, setRank] = useState(0);
  const orders = [[1, 0, 2], [0, 1, 2], last === 0 ? [2, 1, 0] : [0, 1, 2]];
  const confidences = [[.5, .3, .1], [.45, .25, .15], [.4, .3, .18]];
  return <div className="td-horizons">
    <div className="td-wide-toolbar"><Choice items={['选第 1 名', '选第 2 名', '选第 3 名']} current={rank} select={setRank} />
      <Choice items={['8 秒右转居首', '8 秒左转居首']} current={last} select={setLast} /></div>
    <svg viewBox="0 0 1472 330" aria-label="不同时刻按置信度排名配对">
      {[0, 1].map(t => <line key={t} x1={230 + t * 490} y1={85 + orders[t][rank] * 85}
        x2={230 + (t + 1) * 490} y2={85 + orders[t + 1][rank] * 85} stroke={gold} strokeWidth="7" />)}
      {orders.map((order, t) => <g key={t}>
        <text x={230 + t * 490} y="35" textAnchor="middle" fontSize="34" fill={mint}>{[3, 5, 8][t]} 秒</text>
        {order.map((branch, r) => <g key={r} transform={'translate(' + (230 + t * 490) + ' ' + (85 + branch * 85) + ')'}>
          <rect x="-165" y="-27" width="330" height="54" rx="14" fill={r === rank ? '#537565' : '#23474a'}
            stroke={r === rank ? gold : '#3e6261'} strokeWidth="3" />
          <foreignObject x="-165" y="-27" width="330" height="54">
            <div className="td-horizon-label">{['左转', '直行', '右转'][branch]} · 第 {r + 1} 名 · {confidences[t][r]}</div>
          </foreignObject>
        </g>)}
      </g>)}
    </svg>
    <div className="td-horizon-notes"><section><h2>按排名配对</h2><p>取三个时刻同一名次的终点。当前连接
      {orders.map(order => ['左转', '直行', '右转'][order[rank]]).join(' → ')}。</p></section>
      <section><h2>使用 8 秒置信度</h2><p>当前提交置信度 {confidences[2][rank]}。它代表整条提交结果，各时刻分数不取平均。</p></section>
      <section><h2>连续性仍待处理</h2><p>名次一致，运动分支仍可能改变。中间时刻和动力学可行性需要另外处理。</p></section></div>
  </div>;
}

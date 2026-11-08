import React, { useState } from 'react';
import { add, baseFit, composed, distance, fitLine, future, history, last, metric, number, offsets, positions } from './resonance-model';
import type { Point } from './resonance-model';
import { Bars, Choice, color, Legend, Map, Note, Panel, Slider, Split } from './resonance-ui';

const observed = { points: positions, color: color.history, dots: true };
const base = { points: [baseFit.at(7), ...future], color: color.baseline, dashed: true };
const start = baseFit.at(7);
const samples = [[-.85, .55, 1.15], [-.9, .75, 1.3]];
const xy = (p: Point) => `(${number(p[0])}, ${number(p[1])})`;
const frameForCompare = ([x, y]: Point): Point => [x - 1.55, y];

export function Sampling() {
  const [trial, setTrial] = useState({ before: [0, 1], current: [1, 1], changed: 0 });
  const changeBranch = (branch: number) => setTrial(({ current }) => ({
    before: current,
    current: current.map((i, j) => j === branch ? (i + 1) % samples[j].length : i),
    changed: branch,
  }));
  const [own, social] = trial.current.map((i, j) => samples[j][i]);
  const [beforeOwn, beforeSocial] = trial.before.map((i, j) => samples[j][i]);
  const prior = composed(beforeOwn, beforeSocial);
  const current = composed(own, social);
  const beforeParts = offsets(11, beforeOwn, beforeSocial), afterParts = offsets(11, own, social);
  return <Panel>
    <div className="re-lesson">
      <p className="re-lesson-lead">同样的历史可以对应多种未来。每次只换一份偏移，对比它单独把预测推向哪里。</p>
      <div className="re-controls re-lesson-controls">
        <button type="button" onClick={() => changeBranch(0)}>换一份自身偏移</button>
        <button type="button" onClick={() => changeBranch(1)}>换一份交互偏移</button>
      </div>
      <div className="re-sample-body">
        <div className="re-sample-map">
          <Map label="更换一类偏移前后的两条候选轨迹"
            routes={[observed, { ...base, opacity: .58 },
              { points: [start, ...prior], color: '#62758c', width: 5, dashed: true },
              { points: [start, ...current], color: color.result, width: 7 }].map(route => ({ ...route, points: route.points.map(frameForCompare) }))}
            markers={[{ point: frameForCompare(last(prior)), color: '#62758c' }, { point: frameForCompare(last(current)), color: color.result }]}
            arrows={[{ start: frameForCompare(last(prior)), end: frameForCompare(last(current)), color: color.result }]} />
          <Legend items={[[ '固定历史', color.history ], [ '更换前', '#62758c' ], [ '更换后', color.result ]]} />
        </div>
        <div className="re-lesson-card re-sample-readout" aria-live="polite">
          <b>第 12 步：参考位置 + 自身偏移 + 交互偏移</b>
          <table><thead><tr><th scope="col">分量（米）</th><th scope="col">更换前</th><th scope="col">更换后</th></tr></thead>
            <tbody>
              <tr><th scope="row">参考位置 · 固定</th><td>{xy(last(future))}</td><td>{xy(last(future))}</td></tr>
              <tr className="re-tone-own"><th scope="row">自身 · {trial.changed === 0 ? '已换' : '固定'}</th><td>{xy(beforeParts.own)}</td><td>{xy(afterParts.own)}</td></tr>
              <tr className="re-tone-social"><th scope="row">交互 · {trial.changed === 1 ? '已换' : '固定'}</th><td>{xy(beforeParts.neighbor)}</td><td>{xy(afterParts.neighbor)}</td></tr>
              <tr className="re-tone-purple"><th scope="row">合成终点</th><td>{xy(last(prior))}</td><td>{xy(last(current))}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <Note>论文用两份噪声分别生成自身和交互偏移，并把每一组偏移加到同一条参考轨迹上。这里切换预设偏移，只演示如何组成不同候选。</Note>
    </div>
  </Panel>;
}

const target = composed(.65, .55);
const alternatives = [
  target.map((p, i) => add(p, [0, i === 11 ? 1.65 : .10])),
  target.map((p, i) => add(p, [0, .9 * Math.sin(Math.PI * (i + 1) / 12)])),
  target.map(p => add(p, [.22, .31])),
];
const scores = alternatives.map(route => metric(route, target));
const names = ['A', 'B', 'C'];
const traces = alternatives.map(route => route.map((p, i) => distance(p, target[i])));
const measures = ['l2', 'ade', 'fde'] as const;
const bestAt = (view: number) => {
  const measure = measures[view];
  return scores.reduce((winner, next, i) => next[measure] < scores[winner][measure] ? i : winner, 0);
};

export function Objectives() {
  const [view, setView] = useState(0);
  const [candidate, setCandidate] = useState(bestAt(0));
  const measure = measures[view];
  const best = bestAt(view);
  const explanations = ['先把每步误差平方后相加，再开根号。单步特别大的误差更难被其他小误差抵消。',
    '把 12 步的位置误差取平均，选平均值最小的候选。', '只比较最后一步，前 11 步不参与这次选择。'];
  const candidateStory = ['前 11 步很贴近，最后一步偏得远。', '中途绕得远，但最后一步回到真实终点。', '每一步都偏一点，没有特别大的单步误差。'];
  return <Panel>
    <div className="re-lesson">
      <p className="re-lesson-lead">同样三条候选，怎样算误差会改变谁最接近真实未来？先换规则，再点候选看逐步误差。</p>
      <Choice labels={['训练：序列 L₂', '评测：minADE', '评测：minFDE']} value={view} change={i => { setView(i); setCandidate(bestAt(i)); }} label="最优候选评判规则" />
      <div className="re-error-body">
        <div className="re-lesson-card">
          <b>候选 {names[candidate]} · 每一步离真实位置多远？</b>
          <div className="re-error-strip" aria-label={`候选 ${names[candidate]} 的 12 步误差，单位为米`}>
            {traces[candidate].map((error, i) => <div key={i} className={view === 2 && i !== 11 ? 're-excluded' : ''}>
              <b>{number(error)}</b><div className="re-error-bar"><i style={{ height: `${error / 1.65 * 100}%` }} /></div><span>{i + 1}</span>
            </div>)}
          </div>
          <p>{candidateStory[candidate]}{view === 2 && ' 灰色步不计入 FDE。'}</p>
        </div>
        <div className="re-lesson-card re-error-rules">
          <b>{['√(e₁² + ⋯ + e₁₂²)', '(e₁ + ⋯ + e₁₂) ÷ 12', 'e₁₂'][view]} <span>（e 表示每步误差）</span></b>
          <p>{explanations[view]}</p>
          <div className="re-controls re-candidates" role="group" aria-label="查看候选误差">
            {names.map((name, i) => <button key={name} type="button" aria-pressed={candidate === i} onClick={() => setCandidate(i)}>
              <span>{name} · {number(scores[i][measure])}</span><small>{i === best ? '本规则最低' : '查看误差'}</small>
            </button>)}
          </div>
        </div>
      </div>
      <Note>式 (15) 训练时用序列 L₂ 选择最贴近真值的候选来计算损失。评测时 minADE 和 minFDE 各自取最小值，可以来自不同候选；实际预测时还没有真值可用。</Note>
    </div>
  </Panel>;
}

type Result = { name: string; ade: number; fde: number };
const benchmark: Result[][] = [
  [{ name: 'AgentFormer', ade: .23, fde: .40 }, { name: 'SocialCircle+', ade: .18, fde: .29 },
    { name: 'Y-net', ade: .18, fde: .27 }, { name: 'Resonance', ade: .17, fde: .28 }],
  [{ name: 'FlowChain', ade: 9.93, fde: 17.17 }, { name: 'SocialCircle+', ade: 6.54, fde: 10.36 },
    { name: 'MUSE-VAE', ade: 6.36, fde: 11.10 }, { name: 'Resonance', ade: 6.27, fde: 10.02 }],
];

export function Benchmark() {
  const [dataset, setDataset] = useState(0);
  const [view, setView] = useState(0);
  const field = view ? 'fde' : 'ade';
  return <Panel>
    <div className="re-controls re-spaced">
      <Choice labels={['ETH-UCY 平均', 'SDD']} value={dataset} change={setDataset} label="论文数据集" />
      <Choice labels={['minADE', 'minFDE']} value={view} change={setView} label="论文指标" />
    </div>
    <div className="re-tag">论文表 2 · best-of-20 · 越低越好</div>
    <Bars unit={dataset ? '像素' : '米'} entries={benchmark[dataset].map(row => ({
      label: row.name, value: row[field], color: row.name === 'Resonance' ? color.result : color.baseline,
    }))} />
    <Note>{dataset ? 'SDD 用像素报告，ETH-UCY 用米报告。两组柱长各自对应本组横轴。' :
      'ETH-UCY 使用留一划分。Resonance 在表中平均 minADE 为 0.17 米；Y-net 的平均 minFDE 为 0.27 米，低于 Resonance 的 0.28 米。'}</Note>
  </Panel>;
}

const pedestrianAblation = [
  { name: 'a1 · 线性基线', ade: .434, fde: .910, hue: color.baseline },
  { name: 'a2 · 基线 + 自身', ade: .210, fde: .326, hue: color.own },
  { name: 'a0 · 三项叠加', ade: .176, fde: .288, hue: color.result },
];
const nbaAblation = [
  { name: 'a6 · 自身 + 交互', ade: 1.14, fde: 1.42, hue: color.social },
  { name: 'a0 · 三项叠加', ade: 1.17, fde: 1.55, hue: color.result },
];

export function Ablation() {
  const [dataset, setDataset] = useState(0);
  const [view, setView] = useState(1);
  const field = view ? 'fde' : 'ade';
  return <Panel>
    <div className="re-controls re-spaced">
      <Choice labels={['ETH-UCY', 'NBA']} value={dataset} change={setDataset} label="消融场景" />
      <Choice labels={['minADE', 'minFDE']} value={view} change={setView} label="消融指标" />
    </div>
    <div className="re-tag">论文表 4 · 比较不同训练配置 · 越低越好</div>
    <Bars unit="米" entries={(dataset ? nbaAblation : pedestrianAblation).map(row => ({
      label: row.name, value: row[field], color: row.hue,
    }))} />
    <Note>{dataset ? '保留自身和交互两项时，NBA 的 a6 优于加回线性基线的 a0。作者据此讨论线性参考在篮球场景中的适用边界。' :
      '在 ETH-UCY，a0 的平均误差低于只使用基线和自身偏移的 a2。图 7 另用案例展示两类偏移的方向，属于定性观察。'}</Note>
  </Panel>;
}

const figureCases = ['两类偏移都可见', '自身偏移换向', '交互偏移换向'];
const figureRows = ['只加自身偏移', '只加交互偏移', '同时加两类偏移'];
const originalFigure = 'https://openaccess.thecvf.com/content/ICCV2025/papers/Wong_Resonance_Learning_to_Predict_Social-Aware_Pedestrian_Trajectories_as_Co-Vibrations_ICCV_2025_paper.pdf#page=7';

export function Qualitative() {
  const [example, setExample] = useState(0);
  const own = example === 1 ? -.85 : .85;
  const social = example === 2 ? -.85 : .85;
  const variants = [
    { points: composed(own, 0), color: color.own },
    { points: composed(0, social), color: color.social },
    { points: composed(own, social), color: color.result },
  ];
  return <Panel>
    <Choice labels={figureCases} value={example} change={setExample} label="选择两类偏移的方向" />
    <div className="re-paper-panels">
      {figureRows.map((label, i) => <figure key={label}>
        <figcaption>{label}</figcaption>
        <Map label={label}
          routes={[observed, base, { ...variants[i], points: [start, ...variants[i].points], width: 8 }]
            .map(route => ({ ...route, points: route.points.map(frameForCompare) }))}
          markers={[{ point: frameForCompare(last(variants[i].points)), color: variants[i].color }]} />
      </figure>)}
    </div>
    <Legend items={[[ '目标历史', color.history ], [ '线性基线（虚线）', color.baseline ], [ '合成结果', color.result ]]} />
    <Note>上方轨迹是教学算例。对照<a href={originalFigure} target="_blank" rel="noreferrer">论文图 7</a>时，先沿同一列比较两类偏移，再看合成预测。原图展示的是作者模型采样得到的候选。</Note>
  </Panel>;
}

export function Handoff() {
  const [missing, setMissing] = useState(1);
  const [noise, setNoise] = useState(.2);
  const retained = history.slice(0, history.length - missing).map((point, i, points) =>
    i === points.length - 1 ? { ...point, position: add(point.position, [0, noise]) } : point);
  const line = fitLine(retained);
  const refit = future.map((_, i) => line.at(i + 8));
  const shift = distance(last(future), last(refit));
  return <Panel>
    <Split visual={<Map label="末端观测缺失和位置扰动改变线性外推"
      routes={[{ ...observed, opacity: .25 }, { points: retained.map(point => point.position), color: color.history, dots: true },
        base, { points: [line.at(7), ...refit], color: color.error, dashed: true }]}
      markers={[{ point: last(future), color: color.baseline }, { point: last(refit), color: color.error }]}
      arrows={[{ start: last(future), end: last(refit), color: color.error }]} />}>
      <div className="re-tag">专题衔接 · 线性基线实验</div>
      <h3>少几帧，起点和趋势可能一起变</h3>
      <p>从同一段历史移除最后若干点，保留原采样时刻。所有外推仍对齐到同一组未来时刻。</p>
      <div className="re-readout">第 12 步相差 {number(shift)} 米</div>
      <p>这一步只重算线性参考。完整模型在不完整观测下的表现，需要另外测量。</p>
    </Split>
    <div className="re-controls">
      <Slider label="移除末端点数" value={missing} min={0} max={3} change={setMissing} />
      <Slider label="最后保留点偏移（米）" value={noise} min={-.6} max={.6} step={.01} change={setNoise} />
    </div>
    <Legend items={[[ '保留观测', color.history ], [ '完整历史外推', color.baseline ], [ '受扰历史外推', color.error ]]} />
  </Panel>;
}

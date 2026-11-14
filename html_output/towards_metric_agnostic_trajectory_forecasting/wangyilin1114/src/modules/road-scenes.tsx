import { useState, type PointerEvent, type ReactNode } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { distance, distanceStep, endpoints, greedyCoverage, hit, nearest, objective, sampleRoad, startingPicks,
  type Point, type Sample } from './road-model';

export const mint = '#63e8b6';
export const gold = '#ffc875';
export const sky = '#81c6ff';
export const pink = '#f8a1bf';
const colors = [gold, sky, pink, mint];
const numerals = ['M-4 -5 L0 -9 V9 M-5 9 H5', 'M-6 -5 Q-4 -11 3 -9 Q9 -7 5 -1 L-6 9 H7',
  'M-6 -7 Q2 -12 6 -7 Q8 -3 2 -1 Q10 1 6 7 Q2 12 -6 7', 'M4 9 V-9 L-8 4 H8'];
const px = (p: Point) => 490 + p.x * 43;
const py = (p: Point) => 530 - p.y * 37;
const branchPaths = ['M490 535 L490 382 Q490 302 385 281 L115 206',
  'M490 535 L490 112', 'M490 535 L490 382 Q490 302 590 281 L866 206'];

export function WindowMark({ sample, scale, color = sky, opacity = .4 }: {
  sample: Sample; scale: number; color?: string; opacity?: number;
}) {
  const angle = sample.angle * Math.PI / 180;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const u = sx * 1.55 * scale, v = sy * .78 * scale;
    const point = { x: sample.x + u * Math.cos(angle) - v * Math.sin(angle),
      y: sample.y + u * Math.sin(angle) + v * Math.cos(angle) };
    return `${px(point)},${py(point)}`;
  });
  return <polygon points={corners.join(' ')} fill={color} fillOpacity={opacity * .24}
    stroke={color} strokeWidth="2" strokeOpacity={opacity} />;
}

export function Road({ children, samples = [], picks = [], truth, animate = 0, onMove, note = '模拟路口 · 教学数据' }: {
  children?: ReactNode; samples?: Sample[]; picks?: Point[]; truth?: Point; animate?: number;
  onMove?: (index: number, point: Point) => void; note?: string;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  function dragTo(event: PointerEvent<SVGSVGElement>) {
    if (drag === null || !onMove) return;
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    onMove(drag, { x: Math.max(-9, Math.min(9, (point.x - 490) / 43)),
      y: Math.max(3.5, Math.min(11, (530 - point.y) / 37)) });
  }
  return <svg viewBox="0 0 980 600" className="td-road" aria-label="俯视路口与候选终点"
    onPointerMove={dragTo} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
    <rect width="980" height="600" rx="28" fill="#102b2e" />
    <path d="M0 69 H980 M0 136 H980 M0 454 H980 M0 523 H980" stroke="#17383a" strokeWidth="2" />
    {[{ x: 137, y: 369 }, { x: 834, y: 369 }, { x: 190, y: 113 }, { x: 770, y: 113 }].map(p =>
      <g key={p.x} transform={`translate(${p.x} ${p.y})`}>
        <rect x="-60" y="-34" width="120" height="68" rx="12" fill="#214247" />
        <path d="M-37 11 V-11 H-4 V11 H34 V-11" fill="none" stroke="#345b5e" strokeWidth="4" />
      </g>)}
    {branchPaths.map(d => <path key={d} d={d} fill="none" stroke="#537273" strokeWidth="112" />)}
    {branchPaths.map(d => <path key={d} d={d} fill="none" stroke="#253e43" strokeWidth="101" />)}
    {branchPaths.map(d => <path key={d} d={d} fill="none" stroke="#91a6a5" strokeWidth="2" strokeDasharray="14 14" />)}
    <g stroke="#b5c8c4" strokeWidth="5" opacity=".7">
      {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${449 + i * 14} 422 v24`} />)}
    </g>
    <g fill="#a4c0be" textAnchor="middle" fontSize="28" fontWeight="650">
      <text x="112" y="172">左转</text><text x="490" y="54">直行</text><text x="866" y="172">右转</text>
    </g>
    <text x="31" y="563" fill="#a4c0be" fontSize="28">{note}</text>
    {samples.map((sample, i) => <circle key={i} cx={px(sample)} cy={py(sample)} r="4.3" fill={sky} opacity=".63" />)}
    {children}
    {picks.map((point, index) => <g key={index} transform={`translate(${px(point)} ${py(point)})`}
      className={onMove ? 'td-pick' : undefined} aria-label={`候选 ${index + 1}`}
      tabIndex={onMove ? 0 : undefined} onPointerDown={event => {
        if (!onMove || !event.isPrimary) return;
        event.preventDefault();
        event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
        setDrag(index);
      }} onKeyDown={event => {
        const delta = { ArrowUp: [0, .2], ArrowDown: [0, -.2], ArrowLeft: [-.2, 0], ArrowRight: [.2, 0] }[event.key];
        if (!delta || !onMove) return;
        event.preventDefault(); event.stopPropagation();
        onMove(index, { x: Math.max(-9, Math.min(9, point.x + delta[0])),
          y: Math.max(3.5, Math.min(11, point.y + delta[1])) });
      }}>
      <circle r="24" fill="#102b2e" stroke={colors[index]} strokeWidth="4" />
      <path d={numerals[index]} stroke={colors[index]} strokeWidth="3.3" strokeLinecap="round"
        strokeLinejoin="round" fill="none" />
    </g>)}
    {truth && <path d={`M${px(truth)} ${py(truth) - 14} l14 14 -14 14 -14 -14Z`} fill={mint} stroke="#102b2e" strokeWidth="3" />}
    <g transform={`translate(490 ${490 - animate * 42})`}>
      <rect x="-21" y="-32" width="42" height="64" rx="13" fill={mint} />
      <rect x="-15" y="-18" width="30" height="14" rx="5" fill="#14484a" />
      <rect x="-14" y="15" width="28" height="8" rx="3" fill="#2b8a76" />
    </g>
  </svg>;
}

export function Frame({ visual, children, flavor = '' }: { visual: ReactNode; children: ReactNode; flavor?: string }) {
  return <div className={`td-frame ${flavor}`}><div className="td-visual">{visual}</div><aside className="td-panel">{children}</aside></div>;
}

export function Range({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  return <label className="td-range"><span>{label}<strong>{Number(value.toFixed(2))}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} /></label>;
}

export function Choice({ items, current, select }: { items: string[]; current: number; select: (index: number) => void }) {
  return <div className="td-buttons">{items.map((item, index) => <button type="button" key={item}
    aria-pressed={current === index} onClick={() => select(index)}>{item}</button>)}</div>;
}

export function IntegerChoice({ label, value, values, onChange }: {
  label: string; value: number; values: number[]; onChange: (value: number) => void;
}) {
  return <div className="td-integer-choice" role="group" aria-label={label}>
    <span>{label}</span><Choice items={values.map(String)} current={values.indexOf(value)}
      select={index => onChange(values[index])} />
  </div>;
}

const coverSamples = sampleRoad(21);
const coverPicks = greedyCoverage(coverSamples, 3, 1).selected.map(row => row.point);

export function CoverDirect() {
  const { progress } = useCoverPlayback();
  return <Road samples={coverSamples} picks={startingPicks.slice(0, progress < .28 ? 1 : 3)}
    animate={progress} note="三条候选挤在同一侧" />;
}

export function CoverPolicy() {
  const { progress } = useCoverPlayback();
  return <Road samples={coverSamples} picks={coverPicks.slice(0, progress < .28 ? 1 : 3)}
    animate={progress} note="按窗口规则重新挑选" />;
}

export function Budget() {
  const [left, setLeft] = useState(24);
  const [budget, setBudget] = useState(2);
  const samples = sampleRoad(left);
  const picks = greedyCoverage(samples, budget, 1.25).selected.map(row => row.point);
  return <Frame visual={<Road samples={samples} picks={picks} animate={left / 59} />}>
    <h2>样本多，输出名额少</h2>
    <Range label="左转样本数" value={left} min={5} max={59} onChange={setLeft} />
    <IntegerChoice label="候选条数 K" value={budget} values={[1, 2, 3, 4]} onChange={setBudget} />
    <p className="td-number">{left} / {96 - left - 19} / 19</p>
    <p>蓝点是 96 个模型样本，圆圈是最终候选。改变输出名额，模型样本保持原样。</p>
  </Frame>;
}

export function Scoring() {
  const [actual, setActual] = useState(1);
  const [mode, setMode] = useState(0);
  const truth = { ...endpoints[actual], angle: [135, 90, 45][actual] };
  const picks = [{ x: -.4, y: 8.8 }, { x: .7, y: 9.45 }, { x: 5.8, y: 7.8 }];
  const winner = nearest(truth, picks);
  const matches = picks.map(p => hit(p, truth, 1.15));
  const firstHit = matches.indexOf(true);
  return <Frame visual={<Road picks={picks} truth={truth}>
    {mode === 0 ? <line x1={px(truth)} y1={py(truth)} x2={px(picks[winner])} y2={py(picks[winner])}
      stroke={mint} strokeWidth="6" /> : <WindowMark sample={truth} scale={1.15} color={mint} opacity={1} />}
  </Road>}>
    <h2>同一份输出，两种判法</h2>
    <Choice items={['minFDE', '窗口命中']} current={mode} select={setMode} />
    <Choice items={['左转', '直行', '右转']} current={actual} select={setActual} />
    <p className="td-number">{mode === 0 ? `${distance(truth, picks[winner]).toFixed(2)} m` : firstHit < 0 ? '全部落空' : `候选 ${firstHit + 1} 命中`}</p>
    <p>{mode === 0 ? '绿菱形是真实终点，连线指向最近候选。' : '编号代表置信度排序。同一窗口里，soft mAP 忽略较低置信度的重复命中。'}</p>
  </Frame>;
}

export function Training() {
  const [left, setLeft] = useState(23);
  const [actual, setActual] = useState(0);
  const probabilities = [left, 90 - left, 10];
  return <Frame visual={<div className="td-training"><Road samples={sampleRoad(left, probabilities)} truth={endpoints[actual]}
    note="绿菱形表示一次真实结果" /><div className="td-probabilities">{probabilities.map((value, index) =>
      <div key={index}><span>{['左转', '直行', '右转'][index]}</span><strong>{value}%</strong>
        <i style={{ width: `${value}%`, background: colors[index] }} /></div>)}</div></div>}>
    <h2>给真实结果多少概率</h2>
    <Range label="左转概率（%）" value={left} min={5} max={59} onChange={setLeft} />
    <Choice items={['左转', '直行', '右转']} current={actual} select={setActual} />
    <p className="td-number">{(-Math.log(probabilities[actual] / 100)).toFixed(2)}</p>
    <p>这是离散示例的负对数似然。真实结果分到的概率越低，损失越大。论文对连续轨迹用概率密度。</p>
  </Frame>;
}

export function DistanceLab() {
  const [picks, setPicks] = useState(startingPicks);
  const [steps, setSteps] = useState(0);
  const samples = sampleRoad(25);
  function iterate(count: number) {
    let next = picks;
    for (let i = 0; i < count; i++) next = distanceStep(samples, next);
    setPicks(next); setSteps(steps + count);
  }
  return <Frame visual={<Road samples={samples} picks={picks} onMove={(index, point) =>
    setPicks(picks.map((p, i) => i === index ? point : p))}>
    {samples.map((sample, index) => {
      const pick = nearest(sample, picks);
      return <line key={index} x1={px(sample)} y1={py(sample)} x2={px(picks[pick])} y2={py(picks[pick])}
        stroke={colors[pick]} opacity=".25" />;
    })}
  </Road>}>
    <h2>让每个样本靠近候选</h2>
    <p className="td-number">{objective(samples, picks).toFixed(2)} m</p>
    <p>每个样本只计到最近候选的距离，再对全部样本取平均。拖动圆圈，观察目标变化。</p>
    <div className="td-buttons"><button onClick={() => iterate(1)}>走一步</button><button onClick={() => iterate(20)}>迭代 20 步</button>
      <button onClick={() => { setPicks(startingPicks); setSteps(0); }}>重置</button></div>
    <p className="td-quiet">已迭代 {steps} 步 · 只更新终点，模型权重固定</p>
  </Frame>;
}

export function WindowLab() {
  const [step, setStep] = useState(1);
  const [scale, setScale] = useState(1);
  const samples = sampleRoad(24);
  const { selected, remaining } = greedyCoverage(samples, step, scale);
  const newest = selected[selected.length - 1];
  return <Frame visual={<Road samples={remaining} picks={selected.map(s => s.point)}>
    {selected.map((row, index) => row.newlyHit.map((sample, j) => <WindowMark key={`${index}-${j}`} sample={sample}
      scale={scale} color={colors[index]} opacity={index === selected.length - 1 ? .45 : .13} />))}
  </Road>}>
    <h2>先覆盖还没命中的窗口</h2>
    <IntegerChoice label="选取轮数" value={step} values={[0, 1, 2, 3, 4]} onChange={setStep} />
    <Range label="窗口尺寸倍率" value={scale} min={.55} max={1.5} step={.05} onChange={setScale} />
    <p className="td-number">{96 - remaining.length} / 96</p>
    <p>{newest ? `第 ${step} 个候选新增覆盖 ${newest.newlyHit.length} 个窗口，置信度 ${Math.round(newest.confidence * 100)}%。`
      : '把样本当作可能的真实终点，按各自航向放窗口。每轮选能落入最多剩余窗口的位置。'}</p>
  </Frame>;
}

export function Ranking() {
  const [soft, setSoft] = useState(0);
  const [confidence, setConfidence] = useState(.86);
  const rows = [{ text: '路口甲 · 命中', conf: .94, kind: 'tp' }, { text: '路口甲 · 重复命中', conf: confidence, kind: 'duplicate' },
    { text: '路口乙 · 落空', conf: .7, kind: 'fp' }, { text: '路口乙 · 命中', conf: .53, kind: 'tp' }]
    .sort((a, b) => b.conf - a.conf);
  const active = rows.filter(row => !(soft === 0 && row.kind === 'duplicate'));
  let hits = 0;
  const precisions = active.flatMap((row, i) => row.kind === 'tp' ? [++hits / (i + 1)] : []);
  const ap = precisions.reduce((sum, value) => sum + value, 0) / 2;
  return <Frame visual={<div className="td-rank"><div className="td-rank-head"><span>候选与路口</span><span>置信度</span><span>累计处理</span></div>
    {rows.map(row => <div key={row.text} className="td-rank-row"><span>{row.text}</span><b>{row.conf.toFixed(2)}</b>
      <strong className={row.kind === 'tp' ? 'td-good' : ''}>{row.kind === 'tp' ? '真阳性' : row.kind === 'duplicate' && soft === 0 ? '忽略' : '假阳性'}</strong></div>)}
    <p className="td-quiet">两个模拟路口 · AP 教学算法</p></div>}>
    <h2>把多个场景放在一起</h2>
    <Choice items={['soft mAP', 'mAP']} current={soft} select={setSoft} />
    <Range label="重复候选置信度" value={confidence} min={.21} max={.93} step={.01} onChange={setConfidence} />
    <p className="td-number">{ap.toFixed(3)}</p>
    <p>这里用两次命中时的精确率求平均，展示排序和重复命中的作用。官方评测还会跨样本汇总并按协议计算。</p>
  </Frame>;
}

export function Results() {
  const [metric, setMetric] = useState(0);
  const values = metric === 0 ? [[.3427, .4764], [.3401, .4921], [.3595, .5082]]
    : [[1.0520, 1.0824], [1.0874, 1.0374], [1.2236, 1.0200]];
  const limit = metric === 0 ? .55 : 1.35;
  return <Frame flavor="td-evidence" visual={<div className="td-bars">
    <header><b>Waymo 验证集</b><span>原始输出　／　指标策略</span></header>
    {values.map(([before, after], i) => <section key={i}>
      <h3>{['WTA', 'Traj-NLL', 'Step-NLL'][i]}</h3>
      {[before, after].map((value, j) => <div className="td-bar" key={j}><i style={{ width: `${value / limit * 100}%`,
        background: j === 0 ? '#7c9fac' : mint }} /><strong>{value.toFixed(4)}</strong></div>)}
    </section>)}
  </div>}>
    <h2>训练目标会改变策略收益</h2>
    <Choice items={['soft mAP ↑', 'minFDE ↓']} current={metric} select={setMetric} />
    <p>{metric === 0 ? '三种训练目标接窗口策略后都有提升。使用 Step-NLL 的模型最终得分最高。'
      : '距离策略改善了两种 NLL 模型的终点误差。WTA 的 minFDE 则小幅上升。'}</p>
    <p className="td-quiet">论文表 1 · DONUT · 拉普拉斯分布{metric === 1 ? ' · 单位 m' : ''}</p>
  </Frame>;
}

export function Shift() {
  const [bias, setBias] = useState(0);
  const [mode, setMode] = useState(1);
  const reality = sampleRoad(41);
  const belief = sampleRoad(41 - bias).map(p => p.x < -3 ? { ...p, x: p.x + bias * .075 } : p);
  const picks = greedyCoverage(belief, 2, 1.1).selected.map(row => row.point);
  const covered = (windows: Sample[]) => windows.filter(sample => picks.some(pick => hit(pick, sample, 1.1))).length;
  return <Frame visual={<Road samples={mode ? reality : belief} picks={picks}
    note={mode ? '蓝点表示真实分布 · 示意' : '蓝点表示模型分布 · 示意'} />}>
    <h2>分布偏了，选点也会偏</h2>
    <Range label="左转样本低估量" value={bias} min={0} max={36} onChange={setBias} />
    <Choice items={['模型分布', '真实分布']} current={mode} select={setMode} />
    <p className="td-number">{covered(belief)} → {covered(reality)} / 96</p>
    <p>从同一个模型分布选两点。切换视图看模型预期的命中数和现实中的命中数。</p>
  </Frame>;
}

import { useId, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathText } from '../components/MathText';
import './geometry-training.css';
import './interaction-workbenches.css';
import './training-vector-motion.css';

const initial = [0.3, 0.5, 0.1];
const target = [1, 0, 0];
const maxSteps = 6;
function evaluate(logits: number[]) {
  const max = Math.max(...logits);
  const weights = logits.map(value => Math.exp(value - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return { p: weights.map(value => value / sum), loss: max + Math.log(sum) - logits[0] };
}
const initialLoss = evaluate(initial).loss;
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(3)}`;

export function Clip07Update(_props: WidgetProps) {
  const id = useId().replace(/:/g, '');
  const [state, setState] = useState({ z: [...initial], losses: [initialLoss], rates: [] as number[], iteration: 0 });
  const [rate, setRate] = useState(0.5);
  const [inspected, setInspected] = useState<number | null>(null);
  const [previewed, setPreviewed] = useState<number | null>(null);
  const current = evaluate(state.z);
  const gradient = current.p.map((value, i) => value - target[i]);
  const nextLogits = state.z.map((value, i) => value - rate * gradient[i]);
  const done = state.iteration >= maxSteps;
  const shownStep = Math.min(previewed ?? inspected ?? state.iteration, state.iteration);
  const point = (index: number, loss: number) => ({ x: 50 + index * 55, y: 191 - loss / 1.5 * 156 });
  const area = `M 50 191 L ${state.losses.map((loss, index) => `${point(index, loss).x} ${point(index, loss).y}`).join(' L ')} L ${point(state.iteration, 0).x} 191 Z`;
  const previousLoss = state.losses[Math.max(0, state.iteration - 1)];
  const probabilityGain = (current.p[0] - Math.exp(-previousLoss)) * 100;

  const update = () => {
    setState(old => {
      if (old.iteration >= maxSteps) return old;
      const p = evaluate(old.z).p;
      const z = old.z.map((value, i) => value - rate * (p[i] - target[i]));
      return { z, losses: [...old.losses, evaluate(z).loss], rates: [...old.rates, rate], iteration: old.iteration + 1 };
    });
    setInspected(null);
    setPreviewed(null);
  };
  const reset = () => { setState({ z: [...initial], losses: [initialLoss], rates: [], iteration: 0 }); setRate(0.5); setInspected(null); setPreviewed(null); };

  return <div className="gt-lab gt-update-lab wb-update" onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="gt-lab-heading"><div><h3>从一次更新开始</h3><p>候选①是原始配对。点击更新，观察它的概率与损失。</p></div><button type="button" className="gt-reset" onClick={reset}>从头再试 ↺</button></div>

    <div className="gt-update-grid">
      <div className="gt-panel gt-gradient-panel">
        <div className="gt-panel-title"><div><span className="gt-mini-label">计算规则</span><h4>分数怎样更新</h4></div><span className="gt-pill"><MathText tex="y=[1,0,0]" /></span></div>
        <div className="gt-update-formula"><MathText display className="gt-live-formula" tex={String.raw`z^{\mathrm{new}}=z-${rate.toFixed(2)}\,(p-y)`} /></div>
        <p className="gt-update-explanation">原配的梯度为负；减去它，就会提高原配分数。</p>
        <details className="gt-details gt-gradient-details"><summary>查看三个候选的分数与梯度</summary>
        <div className="gt-gradient-table-wrap" tabIndex={0} role="region" aria-label="梯度计算表，可横向滚动"><table className="gt-gradient-table">
          <caption>{done ? '这里保留最终分数、概率与梯度，本轮不再继续更新。' : '分数经过 Softmax 得到概率；右侧预览在点击更新后才会生效。'}表格可左右滑动。</caption>
          <thead><tr><th scope="col">候选</th><th scope="col">当前 <MathText tex="z" /></th><th scope="col">概率 <MathText tex="p" /></th><th scope="col">梯度 <MathText tex="p-y" /></th>{!done && <th scope="col">下一步 <MathText tex="z" /></th>}</tr></thead>
          <tbody>{state.z.map((value, i) => <tr key={i} className={i === 0 ? 'gt-correct-row' : ''}><th scope="row">{['①', '②', '③'][i]}{i === 0 && <span>原配</span>}</th><td>{value.toFixed(3)}</td><td>{current.p[i].toFixed(3)}</td><td className={gradient[i] < 0 ? 'gt-negative-gradient' : 'gt-positive-gradient'}>{signed(gradient[i])}</td>{!done && <td><strong>{nextLogits[i].toFixed(3)}</strong><small>{gradient[i] < 0 ? '↑ 增加' : '↓ 减少'}</small></td>}</tr>)}</tbody>
        </table></div></details>
      </div>

      <div className="gt-panel gt-trajectory-panel">
        <div className="gt-panel-title"><div><span className="gt-mini-label">动手更新</span><h4>观察概率与损失的变化</h4></div></div>
        <div className="gt-update-controls"><div className="gt-control-heading"><label htmlFor={`${id}-rate`}>学习率 <MathText tex={String.raw`\eta`} /><small>每一步迈多大</small></label><output>{rate.toFixed(2)}</output></div><input id={`${id}-rate`} className="gt-range" type="range" min={0.1} max={1} step={0.1} value={rate} disabled={done} onChange={event => setRate(Number(event.target.value))} /><p className="gt-microcopy">{done ? '重置后可换一个步长再试。' : '只影响接下来的更新。'}</p><button className="gt-primary-button" type="button" onClick={update} disabled={done}>{done ? '6 次更新完成 ✓' : '执行一次更新'}{!done && <span>→</span>}</button><div className="gt-update-step"><span>已执行 {state.iteration} / {maxSteps} 次</span><div aria-hidden="true">{Array.from({ length: maxSteps }, (_, index) => <i className={index < state.iteration ? 'gt-step-done' : ''} key={index} />)}</div></div></div>
        <div className="gt-update-feedback">
          <div className="gt-update-plot">
        <div className="gt-chart-label"><span>损失 · 越低越好</span><span>自然对数</span></div>
        <svg className="gt-loss-chart" viewBox="0 0 420 230" role="group" aria-label="实际损失随更新次数变化的曲线，每一个点可聚焦查看。">
          <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5365ad" stopOpacity="0.18" /><stop offset="100%" stopColor="#5365ad" stopOpacity="0" /></linearGradient></defs>
          {[0, 0.5, 1, 1.5].map(value => <g key={value}><line x1="50" x2="380" y1={point(0, value).y} y2={point(0, value).y} stroke="#dce5df" strokeDasharray={value === 0 ? undefined : '4 5'} /><text className="gt-svg-axis" x="36" y={point(0, value).y + 5} textAnchor="end">{value.toFixed(1)}</text></g>)}
          <path d={area} fill={`url(#${id}-area)`} />
          {state.losses.slice(1).map((loss,index)=>{const from=point(index,state.losses[index]),to=point(index+1,loss);return <path key={index} className="gt-update-segment" data-update={index+1} d={`M${from.x} ${from.y}L${to.x} ${to.y}`} pathLength="1" fill="none" stroke="#5365ad" strokeWidth="3" strokeLinecap="round"/>;})}
          {Array.from({ length: 7 }, (_, i) => <text className="gt-svg-axis" x={point(i, 0).x} y="215" textAnchor="middle" key={i}>{i}</text>)}
          {state.losses.map((loss, i) => <g key={i} className="gt-chart-point" role="button" tabIndex={0} aria-label={`第${i}次更新，损失${loss.toFixed(4)}，点击固定查看`} aria-pressed={inspected === i} onPointerEnter={() => setPreviewed(i)} onPointerLeave={() => setPreviewed(null)} onFocus={() => setPreviewed(i)} onBlur={() => setPreviewed(null)} onClick={() => setInspected(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setInspected(i); } }}>
            <circle cx={point(i, loss).x} cy={point(i, loss).y} r="15" fill="transparent" /><circle className={`gt-chart-marker${i > 0 ? ' gt-update-new-point' : ''}`} cx={point(i, loss).x} cy={point(i, loss).y} r={shownStep === i ? 6 : 4} fill={shownStep === i ? '#bd9254' : '#5365ad'} stroke="#ffffff" strokeWidth="2" />
          </g>)}
        </svg>
        <div className="gt-chart-readout" aria-live="polite"><span>第 {shownStep} 步损失</span><strong>{state.losses[shownStep].toFixed(4)}</strong><span>{shownStep === 0 ? '更新前的起点' : `本步学习率 ${state.rates[shownStep - 1].toFixed(2)}`}</span></div>
        <div className="gt-chart-controls"><span>每次更新只新增一段；悬停预览，点击固定。</span>{inspected !== null && <button type="button" className="gt-reset" onClick={() => { setInspected(null); setPreviewed(null); }}>查看最新一步</button>}</div>
          </div>
          <div className="gt-update-numbers">
        <div className="gt-current-stats" aria-live="polite" aria-atomic="true"><div><span>当前原配概率</span><strong>{(current.p[0] * 100).toFixed(1)}<small>%</small></strong>{state.iteration > 0 && <small className="gt-update-change">本步 +{probabilityGain.toFixed(1)} 个百分点</small>}</div><div><span>当前交叉熵</span><strong>{current.loss.toFixed(3)}</strong><small><MathText tex={String.raw`-\ln p_1`} /></small>{state.iteration > 0 && <small className="gt-update-change">本步下降 {(previousLoss - current.loss).toFixed(3)}</small>}</div></div>
        <div className="gt-update-distribution" role="group" aria-label="本次更新后三个候选的概率分配">
          <div className="gt-update-distribution-rail" aria-hidden="true">{current.p.map((probability,i)=><i key={i} style={{width:`${probability*100}%`}}/>)}</div>
          <div className="gt-update-distribution-labels">{current.p.map((probability,i)=><span key={i}>{['① 原配','②','③'][i]}<b>{(probability*100).toFixed(1)}%</b></span>)}</div>
        </div>
          </div>
        </div>
      </div>
    </div>
    <div className="gt-insight" aria-live="polite"><span className="gt-insight-icon">↗</span><div><strong>{state.iteration === 0 ? '从一个答错的起点开始' : done ? '六次更新已完成' : `第 ${state.iteration} 次更新已完成`}</strong><p>{state.iteration === 0 ? '初始最高分属于候选②。更新会提高原配①的分数，让损失下降。' : done ? '重置后换一个学习率，可以比较下降速度。' : '原配概率提高，损失下降。展开梯度表，可以核对下一步的计算。'}</p></div></div>
    <p className="gt-method-note">这里只优化三个 logit；真实 CLIP 还会将梯度传回编码器与投影参数。</p>
  </div>;
}

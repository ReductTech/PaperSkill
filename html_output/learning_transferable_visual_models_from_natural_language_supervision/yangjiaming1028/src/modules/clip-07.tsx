import { useId, useState } from 'react';
import type { WidgetProps } from './registry';
import { MathText } from '../components/MathText';
import './geometry-training.css';
import './interaction-workbenches.css';

type Direction = 'row' | 'column';
const initial = [[0.6, 0.4, 0.1], [0.2, 0.7, 0.3], [0.1, 0.2, 0.8]];
const names = ['猫', '狗', '汽车'];
const ordinals = ['①', '②', '③'];
const clone = (matrix: number[][]) => matrix.map(row => [...row]);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const percent = (value: number) => value > 0 && value < 0.001 ? '<0.1' : value < 1 && value > 0.999 ? '>99.9' : (value * 100).toFixed(1);
function distribution(scores: number[], tau: number, target: number) {
  const logits = scores.map(score => score / tau);
  const max = Math.max(...logits);
  const weights = logits.map(value => Math.exp(value - max));
  const sum = weights.reduce((a, b) => a + b, 0);
  return { probabilities: weights.map(value => value / sum), loss: max + Math.log(sum) - logits[target], logits };
}

export function Clip07(_props: WidgetProps) {
  const id = useId().replace(/:/g, '');
  const [matrix, setMatrix] = useState(() => clone(initial));
  const [tau, setTau] = useState(0.2);
  const [direction, setDirection] = useState<Direction>('row');
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const [scenario, setScenario] = useState('aligned');
  const rows = matrix.map((row, i) => distribution(row, tau, i));
  const columns = matrix.map((_, j) => distribution(matrix.map(row => row[j]), tau, j));
  const rowMean = mean(rows.map(row => row.loss));
  const columnMean = mean(columns.map(column => column.loss));
  const total = (rowMean + columnMean) / 2;
  const current = direction === 'row' ? rows[active] : columns[active];
  const scores = direction === 'row' ? matrix[active] : matrix.map(row => row[active]);
  const highest = Math.max(...scores);
  const wrongLeader = highest > scores[active] + 1e-9;
  const equal = scores.every(value => Math.abs(value - scores[0]) < 1e-9);
  const tiedTop = !wrongLeader && scores.filter(value => Math.abs(value - highest) < 1e-9).length > 1;
  const selectedValue = matrix[selected[0]][selected[1]];
  const currentText = direction === 'row' ? `图片${ordinals[active]} → 文字` : `文字${ordinals[active]} → 图片`;
  const originalProbabilityTex = `${direction === 'row' ? 'p' : 'q'}_{${active + 1}${active + 1}}`;
  const originalProbabilityMeaning = direction === 'row'
    ? `固定图片 ${active + 1} 时，分给原配文字 ${active + 1} 的概率；按这一行的全部候选归一化，每行概率和为 1。`
    : `固定文字 ${active + 1} 时，分给原配图片 ${active + 1} 的概率；按这一列的全部候选归一化，每列概率和为 1。`;

  const chooseDirection = (value: Direction) => { setDirection(value); setActive(selected[value === 'row' ? 0 : 1]); };
  const chooseCell = (i: number, j: number) => { setSelected([i, j]); setActive(direction === 'row' ? i : j); };
  const edit = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.round(Math.max(-1, Math.min(1, value)) * 100) / 100;
    setMatrix(old => old.map((row, i) => row.map((cell, j) => i === selected[0] && j === selected[1] ? next : cell)));
    setScenario('custom');
  };
  const applyScenario = (value: string) => {
    setMatrix(value === 'wrong' ? [[0.35, 0.8, 0.1], [0.2, 0.7, 0.3], [0.1, 0.2, 0.8]] : value === 'equal' ? Array.from({ length: 3 }, () => [0.3, 0.3, 0.3]) : clone(initial));
    setScenario(value); setDirection('row'); setActive(0); setSelected([0, 0]);
  };

  return <div className="gt-lab gt-loss-lab wb-loss" onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="gt-lab-heading"><div><h3>改一个分数，观察损失</h3><p>对角线是原始配对。点选分数，再用结果区的滑块调整。</p></div><button type="button" className="gt-reset" onClick={() => { applyScenario('aligned'); setTau(0.2); }}>重置实验 ↺</button></div>

    <div className="gt-training-grid">
      <div className="gt-panel gt-matrix-panel">
        <div className="gt-panel-title"><div><span className="gt-mini-label">操作区</span><h4>选择与调整</h4></div></div>
        <div className="gt-scenario-bar"><div className="gt-preset-group" role="group" aria-label="训练矩阵示例">{[{ id: 'aligned', text: '原配领先' }, { id: 'wrong', text: '一次错配' }, { id: 'equal', text: '全部相同' }].map(item => <button key={item.id} type="button" className="gt-preset" aria-pressed={scenario === item.id} onClick={() => applyScenario(item.id)}>{item.text}</button>)}</div></div>
        <div className="wb-live-pair" aria-live="polite"><span>完整双向损失</span><strong>{total.toFixed(4)}</strong></div>
        <div className="gt-segmented" role="group" aria-label="归一化方向"><button type="button" aria-pressed={direction === 'row'} onClick={() => chooseDirection('row')}>按行 · 图 → 文</button><button type="button" aria-pressed={direction === 'column'} onClick={() => chooseDirection('column')}>按列 · 文 → 图</button></div>
        <div className="gt-matrix-scroll" tabIndex={0} role="region" aria-label="相似度矩阵，可横向滚动"><div className="gt-matrix" role="group" aria-label="可编辑的图文相似度矩阵">
          <span className="gt-matrix-corner">图 ↓ 文 →</span>
          {names.map((name, j) => <button key={`col-${j}`} className="gt-matrix-header" type="button" aria-pressed={direction === 'column' && active === j} onClick={() => { setDirection('column'); setActive(j); setSelected([selected[0], j]); }}><span>文字{ordinals[j]}</span><strong>{name}</strong></button>)}
          {matrix.map((row, i) => <div key={i} className="gt-matrix-row">
            <button className="gt-matrix-header" type="button" aria-pressed={direction === 'row' && active === i} onClick={() => { setDirection('row'); setActive(i); setSelected([i, selected[1]]); }}><span>图片{ordinals[i]}</span><strong>{names[i]}</strong></button>
            {row.map((value, j) => <button key={j} type="button" className={`gt-matrix-cell${i === j ? ' gt-original' : ''}${(direction === 'row' ? i === active : j === active) ? ' gt-in-slice' : ''}`} aria-pressed={selected[0] === i && selected[1] === j} aria-label={`图片${i + 1}${names[i]}，文字${j + 1}${names[j]}，相似度${value.toFixed(2)}${i === j ? '，原始配对' : '，非原始配对'}`} onClick={() => chooseCell(i, j)}><strong>{value.toFixed(2)}</strong>{i === j && <span>原配 ✓</span>}</button>)}
          </div>)}
        </div></div>
        <p className="gt-scroll-tip">窄屏可以左右滑动矩阵，完整查看文字与分数。</p>
      </div>

      <div className="gt-panel gt-probability-panel">
        <div className="gt-panel-title"><div><span className="gt-mini-label">结果区 · 当前{direction === 'row' ? '行' : '列'}</span><h4>{currentText}</h4></div><span className={`gt-pill${wrongLeader ? ' gt-pill-warning' : ''}`}>{wrongLeader ? '最高分是错配' : equal ? '暂时无法区分' : tiedTop ? '原配并列最高' : '原配领先'}</span></div>
        <div className="gt-cell-editor"><div className="gt-control-heading"><label htmlFor={`${id}-score`}>调整 <MathText tex={`s_{${selected[0] + 1},${selected[1] + 1}}`} /><small>{selected[0] === selected[1] ? ' 原始配对' : ' 非原始配对'}</small></label><output>{selectedValue.toFixed(2)}</output></div><input id={`${id}-score`} className="gt-range" type="range" min={-1} max={1} step={0.01} value={selectedValue} onChange={event => edit(Number(event.target.value))} /><div className="gt-range-ends"><span>−1</span><span>余弦相似度</span><span>1</span></div></div>
        <div className="gt-temperature"><div className="gt-control-heading"><label htmlFor={`${id}-tau`}>温度 <MathText tex={String.raw`\tau`} /></label><output>{tau.toFixed(2)}</output></div><input id={`${id}-tau`} className="gt-range gt-range-orange" type="range" min={0.05} max={1} step={0.01} value={tau} onChange={event => setTau(Number(event.target.value))} /><div className="gt-range-ends"><span>0.05 更集中</span><span>1.00 更平缓</span></div><p className="gt-microcopy">切换示例保留温度，便于比较。</p></div>
        <div className="gt-current-stats"><div><span>原始配对概率</span><strong>{percent(current.probabilities[active])}<small>%</small></strong></div><div><span>当前单项损失</span><strong>{current.loss.toFixed(3)}</strong><small><MathText tex={String.raw`-\ln ${originalProbabilityTex}`} symbols={[{sym:originalProbabilityTex,tex:originalProbabilityTex,desc:originalProbabilityMeaning}]} /></small></div></div>
        <div className="gt-probabilities">{current.probabilities.map((probability, i) => <div key={i} className={`gt-prob-row${i === active ? ' gt-target-prob' : ''}`}>
          <div className="gt-prob-label"><span>{direction === 'row' ? '文字' : '图片'}{ordinals[i]} · {names[i]} {i === active && <em>原配</em>}</span><strong>{percent(probability)}%</strong></div>
          <div className="gt-prob-track"><div className={i === active ? 'gt-target-fill' : wrongLeader && scores[i] === highest ? 'gt-warning-fill' : ''} style={{ width: `${probability * 100}%` }} /></div>
        </div>)}</div>
        <details className="gt-details gt-logit-details"><summary>查看温度怎样缩放分数</summary><p className="gt-microcopy">先把相似度除以温度，再对当前{direction === 'row' ? '行' : '列'}的三个分数做 Softmax。</p>{scores.map((score, i) => <div className="gt-prob-logit" key={i}><span>候选{ordinals[i]}</span><MathText tex={String.raw`z_{${i + 1}}=\frac{${score.toFixed(2)}}{${tau.toFixed(2)}}\approx ${current.logits[i].toFixed(2)}`} /></div>)}</details>
      </div>
    </div>

    <div className="gt-total-result" aria-label="完整双向交叉熵，两个方向的平均值"><div className="gt-total-loss"><span>完整双向损失 · 越低越好</span><strong>{total.toFixed(4)}</strong></div><MathText tex={String.raw`L=\frac{L_{I\to T}+L_{T\to I}}{2}`} /></div>
    <details className="gt-details"><summary>核对两个方向与每一项损失</summary><div className="gt-loss-averages"><div><span>图 → 文 · 3 行平均</span><strong>{rowMean.toFixed(4)}</strong></div><div><span>文 → 图 · 3 列平均</span><strong>{columnMean.toFixed(4)}</strong></div></div><p className="gt-microcopy">切换查看的行或列，不会改变这些完整损失。损失使用自然对数计算。</p><div className="gt-loss-breakdown"><div className="gt-breakdown-row gt-breakdown-heading"><span>原始配对</span><span>图片找文字</span><span>文字找图片</span></div>{names.map((name, i) => <div className="gt-breakdown-row" key={name}><span>{ordinals[i]} {name}</span><strong>{rows[i].loss.toFixed(4)}</strong><strong>{columns[i].loss.toFixed(4)}</strong></div>)}</div></details>
    <div className={`gt-insight${wrongLeader ? ' gt-insight-warning' : ''}`} aria-live="polite"><span className="gt-insight-icon">{wrongLeader ? '!' : '↗'}</span><div><strong>{wrongLeader ? '低温度会放大错误高分' : equal ? '同分时，温度无法创造区别' : '温度改变集中程度，不改变排序'}</strong><p>{wrongLeader ? '当前最高分是错配。温度足够低时，概率会集中到它身上；高置信度不保证正确。' : equal ? '三个候选各占三分之一。先改变分数，模型才能区分它们。' : tiedTop ? '原配与其他候选同分，温度不能打破这个平局。' : '调低温度，高分候选会获得更多概率。再试“一次错配”，观察区别。'}</p></div></div>
    <p className="gt-method-note">教学分数不来自真实 CLIP；自由编辑的矩阵不保证能由同一组图文向量实现。</p>
  </div>;
}

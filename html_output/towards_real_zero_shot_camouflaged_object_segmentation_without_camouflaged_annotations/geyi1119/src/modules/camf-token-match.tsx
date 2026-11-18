import { useState } from 'react';
import { Feedback, Range, Term, fmt } from './camf-kit';
export function TokenMatchScene() {
  const [score, setScore] = useState(.2);
  const [positions, setPositions] = useState(4);
  const raw = [0, score, .55, 1];
  const minimum = Math.min(...raw);
  const maximum = Math.max(...raw);
  const normalized = raw.map(value => (value - minimum) / (maximum - minimum));
  const threshold = 1 / positions;
  const sparse = normalized.map(value => value >= threshold ? value : 0);
  const exp = sparse.map(Math.exp);
  const total = exp.reduce((sum, value) => sum + value, 0);
  const weights = exp.map(value => value / total);
  const result = weights.reduce((sum, value, index) => sum + value * index, 0);
  const rows: { label: string; values: number[] }[] = [{ label: '原始点积分数', values: raw }, { label: '按行 min-max', values: normalized }, { label: '阈值置零', values: sparse }, { label: 'softmax 权重', values: weights }];
  return <div className="camf-page"><div className="camf-controls"><Range label="第二条观察的原始分数" value={score} min={0} max={1} step={.05} onChange={setScore} /><label>视觉位置数 Lᵥ <select aria-label="视觉位置数" value={positions} onChange={event => setPositions(Number(event.target.value))}>{[2, 4, 8].map(value => <option key={value}>{value}</option>)}</select></label></div>
    <div className="camf-matrix"><div /><b>背景</b><b>轮廓</b><b>纹理</b><b>整体</b>{rows.map(({ label, values }) => <div className="camf-matrix-row" key={label}><b>{label}</b>{values.map((value, index) => <span key={index} style={{ background: `rgba(39,68,110,${.04 + value * .14})` }}>{fmt(value)}</span>)}</div>)}</div>
    <div className="camf-equation"><Term meaning="τ：分数稀疏化阈值，等于视觉位置数的倒数">τ</Term> = 1 / <Term meaning="Lv：此教学算例的视觉位置数">Lᵥ</Term> = {fmt(threshold)}　 <Term meaning="A：softmax权重乘以token内容u的加权输出">A</Term> = {fmt(result)}</div>
    <p>合成观察卡 u = [0, 1, 2, 3]。原始分数包含 0 与 1，此例 min-max 数值不变，并非所有输入都如此。</p><Feedback tone="green">{normalized[1] < threshold ? '第二项低于阈值，分数置零' : '第二项达到阈值，分数保留'}；权重 {fmt(weights[1])}。背景项分数为 0，仍有 {fmt(weights[0])} 权重，因为 exp(0) = 1。</Feedback></div>;
}

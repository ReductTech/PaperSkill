import React, { useState } from 'react';
import { Feedback, softmax } from './coop-kit';
import { useAnimatedNumbers } from './motion-hooks';
import { SamplePortrait } from './learning-visuals';
import { Latex } from './formula-math';
import './competition-reference.css';

const names = ['猫', '狗', '花'];
const colors = ['#285b86', '#8b6db1', '#ed8754'];
const initial = softmax([2, 1, 0]);

export const ProbabilityLab: React.FC = () => {
  const [dogScore, setDogScore] = useState(1);
  const [compare, setCompare] = useState(false);
  const [shownDog] = useAnimatedNumbers([compare ? 1 : dogScore], 620);
  const scores = [2, compare ? 1 : dogScore, 0];
  const probabilities = softmax(scores);
  const shownScores = [2, shownDog, 0];
  const shownProbabilities = softmax(shownScores);
  const shownLoss = -Math.log(shownProbabilities[0]);
  const loss = -Math.log(probabilities[0]);
  const delta = (shownProbabilities[0] - initial[0]) * 100;
  const weights = scores.map(score => Math.exp(score));
  const sum = weights.reduce((total, value) => total + value, 0);
  const starts = shownProbabilities.map((_, i) => shownProbabilities.slice(0, i).reduce((total, value) => total + value, 0) * 1000);
  const updateScore = (value: number) => { setCompare(false); setDogScore(Math.max(-1, Math.min(4, Math.round(value * 10) / 10))); };
  const changed = dogScore !== 1;
  const challenge = compare ? '正在对照初始；回到我的实验后继续调整。' : dogScore < 2 ? '点狗卡上的「＋」，让狗追上并反超猫。' : dogScore === 2 ? '现在并列了。再加一次，看看猫的份额怎样变化。' : '狗已反超，预测却错了。猫的分数始终是 2，概率却下降了。';

  return <div className="cr-lab cr-probability" onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <div className="cr-premise"><span className="cr-simulation">数学模拟</span><p>假设训练图片的正确标签是<strong>猫</strong>。只改狗的分数，看看谁会分走概率。</p></div>
    <div className="cr-competition" data-comparing={compare}>
      <div className="cr-candidates">
        {names.map((name, i) => <section className={'cr-candidate cr-candidate-' + i} key={name} style={{ '--cr-color': colors[i] } as React.CSSProperties}>
          <div className="cr-candidate-name"><span className="cr-portrait"><SamplePortrait kind={i} /></span><div><strong>{name}</strong><span>{i === 0 ? '正确类别' : i === 1 ? '由你调整' : '另一候选'}</span></div></div>
          <div className="cr-score"><span>分数</span><strong data-testid={'score-' + i}>{shownScores[i].toFixed(1)}</strong></div>
          {i === 1 ? <div className="cr-score-actions"><button type="button" aria-label="狗的分数减少 0.5" disabled={compare || dogScore <= -1} onClick={() => updateScore(dogScore - .5)}>−</button><span>每次 0.5</span><button type="button" className="cr-plus" aria-label="狗的分数增加 0.5" disabled={compare || dogScore >= 4} onClick={() => updateScore(dogScore + .5)}>＋</button></div> : <div className="cr-score-locked"><span aria-hidden="true">●</span> 保持不变</div>}
          <div className="cr-card-probability"><strong data-testid={'probability-' + i}>{(shownProbabilities[i] * 100).toFixed(2)}<small>%</small></strong><span>当前概率</span></div>
        </section>)}
      </div>
      <div className="cr-pool" aria-label="三个类别共同分配百分之百的概率">
        <div className="cr-pool-heading"><strong>同一份 100%，重新分配</strong><span>色带宽度 = 概率份额</span></div>
        <div className="cr-pool-diagram"><svg viewBox="0 0 1000 145" preserveAspectRatio="none" aria-hidden="true" className="cr-pool-svg">
          <defs><clipPath id="cr-pool-clip"><rect x="0" y="67" width="1000" height="76" rx="15" /></clipPath></defs>
          {shownProbabilities.map((probability, i) => {
            const start = starts[i], width = probability * 1000, origin = [166, 500, 834][i];
            return <g key={i}><path d={'M' + (origin - 40) + ' 0 C' + (origin - 40) + ' 38 ' + start + ' 28 ' + start + ' 67 L' + (start + width) + ' 67 C' + (start + width) + ' 28 ' + (origin + 40) + ' 38 ' + (origin + 40) + ' 0Z'} fill={colors[i]} opacity=".13" /><rect data-probability={probability} x={start} y="67" width={width} height="76" fill={colors[i]} clipPath="url(#cr-pool-clip)" />{i > 0 && <path d={'M' + start + ' 76V134'} stroke="#fffaf2" strokeWidth="3" />}</g>;
          })}
        </svg><div className="cr-band-readout" aria-hidden="true">{shownProbabilities.map((p, i) =>
          <div key={names[i]} style={{ width: (p * 100) + '%' }}><span>{names[i]} {(p * 100).toFixed(1)}%</span></div>
        )}</div></div>
        <div className="cr-pool-legend">{names.map((name, i) => <span key={name}><i style={{ background: colors[i] }} />{name}</span>)}</div>
      </div>
      <div className="cr-consequence">
        <div><span>猫的分数不变</span><strong>2.0 <small>→</small> 2.0</strong></div>
        <div><span>猫的概率 · 相比初始</span><strong className={delta < -.01 ? 'cr-negative' : ''} data-testid="cat-change">{delta > .005 ? '+' : delta < -.005 ? '−' : ''}{Math.abs(delta).toFixed(2)}<small>百分点</small></strong></div>
        <div><span>猫的损失 · 越小越好</span><strong data-testid="cat-loss">{shownLoss.toFixed(4)}</strong><small>初始 {(-Math.log(initial[0])).toFixed(4)}</small></div>
      </div>
      <div className="cr-challenge" aria-live="polite"><span className={'cr-challenge-mark' + (dogScore > 2 && !compare ? ' cr-complete' : '')}>{dogScore > 2 && !compare ? '✓' : '↗'}</span><p>{challenge}</p></div>
      <div className="cr-comparison-actions"><button type="button" className="chip" disabled={!changed} aria-pressed={compare} onClick={() => setCompare(value => !value)}>{compare ? '回到我的实验' : '对照初始状态'}</button><button type="button" className="cr-text-button" disabled={!changed} onClick={() => { setDogScore(1); setCompare(false); }}>重新开始</button></div>
    </div>
    <Feedback tone={compare || dogScore === 1 ? 'neutral' : dogScore > 1 ? 'bad' : 'good'}>
      {scores[1] === 2 ? '猫与狗同分，因此概率也相等；这里不强行指定唯一预测。' : scores[1] > 2 ? '最高分属于狗，预测错误；正确标签仍然是猫。' : '当前预测猫，但概率不足 100%，所以损失仍大于 0。'}
      {' '}损失 = −ln(猫的概率)，越小越好。狗分数升高，猫的概率下降，损失就会上升。
    </Feedback>
    <details className="cr-details"><summary>拆开计算：分数怎样变成份额？</summary>
      <p>这里的分数已经包含温度缩放。分数可以为负；它们不需要加起来等于 1。</p>
      <div className="cr-calculation">
        <div><b>01</b><p>先取指数，得到正权重</p><strong>猫 {weights[0].toFixed(3)}<br />狗 {weights[1].toFixed(3)}<br />花 {weights[2].toFixed(3)}</strong></div>
        <div><b>02</b><p>三类相加，共用分母</p><strong>{sum.toFixed(3)}</strong><span>狗分数升高，这个总量增大。</span></div>
        <div>
          <b>03</b><p>用猫的权重除以总权重</p>
          <div className="cr-substitution"><Latex tex={String.raw`\dfrac{${weights[0].toFixed(3)}}{${sum.toFixed(3)}} \approx ${(probabilities[0] * 100).toFixed(2)}\%`} /></div>
          <span>猫的损失为 {loss.toFixed(4)}</span>
        </div>
      </div>
      <label className="cr-precise-control" htmlFor="coop-dog-score">自由探索狗的分数 <strong>{dogScore.toFixed(1)}</strong><input id="coop-dog-score" type="range" min="-1" max="4" step="0.1" value={dogScore} aria-label="狗类别的分类分数" onChange={event => updateScore(Number(event.target.value))} /></label>
      <p className="note">计算使用完整精度，显示值经过四舍五入。这里手动改分数以拆解 softmax；真实 CoOp 更新上下文 V，间接改变分数。依据论文第 5 页式（1）、式（3）与 Training；这些数值是教学模拟，不是论文准确率。</p>
    </details>
  </div>;
};

export default ProbabilityLab;

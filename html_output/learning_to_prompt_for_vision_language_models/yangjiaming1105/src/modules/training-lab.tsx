import { useState } from 'react';
import { C, Feedback } from './coop-kit';
import { FeaturePlot, LossCurve } from './learning-visuals';
import { toyModel } from './coop-model';
import { Formula } from '../components/Formula';
import { Latex } from './formula-math';
import type { FormulaDef } from '../types';

type Vec = [number, number];
type LossPoint = { step: number; loss: number };
const ETA = 0.15;
const STAGES = ['前向计算', '计算损失', '计算梯度', '更新上下文'];
const CLASSES = ['猫（正确类别）', '狗', '花'];
const COLORS = [C.blue, C.purple, C.orange];
const fmt = (n: number) => n.toFixed(4);
const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(4)}`;
const pair = (v: Vec) => `[${fmt(v[0])}, ${fmt(v[1])}]`;
const percent = (n: number) => `${(n * 100).toFixed(2)}%`;

const scoreGradient: FormulaDef = {
  lead: '对每个候选类别，比较模型给它的概率与真实标签。两者的差就是损失对该类分数的导数。',
  lines: [
    { label: '分数的梯度', tex: String.raw`\frac{\partial \sym{loss}}{\partial \sym{score}} = \sym{prob} - \sym{target}` },
  ],
  symbols: {
    loss: { tex: 'L', name: '分类损失', desc: '对这张标注为猫的图片，损失是猫的预测概率取负自然对数。' },
    score: { tex: 'z_i', name: '类别分数', desc: '送入 softmax 前，第 i 个候选类别的匹配分数。' },
    prob: { tex: 'p_i', name: '分类概率', desc: 'softmax 后，第 i 类获得的概率份额。' },
    target: { tex: String.raw`\mathbf{1}_{i=y}`, name: '正确类别指示量', desc: '类别 i 等于正确类别 y 时取 1，其余类别取 0。本例中只有猫取 1。' },
  },
};

export function TrainingLab() {
  const [V, setV] = useState<Vec>([0, 0]);
  const [stage, setStage] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [previous, setPrevious] = useState<Vec | null>(null);
  const [trace, setTrace] = useState<LossPoint[]>([{ step: 0, loss: toyModel([0, 0], 0).loss }]);
  const current = toyModel(V, 0);
  const sourceV = stage === 3 && previous ? previous : V;
  const source = toyModel(sourceV, 0);
  const sum: Vec = source.perClassGrad.reduce<Vec>((acc, v) => [acc[0] + v[0], acc[1] + v[1]], [0, 0]);
  const changedLoss = current.loss - source.loss;
  const chartVisible = stage >= 1 || iteration > 0;
  const maxLoss = Math.max(toyModel([0, 0], 0).loss * 1.15, ...trace.map(p => p.loss * 1.1), 0.1);

  function next() {
    if (stage === 2) {
      const result = toyModel(V, 0);
      const nextV: Vec = [V[0] - ETA * result.gradient[0], V[1] - ETA * result.gradient[1]];
      setPrevious([V[0], V[1]]);
      setV(nextV);
      setIteration(iteration + 1);
      setTrace(points => [...points, { step: iteration + 1, loss: toyModel(nextV, 0).loss }].slice(-10));
      setStage(3);
    } else if (stage === 3) {
      setPrevious(null); setExpanded(false); setStage(0);
    } else {
      setStage(stage + 1);
    }
  }
  function reset() {
    setV([0, 0]); setStage(0); setIteration(0); setPrevious(null); setExpanded(false);
    setTrace([{ step: 0, loss: toyModel([0, 0], 0).loss }]);
  }
  const feedback = stage === 0
    ? '前向计算就是使用当前 V 算出预测。已知这张训练图片是猫，所以接下来检查模型给猫的概率；此时 V 还没有更新。'
    : stage === 1
      ? '损失把“给正确答案的概率太低”变成一个惩罚数值。这里越小越好；计算损失仍不会修改 V，也不能把它当成准确率。'
      : stage === 2
        ? '梯度描述当前位置附近的变化方向。正梯度对应向小调，负梯度对应向大调；乘以学习率决定步长。这一步只算方向，点击下一步才修改 V。'
        : `第 ${iteration} 次只更新了 V，随后用新 V 重新计算概率与损失。${changedLoss < -1e-8 ? '这张训练图片的损失下降了' : changedLoss > 1e-8 ? '这张训练图片的损失上升了' : '这张训练图片的损失基本不变'}；这不能直接说明未见测试图片的准确率。`;

  return <div>
    <div className="ctrl"><strong>教学模拟 · 非真实 CLIP 推理</strong><span>训练图片及标签：猫</span><span>学习率 η = {ETA}</span></div>
    <ol className="training-steps" aria-label="一次训练的四个阶段" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: 0, listStyle: 'none', margin: '12px 0' }}>
      {STAGES.map((name, i) => <li key={name} className={`chip ${stage === i ? 'selected' : ''}`} aria-current={stage === i ? 'step' : undefined} style={{ cursor: 'default' }}>{i + 1} · {name}</li>)}
    </ol>
    <div className="step-ctrl">
      <button className="tiny" onClick={next}>{['下一步：计算损失', '下一步：计算梯度', '执行一次更新', '开始下一轮'][stage]}</button>
      <button className="tiny ghost" onClick={reset}>重置训练</button>
      <span className="step-label">已更新 <b>{iteration}</b> 次</span>
    </div>
    <div className="lv-stage">
      <div className="lv-stage-title"><strong>{stage === 3 ? '提示改变，特征与损失一起响应' : '跟着训练，看提示如何学会'}</strong><span>只有上下文 V 参与更新</span></div>
      <div className="lv-two-panels"><div><FeaturePlot features={current.features} image={current.image} previous={stage === 3 ? source.features : undefined}/><p className="lv-figure-caption">文本特征移动 · 图像特征固定</p></div><LossCurve trace={trace} visible={chartVisible}/></div>
    </div>
    <div className="ctrl" aria-live="polite" style={{ alignItems: 'flex-start' }}>
      <strong style={{ width: '100%' }}>{stage + 1} · {['先看这张猫图片的预测', '把正确类别的概率换成损失', '计算两个数值该向哪边调', '跟算：旧值减去学习率乘梯度'][stage]}</strong>
      {stage === 0 && <>
        {CLASSES.map((name, i) => <span key={name} style={{ color: COLORS[i] }}>{name}：<strong>{percent(current.probs[i])}</strong></span>)}
        <span style={{ width: '100%' }}>本轮使用 V = {pair(V)}；三个概率总和为 100%。</span>
      </>}
      {stage === 1 && <>
        <span>猫的概率：<strong>{percent(current.probs[0])} = {fmt(current.probs[0])}</strong></span>
        <div className="training-substitution"><Latex tex={String.raw`L \approx -\ln\!\left(${fmt(current.probs[0])}\right) \approx ${fmt(current.loss)}`} /></div>
        <span>ln 表示自然对数；猫的概率越接近 1，这个损失越接近 0。</span>
      </>}
      {stage === 2 && <>
        {[0, 1].map(i => <div key={i} style={{ width: '100%' }}>
          <strong>V 的第 {i + 1} 个数：</strong>梯度 {signed(source.gradient[i])}，{Math.abs(source.gradient[i]) < 1e-8 ? '当前局部影响接近零' : `微小增大这个数会使损失局部${source.gradient[i] > 0 ? '增大' : '减小'}`}。
          <span> 本次计划{source.gradient[i] > 0 ? '减小' : '增加'} {fmt(Math.abs(ETA * source.gradient[i]))}。</span>
        </div>)}
        <span>计划改变量 = −{ETA} × 梯度；当前 V 仍为 {pair(V)}。</span>
      </>}
      {stage === 3 && <>
        {[0, 1].map(i => <div key={i} className="training-substitution">
          <small>第 {i + 1} 个数</small>
          <Latex tex={String.raw`${fmt(sourceV[i])} - ${ETA} \times (${signed(source.gradient[i])}) \approx ${fmt(V[i])}`} />
        </div>)}
        <span>猫的概率：{percent(source.probs[0])} → <strong>{percent(current.probs[0])}</strong></span>
        <span>损失：{fmt(source.loss)} → <strong>{fmt(current.loss)}</strong></span>
        <span style={{ width: '100%' }}>以上只为显示而四舍五入；实际更新使用完整精度。编码器权重始终固定。</span>
      </>}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', margin: '10px 0' }} aria-label="特征图与损失图图例">
      <span style={{ color: C.blue }}>● 猫文本特征</span><span style={{ color: C.purple }}>● 狗文本特征</span><span style={{ color: C.orange }}>● 花文本特征</span>
      <span>深色箭头：固定猫图片特征；{stage === 3 ? '空心圆：更新前的文本特征。' : '三个类别方向由同一组 V 共同影响。'}</span>
      <span>损失图：横轴是更新次数，纵轴是同一训练图片的损失（越小越好）；只保留最近 10 个点。{!chartVisible ? '计算损失后出现第 0 次记录。' : iteration === 0 ? '还没有更新，所以目前只有第 0 次的一个点。' : ''}</span>
    </div>
    <Feedback tone={stage === 3 ? (changedLoss < -1e-8 ? 'good' : changedLoss > 1e-8 ? 'bad' : 'neutral') : 'neutral'}>{feedback}</Feedback>
    {stage >= 2 && <div style={{ marginTop: '14px' }}>
      <button className="tiny ghost" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? '收起各类梯度' : '进阶：错误类别也贡献梯度吗？'}</button>
      {expanded && <div>
        <Formula formula={scoreGradient} />
        <p className="note">下表列出{stage === 3 ? '刚才更新前' : '当前'}三个类别各自的贡献。沿固定编码器继续求导，再把三条路径对共享 V 的影响相加。</p>
        <div style={{ overflowX: 'auto' }}><table className="paper" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 490 }}>
          <thead><tr><th>类别</th><th>概率 pᵢ</th><th>对分数的梯度</th><th>对 V 的梯度贡献</th></tr></thead>
          <tbody>{CLASSES.map((name, i) => <tr key={name}><td style={{ color: COLORS[i] }}>{name}</td><td>{source.probs[i].toFixed(4)}</td><td>{signed(source.probs[i] - (i === 0 ? 1 : 0))}</td><td>{pair(source.perClassGrad[i])}</td></tr>)}</tbody>
          <tfoot><tr><th>三类贡献相加</th><td colSpan={2}>共享上下文的总梯度</td><td><strong>{pair(sum)}</strong></td></tr></tfoot>
        </table></div>
        <p className="note">本演示把 V 缩小为两个可学习数值；论文实际学习 M × d 个上下文参数。这个梯度表不表示论文的真实训练数值。</p>
      </div>}
    </div>}
  </div>;
}

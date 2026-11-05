import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Feedback } from './coop-kit';
import { useAnimatedNumbers } from './motion-hooks';
import './early-labs.css';
import { toyModel } from './coop-model';
import { Formula } from '../components/Formula';
import type { FormulaDef } from '../types';

const COLORS = [C.blue, C.purple, C.orange];
const LABELS = ['猫', '狗', '花'];
const clamp = (x: number) => Math.max(-1, Math.min(1, x));
const initial = toyModel([0, 0]);
const modelCalculation: FormulaDef = {
  lead: '这个二维教学模型先用固定规则编码，再把结果缩放到接近单位长度。',
  lines: [
    { label: '编码', tex: String.raw`\sym{hidden} = \sym{activation}\!\left(\sym{matrix}\sym{context} + \sym{bias}\right)` },
    { label: '归一化', tex: String.raw`\sym{feature} = \frac{\sym{hidden}}{\sqrt{\sym{norm} + \sym{epsilon}}}` },
  ],
  symbols: {
    hidden: { tex: 'h_i', name: '中间向量', desc: '类别 i 的二维编码结果，还没有归一化。' },
    activation: { tex: String.raw`\tanh`, name: '双曲正切', desc: '分别作用于两个坐标，让每个输出都落在 −1 与 1 之间。' },
    matrix: { tex: 'A', name: '固定矩阵', desc: '二维教学编码器的权重。拖动输入时仍使用这同一组数。' },
    context: { tex: 'V', name: '共享上下文', desc: '你可以调整的两个数。猫、狗、花的输入都引用它。' },
    bias: { tex: 'b_i', name: '类别条件', desc: '教学模型给每个类别的固定偏置。它让同一组上下文产生不同的输出。' },
    feature: { tex: 'w_i', name: '文本特征', desc: '图中代表类别 i 的彩色点。它的方向用于和图像特征比较。' },
    norm: { tex: String.raw`\lVert h_i\rVert_2^2`, name: '向量长度的平方', desc: '把中间向量的两个坐标分别平方后相加。除以近似的向量长度，得到可比较的方向。' },
    epsilon: { tex: String.raw`\varepsilon`, name: '数值稳定项', desc: '这里取 10⁻¹²，即使中间向量恰好为零，分母依然大于零。' },
  },
};

export const ContextLab: React.FC<WidgetProps> = () => {
  const [V, setV] = useState<[number, number]>([0, 0]);
  const [answer, setAnswer] = useState<string | null>(null);
  const dragging = useRef(false);
  const model = toyModel(V);
  const animatedV = useAnimatedNumbers(V, dragging.current ? 80 : 500);
  const visualModel = toyModel(animatedV as [number, number]);
  const changed = Math.abs(V[0]) + Math.abs(V[1]) > 0.001;
  const movement = model.features.map((point, i) => Math.hypot(point[0] - initial.features[i][0], point[1] - initial.features[i][1]));
  const change = (next: [number, number]) => { setV([clamp(next[0]), clamp(next[1])]); setAnswer(null); };
  const nudge = (axis: 0 | 1, amount: number) => {
    setAnswer(null);
    setV(previous => {
    const next: [number, number] = [...previous];
    next[axis] = Number(clamp(next[axis] + amount).toFixed(2));
    return next;
    });
  };
  return <div className="el-lab" onKeyDown={e => {
    const target = e.target as HTMLElement;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      && target.closest('button, input, select, textarea, [role="slider"]')) e.stopPropagation();
  }}>
    <p><strong>先看三条完整输入：</strong>V 统称整组可学习上下文；这里把它简化为两个可调数字，不代表真实方法只有两个参数。同一组 V 分别配上猫、狗、花的名称，所以送进固定编码器的完整序列并不相同。这里用小型函数示意，未运行真实 CLIP。</p>
    <div className="ctrl" aria-label="三个类别共享上下文，但各自保留名称" style={{ display: 'grid', gap: 6 }}>
      {LABELS.map((label, i) => <div key={label} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <code>[同一 V：{V[0].toFixed(2)}, {V[1].toFixed(2)}]</code>
        <span>＋</span><strong style={{ color: COLORS[i] }}>[{label}]</strong>
        <span>→ 固定编码器 →</span><strong style={{ color: COLORS[i] }}>{label}的文本特征</strong>
      </div>)}
    </div>
    <p><strong>这次观察：</strong>记住右侧空心点的位置，再拖动左侧橙点；比较三个颜色的实心点移动了多少。左侧 V 的两个坐标可以调，右侧输出不能直接拖动。</p>
    <div className="live-readout" aria-live="polite"><span>当前 V <strong>[{V[0].toFixed(2)}, {V[1].toFixed(2)}]</strong></span><span>{changed ? '三类文本特征已重新计算' : '等待调整共享上下文'}</span><span>编码器 <strong>保持固定</strong></span></div>
    <div className="ctrl" aria-label="读图图例">
      {LABELS.map((label, i) => <span key={label}><span aria-hidden="true" style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', background: COLORS[i], marginRight: 6 }} />{label}的文本特征</span>)}
      <span>○ 空心：初始位置　● 实心：当前位置　■ 黑方点：固定图像特征</span>
    </div>
    <div tabIndex={0} role="group" aria-label="上下文坐标控制。聚焦后用方向键调整，左右改变第一维，上下改变第二维。" onKeyDown={e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target !== e.currentTarget && target.tagName.toLowerCase() !== 'svg') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(0, -.1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudge(0, .1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); nudge(1, .1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); nudge(1, -.1); }
    }}>
      <div className="el-context-stage">
        <div className="el-coordinate-panel"><div className="el-stage-heading"><span>拖动橙点</span><strong>共享上下文 V</strong></div>
          <svg viewBox="0 0 320 300" className="el-input-grid" role="img" aria-label={`可拖动上下文，当前${V.map(x => x.toFixed(2)).join(', ')}`} style={{touchAction:'none'}} onPointerDown={e => { dragging.current=true; e.currentTarget.setPointerCapture(e.pointerId); const rect=e.currentTarget.getBoundingClientRect(); change([((e.clientX-rect.left)/rect.width*320-160)/108,(150-(e.clientY-rect.top)/rect.height*300)/108]); }} onPointerMove={e => { if(!dragging.current)return; const rect=e.currentTarget.getBoundingClientRect();change([((e.clientX-rect.left)/rect.width*320-160)/108,(150-(e.clientY-rect.top)/rect.height*300)/108]); }} onPointerUp={e=>{dragging.current=false;e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{dragging.current=false;}}>
            <rect x="36" y="26" width="248" height="248" rx="18" fill="#fff2e8" />
            {[-1,-.5,0,.5,1].map(v=><g key={v}><line x1={160+v*108} x2={160+v*108} y1="42" y2="258" stroke="#edd9c9" strokeWidth="1.5"/><line x1="52" x2="268" y1={150+v*108} y2={150+v*108} stroke="#edd9c9" strokeWidth="1.5"/></g>)}
            <path d="M52 150H268M160 42V258" stroke="#b49b88" strokeWidth="2"/>
            <line x1="160" y1="150" x2={160+animatedV[0]*108} y2={150-animatedV[1]*108} stroke="#ed8754" strokeWidth="5"/>
            <circle cx={160+animatedV[0]*108} cy={150-animatedV[1]*108} r="21" fill="#ed8754" opacity=".16"/>
            <circle cx={160+animatedV[0]*108} cy={150-animatedV[1]*108} r="11" fill="#ed8754" stroke="#fff" strokeWidth="4"/>
            <text x="278" y="143" className="el-axis-label">v₁</text><text x="171" y="37" className="el-axis-label">v₂</text>
          </svg>
          <strong className="el-coordinate-value">[{animatedV[0].toFixed(2)}, {animatedV[1].toFixed(2)}]</strong>
        </div>
        <div className="el-context-encoder"><span className="el-flow-arrow" aria-hidden="true">→</span><div className="el-frozen-encoder"><svg width="40" height="46" viewBox="0 0 36 42" aria-hidden="true"><path d="M9 17V11a9 9 0 0 1 18 0v6" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="3" y="17" width="30" height="23" rx="6" fill="currentColor"/><path d="M18 25v7" stroke="white" strokeWidth="3"/></svg><strong>固定编码器</strong><span>权重不更新</span></div><span className="el-flow-arrow" aria-hidden="true">→</span></div>
        <div className="el-coordinate-panel"><div className="el-stage-heading"><span>三类一起响应</span><strong>文本特征</strong></div>
          <svg viewBox="0 0 320 300" role="img" aria-label="三类文本特征随共享上下文联动，黑色图像特征保持固定">
            <circle cx="160" cy="150" r="108" fill="#f4f6f5" stroke="#d8e1e1" strokeWidth="2"/>
            <path d="M32 150H288M160 22V278" stroke="#d8e1e1" strokeWidth="1.5"/>
            {initial.features.map((point,i)=><g key={i}><circle cx={160+point[0]*108} cy={150-point[1]*108} r="9" fill="none" stroke={COLORS[i]} strokeWidth="2" opacity=".4"/><path d={`M${160+point[0]*108},${150-point[1]*108}L${160+visualModel.features[i][0]*108},${150-visualModel.features[i][1]*108}`} stroke={COLORS[i]} strokeWidth="2" strokeDasharray="4 5" opacity=".4"/></g>)}
            {visualModel.features.map((point,i)=><g key={i}><line x1="160" y1="150" x2={160+point[0]*108} y2={150-point[1]*108} stroke={COLORS[i]} strokeWidth="4"/><circle cx={160+point[0]*108} cy={150-point[1]*108} r="10" fill={COLORS[i]} stroke="white" strokeWidth="3"/></g>)}
            <rect x={154+model.image[0]*108} y={144-model.image[1]*108} width="12" height="12" rx="2" fill="#152d48"/>
          </svg>
          <div className="el-feature-legend">{LABELS.map((name,i)=><span key={name} style={{color:COLORS[i]}}>● {name}</span>)}</div>
        </div>
      </div>
    </div>
    <div className="ctrl" role="group" aria-label="不拖动也可以调整上下文">
      <button type="button" className="tiny ghost" aria-label="第一维减小0.1" disabled={V[0] <= -1} onClick={() => nudge(0, -.1)}>第 1 维 −</button>
      <button type="button" className="tiny ghost" aria-label="第一维增大0.1" disabled={V[0] >= 1} onClick={() => nudge(0, .1)}>第 1 维 ＋</button>
      <button type="button" className="tiny ghost" aria-label="第二维减小0.1" disabled={V[1] <= -1} onClick={() => nudge(1, -.1)}>第 2 维 −</button>
      <button type="button" className="tiny ghost" aria-label="第二维增大0.1" disabled={V[1] >= 1} onClick={() => nudge(1, .1)}>第 2 维 ＋</button>
      <button type="button" className="tiny" onClick={() => change([.65, -.35])}>试一组共享输入</button>
      <button type="button" className="tiny ghost" onClick={() => change([0, 0])}>重置</button>
    </div>
    <p className="note">每个彩色点代表一个完整的类别文本特征。圆周只表示输出长度已统一，下一章将比较它们与图像特征的方向；上下文 V 不受这个圆周约束。</p>
    <div className="ctrl" role="group" aria-label="理解检查：调整上下文后什么保持不变">
      <span>调整 V 后，哪一组一定保持不变？</span>
      {[['frozen', '网络权重与固定图像特征'], ['features', '三个类别的文本特征'], ['inputs', '三个类别的完整输入']].map(([value, label]) => <button type="button" key={value} className={'chip' + (answer === value ? ' selected' : '')} aria-pressed={answer === value} onClick={() => setAnswer(value)}>{label}</button>)}
    </div>
    <Feedback tone={answer === null ? 'neutral' : answer === 'frozen' ? 'good' : 'bad'}>
      {answer === 'frozen' ? '对。网络权重和同一个固定输入图像的特征不变。三条输入里的 V 同时改变，各自仍保留类别名称，因此三个文本输出可以产生不同的变化。'
        : answer === 'features' ? '冻结的是编码器权重，不是输出。查看实心点与空心点：输入 V 改变后，固定函数仍能生成不同的文本特征。'
        : answer === 'inputs' ? '类别名称保持固定，但三条输入都包含 V，所以完整输入已经改变。它们共享同一份 V，仍然因为类别名称不同而不相同。'
        : changed ? '只调整了共享 V：猫、狗、花的文本点距初始位置分别为 ' + movement.map(value => value.toFixed(3)).join('、') + '（示意单位）。三类变化由各自的完整输入共同决定；中间网络权重和黑色图像点都未变。'
        : '先点击“试一组共享输入”或拖动橙点，再比较三个实心点各自离开初始位置的距离。你改的是输入，而不是中间带锁的网络。'}
    </Feedback>
    <details>
      <summary>查看当前输出坐标与变化量</summary>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>文本特征</th><th>当前两个坐标</th><th>距初始位置（示意单位）</th></tr></thead><tbody>
          {model.features.map((point, i) => <tr key={LABELS[i]}><td>{LABELS[i]}</td><td><code>({point[0].toFixed(3)}, {point[1].toFixed(3)})</code></td><td>{movement[i].toFixed(3)}</td></tr>)}
        </tbody></table>
      </div>
    </details>
    <details>
      <summary>查看教学模型与真实 CoOp 的边界</summary>
      <Formula formula={modelCalculation} />
      <p>bᵢ 在这个玩具模型中表示固定的类别条件，不表示真实 CLIP 把类别名称简化成偏置。真实 CoOp 优化的是多维上下文矩阵，经冻结 Transformer 生成文本特征；这里的坐标和距离不属于论文实验结果。</p>
    </details>
  </div>;
};

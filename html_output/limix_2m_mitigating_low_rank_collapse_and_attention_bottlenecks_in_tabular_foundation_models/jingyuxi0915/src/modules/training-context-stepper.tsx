import { useState } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, Detail, WidgetFrame, Metric, palette, drawPhotoCue } from './shared';

const TRAIN = [
  { title: '采样任务机制', text: '先采样合成任务的 DAG 与函数机制，决定这一张合成表如何生成。', input: '机制与生成规则', update: '此步尚未更新参数' },
  { title: '生成合成表', text: '从机制生成数值和目标，向模型提供多样任务的训练经验。', input: '合成特征与目标', update: '此步尚未更新参数' },
  { title: '划分已知与待估信息', text: '用已知信息帮助估计待估目标。图中展示一般 TFM 的任务组织，具体的掩码方式取决于模型实现。', input: '已知上下文与待估部分', update: '此步尚未更新参数' },
  { title: '参数更新（示意）', text: '预训练会利用训练目标更新模型参数。下方可展开一次独立的线性回归计算，帮助辨认“更新”这个动作。', input: '训练目标', update: '预训练允许更新模型参数' },
];
const USE = [
  { title: '提供新任务上下文', text: '带标签的已知样本和待预测行一起成为输入。它们是本次任务的数据，不是新训练出的参数。', input: '已知样本与查询行', update: '使用已预训练的固定参数 θ*' },
  { title: '前向汇聚', text: '固定权重处理输入，并利用上下文信息。上下文改变时，中间表示可以改变，参数仍保持固定。', input: '随上下文变化的表示', update: '没有执行梯度或参数更新' },
  { title: '输出接口', text: '真实模型由读出与任务输出接口完成预测。本模块没有加载模型，故不显示虚构预测值。', input: '任务输出接口（未运行模型）', update: 'θ* 保持不变' },
];

export function TrainingContextStepper() {
  const [mode, setMode] = useState('train');
  const [step, setStep] = useState(0);
  const states = mode === 'train' ? TRAIN : USE;
  const item = states[step];
  const updated = mode === 'train' && step === 3;
  const theta = updated ? 4 / 3 : 1;
  const loss = [0, 1, 2].reduce((sum, x) => sum + (theta * x - 2 * x) ** 2, 0) / 3;
  const selectMode = (value: string) => { setMode(value); setStep(0); };
  const reset = () => { setMode('train'); setStep(0); };
  return <WidgetFrame id="M07-training-context">
    <Source kind="P" loc="p2 §2；p6 §5.4">合成任务预训练与新任务上下文范式。流程划分含教学简化。</Source>
    <Chips label="使用阶段" value={mode} onChange={selectMode} options={[{ value: 'train', label: '预训练' }, { value: 'use', label: '新任务使用' }]} />
    <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, flexWrap: 'wrap' }} aria-label="流程步骤">
      {states.map((state, i) => <li key={state.title} aria-current={i === step ? 'step' : undefined} style={{ border: '1px solid ' + (i === step ? palette.green : palette.line), borderRadius: 8, padding: '6px 10px', background: i === step ? '#e4eee0' : 'transparent', fontWeight: i === step ? 700 : 400 }}>{i + 1}. {state.title}</li>)}
    </ol>
    <Canvas label={'流程状态：' + item.title + '。' + item.update} height={190} draw={(ctx, w, h) => {
      drawPhotoCue(ctx, 40, h / 2, 40, step / (states.length - 1));
      const start = 110, stop = w - 30, gap = (stop - start) / (states.length - 1);
      ctx.strokeStyle = palette.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(start, h / 2); ctx.lineTo(stop, h / 2); ctx.stroke();
      states.forEach((_, i) => {
        const x = start + gap * i;
        ctx.fillStyle = i < step ? palette.blue : i === step ? palette.green : palette.env;
        ctx.strokeStyle = i === step ? palette.ink : palette.line; ctx.lineWidth = i === step ? 3 : 1;
        ctx.beginPath(); ctx.arc(x, h / 2, i === step ? 24 : 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = i <= step ? '#fff' : palette.ink; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x, h / 2 + 6);
      });
    }} />
    <p style={{ color: palette.muted, fontSize: 13 }}>数字与上方步骤一一对应；相机仅是与当前步骤同步的教学类比。</p>
    <div aria-live="polite">
      <h4>{item.title}</h4><p>{item.text}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}><Metric label="当前输入状态" value={item.input} /><Metric label="参数状态" value={item.update} /></div>
    </div>
    <Controls><Button onClick={() => setStep(step - 1)} disabled={step === 0}>上一步</Button><Button onClick={() => setStep(step + 1)} disabled={step === states.length - 1}>下一步</Button><Button onClick={reset}>重置本模块</Button></Controls>
    <Feedback>{mode === 'train' ? '预训练改变参数。论文没有给出完整损失与训练步数；下方计算只用于解释更新动作。' : '本次变化来自上下文输入：没有再次更新 θ*，也没有在网页运行真实模型。'}</Feedback>
    <Detail title="选读：一次可复算的梯度更新（教学示意，不是 LimiX 损失）">
      <Source kind="T" loc="手写线性回归算例">数据 x=[0,1,2]、y=[0,2,4]；没有使用论文模型或训练权重。</Source>
      <p>设预测为 θx，L=mean((θx−y)²)，学习率 η=0.1。初始 θ=1 时，L=5/3，梯度为 −10/3。</p>
      <p>一次更新：θ′=1−0.1×(−10/3)=4/3；L′=20/27≈0.7407。</p>
      {mode === 'train' ? <p aria-live="polite">当前教学算例：θ={theta.toFixed(4)}，L={loss.toFixed(4)}。{updated ? '已演示一次更新，下一步已禁用。' : '推进到第4步后显示一次更新。'}</p> : <p>新任务流程不执行这套回归更新；这里的 θ=4/3 不是已预训练模型的权重。</p>}
    </Detail>
    <Detail title="条件与论文未展开的实现">
      <p>论文给出的主干配置是 12 个 block、隐藏宽度 d=96、6 个注意力头。不要把部分消融的 32 维当成主干宽度。</p>
      <p>训练标签用于优化；验证信息用于配置选择；测试目标用于评价，不应作为查询行已知答案。本图是一般任务组织说明，本文的精确任务 mask、损失、优化器和训练时长未充分展开。</p>
      <p>相机练习只帮助区分“练习”和“使用”。真实模型的参数、注意力与任务生成过程由上方技术描述独立解释。</p>
    </Detail>
  </WidgetFrame>;
}

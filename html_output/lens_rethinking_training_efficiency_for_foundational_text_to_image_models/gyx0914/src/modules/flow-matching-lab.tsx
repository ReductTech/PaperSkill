import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'train' | 'sample';
const paths = {
  train: [
    { title: '图文样本', symbol: '图像 + 文字', detail: '训练数据有配对的图像和描述。图像提供要学习的目标，不是生成时的输入。' },
    { title: '编码与加噪', symbol: 'VAE → zₜ', detail: 'VAE 把训练图像编码到潜空间，再与随机噪声构成带噪的潜表示 zₜ。' },
    { title: '预测方向', symbol: 'vθ(zₜ,c,t)', detail: '文字编码器给出条件 c；MMDiT 看 zₜ、c 和时间 t，预测潜表示该如何变化。' },
    { title: '对照目标', symbol: 'MSE 损失', detail: '因为训练时知道目标图像，就能构造目标方向；用均方误差比较预测与目标，再更新模型参数。' },
  ],
  sample: [
    { title: '随机起点', symbol: '随机 z', detail: '生成时没有一张“标准答案”图像；从随机潜变量出发。起点不同，结果也可能不同。' },
    { title: '读取文字', symbol: 'prompt → c', detail: 'GPT-OSS 把文字转成条件特征 c。c 是这次请求的输入，不是训练好的固定权重。' },
    { title: '预测方向', symbol: 'vθ(z,c,t)', detail: '在当前潜表示和时间位置，MMDiT 预测一个更新方向。这里的 θ 才代表训练得到的模型参数。' },
    { title: '反复更新', symbol: 'z → z′ → …', detail: '每一步都把当前 z、时间 t 和文字条件 c 送进同一个 MMDiT，重新预测方向，再让 z 沿该方向前进一步。Lens 默认 20 个采样步；Lens-Turbo 是蒸馏后的 4 步版本。' },
    { title: '解码成图', symbol: 'VAE Decoder', detail: '更新后的潜表示由 VAE 解码器变成可见图像。纯文生图不需要先编码一张原始图像。' },
  ],
};

export const FlowMatchingLab: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('train');
  const [step, setStep] = useState(0);
  const current = paths[mode][step];

  const switchMode = (next: Mode) => { setMode(next); setStep(0); };
  return (
    <div className="lens-flow lens-widget">
      <div className="lens-widget-kicker">同一骨干，不同任务阶段</div>
      <div className="chip-row lens-flow-modes" role="group" aria-label="选择训练或生成">
        <button type="button" className={`chip ${mode === 'train' ? 'selected' : ''}`} onClick={() => switchMode('train')} aria-pressed={mode === 'train'}>训练：学会方向</button>
        <button type="button" className={`chip ${mode === 'sample' ? 'selected' : ''}`} onClick={() => switchMode('sample')} aria-pressed={mode === 'sample'}>生成：使用方向</button>
      </div>
      <div className="lens-flow-answer">
        {mode === 'train' ? <><b>有目标图像</b><span>所以能计算预测方向与目标方向的差距，更新模型。</span></> : <><b>没有目标图像</b><span>模型参数已学好；现在用预测方向逐步生成，不再对照一张“正确图片”。</span></>}
      </div>
      <p className="lens-widget-instruction">点击路径上的任一节点，查看它在{mode === 'train' ? '训练' : '生成'}中的职责。</p>
      <div className={`lens-flow-path ${mode === 'train' ? 'is-training' : ''}`} role="group" aria-label={`${mode === 'train' ? '训练' : '生成'}路径`}>
        {paths[mode].map((item, index) => (
          <button type="button" key={item.title} className={`lens-flow-node ${index === step ? 'is-active' : ''}`} onClick={() => setStep(index)} aria-pressed={index === step}>
            <span className="lens-flow-index">{index + 1}</span><strong>{item.title}</strong><small>{item.symbol}</small>
          </button>
        ))}
      </div>
      {mode === 'sample' && <aside className="lens-flow-card" aria-label="Flow Matching 简介"><strong>小名片 · Flow Matching（流匹配）</strong><p>训练时，模型学习在噪声与训练图片的潜表示之间预测“该往哪走”的速度。生成时，它从随机噪声出发，每一步重新预测速度并更新潜表示，最后才解码成图；这不是把某张图片的加噪过程原路倒放。</p></aside>}
      <div className="lens-flow-detail" aria-live="polite">
        <div className="lens-flow-mark">{mode === 'train' ? '训练' : '生成'} · {step + 1}/{paths[mode].length}</div>
        <h5>{current.title}</h5><p>{current.detail}</p>
      </div>
      <div className="step-ctrl"><button type="button" className="tiny" disabled={step === 0} onClick={() => setStep(step - 1)}>← 上一步</button><span className="step-label">{step + 1} / {paths[mode].length}</span><button type="button" className="tiny" disabled={step === paths[mode].length - 1} onClick={() => setStep(step + 1)}>下一步 →</button></div>
      <div className="feedback good">关键区别：flow matching 是训练“方向场”的目标；生成时的多步采样，是使用已经学到的方向。路径节点是概念示意，不是逐帧真实采样画面。</div>
      <p className="lens-widget-source">依据：论文 §2.2–2.3、§2.5；训练和采样路径为教学简化图。</p>
    </div>
  );
};

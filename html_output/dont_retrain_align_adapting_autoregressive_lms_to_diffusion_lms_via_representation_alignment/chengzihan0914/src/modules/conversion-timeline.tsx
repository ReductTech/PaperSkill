import { useState } from 'react';
import type { WidgetProps } from './registry';

const FLOWS = {
  base: {
    name: '传统 AR→DLM', progress: 34, tone: 'bad', headline: '只继承参数，表示可能随去噪训练漂移',
    steps: [['1', '复制权重', '从 AR checkpoint 初始化学生。'], ['2', '切换可见性', '因果注意力改为双向注意力。'], ['3', '基线目标', '优化遮蔽去噪与共享的 PAPL 路径损失。'], ['4', '重建内部几何', '没有教师信号约束原有表示。']],
  },
  align: {
    name: 'REPR-ALIGN', progress: 100, tone: 'good', headline: '冻结 AR 坐标系，把训练集中在新解码机制',
    steps: [['1', '复制学生', '学生从同一 AR 权重初始化。'], ['2', '冻结教师', '干净序列产生逐层参考表示。'], ['3', '完整目标', '优化遮蔽去噪、共享的 PAPL 路径损失和余弦对齐。'], ['4', '更早达标', '论文设置中训练步数最高加速 4×。']],
  },
} as const;

export const ConversionTimeline: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<keyof typeof FLOWS>('base');
  const [step, setStep] = useState(0);
  const flow = FLOWS[mode];
  const select = (next: keyof typeof FLOWS) => { setMode(next); setStep(0); };
  return <div className="conversion-lab">
    <div className="conversion-switch">
      <button type="button" className={mode === 'base' ? 'selected' : ''} onClick={() => select('base')}>传统转换</button>
      <button type="button" className={mode === 'align' ? 'selected' : ''} onClick={() => select('align')}>REPR-ALIGN</button>
    </div>
    <div className="conversion-meter" aria-label={`${flow.name} 相对训练进度示意`}>
      <div className="conversion-meter-head"><b>{flow.name}</b><span>{mode === 'align' ? '最高 4×（论文设置）' : '持续去噪'}</span></div>
      <div className="conversion-track"><i className={flow.tone} style={{ width: `${flow.progress}%` }} /></div>
    </div>
    <div className="conversion-steps">
      {flow.steps.map(([number, title, desc], index) => <button type="button" key={number} className={step === index ? 'selected' : ''} onClick={() => setStep(index)}><span>{number}</span><b>{title}</b><small>{desc}</small></button>)}
    </div>
    <div className={`feedback ${flow.tone}`}><b>{flow.steps[step][1]}：</b>{flow.steps[step][2]} {flow.headline}。</div>
  </div>;
};

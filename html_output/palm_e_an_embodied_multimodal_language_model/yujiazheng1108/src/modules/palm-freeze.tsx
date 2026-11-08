import { useState } from 'react';
import { Choice, Feedback, Kitchen } from './palm-kit';

export function PalmFreeze() {
  const [joint, setJoint] = useState(false);
  return <div className="pk-body pk-split pk-freeze">
    <div className="pk-card pk-stack">
      <h2>训练时更新的部件</h2>
      {['视觉编码器', '投影器', 'PaLM 语言模型'].map((part, i) =>
        <div key={part} className={'pk-param ' + (i < 2 || joint ? 'train' : 'locked')}>
          <span>{part}</span><strong>{i < 2 || joint ? '更新参数' : '保持参数'}</strong>
        </div>)}
      <p>示意配置使用可训练的视觉编码器。</p>
    </div>
    <div className="pk-card pk-stack">
      <Kitchen opening={.85} camera arm={280} />
      <div className="pk-options">
        <Choice active={!joint} onClick={() => setJoint(false)}>冻结 PaLM</Choice>
        <Choice active={joint} onClick={() => setJoint(true)}>联合微调</Choice>
      </div>
      <Feedback tone="green">{joint ? '语言模型也随任务损失更新。' : '只更新输入编码侧，语言模型继续参与预测。'}</Feedback>
    </div>
  </div>;
}

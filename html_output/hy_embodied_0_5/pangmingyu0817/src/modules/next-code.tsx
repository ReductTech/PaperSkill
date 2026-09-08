import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const patches = ['杯口', '高光', '背景', '杯身', '杯柄', '玻璃杯', '桌面', '阴影', '边缘'];

export const NextCode: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(4);
  const [trained, setTrained] = useState(false);
  const target = 1342 + selected * 17;
  const prediction = trained ? target : 1208 + selected * 9;
  return <div className="code-demo">
    <div className="patch-grid" aria-label="选择 3 乘 3 图像块">{patches.map((label, i) => <button key={label} className={`${selected === i ? 'selected' : ''} patch-${i}`} onClick={() => { setSelected(i); setTrained(false); }}><span>P{i + 1}</span><small>{label}</small></button>)}</div>
    <div className="code-readout"><span>Teacher ViT 离散代码</span><strong>#{target}</strong><span>Student 预测代码</span><strong className={trained ? 'match' : 'miss'}>#{prediction}</strong><button className="chip selected" onClick={() => setTrained(true)}>执行视觉下一代码训练</button><small>codebook = 2K；教师表示按 8×8 图像块压成一个离散代码。</small></div>
    <div className={`feedback ${trained ? 'good' : 'bad'}`} aria-live="polite">{trained ? `P${selected + 1} 的预测已对齐教师代码。视觉分支必须保留“${patches[selected]}”细节，而不只是学会说“红杯”。` : '只靠语言损失，模型可能会说“红杯”，却不必记住杯柄边缘、纹理和局部几何。'}</div>
  </div>;
};

export default NextCode;

import { useState } from 'react';
import { Feedback, Sponge } from './palm-kit';

export function PalmRefer() {
  const [picked, setPicked] = useState(1);
  return <div className="pk-body pk-stack pk-refer">
    <div className="pk-counter" aria-label="两块同色海绵">
      {[1, 2].map(id => <button key={id} type="button" className="pk-object"
        aria-pressed={picked === id} onClick={() => setPicked(id)}>
        <Sponge selected={picked === id} />
        <strong>{id === 1 ? '左侧海绵' : '右侧海绵'}</strong>
        <span>对象 {id}</span>
      </button>)}
    </div>
    <div className="pk-equal">
      <div className="pk-card pk-stack pk-soft-red"><h2>“拿黄色海绵”</h2><p>两块颜色相同，颜色词不足以确定目标。</p></div>
      <div className="pk-card pk-stack pk-soft-green"><h2>“拿对象 {picked}”</h2><p>编号与对象嵌入配对。低层策略也识别该编号时，才可据此执行。</p></div>
    </div>
    <Feedback>点击海绵改变目标，观察编号随之改变。编号是当前输入里的引用。</Feedback>
  </div>;
}

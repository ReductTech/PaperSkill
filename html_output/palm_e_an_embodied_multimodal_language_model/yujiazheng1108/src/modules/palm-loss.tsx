import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { Feedback, Sponge } from './palm-kit';

export function PalmLoss() {
  const [percent, setPercent] = useState(55);
  const loss = -(Math.log(percent / 100) + Math.log(.8)) / 2;
  return <div className="pk-body pk-stack pk-loss">
    <div className="pk-equal">
      <div className="pk-card pk-stack pk-soft-blue"><h2>多模态前缀</h2>
        <div className="pk-tokens"><span>拿海绵</span><span className="sensor"><Sponge />抽屉图像</span></div>
        <p>两者都提供上下文。</p>
      </div>
      <div className="pk-card pk-stack pk-soft-green"><h2>目标文本</h2>
        <div className="pk-tokens"><span className="target">打开</span><span className="target">抽屉</span></div>
        <p>演示将这段回答简化为两个目标词元。</p>
      </div>
    </div>
    <div className="pk-equal pk-loss-demo">
      <div className="pk-card pk-stack">
        <label htmlFor="pk-prob">正确预测第一个目标词元的概率 · <strong>{percent}%</strong></label>
        <input type="range" id="pk-prob" min="10" max="99" step="1" value={percent}
          onChange={event => setPercent(Number(event.currentTarget.value))} />
        <p>第二个目标词元固定为 80%。</p>
      </div>
      <div className="pk-card pk-stack">
        <div className="pk-formula">
          <SymbolHint meaning="两个目标词元的平均交叉熵。">ℒ</SymbolHint><span> = −(ln </span>
          <SymbolHint meaning="给定前缀，正确预测第一个目标词元的概率。">p₁</SymbolHint><span> + ln </span>
          <SymbolHint meaning="给定前缀与前一个正确词元，正确预测第二个目标词元的概率。">p₂</SymbolHint>
          <span>) / 2</span>
        </div>
        <p className="pk-emphasis">平均损失 {loss.toFixed(3)}</p>
      </div>
    </div>
    <Feedback tone="green">目标文本的预测概率越高，损失越小。前缀里的观测向量不作为预测目标。</Feedback>
  </div>;
}

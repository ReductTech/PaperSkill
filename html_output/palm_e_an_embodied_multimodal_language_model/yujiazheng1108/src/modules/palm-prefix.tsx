import { useState } from 'react';
import { Choice, Feedback, Kitchen } from './palm-kit';

export function PalmPrefix() {
  const [second, setSecond] = useState(false);
  return <div className="pk-body pk-stack pk-prefix">
    <div className="pk-equal">
      <div className="pk-card pk-shot"><Kitchen opening={1} camera arm={280} /><strong>照片 A · 取物前</strong></div>
      <div className={'pk-card pk-shot' + (second ? '' : ' pk-inactive')}>
        <Kitchen opening={.85} camera={second} sponge={1} arm={515} />
        <Choice active={second} onClick={() => setSecond(!second)}>{second ? '移除照片 B' : '加入照片 B'}</Choice>
      </div>
    </div>
    <div className="pk-tokens" aria-label="多模态前缀示意">
      <span>我先看到</span><span className="sensor">照片 A · 观测向量</span>
      {second && <><span>后来看到</span><span className="sensor">照片 B · 观测向量</span></>}
      <span>物体移动了吗？</span>
    </div>
    <Feedback tone="green">{second ? '第二张照片形成新的一组向量，插在相关文字之后。' : '编码器把照片 A 转成若干向量，直接插入文字嵌入序列。'}</Feedback>
  </div>;
}

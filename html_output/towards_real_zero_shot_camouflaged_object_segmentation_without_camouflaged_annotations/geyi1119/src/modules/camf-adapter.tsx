import { useState } from 'react';
import { Sheet, Feedback, Range, Term, fmt } from './camf-kit';
export function AdapterScene() {
  const [scale, setScale] = useState(.5);
  const output = [.9-.2*scale,.5+.4*scale];
  return <div className="camf-page"><div className="camf-split"><div><Sheet detail={scale/1.5}/><p>冻结编码器的原有表示，小分支学习新增修正。</p><div className="camf-vector"><span>固定 [.900, .500]</span><span>修正 [{fmt(-.2*scale)}, {fmt(.4*scale)}]</span></div></div><section className="camf-stack"><h3>并联，而非替换主干</h3>
    <div className="camf-equation"><Term meaning="h：经过注意力后的特征向量">h</Term> + <Term meaning="FFN：冻结的前馈网络分支">FFN(h)</Term> + <Term meaning="a：可学习的Adapter缩放系数">a</Term> · <Term meaning="Adapter：降维、ReLU、升维的可训练分支">Adapter(h)</Term></div>
    <Range label="分支缩放 a" value={scale} min={0} max={1.5} step={.1} onChange={setScale}/>
    <div className="camf-big" data-testid="adapter-output">[{fmt(output[0])}, {fmt(output[1])}]</div><p>合成二维算例，不是模型预测。低秩分支先降维再升维，最终与原特征逐元素相加。</p><p>可训练：PEFT、MFA、query、掩码解码器。编码器与 M-LLM 冻结。</p></section></div>
    <Feedback tone={scale===0?'blue':'green'}>{scale===0?'a = 0：修正分支消失，只保留固定输出。':`a = ${scale}：局部基底保持固定，输出随修正向量改变；这不证明真实分割精度随 a 单调提高。`}</Feedback></div>;
}

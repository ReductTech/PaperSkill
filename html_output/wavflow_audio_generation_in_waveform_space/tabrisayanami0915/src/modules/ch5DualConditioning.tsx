import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,Source} from '../components/Evidence';
export const Ch5DualConditioning:React.FC<WidgetProps>=()=>{
 const [focus,setFocus]=useState<'global'|'frame'|'dual'>('dual');
 return <div className="widget-container">
 <Choices label="查看结构路径" value={focus} onChange={setFocus} options={[
 {value:'global',label:'全局条件 cg'},{value:'frame',label:'帧级条件 ce'},{value:'dual',label:'完整双层结构'}]}/>
 <p className="evidence-source">概念示意 · 切换只突出结构，不移除网络条件；论文未报告单路径消融成绩。</p>
 <div className="evidence-grid">
 <div className={'evidence-panel '+(focus!=='frame'?'evidence-selected':'')}>
 <h4>全局语义 cg</h4><p className="evidence-formula">cg = Pool(v_clip) + Pool(e_text) + e_t</p>
 <p>池化后的视觉与文本特征，加上生成时间嵌入。通过 AdaLN 参与调制。</p></div>
 <div className={'evidence-panel '+(focus!=='global'?'evidence-selected':'')}>
 <h4>帧级条件 ce</h4><p className="evidence-formula">ce = Nearest(v_sync + p_segment) + cg</p>
 <p>冻结 Synchformer → 长度 192 的同步序列 → 可学习分段位置嵌入 → 最近邻上采样至 C → 加 cg。</p></div>
 </div>
 <div className="widget-feedback good" aria-live="polite">{focus==='global'?
 'cg 汇集全局信息。论文没有单独评测此路径，不能为它分配虚构 CLAP 或 DeSync。':focus==='frame'?
 'ce 形状为 C×d，已经包含 cg；192 是输入同步序列长度，不是特征通道维度。最近邻插值是离散复制。':
 '两层条件通过 AdaLN 调制 Transformer。16 kHz 示例 C=640，token 时长 12.5 ms；这不是实测音画同步误差。'}</div>
 <Source>第 5–6 页 §3.2、Figure 2；第 18 页 Appendix D（同步特征长度）。</Source>
 </div>;
};
export default Ch5DualConditioning;

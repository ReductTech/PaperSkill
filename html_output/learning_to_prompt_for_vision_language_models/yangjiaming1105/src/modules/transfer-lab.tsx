import React, {useState} from 'react';
import {Chips,Feedback} from './coop-kit';
import {useAnimatedNumbers} from './motion-hooks';
import './learning-visuals.css';
export const TransferLab:React.FC=()=>{
  const [m,setM]=useState('16');
  const scores=m==='4'?[71.73,47.89]:[71.92,46.71];
  const display=useAnimatedNumbers(scores,900);
  return <>
    <p><strong>先做一个判断：</strong>把可学习上下文从 4 个向量增加到 16 个，两项测试成绩会一起变好吗？切换后同时看两行；M 只表示可调上下文向量的数量。</p>
    <Chips label="上下文长度 M" value={m} options={[{value:'4',label:'4 个上下文向量'},{value:'16',label:'16 个上下文向量'}]} onChange={setM}/>
    <p>这是论文报告的测试准确率，越高越好。蓝色表示 ImageNet 照片，橙色表示 Sketch 素描；两根柱共用 0–100% 坐标轴。</p>
    <div className="lv-stage">
      <div className="lv-stage-title"><strong>更多可学习位置，会怎样？</strong><span>上下文长度 M = {m}</span></div>
      <div className="lv-transfer-prompts" aria-label={`${m}个上下文向量`}>{Array.from({length:Number(m)},(_,i)=><span key={i} style={{animationDelay:`${i*24}ms`}}>v<sub>{i+1}</sub></span>)}</div>
      {['ImageNet · 照片','ImageNet-Sketch · 素描'].map((name,i)=><div className="lv-transfer-row" key={name} style={{'--row-color':i===0?'#285b86':'#ed8754'} as React.CSSProperties}><div className="lv-transfer-heading"><span>{name}</span><strong>{display[i].toFixed(2)}%</strong></div><div className="lv-bar-track"><span style={{width:`${display[i]}%`}}/></div></div>)}
      <div className="lv-transfer-foot"><span>0%</span><span>相同的准确率坐标</span><span>100%</span></div>
    </div>
    <div style={{overflowX:'auto'}}><table className="paper" style={{width:'100%',textAlign:'left'}}><caption style={{textAlign:'left',padding:'10px 0'}}>把两种长度并排核对，不必记住切换前的数值</caption><thead><tr><th>同一测试集</th><th>M=4</th><th>M=16</th></tr></thead><tbody>{['ImageNet 照片','ImageNet-Sketch 素描'].map((name,i)=><tr key={name}><td>{name}</td><td style={{fontWeight:m==='4'?700:400,background:m==='4'?'#fff3e8':undefined}}>{[71.73,47.89][i].toFixed(2)}%</td><td style={{fontWeight:m==='16'?700:400,background:m==='16'?'#fff3e8':undefined}}>{[71.92,46.71][i].toFixed(2)}%</td></tr>)}</tbody></table></div>
    <Feedback>{m==='16'?'从 4 增到 16：ImageNet 提高 0.19 个百分点，Sketch 降低 1.18 个百分点。可学习参数更多，并不保证迁移更好。':'从 16 缩到 4：ImageNet 降低 0.19 个百分点，Sketch 提高 1.18 个百分点。这个例子支持检查迁移表现，不能推出所有任务都应选 M=4。'}</Feedback>
    <p>证据：论文 p.8 表 1，ViT-B/16 配置的 CLIP，在 ImageNet 上每类用 16 张标注图学习提示，采用共享上下文、类别名在末尾。两组提示分别学好后才在测试集比较；Sketch 测试图片不参与学习。</p>
    <div className="ctrl"><button type="button" className="chip" onClick={()=>setM('16')}>恢复 M=16</button><span>切换展示的是两次独立实验，不是在浏览器里给已训练提示临时加长。</span></div>
    <details><summary>继续阅读：初始化与人工模板集成</summary>
      <p>这是另外两组比较，实验条件与上图不同，不应拼接成一条曲线。</p>
      <ul><li>p.9 表 3：M=4，在 11 个数据集上的平均准确率，随机初始化与用“a photo of a”初始化均为 72.65%。平均相同不表示每个任务或每次运行都相同。</li><li>p.9 表 2：ImageNet、RN50，单个人工模板 58.18%，人工模板集成 60.41%，CoOp 62.95%。集成综合同一类别的多条描述所生成的文本特征，CoOp 则用标注数据优化提示。</li></ul>
    </details>
  </>;
};

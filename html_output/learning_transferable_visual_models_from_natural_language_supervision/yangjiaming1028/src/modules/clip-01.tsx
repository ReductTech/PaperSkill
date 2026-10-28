import { useState } from 'react';
import type { WidgetProps } from './registry';
import { SceneArt } from '../components/SceneArt';
import './concept-labs.css';
const choices = [{kind:'cat',name:'猫',prompt:'a photo of a cat'},{kind:'car',name:'汽车',prompt:'a photo of a car'},{kind:'chair',name:'椅子',prompt:'a photo of a chair'}] as const;
export function Clip01(_props:WidgetProps){
  const [selected,setSelected]=useState(2);
  const [candidate,setCandidate]=useState(false);
  const item=choices[selected];
  const existing=selected===0;
  return <div className="concept-lab">
    <div className="concept-choice" aria-label="选择图片">{choices.map((entry,i)=><button key={entry.kind} aria-pressed={selected===i} onClick={()=>{setSelected(i);setCandidate(false)}}>{entry.name}</button>)}</div>
    <div className="interface-experiment">
      <div className="input-scene"><SceneArt kind={item.kind}/><div><small>同一张输入图片</small><strong>{item.name}</strong></div></div>
      <div className="interface-comparison">
        <div className="interface-method"><div className="method-heading"><span>01 / 固定分类器</span><b>输出类别在训练时确定</b></div><div className="output-labels"><span>猫</span><span>狗</span></div><p className={existing?'method-result':'method-result unavailable'}>{existing?'✓ 猫属于已有输出类别':'没有“'+item.name+'”这个输出'}</p><small>{existing?'可以直接在已有类别中进行分类。':'要识别新类别，通常需要调整分类头并训练或适配。'}</small></div>
        <div className="interface-method clip-method"><div className="method-heading"><span>02 / CLIP</span><b>用文字准备候选类别</b></div><div className="output-labels"><span>猫</span><span>狗</span>{candidate&&!existing&&<span className="new-label">{item.name}</span>}</div><button className="candidate-add" onClick={()=>setCandidate(!candidate)} disabled={existing}>{existing?'类别描述已经就绪':candidate?'− 移除“'+item.name+'”的描述':'+ 加入“'+item.name+'”的描述'}</button><code>{existing||candidate?item.prompt:'等待加入新类别描述…'}</code></div>
      </div>
    </div>
    <div className="concept-response" aria-live="polite"><span>观察结果</span><p>{existing?'“猫”在两边都可以表达。换成汽车或椅子，再给 CLIP 加入一条类别描述。':candidate?'加入文字描述后，“'+item.name+'”成为可比较的候选。图像编码器的参数没有改变；能指定类别，并不保证一定识别正确。':'固定分类器没有“'+item.name+'”这个输出。点击右侧按钮，把它作为 CLIP 的新候选，看看改变的是哪里。'}</p></div>
    <p className="lab-disclaimer">类别接口演示，不运行真实 CLIP；示意图不是模型预测。依据：论文 Figure 1、§2.5。</p>
  </div>;
}

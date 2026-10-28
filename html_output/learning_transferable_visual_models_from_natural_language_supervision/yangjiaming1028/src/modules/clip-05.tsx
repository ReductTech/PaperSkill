import { useState } from 'react';
import type { WidgetProps } from './registry';
import { SceneArt } from '../components/SceneArt';
import './concept-labs.css';
import './interaction-workbenches.css';
import './prompt-probability-motion.css';
import { PromptComposition, averagePromptVectors } from './prompt-composition';
const prompts=[{name:'只有类名',text:'dog',angle:38},{name:'照片语境',text:'a photo of a dog',angle:16},{name:'素描语境',text:'a sketch of a dog',angle:64}];
export function Clip05(_props:WidgetProps){
 const [mode,setMode]=useState<'single'|'ensemble'>('single');
 const [selected,setSelected]=useState(0);
 const [included,setIncluded]=useState([0,1,2]);
 const indices=mode==='single'?[selected]:included;
 const {embedding}=averagePromptVectors(indices.map(i=>prompts[i].angle));
 const toggle=(i:number)=>setIncluded(v=>v.includes(i)?v.length>1?v.filter(x=>x!==i):v:[...v,i]);
 return <div className="concept-lab wb-prompts">
  <div className="concept-choice" aria-label="提示构造方式"><button aria-pressed={mode==='single'} onClick={()=>setMode('single')}>一个模板</button><button aria-pressed={mode==='ensemble'} onClick={()=>setMode('ensemble')}>多个模板集成</button></div>
  <div className="prompt-builder">

    <div className="prompt-controls"><div className="wb-prompt-source"><SceneArt kind="dog"/><div><strong>同一张图片，不同的描述</strong><span>图像保持不变 · 模型参数固定</span></div></div><div className="wb-live-pair" aria-live="polite"><span>当前类别向量</span><strong>[{embedding.map(v=>v.toFixed(3)).join(', ')}]</strong></div><p className="micro-label">{mode==='single'?'选择一句描述':'选择参与集成的描述（至少一个）'}</p>{prompts.map((prompt,i)=><button key={prompt.text} className={'prompt-option'+(indices.includes(i)?' selected':'')} aria-pressed={indices.includes(i)} disabled={mode==='ensemble'&&included.length===1&&included.includes(i)} aria-describedby={mode==='ensemble'?'template-minimum':undefined} onClick={()=>mode==='single'?setSelected(i):toggle(i)}><span>{indices.includes(i)?'✓':'○'}</span><div><b>{prompt.name}</b><code>{prompt.text}</code></div></button>)}{mode==='ensemble'&&<p className="template-minimum" id="template-minimum" role="status">{included.length===1?'至少保留一个模板；先勾选另一项，就可以取消当前项。':'每个模板只贡献一个文本向量；可点击已选项取消。'}</p>}</div>
    <PromptComposition angles={prompts.map(prompt=>prompt.angle)} indices={indices} ensemble={mode==='ensemble'}/>
  </div>
  <div className="template-calculation" aria-live="polite"><span>{indices.length} 个文本输入</span><i>→</i><span>分别编码并归一化</span>{mode==='ensemble'&&<><i>→</i><span>平均，再归一化</span></>}<i>→</i><b>1 个类别向量</b></div>
  <div className="concept-response"><span>{mode==='single'?'改写输入':'模板集成'}</span><p>{mode==='single'?'三种说法属于同一类别，但提供的语境不同。变化发生在输入文本和对应表示上，没有更新模型参数。':'多个模板分别得到向量，先取平均、再归一化，形成同一类别的一个代表向量。它们并不是多个不同类别。'}</p></div>
  <p className="lab-disclaimer">向量为可计算的二维示意，不是 CLIP 实测输出，不表示模板效果排名。序号 1 / 2 / 3 对应上方三个模板；靛蓝实心点是最终类别向量；集成时，彩点汇聚演示取平均，再沿同一方向归一化。动画不代表更新模型参数。</p>
 </div>;
}

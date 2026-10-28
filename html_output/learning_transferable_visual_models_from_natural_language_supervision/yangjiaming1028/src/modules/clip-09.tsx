import { useState } from 'react';
import type { WidgetProps } from './registry';
import './concept-labs.css';
import './interaction-workbenches.css';
const protocols=[
 {name:'零样本',budget:'0',unit:'目标训练图片',origin:'类别文本',source:'文本编码器生成类别向量',training:'不训练新分类器',description:'用自然语言指定类别；模型已有互联网图文预训练。',code:'类别描述 → 文本编码器 → 类别向量'},
 {name:'4-shot 线性分类',budget:'4',unit:'张 / 每个类别',origin:'少量标注图片',source:'每类 4 张图片的固定图像特征 + 标签',training:'训练线性分类器',description:'图像编码器冻结，用少量目标标签拟合分类权重。',code:'4 × 类别数张图片 → 固定特征 → 拟合线性权重'},
 {name:'全量线性探测',budget:'全部',unit:'目标训练集',origin:'全部训练标签',source:'目标训练集的固定图像特征 + 标签',training:'训练线性分类器',description:'图像编码器冻结，考察现有特征是否容易被分类。',code:'全部训练图片 → 固定特征 → 拟合线性权重'}
];
const cases=[{question:'给出 5 个类别的名称，不提供目标训练图片，也不更新模型。',correct:0,why:'类别名称用于生成文本向量，目标训练图片数为 0，这属于零样本。'},{question:'5 个类别各有 4 张标注图片。冻结图像编码器，拟合一个线性分类器。',correct:1,why:'4-shot 的 4 是每类的例子数。这里一共用 5 × 4 = 20 张标注图片。'},{question:'使用目标训练集的全部标签，只训练图像特征之上的线性分类器。',correct:2,why:'这是全量线性探测。图像编码器被冻结，不是端到端微调。'}];
export function Clip09(_props:WidgetProps){
 const [mode,setMode]=useState(0),[caseIndex,setCaseIndex]=useState(1),[answer,setAnswer]=useState<number|null>(null);
 const selected=protocols[mode],scenario=cases[caseIndex];
 return <div className="concept-lab wb-protocol"><div className="wb-protocol-workbench"><div className="wb-protocol-action"><span>切换协议，对照标签预算与分类器来源</span><label className="wb-protocol-select"><span>评估协议</span><select aria-label="切换评估协议" value={mode} onChange={event=>setMode(Number(event.target.value))}>{protocols.map((entry,i)=><option key={entry.name} value={i}>{entry.name}</option>)}</select></label></div><div className="protocol-options" role="group" aria-label="评估协议选择">{protocols.map((entry,i)=><button key={entry.name} aria-pressed={mode===i} onClick={()=>setMode(i)}><span>0{i+1}</span><b>{entry.name}</b><small>{entry.unit}</small></button>)}</div>
 <div className="protocol-detail"><div className="budget-card"><small>当前标签预算</small><strong>{selected.budget}</strong><span>{selected.unit}</span></div><div className="protocol-flow"><div><span>{mode?'始终固定':'类别描述输入'}</span><b>{mode?'预训练图像编码器':'预训练文本编码器'}</b><small>{mode?'输出已有图像特征':'例如 a photo of a cat'}</small></div><i>→</i><div className={mode?'learnable':''}><span>{mode?'目标任务训练':'文本编码'}</span><b>{mode?'线性分类权重':'类别文本向量'}</b><small>{selected.training}</small></div><i>→</i><div><span>使用阶段</span><b>比较得分</b><small>{mode?'对固定图像特征分类':'与固定图像特征比较'}</small></div></div></div>
 </div><div className="concept-response" aria-live="polite"><span>分类器来自哪里</span><p>{selected.source}。{selected.description}</p></div>
 <section className="protocol-quiz" aria-label="识别评估协议"><div className="quiz-heading"><span>理解检查 / {caseIndex+1} OF 3</span><button onClick={()=>{setCaseIndex((caseIndex+1)%3);setAnswer(null)}}>换一个情境 ↻</button></div><h3>{scenario.question}</h3><div className="concept-choice">{protocols.map((p,i)=><button key={p.name} aria-pressed={answer===i} onClick={()=>setAnswer(i)}>{p.name}</button>)}</div><p className={'quiz-feedback'+(answer===null?'':answer===scenario.correct?' correct':' incorrect')} aria-live="polite">{answer===null?'选择你认为对应的评估协议。':answer===scenario.correct?'✓ 判断正确。'+scenario.why:'再想想：先看用了多少目标标签，再看哪些参数被更新。'}</p></section>
 <p className="lab-disclaimer">这里比较实验协议，不展示虚构的准确率。所有模式都允许知道目标类别；后两种额外使用目标训练图片的标签。</p></div>;
}

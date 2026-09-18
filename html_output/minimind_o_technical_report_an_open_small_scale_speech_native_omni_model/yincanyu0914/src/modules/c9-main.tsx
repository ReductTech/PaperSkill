import {GradientWorkbench} from './gradient-workbench';

import {Panel,Hint} from './lab-ui';
import { useState } from 'react';
import { Scene, Palette as P, box, line, label } from './omni-kit';
type Task='t2a'|'i2t'|'a2a';
const tasks={t2a:{name:'T2A · 文字到语音',data:'1,248,923 条；输出语音 1,636.01 小时',io:'输入文字 → 目标语音',mask:'参考条件和无效位置不计音频损失；目标音频位置参与监督。'},i2t:{name:'I2T · 图片到文字',data:'约 100K 条',io:'输入图片 → 目标文字',mask:'目标回答文字参与监督；本任务没有目标音频。'},a2a:{name:'A2A · 语音到语音',data:'414,024 条；输入 1,711.97 小时，输出 423.40 小时',io:'输入语音 → 回答文字与语音',mask:'回答文字与目标音频参与联合监督；输入和参考音频不是重建目标。'}};
export function Ch9Main(){
 const [task,setTask]=useState<Task>('t2a');const [mode,setMode]=useState<'all'|'projector'>('all');const [selected,setSelected]=useState(0);
 const names=['Thinker','Talker','audio projector','vision projector','SenseVoice / SigLIP2 / Mimi'];
 const active=(i:number)=>mode==='projector'?(i===(task==='a2a'?2:3)):(i===0||(i===1&&task!=='i2t')||(i===2&&task==='a2a')||(i===3&&task==='i2t'));
 return <Panel chapter={9}>
  <div className="ctrl" style={{display:'flex',flexWrap:'wrap',gap:8}}>{(Object.keys(tasks) as Task[]).map(t=><button className="chip" key={t} aria-pressed={task===t} onClick={()=>{setTask(t);setMode('all');}}>{tasks[t].name}</button>)}</div>
  <p><strong>{tasks[task].io}</strong>。发布数据规模：{tasks[task].data}。</p>
  <div className="ctrl" style={{display:'flex',flexWrap:'wrap',gap:8}}><button aria-pressed={mode==='all'} onClick={()=>setMode('all')}>all：参与任务的可训练模块</button><button disabled={task==='t2a'} aria-pressed={mode==='projector'} onClick={()=>setMode('projector')}>{task==='i2t'?'vision_proj':'audio_proj'}：仅投影器</button><button onClick={()=>{setTask('t2a');setMode('all');setSelected(0);}}>重置</button></div>
  <div className="lab-grid shot-enter" key={task+'-'+mode}><div className="lab-card"><span className="lab-eyebrow">01 · 输入数据</span><strong>{task==='t2a'?'文字提示':task==='i2t'?'图片 + 文字提示':'输入语音'}</strong><p>{tasks[task].data}</p></div><div className="lab-card"><span className="lab-eyebrow">02 · 有效监督目标</span><strong>{task==='i2t'?'回答文字':'目标音频'+(task==='a2a'?' + 回答文字':'')}</strong><p>{tasks[task].mask}</p></div><div className="lab-card active"><span className="lab-eyebrow">03 · 允许更新的参数</span><strong>{names.filter((_,i)=>active(i)).join('、')}</strong><p>外部编码器及 Mimi 始终冻结。</p></div></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{names.slice(0,4).map((name,i)=><div key={name} className={'lab-card '+(active(i)?'active':'')}><strong>{name}</strong><p>{active(i)?'参与任务 · 更新参数':((i===0)||(i===1&&task!=='i2t')||(i===2&&task==='a2a')||(i===3&&task==='i2t'))?'参与计算 · 参数冻结':'当前任务不使用此路径'}</p><span className="lab-token">{active(i)?'θ → θ − η∇L':'θ 保持不变'}</span></div>)}</div><p className="lab-note">参数更新公式仅说明梯度下降方向，不展示真实梯度或实际优化器运行结果。</p>
  <div className="ctrl" style={{display:'flex',flexWrap:'wrap',gap:8}}>{names.map((n,i)=><button className="chip" key={n} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{n} · {active(i)?'更新':'不更新'}</button>)}</div>
  <div className="feedback" aria-live="polite">{names[selected]}：{active(selected)?'当前参数范围允许更新，并参与所选任务。':'当前组合下不更新参数；这不一定意味着不参与前向计算。'} {mode==='projector'?'冻结的 Thinker 仍可传递梯度，使投影器学习。':'all 不会解冻外部编码器或 Mimi。'} {tasks[task].mask}</div>
  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}><span className="chip">条件区：音频 mask = 0</span><span className="chip">目标文字：Ltext</span><span className="chip">{task==='i2t'?'无目标音频':'目标音频：Σ Laudio(q)'}</span></div>
  <p>任务描述“学什么”，训练模式描述“哪些参数更新”。这些控件不是训练时间顺序；论文描述与实现脚本的阶段表述须分别理解，不能拼成唯一固定流水线。</p>
  <p><a href="https://arxiv.org/pdf/2605.03937v1#page=6" target="_blank" rel="noreferrer">来源：PDF 第 6 页 §5、公式 1；第 7 页表 1</a>。数据为完整发布集；论文的 4×3090 配置与 mini 示例不同。</p>
 <GradientWorkbench key={task+'-'+mode} task={task} mode={mode}/></Panel>;
}

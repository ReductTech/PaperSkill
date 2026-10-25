import {useState,useRef} from 'react';
import {Stage,C,box,line,label,arrow,Chips,Notice,Stat,Lab,Legend} from './maple-kit';
import {Sequence,ActionCaption} from './maple-sequence';
export function MapleDepth(){
 const [preset,setPreset]=useState(2),[layer,setLayer]=useState(1),[step,setStep]=useState(0),[replay,setReplay]=useState(0);
 const motion=useRef({key:'',at:0});const J=[1,3,9][preset],fresh=layer<=J;
 const sub=String(layer-1).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
 const steps=fresh?['保留普通 token',layer===1?'空出提示位置':'移出旧提示','放入本层新提示','进入冻结层']:['承接上层输出','检查注入边界','继续传递提示','进入冻结层'];
 const actions=fresh?[
 ['先保留已经编码过的信息',layer===1?'先准备原输入的 token；第 1 层还没有上一层提示状态。':'玫瑰色普通 token 保留。它们已经吸收了此前提示的信息。'],
 ['只处理右侧的提示位置',layer===1?'为浅层提示预留位置，原来的词与图像 patch 不会被替换。':'旧提示的隐藏状态退出；左边普通 token 的隐藏状态不变。'],
 ['把本层提示放进空出的槽位','文字侧使用 P'+(layer-1)+'；视觉侧使用 F'+(layer-1)+'(P'+(layer-1)+')。两支的提示分别进入各自序列。'],
 ['两条序列分别进入冻结层','本层权重不更新，但输出会受到新提示影响。这些输出将成为下一层的输入。']
 ]:[
 ['接住上一层的完整序列','普通 token 和提示位置都已经是经过编码后的隐藏状态。'],
 ['已经越过 J = '+J+' 的注入边界','本层没有一组新的可学习提示，旧提示位置不会被清空。'],
 ['把提示隐藏状态一起传下去','橙色表示前层产生的提示状态；它会继续变化，不是固定不动的参数。'],
 ['继续经过本层编码','普通 token 与提示状态一起编码。之后的层同样不再新增提示参数。']
 ];
 const draw=(c:CanvasRenderingContext2D,w:number,h:number,t:number)=>{
  const key=[layer,preset,step,replay].join('/');if(key!==motion.current.key)motion.current={key,at:t};const a=t===0?1:Math.min(1,Math.max(0,(t-motion.current.at)/1.2));const e=1-Math.pow(1-a,3);
  c.save();c.scale(w/1080,h/420);
  label(c,'保留的信息',319,30,14,C.muted,'center');label(c,'提示位置 · 每支 2 个',650,30,14,C.muted,'center');
  const rows=[60,243];
  rows.forEach((y,row)=>{
   box(c,25,y,759,126,'#fff',C.border,20);label(c,row===0?'文字':'视觉',56,y+38,18,C.blue);label(c,'序列',56,y+64,12,C.muted);
   for(let i=0;i<5;i++){const x=148+i*68+(step===3?e*5:0);box(c,x,y+30,54,64,'#f9e9f1','#e5c4d4',10);line(c,x+12,y+49,x+42,y+49,C.blue,3);line(c,x+12,y+59,x+32,y+59,C.light,3);if(layer>1)line(c,x+10,y+82,x+44,y+82,C.green,3);}
   line(c,509,y+19,509,y+106,C.border,1,[3,5]);
   for(let i=0;i<2;i++){const x=550+i*104;box(c,x,y+25,82,74,'#fcf8fa',C.border,13);
    const oldVisible=layer>1&&(!fresh||step<2);if(oldVisible){const leaving=fresh&&step===1;c.save();c.globalAlpha=leaving?1-e:1;const yy=y+25-(leaving?e*25:0);box(c,x,yy,82,74,'#f9ecdf',C.orange,13);label(c,'h',x+41,yy+27,29,C.orange,'center');label(c,'上层状态',x+41,yy+54,11,C.orange,'center');c.restore();}
    if(fresh&&step>=2){const entry=step===2?e:1;c.save();c.globalAlpha=entry;const yy=y+25-24*(1-entry);box(c,x,yy,82,74,row===0?'#eaf3ef':'#f4edf9',row===0?C.green:C.purple,13);label(c,(row===0?'P':'P̃')+sub,x+41,yy+34,27,row===0?C.green:C.purple,'center');label(c,'向量 '+(i+1),x+41,yy+59,10,row===0?C.green:C.purple,'center');c.restore();}
    if((layer===1&&step<2)||(fresh&&step===1&&a===1)){label(c,'空槽',x+41,y+63,14,C.light,'center');}
   }
   const color=step===3?C.blue:C.border;arrow(c,794,y+63,833,y+63,color,2);if(step===3&&a<1){c.beginPath();c.arc(796+34*e,y+63,4,0,Math.PI*2);c.fillStyle=C.blue;c.fill();}
  });
  if(fresh&&step>=2){c.save();c.globalAlpha=step===2?e:1;line(c,641,187,641,196,C.purple,2);arrow(c,641,225,641,240,C.purple,2);box(c,611,196,60,30,'#fff',C.purple,10);label(c,'F'+sub,641,211,19,C.purple,'center');label(c,'由文字提示生成',555,211,12,C.muted,'right');c.restore();}
  else label(c,fresh?'左侧信息保留，右侧按步骤处理':'两个分支都保留完整序列',400,213,14,C.muted,'center');
  [60,243].forEach((y,row)=>{box(c,846,y,208,126,'#fff',step===3?C.blue:C.border,20);for(let i=2;i>=0;i--)box(c,876+i*4,y+20-i*3,148,31,'#fbf1f6',C.border,7);label(c,'第 '+layer+' 层',950,y+69,23,C.ink,'center');label(c,step===3?'编码 → 新隐藏状态':'等待本层输入',950,y+98,12,step===3?C.blue:C.muted,'center');});
  label(c,'普通 token：原来的词、patch、CLS 等（这里只画少量位置）',34,397,12,C.muted);label(c,'两支编码器权重均冻结',1050,397,12,C.muted,'right');c.restore();
 };
 return <Lab><div className="maple-tag">逐层观察 · 把一次提示替换拆成四步</div>
 <Chips label="新提示覆盖前几层" items={['J = 1','J = 3','J = 9']} value={preset} onChange={n=>{setPreset(n);setStep(0)}}/>
 <div className="maple-layer-select" role="group" aria-label="选择编码层"><span>当前编码层</span>{Array.from({length:12},(_,i)=><button type="button" key={i} data-fresh={i<J} aria-pressed={layer===i+1} onClick={()=>{setLayer(i+1);setStep(0)}} aria-label={'第 '+(i+1)+' 层'}>{i+1}</button>)}</div>
 <Sequence steps={steps} value={step} onChange={setStep} caption={'第 '+layer+' 层 · '+(fresh?'注入本层提示':'继续传播隐藏状态')}/>
 <Stage height={420} label={'第'+layer+'层，第'+(step+1)+'步：'+actions[step][0]+'。'+actions[step][1]} draw={draw}/>
 <ActionCaption label={'0'+(step+1)} action={actions[step][0]} result={actions[step][1]}/>
 <div className="maple-actions"><button className="maple-action-button" disabled={step===0} onClick={()=>setStep(s=>s-1)}>← 上一步</button><button className="maple-action-button maple-primary-action" disabled={step===3&&layer===12} onClick={()=>{if(step<3)setStep(s=>s+1);else{setLayer(n=>n+1);setStep(0)}}}>{step===3?'进入下一层 →':'下一步 →'}</button><button className="maple-action-button" onClick={()=>setReplay(n=>n+1)}>重播当前变化</button></div>
 <Legend items={[{label:'玫瑰色：普通 token',color:C.blue},{label:'绿色：文字提示参数',color:C.green},{label:'紫色：映射生成的视觉提示',color:C.purple},{label:'橙色：提示隐藏状态',color:C.orange}]}/>
 <div className="maple-grid"><Stat label="本层提示来源" value={fresh?'P'+(layer-1)+' 与 F'+(layer-1)+'(P'+(layer-1)+')':'前层隐藏状态'} note={fresh?'文字提示与派生视觉提示':'没有新增一组可学习提示'}/><Stat label="可学习文字提示组数" value={J+' 组'}/><Stat label="每层提示槽位" value="2 个 / 分支" note="不会逐层累加"/></div>
 <Notice tone={fresh?'green':'orange'}>{fresh?'换提示槽位不会清空普通 token 已经吸收的信息。即使 J=1，MaPLe 仍有两支提示与耦合映射，并不等于 CoOp。':'超过 J 只意味着不再新增参数提示；提示的隐藏状态仍参与后续编码，并会随计算改变。'}</Notice>
  <details><summary>普通 token 是什么？深层提示又增加了什么？</summary><p>普通 token 是原输入里的词 token、图像 patch 与 CLS 等。图中只画少量槽位，绿色下划线只表示此前提示产生了影响，不是实际特征值。</p><p>深层提示增加可学习提示的组数，而不是让 token 在每一层不断堆积。第 k 层（k ≤ J）使用 Pₖ₋₁ 与 Fₖ₋₁(Pₖ₋₁)；超过 J 后继续处理现有隐藏状态。各早期层默认有自己的耦合映射 Fᵢ。J = 9 表示第 1 层及之后 8 层得到新提示。</p><p>这幅图只说明计算结构，不表示深度越大准确率越高。论文在其验证设置中报告 J = 9 最好；改变 J 仍需实验评估。</p></details>
  <p className="maple-source">机制依据：论文 §3.2.1–3.2.3；深度实验见图 4。参数 Pᵢ 与经过一层后的隐藏状态在图中使用不同颜色。</p>
 </Lab>;
}

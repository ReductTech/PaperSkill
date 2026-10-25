import React,{useState,useRef} from 'react';
import {Stage,C,box,line,label,photo,arrow,Chips,Notice,Stat,Lab,Legend} from './maple-kit';
import {Sequence,ActionCaption} from './maple-sequence';
const notes=[
 '同一张图片进入视觉分支，所有候选类名进入文字分支。类名是输入的一部分；学到的上下文提示在类别与图片之间共享。',
 'Pᵢ 放入文字提示槽位；Fᵢ(Pᵢ) 放入视觉提示槽位。Fᵢ 映射的是提示参数，方向是文字提示到视觉提示，维度 512 → 768。',
 '两支各自经过冻结的 Transformer。文字侧读 EOT 位置，视觉侧读 CLS 位置；这些特征已经受到提示影响。没有额外的跨分支注意力。',
 'EOT 与 CLS 的读出分别经过 CLIP 原有的冻结投影，进入共同的 512 维空间，再做长度归一化。这两个投影都不是 Fᵢ。',
 '归一化图像特征 v 与每个候选类别特征 t_c 计算相似度，选分数最高的类别。实际训练再把这些分数缩放为 logits，使用交叉熵；测试阶段不更新提示。'
];
const names=['1 输入 token','2 注入提示','3 编码与读出','4 投影与归一化','5 比较并预测'];
export function MapleArchitecture(){
 const [stage,setStage]=useState(0),[replay,setReplay]=useState(0);
 const motion=useRef({key:'0/0',at:-10});
 const draw=(c:CanvasRenderingContext2D,w:number,h:number,t:number)=>{
  const key=stage+'/'+replay;if(motion.current.key!==key)motion.current={key,at:t};const a=t===0?1:Math.min(1,Math.max(0,(t-motion.current.at)/1.05));
  c.save();c.scale(w/1080,h/360);
  const alpha=(n:number)=>{c.globalAlpha=stage>=n?1:.16;};
  const card=(x:number,y:number,cw:number,ch:number,text:string,n:number,color:string)=>{alpha(n);c.save();c.shadowColor=stage===n?'#9e456a16':'#9e456a08';c.shadowBlur=stage===n?20:10;c.shadowOffsetY=5;box(c,x,y,cw,ch,'#fff',stage===n?color:C.border,15);c.restore();if(text)label(c,text,x+cw/2,y+ch/2,21,color,'center');};
  const straight=(x1:number,y1:number,x2:number,y2:number,color:string,n:number)=>{alpha(n);line(c,x1,y1,x2,y2,C.border,2);if(stage>=n)arrow(c,x1,y1,x1+(x2-x1)*(stage===n?a:1),y1+(y2-y1)*(stage===n?a:1),color,2.4);};
  const curve=(p:number[],color:string,n:number)=>{alpha(n);const drawPart=(end:number,stroke:string,width:number)=>{c.beginPath();c.moveTo(p[0],p[1]);for(let i=1;i<=48;i++){const k=end*i/48,u=1-k;c.lineTo(u*u*u*p[0]+3*u*u*k*p[2]+3*u*k*k*p[4]+k*k*k*p[6],u*u*u*p[1]+3*u*u*k*p[3]+3*u*k*k*p[5]+k*k*k*p[7]);}c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.stroke();};drawPart(1,C.border,1.8);if(stage>=n)drawPart(stage===n?a:1,color,2.5);};
  c.globalAlpha=1;label(c,'文字',28,29,17,C.blue);label(c,'视觉',28,209,17,C.blue);
  curve([193,97,253,20,358,20,415,97],C.blue,1);curve([193,268,253,345,358,345,415,268],C.blue,1);
  straight(372,97,415,97,C.green,1);straight(372,268,415,268,C.purple,1);straight(318,130,318,230,C.purple,1);
  straight(421,97,448,97,C.blue,2);straight(421,268,448,268,C.blue,2);straight(618,97,646,97,C.blue,2);straight(618,268,646,268,C.blue,2);
  straight(704,97,742,97,C.blue,3);straight(704,268,742,268,C.blue,3);
  curve([890,97,942,97,943,131,974,165],C.orange,4);curve([890,268,942,268,943,233,974,198],C.orange,4);
  card(25,58,168,78,'',0,C.blue);['SOS','类名','EOT'].forEach((n,i)=>{box(c,35+i*53,82,47,32,'#faedf3',undefined,7);label(c,n,58+i*53,98,14,C.blue,'center');});
  card(25,229,168,80,'',0,C.blue);photo(c,36,238,62,62,0);box(c,111,240,65,23,'#faedf3',undefined,6);label(c,'CLS',144,252,13,C.blue,'center');for(let i=0;i<6;i++)box(c,113+(i%3)*21,271+Math.floor(i/3)*15,16,11,'#efdae4',undefined,3);
  card(266,65,106,64,'Pᵢ',1,C.green);card(266,236,106,64,'P̃ᵢ',1,C.purple);card(290,157,56,48,'Fᵢ',1,C.purple);
  alpha(1);[97,268].forEach(y=>{c.beginPath();c.arc(415,y,7,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.strokeStyle=C.border;c.lineWidth=1.5;c.stroke();});
  card(448,63,170,68,'文字编码器',2,C.blue);card(448,234,170,68,'视觉编码器',2,C.blue);
  alpha(2);[63,234].forEach(y=>{box(c,595,y+8,13,10,'#fff',C.muted,2);line(c,598,y+8,598,y+4,C.muted,1.2);line(c,598,y+4,605,y+4,C.muted,1.2);line(c,605,y+4,605,y+8,C.muted,1.2);});
  box(c,646,77,58,40,'#faedf3',undefined,10);label(c,'EOT',675,98,16,C.blue,'center');box(c,646,248,58,40,'#faedf3',undefined,10);label(c,'CLS',675,269,16,C.blue,'center');
  card(742,63,148,68,'',3,C.blue);card(742,234,148,68,'',3,C.blue);alpha(3);[63,234].forEach(y=>{label(c,'冻结投影',816,y+26,18,C.blue,'center');label(c,'归一化',816,y+49,14,C.muted,'center');});label(c,'t_c',925,81,19,C.blue,'center');label(c,'v',925,287,19,C.blue,'center');
  card(967,144,88,77,'比较',4,C.orange);alpha(4);label(c,'取最高分',1011,244,16,C.orange,'center');
  c.globalAlpha=1;label(c,'Pᵢ → Fᵢ(Pᵢ)' ,318,329,14,C.purple,'center');label(c,'分别编码',533,181,15,C.muted,'center');label(c,'共同特征空间',816,181,15,C.muted,'center');
  c.restore();
 };
 return <Lab>
  <div className="maple-tag">完整前向图 · 沿五个节点逐步点亮</div>
  <p>沿两个对称分支向右走：先看提示在哪里进入，再看编码、读出和最后的类别比较。每一步只点亮对应的因果路径。</p>
  <Sequence caption="一次预测 · 五个可停留的步骤" steps={names.map(n=>n.slice(2))} value={stage} onChange={setStage} duration={3600}/>
  <Stage height={360} label={'MaPLe完整前向结构，当前高亮'+names[stage]+'；文字提示经F映射到视觉提示，两支独立编码后在最终特征空间比较'} draw={draw}/>
  <div className="maple-actions"><button type="button" className="maple-action-button maple-primary-action" onClick={()=>setStage(n=>(n+1)%5)}>{stage===4?'回到输入':'下一步 →'}</button><button type="button" className="maple-action-button" onClick={()=>setReplay(n=>n+1)}>重播当前路径</button></div>
  <Legend items={[{label:'绿色 Pᵢ：可训练文字提示',color:C.green},{label:'紫色 Fᵢ：可训练映射；P̃ᵢ 为派生提示',color:C.purple},{label:'灰色：冻结的预训练模块',color:C.muted},{label:'橙色：类别比较',color:C.orange}]}/>
  <ActionCaption label={'0'+(stage+1)} action={names[stage].slice(2)} result={notes[stage]}/>
  <div className="maple-grid"><Stat label="提示耦合映射 Fᵢ" value="512 → 768" note="可训练；作用于每层提示"/><Stat label="最终图文特征维度" value="512 与 512" note="CLIP 原有投影；预训练权重冻结"/><Stat label="本图省略的重复结构" value="前 J 层" note="Pᵢ、Fᵢ 按层使用；详见第5章"/></div>
  <details><summary>读出 token 与归一化分别做什么？</summary><p>EOT 是文字结束位置的 token；CLS 是视觉分支汇总图像信息的 token。它们在本图中表示各自编码器输出的对应位置，而不是新的可学习提示。文字序列实际包含 SOS、上下文提示、固定模板余词、类名及 EOT；视觉序列包含 CLS、图像 patches 和视觉提示。图中省略填充与大部分 patch。</p><p>读出后经预训练投影得到 z，再做 z / ‖z‖，得到图像的 v 与类别文字的 t_c；这样点积表达方向相似性。Fᵢ 的 512 → 768 是中间提示维度匹配，不是把最终两支特征拉到同一维度的那一步。</p></details>
  <details><summary>这张图没有哪些看起来很像的结构？</summary><p>没有让图像 token 对文字 token 做跨模态注意力；没有把文字编码器的最终类别向量送回视觉提示；也没有把类别名称输入 Fᵢ。两支通过提示参数耦合，并在最终类别相似度与共同损失中关联。</p></details>
  <p className="maple-source">结构依据：论文图 2、§3.1–3.2；EOT / CLS 读出与归一化经官方实现核对。此图不展示真实预测分数。</p>
 </Lab>;
}

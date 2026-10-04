import { useState } from 'react';
import { Scene, colors, photo, panel, line, dot, label } from './vc-visual-kit';
const tools=[
 {name:'图像描述',use:'概括画面内容',input:'图像',output:'文字描述',result:'黄色的花朵，背景为绿色。',why:'得到的是文字概括，不是空间深度图。',kind:'caption'},
 {name:'视觉问答',use:'回答关于图像的问题',input:'图像 ＋ 问题',output:'文字答案',result:'问：花是什么颜色？ 答：黄色。',why:'针对问题给出文字答案，不能替代深度估计。',kind:'vqa'},
 {name:'深度估计',use:'估计图像的远近结构',input:'图像',output:'深度条件图',result:'获得后续生成可使用的深度条件。',why:'输入和目标产物都与“估计这张图的深度”一致。',kind:'depth'},
 {name:'文字生成图像',use:'根据文字生成新图像',input:'文字描述',output:'新生成的图像',result:'根据“红色花朵”生成新图像。',why:'该工具依据文字合成画面；这不是对已有图像做深度估计。',kind:'generate'}
];
export default function ToolSelection(){
 const [chosen,setChosen]=useState(2);const s=tools[chosen];
 return <div data-widget="rev-ch4"><p><strong>当前目标：</strong>从这张花朵图像估计深度，为后续生成提供结构条件。</p><div className="ctrl">{tools.map((v,i)=><button key={v.name} type="button" className={`chip ${chosen===i?'active':''}`} aria-pressed={chosen===i} onClick={()=>setChosen(i)}>{v.name}</button>)}</div>
 <Scene height={345} animate label={`工具选择：${s.name}，输入${s.input}，输出${s.output}`} draw={(c,t)=>{
  const progress=(t%5)/5,color=chosen===2?colors.green:colors.blue;
  label(c,'输入：'+s.input,40,35,colors.ink,20);label(c,'输出：'+s.output,760,35,colors.ink,20);
  if(chosen===3){panel(c,40,65,250,170);label(c,'红色花朵',100,151,colors.blue,26);}else{photo(c,40,65,250,170,'yellow');c.save();c.beginPath();c.rect(48,73,234,147);c.clip();line(c,48,73+(t%2)/2*147,282,73+(t%2)/2*147,color,3);c.restore();}
  line(c,299,154,402,154,color,3);line(c,669,154,752,154,color,3);
  panel(c,407,84,255,140,'#fff',color);label(c,s.name,428,116,color,23);label(c,s.use,428,151,colors.ink,17);label(c,'按约定处理输入',428,184,colors.muted,17);
  line(c,428,210,428+211*progress,210,color,4);
  if(chosen===2||chosen===3){photo(c,764,65,268,170,chosen===2?'depth':'red');c.save();c.globalAlpha=.55*(1-progress);c.fillStyle=colors.bg;c.fillRect(772,73,252,147);c.restore();}
  else{panel(c,764,65,268,170);const text=chosen===0?['一朵黄色的花，','绿色的背景。']:['问题：花的颜色？','答案：黄色。'];text.forEach((v,i)=>label(c,v.slice(0,Math.min(v.length,Math.floor(progress*25))),783,128+i*39,colors.ink,20));}
  dot(c,299+103*((t%1.5)/1.5),154,6,color);dot(c,669+83*((t%1.5)/1.5),154,6,color);
  label(c,chosen===2?'适合当前目标：输出正是需要的深度条件':'能力不同：这个输出不能满足当前深度目标',40,283,chosen===2?colors.green:colors.orange,22);
 }}/><div className="feedback" aria-live="polite"><strong>{s.result}</strong><div>{s.why}</div></div></div>;
}
const fields=[
 {name:'名称',value:'Depth Estimation',description:'可被控制器引用的工具名，用来准确指定要执行的能力。',needed:true},
 {name:'用途',value:'从图像估计空间远近',description:'告诉控制器何时应该使用它，并与描述图片、回答问题等能力区分。',needed:true},
 {name:'输入与输出',value:'输入图像 → 输出深度图',description:'调用输入必须满足工具约定；输出类型决定它能否接到下一项工具。',needed:true},
 {name:'可选示例',value:'图像 → 深度估计 → 深度条件',description:'示例能进一步展示用法，但不是所有工具说明都必须包含示例。',needed:false}
];
export function ToolSpecification(){
 const [field,setField]=useState(2);const [example,setExample]=useState(true);const item=fields[field];
 return <div data-widget="rev-ch4-spec"><div className="ctrl">{fields.map((v,i)=><button type="button" key={v.name} className={`chip ${field===i?'active':''}`} aria-pressed={field===i} onClick={()=>setField(i)}>{v.name}</button>)}<label style={{marginLeft:12}}><input type="checkbox" checked={example} onChange={e=>setExample(e.target.checked)}/> 展示可选示例</label></div>
 <Scene height={330} animate label={`工具说明的${item.name}字段，${example?'包含':'省略'}可选示例`} draw={(c,t)=>{
  fields.forEach((v,i)=>{const y=20+i*74,enabled=i!==3||example;panel(c,22,y,604,63,field===i?'#eaf2e2':'#fff',field===i?colors.green:colors.border);label(c,v.name,39,y+26,enabled?colors.blue:colors.muted,18);label(c,enabled?v.value:'可以省略；其余说明依然有效',204,y+38,enabled?colors.ink:colors.muted,18);if(field===i){line(c,39,y+53,39+570*((t%3)/3),y+53,colors.green,3);}});
  panel(c,724,65,327,188,'#fff',colors.blue);label(c,'用于选择与调用',751,104,colors.blue,23);label(c,'准确找到工具',751,144,colors.ink,19);label(c,'匹配当前任务',751,180,colors.ink,19);label(c,'检查输入输出能否衔接',751,216,colors.ink,19);
  const y=51+field*74;line(c,630,y,675,y,colors.blue,2);line(c,675,y,675,157,colors.blue,2);line(c,675,157,720,157,colors.blue,2);dot(c,633+40*((t%2)/2),y,6,colors.blue);
 }}/><div className="feedback" aria-live="polite"><strong>{item.name}：</strong>{item.description}{!example&&field===3?' 当前已省略示例，工具的名称、用途和输入输出仍然保留。':''}</div></div>;
}

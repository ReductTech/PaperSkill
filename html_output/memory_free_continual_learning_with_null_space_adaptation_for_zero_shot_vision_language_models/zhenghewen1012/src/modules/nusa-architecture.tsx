import { useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line, arrow } from './nusa-kit';

export function NusaArchitecture() {
  const [encoder,setEncoder]=useState('image');
  const [proj,setProj]=useState('q');
  const [adapt,setAdapt]=useState('both');
  const width=encoder==='image'?768:512;
  const active=adapt==='both'||adapt===encoder;
  const avg=adapt==='both'?75.08:adapt==='text'?72.62:70.49;
  const projectionNames:Record<string,string>={q:'查询投影 Q',k:'键投影 K',v:'值投影 V',o:'输出投影 O'};
  const nodeIndices:Record<string,number>={q:0,k:1,v:2,o:3};
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Chips label="编码器" value={encoder} options={[{value:'image',label:'视觉编码器'},{value:'text',label:'文本编码器'}]} onChange={setEncoder}/>
    <Chips label="注意力投影" value={proj} options={['q','k','v','o'].map(value=>({value,label:value.toUpperCase()}))} onChange={setProj}/>
    <Chips label="适配范围" value={adapt} options={[{value:'both',label:'双模态'},{value:'text',label:'仅文本'},{value:'image',label:'仅视觉'}]} onChange={setAdapt}/>
    <Scene label={`CLIP 双编码器，当前选择${encoder==='image'?'视觉':'文本'}${proj.toUpperCase()}投影，${active?'启用':'停用'}适配分支`} draw={(ctx)=>{
      ['image','text'].forEach((branch,i)=>{const y=70+i*125;const enabled=adapt==='both'||adapt===branch; const selected=branch===encoder;
        ctx.fillStyle=selected?'#fff':C.bg;ctx.fillRect(35,y-35,560,88);ctx.strokeStyle=selected?C.blue:C.axis;ctx.lineWidth=selected?3:1;ctx.strokeRect(35,y-35,560,88);
        text(ctx,i===0?'视觉':'文本',55,y+7,18);
        for(let j=0;j<4;j++){const x=j===3?460:180, ny=j===3?y:y+(j-1)*26, chosen=selected&&j===nodeIndices[proj];const h=j===3?40:20;ctx.fillStyle=chosen?C.orange:enabled?C.light:'#e7ebe5';ctx.fillRect(x,ny-h/2,58,h);ctx.strokeStyle=chosen?C.blue:C.axis;ctx.lineWidth=chosen?4:1;ctx.strokeRect(x,ny-h/2,58,h);if(j<3){line(ctx,125,y,170,ny,C.axis);line(ctx,245,ny,355,y,chosen?C.blue:C.axis,chosen?3:1);}if(enabled){ctx.fillStyle=C.green;ctx.fillRect(x+62,ny-4,7,8);}}
        ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.beginPath();ctx.arc(377,y,18,0,Math.PI*2);ctx.stroke();arrow(ctx,399,y,448,y,selected?C.blue:C.axis);arrow(ctx,527,y,660,y,enabled?C.green:C.axis);
        ctx.fillStyle=enabled?C.green:C.light;ctx.beginPath();ctx.arc(690,y,21,0,Math.PI*2);ctx.fill();
      });
      line(ctx,710,70,805,132,C.axis);line(ctx,710,195,805,132,C.axis);
      const y=encoder==='image'?70:195;
      arrow(ctx,710,y,805,132,active?C.green:C.blue);
      ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.beginPath();ctx.arc(830,132,25,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=active?C.orange:C.light;ctx.fillRect(900,90,110,85);text(ctx,String(active?16384:0),914,137,20);
    }}/>
    <Panel><span>{projectionNames[proj]} · W ∈ ℝ<sup>{width}×{width}</sup></span><span>M ∈ ℝ<sup>128×128</sup></span><span>当前投影训练系数：{active?'16,384':'0'}</span><span>MTIL Avg：{avg.toFixed(2)}%</span></Panel>
    <Feedback tone="good">{encoder==='image'?'视觉':'文本'}编码器的 {proj.toUpperCase()} 投影{active?'启用 M 更新，奇异基和原权重在任务内冻结':'保持冻结'}。{adapt==='both'?'双分支共 96 个注意力投影，固定槽位的 M 系数总数为 1,572,864。':'当前适配 48 个注意力投影，固定槽位的 M 系数总数为 786,432。'}</Feedback>
    <p>两支编码器各含 12 层。选定投影的适配路径：x → Vₙᵀx → M(Vₙᵀx) → UₙM(Vₙᵀx)，与 Wx 相加。Q 与 K 的点积形成注意力权重，权重对 V 聚合后，经 O 输出。</p>
    <DataTable headers={['位置', '输入 → 输出', '当前状态']} rows={[["原投影 Wx", `${width} → ${width}`, "冻结 W"],["Vₙᵀ", `${width} → 128`, "固定右侧奇异基"],["M", "128 → 128", active?"训练":"冻结"],["Uₙ", `128 → ${width}`, "固定左侧奇异基"],["分支缩放", "α / √rmax", "Full-shot：2 / √128 ≈ 0.1768"]]} caption="CLIP ViT-B/16；论文 Fig.1、§3.2；官方代码 src/methods/nusa.py、src/loralib/layers.py"/>
    <details><summary>双编码器消融结果</summary><DataTable headers={['适配范围','Transfer (%)','Avg (%)','Last (%)']} rows={[["双模态",68.58,75.08,82.79],["仅文本",68.47,72.62,79.09],["仅视觉",65.14,70.49,77.86]]} caption="论文 Table 4(a)，Full-shot MTIL"/><p>官方实现使用 rmax = 128 的固定槽位；若有效尾部秩较小，其余基向量槽位置零。可发挥作用的系数位于有效子块。Table 1 将 NuSA-CL 的训练参数成本记为约 1.5M。</p></details>
    <button className="tiny ghost" onClick={()=>{setEncoder('image');setProj('q');setAdapt('both');}}>重置</button>
  </div>;
}

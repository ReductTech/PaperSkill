import React, { useState } from 'react';
import { Scene, colors, panel, line, dot, label } from './vc-visual-kit';

const scenarios = [
  { tab: '深度已就绪', observation: '深度估计工具返回深度条件', target: '生成红花，再转为卡通', choice: 0, next: '调用深度条件生成工具', detail: '目标尚未完成：把已有深度条件和红花要求交给下一项工具。' },
  { tab: '红花已生成', observation: '生成工具返回红花图像', target: '生成红花，再转为卡通', choice: 0, next: '调用风格转换工具', detail: '还差卡通化：使用刚刚生成的红花图像继续处理。' },
  { tab: '卡通结果已返回', observation: '风格工具返回卡通红花结果', target: '生成红花，再转为卡通', choice: 1, next: '向用户展示结果与说明', detail: '已收到完成所请求步骤的结果，可以结束本轮并向用户展示结果。' },
  { tab: '风格要求不明确', observation: '用户说“改成我喜欢的风格”', target: '缺少具体风格要求', choice: 2, next: '询问用户想要什么风格', detail: '缺少必要信息时，先把问题交还用户；不能把任意风格当作确定需求继续执行。' },
];
function flow(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, t: number, color: string) {
  line(c, x1, y1, x2, y2, color, 2); const a = Math.atan2(y2-y1,x2-x1);
  line(c,x2,y2,x2-9*Math.cos(a-.5),y2-9*Math.sin(a-.5),color,2); line(c,x2,y2,x2-9*Math.cos(a+.5),y2-9*Math.sin(a+.5),color,2);
  const p = ((t*.45)%1+1)%1; dot(c,x1+(x2-x1)*p,y1+(y2-y1)*p,4,color);
}
export default function OutputManagement() {
  const [scenario, setScenario] = useState(0); const item = scenarios[scenario];
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>{scenarios.map((s,i)=><button key={s.tab} type="button" aria-pressed={scenario===i} onClick={()=>setScenario(i)} style={{padding:'10px 15px',borderRadius:8,border:`1px solid ${scenario===i?colors.blue:colors.border}`,background:scenario===i?colors.blue:'#fff',color:scenario===i?'#fff':colors.ink,cursor:'pointer'}}>{s.tab}</button>)}</div>
    <Scene height={350} animate label={`工具输出管理：${item.observation}；下一步${item.next}`} draw={(c,t)=>{
      panel(c,22,95,310,148); label(c,scenario===3?'新的对话输入':'视觉工具的执行反馈',40,128,colors.green,21); label(c,item.observation,40,164,colors.ink,17); label(c,'Prompt Manager 整理为文字',40,211,colors.muted,17);
      panel(c,398,95,283,148,'#fff',colors.blue); label(c,'语言控制器判断下一步',416,127,colors.blue,20); label(c,'结合目标与当前反馈',416,164,colors.ink,18); label(c,item.target,416,207,colors.muted,17);
      flow(c,334,167,396,167,t,colors.orange);
      const titles=['继续调用工具','结束本轮回答','向用户澄清'], subtitles=['目标还有未完成步骤','已收到所请求步骤的结果','必要要求仍不明确'];
      for(let i=0;i<3;i++){
        const y=20+i*108,selected=i===item.choice,color=[colors.blue,colors.green,colors.orange][i];
        panel(c,778,y,278,91,selected?'#ffffff':'#eff2eb',selected?color:colors.border);
        label(c,titles[i],795,y+31,selected?color:colors.muted,21);
        label(c,selected?item.next:subtitles[i],795,y+64,selected?colors.ink:colors.muted,16);
        if(selected)flow(c,683,167,776,y+45,t-.4,color);else line(c,683,167,776,y+45,colors.border,1);
      }
      label(c,'反馈支持后续决策；它并不是自动完成的视觉一致性验收。',22,328,colors.muted,17);
    }} />
    <p aria-live="polite" style={{margin:'12px 0 0',lineHeight:1.8}}>{item.detail}</p>
  </div>;
}

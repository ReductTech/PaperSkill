import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Controls, Chip, Feedback, drawCard, drawBook, circle, line, label } from './scene-kit';

const nodes = [
  { id: 'context', title: '上下文', x: 160, detail: '输入任务与已积累的思考、动作和观察，作为下一次生成的条件。', feedback: '上下文保存已有轨迹；思考写回这里时，不会自行产生新的环境观察。' },
  { id: 'model', title: '语言模型', x: 410, detail: '根据上下文生成思考或动作；思考回写上下文，工具动作交给环境执行。', feedback: 'ReAct 组织生成与交互的方式，没有新增一种神经网络层。' },
  { id: 'tool', title: '工具执行', x: 680, detail: '执行受支持的环境动作，例如 search 或 lookup，取得受限接口提供的结果。', feedback: '工具执行动作，不能替模型完成所有推理；finish 则提交答案并终止。' },
  { id: 'observation', title: '环境观察', x: 930, detail: '工具返回的信息写入上下文，成为下一次推理可用的新信息。', feedback: '观察来自环境返回。生成的思考虽可读，却不是环境证据，也不保证反映模型内部认知。' },
] as const;
type NodeId = typeof nodes[number]['id'];

export function SystemMap() {
  const [selected, setSelected] = useState<NodeId>('context');
  const current = nodes.find(n => n.id === selected)!;
  return <div>
    <CanvasScene key={selected} label={`系统职责图，当前选择${current.title}`} onPointerDown={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 1080;
      const y = (event.clientY - rect.top) / rect.height * 280;
      const hit = nodes.find(n => Math.hypot(x - n.x, y - 140) <= 70);
      if (hit) setSelected(hit.id);
    }} style={{ cursor: 'pointer' }} draw={(ctx, _w, _h, time) => {

      const phase=(time%7200)/7200;
      for(let i=0;i<3;i++){line(ctx,nodes[i].x+66,140,nodes[i+1].x-66,140,C.border,2);}
      line(ctx,410,72,410,38,C.purple,2);line(ctx,410,38,160,38,C.purple,2);line(ctx,160,38,160,73,C.purple,2);
      line(ctx,930,207,930,242,C.green,2);line(ctx,930,242,160,242,C.green,2);line(ctx,160,242,160,207,C.green,2);
      nodes.forEach((n,i)=>{circle(ctx,n.x,140,65,C.bg);ctx.strokeStyle=selected===n.id?C.blue:C.contour;ctx.lineWidth=selected===n.id?4:2;ctx.beginPath();ctx.arc(n.x,140,65,0,2*Math.PI);ctx.stroke();
        if(i===0){drawCard(ctx,n.x-42,101,84,76,C.blue);words(ctx,['任务','已知观察','当前计划'],n.x-30,122,13,C.blue,21);}
        if(i===1){circle(ctx,n.x,140,12,C.purple);for(let j=0;j<5;j++){const a=j*2*Math.PI/5;line(ctx,n.x,140,n.x+Math.cos(a)*36,140+Math.sin(a)*36,C.contour,2);circle(ctx,n.x+Math.cos(a)*36,140+Math.sin(a)*36,5,C.blue);}}
        if(i===2){drawBook(ctx,n.x-46,111,.52,C.support);words(ctx,['实体','页'],n.x-37,129,12,C.support,16);words(ctx,['检索','结果'],n.x+10,129,12,C.support,16);}
        if(i===3){drawCard(ctx,n.x-46,105,92,71,C.green);words(ctx,['工具返回','圣埃克苏佩里'],n.x-37,131,13,C.green,23);}
        label(ctx,n.title,n.x-36,224,C.text,16);
      });
      if(selected==='model'){
        const pts=[[410,72],[410,38],[160,38],[160,73]];const k=Math.min(2,Math.floor(phase*3));flow(ctx,...pts[k] as [number,number],...pts[k+1] as [number,number],phase*3-k,C.purple);
      }else{
        if(phase<.6){const k=Math.min(2,Math.floor(phase*5));flow(ctx,nodes[k].x+66,140,nodes[k+1].x-66,140,phase*5-k,k===2?C.green:C.blue);}
        else{const pts=[[930,207],[930,242],[160,242],[160,207]];const t=(phase-.6)/.4*3,k=Math.min(2,Math.floor(t));flow(ctx,...pts[k] as [number,number],...pts[k+1] as [number,number],t-k,C.green);}
      }
      label(ctx,'思考直接回写',227,27,C.purple,18);label(ctx,'观察进入上下文后，才参与下一次生成',358,271,C.green,17);

    }} />
    <Controls>{nodes.map(n => <Chip key={n.id} active={selected === n.id} onClick={() => setSelected(n.id)}>{n.title}</Chip>)}</Controls>
    <div style={{ minHeight: 72 }} aria-live="polite"><p><strong>{current.title}：</strong>{current.detail}</p></div>
    <Feedback>{current.feedback}</Feedback>
  </div>;
}

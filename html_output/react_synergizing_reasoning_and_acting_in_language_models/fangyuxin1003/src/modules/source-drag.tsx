import { panel, words, flow } from './original-visuals';
import { useRef, useState, type PointerEvent } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, line, label } from './scene-kit';

const entries = [
  { name: '思考', author: '模型生成', text: '先查清《小王子》的作者是谁，再查作者出生在哪座城市。', feedback: '这是模型生成的思考，仍可能包含错误。', color: C.blue },
  { name: '行动', author: '模型提出请求', text: 'search[The Little Prince]', feedback: '这是模型提出的动作请求，还不是环境结果。', color: C.orange },
  { name: '观察', author: '环境返回', text: '检索结果提到：《小王子》的作者是 圣埃克苏佩里。', feedback: '这是环境返回的观察；它可能缺失、过时或与问题无关。', color: C.green },
];
const centers = [210, 515, 835];

export function SourceDrag() {
  const [position, setPosition] = useState(120);
  const activePointer = useRef<number | null>(null);
  const selected = position < 350 ? 0 : position < 680 ? 1 : 2;
  const entry = entries[selected];
  function locate(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition(Math.max(80, Math.min(960, (event.clientX - rect.left) / rect.width * 1080)));
  }
  function release(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div>
    <CanvasScene label={`信息来源选择器，当前为${entry.name}。左右方向键切换。`} role="slider" tabIndex={0}
      aria-valuemin={0} aria-valuemax={2} aria-valuenow={selected} aria-valuetext={entry.name}
      style={{ touchAction: 'none', cursor: 'grab' }}
      onPointerDown={event => { if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return; activePointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); locate(event); }}
      onPointerMove={event => { if (activePointer.current === event.pointerId) locate(event); }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { activePointer.current = null; }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : Math.max(0, Math.min(2, selected + (event.key === 'ArrowLeft' ? -1 : 1)));
        setPosition(centers[next]);
      }}
      draw={(ctx, _w, _h, time) => {

      const examples = [['思考 · 模型生成','先查作品的作者','再核查作者出生地'],['行动 · 模型提出','search[The Little Prince]','等待环境执行'],['观察 · 环境返回','《小王子》的作者是','圣埃克苏佩里']];
      entries.forEach((item,index)=>{
        const x=[60,373,706][index];
        panel(ctx,x,74,294,126,selected===index?item.color:C.border);
        words(ctx,examples[index],x+17,106,18,item.color,32);
        if(selected===index)label(ctx,'当前查看',x+15,54,item.color,16);
      });
      ctx.strokeStyle=entry.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(position,144,38,0,Math.PI*2);ctx.stroke();
      line(ctx,position+28,174,position+66,211,C.support,10);
      const origin=selected===2?'工具返回':'模型生成'; const dest=selected===1?'环境执行':'上下文';
      label(ctx,origin,290,254,entry.color,17);label(ctx,dest,688,254,entry.color,17);
      flow(ctx,390,247,665,247,(time%2800)/2800,entry.color);

    }} />
    <Controls>{entries.map((item, index) => <Chip key={item.name} active={selected === index} onClick={() => setPosition(centers[index])}>{item.name}</Chip>)}</Controls>
    <div aria-live="polite" style={{ minHeight: 108 }}>
      <p><strong>{entry.name}</strong> · 来源：{entry.author}</p>
      <p>{entry.text}</p>
    </div>
    <Feedback tone="neutral">{entry.feedback}</Feedback>
  </div>;
}

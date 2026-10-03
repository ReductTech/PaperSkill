import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, drawBook, drawCard, line, label } from './scene-kit';

type Kind = 'thought' | 'search' | 'finish';
const states: Record<Kind, { name: string; context: string; environment: string; feedback: string }> = {
  thought: { name: '思考', context: '加入思考：“先核查相关作者的出生地点。”', environment: '外部环境不变；没有新的环境观察。', feedback: '思考扩充上下文，不改变外部环境，也没有新的环境观察。' },
  search: { name: 'search · 检索', context: '记录检索动作，并纳入工具返回的观察。', environment: '读取实体页面；返回的信息成为后续推理的依据。', feedback: '检索是环境动作；返回的观察会成为后续上下文。' },
  finish: { name: 'finish · 提交', context: '提交当前答案，当前轨迹终止。', environment: '不再检索；没有新增的检索证据。', feedback: 'finish 提交当前答案并结束任务；它不是再检索一次。' },
};

export function ActionSpace() {
  const [kind, setKind] = useState<Kind>('thought');
  const state = states[kind];
  return <>
    <CanvasScene key={kind} label={`机制示意：${state.name}；${state.environment}`} draw={(ctx, _w, _h, time) => {

      const phase=(time%6000)/6000;
      panel(ctx,70,66,410,160,C.contour);drawBook(ctx,690,74,1.45,C.contour);
      label(ctx,'上下文',82,43);label(ctx,'外部环境',692,43);
      words(ctx,['任务：确认出生地点','已有观察：作品作者已确认'],92,96,18,C.text,29);
      words(ctx,['圣埃克苏佩里','人物条目'],702,104,16,C.blue,27);words(ctx,['出生地点','里昂'],835,104,16,C.text,27);
      if(kind==='thought'){
        const length=Math.floor(Math.min(1,phase*2)*14);label(ctx,'计划：核查作者的出生地点'.slice(0,length),92,188,C.purple,19);
        ctx.fillStyle=C.purple;ctx.fillRect(450,56,17,40);label(ctx,'思考只追加到上下文',84,259,C.purple,17);
      }else if(kind==='search'){
        label(ctx,'search[Antoine de Saint-Exupéry]',92,158,C.blue,16);
        if(phase<.45){flow(ctx,493,104,669,104,phase/.45,C.blue);label(ctx,'发送查询',518,86,C.blue,16);}
        else if(phase<.8){flow(ctx,669,180,493,180,(phase-.45)/.35,C.green);label(ctx,'返回观察',518,207,C.green,16);}
        else label(ctx,'新观察：出生于里昂',92,193,C.green,18);
        label(ctx,'请求 → 返回 → 纳入上下文 · 循环示意',84,259,C.muted,17);
      }else{
        label(ctx,'已有观察：出生于里昂',92,157,C.green,18);
        label(ctx,'finish[Lyon]',92,192,C.blue,16);
        flow(ctx,493,172,617,172,Math.min(1,phase*3),C.blue);label(ctx,'结束',564,216,C.blue,18);
        label(ctx,'提交答案，不会增加新的检索证据',84,259,C.muted,17);
      }

    }} />
    <Controls>{(Object.keys(states) as Kind[]).map((value) => <Chip key={value} active={kind === value} onClick={() => setKind(value)}>{states[value].name}</Chip>)}</Controls>
    <div aria-live="polite" style={{ minHeight: 84 }}><p><strong>上下文：</strong>{state.context}<br /><strong>环境：</strong>{state.environment}</p></div>
    <Feedback>{state.feedback}</Feedback>
  </>;
}

import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, drawCard, label } from './scene-kit';

const tasks = {
  HotpotQA: { count: 6, dense: true, role: '多跳问答', feedback: 'HotpotQA 用 6 个示例，通常交错思考、行动和观察。' },
  FEVER: { count: 3, dense: true, role: '事实核验', feedback: 'FEVER 用 3 个示例，对检索到的事实进行核验。' },
  ALFWorld: { count: 2, dense: false, role: '交互决策', feedback: 'ALFWorld 用 2 个示例，只在需要规划或检查时插入思考。' },
  WebShop: { count: 1, dense: false, role: '商品选择', feedback: 'WebShop 用 1 个示例，思考帮助对齐商品选项与需求。' },
};
type Task = keyof typeof tasks;

export function PromptModes() {
  const [task, setTask] = useState<Task>('HotpotQA');
  const state = tasks[task];
  const stripeKinds = state.dense ? [0, 1, 2, 0, 1, 2, 0, 1, 2] : [0, 1, 2, 1, 2, 1, 2, 0, 1];
  return <>
    <CanvasScene key={task} label={`${task}：${state.count} 个示例，${state.dense ? '密集' : '稀疏'}思考示意`} draw={(ctx, _w, _h, time) => {

      label(ctx,'示例卡',92,42);label(ctx,'轨迹示意',550,42);
      for(let i=state.count-1;i>=0;i--)drawCard(ctx,93+i*19,73+i*13,247,107,i===0?C.blue:C.contour);
      const demos:Record<Task,string[]>={HotpotQA:['思考：先确认作者','行动：查 《小王子》','观察：圣埃克苏佩里'],FEVER:['思考：核查出生地点','行动：检索人物条目','观察：返回出生地'],ALFWorld:['思考：把杯子放到桌上','行动：查看柜台','观察：柜台上有杯子'],WebShop:['思考：核对商品要求','行动：搜索蓝色衬衫','观察：返回候选商品']};
      words(ctx,demos[task],109,101,15,C.blue,29);
      const sequences:Record<Task,string[]>={HotpotQA:['确认作者','查作品','圣埃克苏佩里','查出生地点','查作者','里昂','结合观察','提交答案'],FEVER:['核查主张','查人物','出生地','比较地点','查相关条目','返回事实','综合证据','提交标签'],ALFWorld:['寻找杯子','查看柜台','看到杯子','拿起杯子','已拿到杯子','走到桌边','到达桌边','计划放置杯子'],WebShop:['查蓝色衬衫','搜索商品','返回候选','打开商品','显示选项','选蓝色','颜色已选择','检查条件']};
      const kinds=state.dense?[0,1,2,0,1,2,0,1]:[0,1,2,1,2,1,2,0];
      const active=Math.floor((time%16000)/2000);
      sequences[task].forEach((text,i)=>{const col=i%4,row=Math.floor(i/4),x=540+col*128,y=65+row*98;const color=[C.purple,C.blue,C.green][kinds[i]];panel(ctx,x,y,119,80,i===active?color:C.border);label(ctx,['思考','行动','观察'][kinds[i]],x+10,y+24,color,14);label(ctx,text,x+10,y+51,C.text,14);if(i===active)flow(ctx,x+10,y+69,x+109,y+69,(time%2000)/2000,color);});

    }} />
    <div className="ctrl" aria-label="图例"><span>紫色：思考</span><span>蓝色：行动</span><span>绿色：观察</span></div>
    <Controls>{(Object.keys(tasks) as Task[]).map((value) => <Chip key={value} active={task === value} onClick={() => setTask(value)}>{value}</Chip>)}</Controls>
    <div aria-live="polite" style={{ minHeight: 84 }}><p><strong>{task} · {state.role}</strong>：{state.count} 个人工示例；{state.dense ? '密集交错思考与行动' : '按需要稀疏插入思考'}。<br />这些片段是教学示意，不是固定长度的生成剧本。示例数对应实验设置，不能调整为性能预测。</p></div>
    <Feedback>{state.feedback}</Feedback>
  </>;
}

import { useEffect, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { Choices, Feedback, Slider, Stage, apple, card, color, dot, fmt, label, line, rect, sigmoid } from './kit';

const costs = [[1.2, 1.4],[1.3, 3.1]];
export function Matching() {
  const [cross, set] = useState(0);
  const mapping = cross ? [1,0] : [0,1];
  const total = costs[0][mapping[0]]+costs[1][mapping[1]];
  const hue = cross ? color.green : color.blue;
  return <>
    <Stage name="预测框和标注框之间的两种完整配对" height={252} draw={ctx=>{
      card(ctx,22,22,405,204); card(ctx,450,22,285,204);
      const px=[132,315], gx=[132,315];
      px.forEach((x,i)=>{
        [0,1].forEach(j=>line(ctx,[x,75],[gx[j],177],mapping[i]===j?hue:color.edge,mapping[i]===j?4:1));
        dot(ctx,x,75,13,color.blue);
      });
      gx.forEach((x,i)=>apple(ctx,x,182,24,i===0));
      label(ctx,'预测',62,74,color.muted,19); label(ctx,'标注',62,180,color.muted,19);
      costs.forEach((row,i)=>row.forEach((cost,j)=>{
        const use=mapping[i]===j, x=479+j*125, y=57+i*76;
        rect(ctx,x,y,103,58,use?'#e4efdf':'#f2f5ec',use?hue:color.edge,8);
        label(ctx,fmt(cost,1),x+52,y+29,use?hue:color.ink,26);
      }));
    }}/>
    <Choices label="匹配方案" entries={[[0,'按顺序配'],[1,'交叉配']]} selected={cross} change={set} />
    <Feedback tone={cross?'good':undefined}>
      两组总成本分别是 4.3 和 2.7。当前 {fmt(costs[0][mapping[0]],1)} + {fmt(costs[1][mapping[1]],1)} = {fmt(total,1)}。
      {cross?'交叉配的总成本更小，两个预测各取一个标注。':'两个预测都更偏好矩阵第一列。如果各自只挑自己的最低成本，就会抢同一个标注。'}
    </Feedback>
  </>;
}
export function TokenLoss() {
  const [z,set] = useState(-1);
  const p = sigmoid(z);
  const loss = -.25 * (1-p)**2 * Math.log(p);
  return <>
    <Stage name="正例词分数上升时焦点损失下降" height={220} draw={ctx=>{
      card(ctx,25,24,710,169);
      label(ctx,'正例分数',118,78,color.blue,23); label(ctx,'焦点损失',118,137,color.red,23);
      rect(ctx,202,63,449,28,'#e2ebdd',undefined,5);
      rect(ctx,202,123,449,28,'#e2ebdd',undefined,5);
      rect(ctx,202,63,449*p,28,color.blue,undefined,5);
      rect(ctx,202,123,449*clamp(loss,0,1),28,loss>.1?color.red:color.green,undefined,5);
      label(ctx,fmt(p,3),686,78,color.ink,21); label(ctx,fmt(loss,3),686,137,color.ink,21);
    }}/>
    <Slider title="正例词的 logit" min={-4} max={4} step={.25} value={z} change={set} />
    <Feedback tone={p>.7?'good':p<.3?'bad':undefined}>
      假设标注框对应“green”。sigmoid({fmt(z)}) = {fmt(p,3)}，正例损失 −0.25×(1−p)²×ln(p) = {fmt(loss,4)}。
      {p>.7?'这个正例已经比较容易认出，调制项把损失压得更低。':'分数低时还有较强的纠正信号。'}
    </Feedback>
  </>;
}

const graph = [
  { title:'双编码器', short:'编码', detail:'Swin 抽取多尺度图像特征，BERT 编码文字 token。两路都投影到 256 维。' },
  { title:'特征增强器', short:'融合', detail:'图像与文字各做自注意力，再通过双向跨模态注意力读取对方，保留两路特征。' },
  { title:'查询选择', short:'选位置', detail:'给每个图像位置与各词打分，取行最大值并排序，用前 900 个位置初始化动态锚框。' },
  { title:'跨模态解码器', short:'细化', detail:'900 个查询彼此交换信息，也通过不同的交叉注意力从图像和文字读取线索。共 6 层。' },
  { title:'框和文字分数', short:'输出', detail:'每条查询产生四个框坐标和一列按 token 排列的 logits，后处理再决定保留哪些。' },
];
const graphX = [100,244,382,520,659];
export function Architecture() {
  const [stage,set] = useState(0);
  return <>
    <Stage name="Grounding DINO 的五个可点选阶段" height={246}
      onPointerDown={event=>{
        const bounds=event.currentTarget.getBoundingClientRect();
        const x=(event.clientX-bounds.left)/bounds.width*760;
        const y=(event.clientY-bounds.top)/bounds.height*246;
        if(y>=49 && y<=166) set(graphX.reduce((best,value,i)=>Math.abs(x-value)<Math.abs(x-graphX[best])?i:best,0));
      }} draw={ctx=>{
        card(ctx,21,22,718,202);
        graphX.slice(1).forEach((x,i)=>line(ctx,[graphX[i]+48,113],[x-48,113],i<stage?color.blue:color.pale,i<stage?5:2));
        line(ctx,[133,74],[197,104],stage>0?color.blue:color.pale,stage>0?4:2);
        line(ctx,[133,151],[197,122],stage>0?color.blue:color.pale,stage>0?4:2);
        line(ctx,[244,144],[244,182],stage>=3?color.purple:color.edge,3,[5,4]);
        line(ctx,[244,182],[520,182],stage>=3?color.purple:color.edge,3,[5,4]);
        line(ctx,[520,182],[520,144],stage>=3?color.purple:color.edge,3,[5,4]);
        graphX.forEach((x,i)=>{
          const on=i===stage, hue=on?color.blue:i<stage?'#d9e8d5':'#edf2e8';
          if(i===0){
            rect(ctx,x-35,52,70,45,hue,on?color.blue:color.pale,8);
            rect(ctx,x-35,132,70,45,hue,on?color.blue:color.pale,8);
            dot(ctx,x,75,9,on?'#fff':color.outline);
            line(ctx,[x-10,154],[x+10,154],on?'#fff':color.outline,4);
          } else {
            rect(ctx,x-48,82,96,62,hue,on?color.blue:color.pale,10);
            if(on) label(ctx,graph[i].short,x,113,'#fff',22);
            else dot(ctx,x,113,9,i<stage?color.green:color.outline);
          }
        });
        if(stage===0) label(ctx,'两路输入',100,207,color.blue,21);
        if(stage>=3) label(ctx,'融合特征',382,205,color.purple,18);
      }}/>
    <Choices label="查看模型阶段" entries={graph.map((g,i)=>[i,g.title] as const)} selected={stage} change={set}/>
    <Feedback><strong>{graph[stage].title}。</strong>{graph[stage].detail}
      {stage>=3 && ' 虚线表示解码器仍直接读取融合后的图像与文字特征。'}
    </Feedback>
  </>;
}

const benchmarks = [
  {
    key:'ODinW 跨域', max:30, rows:[['GLIP-T',19.6],['Grounding DINO-T',22.3],['Grounding DINO-L',26.1]],
    detail:'表 4，ODinW 35 项任务的零样本平均 AP。前两行同用 Swin-T 和 O365、GoldG、Cap4M；第三行使用更大的主干和额外数据。',
    note:'平均 AP 汇总跨域任务。论文附录 C.3 给出了各任务的详细结果。',
  },


  {
    key:'COCO 零样本', max:55, rows:[['GLIP-T (C)',46.7],['Grounding DINO-T',48.1]],
    detail:'表 2，COCO val2017 零样本 AP。两行同用 Swin-T 和 O365、GoldG 预训练；48.1 比 46.7 高 1.4 AP。52.5 AP 为另一行 Swin-L（O365、OI、GoldG）的结果。',
    note:'在该框架下，“零样本”指没有用评测数据集的训练划分。',
  },
  {
    key:'LVIS 消融', max:18, rows:[['完整模型',16.1],['去编码器融合',13.1],['静态选择查询',13.6],['去文本交叉注意力',14.3],['改用词级文本',15.6]],
    detail:'表 7，LVIS minival 零样本 AP。均为 Swin-T、O365 预训练；每行在同一完整模型上更改一种设计。各行变化按同一个基线读。',
    note:'同一套消融中，去掉编码器融合的 LVIS AP 降幅最大（3.0）。',
  },
  {
    key:'RefCOCO 指代', max:100, rows:[['O365 + GoldG',50.41],['加入 RefC',73.98],['加入后再微调',89.19]],
    detail:'表 5，RefCOCO val 的 Top-1 准确率（%）。三行均为 Grounding DINO-T。最后一行已用指代数据微调。',
    note:'指代任务只看提交的首选框。加 RefC 的一行已经在训练阶段使用了指代数据，阅读时要记住训练条件。',
  },
];
export function PaperResults() {
  const [which,setWhich] = useState(0);
  const [replay,setReplay] = useState(0);
  const [progress,setProgress] = useState(1);
  const item=benchmarks[which];
  useEffect(()=>{
    if(!replay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let start:number | undefined;
    let ticket=0;
    const tick=(time:number)=>{
      start ??= time;
      const p=Math.min(1,(time-start)/750);
      setProgress(1-(1-p)**3);
      if(p<1) ticket=requestAnimationFrame(tick);
    };
    ticket=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(ticket);
  },[replay]);
  return <>
    <Stage name={item.key+'论文成绩，条形从共同零点开始'} height={70+item.rows.length*43} draw={ctx=>{
      const height=70+item.rows.length*43;
      card(ctx,24,20,708,height-42);
      const x=75,w=545;
      line(ctx,[x,46],[x,height-44],color.pale,2);
      item.rows.forEach((row,i)=>{
        const score=Number(row[1]),y=40+i*43, best=score===Math.max(...item.rows.map(r=>Number(r[1])));
        rect(ctx,x,y,w,25,'#ecf0e6',undefined,6);
        rect(ctx,x,y,Math.max(1,w*score/item.max*progress),25,best?color.green:color.blue,undefined,6);
        label(ctx,fmt(score,which===2?2:1),673,y+13,best?color.green:color.ink,24);
      });
    }}/>
    <Choices label="论文评测协议" entries={benchmarks.map((b,i)=>[i,b.key] as const)} selected={which} change={i=>{setWhich(i);setProgress(1);}} />
    <button className="gs-choice" type="button" onClick={()=>setReplay(n=>n+1)} style={{marginTop:12,padding:'7px 12px',background:color.paper,border:'1px solid '+color.edge,borderRadius:8,color:color.ink,font:'inherit',cursor:'pointer'}}>展开对比</button>
    <Feedback tone="good">{item.detail} {item.note}
      <ol style={{paddingLeft:'1.45rem',margin:'8px 0 0'}}>{item.rows.map(([name,score])=><li key={name}>{name} · {score} {which===2?'%':'AP'}</li>)}</ol>
    </Feedback>
  </>;
}

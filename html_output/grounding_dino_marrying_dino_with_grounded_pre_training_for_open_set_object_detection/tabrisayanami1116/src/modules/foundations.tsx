import { useState } from 'react';
import type { PointerEvent } from 'react';
import { clamp } from '../lib/canvasKit';
import { Choices, Feedback, Stage, apple, card, color, dot, fmt, frameBox, label, line, orchard, rect } from './kit';

const allTargets = [0, 1, 2];
const tasks = [
  { name: '苹果', targets: allTargets, description: '三颗都符合这个类别。两种找法都应该保留三个框。' },
  { name: '红苹果', targets: [1], description: '颜色把答案缩到中间。两颗绿苹果同样属于苹果类别，所以左侧仍会框出它们。' },
  { name: '右边的苹果', targets: [2], description: '位置把答案移到最右边。“右边”由同一张图的画面决定。' },
  { name: '香蕉', targets: [], description: '照片里没有香蕉。符合描述的目标框为零，实际模型仍有可能误报。' },
];
export function Tasks() {
  const [choice, select] = useState(0);
  const { targets, description } = tasks[choice];
  return <>
    <Stage name="固定类别检测与描述定位的并排示意" height={250} draw={(ctx) => {
      label(ctx, '固定类别', 202, 34, color.ink, 23);
      label(ctx, '按描述找', 558, 34, color.ink, 23);
      const fixed = orchard(ctx, 32, 59, 340, 161);
      const guided = orchard(ctx, 388, 59, 340, 161);
      fixed.forEach((box, index) => frameBox(ctx, box, targets.includes(index) ? color.blue : color.red, [6, 5]));
      targets.forEach(index => frameBox(ctx, guided[index], color.green, [], 4));
    }} />
    <Choices label="想找的物体" entries={tasks.map(({name}, i) => [i,name] as const)} selected={choice} change={select} />
    <Feedback tone={choice ? 'good' : undefined}>{description} ｜ 固定类表示意 3 框，描述所需 {targets.length} 框。</Feedback>
  </>;
}

const inputs = [[0,'看细网格'],[1,'看粗网格'],[2,'red'],[3,'apple'],[4,'green']] as const;
export function Inputs() {
  const [selected, set] = useState<number>(0);
  const fine = selected !== 1;
  const token = selected >= 2 ? inputs[selected][1] : '—';
  const caption = [
    '细网格的这个位置主要覆盖红苹果表面的小区域。每个位置是一条视觉向量。',
    '更粗的网格位置覆盖整颗红苹果的较大一部分。模型同时使用多个尺度。',
    'red 是“红”的文字 token。在短语里，它负责给 apple 增加颜色线索。',
    'apple 说明要找苹果。它在红、绿两组短语里都出现，但各自读取本组的上下文。',
    'green 是“绿”。它与同组的 apple 一起提供绿苹果的文本线索。',
  ];
  return <>
    <Stage name="照片采样网格与选中的文字特征" height={248} draw={(ctx) => {
      orchard(ctx, 24, 25, 440, 190);
      const nx=fine?8:3, ny=fine?4:2;
      const x=35, y=39, w=418, h=158, dx=w/nx, dy=h/ny;
      rect(ctx, x + dx * Math.floor(nx / 2), y + dy * Math.floor(ny / 2), dx, dy, '#27446e33', selected < 2 ? color.blue : color.edge);
      for(let i=0;i<=nx;i++) line(ctx,[x+dx*i,y],[x+dx*i,y+h], '#27446e66', 1);
      for(let i=0;i<=ny;i++) line(ctx,[x,y+dy*i],[x+w,y+dy*i], '#27446e66', 1);
      card(ctx, 490, 25, 240, 190);
      label(ctx, selected < 2 ? (fine ? '细尺度' : '粗尺度') : token, 610, 85, color.blue, 28);
      for(let i=0;i<8;i++) rect(ctx, 522+i*22, 120, 14, 40, i%3===0 ? color.blue : color.pale, undefined, 3);
      label(ctx, 'd = 256', 610, 182, color.muted, 22);
    }}/>
    <Choices label="视觉尺度或文本 token" entries={inputs} selected={selected} change={set} />
    <Feedback>{caption[selected]} 图中短条象征特征维度。</Feedback>
  </>;
}

const phraseTokens = ['red', 'apple', 'green', 'apple'] as const;
export function PhraseMask() {
  const [grouped, setGrouped] = useState(0);
  const [source, setSource] = useState(0);
  const group = (index:number) => Math.floor(index / 2);
  const readable = phraseTokens.map((token,i)=>({token,i})).filter(({i}) => !grouped || group(i)===group(source));
  return <>
    <Stage name="文字 token 的注意力连接图" height={230} onPointerDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width * 760;
      setSource(clamp(Math.round((x - 112) / 178), 0, 3));
    }} draw={(ctx) => {
      card(ctx, 28, 87, 342, 109);
      card(ctx, 390, 87, 342, 109);
      const positions = [112, 290, 468, 646];
      readable.filter(({i})=>i!==source).forEach(({i})=>{
        ctx.beginPath();
        ctx.moveTo(positions[source],142);
        ctx.quadraticCurveTo((positions[source]+positions[i])/2, 15, positions[i], 142);
        ctx.strokeStyle = group(i)===group(source) ? color.blue : color.red;
        ctx.lineWidth = 3; ctx.stroke();
      });
      positions.forEach((x,i)=> {
        const active = i===source, allowed = readable.some(item=>item.i===i);
        dot(ctx,x,142,active?29:21,active?color.blue:allowed?'#dae6ce':'#edf1e9',active?color.blue:color.pale);
        if(active) label(ctx,phraseTokens[i],x,142,'#fff',23);
        else dot(ctx,x,142,allowed?5:3,allowed?color.outline:color.pale);
      });
      line(ctx,[380,87],[380,196],color.orange,2,[5,5]);
    }}/>
    <Choices label="文本注意力范围" entries={[[0,'全句互读'],[1,'按短语分组']]} selected={grouped} change={setGrouped} />
    <Choices label="发出注意力的词" entries={[[0,'红组 · red'],[1,'红组 · apple'],[2,'绿组 · green'],[3,'绿组 · apple']]} selected={source} change={setSource} />
    <Feedback tone={grouped ? 'good' : undefined}>
      {grouped ? '读取范围留在同一组' : '两个短语的词都能参与'}。{phraseTokens[source]} 可读 {readable.length} 个位置（含自身）。
    </Feedback>
  </>;
}

const imageVectors = [[.85,.30],[.35,.92],[-.25,.74]];
const dotProduct = (a:number[], b:number[]) => a.reduce((total,x,i)=>total+x*b[i],0);
export function Ranking() {
  const [red, setRed] = useState(.8);
  const [selected, setSelected] = useState(0);
  const words = [[red,.20],[.15,.7]];
  const rows = imageVectors.map((v, index) => {
    const scores = words.map(word=>dotProduct(word,v));
    return {index,scores,best:Math.max(...scores)};
  });
  const top = [...rows].sort((a,b)=>b.best-a.best || a.index-b.index).slice(0,2);
  const [vx,vy] = imageVectors[selected];
  const detail = rows[selected].scores;
  const pointer = (event:PointerEvent<HTMLCanvasElement>) => {
    const bounds=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-bounds.left)/bounds.width*760;
    setRed(Math.round(clamp((x-191)/139,-1,1)*100)/100);
  };
  return <>
    <Stage name="拖动红色文本向量的一维分量，查看点积和选中位置" height={292}
      onPointerDown={event => { event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); pointer(event); }}
      onPointerMove={event => { if(event.currentTarget.hasPointerCapture(event.pointerId)) pointer(event); }}
      onKeyDown={event => {
        if(event.key!=='ArrowLeft' && event.key!=='ArrowRight') return;
        event.preventDefault(); event.stopPropagation();
        setRed(value=>Math.round(clamp(value+(event.key==='ArrowRight'?.05:-.05),-1,1)*100)/100);
      }}
      draw={ctx=>{
        card(ctx, 25, 25, 331, 239);
        orchard(ctx, 45, 44, 291, 108).forEach((box,i)=>{
          if(top.some(row=>row.index===i)) frameBox(ctx,box,color.green,[],3);
        });
        line(ctx,[52,204],[330,204],color.pale,4);
        line(ctx,[191,204],[191+139*red,204],color.blue,5);
        dot(ctx,191+139*red,204,14,color.orange,color.wood);
        label(ctx,'红色线索',191,239,color.muted,19);
        card(ctx, 378, 25, 359, 239);
        rows.forEach(({index,scores,best},i)=>{
          const y=81+i*62, keep=top.some(row=>row.index===index);
          rect(ctx,397,y-21,320,47,keep?'#deefdf':'#eef1e9',selected===i?color.blue:color.edge,8);
          scores.concat(best).forEach((value,col)=>label(ctx,fmt(value),447+col*111,y+2,col===2?color.green:color.ink,24));
        });
      }} />
    <Choices label="查看视觉位置的完整乘法" entries={[[0,'左侧位置'],[1,'中间位置'],[2,'右侧位置']]} selected={selected} change={setSelected} />
    <Feedback tone="good">
      橙色端点 x = {fmt(red)}。位置 {selected+1} 与“红”的点积为 {fmt(vx)}×{fmt(red)} + {fmt(vy)}×0.20 = {fmt(detail[0])}，与“绿”的点积为 {fmt(detail[1])}。
      每行从左到右是红、绿、最大分。入选位置 {top.map(r=>r.index+1).join('、')}。
    </Feedback>
  </>;
}

const refinement = [
  ['锚框初值','初始位置来自编码器选中的候选框。内容向量来自训练得到的一组参数。'],
  ['读图像','图像交叉注意力帮助查询找到苹果轮廓，框的参考位置有了更细的线索。'],
  ['读文字','文本交叉注意力为查询补充描述。这里要问的是红苹果，附近还有长得很像的绿苹果。'],
  ['本层输出','完成该层更新后可预测新框。真实模型反复执行六层，课件中的框尺寸为示意。'],
] as const;
export function Refinement() {
  const [step, setStep] = useState(0);
  return <>
    <Stage name="沿解码步骤查看苹果框如何细化" height={245} draw={ctx=>{
      const fruit = orchard(ctx, 25, 23, 475, 195);
      frameBox(ctx,fruit[1],color.outline,[7,6],2);
      const expand=[34,23,12,2][step], dx=[-11,9,5,0][step];
      const [a,b,c,d]=fruit[1];
      frameBox(ctx,[a-expand+dx,b-expand,c+expand+dx,d+expand],step===3?color.green:color.blue,[],4);
      refinement.forEach(([_,__],i)=>{
        const y=54+i*43;
        if(i>0) line(ctx,[554,y-43],[554,y],i<=step?color.blue:color.pale,i<=step?4:2);
        dot(ctx,554,y,i===step?14:9,i<=step?color.blue:color.pale);
        rect(ctx,583,y-8,117-(i%2)*28,16,i===step?color.blue:'#dce5d1',undefined,6);
      });
      label(ctx, refinement[step][0], 637, 224, color.blue, 22);
    }}/>
    <Choices label="解码步骤" entries={refinement.map(([name],i)=>[i,name] as const)} selected={step} change={setStep}/>
    <Feedback tone={step===3?'good':undefined}>{refinement[step][1]}</Feedback>
  </>;
}

import { useState } from 'react';
import { Choices, Feedback, Slider, Stage, asset, card, color, fmt, frameBox, label, line, rect, sigmoid, usePhoto } from './kit';
import raw from './lab-data.json';

type Box = [number, number, number, number];
type Prediction = [number, Box, number, (number | null)[]];
interface Photo { title:string; file:string; width:number; height:number; targets:Record<string,Box>; }
interface Run { image:string; name:string; prompt:string; targetIds:string[]; tokens:string[]; predictions:Prediction[]; }
const data = raw as unknown as { images:Record<string,Photo>; runs:Run[] };
const grouping = data.runs.find(run => run.name === '红和绿分组')!;

export function overlap(a: Box, b: Box) {
  const intersection = Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])) *
    Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
  const area = (box:Box) => Math.max(0,box[2]-box[0])*Math.max(0,box[3]-box[1]);
  return intersection / (area(a)+area(b)-intersection || 1);
}
export function match(run: Run, candidates: Prediction[]) {
  const reference = data.images[run.image].targets;
  const missing = new Set(run.targetIds);
  const detections = candidates.map(prediction => {
    const best = Array.from(missing)
      .map(id => ({id, iou:overlap(prediction[1], reference[id])}))
      .sort((a,b) => b.iou-a.iou)[0];
    const matched = best && best.iou>=.50;
    if(matched) missing.delete(best.id);
    return {prediction, matched:matched || false};
  });
  return {detections, missing:Array.from(missing)};
}
const scoreToken = (z:number|null) => z===null?0:sigmoid(z);

export function decode(tokens:string[], logits:(number|null)[], threshold:number) {
  return tokens.slice(1).filter((_,i)=>scoreToken(logits[i+1]) > threshold).join(' ')
    .replace(/ ##/g,'').replace(/ ([.!?,:;])/g,'$1');
}
function renderPhoto(ctx:CanvasRenderingContext2D, photo:HTMLImageElement|null, info:Photo, x:number, y:number, w:number, h:number) {
  const scale=Math.min(w/info.width,h/info.height);
  const viewWidth=info.width*scale, viewHeight=info.height*scale;
  const left=x+(w-viewWidth)/2, top=y+(h-viewHeight)/2;
  card(ctx,left-5,top-5,viewWidth+10,viewHeight+10);
  ctx.save();
  ctx.beginPath();ctx.rect(left,top,viewWidth,viewHeight);ctx.clip();
  if(photo) ctx.drawImage(photo,left,top,viewWidth,viewHeight);
  return (box:Box):Box => [left+box[0]*scale,top+box[1]*scale,left+box[2]*scale,top+box[3]*scale];
}

export function Thresholds() {
  const [box,setBox]=useState(.35);
  const [text,setText]=useState(.25);
  const info=data.images.apples;
  const photo=usePhoto(asset(info.file));
  const keep=grouping.predictions.filter(row=>row[2]>box);
  const highest=grouping.predictions[0];
  const phrase=decode(grouping.tokens,highest[3],text);
  const words=grouping.tokens.map((token,i)=>({token, score:scoreToken(highest[3][i])}))
    .filter(({token})=>!token.startsWith('[') && token!=='.');
  return <>
    <Stage name="真实苹果照片上的预测框，以及最高分框的文字分数" height={290} draw={ctx=>{
      const map=renderPhoto(ctx,photo,info,24,21,412,248);
      keep.forEach((row,i)=>{
        const region=map(row[1]);
        frameBox(ctx,region,i===0?color.green:color.blue,i===0?[]:[6,5],i===0?4:3);
      });
      ctx.restore();
      card(ctx,459,28,275,232);
      words.forEach(({score},i)=>{
        const y=62+i*47;
        rect(ctx,477,y,172,20,'#e4eddc',undefined,5);
        rect(ctx,477,y,Math.max(1,172*score),20,score>text?color.green:color.blue,undefined,5);
        label(ctx,fmt(score),685,y+10,color.ink,21);
      });
      line(ctx,[477+172*text,48],[477+172*text,236],color.orange,3,[6,3]);
    }}/>
    <Slider title="框阈值" min={.10} max={.97} step={.01} value={box} change={setBox}/>
    <Slider title="文字阈值" min={.10} max={.97} step={.01} value={text} change={setText}/>
    <Feedback tone={keep.length && phrase?'good':undefined}>
      预测框保留 {keep.length} 个。{keep.length ? '最高分框' : '被筛掉的最高分框'} #{highest[0]} 得分 {fmt(highest[2],3)}，
      达标词为 <strong>{phrase || '（空）'}</strong>。分数条自上而下是 {words.map(({token})=>token).join('、')}。
    </Feedback>
  </>;
}

const imageOptions=Object.entries(data.images).map(([id,photo])=>[id,photo.title] as const);
const BOX_THRESHOLD=.35, TEXT_THRESHOLD=.25;
export function PhotoLab() {
  const [imageId,setImageId]=useState('twins');
  const [promptId,setPromptId]=useState(0);
  const [active,setActive]=useState(0);
  const choices=data.runs.filter(row=>row.image===imageId);
  const run=choices[promptId];
  const info=data.images[imageId];
  const photo=usePhoto(asset(info.file));
  const passing=run.predictions.filter(row=>row[2]>BOX_THRESHOLD);
  const {detections,missing}=match(run,passing);
  const hits=detections.filter(row=>row.matched).length;
  const falsePos=detections.length-hits;
  const highest=run.predictions[0];
  const maxIou=(row:Prediction) => run.targetIds.length
    ? Math.max(...run.targetIds.map(id=>overlap(row[1],info.targets[id]))) : null;
  const chosen=detections[active]?.prediction ?? highest;
  const iou=maxIou(chosen);
  const tone = falsePos || missing.length ? 'bad' : 'good';
  return <>
    <Stage name={info.title+'上的模型预测框和人工框'} height={382} draw={ctx=>{
      const map=renderPhoto(ctx,photo,info,28,15,704,350);
      run.targetIds.forEach(id=>frameBox(ctx,map(info.targets[id]),'#fff5c7',[9,5],4));
      detections.forEach(({prediction,matched},i)=>{
        if(i===active) return;
        frameBox(ctx,map(prediction[1]),matched?color.green:color.red,[],3);
      });
      const selected=detections[active];
      if(selected) {
        const box=map(selected.prediction[1]);
        frameBox(ctx,box,selected.matched?color.green:color.red,[],5);
        const markerX=Math.max(42,box[0]+18),markerY=Math.max(29,box[1]+18);
        rect(ctx,markerX-14,markerY-14,28,28,selected.matched?color.green:color.red,'#fff',5);
        label(ctx,String(active+1),markerX,markerY,'#fff',20);
      }
      ctx.restore();
    }}/>
    <Choices label="选择实测照片" entries={imageOptions} selected={imageId}
      change={value=>{setImageId(value);setPromptId(0);setActive(0);}} />
    <Choices label="选择真实推理提示" entries={choices.map((item,i)=>[i,item.name] as const)} selected={promptId}
      change={value=>{setPromptId(value);setActive(0);}} />
    {detections.length>1 && <Choices label="查看保留的预测框" entries={detections.map(({prediction},i)=>
      [i,'框 '+(i+1)+' · '+fmt(prediction[2],3)] as const)} selected={active} change={setActive}/>}
    <Feedback tone={tone}>
      提示 <strong lang="en">{run.prompt}</strong> ｜ 保留 {passing.length} 框 · 命中 {hits} · 额外 {falsePos} · 漏检 {missing.length}。
      最高分 {fmt(highest[2],3)}。{passing.length ? <>当前框 #{chosen[0]} 的标签为 <strong lang="en">{decode(run.tokens,chosen[3],TEXT_THRESHOLD) || '（空）'}</strong>
        {iou!==null && <>，与当前目标的最大 IoU 为 {fmt(iou,3)}</>}。</> : <>低于框阈值，本次没有框留下。</>}
    </Feedback>
  </>;
}

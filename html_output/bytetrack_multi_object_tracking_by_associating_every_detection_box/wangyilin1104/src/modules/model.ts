export type Box = { x: number; y: number; w: number; h: number };
export type Detection = Box & { key: string; score: number };
export type Track = { id: number; box: Box; vx: number; vy: number; last: number; state: 'active' | 'lost'; points: (Box & {frame: number})[] };
export type Match = { id: number; key: string; pass: 1 | 2; overlap: number };
export const frameCount = 10;
export function position(key: string, frame: number): Box {
  return key === 'A' ? {x:84+frame*22,y:161,w:61,h:111} : {x:660-frame*14,y:87,w:54,h:96};
}
export function iou(a: Box, b: Box) {
  const overlap = Math.max(0, Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)) *
    Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  return overlap/(a.w*a.h+b.w*b.h-overlap);
}
export function detections(frame:number, noBox=false, distractor=0):Detection[] {
  const result:Detection[] = [{...position('B',frame),key:'B',score:.91}];
  if (!(noBox && frame>=2 && frame<=5))
    result.unshift({...position('A',frame),key:'A',score:[.9,.87,.41,.28,.19,.38,.82,.88,.91,.92][frame]});
  if (frame>=2 && frame<=5)
    result.push({x:position('A',frame).x+330-distractor,y:163,w:60,h:108,key:'C',score:.24});
  return result;
}
export function associate(tracks:Track[], boxes:Detection[], frame:number, gate:number) {
  let best:{t:Track;b:Detection;overlap:number}[]=[]; let bestScore=-1;
  function search(i:number, used:Set<string>, pairs:typeof best, score:number) {
    if(i===tracks.length){if(score>bestScore){bestScore=score;best=pairs;}return;}
    search(i+1,used,pairs,score);
    const t=tracks[i];
    for(const b of boxes){
      if(used.has(b.key))continue;
      const overlap=iou(predict(t,frame),b);
      if(overlap<gate)continue;
      search(i+1,new Set([...used,b.key]),[...pairs,{t,b,overlap}],score+overlap);
    }
  }
  search(0,new Set(),[],0);
  return best;
}
export function predict(t:Track, frame:number):Box {
  return {...t.box,x:t.box.x+t.vx*(frame-t.last),y:t.box.y+t.vy*(frame-t.last)};
}
export function simulate({two=true, high=.6, gate=.35, noBox=false, distractor=0, buffer=3}={}) {
  let tracks:Track[]=[]; let id=0;
  return Array.from({length:frameCount},(_,frame)=>{
    const input=detections(frame,noBox,distractor);
    const before=tracks.filter(t=>frame-t.last<=buffer+1);
    const highBoxes=input.filter(b=>b.score>=high);
    const lowBoxes=input.filter(b=>b.score>=.1&&b.score<high);
    const first=associate(before,highBoxes,frame,gate);
    const second=two?associate(before.filter(t=>t.state==='active'&&!first.some(m=>m.t.id===t.id)),lowBoxes,frame,gate):[];
    const matches:Match[]=[...first.map(m=>({id:m.t.id,key:m.b.key,pass:1 as const,overlap:m.overlap})),
      ...second.map(m=>({id:m.t.id,key:m.b.key,pass:2 as const,overlap:m.overlap}))];
    const pairs=[...first,...second];
    tracks=before.map(t=>{
      const m=pairs.find(p=>p.t.id===t.id);
      if(!m)return {...t,state:'lost'};
      const dt=frame-t.last;
      return {...t,box:m.b,vx:(m.b.x-t.box.x)/dt,vy:(m.b.y-t.box.y)/dt,last:frame,state:'active',points:[...t.points,{...m.b,frame}]};
    });
    for(const b of highBoxes){
      if(pairs.some(p=>p.b.key===b.key))continue;
      tracks.push({id:++id,box:b,vx:0,vy:0,last:frame,state:'active',points:[{...b,frame}]});
    }
    return {frame,input,before,tracks,matches,highBoxes,lowBoxes};
  });
}
export type Frame = ReturnType<typeof simulate>[number];

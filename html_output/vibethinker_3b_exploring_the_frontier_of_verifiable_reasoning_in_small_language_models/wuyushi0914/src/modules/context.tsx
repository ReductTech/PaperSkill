import React,{useState} from 'react';
import {Canvas,Chips,Stats,Feedback,C,rect,line,label,target} from './notebook-scene';
export function Context(){const [mode,setMode]=useState(0);return <>
 <Canvas label="同一48K轨迹在16K和64K窗口的容纳对照" draw={c=>{for(let i=0;i<2;i++){const y=35+i*110;const selected=i===mode;rect(c,150,y,640,76,selected?'#fff':'#edf0e9');rect(c,150,y,480,76,C.light);rect(c,150,y,i?480:160,76,i?C.green:C.red);if(!i)for(let x=320;x<630;x+=15)line(c,[[x,y+3],[x+8,y+70]],'#fff',1);label(c,i?'64K':'16K',45,y+46,26);target(c,i?745:345,y+38,!!i,1.2);if(selected){c.strokeStyle=C.orange;c.lineWidth=3;c.strokeRect(150,y,640,76);}}}}/>
 <Chips options={['查看短窗口截断','查看64K完整轨迹']} value={mode} onChange={setMode}/>
 <Stats items={[["示意轨迹",'48K tokens'],["保留",mode?'48K / 48K':'16K / 48K'],["截断",mode?'0K':'32K']]}/>
 <Feedback tone={mode?'good':'bad'}>{mode?'64K可以容纳这条48K示意轨迹。论文直接用64K进行RL以保全长思考；并非声称轨迹越长必然越好。':'示意16K窗口把48K推理截去32K；这不是论文的量化消融数据，只展示截断为何会破坏完整解答。'}</Feedback>
 </>;}

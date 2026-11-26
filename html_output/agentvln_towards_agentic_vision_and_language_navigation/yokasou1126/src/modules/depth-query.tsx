import React, { useState } from 'react';
import { Room, Person, Painting, useTween } from './museum-cover';

const C = { blue:'#27446e', green:'#228d5c', orange:'#f07e47', ink:'#21324a', muted:'#68778f' };
function QueryChair({x,y,active,onQuery,label}:{x:number;y:number;active:boolean;onQuery:()=>void;label:string}) {
  return <g role="button" tabIndex={0} aria-label={`查询${label}的距离`} onClick={onQuery} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onQuery();}}} style={{cursor:'pointer'}}>
    <rect x={x-75} y={y-150} width={150} height={200} rx={20} fill={active?'#e5f3e9':'#ffffff66'} stroke={active?C.green:'#d7deea'} strokeWidth={active?5:2}/>
    <path d={`M${x-40} ${y-70} v-65 h80 v65 M${x-50} ${y-65} h100 v20 h-100 Z M${x-40} ${y-45} v65 M${x+40} ${y-45} v65`} fill="#d4b594" stroke="#92400e" strokeWidth={9} strokeLinejoin="round"/>
    <text x={x} y={y+65} textAnchor="middle" fontSize={28} fill={C.ink}>{label}</text>
  </g>;
}
export function DepthQuery() {
  const [queried,setQueried] = useState(0);
  const [selected,setSelected] = useState<number|null>(null);
  const ray = useTween(queried ? 1 : 0,650);
  const endpoint = useTween(selected===0?495:795,650);
  const both = queried===3;
  const query=(i:number)=>{setSelected(i);setQueried(n=>n|(1<<i));};
  return <div className="av-root" style={{display:'grid',gridTemplateRows:'470px 128px',gap:20}}>
    <div style={{display:'grid',gridTemplateColumns:'920px 520px',gap:32}}>
      <div style={{borderRadius:24,background:'#f6f4ed',position:'relative'}}>
        <Room width={920} height={470}>
          <Painting x={380} y={36} w={130} h={120}/>
          {selected!==null && <line x1={145} y1={350} x2={145+(endpoint-145)*ray} y2={350-100*ray} stroke={C.orange} strokeWidth={5} strokeDasharray="12 9"/>}
          <Person x={145} y={390} scale={.85}/>
          <QueryChair x={495} y={275} active={!!(queried&1)} onQuery={()=>query(0)} label="椅子 A"/>
          <QueryChair x={795} y={275} active={!!(queried&2)} onQuery={()=>query(1)} label="椅子 B"/>
          <text x={50} y={45} fontSize={28} fill={C.muted}>教学示例 · 点击椅子测距</text>
          {both && <g><ellipse cx={495} cy={340} rx={90} ry={18} fill="none" stroke={C.green} strokeWidth={5}/><text x={495} y={410} textAnchor="middle" fontSize={34} fontWeight={700} fill={C.green}>选择更近的 A</text></g>}
        </Room>
      </div>
      <div style={{padding:'12px 10px',display:'flex',flexDirection:'column',gap:16,color:C.ink}}>
        <h3 style={{fontSize:34,lineHeight:1.2,margin:0}}>指令：走到较近的椅子前</h3>
        <p style={{fontSize:28,lineHeight:1.5,margin:0}}>举个很简单的例子：两把椅子看起来差不多，但你要找更近的那把。光看外观，距离还没确定。</p>
        <div style={{background:'#f5f7fa',borderLeft:`6px solid ${C.blue}`,padding:'16px 20px',fontSize:28,lineHeight:1.6}} aria-live="polite">
          <div>椅子 A：{queried&1?'深度 2 m':'距离未知'}</div>
          <div>椅子 B：{queried&2?'深度 4 m':'距离未知'}</div>
        </div>
        <p style={{fontSize:28,lineHeight:1.4,margin:0,color:C.muted}}>问清距离，再输出目标像素。这里演示流程，不运行真实 VLM。</p>
      </div>
    </div>
    <div className="av-feedback" aria-live="polite" style={{fontSize:28,lineHeight:1.45,color:both?C.green:C.blue,padding:'18px 24px',background:both?'#eaf5ed':'#edf2f8',borderRadius:18}}>
      {both?'两次查询给出 2 m 与 4 m：现在可以按“更近”选择椅子 A。':queried?'已补充一条几何线索；再查询另一把椅子，才能完成距离比较。':'先查询缺失的几何线索，再确定与指令一致的目标像素。'}
    </div>
  </div>;
}

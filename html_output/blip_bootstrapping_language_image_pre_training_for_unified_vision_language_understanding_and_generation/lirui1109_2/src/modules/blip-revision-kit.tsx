import type { ReactNode } from 'react';
import { Photo } from './blip-kit';
export const C={ink:'#21324a',muted:'#68778f',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',paper:'#fffdf8',line:'#d7deea'};
export function SvgText({x,y,children,color=C.ink,size=28,weight=500,anchor='start'}:{x:number;y:number;children:ReactNode;color?:string;size?:number;weight?:number;anchor?:'start'|'middle'|'end'}) {
 return <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} style={{lineHeight:1}}>{children}</text>;
}
export function Pair({x=0,y=0,width=420,height=110,kind='cake',text,label,tone=C.line,opacity=1}:{x?:number;y?:number;width?:number;height?:number;kind?:'cake'|'umbrella'|'bird'|'travel';text:string;label?:string;tone?:string;opacity?:number}){
 return <g transform={`translate(${x} ${y})`} opacity={opacity}>
  <rect width={width} height={height} rx={14} fill={C.paper} stroke={tone} strokeWidth={3}/>
  <g transform="translate(10 8)"><Photo kind={kind} width={height*1.22} height={height-16}/></g>
  <path d={`M${height*1.22+22} 20 V${height-20}`} stroke={tone} strokeWidth={2}/>
  {label&&<SvgText x={height*1.22+40} y={36} color={C.muted}>{label}</SvgText>}
  <SvgText x={height*1.22+40} y={label?height-24:height/2+10} weight={650}>{text}</SvgText>
 </g>;
}
export function SvgButton({x,y,width,height=64,label,onClick,active=false,color=C.blue,children}:{x:number;y:number;width:number;height?:number;label:string;onClick:()=>void;active?:boolean;color?:string;children?:ReactNode}){
 return <g role="button" tabIndex={0} aria-label={label} aria-pressed={active} onClick={onClick} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}} className="rev-svg-button" transform={`translate(${x} ${y})`}>
  <rect width={width} height={height} rx={12} stroke={active?C.orange:C.line} strokeWidth={active?4:2} fill={active?'#edf2f7':C.paper}/>
  <SvgText x={width/2} y={height/2+10} color={color} weight={700} anchor="middle">{children||label}</SvgText>
 </g>;
}

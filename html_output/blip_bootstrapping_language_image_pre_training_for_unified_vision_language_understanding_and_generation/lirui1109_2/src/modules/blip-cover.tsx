import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Photo } from './blip-kit';
import { C, SvgText } from './blip-revision-kit';

export function BlipCover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback();
 const improved=moduleId==='newMethod';
 const generated=improved?Math.max(0,Math.min(1,(progress-.2)/.2)):0;
 const checked=improved&&progress>.66;
 const rows=[{kind:'cake' as const,raw:'蓝天面包店',made:'奶油巧克力蛋糕',rawOk:false,madeOk:true},{kind:'umbrella' as const,raw:'游客撑着红伞',made:'游客撑着蓝伞',rawOk:true,madeOk:false}];
 return <div className="blip-cover"><svg viewBox="0 0 664 324" role="img" aria-label={improved?'同一图片配原文和生成文字，过滤错误对并保留匹配对':'图片和网页文字配成一对，尚未检查是否匹配'}>
  <SvgText x={20} y={31} weight={700} color={C.blue}>{!improved?'图片 ＋ 网页文字':checked?'Filter：逐对检查':generated>.1?'Captioner：补写文字':'图片 ＋ 网页文字'}</SvgText>
  {rows.map((row,i)=><g key={row.kind} transform={`translate(14 ${46+i*112})`}>
   <rect width={636} height={104} rx={12} fill="#f1ebdf" stroke={C.line} strokeWidth={2}/>
   <g transform="translate(7 3)"><Photo kind={row.kind} width={146} height={98}/></g>
   <path d="M163 13 V91" stroke="#bcb5a6" strokeWidth={2}/>
   <SvgText x={180} y={generated>.01?36:61} color={checked&&!row.rawOk?C.red:C.ink}>{improved?'原：':''}{row.raw}</SvgText>
   {checked&&<SvgText x={602} y={36} color={row.rawOk?C.green:C.red} weight={750} anchor="end">{row.rawOk?'✓':'✕'}</SvgText>}
   {generated>.01&&<g opacity={generated} transform={`translate(${checked&&!row.madeOk?10:0} ${(1-generated)*12})`}>
    <SvgText x={180} y={82} color={checked?(row.madeOk?C.green:C.red):C.blue}>新：{row.made}</SvgText>
    {checked&&<SvgText x={602} y={82} color={row.madeOk?C.green:C.red} weight={750} anchor="end">{row.madeOk?'✓':'✕'}</SvgText>}
   </g>}
  </g>)}
  <SvgText x={332} y={305} color={checked?C.green:improved?C.blue:C.red} weight={700} anchor="middle">{!improved?'同一网页 ≠ 图文匹配':checked?'留下匹配对，拒绝错配对':generated>.1?'新描述也可能写错':'先收集原始图文对'}</SvgText>
 </svg></div>;
}

import { useState } from 'react';
import { Photo } from './blip-kit';
import { C, SvgText as T, SvgButton } from './blip-revision-kit';
type Mode='itc'|'itm'|'lm';
export function BlipArchitecture(){
 const [mode,setMode]=useState<Mode>('itc');
 const [query,setQuery]=useState(1);
 const [blue,setBlue]=useState(false);
 const words=['[起始]','游客','撑着',mode==='itm'&&blue?'蓝伞':'红伞'];
 const allowed=words.map((_,i)=>mode!=='lm'||i<=query);
 const next=['游客','撑着','红伞','结束'][query];
 return <div className="blip-page rev-page">
  <div className="rev-tabs">{(['itc','itm','lm'] as Mode[]).map(m=><button type="button" className="blip-control" key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{m.toUpperCase()} · {m==='itc'?'比相似':m==='itm'?'判匹配':'写描述'}</button>)}</div>
  <svg className="rev-med-scene" viewBox="0 0 1472 420" role="group" aria-label="同一 MED 的图像接入、文本注意力与输出">
   <rect x={0} y={15} width={402} height={336} rx={18} fill="#f1ebdf"/>
   <g transform="translate(12 37)"><Photo kind="umbrella" width={378} height={251}/></g>
   <T x={201} y={326} anchor="middle" weight={700}>{mode==='itc'?'图像独立编码':'图像特征'}</T>
   <path d="M409 163 H470" stroke={mode==='itc'?C.line:C.blue} strokeWidth={5} strokeDasharray={mode==='itc'?'9 7':undefined}/>
   <T x={442} y={137} anchor="middle" color={mode==='itc'?C.muted:C.blue}>{mode==='itc'?'分开':'接入'}</T>
   <rect x={483} y={15} width={553} height={336} rx={18} fill="#f6f3eb"/>
   {words.map((w,i)=>{const x=498+i*132;return <g key={i}>
    {allowed[i]&&<path d={`M${x+57} 147 Q${(x+57+555+query*132)/2} ${48-Math.abs(i-query)*18} ${555+query*132} 147`} stroke={i===query?C.orange:C.blue} strokeWidth={3} fill="none"/>}
    <SvgButton x={x} y={148} width={116} height={72} label={`观察词：${w}`} onClick={()=>setQuery(i)} active={query===i}>{allowed[i]?w:'屏蔽'}</SvgButton>
    <T x={x+58} y={263} anchor="middle" color={allowed[i]?C.blue:C.muted}>{allowed[i]?'可读取':'未来词'}</T>
   </g>})}
   <T x={760} y={316} anchor="middle" weight={700}>{mode==='lm'?'只看已写前缀':'双向：可读完整句子'}</T>
   <path d="M1048 184 H1094 L1082 175 M1094 184 L1082 193" stroke={C.blue} strokeWidth={4} fill="none"/>
   <rect x={1108} y={15} width={364} height={336} rx={18} fill="#edf2f7"/>
   <T x={1290} y={64} anchor="middle" size={34} weight={750}>{mode==='itc'?'相似度排序':mode==='itm'?'匹配判断':'下一个词'}</T>
   {mode==='itc'?<>{['红伞','蓝伞','小船'].map((w,i)=><g key={w}><T x={1132} y={124+i*74}>{w}</T><rect x={1214} y={101+i*74} width={[168,160,30][i]} height={28} rx={5} fill={i===0?C.green:C.blue}/></g>)}</>:mode==='itm'?<><T x={1290} y={172} anchor="middle" size={44} color={blue?C.red:C.green} weight={800}>{blue?'✕ 不匹配':'✓ 匹配'}</T><T x={1290} y={241} anchor="middle">{blue?'词是蓝伞，图是红伞':'句子与图片相符'}</T></>:<><T x={1290} y={172} anchor="middle" size={44} weight={800} color={C.blue}>→ {next}</T><T x={1290} y={241} anchor="middle">{query===3?'句子写完':'读前缀，再往下写'}</T></>}
   <T x={736} y={401} anchor="middle" color={C.blue} weight={650}>{mode==='itc'?'分别编码 → 比较全局表征':mode==='itm'?'图文融合 → 匹配二分类':'看图 ＋ 已有词 → 预测下一词'}</T>
  </svg>
  <div className="rev-med-controls"><span>点词块看读取范围</span><button type="button" className="blip-control" disabled={mode!=='itm'} onClick={()=>setBlue(!blue)}>{blue?'把句子改为红伞':'把句子改为蓝伞'}</button><span>同一 MED：共享主体，自注意力按模式切换。</span></div>
  <p className="rev-foot" aria-live="polite">{mode==='lm'?'LM 不读取未来词。连线与词输出是教学示意。':mode==='itm'?'ITM / LM 都接入图像；ITM 读整句，LM 只读前缀。':'三种训练目标共同学习；ITC 文本侧不接入图像。'}</p>
 </div>;
}

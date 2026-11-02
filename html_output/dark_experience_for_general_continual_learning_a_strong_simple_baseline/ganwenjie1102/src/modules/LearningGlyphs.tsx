import { MathSub, ParameterSymbol } from './LessonNotation';
import ModelPixel, {type ModelClass} from "./review/ModelPixel";
import {mix,windowAt} from "./review/lifecycle-model";
import {MODEL_CLASSES} from "../data/model-classes";
import type {Vec} from "./training-model";
export const fmt=(v:number,n=3)=>(Math.abs(v)<1e-10?0:v).toFixed(n);
export const vectorText=(v:Vec,n=3)=>"("+v.map(x=>fmt(x,n)).join(", ")+")";
export function SampleGlyph({x,y,size=64,model=0,id,view=0}:{x:number;y:number;size?:number;model?:ModelClass;id:string;view?:number}){
return <g transform={`translate(${x} ${y})`} data-sample={id}><rect width={size} height={size} rx="10" className="tg-sample"/><g transform={`translate(${size/2} ${size/2}) rotate(${view*12}) scale(${1+Math.abs(view)*.08}) translate(${-size/2} ${-size/2})`}><ModelPixel model={model} x={size*.2} y={size*.2} size={size*.6}/></g></g>;
}
export function NetworkGlyph({x,y,version,forward=0,backward=0}:{x:number;y:number;version:string;forward?:number;backward?:number}){
const layers=[[60,120,180],[42,78,114,150,186],[60,120,180]],layerX=[38,113,188],reverse=backward>0&&backward<1,t=reverse?backward:forward;
const moving=t>0&&t<1;
const nodeFill=(column:number)=>{const amount=reverse?windowAt(t,(2-column)*.25,(2-column)*.25+.3)*(1-windowAt(t,.88,1)):windowAt(t,column*.25,column*.25+.3);const from=reverse?[222,236,218]:[255,255,255],to=reverse?[244,225,192]:[222,236,218];return `rgb(${from.map((v,k)=>mix(v,to[k],amount)).join(",")})`;};
return <g transform={`translate(${x} ${y})`} data-network data-version={version} data-forward={forward} data-backward={backward}>
<rect width="226" height="244" rx="17" className={`tg-network ${reverse?"is-updating":""}`}/><text x="17" y="28" className="tg-title">当前网络</text><text x="209" y="28" textAnchor="end" className="tg-theta">{version.startsWith("θ")?<>{"θ"}<MathSub>{version.slice(1)}</MathSub></>:version}</text><path d="M17 42H209" className="tg-rule"/>
<text x="17" y="56" className="tg-small">3×5×3 示意 · 计算 2D→3 类</text>
{layers.slice(0,-1).flatMap((from,layerIndex)=>from.flatMap((a,i)=>layers[layerIndex+1].map((b,j)=>{
const fromX=layerX[reverse?layerIndex+1:layerIndex],toX=layerX[reverse?layerIndex:layerIndex+1];
const fromY=(reverse?b:a)+30,toY=(reverse?a:b)+30;
const order=reverse?1-layerIndex:layerIndex,local=windowAt(t,order===0?.04:.43,order===0?.53:.94),light=windowAt(local,0,.12)*(1-windowAt(local,.88,1));
return <g key={`${layerIndex}-${i}-${j}`}><path d={`M${layerX[layerIndex]} ${a+30}L${layerX[layerIndex+1]} ${b+30}`} className="tg-edge"/>{moving&&local>0&&local<1&&<g opacity={light}><path d={`M${mix(fromX,toX,Math.max(0,local-.14))} ${mix(fromY,toY,Math.max(0,local-.14))}L${mix(fromX,toX,local)} ${mix(fromY,toY,local)}`} className={reverse?"tg-gradient-signal":"tg-forward-signal"}/><circle cx={mix(fromX,toX,local)} cy={mix(fromY,toY,local)} r="3" className={reverse?"tg-gradient-dot":"tg-forward-dot"}/></g>}</g>;
})))}
{layers.map((layer,layerIndex)=>layer.map((v,i)=><circle key={`${layerIndex}-${i}`} cx={layerX[layerIndex]} cy={v+30} r="7" className="tg-node" style={{fill:nodeFill(layerIndex)}}/>))}
<text x="38" y="232" textAnchor="middle" className="tg-small">输入层</text><text x="113" y="232" textAnchor="middle" className="tg-small">隐藏层</text><text x="188" y="232" textAnchor="middle" className="tg-small">输出层</text></g>;
}
export function ScoreGlyph({x,y,values,label,reveal=1,frozen=false,note,parameterIndex}:{x:number;y:number;values:Vec;label:string;reveal?:number;frozen?:boolean;note?:string;parameterIndex?:number}){
return <g transform={`translate(${x} ${y})`} data-score={label}><text x="0" y="-12" className="tg-title">{label}{parameterIndex!==undefined&&<> · <ParameterSymbol index={parameterIndex}/></>}</text>{values.map((v,k)=><g key={k} opacity={windowAt(reveal,k*.15,k*.15+.5)}><rect x={k*99} width="91" height="72" rx="9" className={`tg-score tg-tone-${k}`}/><text x={k*99+10} y="22" className="tg-small">{MODEL_CLASSES[k]}</text><text x={k*99+45} y="52" textAnchor="middle" className="tg-number">{fmt(v)}</text></g>)}<text x="0" y="93" className="tg-small">{note??(frozen?"□ 固定历史值，不随 θ 更新":"● 本次前向结果，与当前 θ 同源")}</text></g>;
}
export function MotionPath({d,progress,kind="data"}:{d:string;progress:number;kind?:string}){return <path d={d} className={`tg-path tg-path-${kind}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} opacity={progress>0?1:0}/>;}

import { useEffect, useId, useRef, useState } from 'react';
import { useAnimatedNumbers } from './motion-hooks';
import { C } from './coop-kit';
import './learning-visuals.css';

const specimenColors = [
  { sky: '#e5dec9', hill: '#adba99', line: '#80947b', halo: '#fff3cf' },
  { sky: '#e4dfed', hill: '#bac1ce', line: '#9198b0', halo: '#f7f0da' },
  { sky: '#eadfce', hill: '#b6c3a8', line: '#909a86', halo: '#fff3d9' },
  { sky: '#e8e0cb', hill: '#b0ba9b', line: '#86987e', halo: '#fff3cf' },
];

export function SamplePortrait({ kind = 0 }: { kind?: number }) {
  const id = useId();
  const { sky, hill, line, halo } = specimenColors[kind];
  return <svg className="lv-portrait" viewBox="0 0 200 200" role="img" aria-label={['猫图片示意','狗图片示意','花图片示意','马图片示意'][kind]}>
    <defs>
      <clipPath id={id + '-frame'}><rect width="200" height="200" rx="17"/></clipPath>
      <pattern id={id + '-hatch'} width="7" height="7" patternUnits="userSpaceOnUse"><path d="m-1 7 8-8m-2 10 4-4" stroke={line} strokeWidth="1.4"/></pattern>
    </defs>
    <g clipPath={'url(#' + id + '-frame)'}>
      <path fill={sky} d="M0 0h200v200H0z"/><circle cx="155" cy="40" r="24" fill={halo}/>
      <path d="M0 139Q39 103 79 124T151 123Q183 109 200 114V201H0Z" fill={hill}/>
      <path d="M0 150Q55 119 99 143T200 130V201H0Z" fill={'url(#' + id + '-hatch)'} opacity=".5"/>
      {kind === 0 && <g>
        <path d="M51 215Q48 160 83 138L120 133Q147 145 151 214Z" fill="#bb8049"/>
        <path d="M87 144Q91 171 77 206H129Q136 180 117 137Z" fill="#f0dabc"/>
        <path d="M48 91L44 34Q46 29 52 33L84 56Q102 51 119 56L152 31Q158 28 157 37L152 88Q160 140 105 151Q47 150 48 91Z" fill="#d69e66" stroke="#916744" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M54 46L57 72L74 61ZM147 45L141 72L126 61Z" fill="#be8063"/>
        <path d="M77 57Q85 83 91 82L87 55M96 54Q98 84 103 83L108 53M116 55Q111 79 115 82L127 52" fill="#95683f"/>
        <path d="M49 93L70 99L51 104M50 111L69 112L54 120M151 94L135 100L151 102M147 112L132 113L144 119" fill="#a57449"/>
        <path d="M67 123Q78 107 95 117L101 122L109 115Q125 109 136 124Q125 144 103 145Q80 145 67 123Z" fill="#f4dfbb"/>
        <path d="M65 96Q76 85 88 95Q76 104 65 96ZM112 95Q124 84 136 93Q125 103 112 95Z" fill="#364a45"/>
        <path d="M76 95l1-5M124 94l1-5" stroke="#f4db91" strokeWidth="2.5"/>
        <path d="M95 115Q101 111 108 115L102 121Z" fill="#87564d"/>
        <path d="M102 121v6m0 0q-5 5-11 2m11-2q5 4 10 1" fill="none" stroke="#855f48" strokeWidth="2" strokeLinecap="round"/>
        <path d="M82 116l-44-6m44 13-45 1m82-8 40-9m-38 15 40-1" fill="none" stroke="#fff0cc" strokeWidth="2" strokeLinecap="round"/>
        <path d="M56 176l18-5m-21 18 18-5m63-12 12 6" stroke="#92663e" strokeWidth="4" strokeLinecap="round"/>
      </g>}
      {kind === 1 && <g>
        <path d="M40 207Q52 148 86 136L124 132Q156 153 166 207Z" fill="#b47d51"/>
        <path d="M90 142Q85 165 76 205H136Q133 172 115 143Z" fill="#ead3ac"/>
        <path d="M55 75Q55 50 80 44Q101 32 126 43Q151 49 148 85L138 120Q128 149 104 154Q73 152 57 126Z" fill="#c99664" stroke="#976c4d" strokeWidth="2.5"/>
        <path d="M68 49Q47 40 34 68Q24 92 33 126Q38 143 51 133Q56 124 55 109Q55 78 68 49Z" fill="#79563f"/>
        <path d="M136 49Q155 40 168 62Q182 91 175 124Q170 140 159 134Q149 125 149 107Q148 78 136 49Z" fill="#71503e"/>
        <path d="M64 55Q47 68 43 98M144 53Q163 66 167 99" fill="none" stroke="#a17c59" strokeWidth="3" strokeLinecap="round"/>
        <path d="M96 42Q102 76 89 101L111 112L128 100Q111 75 111 41" fill="#e9cda3"/>
        <ellipse cx="81" cy="91" rx="5" ry="6" fill="#293f47"/><ellipse cx="128" cy="91" rx="5" ry="6" fill="#293f47"/>
        <path d="M75 80q7-5 13-2m32-1q6-4 12 1" fill="none" stroke="#9b6e4b" strokeWidth="3" strokeLinecap="round"/>
        <path d="M75 121Q74 104 95 102Q105 98 116 102Q139 103 137 120Q131 141 106 140Q81 141 75 121Z" fill="#f0dcba"/>
        <path d="M95 108Q105 102 115 108Q116 115 105 120Q95 116 95 108Z" fill="#364344"/>
        <path d="M105 119v6q-5 7-14 3m14-3q6 7 14 2" fill="none" stroke="#84654e" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M77 149Q103 161 129 147L132 153Q106 171 75 157Z" fill="#556a72"/><circle cx="108" cy="164" r="5" fill="#d4b274"/>
      </g>}
      {kind === 2 && <g>
        <path d="M96 206Q114 157 101 97" fill="none" stroke="#496655" strokeWidth="5"/>
        <path d="M106 160Q120 126 157 124Q139 153 106 160ZM104 144Q84 135 66 109Q95 111 104 144Z" fill="#719177" stroke="#54715d" strokeWidth="2"/>
        <g transform="rotate(-13 100 86)">{Array.from({length:8},(_,i)=><g key={i} transform={'rotate(' + i*45 + ' 100 86)'}><path d="M91 84Q69 57 80 42Q95 27 102 44Q117 27 128 47Q130 66 106 85Z" fill={i%2?'#de957e':'#eaa98a'} stroke="#b97e68" strokeWidth="2"/><path d="M97 76Q89 58 86 51m16 24q9-16 16-22" fill="none" stroke="#c2826b" strokeWidth="1.5"/></g>)}</g>
        <circle cx="100" cy="86" r="19" fill="#b78240"/><circle cx="99" cy="84" r="14" fill="#dfb553"/>{[[94,81],[103,79],[105,87],[96,89]].map(([x,y])=><circle key={x} cx={x} cy={y} r="1.8" fill="#9b743e"/>)}
      </g>}
      {kind === 3 && <g><path d="M55 201Q60 120 97 65L115 47L120 27L134 53L169 86Q181 106 160 111L132 101L126 133L149 201Z" fill="#bc8d60" stroke="#936843" strokeWidth="3"/><path d="M55 201Q59 114 97 65L113 52L103 82Q79 130 80 201" fill="#72503e"/><path d="M130 58L148 88L162 94" fill="none" stroke="#e5c8a3" strokeWidth="10" strokeLinecap="round"/><circle cx="138" cy="75" r="4" fill="#243e48"/><path d="M158 102H169" stroke="#644b3b" strokeWidth="3" strokeLinecap="round"/></g>}
    </g>
  </svg>;
}

export function CompassDial({ center, radius }: { center: number; radius: number }) {
  return <g aria-hidden="true">
    <circle cx={center} cy={center} r={radius+16} fill="#fbfaf6" stroke="#ddd9cf" strokeWidth="1.3"/>
    <circle cx={center} cy={center} r={radius} fill="#f6f4ed" stroke="#c2c9c4" strokeWidth="1.5"/>
    <circle cx={center} cy={center} r={radius/2} fill="none" stroke="#d6d9d1" strokeWidth="1.2" strokeDasharray="3 4"/>
    {Array.from({length:36},(_,i)=><path key={i} d={'M' + center + ' ' + (center-radius-2) + 'v-' + (i%3===0?9:4)} transform={'rotate(' + i*10 + ' ' + center + ' ' + center + ')'} stroke={i%3===0?'#74847e':'#b7c1b8'} strokeWidth={i%3===0?1.7:1.2}/>)}
    <path d={'M' + (center-radius) + ' ' + center + 'h' + radius*2 + 'M' + center + ' ' + (center-radius) + 'v' + radius*2} stroke="#c7cec6" strokeWidth="1.6"/>
  </g>;
}

export function FeaturePlot({ features, image, previous }: { features:number[][]; image:number[]; previous?:number[][] }) {
 const display=useAnimatedNumbers([...features.flat(),...image],850);
 const xy=(x:number,y:number)=>{const length=Math.hypot(x,y)||1;return [180+x/length*126,180-y/length*126]};
 const colors=[C.blue,C.purple,C.orange];
 return <svg className="lv-feature-plot" viewBox="0 0 360 360" role="img" aria-label="三类文本特征随上下文移动，深色箭头表示图像特征">
   <CompassDial center={180} radius={126}/>
   {previous?.map((v,i)=>{const [x,y]=xy(v[0],v[1]);return <circle key={i} cx={x} cy={y} r="10" stroke={colors[i]} strokeOpacity=".35" strokeWidth="2.5" fill="none"/>})}
   {[0,1,2].map(i=>{const[x,y]=xy(display[i*2],display[i*2+1]);return <g key={i}><path d={`M180 180L${x} ${y}`} stroke={colors[i]} strokeWidth="4" strokeLinecap="round"/><circle cx={x} cy={y} r="10" fill={colors[i]} stroke="#fff" strokeWidth="3"/><text x={x+(x>180?15:-15)} y={y-12} textAnchor={x>180?'start':'end'} fill={colors[i]} fontSize="22" fontWeight="750">{['猫','狗','花'][i]}</text></g>})}
   {(()=>{const[x,y]=xy(display[6],display[7]);return <g><path d={`M180 180L${x} ${y}`} stroke={C.ink} strokeWidth="4"/><path d="M0-10L8 7L-8 7Z" transform={`translate(${x} ${y}) rotate(${Math.atan2(y-180,x-180)*180/Math.PI+90})`} fill={C.ink}/></g>})()}
   <circle cx="180" cy="180" r="5" fill={C.ink}/>
 </svg>;
}

export function ProbabilityBars({ values, reveal = true }: { values:number[]; reveal?:boolean }) {
 const shown=useAnimatedNumbers(values.map(n=>reveal?n:0),850);
 return <div className="lv-probability-bars">{values.map((_,i)=><div className="lv-probability-row" key={i} style={{'--row-color':[C.blue,C.purple,C.orange][i]} as React.CSSProperties}><div><strong>{['猫','狗','花'][i]}</strong><b>{reveal?(shown[i]*100).toFixed(2)+'%':'等待比较'}</b></div><div className="lv-bar-track"><span style={{width:`${shown[i]*100}%`}}/></div></div>)}</div>;
}

export function LossCurve({ trace, visible }: {trace:{step:number;loss:number}[];visible:boolean}) {
 const last=trace[trace.length-1];const [loss]=useAnimatedNumbers([last.loss],850);
 const max=Math.max(1,...trace.map(p=>p.loss*1.1));
 const points=trace.map((p,i)=>[30+i/Math.max(1,trace.length-1)*540,260-(i===trace.length-1?loss:p.loss)/max*210]);
 return <div className="lv-loss-chart"><div className="lv-chart-heading"><span>训练图片的损失</span><strong>{visible?loss.toFixed(4):'—'}</strong></div><svg viewBox="0 0 600 290" role="img" aria-label={`已更新${last.step}次，当前训练损失${last.loss.toFixed(4)}`}>
 {[0,1,2,3].map(i=><path key={i} d={`M30 ${50+i*70}H570`} stroke="#d5e1df" strokeWidth="2" strokeDasharray="4 7"/>)}
 {visible&&<><path d={`M${points.map(p=>p.join(',')).join('L')}L${points[points.length-1][0]} 260L30 260Z`} fill="#2c8b7812"/><path d={`M${points.map(p=>p.join(',')).join('L')}`} fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>{points.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===points.length-1?9:5} fill={i===points.length-1?C.orange:C.green} stroke="#fff" strokeWidth="3"/>)}</>}
 </svg><div className="lv-chart-axis"><span>第 {trace[0].step} 次更新</span><span>{visible?'越低越好':'先计算损失，再观察变化'}</span><span>第 {last.step} 次</span></div></div>;
}

export function MotionRegion({children,className=''}:{children:React.ReactNode;className?:string}) {
 const ref=useRef<HTMLDivElement>(null);const[play,setPlay]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;const sync=()=>setPlay(visible&&!document.hidden&&!media.matches);const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()});if(ref.current)observer.observe(ref.current);document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync)}},[]);
 return <div ref={ref} className={className} data-motion={play?'playing':'paused'}>{children}</div>;
}

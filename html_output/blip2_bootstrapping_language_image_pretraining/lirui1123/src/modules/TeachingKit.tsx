import React from 'react';
const C={ink:'#21324a',red:'#c43f52',blue:'#27446e',orange:'#f07e47'};
export function Artwork({focus=-1,small=false}:{focus?:number;small?:boolean}){return <svg viewBox="0 0 600 390" role="img" aria-label="博物馆画作：戴红围巾的猫，右侧有蓝杯子" className={'b-art '+(small?'small':'')}>
<rect x="12" y="12" width="576" height="366" rx="8" fill="#e4d1ae" stroke="#92400e" strokeWidth="8"/><rect x="32" y="32" width="536" height="326" fill="#eef0e5"/>
<path d="M33 300 Q260 270 567 299 V357 H33Z" fill="#c4cdb5"/><path d="M168 282 Q161 194 224 181 Q291 181 300 283" fill="#d8b481" stroke="#846846" strokeWidth="5"/>
<path d="M180 141 L176 78 L222 113 Q250 99 276 111 L316 78 L309 146 Q327 207 247 217 Q166 205 180 141Z" fill="#e4c79c" stroke="#846846" strokeWidth="5"/>
<ellipse cx="218" cy="153" rx="5" ry="8" fill={C.ink}/><ellipse cx="276" cy="153" rx="5" ry="8" fill={C.ink}/><path d="M237 174 l10 8 10-8 M247 182 v10" fill="none" stroke={C.ink} strokeWidth="4"/>
<path d="M181 199 Q245 220 310 197 L309 223 Q245 242 182 224Z M279 226 L311 226 L323 280 L292 280Z" fill={C.red}/>
<path d="M383 232 H463 V297 Q423 315 383 297Z M463 242 Q504 241 491 272 Q485 284 463 281" fill="#96b4c2" stroke={C.blue} strokeWidth="6"/>
{focus>=0&&<ellipse className="b-focus" cx={[244,280,425][focus]} cy={[149,222,266][focus]} rx={focus===0?88:65} ry={focus===0?87:50} fill="none" stroke={C.orange} strokeWidth="8" strokeDasharray="14 8"/>}
</svg>}

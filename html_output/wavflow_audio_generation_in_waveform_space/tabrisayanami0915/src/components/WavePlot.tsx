import React from 'react';
export function WavePlot({samples,label}: {samples:number[];label:string}) {
 const path=samples.map((v,i)=>(i===0?'M':'L')+(20+i*760/(samples.length-1)).toFixed(2)+','+(110-v*28).toFixed(2)).join(' ');
 return <svg className="wave-plot" viewBox="0 0 800 220" role="img" aria-label={label}>
 <title>{label}</title><rect width="800" height="220" fill="#f5f8f0"/>
 <path d="M20 26 H780 M20 110 H780 M20 194 H780" stroke="#d7deea" fill="none"/>
 <text x="22" y="22">+3</text><text x="22" y="106">0</text><text x="22" y="211">−3</text>
 <path d={path} stroke="#228d5c" strokeWidth="1.5" fill="none"/>
 </svg>;
}

import React, { useId, useState } from 'react';

const episodes = [
  { choices: ['柔化画面', '增强细节'], notes: ['模糊视野会同时削弱小目标与背景细节。这个巡防场景只解释信息取舍，不是论文检测结果。', '放大细节时，目标边缘和亮窗、树叶都更显眼。图中变化是示意，实际虚警要按统一协议测量。'] },
  { choices: ['照亮整片区域', '依据线索收束灯光'], notes: ['一束宽光把目标和干扰一起照亮，用来类比未作选择的特征传递。', '根据粗略线索缩小关注范围，用来理解低频生成空间权重。灯光边界不是真实模型的注意力图，线索也可能判断失误。'] },
  { choices: ['只看中心', '由近及远环视'], notes: ['巡防员先锁定可疑点，但中心一点不足以表达它与周围环境的差异。', '围绕可疑点由近及远查看，用来理解螺旋采样。真实采样坐标还取决于头数、点数、半径和可学习偏置。'] },
  { choices: ['保留原配置', '只换一个部件'], notes: ['比较前先记录同一台设备、场景和观察规则。这里把对照实验类比为巡防设备测试。', '一次替换一个部件，才能较清楚地讨论该变化的影响。示意不产生性能增益；实际差异见论文消融表。'] },
  { choices: ['混用记录表', '对齐记录条件'], notes: ['两份记录若使用不同条件，数字表面上接近也不能直接比较。空白表格仅用于说明比较原则。', '先对齐场景、规则和单位，再比较记录。论文结果仍需保留数据集、指标及对照配置。'] },
  { choices: ['记录观察', '检查结论边界'], notes: ['巡防记录应区分眼前观察、设备测量和解释判断。这个笔记本是教学类比。', '逐条追问证据支持到哪里：一个场景中的改善，不能自动推广到所有场景，也不能替代模型复现。'] },
];

function Drone({ x, y, bright }: { x: number; y: number; bright: boolean }) {
  return <g transform={`translate(${x} ${y})`} stroke={bright ? '#f7cf83' : '#91a6a9'} strokeWidth="2" fill="none"><path d="M-12-3L12 3M-12 3L12-3"/><ellipse cx="-15" cy="-5" rx="8" ry="2"/><ellipse cx="15" cy="-5" rx="8" ry="2"/><rect x="-6" y="-3" width="12" height="7" rx="2" fill={bright ? '#f7cf83' : '#91a6a9'}/></g>;
}
function City({ detail }: { detail: boolean }) {
  return <><path d="M0 142H560V180H0Z" fill="#203744"/><path d="M45 142V80H112V142M126 142V97H185V142M401 142V75H468V142M480 142V102H531V142" fill="#2b414d" stroke="#52606c"/>{[58,83,414,439,493].map((x,i)=><g key={x} fill={detail ? '#ddbf77' : '#71848b'}><rect x={x} y={i===4?113:90} width="11" height="13" rx="1"/><rect x={x} y="116" width="11" height="13" rx="1"/></g>)}<g fill={detail?'#536f69':'#344f54'}><path d="M220 144L240 95L261 144ZM249 143L272 81L300 143Z"/><path d="M322 144L340 100L360 144Z"/></g><path d="M0 160H560" stroke="#526471" strokeDasharray="18 12"/></>;
}

export function ChapterAnalogy({ index }: { index: number }) {
  const [selected, setSelected] = useState(0);
  const key = useId().replace(/:/g,'');
  const e = episodes[index];
  return <div className="guide-analogy ns-analogy">
    <div className="guide-map"><svg viewBox="0 0 560 180" role="img" aria-label={`${e.choices[selected]}：夜间巡防教学类比`}>
      <defs><filter id={`blur-${key}`}><feGaussianBlur stdDeviation="2.1"/></filter><linearGradient id={`sky-${key}`} x2="0" y2="1"><stop stopColor="#142334"/><stop offset="1" stopColor="#314956"/></linearGradient></defs>
      <rect width="560" height="180" rx="12" fill={`url(#sky-${key})`}/><circle cx="507" cy="28" r="11" fill="#d4d7b8" opacity=".65"/>
      {index < 3 ? <>
        <g filter={index===0 && selected===0 ? `url(#blur-${key})` : undefined}><City detail={index===0 ? selected===1 : true}/><Drone x={310} y={62} bright={selected===1}/></g>
        {index===1 && <path d={selected===0?'M200 164L122 21H480Z':'M200 164L274 37L340 81Z'} fill="#f6d58b" opacity=".18"/>}
        {index===2 && <g fill="none" stroke="#f3be69" strokeWidth="1.8">{selected===0?<circle cx="310" cy="62" r="11"/>:<><path d="M310 62C326 47 339 58 332 76C321 100 284 91 281 65C277 32 319 19 346 39C376 64 357 111 313 116" strokeDasharray="5 4"/>{[[327,57],[332,80],[285,75],[301,28],[353,47],[347,101]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#f3be69"/>)}</>}</g>}
        <g transform="translate(196 127)"><circle cy="-11" r="7" fill="#b3c6c4"/><path d="M-9 0H8L13 24H-14Z" fill="#5f8c84"/><path d="M-5 24L-10 41M7 24L12 41" stroke="#b3c6c4" strokeWidth="5"/><path d="M2 4L18-6L25-12" stroke="#b3c6c4" strokeWidth="5"/><rect x="17" y="-17" width="16" height="11" rx="3" fill="#9eb0ae"/></g>
      </> : index===3 ? <>
        <path d="M145 147H415" stroke="#6d888c" strokeWidth="3"/><rect x="190" y="65" width="125" height="65" rx="12" fill="#597c7a" stroke="#a8c3ba" strokeWidth="2"/><path d="M315 70L355 54V139L315 124Z" fill="#83a69d"/><circle cx="356" cy="96" r="36" fill="#112431" stroke="#c1d0bc" strokeWidth="4"/><circle cx="356" cy="96" r="24" fill={selected?'#529488':'#47667c'}/><rect x="216" y="54" width="38" height="12" rx="4" fill="#a1bab0"/><path d="M231 130L220 160M275 130L287 160" stroke="#a1bab0" strokeWidth="6"/>{selected===1&&<g><circle cx="395" cy="96" r="28" fill="none" stroke="#efbe70" strokeWidth="5"/><path d="M427 96H457M446 85L457 96L446 107" stroke="#efbe70" strokeWidth="3" fill="none"/></g>}
      </> : <>
        {[154,310].map((x,i)=><g key={x} transform={`translate(${x} ${selected||i===0?28:44}) rotate(${selected?0:i===0?-4:5} 58 58)`}><rect width="116" height="127" rx="7" fill="#e4e9dc"/><rect x="30" y="-6" width="56" height="15" rx="4" fill="#71918a"/><path d="M17 35H99M17 58H99M17 81H99M17 104H99" stroke="#a7b9af"/>{[35,58,81].map((y,j)=><g key={y}><rect x="18" y={y-10} width="9" height="8" fill="none" stroke="#718f85"/>{selected===1&&<path d={`M19 ${y-6}l3 3l5-7`} fill="none" stroke="#416f62" strokeWidth="2"/>}<path d={`M38 ${y-6}h${44-j*7}`} stroke="#7d9d91" strokeWidth="3"/></g>)}</g>)}
        {index===5&&<g transform={`translate(${selected?379:217} 83)`}><circle r="27" fill="#b8dfd4" fillOpacity=".2" stroke="#e8ba72" strokeWidth="5"/><path d="M19 20L44 45" stroke="#e8ba72" strokeWidth="9" strokeLinecap="round"/></g>}
      </>}
    </svg></div>
    <div className="guide-analogy-switch" role="group" aria-label="切换巡防类比状态">{e.choices.map((label,i)=><button key={label} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}>{label}</button>)}</div>
    <p className="guide-analogy-caption" aria-live="polite">{e.notes[selected]}</p>
  </div>;
}

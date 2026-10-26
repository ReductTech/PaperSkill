import React, { useId, useState } from 'react';

const palette = {
  paper: '#fffefa', ground: '#f0f3e9', line: '#cad5c9', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', purple: '#7c3aed',
};

function MapSheet({ x = 20, y = 12, width = 520, height = 116 }: { x?: number; y?: number; width?: number; height?: number }) {
  return <g>
    <rect x={x} y={y} width={width} height={height} rx="7" fill={palette.paper} stroke={palette.line} />
    <path d={`M${x + width * .32} ${y + 5}V${y + height - 5}M${x + width * .68} ${y + 5}V${y + height - 5}M${x + 5} ${y + height * .52}H${x + width - 5}`} stroke="#e8eddf" strokeWidth="13" />
    <path d={`M${x + width * .32} ${y + 5}V${y + height - 5}M${x + width * .68} ${y + 5}V${y + height - 5}M${x + 5} ${y + height * .52}H${x + width - 5}`} stroke="#b5c5ab" strokeWidth="1" strokeDasharray="4 5" />
    {[.08,.44,.79].map((at,i)=><g key={at} fill={i===1?'#b6c6be':'#ced8c6'}>
      <rect x={x+width*at} y={y+13} width={width*.10} height={height*.22} rx="3"/>
      <rect x={x+width*at} y={y+height*.68} width={width*.14} height={height*.18} rx="3"/>
    </g>)}
  </g>;
}

function Car({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x="-13" y="-5" width="26" height="10" rx="4" fill={palette.orange}/>
    <rect x="-4" y="-4" width="9" height="8" rx="1" fill="#fff9e7"/>
    <path d="M-8 -6H-3M-8 6H-3M6 -6H10M6 6H10" stroke={palette.ink} strokeWidth="2"/>
  </g>;
}

function Choice({ value, labels, set }: { value: number; labels: string[]; set: (value: number)=>void }) {
  return <div className="guide-analogy-switch" role="group" aria-label="类比观察方式">
    {labels.map((label,i)=><button key={label} type="button" aria-pressed={value===i} onClick={()=>set(i)}>{label}</button>)}
  </div>;
}

/** Six distinct city-map activities. Geometry is illustrative, never a detector output. */
export function ChapterAnalogy({ index }: { index: number }) {
  const [choice,setChoice] = useState(0);
  const [size,setSize] = useState(64);
  const clipId = useId().replace(/:/g,'');
  const sceneTitles = ['用放大镜查看地图中的不同目标','把城市轮廓叠到街区详图','调整地图上的搜索窗口','按区域大小选择地图页','用同一把尺核对两份记录','为记录加上证据标签'];
  const labelSets = [
    ['找小汽车','看体育场'], ['只有详图','叠入总图轮廓'], [],
    ['小区域','中区域','大区域'], ['核对任务','核对指标'], ['原文记录','待检验推断'],
  ];
  let graphic: React.ReactNode;
  let feedback: string;

  if(index===0) {
    const lensX = choice===0 ? 174 : 398;
    graphic = <>
      <MapSheet/>
      <Car x={174} y={72}/>
      <ellipse cx="398" cy="72" rx="40" ry="25" fill="#cfddbd" stroke="#839b73" strokeWidth="6"/>
      <ellipse cx="398" cy="72" rx="27" ry="14" fill="none" stroke="#fffefa" strokeWidth="2"/>
      <g style={{transform:`translateX(${lensX}px)`,transition:'transform 260ms ease'}}>
        <circle cy="72" r="43" fill="#ffffff16" stroke={palette.blue} strokeWidth="4"/>
        <path d="M31 104L51 124" stroke="#92400e" strokeWidth="9" strokeLinecap="round"/>
        {choice===0&&<Car x={0} y={72} scale={1.8}/>}
      </g>
    </>;
    feedback = choice===0 ? '放大街区，小汽车的轮廓更容易辨认。它帮助理解小目标为什么需要细密采样；网络识别还取决于语义特征。' : '体育场在总图中仍能辨认，不必和小汽车使用同一观察尺度。地图放大只是类比，不会替网络恢复丢失的信息。';
  } else if(index===1) {
    graphic = <>
      <MapSheet x={116} width={328}/>
      <g style={{transform:choice?'translate(0,0)':'translate(62px,-16px)',opacity:choice?.9:.45,transition:'transform 260ms ease, opacity 260ms ease'}}>
        <rect x="116" y="12" width="328" height="116" rx="7" fill="#d6e4f022" stroke={palette.blue} strokeWidth="2" strokeDasharray="6 4"/>
        <path d="M137 40Q196 12 220 43T298 45T421 38M130 103Q190 117 234 92T342 91T427 105" fill="none" stroke={palette.blue} strokeWidth="4"/>
        <path d="M277 25V115" stroke={palette.blue} strokeWidth="2"/>
      </g>
      <path d="M84 40V104M76 40H92M76 104H92" stroke="#b7bda9" strokeWidth="2"/>
    </>;
    feedback = choice===0 ? '街区详图保留细节，却缺少较大范围的线索。虚线透明片表示尚未对齐的城市总图。' : '将透明轮廓与详图对齐，两种信息才对应同一位置。FPN 实际相加的是张量；这张叠图不代表真实特征可视化。';
  } else if(index===2) {
    const windowWidth = size * 1.6;
    const windowHeight = size * .8;
    graphic = <>
      <MapSheet x={92} width={376}/>
      <Car x={280} y={72} scale={2.4}/>
      <rect x={280-windowWidth/2} y={72-windowHeight/2} width={windowWidth} height={windowHeight} rx="3" fill="#f07e4714" stroke={palette.orange} strokeWidth="3"/>
      <path d={`M${280-windowWidth/2} ${78+windowHeight/2}H${280+windowWidth/2}`} stroke={palette.blue} strokeWidth="1.5"/>
      <circle cx={280+windowWidth/2} cy={72+windowHeight/2} r="5" fill={palette.orange}/>
    </>;
    const coversCar = windowWidth >= 26 * 2.4 && windowHeight >= 14 * 2.4;
    feedback = !coversCar ? '窗口偏小，不能完整覆盖这辆车的轮廓。搜索窗口帮助理解候选框尺度，真实 RPN 仍需用 IoU 和最高匹配规则确定标签。' : size>90 ? '窗口偏大，包含了更多周围区域。并非候选框越大越好；这里没有把示意窗口直接当成训练正负样本。' : '窗口已覆盖车的轮廓。下面的 RPN 交互会实际计算局部锚框 IoU；本图只演示尺寸取舍，不据此判断正负样本。';
  } else if(index===3) {
    const labels=['P3','P4','P5'];
    const arrowX=[160,280,400][choice];
    graphic = <>
      <path d="M62 23Q170 7 280 23Q390 7 498 23V124Q390 107 280 124Q170 107 62 124Z" fill={palette.paper} stroke={palette.line} strokeWidth="2"/>
      <path d="M280 23V124" stroke={palette.line}/>
      {[160,280,400].map((x,i)=><g key={x}>
        <rect x={x-42} y="42" width="84" height="57" rx="4" fill={i===choice?'#e3efe7':'#f0f3e9'} stroke={i===choice?palette.green:palette.line} strokeWidth={i===choice?2:1}/>
        <path d={`M${x-30} 64H${x+30}M${x-30} 79H${x+30}M${x-14} 48V93M${x+12} 48V93`} stroke="#b6c6af" strokeWidth={i+1}/>
        {i===choice&&<text x={x} y="115" fontSize="24" textAnchor="middle" fill={palette.muted}>{labels[i]}</text>}
      </g>)}
      <g style={{transform:`translateX(${arrowX}px)`,transition:'transform 240ms ease'}}>
        <path d="M-10 14H10V27H16L0 39L-16 27H-10Z" fill={palette.orange}/>
      </g>
    </>;
    feedback = [`等效尺度 112 对应 P3。把区域交给适合的地图页后，再取得固定大小的表示；这是 RoI 选层的类比。`,`等效尺度 224 对应 P4。选层看的是 √(wh)，不是只看宽度；下方实验会展示原式和向下取整。`,`等效尺度 448 对应 P5。指针只表示所选层，不表示把全部地图页拼起来；超过可用层的情况另作边界处理。`][choice];
  } else if(index===4) {
    const rulerY=choice===0?58:96;
    graphic = <>
      {[44,304].map((x,i)=><g key={x}>
        <rect x={x} y="12" width="212" height="116" rx="5" fill={palette.paper} stroke={palette.line}/>
        <path d={`M${x+18} 42H${x+194}M${x+18} 76H${x+194}M${x+18} 109H${x+194}`} stroke="#e4e8df"/>
        <path d={`M${x+22} 28H${x+88}M${x+142} 28H${x+189}`} stroke="#b8c9a7" strokeWidth="4" strokeLinecap="round"/>
        {choice===0 ? <text x={x+106} y="65" fontSize="24" textAnchor="middle" fill={palette.ink}>{i===0?'类别检测':'掩膜提案'}</text>
          : <text x={x+106} y="100" fontSize="28" textAnchor="middle" fill={palette.blue}>{i===0?'AP':'AR'}</text>}
        <path d={`M${x+43} ${choice===0?94:60}H${x+168}`} stroke="#d5ddcf" strokeWidth="4" strokeLinecap="round"/>
      </g>)}
      <g style={{transform:`translateY(${rulerY}px)`,transition:'transform 240ms ease'}}>
        <rect x="29" y="-9" width="502" height="19" rx="3" fill="#f1c28b66" stroke="#c5955d"/>
        {Array.from({length:31},(_,i)=><path key={i} d={`M${40+i*16} -9v${i%5===0?8:4}`} stroke="#93622e"/>)}
      </g>
    </>;
    feedback = choice===0 ? '先核对报告在测什么：一份评估类别检测，另一份评估掩膜候选覆盖。任务不同，数字不能直接排成优劣。' : '同一把尺不能把 AP 换算成 AR。比较结果前还要核对数据划分、骨干、训练与硬件；此处不添加任何实验数值。';
  } else {
    const color=choice===0?palette.blue:palette.purple;
    graphic = <>
      <rect x="104" y="13" width="352" height="114" rx="6" fill={palette.paper} stroke={palette.line}/>
      <path d="M130 41H291M130 68H325M130 96H300" stroke="#c7d1c5" strokeWidth="3" strokeLinecap="round"/>
      <path d="M118 22V117" stroke="#efd4bd"/>
      <g style={{transform:choice?'translate(0,4px) rotate(4deg)':'translate(0,0) rotate(-3deg)',transformOrigin:'375px 72px',transition:'transform 240ms ease'}}>
        <rect x="330" y="43" width="103" height="57" rx="4" fill={choice===0?'#ecf0f7':'#f2edf9'} stroke={color} strokeWidth="2.5"/>
        <rect x="336" y="49" width="91" height="45" rx="2" fill="none" stroke={color}/>
        <text x="381" y="79" textAnchor="middle" fontSize="24" fontWeight="600" fill={color}>{choice===0?'原文':'推断'}</text>
      </g>
    </>;
    feedback = choice===0 ? '原文记录：检测实验的额外 FPN 层输出 256 通道。这样的陈述可以回到论文 §3 核对。' : '待检验推断：换一个数据集后，类似结构也可能有效。它不能仅凭本文 COCO 结果成为既定结论；标签要跟着证据性质走。';
  }

  return <div className="guide-analogy">
    <div className="guide-map">
      <svg viewBox="0 0 560 140" role="img" aria-labelledby={`${clipId}-title`} style={{display:'block',width:'100%',height:'auto'}}>
        <title id={`${clipId}-title`}>{sceneTitles[index]}（教学类比）</title>
        <rect width="560" height="140" rx="6" fill={palette.ground}/>
        {graphic}
      </svg>
    </div>
    {index===2 ? <label style={{display:'grid',gridTemplateColumns:'auto 1fr auto',alignItems:'center',gap:12,margin:'12px 0',fontSize:'.84rem'}}>
      搜索窗 <input aria-label="搜索窗口尺度（教学值）" type="range" min="36" max="116" value={size} onChange={e=>setSize(Number(e.target.value))} style={{width:'100%',minWidth:0,height:32,accentColor:palette.orange}}/><output>{size}</output>
    </label> : <Choice value={choice} labels={labelSets[index]} set={setChoice}/>}
    <p className="guide-analogy-caption" aria-live="polite">{feedback}</p>
  </div>;
}

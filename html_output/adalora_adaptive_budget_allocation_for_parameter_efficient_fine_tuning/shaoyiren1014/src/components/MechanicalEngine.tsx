import { motion } from 'framer-motion';

export default function MechanicalEngine({ allocation = [3,3,3,3], reduced = false }: { allocation?: number[]; reduced?: boolean }) {
  return <div className="engine-drawing">
    <svg viewBox="0 0 520 405" role="img" aria-label={`教学蓝图：保持原来的主引擎不变，四个部门的资源份额分别为 ${allocation.join('、')}。不表示模型准确率。`}>
      <defs><pattern id="blueprint-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0v26" fill="none" stroke="#bda274" strokeOpacity=".08" strokeWidth=".6"/></pattern></defs>
      <rect x="0" y="0" width="520" height="405" fill="url(#blueprint-grid)"/>
      <g fill="none" stroke="#bba078" strokeWidth="1.2">
        <path d="M49 80h420M49 334h420" opacity=".35"/>
        <path d="M69 184H39v68h75M407 184h74v68h-74"/>
        <rect x="112" y="122" width="298" height="158" rx="3"/>
        <rect x="120" y="131" width="280" height="139" rx="2" strokeOpacity=".25"/>
        <path d="M261 122V72M245 72h32M254 66h14M261 280v28M110 201h301"/>
        <path d="M140 310h240M145 308v14M375 308v14" opacity=".5"/>
        <circle cx="260" cy="199" r="57"/><circle cx="260" cy="199" r="49" strokeOpacity=".35"/>
        <path d="M226 165h68v68h-68Z" strokeOpacity=".5"/>
        {[0,1,2,3,4].map(i => <path key={i} d={`M${238+i*11} 172v54M233 ${177+i*11}h54`} strokeOpacity=".28"/>)}
        {[135,382].map(x => <g key={x}><rect x={x} y="159" width="9" height="81"/><path d={`M${x+4} 150v-10M${x+4} 240v13`}/></g>)}
        {[0,1,2,3].map(i => <circle key={i} cx={128+(i%2)*266} cy={140+Math.floor(i/2)*122} r="2" fill="#bba078"/>)}
      </g>
      <text x="260" y="49" textAnchor="middle" className="svg-micro">TRANSFORMER / PRETRAINED ENGINE</text>
      <text x="260" y="300" textAnchor="middle" className="svg-label">原来的主引擎 · 保持不变</text>
      <g stroke="#bba078" fill="none">
        <path d="M75 326v-26h35M177 326v-19M341 326v-19M443 326v-26h-32" strokeOpacity=".65"/>
        {allocation.map((v,i) => <g key={i}>
          <rect x={44+i*112} y="326" width="95" height="40" rx="1" strokeOpacity=".65"/>
          {[0,1,2,3,4,5].map(j => <motion.rect key={j} x={52+i*112+j*12} y="339" width="8" height="14" stroke="none" animate={{fill:j<v?'#c7ab7c':'#353128'}} transition={{duration:reduced?0:.25}}/>)}
          <text x={91+i*112} y="389" textAnchor="middle" className="svg-label">部门 {['A','B','C','D'][i]}</text>
        </g>)}
      </g>
      <g stroke="#bba078" opacity=".3"><path d="M15 15h15M15 15v15M505 15h-15M505 15v15M15 405v-15M505 405v-15"/></g>
    </svg>
    <div className="drawing-caption"><span>FIG. 00 / 教学结构示意</span><span>资源份额 ≠ 任务效果</span></div>
  </div>;
}

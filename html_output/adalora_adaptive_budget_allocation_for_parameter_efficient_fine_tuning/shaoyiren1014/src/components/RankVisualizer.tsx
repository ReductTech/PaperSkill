import {motion} from 'framer-motion';
import type {RankTransfer} from '../store/rankStore';
export default function RankVisualizer({ranks,reduced,lastTransfer,serial}:{ranks:number[];reduced:boolean;lastTransfer?:RankTransfer;serial:number}){
  return <div className="rank-blueprint"><p className="drawing-top"><span>ALLOCATION BLUEPRINT</span><span>4 × 64 × 64</span></p><svg viewBox="0 0 400 300" role="img" aria-label={`教学容量蓝图：A、B、C、D 的 Rank 分别为 ${ranks.join('、')}，合计 12，不表示模型准确率。`}>
    <g fill="none" stroke="var(--line)"><path d="M54 30H332M54 270H332M354 52V246"/></g>
    {ranks.map((rank,i)=><g key={i} transform={`translate(0 ${54+i*60})`}><text x="20" y="15" className="rank-svg-label">{['A','B','C','D'][i]}</text><rect x="54" y="0" width="272" height="28" fill="none" stroke="var(--line)"/>{Array.from({length:8},(_,j)=><motion.rect key={j} x={61+j*33} y={7} width="22" height="14" initial={false} animate={{fill:j<rank?(rank>3?'#8ab7ac':'#c7ab7c'):'#29251e'}} transition={{duration:reduced?0:.18}}/>)}<path d="M153 -5v38" stroke="var(--brass)" strokeDasharray="2 3" opacity=".55"/><text x="379" y="17" textAnchor="end" className="rank-svg-count">{rank}</text></g>)}
    {lastTransfer&&<motion.g key={serial} initial={{y:reduced?lastTransfer.to*60:lastTransfer.from*60}} animate={{y:lastTransfer.to*60}} transition={{duration:reduced?0:.65,ease:'easeInOut'}}><path d="M326 68h28" stroke="var(--brass)"/><circle cx="354" cy="68" r="6" fill="var(--brass)" stroke="var(--bg)" strokeWidth="2"/></motion.g>}
  </svg><p className="quiet-caption rank-caption">每个亮格代表一条可分配通道。<br/>虚线标记初始 Rank 3。</p><p className="inline-note">机械臂只示意通道转移，不模拟模型训练。</p></div>;
}

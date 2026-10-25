import {motion} from 'framer-motion';
import Icon from './Icon';
export default function SingularTriplet({strengths,reduced}:{strengths:number[];reduced:boolean}){
  return <div className="singular-blueprint" aria-label="更新支路：输入方向 Q、贡献强度 Λ、输出方向 P">
    <div className="drawing-top"><span>UPDATE BRANCH / 更新支路</span><span>主模型保持冻结</span></div>
    <div className="triplet-head"><span><b>Q</b> 输入侧方向<small>从输入里提取线索</small></span><Icon name="arrow"/><span><b>Λ</b> 贡献强度<small>决定当前贡献多少</small></span><Icon name="arrow"/><span><b>P</b> 输出侧方向<small>把改动送到输出</small></span></div>
    {strengths.map((n,i)=><div className={`triplet-lane ${n===0?'suppressed':''}`} key={i}>
      <span className="lane-number">方向 {i+1}</span>
      <svg viewBox="0 0 600 76" role="img" aria-label={`方向 ${i+1}：强度 ${n/10}，P 和 Q 均保留${n===0?'，当前贡献为零':''}`}>
        <path d="M35 38H565" stroke="var(--line)" strokeWidth="2"/>
        <path d="M75 18L95 38L75 58M95 38H160M440 38H505M505 18L525 38L505 58" fill="none" stroke="var(--brass)" strokeWidth="2"/>
        <rect x="160" y="16" width="38" height="44" fill="none" stroke="var(--brass)"/>
        <rect x="402" y="16" width="38" height="44" fill="none" stroke="var(--brass)"/>
        <circle cx="300" cy="38" r="25" stroke="var(--brass)" fill="var(--bg)"/>
        <motion.path d="M198 38H270M330 38H402" stroke="var(--teal)" strokeWidth="4" animate={{opacity:n===0?0:.35+n*.065}} transition={{duration:reduced?0:.4}}/>
        <motion.path d="M300 38V20" stroke={n===0?'var(--muted)':'var(--teal)'} strokeWidth="3" style={{transformOrigin:'300px 38px'}} animate={{rotate:-120+n*24}} transition={{duration:reduced?0:.4}}/>
        {!reduced&&n>0&&<motion.circle r="3" cy="38" fill="var(--teal)" animate={{cx:[198,270],opacity:[0,1,0]}} transition={{duration:2.2,repeat:Infinity,delay:i*.35}}/>}
      </svg>
      <span className="lane-value">{(n/10).toFixed(1)}<small>{n===0?'暂不贡献':'方向保留'}</small></span>
    </div>)}
    <p className="quiet-caption">黄铜结构表示方向还在。青绿色流动只表示当前贡献，不表示准确率。</p>
  </div>;
}

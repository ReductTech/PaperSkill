import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { River,Person,ToolIcon,Notebook,C,Audit } from './earth-kit';

function Cover({newMethod}:{newMethod:boolean}){
 const {progress}=useCoverPlayback();
 const step=Math.min(3,Math.floor(progress*4));
 return <div style={{width:'100%',height:'100%'}}><Audit/><svg viewBox="0 0 664 324" width="100%" height="100%" role="img" aria-label={newMethod?'巡查员依据测量和记录完成河岸指数计算':'巡查员只看照片，无法获得光谱测量数值'}>
  <River width={664} height={324}/>
  <Person x={130+progress*95} y={283} scale={.95} arm={progress*12}/>
  <g transform={`translate(${278+progress*15} 162)`}><ToolIcon kind={newMethod&&step>=1?0:2} size={.8} selected/></g>
  <Notebook x={390} y={72} width={235} height={210} lines={newMethod?(step<1?['打开数据目录']:step<2?['NIR 0.6','Red 0.2']:['测量结果','指数 0.50']):['河岸照片','指数 ？']} stamp={newMethod&&step===3}/>
  <path d="M35 310H630" stroke={newMethod?C.green:C.red} strokeWidth="5" strokeDasharray={newMethod?undefined:'12 8'}/>
 </svg></div>
}
export function EarthCoverOld(){return <Cover newMethod={false}/>}
export function EarthCoverNew(){return <Cover newMethod/>}

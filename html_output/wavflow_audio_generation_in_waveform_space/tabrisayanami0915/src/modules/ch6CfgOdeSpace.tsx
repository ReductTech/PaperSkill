import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Choices, MetricsTable, Source } from '../components/Evidence';
const cfgRows=[
 ['1.0','145.53','16.34','1.54','9.86','0.26','0.71'],
 ['2.5','108.19','9.40','1.26','15.44','0.32','0.51'],
 ['4.5','121.09','9.58','1.20','16.42','0.33','0.47'],
 ['7.0','142.00','9.92','1.22','16.19','0.32','0.46'],
];
const stepRows=[
 ['10','118.90','10.73','1.30','14.93','0.31','0.47'],
 ['25','117.63','9.78','1.23','16.19','0.32','0.47'],
 ['50','121.09','9.58','1.20','16.42','0.33','0.47'],
 ['100','124.53','9.41','1.20','16.39','0.33','0.47'],
];
export const Ch6CfgOdeSpace: React.FC<WidgetProps> = () => {
 const [scan,setScan]=useState<'cfg'|'steps'>('cfg');
 const [cfg,setCfg]=useState('4.5');
 const [steps,setSteps]=useState('50');
 const rows=scan==='cfg'?cfgRows:stepRows;
 return <div className="widget-container">
 <Choices label="实验设置" value={scan} onChange={setScan} options={[
 {value:'cfg',label:'CFG 扫描 · 固定 50 步'},{value:'steps',label:'步数扫描 · 固定 CFG=4.5'}]} />
 {scan==='cfg'?<Choices label="查看 CFG" value={cfg} onChange={setCfg} options={cfgRows.map(r=>({value:r[0],label:r[0]}))}/>:
 <Choices label="查看步数" value={steps} onChange={setSteps} options={stepRows.map(r=>({value:r[0],label:r[0]}))}/>}
 <MetricsTable caption={scan==='cfg'?'CFG 扫描：固定 50 步':'ODE 步数扫描：固定 CFG=4.5'}
 headers={[scan==='cfg'?'CFG':'步数','FDPaSST ↓','FDPANNs ↓','KL ↓','IS ↑','IB ↑','DeSync ↓']}
 rows={rows} highlight={scan==='cfg'?cfg:steps}/>
 <div className="widget-feedback good" aria-live="polite">{scan==='cfg'?
 'CFG=2.5 的 FD 最低；4.5 的 IS 与 IB 最高；7.0 的 DeSync 最低但 FD 变差。论文默认选 4.5，不代表全部指标最优。':
 '50 步后总体收益有限；100 步的 FDPANNs 仍有所改善，但 FDPaSST 变差。默认 50 步是质量和成本的折中。'}</div>
 <Source>第 19–20 页，Appendix F、Table 10；WavFlow-M-16k，1M 数据规模，VGGSound-Val，8 秒。只展示论文报告的两组单变量实验。</Source>
 </div>;
};
export default Ch6CfgOdeSpace;

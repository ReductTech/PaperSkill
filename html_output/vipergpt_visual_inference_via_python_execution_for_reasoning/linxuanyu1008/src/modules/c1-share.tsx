import React, { useState } from 'react';
import { C } from './viper-kit';
import { LabStyles } from './lab-kit';
export function DetectionDivision() {
 const [missed,setMissed]=useState(false);
 const count=missed?7:8,answer=Math.floor(count/2);
 return <div className="vlab"><LabStyles/>
 <span className="source-tag">教学实验</span><label className="lab-switch"><input type="checkbox" checked={missed} onChange={e=>setMissed(e.target.checked)}/> 模拟漏检一个松饼</label>
 <div className="lab-flow" aria-label="漏检传播路径"><span style={{borderColor:missed?C.orange:C.blue}}>find 返回 {count} 个区域</span><b>→</b><span>Python：{count} // 2</span><b>→</b><span style={{borderColor:missed?C.red:C.green}}>每人 {answer} 个</span></div>
 <div className="lab-output" role="status" aria-live="polite">{missed?'照片仍有8个松饼；程序只收到7个检测区域，整除忠实得到3，余下1个。错误来自感知输入，Python没有自动修复它。':'图1报告8个松饼、2个孩子，8 // 2 = 4。开启漏检，观察同一计算规则如何传递错误。'}</div>
 </div>;
}

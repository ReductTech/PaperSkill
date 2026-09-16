import {MechanismField} from './mechanism-field';
import {useTimeline} from './reading-wheel';
import {Panel} from './lab-ui';
export function C3Main(){const timeline=useTimeline(3),step=Math.floor(timeline.progress+1e-8);const titles=['读取提示','文字与中间状态','预测音频码','解码完整帧'];return <Panel chapter={3} state={JSON.stringify({实验:'双路径教学',连续进度:timeline.progress.toFixed(3),逻辑阶段:step,实测:false})}>
 <p>用固定教学例句“今天阳光很好”追踪两条出口。滚动展开线路，点击图下的模块名称定位职责；这不是模型实测。</p>
 <div className="ctrl">{titles.map((title,i)=><button key={title} aria-pressed={step===i} onClick={()=>timeline.seek(i)}>{i+1} · {title}</button>)}<button onClick={()=>timeline.seek(0,true)}>重置</button></div>
 <MechanismField kind="architecture" timeline={timeline}/>
 <div className="feedback" aria-live="polite">{['Thinker 获得输入上下文。向下滚动，让文字出口与中间状态分支逐渐展开。','两条出口都来自 Thinker：文字供阅读，中间状态给 Talker 提供内容条件。继续看它怎样接上音频历史。','Talker 自回归预测音频码；后续预测要利用已生成的音频历史。继续展开解码端。','凑齐一帧所需的八层码后，Mimi 可以解码这一帧；后续帧仍可继续生成。'][step]}</div>
 <p className="lab-note">依据：论文 p3 图 2、p13 表 6。这里展示模块职责，真实系统不需要等整句文字结束才处理语音。粒子数量与移动速度不表示真实计算量或耗时。</p>
 </Panel>}

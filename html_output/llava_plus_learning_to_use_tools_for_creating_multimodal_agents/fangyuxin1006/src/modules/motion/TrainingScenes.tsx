import React from 'react';
import {Stage,Panel,T,C,ramp,ease} from './art';
import type {Props} from './art';

function Kite(){return <g><path d="M196 35L224 73L196 105L166 73Z" fill="#d7826c" stroke="#aa6657" strokeWidth="2"/><path d="M196 35V105M166 73H224" stroke="#fae7cb" strokeWidth="2"/><path d="M196 105Q220 137 181 151Q163 164 185 180" stroke="#8f725b" fill="none" strokeWidth="2"/><path d="M193 128l-11-5 6 13M184 153l-12 5 12 5" fill="#e0af70"/></g>;}
function KitePhoto({x,y,w=280,h=220,q=0}:{x:number;y:number;w?:number;h?:number;q?:number}){return <svg x={x} y={y} width={w} height={h} viewBox="0 0 280 220"><rect width="280" height="220" rx="8" fill="#dcecf5"/><path d="M0 195Q67 167 122 194T280 185V220H0Z" fill="#a1b88c"/><path d="M18 43q4-17 20-10q14-18 29 1q20 0 18 17H18" fill="#fff9"/><Kite/>{q>0&&<><rect data-motion="kite-detection-box" x={166} y={35} width="58" height="70" fill="#2859860d" stroke={C.blue} strokeWidth="3" pathLength="1" strokeDasharray="1" strokeDashoffset={1-q}/><path data-motion="kite-measurement" d={`M166 ${113+22*(1-q)}H224M${157-16*(1-q)} 35V105`} stroke={C.orange} strokeWidth="2"/><T x={162} y={27} size={15} fill={C.blue}>kite</T></>}</svg>;}
const rows=[
 {role:'Human · 用户',content:'图像 + 请定位风筝。',token:'定位',m:0},
 {role:'Assistant · 调用',content:'grounding_dino · caption: kite .',token:'kite',m:1},
 {role:'Human · 工具返回',content:'kite 的框 + 再次附上原问题',token:'kite',m:0},
 {role:'Assistant · 回答',content:'风筝在右上方；actions: []',token:'右上方',m:1}
];
export function Training({mode,p,prob,seek}:Props){if(mode===1)return <DatasetAssembly p={p}/>;const selected=Math.min(3,Math.floor(p*4)),local=p*4%1,row=rows[selected],q=ease(ramp(local,.02,.6)),loss=-Math.log(prob),contribution=row.m*loss;
return <Stage kind="causal-supervision-workbench" height={480} label="在完整对话上选择预测位置，前文可见而后文不可见；角色掩码只控制目标损失，不删除输入">
 <T x={20} y={29} size={21} weight={650}>把完整样本摊开：这一位置看见什么，又监督什么？</T>
 <T x={20} y={58} size={16} fill={C.muted}>点击任一对话行检查本步计算；下方概率滑块会同时改变概率分布与损失。</T>
 <Panel x={20} y={78} w={477} h={334} title="同一个训练序列 · 顺序始终保留"/>
 {rows.map((r,i)=><g key={r.role} role="button" tabIndex={0} aria-label={`检查${r.role}`} onClick={()=>seek?.((i+.77)/4)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();seek?.((i+.77)/4)}}} style={{cursor:'pointer'}} data-causal-state={i<selected?'prefix':i===selected?'current':'future'}>
  <rect x="34" y={119+i*70} width="448" height="61" rx="7" fill={i===selected?'#e2edf9':i<selected?'#f0f4f7':'#fbfcfd'} stroke={i===selected?C.blue:C.line} strokeWidth={i===selected?2.5:1.3} strokeDasharray={i>selected?'5 4':undefined}/>
  <rect data-motion="role-mask-band" x="34" y={119+i*70} width={i===selected?7+q*8:7} height="61" rx="3" fill={r.m?C.green:'#95a3b4'}/>
  <T x={58} y={140+i*70} size={15} fill={C.muted}>{r.role}</T><T x={58} y={166+i*70} size={16}>{r.content}</T>
  <T x={412} y={141+i*70} size={17} fill={r.m?C.green:C.muted}>m = {r.m}</T>
  <T x={378} y={166+i*70} size={12} fill={C.muted}>{i<selected?'可用前文':i===selected?'当前行':'后文不可见'}</T>
 </g>)}
 <Panel x={523} y={78} w={477} h={213} title="本步的预测分布" active>
  <T x={541} y={139} size={19}>目标词元（示意）：{row.token}</T>
  <T x={542} y={183} size={16}>目标词元</T><rect x="637" y="163" width="266" height="29" rx="5" fill="#e9eef4"/><rect data-motion="target-probability-mass" x="637" y="163" width={266*prob*q} height="29" rx="5" fill={C.green}/><T x={927} y={184} size={19}>{prob.toFixed(2)}</T>
  <T x={542} y={230} size={16}>其余词元</T><rect x="637" y="211" width="266" height="29" rx="5" fill="#e9eef4"/><rect data-motion="other-probability-mass" x="637" y="211" width={266*(1-prob)*q} height="29" rx="5" fill="#93a7c0"/><T x={927} y={232} size={19}>{(1-prob).toFixed(2)}</T>
  <T x={541} y={272} size={15} fill={C.muted}>两部分概率合计 1；数值由滑块设置。</T>
 </Panel>
 <Panel x={523} y={308} w={477} h={104} title={row.m?'这一目标计入损失':'这一位置的目标损失被屏蔽'} active={!!row.m}>
  <T x={544} y={376} size={23} weight={650}>{row.m} × −ln({prob.toFixed(2)}) = {contribution.toFixed(3)}</T>
  <rect x="936" y="330" width="42" height="61" rx="5" fill="#e8edf3"/><rect data-motion="weighted-loss" data-mask={row.m} data-value={contribution.toFixed(6)} x="936" y={391-60*Math.min(1,contribution/3)*q} width="42" height={60*Math.min(1,contribution/3)*q} rx="4" fill={C.orange}/>
 </Panel>
 <T x={20} y={441} size={16} fill={C.muted}>m = 0 只屏蔽目标损失；用户和已返回的工具内容仍留在后续预测的上下文中。</T>
 <T x={20} y={468} size={15} fill={C.muted}>逐行巡视是教学展开。实际使用因果自回归目标；可读片段不代表真实 tokenizer 的分词边界。</T>
 </Stage>;
}
function DatasetAssembly({p}:{p:number}){const step=p<.2?0:p<.42?1:p<.72?2:3,detect=ramp(p,.45,.64),measure=ramp(p,.61,.71),fold=ease(ramp(p,.75,.91));const records=[{at:.2,role:'Human',value:'图像 + 请定位风筝。'},{at:.34,role:'Assistant',value:'grounding_dino · kite .'},{at:.7,role:'Human',value:'检测框 + 请定位风筝。'},{at:.86,role:'Assistant',value:'风筝在右上方；actions: []'}];
return <Stage kind="kite-dataset-construction" height={480} label="先用图像标注改写请求，再执行风筝检测，最后把工具结果与回答装入四段训练序列">
 <T x={20} y={29} size={21} weight={650}>离线构造训练样本：问题先形成，工具先执行，答案后整理</T>
 {['图像与已有标注','改写问题与调用','执行检测，收集返回','整理答案与训练序列'].map((v,i)=><g key={v}><rect x={20+i*246} y="44" width="238" height="31" rx="6" fill={step===i?'#dce8f6':'#edf1f5'}/><T x={31+i*246} y={65} size={15}>{v}</T></g>)}
 <KitePhoto x={20} y={104} w={280} h={220} q={detect}/>
 <g data-motion="detection-focus" opacity={step===2?1-measure:0}><path d={`M${30+156*detect} ${119+20*detect}h18m-18 0v18M${290-46*detect} ${314-105*detect}h-18m18 0v-18`} stroke={C.orange} strokeWidth="4" fill="none"/></g>
 <T x={20} y={352} size={17}>图像描述：右上方有风筝</T><T x={20} y={380} size={17}>标注类别：kite</T><T x={20} y={406} size={15} fill={C.muted}>描述、类别与标注框提供构造上下文</T>
 <Panel x={325} y={94} w={290} h={318} title="改写请求，并执行工具">
 <T x={342} y={149} size={16}>GPT-4 改写：请定位风筝。</T><T x={342} y={182} size={16}>API_name: grounding_dino</T><T x={342} y={213} size={16}>API_params: image, kite .</T>
 <rect x="341" y="237" width="257" height="116" rx="8" fill="#edf2f7" stroke={C.line}/>
 {p>=.45?<svg x="351" y="243" width="94" height="102" data-motion="result-magnification" viewBox={`${153*detect} ${22*detect} ${280-190*detect} ${220-120*detect}`}><rect width="280" height="220" fill="#dcecf5"/><Kite/><rect data-motion="result-crop-frame" x="166" y="35" width="58" height="70" fill="none" stroke={C.blue} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1-detect}/></svg>:<T x={356} y={302} size={17} fill={C.muted}>等待执行检测</T>}
 {p>=.45&&<><T x={456} y={277} size={16}>检测框中的</T><T x={456} y={306} size={16}>风筝区域</T></>}
 <g data-motion="coordinate-record" transform={`translate(0 ${12*(1-measure)})`}><T x={342} y={380} size={15} fill={p>=.7?C.blue:C.muted}>{p>=.7?'返回框：[0.59, 0.16, 0.80, 0.48]':'等待工具返回坐标'}</T></g>
 </Panel>
 <Panel x={641} y={94} w={359} h={318} title="保存为四段完整对话">
 {records.map((r,i)=>{const ready=p>=r.at,settle=ease(ramp(p,r.at,r.at+.06));return <g key={r.role+i} data-motion="training-record" data-ready={ready?'true':'false'} transform={`translate(${ready?14*(1-settle):0} 0)`}>
  <rect x="657" y={139+i*64} width="327" height="55" rx="6" fill={ready?(i%2?'#e2f0e6':'#edf2f8'):'#f7f8fa'} stroke={ready?(i%2?C.green:C.line):'#dce2e9'} strokeDasharray={ready?undefined:'4 4'}/>
  <T x={670} y={159+i*64} size={14} fill={C.muted}>{r.role}</T><T x={670} y={181+i*64} size={15}>{ready?r.value:'等待前序步骤完成'}</T>
 </g>})}
 <path data-motion="notebook-fold" d={`M${976-15*(1-fold)} 96H998V${118+15*(1-fold)}Z`} fill="#e1e8f1"/>
 </Panel>
 <T x={20} y={442} size={16} fill={C.muted}>这里采用“指定类别、改写请求”的数据路线；图像条件供离线构造使用，后续答案结合工具返回。</T>
 <T x={20} y={468} size={15} fill={C.muted}>框坐标为自绘场景的预设示意（左上 x、左上 y、右下 x、右下 y），不把它当作真实检测实验。</T>
 </Stage>;
}

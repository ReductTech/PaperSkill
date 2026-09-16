import React,{useState} from 'react';
import {Canvas,Controls,Button,Chips,Feedback,Source,Detail,Metric,WidgetFrame,drawPhotoCue,palette,fmt} from './shared';
import {nearest,CUPS} from './math';
type Result=ReturnType<typeof nearest>&{height:number,diameter:number};
function parseField(text:string,name:string):number|string {
 if(text.trim()==='')return name+'不能为空。';
 const v=Number(text);
 if(!Number.isFinite(v))return name+'必须是有限数字。';
 if(v<1||v>30)return name+'的有效范围是1～30cm。';
 return v;
}
export function ContextExplorer(){
 const [context,setContext]=useState(false),[height,setHeight]=useState('11'),[diameter,setDiameter]=useState('8');
 const [result,setResult]=useState<Result|null>(null),[dirty,setDirty]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('只看查询时，本算例还没有可参照的已知样本。');
 const h=parseField(height,'杯高'),d=parseField(diameter,'口径');
 const current=!!result&&context&&!dirty&&typeof h==='number'&&typeof d==='number';
 const plotted=typeof h==='number'&&typeof d==='number'?[h,d]:result?[result.height,result.diameter]:[11,8];
 function edit(which:'height'|'diameter',text:string){which==='height'?setHeight(text):setDiameter(text);setDirty(true);setError('');setNotice('查询值已改变；先前结果待更新。');}
 function changeContext(v:string){setContext(v==='yes');setDirty(true);setError('');setNotice(v==='yes'?'3条已知样本可用于本算例，参数状态没有改变。':'已移除上下文；本算例不产生新的参考值。');}
 function calculate(){
  if(typeof h==='string'||typeof d==='string'){setError([typeof h==='string'?h:'',typeof d==='string'?d:''].filter(Boolean).join(' '));return;}
  setError('');
  if(!context){setNotice('请先加入3条已知样本；零上下文时本算例不计算参考值。');setDirty(true);return;}
  const n=nearest(h,d);setResult({...n,height:h,diameter:d});setDirty(false);
  setNotice(n.indices.length>1?'最近平方距离并列，参考值取并列样本容量的均值。':'最近样本是'+CUPS[n.indices[0]].name+'，参考值取该样本容量。');
 }
 function reset(){setContext(false);setHeight('11');setDiameter('8');setResult(null);setDirty(false);setError('');setNotice('已恢复默认查询与零上下文，没有计算参考值。');}
 return <WidgetFrame id="M01-context">
 <p style={{fontSize:'.86rem'}}>来源标记：P＝论文结论或记录；I＝推导与解释；T＝教学示意。</p>
 <Source kind="P / T" loc="p2 §2">上下文推理是TFM范式；以下是手写最近邻教学算例，没有运行任何模型。</Source>
 <Canvas label="杯高与口径二维图：方形是查询，圆点是已知样本，实线连接当前计算的最近样本" draw={ctx=>{
   const extent=Math.max(14,...plotted),scale=200/extent,x=(v:number)=>150+v*scale,y=(v:number)=>232-v*scale;
   ctx.strokeStyle=palette.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(150,18);ctx.lineTo(150,232);ctx.lineTo(370,232);ctx.stroke();
   ctx.fillStyle=palette.ink;ctx.font='20px sans-serif';ctx.fillText('杯高',378,238);ctx.fillText('口径',90,24);
   if(context)CUPS.forEach((c,i)=>{const active=current&&result!.indices.includes(i);if(active){ctx.strokeStyle=palette.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x(plotted[0]),y(plotted[1]));ctx.lineTo(x(c.height),y(c.diameter));ctx.stroke();}ctx.beginPath();ctx.arc(x(c.height),y(c.diameter),active?8:6,0,Math.PI*2);ctx.fillStyle=active?palette.green:palette.blue;ctx.fill();});
   ctx.fillStyle=palette.orange;ctx.fillRect(x(plotted[0])-6,y(plotted[1])-6,12,12);ctx.strokeStyle=palette.ink;ctx.strokeRect(x(plotted[0])-8,y(plotted[1])-8,16,16);
   drawPhotoCue(ctx,565,125,78,context?1:0);
 }}/>
 <Chips label="上下文" value={context?'yes':'no'} options={[{value:'no',label:'只看查询'},{value:'yes',label:'加入3条已知样本'}]} onChange={changeContext}/>
 <form onSubmit={e=>{e.preventDefault();calculate();}}>
 <Controls><label htmlFor="query-height">查询杯高（cm）<input id="query-height" type="text" inputMode="decimal" value={height} onChange={e=>edit('height',e.target.value)} aria-invalid={typeof h==='string'} style={{width:95,minHeight:44}}/></label>
 <label htmlFor="query-diameter">查询口径（cm）<input id="query-diameter" type="text" inputMode="decimal" value={diameter} onChange={e=>edit('diameter',e.target.value)} aria-invalid={typeof d==='string'} style={{width:95,minHeight:44}}/></label>
 <Button type="submit">计算示例结果</Button><Button onClick={reset}>重置本模块</Button></Controls></form>
 <div className="metrics"><Metric label="可用上下文" value={context?'3条':'0条'}/><Metric label="参数状态" value="固定"/><Metric label="邻近样本参考值（教学示意）" value={current?fmt(result!.value,2)+' mL':dirty&&result?'待更新':'尚未计算'}/></div>
 <div style={{overflowX:'auto'}}><table className="paper" style={{width:'100%'}}><caption style={{textAlign:'left',margin:'12px 0'}}>当前任务表 · 容量列只对已知样本可见</caption><thead><tr><th>样本</th><th>杯高/cm</th><th>口径/cm</th><th>容量/mL</th><th>平方距离/cm²</th><th>邻居</th></tr></thead><tbody>
 {context?CUPS.map((c,i)=><tr key={c.name}><th>{c.name}</th><td>{c.height}</td><td>{c.diameter}</td><td>{c.capacity}</td><td>{current?fmt(result!.squaredDistances[i]):'待计算'}</td><td>{current&&result!.indices.includes(i)?'最近'+(result!.indices.length>1?'（并列）':''):'—'}</td></tr>):null}
 <tr><th>查询</th><td>{height||'未输入'}</td><td>{diameter||'未输入'}</td><td>?</td><td>—</td><td>待预测</td></tr></tbody></table></div>
 <Feedback tone={error?'bad':current?'good':''}>{error||notice}{error&&result?' 上次有效结果已保留，不能当作当前输入的结果。':''}</Feedback>
 {result&&!current?<p aria-live="polite"><strong>上次有效结果（待更新）：</strong>查询({result.height},{result.diameter})、3条上下文 → {fmt(result.value,2)}mL；邻居{result.indices.map(i=>CUPS[i].name).join('、')}。它不对应当前输入或当前上下文状态。</p>:null}
 <Detail title="公开计算规则与适用范围">
 <p>对每条已知样本计算 d²=(杯高−已知杯高)²+(口径−已知口径)²。平方距离与欧氏距离给出相同的最近者；若并列，取并列容量的算术均值。</p>
 {current&&result!.indices.length>1?<p>本次并列计算：({result!.indices.map(i=>CUPS[i].capacity).join(' + ')}) / {result!.indices.length} = {fmt(result!.value)}mL。</p>:null}
 <p>这是手写最近邻算例，不是树模型，不是TabPFN或LimiX-2M推理，也不是杯子的物理容量公式。数据及规则为教学示意；未加载权重、未执行梯度更新。摄影线索只表示参照是否可见。</p>
 <p>本算例在零上下文时没有参考值，不能据此断言真实TFM一定无法预测。计算用双精度，距离并列允许约10⁻¹²相对容差处理舍入误差。</p>
 </Detail>
 </WidgetFrame>;
}

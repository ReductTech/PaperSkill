import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const panel: React.CSSProperties = { border: '1px solid #c9d8e7', borderRadius: 18, padding: 20, background: '#f8fbff', color: '#17314a' };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' };
const button = (active = false): React.CSSProperties => ({ border: '1px solid #80a2bd', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', background: active ? '#145f79' : '#fff', color: active ? '#fff' : '#17314a', fontWeight: 650 });
const note: React.CSSProperties = { fontSize: 13, color: '#556c80', marginTop: 12 };

function Timeline() {
  const [time, setTime] = useState(28);
  const human = [8, 51];
  const asr = [5, 17, 31, 42, 58];
  const lavila = [3, 9, 15, 21, 27, 33, 39, 45, 51, 57];
  const available = (ticks: number[]) => ticks.some(t => Math.abs(t - time) <= 2.5);
  const lanes = [
    { name: '人工叙述', ticks: human, color: '#d45a59', message: '原始标注可靠，但时间位置很少。' },
    { name: 'ASR 转录', ticks: asr, color: '#7f77a8', message: '有词不一定有画面动作；可用性不等于视觉对齐。' },
    { name: 'LaViLa 生成', ticks: lavila, color: '#168e79', message: '更密集的伪叙述可填空白，仍需质量筛选。' },
  ];
  return <div style={panel}>
    <div style={{...row, justifyContent:'space-between'}}><strong>播放头 {time} 秒 / 60 秒</strong><span>教学示意片段</span></div>
    <input aria-label="拖动视频时间轴" type="range" min="0" max="60" step="1" value={time} onChange={e=>setTime(Number(e.target.value))} style={{width:'100%', accentColor:'#1c7595', margin:'18px 0'}} />
    {lanes.map(lane=><div key={lane.name} style={{marginBottom:16}}>
      <div style={{...row, justifyContent:'space-between'}}><strong>{lane.name}</strong><span style={{color:lane.color}}>{available(lane.ticks) ? '当前位置有文字 ●' : '当前位置无文字 ○'} · 示意覆盖 {Math.round(lane.ticks.length*5/60*100)}%</span></div>
      <div style={{position:'relative', height:24, marginTop:7, borderRadius:12, background:'#e6edf3'}}>
        {lane.ticks.map(t=><span key={t} title={`${t}秒`} style={{position:'absolute',left:`${t/60*100}%`,top:5,width:12,height:12,borderRadius:'50%',background:lane.color,transform:'translateX(-50%)'}} />)}
        <span style={{position:'absolute',left:`${time/60*100}%`,top:0,height:24,width:2,background:'#183e59'}} />
      </div>
      <small style={{color:'#5c7182'}}>{lane.message}</small>
    </div>)}
    <div style={{padding:12,background:'#e8f5f1',borderRadius:10}}>这个示意时间轴中，三行分别有 <strong>2 / 5 / 10</strong> 个文字位置。点数表示覆盖密度，不代表真实论文样本数或描述质量。</div>
    <p style={note}>论文依据：第 1 页 Introduction；第 2 页 Figure 2。图中的原始 Human / ASR / LaViLa 对比见下方。</p>
  </div>;
}

function CaptionMatch() {
  const entries = [
    { name:'Human narration', caption:'C takes milk from the fridge.', correct:'稀疏', color:'#d45a59', why:'人工叙述与片段动作可对应，但只标在少量时刻。' },
    { name:'ASR transcription', caption:'Yeah, and then we will move on to...', correct:'可能不描述画面', color:'#7f77a8', why:'语音转录捕获说话内容，未必说出屏幕上的取牛奶动作。' },
    { name:'LaViLa narration', caption:'A person removes a bottle of milk from the refrigerator.', correct:'与画面动作对齐', color:'#168e79', why:'示意生成句描述了该片段的视觉动作；真实生成结果仍需筛选。' },
  ];
  const [choices,setChoices] = useState<string[]>(['','','']);
  const options=['稀疏','可能不描述画面','与画面动作对齐'];
  return <div style={panel}>
    <p><strong>画面：</strong>一人从冰箱取出牛奶。请判断每种文字的典型特点。<span style={{fontSize:13}}>（教学示例，非论文原句）</span></p>
    {entries.map((entry,i)=><div key={entry.name} style={{borderLeft:`4px solid ${entry.color}`,padding:'12px 14px',background:'#fff',borderRadius:8,marginBottom:12}}>
      <strong>{entry.name}</strong><div lang="en" style={{fontStyle:'italic',margin:'6px 0'}}>{entry.caption}</div>
      <label>最合适的标签： <select aria-label={`${entry.name} 的特点`} value={choices[i]} onChange={e=>setChoices(choices.map((v,j)=>i===j?e.target.value:v))} style={{padding:7,borderRadius:8}}>
        <option value="">请选择</option>{options.map(o=><option key={o}>{o}</option>)}
      </select></label>
      {choices[i] && <div role="status" style={{marginTop:8,color:choices[i]===entry.correct?'#147966':'#b94545'}}>{choices[i]===entry.correct?'✓ 对应正确。':'再想一想。'} {entry.why}</div>}
    </div>)}
    <p style={note}>典型差异来自论文第 2 页 Figure 2；三句仅用于说明交互，不是论文数据。</p>
  </div>;
}

function Cost() {
  const [hours,setHours]=useState(1000);
  const [density,setDensity]=useState(6);
  const labels=hours*density;
  const workHours=Math.round(labels*20/3600);
  return <div style={panel}>
    <p>设想每小时视频需要若干条人工描述。滑动两个参数，观察工作量如何变大。</p>
    <label style={{display:'block',margin:'16px 0'}}>视频时长：<strong>{hours.toLocaleString()} 小时</strong><input aria-label="视频时长" type="range" min="100" max="5000" step="100" value={hours} onChange={e=>setHours(Number(e.target.value))} style={{display:'block',width:'100%',accentColor:'#1c7595'}} /></label>
    <label style={{display:'block',margin:'16px 0'}}>每小时人工描述：<strong>{density} 条</strong><input aria-label="每小时人工描述数量" type="range" min="1" max="60" step="1" value={density} onChange={e=>setDensity(Number(e.target.value))} style={{display:'block',width:'100%',accentColor:'#1c7595'}} /></label>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
      <div style={{padding:14,background:'#e7f3fa',borderRadius:10}}><small>需要写的描述</small><div style={{fontSize:25,fontWeight:800}}>{labels.toLocaleString()} 条</div></div>
      <div style={{padding:14,background:'#fcefeb',borderRadius:10}}><small>估计人工录入时间</small><div style={{fontSize:25,fontWeight:800}}>{workHours.toLocaleString()} 小时</div></div>
    </div>
    <p style={note}>教学示意：假设每条录入耗时 20 秒，未包含观看、核对与质检；这是模拟值，不是论文测量。论文第 1 页 Introduction 说明大规模人工叙述成本高。</p>
  </div>;
}

export const Ch1Lab: React.FC<Props> = ({moduleId}) => {
  if(moduleId==='1.1') return <Timeline />;
  if(moduleId==='1.2') return <CaptionMatch />;
  if(moduleId==='1.3') return <Cost />;
  return null;
};

import { useState } from 'react';
import { C, Scene, clear, photo, frame, bar, text, Feedback, Source } from './shared-kit';

type Scenario = 'small' | 'video' | 'pretrain';
const scenarios: { id: Scenario; label: string }[] = [
  { id: 'small', label: '远处小目标' }, { id: 'video', label: '连续视频' }, { id: 'pretrain', label: '额外预训练' },
];
const explanations: Record<Scenario, string> = {
  small: 'RT-DETR-R50 的小目标 AP 为 34.8，低于 YOLOv8-L 的 35.3；R101 的 36.0 也低于 YOLOv7-X 的 36.9。这是作者明确讨论的局限，整体 AP 更高不代表每种尺度都领先。',
  video: 'RT-DETR 本文研究单帧检测，不提供跨帧身份或轨迹预测实验。图中的两帧框没有被赋予同一个身份。接入跟踪后需另测 HOTA、IDF1 等指标；这些只是后续实验建议，当前没有结果。',
  pretrain: 'Objects365 预训练后再在 COCO 微调，R50/R101 达到 55.3/56.2 AP；COCO 训练主表为 53.1/54.3 AP。两组训练数据不同，不能当作只换网络结构的公平消融。',
};

export function BoundaryLab() {
  const [scenario, setScenario] = useState<Scenario>('small');
  return <div onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }}>
    <div className="chip-row" role="group" aria-label="选择应用边界" style={{ flexWrap: 'wrap' }}>
      {scenarios.map(s => <button key={s.id} className="chip" type="button" aria-pressed={scenario === s.id}
        onClick={() => setScenario(s.id)} style={scenario === s.id ? { background: '#eaf3e6', borderColor: '#228d5c' } : undefined}>{s.label}</button>)}
    </div>
    <Scene height={240} label={scenario === 'video' ? '两张静态相邻帧有检测框，但中间身份关联仍然空白。' : '摄影场景与作者报告指标的边界比较；图像是教学示意。'}
      draw={ctx => {
        clear(ctx, 560, 240);
        if (scenario === 'small') {
          ctx.fillStyle = '#e2eadd'; ctx.fillRect(24,36,198,152); photo(ctx,117,92,48,34);
          frame(ctx,137,100,19,18,C.orange);
          const vals = [34.8,35.3,36.0,36.9];
          vals.forEach((v,i) => { text(ctx,String(i+1),270,56+i*43,C.ink); bar(ctx,295,40+i*43,220,23,C.line); bar(ctx,295,40+i*43,220*v/40,23,i%2===0?C.green:C.blue); });
          text(ctx,'小目标',77,216,C.ink);
        } else if (scenario === 'video') {
          photo(ctx,30,55,190,125); photo(ctx,336,55,190,125);
          frame(ctx,127,88,59,56,C.blue); frame(ctx,427,88,59,56,C.blue);
          ctx.save(); ctx.setLineDash([5,6]); ctx.beginPath(); ctx.moveTo(238,115); ctx.lineTo(318,115); ctx.strokeStyle=C.line; ctx.stroke(); ctx.restore();
          text(ctx,'?',273,107,C.orange); text(ctx,'身份未关联',238,207,C.ink);
        } else {
          photo(ctx,25,40,185,134);
          const vals=[53.1,54.3,55.3,56.2];
          vals.forEach((v,i)=>{text(ctx,String(i+1),263,53+i*43,C.ink);bar(ctx,288,37+i*43,240,23,C.line);bar(ctx,288,37+i*43,240*v/60,23,i<2?C.blue:C.purple);});
          text(ctx,'数据条件不同',46,210,C.ink);
        }
      }} />
    {scenario === 'small' && <div style={{ fontSize: 16 }}>
      <p>右图同一零基线，范围 0–40 APs。编号与以下数据一致：</p>
      <ol style={{ margin: '8px 0' }}><li>RT-DETR-R50：<strong>34.8</strong></li><li>YOLOv8-L：<strong>35.3</strong></li><li>RT-DETR-R101：<strong>36.0</strong></li><li>YOLOv7-X：<strong>36.9</strong></li></ol>
    </div>}
    {scenario === 'video' && <p style={{ fontSize: 16 }}>两张相片和边界框是教学示意，不是视频模型输出；虚线处代表尚需解决的关联问题。</p>}
    {scenario === 'pretrain' && <div style={{ fontSize: 16 }}>
      <p>右图范围 0–60 AP；蓝色为主表 COCO 训练，紫色为额外 Objects365 预训练：</p>
      <ol><li>主表 R50：<strong>53.1</strong></li><li>主表 R101：<strong>54.3</strong></li><li>额外预训练 R50：<strong>55.3</strong></li><li>额外预训练 R101：<strong>56.2</strong></li></ol>
    </div>}
    <Feedback>{explanations[scenario]}</Feedback>
    <Source page={8} label="原文 P8 · §6 局限；Table 2 小目标指标见 P7" />
    <p style={{ fontSize: 14 }}>{scenario === 'pretrain'
      ? <a href="https://openaccess.thecvf.com/content/CVPR2024/supplemental/Zhao_DETRs_Beat_YOLOs_CVPR_2024_supplemental.pdf#page=2" target="_blank" rel="noreferrer">补充材料 P2 · Table C：预训练与微调条件</a>
      : <a href="https://grokcv.site/sprouts/understanding/" target="_blank" rel="noreferrer">专题三：将实时检测视为动态场景系统的观测基础</a>}</p>
  </div>;
}

import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Choices, MetricsTable, Source } from '../components/Evidence';
const benchmarks={
 vgg:{
 title:'VGGSound-Test · VT2A · Table 1',
 headers:['模型','FDPANNs ↓','FDPaSST ↓','KLPANNs ↓','ISPANNs ↑','IB ↑','DeSync ↓','CLAP ↑','参数量'],
 rows:[
 ['Frieren','11.45','106.10','2.73','12.25','0.23','0.85','0.11','159M'],
 ['V2A-Mapper','8.40','84.57','2.69','12.47','0.23','1.23','0.11','229M'],
 ['HunyuanVideo-Foley','10.53','97.85','2.02','14.99','0.32','0.54','0.23','未报告'],
 ['MMAudio-L-44.1kHz','4.72','60.60','1.65','17.40','0.33','0.44','0.22','1.03B'],
 ['WavFlow-M-16kHz','6.37','62.64','1.68','17.24','0.30','0.47','0.21','624M'],
 ['WavFlow-L-16kHz','5.86','59.98','1.66','17.40','0.31','0.44','0.22','1.03B'],
 ['WavFlow-L-44.1kHz','5.25','55.82','1.73','15.05','0.31','0.46','0.19','1.03B'],
 ],
 source:'第 8 页，Table 1；15K 测试视频。WavFlow 的 16 kHz 主训练混合约 5M，44.1 kHz 在该检查点上以 200K VGGSound 微调（Table 6）。所有方法使用同一测试划分、原视频和原生稀疏标签；未与依赖 LLM 精炼测试描述的方法直接比较。Frieren、V2A-Mapper、MMAudio 数值引自 MMAudio 论文，Hunyuan 使用开源检查点复现。',
 note:'L-44.1kHz 的 FDPaSST 最好，但 MMAudio 的 FDPANNs、KL、IB 更好。L-16kHz 的 IS 与 DeSync 和 MMAudio 并列。升至 44.1kHz 并未改善所有指标。',
 },
 caps:{
 title:'AudioCaps-Test · T2A · Table 2',
 headers:['模型','参数量','FDPANNs ↓','FDVGG ↓','ISPANNs ↑','CLAP ↑'],
 rows:[
 ['AudioLDM 2-L','712M','32.50','5.11','8.54','0.21'],
 ['TANGO','866M','26.13','1.87','8.23','0.19'],
 ['TANGO 2','866M','19.77','2.74','8.45','0.26'],
 ['Make-An-Audio','453M','27.93','2.59','7.44','0.21'],
 ['Make-An-Audio 2','937M','15.34','1.27','9.58','0.25'],
 ['GenAU-Large','1.25B','16.51','1.21','11.75','0.29'],
 ['MMAudio-L-44.1kHz','1.03B','15.04','4.03','12.08','0.35'],
 ['WavFlow-M-16kHz','624M','10.63','1.58','12.62','0.24'],
 ],
 source:'第 8 页，Table 2；4.8K 样本，与 MMAudio 使用相同测试划分，基线成绩引自该论文。WavFlow 使用 §4.2 的 T2A 训练混合（1M Media + 300K 公开 T2A 增广数据）。',
 note:'WavFlow 的 FDPANNs 与 IS 最好，FDVGG 最优为 GenAU，CLAP 最优为 MMAudio。Appendix A 明确 T2A 模型按自己的数据混合单独训练；置空视觉路径不意味着任意 VT2A 检查点都能复现此成绩。',
 },
 movie:{
 title:'MovieGen-Audio-Bench · Table 11',
 headers:['模型','参数量','训练数据','IS ↑','CLAP ↑','IB ↑','DeSync ↓'],
 rows:[
 ['WavFlow','1.03B','约 11.1K 小时','8.95','0.28','0.24','0.77'],
 ['MMAudio','1.03B','约 8.2K 小时','8.40','0.28','0.27','0.77'],
 ['MovieGen','13B','约 1,000K 小时','8.89','0.29','0.36','1.00'],
 ],
 source:'第 20 页，Appendix G、Table 11。AI 生成视频没有真实参考音频，使用无参考指标。第 21–22 页 Figure 8–10 是个别场景的定性分析。',
 note:'8.95 是 Inception Score，不是十分制人工音质分。WavFlow 的 IS 最高、DeSync 与 MMAudio 并列；IB 低于两个对照模型。个别空挥拳和马蹄案例不能代表所有视频完全同步。',
 },
};
export const Ch10ResultsBenchmark: React.FC<WidgetProps> = () => {
 const [bench,setBench]=useState<keyof typeof benchmarks>('vgg');
 const b=benchmarks[bench];
 return <div className="widget-container">
 <Choices label="评测基准" value={bench} onChange={setBench} options={[
 {value:'vgg',label:'VGGSound'},{value:'caps',label:'AudioCaps'},{value:'movie',label:'MovieGen-Audio-Bench'}]}/>
 <MetricsTable caption={b.title} headers={b.headers} rows={b.rows}/>
 <div className="widget-feedback good" aria-live="polite">{b.note}</div>
 <Source>{b.source}</Source>
 </div>;
};
export default Ch10ResultsBenchmark;

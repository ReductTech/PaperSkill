import { Bars, Sponge } from './palm-kit';

const tasks = [
  { name: '把离指定角最近的块推向同色块', single: 20, mixture: 70 },
  { name: '把物体按颜色分到角落', single: 2.5, mixture: 31.3 },
  { name: '只聚拢桌面一侧的物体', single: 11.3, mixture: 57.5 },
];

export function PalmTable() {
  return <div className="pk-body pk-stack pk-table">
    <div className="pk-table-lead"><Sponge /><h2>每任务 10 次示范 · 仿真规划成功率</h2></div>
    <div className="pk-table-grid">{tasks.map(task => <div key={task.name} className="pk-card pk-stack">
      <h2>{task.name}</h2>
      <Bars items={[
        { label: '单机器人', value: task.single, tone: 'blue' },
        { label: '全混合', value: task.mixture, tone: 'green' },
      ]} />
    </div>)}</div>
    <p className="pk-strip">两组均为 PaLM-E-12B 且按任务微调。单机器人组从头训练，全混合组使用 PaLM 与 ViT 预训练。</p>
  </div>;
}

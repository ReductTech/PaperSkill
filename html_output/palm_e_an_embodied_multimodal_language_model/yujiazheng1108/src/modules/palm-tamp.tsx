import { Bars, Sponge } from './palm-kit';

export function PalmTamp() {
  return <div className="pk-body pk-split pk-evidence">
    <div className="pk-card pk-stack">
      <h2>规划成功率（越高越好）</h2>
      <Bars items={[
        { label: '微调 · 全混合', value: 94.9, tone: 'green' },
        { label: '微调 · 单机器人', value: 48.6, tone: 'blue' },
        { label: '单机器人 · 无预训练', value: 42.9, tone: 'red' },
        { label: '冻结 · 全混合', value: 74.3, tone: 'green' },
        { label: '冻结 · 单机器人', value: 31.8, tone: 'blue' },
      ]} />
    </div>
    <div className="pk-card pk-stack pk-note">
      <Sponge />
      <h2>同一少样本条件</h2>
      <p>PaLM-E-12B，场景中有 3–5 个对象。两项任务各使用 320 个训练样本，图中取平均成功率。</p>
      <p>独立的表示比较中，OSRT 在两项规划上分别为 <strong>82.5%</strong> 和 <strong>76.2%</strong>（表 1）。</p>
    </div>
  </div>;
}

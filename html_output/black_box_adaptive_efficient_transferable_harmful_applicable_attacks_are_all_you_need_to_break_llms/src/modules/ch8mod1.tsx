import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Topic = 'models' | 'data' | 'attacks' | 'metrics' | 'judge';

const TOPICS: Record<Topic, { title: string; body: string; fb: string }> = {
  models: {
    title: '模型与防御',
    body: '指令微调族：LLaMA3-8B-Instruct 与 Qwen2.5-Instruct（7B–32B）。LLaMA3 另加三种防御适配器：Circuit Breakers (CB)、Latent Adversarial Training (LAT)、Continuous Adversarial Training (CAT)。为贴近真实部署，再用 PolyGuard 包装 CB 与 Qwen2.5-7B：检测器检查提示和响应，并用固定拒答串覆盖有害输出（记为 CB+D、Qwen-7B+D）。',
    fb: 'IHO 对这些分层流水线不做防御特定适配，仍然只走黑盒采样。',
  },
  data: {
    title: '数据划分',
    body: 'JailbreakBench 的 100 个恶意行为，按类别分层划分为 60 条训练 / 40 条留出测试。测试行为未用于训练或超参选择。精确划分见附录 H。',
    fb: '表 1 左列是 60 条训练行为上的自适应攻击；右列是同一检查点在 40 条未见行为上的迁移。',
  },
  attacks: {
    title: '攻击基线',
    body: 'GCG+：梯度白盒参考。AmpleGCG+：迁移训练后缀攻击器。BON：仅采样启发式。PAIR：LLM 攻击器（默认低预算，以及预算对齐的 PAIR+）。JR1+：概念上最接近的微调攻击器。INPAINTING：未训练的扩散填补起点。除 PAIR 外，每行为共享 1024 次目标生成预算；样本调整变体以 + 标记。',
    fb: 'IHO 对每个目标跨全部训练行为只训一个检查点，而不是每个行为一个，以降低成本。',
  },
  metrics: {
    title: '指标',
    body: '主指标为 StrongReject 下的 EVUS（对阈值 τ 与每行为样本数 n 积分）。主结果通常 m_b = 1024。ASR(·, 0.5) 与 ASR(·, 0.8) 放在附录 G。表中 — 表示该攻击在此设定不适用（如白盒 GCG 无法直接打带检测器的流水线）。',
    fb: 'EVUS 使用各攻击自己的查询预算（N 因攻击而异），读表时不要把不同攻击当成同一查询成本。',
  },
  judge: {
    title: '评判器',
    body: '全文主评判器为 StrongReject。作者报告 IHO 未对优化用评判器发生明显奖励黑客；附录 E 另用 Llama-2-13B HarmBench 评判器复核。算力与超参见附录 H。',
    fb: '结论仍依赖评判器质量：附录 F.2 未观察到明显黑客，但评判偏差可以塑造攻击器所学内容。',
  },
};

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [topic, setTopic] = useState<Topic>('models');
  const cur = TOPICS[topic];

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        {(Object.keys(TOPICS) as Topic[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip${topic === id ? ' selected' : ''}`}
            onClick={() => setTopic(id)}
          >
            {TOPICS[id].title}
          </button>
        ))}
      </div>
      <div className="opt-card mid" style={{ marginTop: 12 }}>
        <div className="opt-kicker">§4 Experiment Setup · {cur.title}</div>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65 }}>{cur.body}</p>
      </div>
      <div className="feedback">{cur.fb}</div>
    </div>
  );
};

export default Ch8Mod1;

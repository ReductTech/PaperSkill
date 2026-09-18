import React, { useEffect, useRef, useState } from 'react';

// 「一张图理解全文」总览：Hero 之后的 7 节点论文主线（可点击查看一句解释）。
// 节点内容全部来自论文（§1、§3、§4、§5、Appendix U），不引入论文未述结构。

interface PipeStep {
  num: string;
  title: string;
  sub: string;
  explain: string;
}

const STEPS: PipeStep[] = [
  {
    num: '01',
    title: '地球观测挑战',
    sub: '昂贵的数据准备 · 稀缺的标签 · 云与不规则重访',
    explain:
      '遥感数据需要辐射校正、云处理与跨传感器对齐，标签又稀少；现有嵌入产品规格固定，用户无法按自己的存储与算力预算取舍。',
  },
  {
    num: '02',
    title: '下游驱动的缩放研究',
    sub: '395 次受控训练 × 15 个下游任务',
    explain:
      '预训练损失几乎不能预测下游表现（r = −0.18）；研究改以下游得分为目标，拟合出「编码器与数据同步增长、投影器固定」的分配法则。',
  },
  {
    num: '03',
    title: '2B 教师模型',
    sub: '编码器 N*∝C^0.36 · 数据 D*∝C^0.63 · 投影器固定',
    explain:
      '按法则训练 0.5/1/2B 教师并验证可外推（2B 复合得分 0.608）；但一次全球年度推理约 100 GPU·年，教师不适合直接部署。',
  },
  {
    num: '04',
    title: '知识蒸馏',
    sub: '冻结教师作为固定目标',
    explain:
      '每个前缀头把学生前缀重建为完整的教师嵌入（L_DIST）；蒸馏不仅压缩规模，还提供自监督目标无法确定的坐标顺序。',
  },
  {
    num: '05',
    title: '学生族 N/S/M/L',
    sub: '部署编码器 1.1 / 7.1 / 21.0 / 43.8M',
    explain:
      '一次蒸馏得到四种尺寸；服务成本比 2B 教师低约两个数量级（学生 S/M/L 约 0.3/0.9/2 GPU·年，教师约 100 GPU·年）。',
  },
  {
    num: '06',
    title: 'Matryoshka 嵌入',
    sub: '16 / 32 / 64 / 128 维前缀',
    explain:
      '同一个嵌入可按前缀截断使用：16 维保留约 92.1% 的下游任务性能、只用 1/8 存储，且无需重新训练。',
  },
  {
    num: '07',
    title: '自适应地球嵌入产品',
    sub: '尺寸 × 维度两个预算旋钮',
    explain:
      '用户按预算自选模型尺寸与嵌入维度；作者计划以 CC0 发布 2017–2025 全球 10m 年度嵌入与检查点。',
  },
];

export const PipelineOverview: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      id="pipeline"
      className={`pipe-section${shown ? ' in' : ''}`}
      aria-label="论文主线总览"
    >
      <div className="pipe-head">
        <h2 className="pipe-title">一张图理解全文</h2>
        <p className="pipe-sub">
          从地球观测的痛点，到可自选规格的嵌入产品——点击任一节点查看一句话解释。
        </p>
      </div>
      <ol className="pipe-chain">
        {STEPS.map((step, i) => (
          <li key={step.num} className="pipe-item" style={{ transitionDelay: `${i * 70}ms` }}>
            <div className="pipe-rail" aria-hidden="true">
              <span className="pipe-dot">{step.num}</span>
              {i < STEPS.length - 1 ? <span className="pipe-line" /> : null}
            </div>
            <div className="pipe-body">
              <button
                type="button"
                className={`pipe-node${open === i ? ' open' : ''}`}
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className="pipe-node-title">{step.title}</span>
                <span className="pipe-node-sub">{step.sub}</span>
              </button>
              {open === i ? <div className="pipe-explain">{step.explain}</div> : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="pipe-note">
        数据来源：TESSERA v2 论文（arXiv:2607.03949v2）；各数值的适用范围见正文第 4 章与第 10 章。
      </p>
    </section>
  );
};

export default PipelineOverview;

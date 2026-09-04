import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const stages = [
  {
    label: 'Humans-300M',
    title: '先把预训练数据对准“人”',
    summary: '作者从约 10 亿张自然场景候选图像出发，清除水印、文字、艺术化与异常内容，再用人体检测器筛出高质量人体图像，最终构建 Humans-300M。',
    source: '论文 §3.1 与 Figure 2',
    facts: [
      ['候选图像', '约 10 亿', '自然场景中的人体图像候选池'],
      ['检测阈值', '> 0.9', '仅保留高置信度人体检测结果'],
      ['人体框尺寸', '> 300 px', '避免人物过小、细节不足'],
      ['多人图像', '> 2.48 亿', '训练中覆盖复杂的多人场景'],
    ],
  },
  {
    label: '1024 分辨率 MAE',
    title: '用高分辨率遮挡重建学习人体细节',
    summary: '输入被切成 16×16 patch，随机遮挡大部分区域；编码器只处理可见 patch，解码器尝试还原完整人体。MAE 的单次前向结构让相同算力可以处理更多图像。',
    source: '论文 §3.2、Figure 3 与 §4.1',
    facts: [
      ['原生输入', '1024×1024', '预训练直接面向 1K 高保真图像'],
      ['Patch 大小', '16×16', '每个 token 仅覆盖约 0.02% 图像面积'],
      ['训练遮挡率', '75%', '只让编码器看到四分之一的 patch'],
      ['训练规模', '1.2T tokens', '所有模型采用统一的大规模预训练预算'],
    ],
  },
  {
    label: '0.3B–2B ViT',
    title: '同一方案扩展为四档高容量 ViT',
    summary: 'Sapiens 主要通过增加宽度而非一味加深网络来扩展模型。参数越大，隐藏维度与注意力头数同步提高，论文中的多项任务性能也随规模稳定上升。',
    source: '论文 Table 2 与 §4.1',
    facts: [
      ['规模范围', '0.336B → 2.163B', '从 3 亿级扩展到 20 亿级参数'],
      ['最大隐藏维度', '1920', 'Sapiens-2B 的 token 表示宽度'],
      ['最大层数', '48', '最大模型的 Transformer 深度'],
      ['最大计算量', '8.709 TFLOPs', '1024 分辨率带来高额但精细的计算'],
    ],
  },
  {
    label: '人体下游任务',
    title: '统一编码器，接入四种轻量任务头',
    summary: '微调时复用预训练编码器，随机初始化轻量任务解码器，并端到端训练。高质量实拍标注负责 Pose/Seg，合成人体数据负责 Depth/Normal。',
    source: '论文 §3.3–§3.6 与 Figure 4–5',
    facts: [
      ['Pose', '308 点', '100 万张 4K 室内采集图像'],
      ['Segmentation', '28 类', '10 万张 4K 精细部位标注'],
      ['Depth', '50 万张', '由高分辨率人体扫描合成深度图'],
      ['Normal', '3 通道', '预测每个像素法线的 xyz 分量'],
    ],
  },
] as const;

const dataRows = [
  ['General-100M', '35.7', '50.1', '0.351', '27.5°'],
  ['Humans-100M', '43.6', '61.2', '0.316', '24.0°'],
  ['Humans-300M', '47.0', '66.5', '0.288', '21.8°'],
];

const modelRows = [
  ['Sapiens-0.3B', '0.336B', '1.242T', '1024', '24', '16'],
  ['Sapiens-0.6B', '0.664B', '2.583T', '1280', '32', '16'],
  ['Sapiens-1B', '1.169B', '4.647T', '1536', '40', '24'],
  ['Sapiens-2B', '2.163B', '8.709T', '1920', '48', '32'],
];

export const V1Pipeline: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % stages.length), 900);
    return () => window.clearInterval(id);
  }, [locked]);

  const selectStage = (index: number) => {
    setActive(index);
    setLocked(true);
  };

  const detail = stages[active];

  return (
    <div className="v1-panel">
      <div className="pipeline-row">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.label}>
            <button className={active === index ? 'active' : ''} aria-pressed={active === index} onClick={() => selectStage(index)}>
              <small>0{index + 1}</small>
              {stage.label}
            </button>
            {index < stages.length - 1 ? <span aria-hidden="true">→</span> : null}
          </React.Fragment>
        ))}
      </div>

      <section className={`pipeline-detail stage-${active + 1}`} aria-live="polite">
        <header>
          <div>
            <span>所选环节 · 0{active + 1}</span>
            <h3>{detail.title}</h3>
          </div>
          <b>{locked ? '已停留' : '自动演示中'}</b>
        </header>
        <p className="pipeline-summary">{detail.summary}</p>
        <div className="pipeline-facts">
          {detail.facts.map(([label, value, explanation]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{explanation}</p>
            </article>
          ))}
        </div>

        {active === 0 ? (
          <div className="pipeline-evidence">
            <h4>同等 100M 数据量下，人体域预训练全面领先</h4>
            <table className="compact-results">
              <thead><tr><th>预训练数据</th><th>Pose ↑</th><th>Seg ↑</th><th>Depth ↓</th><th>Normal ↓</th></tr></thead>
              <tbody>{dataRows.map((row) => <tr className={row[0] === 'Humans-100M' ? 'domain-proof' : ''} key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : null}

        {active === 2 ? (
          <div className="pipeline-evidence">
            <h4>四档编码器规格</h4>
            <table className="compact-results model-specs">
              <thead><tr><th>模型</th><th>参数</th><th>FLOPs</th><th>隐藏维度</th><th>层数</th><th>头数</th></tr></thead>
              <tbody>{modelRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : null}

        {active === 3 ? <p className="pipeline-dataset-note"><strong>Depth + Normal 合成监督：</strong>使用 600 个高分辨率人体扫描、100 张 HDRI 环境图，渲染 50 万张 4K 训练图像。</p> : null}

        <footer>{detail.source} · 点击其他流程框可切换并停留</footer>
      </section>
    </div>
  );
};

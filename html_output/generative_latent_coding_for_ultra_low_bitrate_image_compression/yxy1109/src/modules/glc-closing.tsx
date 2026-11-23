import React, { useState } from 'react';
import { CodeChip, StageBadge, StudioPanel } from './glc-kit';

type Plan = 'ood' | 'entropy' | 'human';

const plans: Record<Plan, {
  title: string;
  hypothesis: string;
  baseline: string;
  metric: string;
  pass: string;
  risk: string;
}> = {
  ood: {
    title: '屏幕与未知域 OOD',
    hypothesis: '在自然图像上固定训练集与码率网格后，加入屏幕/文本增强能改善结构保真，而不显著牺牲 FID。',
    baseline: 'CLIC2020 自然图像训练分布；原 GLC 权重。',
    metric: 'DISTS、OCR 字符错误率、直线交点误差、人工结构保真评分。',
    pass: '结构指标显著改善，FID 退化有预设上限；留出设备/屏幕子集不参与调参。',
    risk: '如果 OCR 变好但人眼纹理明显变差，需报告权衡，而不是只宣布成功。'
  },
  entropy: {
    title: '分类超索引熵编码',
    hypothesis: '把 ẑ 的固定长度 log₂M_h 索引改为学习上下文算术编码，可降低超信息 bpp。',
    baseline: '论文固定长度超索引编码；相同模型、相同 FID 工作点。',
    metric: '总 bpp、超信息占比、重训后的 FID–BPP BD-Rate。',
    pass: '在同 FID 或同 DISTS 条件下 bpp 一致下降，且编解码复杂度增量可接受。',
    risk: '若超信息很少，节省可能被上下文模型开销抵消；不能只报理论熵。'
  },
  human: {
    title: '语义保真的人眼研究',
    hypothesis: '在同一 FID 附近，GLC 的主体/属性保持率高于像素空间生成压缩。',
    baseline: 'MS-ILLM；匹配 FID 或匹配 bpp 两种协议分别报告。',
    metric: '成对强制选择：内容保持、纹理真实、整体偏好；附注错误定位。',
    pass: '预注册样本量与置信区间显示稳定优势，同时报告反例和失败类别。',
    risk: '受试者偏好不等于客观保真；文字、人脸身份和屏幕内容应分层分析。'
  }
};

export function GlcClosing() {
  const [plan, setPlan] = useState<Plan>('ood');
  const selected = plans[plan];
  return <div className="glc-scene glc-closing-page">
    <div className="glc-plan-head">
      <StageBadge tone="orange">后续可证伪实验</StageBadge>
      <p>选择一条路线：把“继续改进”写成能被数据推翻的实验，而不是愿望。</p>
    </div>
    <div className="glc-plan-cards" role="group" aria-label="选择后续实验方向">
      {(Object.keys(plans) as Plan[]).map((item, index) => <button key={item} className={plan === item ? 'is-active' : ''}
        onClick={() => setPlan(item)} aria-pressed={plan === item}>
        <span>实验 {index + 1}</span>
        <strong>{plans[item].title}</strong>
        <i aria-hidden="true">{item === 'ood' ? '▦' : item === 'entropy' ? '⌁' : '◉'}</i>
      </button>)}
    </div>
    <StudioPanel className={`glc-protocol-board is-${plan}`} tone={plan === 'ood' ? 'red' : plan === 'entropy' ? 'purple' : 'green'}>
      <div className="glc-protocol-hypothesis">
        <span className="glc-section-label">假设</span>
        <h3>{selected.hypothesis}</h3>
        <p>{selected.risk}</p>
      </div>
      <div className="glc-protocol-grid">
        <div><span>对照基线</span><b>{selected.baseline}</b></div>
        <div><span>主指标</span><b>{selected.metric}</b></div>
        <div><span>预先判定</span><b>{selected.pass}</b></div>
        <div className="is-warning"><span>解释边界</span><b>任一主指标不同向改善，都不能只挑有利结果。</b></div>
      </div>
    </StudioPanel>
    <div className="glc-closing-line">
      <span>学习结论</span>
      <b>GLC 的关键不是“生成得像”，而是把传输对象换成语义潜码，并在率、感知与结构保真之间做可检验的取舍。</b>
      <CodeChip tone="orange">后续假设不是论文结论</CodeChip>
    </div>
  </div>;
}

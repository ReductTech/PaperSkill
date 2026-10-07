import React, { useState } from 'react';

const records = {
  person: {
    input: '新图中检测到的人脸', extractor: '预训练人脸网络', representation: '与已存参考人脸特征匹配',
    threshold: '距离阈值 0.675', setup: '从 1–4 张参考图提取并保存目标特征，不为每个人重训人脸网络。',
    output: '根据匹配判定身份是否出现', feedback: '人物分支保存的是身份匹配记录。0.675 是论文所写的距离阈值，不把它当作余弦相似度阈值。',
  },
  object: {
    input: '新图像', extractor: '外部冻结 DFN5B CLIP ViT-H/14', representation: '[CLS] 特征 → 独立线性分类器',
    threshold: '分类阈值 0.5', setup: '4 张目标正例 + 150 张同类别负例；交叉熵训练线性层 500 步，外部 CLIP 冻结。',
    output: '根据分类分数判定概念是否出现', feedback: '物品 / 宠物分支训练每概念的线性层，利用同类负例区分实例。它与原 VLM 内部的视觉编码器是不同路径。',
  },
};

export function HeadInspector() {
  const [kind, setKind] = useState<'person' | 'object'>('object');
  const record = records[kind];
  return (
    <div className="mv-widget" data-testid="head-inspector">
      <div className="mv-controls" role="group" aria-label="概念识别方式">
        <button className={'mv-button ' + (kind === 'person' ? 'mv-selected' : '')} aria-pressed={kind === 'person'} onClick={() => setKind('person')}>人物</button>
        <button className={'mv-button ' + (kind === 'object' ? 'mv-selected' : '')} aria-pressed={kind === 'object'} onClick={() => setKind('object')}>物品 / 宠物</button>
      </div>
      <div className="mv-inspector-map" aria-label="当前概念的外部识别路径">
        <div className="mv-node"><small>输入与特征提取</small><b>{record.input}</b><span>{record.extractor}</span></div>
        <span className="mv-arrow">→</span>
        <div className="mv-node mv-active-node"><small>实例判别</small><b>{record.representation}</b><span>{record.threshold}</span></div>
        <span className="mv-arrow">→</span>
        <div className="mv-node"><small>输出与用途</small><b>出现 / 未出现</b><span>{record.output}，用于决定是否追加 embedding。</span></div>
      </div>
      <div className="mv-detail" aria-live="polite"><h5>这个概念如何建立识别端？</h5><p>{record.setup}</p><p>每个身份 / 概念独立登记；新图的特征提取可以共享。head 不生成 embedding，也不生成文本答案。</p></div>
      <div className="mv-feedback" role="status">{record.feedback}</div>
      <p className="mv-source"><a href="https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf#page=2" target="_blank" rel="noreferrer">S §2.2，p.2</a> · 结构教学示意，未运行分类器，也未构造预测分数。输入类型、保存信息和训练参数随选择同步变化。</p>
    </div>
  );
}

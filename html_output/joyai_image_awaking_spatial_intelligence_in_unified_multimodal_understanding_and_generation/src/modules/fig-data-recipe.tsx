import React, { useState } from 'react';

type Focus = 'main' | 'spatial';

export function FigDataRecipe() {
  const [focus, setFocus] = useState<Focus>('main');
  return (
    <div className="data-recipe-explorer">
      <div className="data-recipe-tabs" role="tablist" aria-label="切换 Figure 7 数据分布视图">
        <button className={focus === 'main' ? 'active' : ''} onClick={() => setFocus('main')}>
          总训练语料 · 11.3M
        </button>
        <button className={focus === 'spatial' ? 'active' : ''} onClick={() => setFocus('spatial')}>
          展开 OpenSpatial · 3.0M
        </button>
      </div>

      <div className={`data-recipe-figure focus-${focus}`}>
        <img src="/images/fig-data-recipe.png" alt="论文 Figure 7：空间理解训练数据分布" />
        <div className="data-recipe-shade" aria-hidden="true" />
      </div>

      {focus === 'main' ? (
        <div className="data-recipe-facts">
          <div className="general"><b>54.25%</b><strong>General Understanding · 6.1M</strong><span>保留文档、数学、OCR、语言与通用问答能力</span></div>
          <div className="spatial"><b>29.65%</b><strong>Spatial Understanding · 约 3.35M</strong><span>其中 OpenSpatial 为 3M，是主要的空间专项监督</span></div>
          <div className="other"><b>16.10%</b><strong>Prompt Enhancement + Others</strong><span>补充指令密度、长尾任务与分布多样性</span></div>
        </div>
      ) : (
        <div className="data-recipe-facts spatial-detail">
          <div><b>25.12%</b><strong>Multi-task · 832.0K</strong><span>同一样本联合多类空间判断</span></div>
          <div><b>18.58%</b><strong>Distance · 615.3K</strong><span>训练距离与尺度相关推理</span></div>
          <div><b>13.01%</b><strong>Size · 430.9K</strong><span>覆盖单视角与多视角尺寸估计</span></div>
        </div>
      )}

      <div className="feedback good">
        {focus === 'main'
          ? '空间专项数据负责注入新能力；占比最大的通用数据负责守住原有 MLLM 能力。训练使用按数据集设定的采样比例，而不是简单均匀混合。'
          : 'OpenSpatial 不是单一问答集合，而是由距离、尺寸、位置、深度、相机和多任务监督共同组成的空间训练套件。'}
      </div>
    </div>
  );
}

export default FigDataRecipe;

import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Layer = 'data' | 'training' | 'results';

const layers = [
  { key: 'data' as const, index: '01', en: 'DATA', zh: '先决定模型能学到什么', color: '#33ccff' },
  { key: 'training' as const, index: '02', en: 'TRAINING', zh: '再决定能力如何逐层收紧', color: '#ffcc00' },
  { key: 'results' as const, index: '03', en: 'RESULTS', zh: '最后逐项核对能力是否成立', color: '#ff3366' }
];

const dataCards = [
  { tag: '质量底座', title: '分阶段过滤与重平衡', value: '208p → 512p → 1024p', text: '分辨率越高，筛选越严格；尾部概念保留，头部概念降采样，避免网络数据的长尾偏斜。' },
  { tag: '语义密度', title: '四级双语 Caption', value: 'Short / Long / Extended / JSON', text: '同一图像获得不同粒度的中英文描述，兼顾真实短提示、细节学习和结构化控制。' },
  { tag: '文字能力', title: 'OCR-aware Captioning', value: '识别 → 融合 → 后过滤', text: '显式保留画面文字、原语言和准确拼写，专门抑制漏字、幻觉文字与错误翻译。' },
  { tag: '空间能力', title: '多视角生成语料', value: '约 1M', text: 'Blender 渲染主视角与辅助视角，并附带旋转逻辑、视角细节和拼图布局监督。' }
];

const trainingCards = [
  { stage: 'PRE-TRAIN', title: '建立基础生成分布', value: '208p → 512p → 1024p', text: '用 Flow Matching 学习文本条件下的基础生成；到 1024p 阶段才加入多视角数据。' },
  { stage: 'CONTINUE', title: '缩窄到高保真区域', value: '严格过滤 + 重加权', text: '减少低质和高方差模式，提升美学、构图一致性与语义准确性。' },
  { stage: 'SFT', title: '补强专项能力', value: '数千条人工精标', text: '定向训练复杂双语文字、密集排版与跨视角主体一致性。' },
  { stage: 'RL', title: '对齐最终偏好', value: 'Flow-GRPO', text: '同时使用美学奖励和文本—图像对齐奖励；不是用单一审美分数替代提示遵循。' }
];

const resultCards = [
  { dataset: 'LongText-Bench', result: 'EN 0.963 · ZH 0.963', verdict: '双语长文本均为表中最高。' },
  { dataset: 'CVTG-2K', result: 'Word Acc. 0.8739', verdict: '字符级准确率最高；NED 0.9369 具有竞争力但并非最高。' },
  { dataset: 'OneIG', result: 'EN 0.542 · ZH 0.521', verdict: '英文排名第二，中文不是最优，因此只能称“有竞争力”。' },
  { dataset: 'DPG', result: 'Overall 88.05', verdict: '通用生成表现强，但略低于 Qwen-Image 的 88.32。' },
  { dataset: 'T2I-CoReBench', result: 'Composition 94.2 · Overall 68.7', verdict: '构图均值第一；Reasoning 55.9 低于 GPT Image 1 High 的 69.0。' }
];

export const SecGenerationRoadmap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<Layer>('data');
  const current = layers.find((item) => item.key === active)!;
  return (
    <div className="generation-roadmap">
      <div className="gen-route" aria-label="生成章节路线">
        {layers.map((item, index) => (
          <React.Fragment key={item.key}>
            <button className={active === item.key ? 'active' : ''} style={{ '--route-color': item.color } as React.CSSProperties} onClick={() => setActive(item.key)}>
              <b>{item.index}</b><span>{item.en}</span><small>{item.zh}</small>
            </button>
            {index < layers.length - 1 ? <i aria-hidden="true">→</i> : null}
          </React.Fragment>
        ))}
      </div>

      <div className="gen-layer-head" style={{ '--route-color': current.color } as React.CSSProperties}>
        <span>{current.index}</span><div><b>{current.en}</b><p>{current.zh}</p></div>
      </div>

      {active === 'data' ? (
        <div className="gen-card-grid data-grid">
          {dataCards.map((item) => <article key={item.title}><em>{item.tag}</em><h4>{item.title}</h4><strong>{item.value}</strong><p>{item.text}</p></article>)}
        </div>
      ) : null}
      {active === 'training' ? (
        <div className="gen-training-list">
          {trainingCards.map((item, index) => <article className={index === 0 || index === 3 ? 'with-formula' : ''} key={item.stage}>
            <span>{index + 1}</span>
            <div><em>{item.stage}</em><h4>{item.title}</h4><strong>{item.value}</strong><p>{item.text}</p></div>
            {index === 0 ? (
              <aside className="gen-pretrain-formula" aria-label="Flow Matching 预训练目标">
                <small>FLOW MATCHING OBJECTIVE</small>
                <b>z<sub>t</sub> = tz<sub>1</sub> + (1−t)z<sub>0</sub></b>
                <span>L = E<sub>t,z₀,z₁,y</sub>[‖v<sub>θ</sub>(z<sub>t</sub>, y, t) − (z<sub>1</sub>−z<sub>0</sub>)‖²]</span>
                <p>学习噪声 z<sub>0</sub> 到图像潜变量 z<sub>1</sub> 的速度。</p>
              </aside>
            ) : null}
            {index === 3 ? (
              <aside className="gen-pretrain-formula gen-rl-formula full-training-formula" aria-label="Flow-GRPO 强化学习目标">
                <small>FLOW-GRPO · EQ. (2–3)</small>
                <div className="paper-equation">
                  <b>Â<sub>t</sub><sup>i</sup> = </b>
                  <span className="equation-fraction"><span>R(x<sub>0</sub><sup>i</sup>,c) − mean(&#123;R(x<sub>0</sub><sup>i</sup>,c)&#125;<sub>i=1</sub><sup>G</sup>)</span><span>std(&#123;R(x<sub>0</sub><sup>i</sup>,c)&#125;<sub>i=1</sub><sup>G</sup>)</span></span>
                  <em>(2)</em>
                </div>
                <div className="paper-equation equation-objective">
                  <b>J<sub>Flow-GRPO</sub>(θ) = E<sub>c∼C, &#123;xⁱ&#125;ᵢ₌₁ᴳ∼π<sub>θ_old</sub>(·|c)</sub></b>
                  <span>[ <span className="equation-fraction compact"><span>1</span><span>G</span></span> Σ<sub>i=1</sub><sup>G</sup> <span className="equation-fraction compact"><span>1</span><span>T</span></span> Σ<sub>t=0</sub><sup>T−1</sup> min(r<sub>t</sub><sup>i</sup>(θ)Â<sub>t</sub><sup>i</sup>, clip(r<sub>t</sub><sup>i</sup>(θ),1−ε,1+ε)Â<sub>t</sub><sup>i</sup>) − βD<sub>KL</sub>(π<sub>θ</sub> ‖ π<sub>ref</sub>) ]</span>
                  <em>(3)</em>
                </div>
                <p>同一 prompt 的 G 张图先按奖励做组内相对排序；裁剪概率比并加入 KL，限制策略偏离参考模型。</p>
              </aside>
            ) : null}
          </article>)}
        </div>
      ) : null}
      {active === 'results' ? (
        <div className="gen-result-list">
          {resultCards.map((item) => <article key={item.dataset}><h4>{item.dataset}</h4><strong>{item.result}</strong><p>{item.verdict}</p></article>)}
          <div className="gen-result-hint">右侧数据浏览器可展开完整模型与各项指标；这里先保留论文真正支持的结论边界。</div>
        </div>
      ) : null}

      <div className="feedback good">
        {active === 'data' ? '判断：生成能力的起点是“数据中是否存在对应监督”，而不只是模型规模。' : active === 'training' ? '判断：四阶段各自解决不同问题，Flow Matching 只是基础目标，不等于完整训练方案。' : '判断：Results 必须回扣 Data 与 Training 的专项设计，同时保留没有领先的指标。'}
      </div>
    </div>
  );
};

export default SecGenerationRoadmap;

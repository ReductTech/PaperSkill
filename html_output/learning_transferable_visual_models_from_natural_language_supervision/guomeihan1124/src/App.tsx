import React,{useState}from'react';
import { FixedLabelWall, DualEncoder, SimilaritySpace, PairingMatrix, BidirectionalLoss, TemperatureLab, PromptClassifier, PromptEnsemble, EvidenceScene, LimitsScene } from './modules/ClipScenes';
import './styles/presentation.css';

const chapters = [
  ['均匀类别监督：为什么不够？', '先看固定类别分类器遗漏了什么。', FixedLabelWall],
  ['图像与文字如何相遇？', '两条编码路径在同一个嵌入空间比较；两栏从输入到向量逐行对齐。', DualEncoder],
  ['从相似度到重要性', '改变文本描述，观察它与同一张图的余弦相似度如何变化。', SimilaritySpace],
  ['把图文拉近：N×N 配对', '一个 batch 内，每张图都会和每段文字比较一次。', PairingMatrix],
  ['双向交叉熵：两边同时学习', '分别从“图找文”和“文找图”两个方向计算训练信号。', BidirectionalLoss],
  ['温度参数：放大正确选择', '只调节温度 τ，观察 Softmax 概率如何改变。', TemperatureLab],
  ['文字怎样生成分类器？', '将候选类别写成文本，便可进行零样本分类。', PromptClassifier],
  ['Prompt 集成：多种说法', '合并多条描述来降低单一措辞的偶然影响。', PromptEnsemble],
  ['实验结果要看什么条件？', '阅读零样本迁移结论时，同时核对它的比较条件。', EvidenceScene],
  ['最终检视：能力与局限', '把 CLIP 的能力与需要谨慎的边界放在一起。', LimitsScene],
] as const;

export default function App() {
  const [index, setIndex] = useState(0);
  const [title, intro, Scene] = chapters[index];
  const go = (next: number) => { setIndex(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className="chapter-app">
    <aside className="chapter-side" aria-label="章节目录">
      <p>INTERACTIVE TUTORIAL</p><h1>CLIP：从自然语言监督学习可迁移视觉模型 · 交互式教程</h1>
      <nav>{chapters.map(([name], n) => <button className={n === index ? 'active' : ''} onClick={() => go(n)} key={name}><b>§{n + 1}</b><span>{name}</span></button>)}</nav>
    </aside>
    <main className="chapter-content"><header><span>§{index + 1}</span><div><p>CLIP 交互式论文导读</p><h2>{title}</h2></div></header><p className="chapter-intro">{intro}</p><div className="chapter-live"><Scene /></div></main>
    <footer className="chapter-pager"><button disabled={!index} onClick={() => go(index - 1)}>← 上一章</button><strong>{index + 1} / {chapters.length}</strong><button disabled={index === chapters.length - 1} onClick={() => go(index + 1)}>下一章 →</button></footer>
  </div>;
}

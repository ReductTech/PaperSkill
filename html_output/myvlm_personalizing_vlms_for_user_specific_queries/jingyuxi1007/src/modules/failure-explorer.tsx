import React, { useState } from 'react';

const cases = [
  { label: '底座偏见', image: 'a-fig9-bias.png', description: '无依据地把一起出现的男女称作夫妻。', stage: '原 VLM 的偏见仍可能进入生成文本', explanation: '识别并使用用户概念名称，不会自动消除底座模型对人物关系的假设。', source: 'A §5，pp.9–10；Fig.9，p.11' },
  { label: '背景泄漏', image: 'a-fig9-background.png', description: '将训练关联的 New York 带入新图描述。', stage: '训练关联与新图场景可能混淆', explanation: '模型可能把概念与训练背景绑定。个性化输出仍需要依赖当前图像，而不是复述训练时的地点。', source: 'A §5，p.10；Fig.9，p.11' },
  { label: '多人 VQA', image: 'a-fig9-people.png', description: '选错目标，把另一人的白色上衣作为答案。', stage: '问题中的目标人物与图中人物未正确对应', explanation: '图中有多人时，提到概念名称仍不保证围绕正确人物回答。这个例子不是多个已学习概念联合问答的系统评估。', source: 'A §5，p.10；Fig.9，p.11' },
  { label: '误识别 / 漏检', image: '', description: '作者指出：概念 head 的误识别或漏检会导致错误回答。', stage: '识别结果会影响是否注入对应向量', explanation: '误识别可能注入错误概念；漏检可能不注入目标向量。这里展示作者讨论的风险路径，没有构造错误率或虚构一个失败照片。', source: 'A §5，pp.9–10（作者文字讨论）' },
];

export function FailureExplorer() {
  const [selected, setSelected] = useState(0);
  const record = cases[selected];
  return (
    <div className="mv-widget" data-testid="failure-explorer">
      <div className="mv-controls" role="group" aria-label="论文失败案例">
        {cases.map((item, index) => <button key={item.label} className={'mv-button ' + (selected === index ? 'mv-selected' : '')} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.label}</button>)}
      </div>
      <div className="mv-failure-selected" aria-live="polite">
        {record.image ? <figure className="mv-paper-figure"><img src={'./images/' + record.image} alt={record.description} /><figcaption>{record.source} · arXiv v1 原图裁剪</figcaption></figure> : <div className="mv-inspector-map" aria-label="误识别和漏检的风险路径"><div className="mv-node"><b>新图像</b></div><span className="mv-arrow">→</span><div className="mv-node mv-failure-node"><b>Head 误识别 / 漏检</b></div><span className="mv-arrow">→</span><div className="mv-node"><b>向量注入可能出错</b><span>影响后续文本生成</span></div></div>}
        <div className="mv-detail"><small>作者报告的现象</small><h5>{record.description}</h5><p>{record.stage}</p></div>
      </div>
      <div className="mv-feedback" role="status">{record.explanation}</div>
      <p className="mv-source">{record.source} · <a href="https://arxiv.org/pdf/2403.14599v1" target="_blank" rel="noreferrer">查看 arXiv 来源</a>。不把这些案例中的每个错误都归因于 head，也不把它们当作系统的困难场景基准。</p>
    </div>
  );
}

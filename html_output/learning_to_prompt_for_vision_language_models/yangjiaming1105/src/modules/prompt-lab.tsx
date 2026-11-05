import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Chips } from './coop-kit';
import { useAnimatedNumbers } from './motion-hooks';
import './early-labs.css';

const DATA = [
  { name: 'Caltech101', topic: '常见物体', templates: ['a [CLASS].', 'a photo of [CLASS].', 'a photo of a [CLASS].'], scores: [82.68, 80.81, 86.29], coop: 91.83 },
  { name: 'Flowers102', topic: '花卉', templates: ['a photo of a [CLASS].', 'a flower photo of a [CLASS].', 'a photo of a [CLASS], a type of flower.'], scores: [60.86, 65.81, 66.14], coop: 94.51 },
  { name: 'DTD', topic: '纹理', templates: ['a photo of a [CLASS].', 'a photo of a [CLASS] texture.', '[CLASS] texture.'], scores: [39.83, 40.25, 42.32], coop: 63.58 },
  { name: 'EuroSAT', topic: '卫星影像', templates: ['a photo of a [CLASS].', 'a satellite photo of [CLASS].', 'a centered satellite photo of [CLASS].'], scores: [24.17, 37.46, 37.56], coop: 83.53 },
];

export const PromptLab: React.FC<WidgetProps> = () => {
  const [dataset, setDataset] = useState(0);
  const [prompt, setPrompt] = useState(1);
  const [showCoop, setShowCoop] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const d = DATA[dataset];
  const score = d.scores[prompt];
  const [shownScore, shownCoop] = useAnimatedNumbers([score, showCoop ? d.coop : 0], 850);
  const exampleClass = ['cat', 'rose', 'woven', 'forest'][dataset];
  const spread = Math.max(...d.scores) - Math.min(...d.scores);
  const gain = d.coop - score;
  const isAddedA = dataset === 0 && prompt === 2;
  const isWordComparison = dataset === 0 && (prompt === 1 || prompt === 2);
  const selectDataset = (next: number) => { setDataset(next); setAnswer(null); };
  const selectPrompt = (next: number) => { setPrompt(next); setAnswer(null); };
  const compareA = () => { setDataset(0); setPrompt(isWordComparison && !isAddedA ? 2 : 1); setShowCoop(false); setAnswer(null); };
  const reset = () => { setDataset(0); setPrompt(1); setShowCoop(false); setAnswer(null); };

  return <div className="el-lab" onKeyDown={e => {
    const target = e.target as HTMLElement;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      && target.closest('button, input, select, textarea, [role="slider"]')) e.stopPropagation();
  }}>
    <p><strong>先改一个词。</strong>点击下面的按钮，观察句子和准确率怎样一起变化。</p>
    <div className="el-prompt-stage" aria-label={`${d.name}的提示措辞与测试准确率对照`}>
      <div className="el-prompt-writing">
        <span className="el-eyebrow">同一个任务，只改变提示</span>
        <div className="el-prompt-words" aria-label={d.templates[prompt]}>
          {d.templates[prompt].split(' ').map((word, i, words) => <span key={`${dataset}-${i}-${word}`} className={word.includes('[CLASS]') ? 'el-word el-class-word' : isAddedA && i === words.length - 2 ? 'el-word el-word-added' : 'el-word'}>{word.replace('[CLASS]', exampleClass)}</span>)}
        </div>
        <p>{isAddedA ? <>多一个 <b>a</b>，描述变了。<br />测试结果也随之改变。</> : <>一句提示，组成一种描述。<br />试着调整其中的用词。</>}</p>
        <button type="button" className="tiny el-stage-action" onClick={compareA}>{!isWordComparison ? '回到 Caltech101 的单词对照' : isAddedA ? '回到未加 a 的模板' : '只增加一个 a'} <span aria-hidden="true">↗</span></button>
        <div className="el-mobile-outcome"><span>测试集准确率</span><strong>{shownScore.toFixed(2)}%</strong></div>
        <div className="el-task-label"><span aria-hidden="true">{['◈', '✿', '▥', '◒'][dataset]}</span><div><strong>{d.name}</strong><span>{d.topic}分类 · 测试集准确率</span></div></div>
      </div>
      <div className="el-result-board">
        <div className="el-result-title"><span>人工提示</span><strong>{shownScore.toFixed(2)}<small>%</small></strong></div>
        <div className="el-score-track"><div className="el-score-fill" style={{ width: `${shownScore}%` }} />{isAddedA && <i className="el-baseline" style={{ left: '80.81%' }} />}</div>
        <div className="el-scale"><span>0</span><span>50</span><span>100%</span></div>
        {isAddedA && <div className="el-delta" key="added"><span>多一个 a：</span>+5.48 <span>个百分点</span></div>}
        <div className={`el-coop-result${showCoop ? ' el-revealed' : ''}`}>
          <div className="el-result-title"><span>CoOp <small>16-shot</small></span><strong>{showCoop ? shownCoop.toFixed(2) : '—'}{showCoop && <small>%</small>}</strong></div>
          <div className="el-score-track"><div className="el-score-fill el-score-coop" style={{ width: `${shownCoop}%` }} /></div>
          <p>{showCoop ? '加入标注，学习上下文。' : '加入 CoOp，对照学习后的提示。'}</p>
          <button type="button" className="tiny el-coop-action" aria-pressed={showCoop} onClick={() => { setShowCoop(v => !v); setAnswer(null); }}>{showCoop ? '收起 CoOp 对照' : '加入论文中的 CoOp 对照'}</button>
        </div>
      </div>
    </div>
    {isAddedA && <p className="note">橙色虚线保留未增加 <code>a</code> 时的 80.81%。两条人工模板的监督条件相同，这一步只比较措辞。</p>}
    <Chips label="随后可以换个分类任务" options={DATA.map((item, i) => ({ value: String(i), label: item.name + ' · ' + item.topic }))} value={String(dataset)} onChange={v => selectDataset(Number(v))} />
    <p className="note">人工模板，就是给各类别套用的一句描述。<code>[CLASS]</code> 会替换成类别名称，例如 <code>cat</code>（猫）；条形记录整个测试集的成绩。</p>
    <div className="ctrl" role="group" aria-label="选择人工提示模板">
      {d.templates.map((template, i) => <button type="button" key={dataset + '-' + i} className={'chip' + (prompt === i ? ' selected' : '')} aria-pressed={prompt === i} onClick={() => selectPrompt(i)} style={{ whiteSpace: 'normal', textAlign: 'left' }}><span>{i + 1}.</span> <code>{template}</code></button>)}
    </div>
    <div className="ctrl">
      <button type="button" className="tiny ghost" onClick={reset}>重置</button>
      <span>人工模板：不使用下游标注；CoOp：每类 16 张标注图片。这是论文结果展示。</span>
    </div>
    <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      <div className="metric"><div className="l">当前人工模板准确率</div><div className="v">{score.toFixed(2)}%</div><span>测试图片中分类正确的比例</span></div>
      <div className="metric"><div className="l">三条人工模板的最高与最低之差</div><div className="v">{spread.toFixed(2)}</div><span>个百分点</span></div>
      <div className="metric"><div className="l">{showCoop ? 'CoOp 相对当前模板的提升' : '等待加入学习后的对照'}</div><div className="v">{showCoop ? '+' + gain.toFixed(2) : '—'}</div><span>{showCoop ? '个百分点；使用每类 16 张标注图片' : '加入 CoOp 后，训练预算也改变'}</span></div>
    </div>
    <div className="ctrl" role="group" aria-label="理解检查：准确率描述什么">
      <span>这里的 {score.toFixed(2)}% 描述什么？</span>
      {[['test', '整个测试集的准确率'], ['single', '这一张图的预测置信度']].map(([value, label]) => <button type="button" key={value} className={'chip' + (answer === value ? ' selected' : '')} aria-pressed={answer === value} onClick={() => setAnswer(value)}>{label}</button>)}
    </div>
    <Feedback tone={answer === 'single' ? 'bad' : answer === 'test' || showCoop ? 'good' : 'neutral'}>
      {answer === 'test' ? '对。这是整个测试集中分类正确的比例；左侧画的是任务示意，不是这条准确率对应的一张待预测图片。'
        : answer === 'single' ? '需要区分一张图片的预测概率和一组图片的准确率。论文在整个测试集上统计了有多少图片被正确分类；这里展示的是后者。'
        : showCoop
          ? d.name + ' 中，CoOp 的报告准确率为 ' + d.coop.toFixed(2) + '%。它用少量带正确类别的图片学习提示，因此这不是两个零样本模板的比较，也不保证所有任务都提升。'
          : isAddedA ? '只增加一个 a，准确率从 80.81% 变为 86.29%，增加 5.48 个百分点。“百分点”是两个百分数直接相减的结果。'
          : '模板措辞改变，' + d.name + ' 的报告准确率也改变。先比较只差一个 a 的两条模板，再探索其他任务；每个任务的合适表达可能不同。'}
    </Feedback>
    <details>
      <summary>查看原始数值与实验条件</summary>
      <p>论文数据：第 2 页图 1。图像骨干为 ResNet-50；人工提示使用 zero-shot（零样本）CLIP，即未用当前任务的标注图片训练提示。CoOp 使用每类 16 张训练图片、16 个上下文向量。指标为测试集分类准确率（%，越高越好）。</p>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>方法／模板</th><th>准确率</th></tr></thead><tbody>
        {d.templates.map((t, i) => <tr key={t}><td><code>{t}</code></td><td>{d.scores[i].toFixed(2)}%</td></tr>)}
        <tr><td>CoOp（少样本监督适配）</td><td>{d.coop.toFixed(2)}%</td></tr>
      </tbody></table></div>
      <p>四个任务用于说明图 1 的动机。关于 11 个任务的完整收益与反例，请在第 10 章继续核对。</p>
    </details>
  </div>;
};

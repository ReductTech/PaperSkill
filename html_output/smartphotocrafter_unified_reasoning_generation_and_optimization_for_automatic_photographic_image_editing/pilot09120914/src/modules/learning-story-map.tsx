import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Option = { id: string; label: string };
const optionSets: Record<string, Option[]> = {
  '1.1': [{ id: 'traditional', label: '传统编辑' }, { id: 'auto', label: '自动理解' }],
  '2.1': [{ id: 'image', label: 'Image' }, { id: 'critic', label: 'Understand' }, { id: 'reason', label: 'Reason' }, { id: 'artist', label: 'Edit' }, { id: 'output', label: 'Enhanced' }],
  '3.1': [{ id: 'reasoning', label: 'Reasoning' }, { id: 'suggestions', label: 'Suggestions' }, { id: 'score', label: 'Score' }],
  '4.1': [{ id: 'input', label: '原图（X）' }, { id: 'condition', label: '诊断（Hc）' }, { id: 'artist', label: 'Artist' }, { id: 'output', label: '增强图（Xe）' }],
  '5.1': [{ id: 'one', label: 'Stage I' }, { id: 'two', label: 'Stage II' }, { id: 'three', label: 'Stage III' }],
  '6.1': [{ id: 'weak', label: '不足（改得不够）' }, { id: 'over', label: '过度（修过头）' }, { id: 'guided', label: '协调（目标状态）' }],
  '7.1': [{ id: 'comp', label: '遵从建议' }, { id: 'photo', label: '光度控制' }, { id: 'perc', label: '结构一致' }],
  '7.2': [{ id: 'format', label: '格式奖励' }, { id: 'rank', label: '排序奖励' }, { id: 'explore', label: '建议探索' }],
  '8.1': [{ id: 'enhance', label: '自动增强' }, { id: 'multi', label: '组合编辑' }, { id: 'restore', label: '图像复原' }],
  '9.1': [{ id: 'problem', label: '① 问题' }, { id: 'method', label: '② 方法' }, { id: 'key', label: '③ 关键' }],
  '9.2': [{ id: 'covered', label: '已覆盖' }, { id: 'boundary', label: '尚待探索' }],
};

function PhotoTile({ kind = 'input' }: { kind?: 'input' | 'output' | 'weak' | 'over' | 'guided' }) {
  const labels: Record<string, string> = { input: '输入照片示意', output: '增强照片示意', weak: '偏暗发灰的照片示意', over: '过曝过饱和的照片示意', guided: '自然提亮的照片示意' };
  return <div className={`story-photo ${kind}`} aria-label={labels[kind]}><span className="story-sun" /><span className="story-hill one" /><span className="story-hill two" /></div>;
}

function ChipRow({ items, value, onChange }: { items: Option[]; value: string; onChange: (value: string) => void }) {
  return <div className="story-chip-row" aria-label="查看不同内容">
    {items.map((item) => <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => onChange(item.id)}>{item.label}</button>)}
  </div>;
}

function Flow({ active }: { active: string }) {
  const items = [{ id: 'image', label: 'Input Image', role: '照片' }, { id: 'critic', label: 'Image Critic', role: 'Understand' }, { id: 'reason', label: 'Reasoning', role: '连接 Understand 与 Edit' }, { id: 'artist', label: 'Photographic Artist', role: 'Edit' }, { id: 'output', label: 'Enhanced Image', role: '结果' }];
  return <div className={`story-flow ${active === 'reason' ? 'reason-active' : ''}`}>{items.map((item) => item.id === 'reason'
    ? <div key={item.id} className={`story-flow-bridge ${active === item.id ? 'active' : ''}`}><span className="story-flow-bridge-rail" aria-hidden="true" /><div><strong>Reasoning</strong><small>把诊断结论转成编辑方向</small></div></div>
    : <div key={item.id} className={`story-flow-node ${active === item.id ? 'active' : ''} ${item.id === 'critic' ? 'critic' : ''} ${item.id === 'artist' ? 'artist' : ''}`}><strong>{item.label}</strong><small>{item.role}</small></div>)}</div>;
}

function Feedback({ children }: { children: React.ReactNode }) { return <div className="story-feedback" aria-live="polite">{children}</div>; }

function DiagnosisWorkbench() {
  const defects = [
    { id: 'shadow', label: '暗部细节', diagnosis: '暗部细节不足', suggestion: '适度提亮阴影' },
    { id: 'contrast', label: '整体对比', diagnosis: '画面对比不足', suggestion: '轻微提升局部对比' },
    { id: 'color', label: '色彩自然度', diagnosis: '色彩略显平淡', suggestion: '谨慎调整饱和度' },
  ];
  const [selected, setSelected] = useState<string[]>([]);
  const selectedItems = defects.filter((item) => selected.includes(item.id));
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <div className="story-workbench">
    <div className="story-workbench-head"><div><strong>试着像 Critic 一样诊断</strong><small>点击你认为需要处理的区域；这是教学模拟，不是论文对单张图像的真实预测。</small></div><span>{selected.length}/3 已发现</span></div>
    <div className="story-workbench-grid"><PhotoTile />
      <div className="story-defect-picker">{defects.map((item) => <button key={item.id} type="button" className={selected.includes(item.id) ? 'active' : ''} onClick={() => toggle(item.id)}><b>{selected.includes(item.id) ? '✓' : '＋'}</b>{item.label}</button>)}</div>
      <div className="story-diagnosis-output"><small>R：诊断</small>{selectedItems.length ? <ul>{selectedItems.map((item) => <li key={item.id}>{item.diagnosis}</li>)}</ul> : <p>先选择一处可疑缺陷。</p>}<small>E：建议</small>{selectedItems.length ? <p>{selectedItems.map((item) => item.suggestion).join('；')}</p> : <p>诊断后才产生编辑方向。</p>}</div>
    </div>
  </div>;
}

function ArtistStudio() {
  const directions = [
    { id: 'shadow', label: '提亮暗部', detail: 'Hc：暗部细节不足 → 适度提亮阴影' },
    { id: 'haze', label: '自然去雾', detail: 'Hc：画面雾感偏重 → 温和恢复清晰度' },
    { id: 'tone', label: '校正色调', detail: 'Hc：色调偏冷 → 轻微回暖并保留自然肤色' },
  ];
  const [direction, setDirection] = useState(directions[0].id);
  const [edited, setEdited] = useState(false);
  const active = directions.find((item) => item.id === direction) || directions[0];
  return <div className="story-artist-studio">
    <div className="story-workbench-head"><div><strong>给 Artist 一条诊断条件</strong><small>先选择 Hc 中的编辑方向，再执行一次编辑。</small></div><button type="button" className="story-run-button" onClick={() => setEdited(true)}>执行编辑</button></div>
    <div className="story-direction-row">{directions.map((item) => <button key={item.id} type="button" className={direction === item.id ? 'active' : ''} onClick={() => { setDirection(item.id); setEdited(false); }}>{item.label}</button>)}</div>
    <div className={`story-execution-strip ${edited ? 'done' : ''}`}><span className="condition">{active.detail}</span><i>→</i><span className="action">Artist 根据 X + Hc 编辑</span><i>→</i><span className="result">{edited ? 'Xe：已生成自然增强结果' : '等待执行'}</span></div>
  </div>;
}

function RewardMixer({ focus }: { focus: string }) {
  const [photo, setPhoto] = useState(70);
  const [perc, setPerc] = useState(80);
  const [obey, setObey] = useState(true);
  const score = obey ? Math.round((photo * .55 + perc * .45) * 10) / 10 : 0;
  return <div className="story-reward-mixer">
    <div className="story-workbench-head"><div><strong>拖动约束，观察 rPA 如何变化</strong><small>仅用于理解奖励结构，滑块数值不是论文报告的真实权重或分数。</small></div><b className="story-reward-score">rPA ≈ {score}</b></div>
    <div className="story-gate"><button type="button" className={obey ? 'active' : ''} onClick={() => setObey((value) => !value)}>{obey ? '✓ 已遵从 Critic 建议' : '不遵从，奖励归零'}</button><span>rcomp 是门控：不遵从则奖励归零。</span></div>
    <div className="story-mixer-sliders"><label className={focus === 'photo' ? 'focused' : ''}>光度自然度 <b>{photo}</b><input type="range" min="0" max="100" value={photo} onChange={(event) => setPhoto(Number(event.target.value))} /></label><label className={focus === 'perc' ? 'focused' : ''}>结构一致性 <b>{perc}</b><input type="range" min="0" max="100" value={perc} onChange={(event) => setPerc(Number(event.target.value))} /></label></div>
  </div>;
}

function MetricLens({ task }: { task: string }) {
  const [metric, setMetric] = useState('fid');
  const details: Record<string, { label: string; direction: string; note: string }> = {
    fid: { label: 'FID', direction: '↓ 更低更好', note: '衡量生成结果与真实图像分布之间的距离。' },
    lpips: { label: 'LPIPS', direction: '↓ 更低更好', note: '衡量两张图的感知差异，复原任务常用。' },
    dino: { label: 'DINO / CLIP', direction: '↑ 更高更好', note: '衡量语义或内容的一致性。' },
  };
  const item = details[metric];
  return <div className="story-metric-lens"><div><strong>先确认指标方向，再读数字</strong><small>适用于 {task === 'enhance' ? '自动增强' : task === 'multi' ? '组合编辑' : '图像复原'} 的相应评估协议。</small></div><div className="story-direction-row">{Object.entries(details).map(([id, value]) => <button key={id} type="button" className={metric === id ? 'active' : ''} onClick={() => setMetric(id)}>{value.label}</button>)}</div><p><b>{item.label}</b>：{item.direction}。{item.note}</p></div>;
}

export const LearningStoryMap: React.FC<WidgetProps> = ({ moduleId }) => {
  const choices = optionSets[moduleId] || [];
  const [value, setValue] = useState(choices[0]?.id || '');
  useEffect(() => setValue((optionSets[moduleId] || [])[0]?.id || ''), [moduleId]);

  const top = choices.length ? <ChipRow items={choices} value={value} onChange={setValue} /> : null;

  if (moduleId === '1.1') {
    const auto = value === 'auto';
    return <div className="story-board">{top}<div className="story-compare"><div className={`story-route ${!auto ? 'active old' : ''}`}><div className="story-route-chain"><span className="story-person">Human / AI</span><span className="route-arrow">→</span><span className="story-route-step"><b>写用户指令</b><small>先说清“怎么修”</small></span><span className="route-arrow">→</span><span className="story-ai">AI 执行编辑</span></div><small className="story-route-note">前提：有人已经知道照片的问题。</small></div><div className={`story-route ${auto ? 'active new' : ''}`}><div className="story-route-chain"><PhotoTile /><span className="route-arrow">→</span><span className="story-route-step understand"><b>AI 自动理解</b><small>识别照片问题</small></span><span className="route-arrow">→</span><span className="story-route-step edit"><b>AI 自动编辑</b><small>生成增强结果</small></span></div><small className="story-route-note">起点是照片，不需要用户写编辑指令。</small></div></div><Feedback>{auto ? 'SmartPhotoCrafter 的路径是“照片 → 自动理解 → 自动编辑”：用户不需要先把摄影问题翻译成指令。' : '传统指令式编辑的起点在用户：如果用户不知道问题，工作流就会停住。'}</Feedback></div>;
  }

  if (moduleId === '2.1') {
    const copy: Record<string, string> = { image: '输入图像提供原始内容与画质线索。', critic: 'Image Critic 负责诊断照片的质量与审美问题。', reason: 'Reasoning 把 Understand 得到的诊断连接到 Edit 的执行方向。', artist: 'Photographic Artist 使用输入图像和 Critic 条件执行编辑。', output: '增强结果应改善摄影质量，同时保留内容与结构。' };
    return <div className="story-board">{top}<Flow active={value} /><Feedback>{copy[value]}</Feedback></div>;
  }

  if (moduleId === '3.1') {
    const panels: Record<string, React.ReactNode> = {
      reasoning: <><strong>Image Quality &amp; Aesthetic Reasoning</strong><p>“画面有轻微雾感，暗部细节不足，整体显得平。”</p></>,
      suggestions: <><strong>Edit Suggestions</strong><ul><li>去除雾感</li><li>提高曝光</li><li>适度提高饱和度</li></ul></>,
      score: <><strong>Image Quality Score</strong><div className="story-score">58 <small>/ 100</small></div><p>此分数仅是页面结构示例，不是论文报告的单张实测值。</p></>,
    };
    return <div className="story-board">{top}<div className="story-critic-layout"><PhotoTile /><div className="story-output-card">{panels[value]}</div></div><DiagnosisWorkbench /><Feedback>{value === 'reasoning' ? '先说明问题，再提出动作；Reasoning 是后续建议和评分的上下文。' : value === 'suggestions' ? '建议把诊断转换成明确方向，供 Artist 执行。' : '评分会在后续训练中用于比较输入与编辑结果的质量。'}</Feedback></div>;
  }

  if (moduleId === '4.1') {
    const notes: Record<string, string> = { input: '原图 X 提供需要保留的内容与结构。', condition: '诊断 Hc 是 Critic 生成的内部 reasoning representation，为 Artist 指明编辑方向。', artist: 'Photographic Artist 同时接收 X 和 Hc，再执行生成式摄影编辑。', output: '增强图 Xe 应改善摄影质量，同时保留原始主体与结构。' };
    return <div className="story-board">{top}<div className="story-artist-convergence"><div className={`artist-input original ${value === 'input' ? 'active-frame' : ''}`}><b>原图（X）</b><small>内容与结构</small></div><div className={`artist-input diagnosis ${value === 'condition' ? 'active-frame' : ''}`}><b>诊断（Hc）</b><small>问题与编辑方向</small></div><div className="artist-merge-lines" aria-hidden="true" /><div className={`artist-core ${value === 'artist' ? 'active-frame' : ''}`}><span>🖌️</span><b>Artist</b><small>执行编辑</small></div><div className="artist-output-arrow" aria-hidden="true">→</div><div className={`artist-output ${value === 'output' ? 'active-frame' : ''}`}><PhotoTile kind="output" /><b>增强图（Xe）</b></div></div><ArtistStudio /><Feedback>{notes[value]}</Feedback></div>;
  }

  if (moduleId === '5.1') {
    const stages = [
      { id: 'one', stage: 'Stage I', title: '独立训练', goal: '目标：各练基本功', update: 'Critic 学审美评估 / 推理；Artist 学修复 / 调色。', note: '你学你的，我学我的', icon: 'Ⅰ' },
      { id: 'two', stage: 'Stage II', title: '条件适配', goal: '目标：学会读懂诊断', update: '只更新 Artist。让它不仅看图，还要接收 Critic 的隐层表示（Hc）当“导航”。', note: 'Artist 接收 Critic 的推理信号', icon: 'Ⅱ' },
      { id: 'three', stage: 'Stage III', title: '协同强化', goal: '目标：闭环联合优化', update: '双方都更新。Critic 用 GRPO，Artist 用 DiffusionNFT，在奖励机制下互相促进。', note: 'Critic 和 Artist 在一套反馈里互相校正', icon: 'Ⅲ' },
    ];
    const activeIndex = stages.findIndex((stage) => stage.id === value);
    return <div className="story-board">{top}<div className="story-stage-progress"><span style={{ width: `${(activeIndex + 1) / stages.length * 100}%` }} /></div><div className="story-training-steps">{stages.map((stage, index) => <article key={stage.id} className={`story-training-step ${stage.id === value ? 'active' : ''} ${index > activeIndex ? 'pending' : ''}`}><span className="story-training-icon">{stage.icon}</span><span className="story-training-stage">{stage.stage}</span><strong>{stage.title}</strong><b>{stage.goal}</b><p><em>谁更新：</em>{stage.update}</p><small>{stage.note}</small></article>)}</div><div className="story-stage-actions"><span>当前：<b>{stages[activeIndex].title}</b></span><button type="button" disabled={activeIndex === stages.length - 1} onClick={() => setValue(stages[Math.min(activeIndex + 1, stages.length - 1)].id)}>推进到下一阶段 →</button></div><Feedback>{stages[activeIndex].note}。{activeIndex === 2 ? '此时才进入同一训练循环，但 Critic 与 Artist 仍使用不同的奖励设计。' : '点击“推进到下一阶段”，观察训练对象与信息连接如何变化。'}</Feedback></div>;
  }

  if (moduleId === '6.1') {
    const result: Record<string, { label: string; desc: string; cls: string; photo: 'weak' | 'over' | 'guided' }> = {
      weak: { label: '不足（改得不够）', desc: '方向对了，但力度不够。比如建议提亮，但只提亮了一点点。', cls: 'weak', photo: 'weak' },
      over: { label: '过度（修过头）', desc: '为了好看，损失了真实感。过曝、过饱和或去雾过猛，都可能让画面失去细节。', cls: 'over', photo: 'over' },
      guided: { label: '协调（目标状态）', desc: '既听劝，又不过度。与原图色调、质感一致，但画面明显更亮。', cls: 'guided', photo: 'guided' },
    };
    const item = result[value];
    return <div className="story-board">{top}<div className={`story-result ${item.cls}`}><PhotoTile kind={item.photo} /><div><strong>{item.label}</strong><p>{item.desc}</p></div></div><Feedback>{value === 'guided' ? '这就是 Stage III 强化学习要达到的平衡点：既按诊断完成编辑，也不牺牲照片原本的真实感。' : '这个状态说明：只靠模仿学习，模型可能学到方向，却还学不会合适的编辑力度。'}</Feedback></div>;
  }

  if (moduleId === '7.1') {
    const rewardOrder = [
      { key: 'comp', symbol: 'rcomp', label: '遵从建议' },
      { key: 'photo', symbol: 'rphoto', label: '光度控制' },
      { key: 'perc', symbol: 'rperc', label: '结构一致' },
    ];
    const panels: Record<string, React.ReactNode> = {
      comp: <><strong>rcomp：先看是否按建议执行</strong><p>若 Critic 给出的颜色与影调建议没有被正确执行，rcomp 会压低整体 Artist 奖励。</p></>,
      photo: <><strong>rphoto：精确约束摄影属性</strong><p>它比较曝光、对比度、饱和度、色温等属性与参考图的相对差距，避免只改方向却改得太少或太猛。</p></>,
      perc: <><strong>rperc：保护内容、结构与纹理</strong><p>它以 LPIPS 衡量增强图与参考图的感知一致性，抑制不必要的内容或结构偏移。</p></>,
    };
    return <div className="story-board">{top}<div className="story-evidence-panel story-artist-reward"><div className="story-formula-mini">rPA = rcomp × (λ1 rphoto + λ2 rperc)</div><div className={`story-reward-sequence active-${value}`} aria-label="Artist 奖励的组成顺序">{rewardOrder.map((item, index) => <React.Fragment key={item.key}><span className={item.key}><b>{item.symbol}</b><small>{item.label}</small></span>{index < rewardOrder.length - 1 && <i>＋</i>}</React.Fragment>)}</div>{panels[value]}</div><RewardMixer focus={value} /><Feedback>{value === 'comp' ? 'rcomp 是门控：没有按诊断建议编辑，再好的光度或结构表现也不能得到高奖励。' : value === 'photo' ? 'rphoto 是论文防止“修图过头或不够”的关键摄影属性约束。' : 'rperc 关注不能被破坏的部分：主体、布局和细节纹理。'}</Feedback></div>;
  }

  if (moduleId === '7.2') {
    const panels: Record<string, React.ReactNode> = {
      format: <><strong>格式奖励：输出顺序必须可靠</strong><p>Critic 需按“推理 → 建议 → 评分”的规范格式输出，避免推理链结构失真。</p></>,
      rank: <><strong>排序奖励：增强图应得更高分</strong><div className={`story-rl-score-compare ${value === 'rank' ? 'rank-active' : ''}`}><span><small>原图评分</small><b>S(X)</b></span><i>＜</i><span className="higher"><small>增强图评分</small><b>S(Xe)</b></span><em>有效编辑时，S(Xe) 应高于 S(X)</em></div></>,
      explore: <><strong>建议探索：建议应能导向更好的参考</strong><p>对复原任务施加明确语义约束；对调色任务，评估建议生成的伪参考是否在光度属性上更接近目标。</p></>,
    };
    return <div className="story-board">{top}<div className="story-evidence-panel story-critic-reward"><div className="story-rl-update-card critic active"><b>Image Critic</b><strong>GRPO</strong><small>优化诊断、评分与编辑建议</small></div>{panels[value]}</div><Feedback>{value === 'format' ? '这项奖励约束 Critic 的解释结构。' : value === 'rank' ? '这是 Critic 的评分一致性信号，不是 Artist 的 rPA。' : '这项奖励鼓励 Critic 给出真正可执行、并能导向更优摄影属性的建议。'}</Feedback></div>;
  }

  if (moduleId === '8.1') {
    const evidence: Record<string, React.ReactNode> = {
      enhance: <div className="story-evidence-result"><strong>结论：自动增强兼顾自然度与内容保真</strong><div className="story-metrics"><div><span>DINO <b>0.98</b><em>↑ 最佳</em></span><span>CLIP <b>0.96</b><em>↑ 最佳</em></span><span>FID <b>27.96</b><em>↓ 最佳</em></span><span>LPIPS <b>0.10</b><em>↓ 最佳</em></span></div></div><p>Table 1：MUSIQ 为 69.52（第二），NIMA 为 5.66；论文结论是取得更平衡的感知质量与分布保真，而非每项都最高。</p></div>,
      multi: <div className="story-evidence-result"><strong>结论：组合编辑遵从在 Table 2 全指标领先</strong><div className="story-metrics"><div><span>PSNR <b>21.05</b><em>↑ 最佳</em></span><span>SSIM <b>0.82</b><em>↑ 最佳</em></span><span>LPIPS <b>0.09</b><em>↓ 最佳</em></span><span>FID <b>22.93</b><em>↓ 最佳</em></span></div></div><p>在“复原 + 调色”随机组合指令协议下，DINO 0.97、CLIP 0.96 同样为最佳。</p></div>,
      restore: <div className="story-evidence-result"><strong>结论：去模糊、去雾中取得最佳或次佳表现</strong><div className="story-metrics"><div><span>去模糊 LPIPS <b>0.07</b><em>↓ 最佳</em></span><span>去模糊 FID <b>21.85</b><em>↓ 最佳</em></span><span>去雾 LPIPS <b>0.05</b><em>↓ 最佳</em></span><span>去雾 FID <b>17.23</b><em>↓ 最佳</em></span></div></div><p>Table 3 同时报告 PSNR、SSIM、DISTS：该方法并非每项绝对最高，但整体在两类复原任务中表现稳健。</p></div>,
    };
    const feedback: Record<string, string> = { enhance: '自动增强使用 Table 1 的感知质量、语义一致性与分布保真指标；其数值不能与其他任务表格横向混比。', multi: '组合编辑验证的是：在明确的多项复原与调色指令下，模型能否同时把多项要求改对。', restore: '复原任务分别在去模糊与去雾测试集上评估，关注重建保真与感知相似性。' };
    return <div className="story-board">{top}<div className="story-evidence-panel">{evidence[value]}</div><MetricLens task={value} /><Feedback>{feedback[value]}</Feedback><div className="story-evidence-banner">📊 阅读原则：每个任务只在自己的评估协议与指标方向内比较；不要跨任务直接比较数值。</div></div>;
  }

  if (moduleId === '9.1') {
    const notes: Record<string, { title: string; text: string; tone: string }> = {
      problem: { title: '用户知道“差点意思”，却说不清该怎么修', text: '传统指令式修图把“发现问题”交给用户；这正是自动摄影编辑首先要解决的难题。', tone: 'problem' },
      method: { title: 'Critic 先诊断，Artist 再执行', text: 'Image Critic 产出诊断与编辑方向，Photographic Artist 接收原图和诊断条件，完成增强。', tone: 'method' },
      key: { title: '两套奖励在同一训练循环中协同', text: 'Artist 的摄影编辑奖励与 Critic 的理解奖励分别匹配各自职责，再让诊断与编辑相互促进。', tone: 'key' },
    };
    const note = notes[value];
    return <div className="story-board">{top}<div className={`story-conclusion-card ${note.tone}`}><span>{value === 'problem' ? '？' : value === 'method' ? '→' : '↺'}</span><div><strong>{note.title}</strong><p>{note.text}</p></div></div><Feedback>{value === 'problem' ? '论文从“用户并不知道怎样修”这个真实困境出发。' : value === 'method' ? '它不是把提示词写得更复杂，而是把诊断和编辑拆给两个互补模块。' : '这就是 Stage III 的意义：让 Critic 与 Artist 围绕同一种“好编辑”信号学习。'}</Feedback></div>;
  }

  if (moduleId === '9.2') {
    const boundary = value === 'boundary';
    return <div className="story-board">{top}<div className={`story-boundary-card ${boundary ? 'boundary' : 'covered'}`}><div><strong>{boundary ? '论文尚待探索' : '论文主要覆盖'}</strong><p>{boundary ? '作者明确表示，高层构图因素尚未探索。' : '复原与摄影属性调整；编辑时尽量保持输入照片的内容与结构。'}</p></div><span>{boundary ? '△' : '✓'}</span></div><Feedback>{boundary ? '这不是模型无效，而是论文清楚界定了当前方法的范围：高层构图仍是后续可继续研究的方向。' : '在已覆盖的范围内，目标是让照片更自然，同时避免改变原始主体和结构。'}</Feedback></div>;
  }

  return <div className="story-board">{top}<Flow active={value} /><Feedback>整篇论文的关键是：先理解照片，再基于 reasoning 完成编辑；这使自动增强不再依赖用户先给出摄影诊断。</Feedback></div>;
};

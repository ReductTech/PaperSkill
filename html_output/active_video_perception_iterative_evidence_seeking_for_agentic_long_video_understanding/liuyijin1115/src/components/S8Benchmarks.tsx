import { useState } from 'react';
import './s8-benchmarks.css';

type Props = { onComplete: () => void };

const tasks = [
  {
    name: 'MINERVA', theme: 'reason', eyebrow: '多步视频推理',
    question: '先找到两个分散的线索，才能回答组合问题。',
    challenge: '问题需要把视觉细节与时间信息连起来；单个片段往往不够。',
    clips: [
      { time: '01:20', icon: '📝', label: '记录数值', active: true },
      { time: '03:45', icon: '🏞️', label: '场景转换' },
      { time: '06:10', icon: '👤', label: '人物讲解' },
      { time: '09:30', icon: '📏', label: '补充尺度', active: true },
      { time: '12:00', icon: '🎬', label: '结尾' }
    ],
    observation: '两处相距较远的证据都要找到并合并。'
  },
  {
    name: 'LVBench', theme: 'needle', eyebrow: '超长视频信息提取',
    question: '目标人物究竟在哪个短暂时刻出现？',
    challenge: '长时间素材中的关键细节很短，容易被粗略浏览淹没。',
    clips: [
      { time: '00:00', icon: '🏙️', label: '开场' },
      { time: '18:00', icon: '🚆', label: '行进' },
      { time: '36:00', icon: '🏙️', label: '街景' },
      { time: '54:12', icon: '👤', label: '短暂出现', active: true },
      { time: '60:00', icon: '🌆', label: '收尾' }
    ],
    observation: '一小时量级的视频里，短暂出现的细节必须被定位。'
  },
  {
    name: 'MLVU', theme: 'sequence', eyebrow: '多任务长视频理解',
    question: '这些事件按什么顺序发生？',
    challenge: '多种视频类型与题型考查长期记忆、事件关系和整体理解。',
    clips: [
      { time: '02:10', icon: '📦', label: '准备', active: true },
      { time: '05:40', icon: '🚚', label: '运送', active: true },
      { time: '09:00', icon: '🧭', label: '转场' },
      { time: '13:25', icon: '🏠', label: '到达', active: true },
      { time: '16:00', icon: '🎬', label: '结尾' }
    ],
    observation: '多个事件需要保持正确的时间关系。'
  },
  {
    name: 'Video-MME', theme: 'domains', eyebrow: '多时长、多领域的视频问答',
    question: '视频中的动作与后续结果有什么关系？',
    challenge: '评测横跨短、中、长视频，并涉及感知与推理；主图使用 Overall 成绩。',
    clips: [
      { time: '短', icon: '⚽', label: '动作识别', active: true },
      { time: '中', icon: '🍳', label: '过程理解', active: true },
      { time: '长', icon: '🎭', label: '情节推理', active: true }
    ],
    observation: '不同长度与领域的问题共同组成 Overall，不能把它当作 Long 子集。'
  },
  {
    name: 'LongVideoBench', theme: 'reference', eyebrow: '长上下文指代推理',
    question: '问题所指的那段情境里，随后出现了什么？',
    challenge: '先根据问题中的指代找到相关情境，再回到画面细节作答。',
    clips: [
      { time: '04:10', icon: '🚪', label: '相似场景' },
      { time: '11:25', icon: '👒', label: '被指情境', active: true },
      { time: '12:05', icon: '📕', label: '后续细节', active: true },
      { time: '24:30', icon: '🚪', label: '另一场景' },
      { time: '39:00', icon: '🎬', label: '结尾' }
    ],
    observation: '先解开“哪一段”的指代，再观察该处的后续细节；主图使用 Val。'
  }
] as const;

export function S8Benchmarks({ onComplete }: Props) {
  const [selected, setSelected] = useState(0);
  const task = tasks[selected];
  return <div className="s8-explorer">
    <p className="s8-intro">长视频问答不只有一种难题。选择一个基准，观察它所覆盖的一种典型挑战；这些能力也会在其他基准中出现。</p>
    <div className="s8-task-tabs" role="group" aria-label="选择 Benchmark">
      {tasks.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} className={selected === index ? 'is-active' : ''} onClick={() => { setSelected(index); onComplete(); }}>{item.name}</button>)}
    </div>
    <div className={`s8-scene s8-scene--${task.theme}`}>
      <div className="s8-scene-top"><span>{task.eyebrow}</span><strong>{task.question}</strong></div>
      <div className="s8-video-stage" aria-label={`${task.name}任务场景：${task.observation}`}>
        <div className="s8-stage-ribbon"><span>视频时间线</span><span>{task.clips.length} 个观察位置</span></div>
        <div className="s8-clip-grid">
          {task.clips.map((clip, index) => <div className={`s8-clip ${'active' in clip && clip.active ? 'is-evidence' : ''}`} key={`${task.name}-${index}`}>
            <div className="s8-clip-art"><span aria-hidden="true">{clip.icon}</span></div>
            <div className="s8-clip-meta"><b>{clip.time}</b><span>{clip.label}</span></div>
          </div>)}
        </div>
        <div className="s8-time-track" aria-hidden="true">{task.clips.map((clip, index) => <span className={'active' in clip && clip.active ? 'is-evidence' : ''} key={index} />)}</div>
      </div>
      <div className="s8-scene-bottom"><p><b>观察重点</b>{task.observation}</p><p><b>理解难点</b>{task.challenge}</p></div>
    </div>
  </div>;
}

type ModelKey = 'pro' | 'flash';
type Metric = 'accuracy' | 'gain';
const results = [
  { name: 'MINERVA', short: 'MINERVA', pro: [61.8, 65.6], flash: [54.6, 56.9] },
  { name: 'LVBench', short: 'LVBench', pro: [67.4, 74.8], flash: [56.7, 63.8] },
  { name: 'MLVU', short: 'MLVU', pro: [79.6, 84.3], flash: [72.4, 74.1] },
  { name: 'Video-MME Overall', short: 'Video-MME\nOverall', pro: [82.4, 85.3], flash: [74.2, 81.2] },
  { name: 'LongVideoBench Val', short: 'LongVideoBench\nVal', pro: [69.8, 73.4], flash: [66.2, 70.2] }
] as const;

export function S8Results({ onComplete }: Props) {
  const [model, setModel] = useState<ModelKey>('pro');
  const [metric, setMetric] = useState<Metric>('accuracy');
  const [selected, setSelected] = useState<string | null>(null);
  const modelName = `Gemini-2.5-${model === 'pro' ? 'Pro' : 'Flash'}`;
  const rows = [...results].sort((a, b) => metric === 'gain' ? (b[model][1] - b[model][0]) - (a[model][1] - a[model][0]) : 0);
  const focused = results.find(item => item.name === selected);
  const max = [...results].sort((a, b) => (b[model][1] - b[model][0]) - (a[model][1] - a[model][0]))[0];
  const change = (base: number, avp: number) => (avp - base).toFixed(1);
  return <div className="s8-results">
    <div className="s8-chart-controls">
      <fieldset><legend>基础模型</legend><div className="s8-switch">{(['pro', 'flash'] as const).map(value => <button key={value} type="button" aria-pressed={model === value} className={model === value ? 'is-active' : ''} onClick={() => { setModel(value); onComplete(); }}>Gemini-2.5-{value === 'pro' ? 'Pro' : 'Flash'}</button>)}</div></fieldset>
      <fieldset><legend>查看指标</legend><div className="s8-switch">{([['accuracy', '绝对准确率'], ['gain', '提升幅度']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={metric === value} className={metric === value ? 'is-active' : ''} onClick={() => { setMetric(value); onComplete(); }}>{label}</button>)}</div></fieldset>
    </div>
    <div className="s8-chart" aria-label={`${modelName} 与 AVP 的五数据集${metric === 'accuracy' ? '准确率' : '准确率提升'}图`}>
      <div className="s8-chart-heading"><div><strong>{metric === 'accuracy' ? '五数据集准确率' : 'AVP 带来的绝对提升'}</strong><span>{metric === 'accuracy' ? '准确率（%），横轴从 0 开始' : '提升幅度（百分点，pp），按增益排序'}</span></div><div className="s8-legend">{metric === 'accuracy' ? <><span><i className="base" />{modelName}</span><span><i className="avp" />AVP + {modelName}</span></> : <span><i className="avp" />AVP − {modelName}</span>}</div></div>
      <div className="s8-axis"><span /><div>{(metric === 'accuracy' ? [0, 20, 40, 60, 80, 100] : [0, 2, 4, 6, 8, 10]).map(tick => <span key={tick}>{tick}</span>)}</div><span /></div>
      <div className="s8-chart-rows">{rows.map(item => {
        const [base, avp] = item[model];
        const gain = Number(change(base, avp));
        const active = selected === item.name;
        return <button type="button" key={item.name} className={`s8-chart-row ${active ? 'is-active' : ''} ${selected && !active ? 'is-muted' : ''}`} aria-pressed={active} aria-label={`${item.name}：${modelName} ${base.toFixed(1)}%，AVP ${avp.toFixed(1)}%，提升 ${gain.toFixed(1)} 个百分点`} onClick={() => { setSelected(active ? null : item.name); onComplete(); }}>
          <span className="s8-row-label">{item.short}</span><span className="s8-row-plot">
            {metric === 'accuracy' ? <><span className="s8-bar s8-bar--base" style={{ width: `${base}%` }}><b>{base.toFixed(1)}%</b></span><span className="s8-bar s8-bar--avp" style={{ width: `${avp}%` }}><b>{avp.toFixed(1)}%</b></span></> : <span className="s8-bar s8-bar--gain" style={{ width: `${gain * 10}%` }}><b>+{gain.toFixed(1)} pp</b></span>}
          </span><span className="s8-row-gain">+{gain.toFixed(1)} pp</span>
        </button>;
      })}</div>
    </div>
    <div className="s8-result-readout" aria-live="polite">{focused ? <><strong>{focused.name}</strong><p>{modelName} 为 {focused[model][0].toFixed(1)}%，AVP + {modelName} 为 {focused[model][1].toFixed(1)}%，提高 <b>{change(focused[model][0], focused[model][1])} 个百分点</b>。</p></> : <><strong>五项基准均有提升</strong><p>在相同基础模型下，最大增益出现在 {max.name}（+{change(max[model][0], max[model][1])} 个百分点）。点击任一数据集查看精确对照。</p></>}</div>
    <p className="s8-chart-boundary">这些成绩对应不同任务和评测范围；跨数据集的准确率不能直接当作同一难度排名。两种基础模型上的五项结果均为正增益，但不能推断所有任务、问题或模型都会同样提升。</p>
  </div>;
}

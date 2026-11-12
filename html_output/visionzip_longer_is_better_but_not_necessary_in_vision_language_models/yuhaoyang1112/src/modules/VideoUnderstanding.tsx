import { useState } from 'react';
import { Hint, Term } from '../components/Hint';
import { useContentMotion } from '../components/motion';
import { SegmentBar } from '../components/SegmentBar';
import { paper, supplement } from '../data/tutorial';
import './video-understanding.css';

// CVPR 2025, Table 3. Keep the paper's printed retention percentages.
const tasks = [
  { name: 'TGIF', full: 47.1, zipped: 42.4, retained: 90.0,
    description: 'TGIF 的素材是短 GIF，题型涉及动作重复、状态变化，也有单帧就能回答的问题。表中四项里，它的相对降幅最大。' },
  { name: 'MSVD', full: 69.8, zipped: 63.5, retained: 91.0,
    description: 'MSVD 用短视频做开放问答，比如“谁在做什么”。这一项的原始分最高，但压缩前后差了 6.3 分。' },
  { name: 'MSRVTT', full: 56.7, zipped: 52.1, retained: 91.9,
    description: 'MSRVTT 的问答覆盖多种视频主题。同一列里，SparseVLM 得 31.0 分，VisionZip 得 52.1 分。两者压缩后分别留下 135、136 个视觉 token。' },
  { name: 'ActivityNet', full: 43.1, zipped: 43.0, retained: 99.8,
    description: 'ActivityNet 的问题涉及动作、空间与时间关系。这列只掉了 0.1 分，接近保住原分；压缩后的原始分仍是 43.0。' },
] as const;

function VideoScores() {
  const [index, setIndex] = useState(0);
  const task = tasks[index];
  const readout = useContentMotion<HTMLDivElement>(index);
  return <section className="vz-video-card vzs-panel" id="module-6-1">
    <div className="panel-heading"><h3><span className="vzs-lab-num">6.1</span> 同样看 8 帧，哪项问答最受影响？</h3>
      <a href={paper + '#page=6'} target="_blank" rel="noreferrer">正文表 3 ↗</a></div>
    <p>Video-LLaVA 用 LanguageBind 编码 8 帧，每帧给语言模型 256 个<Term name="视觉 token" />。表 3 保持这 8 帧，免训练的 VisionZip 把每帧压到 17 个。整段从 2,048 个减到 136 个，只剩约 6.6%。</p>
    <SegmentBar className="vz-video-switch" role="group" aria-label="表 3 的视频问答任务" value={index}>
      {tasks.map((item, i) => <button type="button" key={item.name} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.name}</button>)}
    </SegmentBar>
    <figure className="vz-video-plot" aria-label={task.name + ' 压缩前后原始分'}>
      <figcaption><strong>{task.name} 原始分</strong><span>两条都从 0 起算</span></figcaption>
      {[{ label: '原模型', value: task.full }, { label: 'VisionZip', value: task.zipped }].map(({label, value}) =>
        <div className="vz-video-score" key={label}>
          <span>{label}</span><div className="vz-video-rail" aria-hidden="true"><i style={{ transform: 'scaleX(' + value / 100 + ')' }} /></div><b>{value.toFixed(1)}</b>
        </div>)}
    </figure>
    <div ref={readout} className="vz-video-feedback" aria-live="polite">
      <strong>{task.name} 保留了原分的 {task.retained.toFixed(1)}%</strong><span>{task.description}</span>
    </div>
    <details className="vz-video-detail"><summary>四项怎么合成 93.2%？</summary>
      <table aria-label="表 3 四项视频问答得分和保留率">
        <thead><tr><th scope="col">任务</th><th scope="col">原模型</th><th scope="col">VisionZip</th><th scope="col">保留率</th></tr></thead>
        <tbody>{tasks.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.full.toFixed(1)}</td><td>{row.zipped.toFixed(1)}</td><td>{row.retained.toFixed(1)}%</td></tr>)}</tbody>
      </table>
      <p>每项先除以自己的原模型得分。四项保留率 90.0%、91.0%、91.9%、99.8% 等权平均，四舍五入得到 93.2%。这个数回答的是压缩后保住多少原有表现。</p>
    </details>
  </section>;
}

const frameCounts = [8, 32, 64] as const;
const clipSeconds = 16;
const eventStart = 6;
const eventEnd = 6.65;
const visualBudget = 2048;

function VideoCoverage() {
  const [count, setCount] = useState<typeof frameCounts[number]>(8);
  const samples = Array.from({ length: count }, (_, i) => (i + .5) * clipSeconds / count);
  const includesPass = (time: number) => time >= eventStart && time <= eventEnd;
  const hits = samples.filter(includesPass);
  const readout = useContentMotion<HTMLDivElement>(count);
  return <section className="vz-video-card vzs-panel" id="module-6-2">
    <div className="panel-heading"><h3><span className="vzs-lab-num">6.2</span> 能多看几帧，能否抓到传球的一刻？</h3>
      <a href={supplement + '#page=8'} target="_blank" rel="noreferrer">补充图 8 ↗</a></div>
    <p>把 2,048 个位置分给一段 16 秒的比赛。传球只发生在第 6.00–6.65 秒。把视频分成等长的小段，每段正中取一帧；试着增加帧数，看看哪次抽样能碰上传球。</p>
    <SegmentBar className="vz-video-switch vz-video-frames" role="group" aria-label="教学示例的抽帧数" value={count}>
      {frameCounts.map(n => <button type="button" key={n} aria-pressed={count === n} onClick={() => setCount(n)}>{n} 帧</button>)}
    </SegmentBar>
    <figure className="vz-video-timeline" aria-label="16 秒片段均匀抽帧的时间轴">
      <figcaption><strong>16 秒抽帧时间轴</strong><span className="vz-video-event-key"><i aria-hidden="true" />传球时段</span></figcaption>
      <div className="vz-video-track" aria-hidden="true">
        <div className="vz-video-event" style={{ left: eventStart / clipSeconds * 100 + '%', width: (eventEnd - eventStart) / clipSeconds * 100 + '%' }} />
        {samples.map(time => <i key={time} className={includesPass(time) ? 'in-event' : ''} style={{ left: time / clipSeconds * 100 + '%' }} />)}
      </div>
      <div className="vz-video-ticks" aria-hidden="true"><span>0 秒</span><span>4</span><span>8</span><span>12</span><span>16 秒</span></div>
    </figure>
    <div ref={readout} className="vz-video-feedback" aria-live="polite">
      <strong>{count} 帧 × 每帧 {visualBudget / count} 个 token = 2,048</strong>
      <span>{hits.length ? '有 ' + hits.length + ' 帧落在传球时段。' : '没有抽中传球。相邻采样点在第 5 秒和第 7 秒，球已经传出去了。'}
        {hits.length > 0 && '时间线上能看到这个动作的机会增加了；每帧可用于辨认球衣号码等细节的位置也少了。'}</span>
    </div>
    <p className="vz-video-note">时间轴是教学示例。它按给定时刻数帧，没有运行问答模型。<Hint title="固定预算" text="可分配的视觉位置固定为 2,048。每帧的位置数由 2,048 除以帧数得到；这个等式不估算准确率或显存。">查看预算怎么算</Hint></p>
    <aside className="vz-video-case"><h4>回到论文里的三分钟片段</h4>
      <p>补充图 8 用《疯狂动物城》的三分钟片段，请模型描述发生了什么。在相同的视觉序列长度下，原版编码 8 帧，VisionZip 编码了 10 倍的帧数。作者观察到原版集中描述一帧，压缩版提到了片段中更多事件。图中展示的是这一次回答；四项问答的 93.2% 来自上一节固定 8 帧的实验。</p>
    </aside>
  </section>;
}

export default function VideoUnderstanding() {
  return <div className="vz-video-lesson"><VideoScores /><VideoCoverage /></div>;
}

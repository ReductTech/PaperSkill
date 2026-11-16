import { useEffect, useRef, useState } from 'react';
import './s7-efficiency.css';

type Props = { onComplete: () => void };
type View = 'both' | 'dvd' | 'avp';
type Metric = 'time' | 'tokens' | 'accuracy';

const clips = ['片段 1', '片段 2', '片段 3', '片段 4', '片段 5', '片段 6'];
const captions = ['街道全景', '人物交谈', '桌面物品', '蓝色标牌', '室内走动', '远景镜头'];
const dvdCost = [0, 9, 19, 30, 40, 51, 61];
const avpCost = [0, 5, 12, 17, 31, 36, 36];
const dvdStatus = ['等待处理', '描述片段 1', '描述片段 2', '描述片段 3', '描述片段 4', '描述片段 5', '描述片段 6'];
const avpStatus = ['由问题确定观察目标', '初步观察视频', '继续粗略观察', '发现候选区间', '精查候选片段', '保留关键证据', '证据充分，停止观察'];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function S7Allocation({ onComplete }: Props) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<View>('both');
  const completed = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !started.current) {
        started.current = true;
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true);
      }
    }, { threshold: .25 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || step >= 6) return;
    const timer = window.setTimeout(() => setStep(value => Math.min(6, value + 1)), 1050);
    return () => window.clearTimeout(timer);
  }, [playing, step]);
  useEffect(() => { if (step === 6) { setPlaying(false); if (!completed.current) { completed.current = true; onComplete(); } } }, [step, onComplete]);

  const replay = () => { setStep(0); setPlaying(!reduced); };
  const active = (track: 'dvd' | 'avp') => view === 'both' || view === track;

  return <div className="s7-allocation" ref={root}>
    <div className="s7-intro"><strong>同一段长视频，要回答：哪一段出现蓝色标牌？</strong><span>观察范围与成本如何随问题变化</span></div>
    <div className="s7-toolbar">
      <div className="s7-switch" role="group" aria-label="处理轨道">
        {([['both', '同步'], ['dvd', '只看 DVD'], ['avp', '只看 AVP']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}
      </div>
      <div className="s7-playback">
        {step < 6 && <button type="button" onClick={() => reduced ? setStep(value => Math.min(6, value + 1)) : setPlaying(value => !value)}>{reduced ? '下一步' : playing ? '暂停' : '播放'}</button>}
        <button type="button" onClick={replay}>重播</button>
      </div>
    </div>
    <div className={`s7-tracks ${view !== 'both' ? 's7-single' : ''}`}>
      {active('dvd') && <section className="s7-track s7-dvd" aria-label="DVD 通用 Caption 处理轨道">
        <div className="s7-track-heading"><div><span className="s7-track-id">DVD</span><h5>通用 Caption</h5></div><strong>{dvdStatus[step]}</strong></div>
        <div className="s7-clip-line" aria-label="连续六个视频片段">{clips.map((clip, index) => <div key={clip} className={`s7-clip ${index < step ? 'processed' : ''} ${step === index + 1 ? 'current' : ''}`}><span>{clip}</span><i aria-hidden="true"/></div>)}</div>
        <div className="s7-output"><span>描述累积</span><div className="s7-caption-list">{captions.map((caption, index) => <span key={caption} className={index < step ? 'visible' : ''}>{index < step ? caption : '—'}</span>)}</div></div>
        <div className="s7-cost"><div><span>累计相对处理量</span><strong>{dvdCost[step]} / 70</strong></div><div className="s7-cost-rail"><i style={{ width: `${dvdCost[step] / 70 * 100}%` }}/></div></div>
      </section>}
      {active('avp') && <section className="s7-track s7-avp" aria-label="AVP 问题驱动观察轨道">
        <div className="s7-track-heading"><div><span className="s7-track-id">AVP</span><h5>按需观察</h5></div><strong>{avpStatus[step]}</strong></div>
        <div className="s7-clip-line" aria-label="与 DVD 相同的六个视频片段">{clips.map((clip, index) => <div key={clip} className={`s7-clip ${step >= 1 && step <= 3 ? 'scanning' : ''} ${step >= 3 && index === 3 ? 'candidate' : ''} ${step >= 4 && index === 3 ? 'focused' : ''}`}><span>{clip}</span><i aria-hidden="true"/></div>)}</div>
        <div className="s7-output"><span>观察结果</span><div className="s7-observation">{step < 3 ? '初步观察整段视频，尚未确定位置' : step === 3 ? '候选区间：片段 4' : step === 4 ? '在片段 4 提高观察精度' : '片段 4 出现蓝色标牌 · 证据已保留'}</div></div>
        <div className="s7-cost"><div><span>累计相对处理量</span><strong>{avpCost[step]} / 70</strong></div><div className="s7-cost-rail"><i style={{ width: `${avpCost[step] / 70 * 100}%` }}/></div></div>
      </section>}
    </div>
    <p className="s7-allocation-takeaway">通用 Caption 处理大量无关片段；AVP 先投入粗略观察，再将更高精度集中在候选区间，证据充分时停止。</p>
  </div>;
}

const metrics = {
  time: { name: '平均推理时间', unit: '秒', dvd: 790.5, avp: 145.3, max: 790.5, conclusion: '推理时间减少 81.6% · 约快 5.44 倍' },
  tokens: { name: '平均输入 Token', unit: 'K', dvd: 1071.6, avp: 132.5, max: 1071.6, conclusion: '输入 Token 减少 87.6%' },
  accuracy: { name: '准确率', unit: '%', dvd: 74.2, avp: 74.8, max: 100, conclusion: '准确率提升 0.6 个百分点' }
} as const;

export function S7Results({ onComplete }: Props) {
  const [metric, setMetric] = useState<Metric>('time');
  const [breakdown, setBreakdown] = useState(false);
  const data = metrics[metric];
  const choose = (value: Metric) => { setMetric(value); onComplete(); };
  return <div className="s7-results">
    <div className="s7-metric-tabs" role="group" aria-label="比较指标">
      {(['time', 'tokens', 'accuracy'] as const).map(value => <button key={value} type="button" aria-pressed={metric === value} onClick={() => choose(value)}>{metrics[value].name}</button>)}
    </div>
    <div className="s7-chart" aria-live="polite">
      <div className="s7-chart-head"><div><span>LVBench · DVD 与 AVP</span><h5>{data.name}</h5></div><span className="s7-unit">单位：{data.unit}</span></div>
      <div className="s7-chart-scale"><span>0</span><span>{data.max}{data.unit}</span></div>
      <div className="s7-chart-row"><div className="s7-chart-label">DVD</div><div className="s7-bar-field"><div className={`s7-bar s7-bar-dvd ${metric === 'time' && breakdown ? 'split' : ''}`} style={{ width: `${data.dvd / data.max * 100}%` }}>{metric === 'time' && breakdown && <><i className="s7-caption-part"/><i className="s7-other-part"/></>}</div></div><strong>{data.dvd}{data.unit}</strong></div>
      <div className="s7-chart-row"><div className="s7-chart-label">AVP</div><div className="s7-bar-field"><div className="s7-bar s7-bar-avp" style={{ width: `${data.avp / data.max * 100}%` }}/></div><strong>{data.avp}{data.unit}</strong></div>
      {metric === 'time' && <div className="s7-breakdown"><button type="button" aria-expanded={breakdown} onClick={() => setBreakdown(value => !value)}>{breakdown ? '收起 DVD 时间构成' : '展开 DVD 时间构成'} <span aria-hidden="true">{breakdown ? '−' : '+'}</span></button>{breakdown && <p><i className="s7-key-caption"/>Caption 阶段 637.2 秒（80.6%） <i className="s7-key-other"/>其他阶段约 153.3 秒</p>}</div>}
    </div>
    <p className="s7-result-conclusion">{data.conclusion}</p>
    <p className="s7-result-context">以上为 LVBench 中 DVD 与 AVP 的对比。同一视频回答多个问题时，DVD 的 Caption 可以复用，预处理成本可被摊薄。</p>
  </div>;
}

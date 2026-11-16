import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { RoomFrame } from './S1VideoLab';
import './s2-flow.css';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function useSequence(parts: number[], onComplete: () => void) {
  const ends = useRef(parts.reduce((a, b) => [...a, a[a.length - 1] + b], [0])).current;
  const total = ends[ends.length - 1];
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const callback = useRef(onComplete); callback.current = onComplete;
  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) { started.current = true; if (!reduced()) setPlaying(true); }
      if (!entries[0].isIntersecting) setPlaying(false);
    }, { threshold: .25 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => { setElapsed(v => Math.min(total, v + Math.min((now - previous) / 1000, .1))); previous = now; frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);
  useEffect(() => { if (elapsed >= total) { setPlaying(false); if (!completed.current) { completed.current = true; callback.current(); } } }, [elapsed, total]);
  const step = elapsed >= total ? parts.length - 1 : Math.max(0, ends.findIndex((end, i) => i > 0 && elapsed < end) - 1);
  const progress = Math.min(1, (elapsed - ends[step]) / parts[step]);
  return { host, elapsed, total, playing, step, progress,
    next: () => { setPlaying(false); setElapsed(ends[Math.min(step + 1, parts.length)]); },
    replay: () => { completed.current = false; started.current = true; setElapsed(0); setPlaying(!reduced()); },
    toggle: () => { started.current = true; if (elapsed >= total) { completed.current = false; setElapsed(0); setPlaying(true); } else setPlaying(v => !v); }
  };
}
function Controls({ clock, label }: { clock: ReturnType<typeof useSequence>; label: string }) {
  return <div className="s2-controls"><div className="s2-progress" role="progressbar" aria-label="演示进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clock.elapsed / clock.total * 100)}><span style={{ width: `${clock.elapsed / clock.total * 100}%` }}/></div><div className="s2-control-row"><strong>{label}</strong><div><button type="button" onClick={clock.toggle}>{clock.playing ? <Pause size={16}/> : <Play size={16}/>} {clock.playing ? '暂停' : '播放'}</button><button type="button" disabled={clock.elapsed >= clock.total} onClick={clock.next}><SkipForward size={16}/> 单步</button><button type="button" onClick={clock.replay}><RotateCcw size={16}/> 重播</button></div></div></div>;
}
function Track({ range, samples, time }: { range: [number, number]; samples: number[]; time: number }) {
  return <div className="s2-timeline" aria-label={`观察 ${range[0].toFixed(1)} 至 ${range[1].toFixed(1)} 秒`}><div className="s2-track"><span className="s2-range" style={{ left: `${range[0] / 8 * 100}%`, width: `${(range[1] - range[0]) / 8 * 100}%` }}/>{samples.map((point, i) => <i key={i} className="s2-sample" style={{ left: `${point / 8 * 100}%` }}/>)}<i className="s2-head" style={{ left: `${time / 8 * 100}%` }}/></div><div className="s2-track-labels"><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span></div></div>;
}
export function S2Flow({ onComplete }: { onComplete: () => void }) {
  const clock = useSequence([1.2, 1.5, 2.1, 1.5, 1.6, 1.7, 1.8], onComplete);
  const { step, progress } = clock;
  const time = step < 2 ? 3.15 : step === 2 ? 3.15 + .36 * progress : 3.51;
  const packet = step === 0 ? { left: 5 + progress * 18, drop: 0, text: '问题' } : step === 1 ? { left: 28 + progress * 30, drop: 0, text: '观察计划' } : step === 3 ? { left: progress < .5 ? 50 : 50 + (progress - .5) * 66, drop: 1 - Math.abs(progress * 2 - 1), text: '时间戳证据' } : null;
  return <div className="s2-lab" ref={clock.host}>
    <div className="s2-question"><span>问题</span><b>人物 A 是否把钥匙放在桌上？</b></div>
    <div className="s2-system">
      <div className="s2-journey" aria-hidden="true"><span/><span/></div>
      {packet && <div className="s2-packet" style={{ left: `${packet.left}%`, transform: `translate(-50%, calc(var(--s2-packet-drop) * ${packet.drop}))` }}>{packet.text}<i>→</i></div>}
      <div className="s2-module-row">
        <div className={`s2-module planner ${step <= 1 || step === 6 ? 'active' : ''}`}><span className="s2-module-number">01</span><b>Planner</b><p>决定下一步看什么</p><div className={`s2-plan-slip ${step >= 1 ? 'visible' : ''}`}>目标：桌边放置动作<br/>范围：2.2–5.4s</div></div>
        <div className={`s2-module observer ${step === 2 || step === 3 ? 'active' : ''}`}><span className="s2-module-number">02</span><b>Observer</b><p>获取视频证据</p><div className="s2-mini-video"><RoomFrame time={time} focus="handoff"/></div><span className="s2-mini-time">{time.toFixed(1)}s · 桌边片段</span></div>
        <div className={`s2-module reflector ${step >= 4 && step <= 5 ? 'active' : ''}`}><span className="s2-module-number">03</span><b>Reflector</b><p>判断是否足够</p><div className={`s2-verdict ${step >= 5 ? 'insufficient' : ''}`}>{step < 4 ? '等待证据' : step < 5 ? '检查动作证据…' : '缺少松开钥匙的画面'}</div></div>
      </div>
      <div className={`s2-evidence-lane ${step >= 4 ? 'filled' : ''}`}><b>Evidence List</b><span>{step >= 4 ? '03.3–03.5s · A 持钥匙靠近桌面' : '等待带时间戳的证据'}</span></div>
      <div className={`s2-feedback-loop ${step >= 5 ? 'active' : ''}`}><span>↶</span><div className="s2-feedback-line"><i style={{ right: step === 5 ? `${progress * 80}%` : step > 5 ? '80%' : '0%' }}/></div><b>{step >= 5 ? '证据缺口回到 Planner：缩小范围，细看手部' : '证据不足时反馈并重规划'}</b></div>
    </div>
    <Controls clock={clock} label={['问题进入 Planner', '计划流向 Observer', '读取对应视频', '证据进入 Evidence List', 'Reflector 检查', '缺口返回 Planner', 'Planner 更新下一轮目标'][step]}/>
  </div>;
}
export function S2Replan({ onComplete }: { onComplete: () => void }) {
  const clock = useSequence([1.3, 2, 1.6, 1.7, 2.3, 1.6], onComplete);
  const { step, progress } = clock;
  const narrowing = step === 3 ? progress : step > 3 ? 1 : 0;
  const range: [number, number] = [2.2 + 1.15 * narrowing, 5.4 - .65 * narrowing];
  const second = step >= 4;
  const time = step < 1 ? 2.4 : step === 1 ? 2.4 + progress * 1.08 : step < 4 ? 3.48 : step === 4 ? 3.45 + progress * 1.25 : 4.7;
  return <div className="s2-lab s2-replan" ref={clock.host}>
    <div className="s2-round-header"><strong>反馈改变下一次观察</strong><span>缺口：第一轮只看到靠近桌面，尚未看到手松开钥匙。</span></div>
    <div className="s2-round-comparison">
      <div className={`s2-round first ${step < 3 ? 'active' : ''}`}><header><span>第一轮 · 定位</span><b>宽范围 / 稀疏观察</b></header><div className="s2-round-scene"><RoomFrame time={3.48}/></div><Track range={[2.2, 5.4]} samples={[2.4, 3.05, 3.48, 4.8]} time={3.48}/><p>只看到 A 持钥匙靠近桌面。</p></div>
      <div className={`s2-round second ${second ? 'active' : ''}`}><header><span>第二轮 · 确认</span><b>缩小范围 / 连续细看</b></header><div className="s2-round-scene"><RoomFrame time={time} focus="handoff"/></div><Track range={range} samples={second ? [3.45, 3.75, 4.04, 4.22, 4.48, 4.7] : [2.4, 3.05, 3.48, 4.8]} time={time}/><p>{second ? '放大手部动作：钥匙与手分离，留在桌上。' : '反馈到达后，观察窗口将收缩至关键动作。'}</p></div>
    </div>
    <div className={`s2-round-evidence ${step >= 5 ? 'complete' : ''}`}><b>累计证据</b><span>03.3–03.5s · 持钥匙靠近桌面</span><span>{step >= 5 ? '03.5–04.7s · 松开钥匙，钥匙留在桌上 ✓' : '等待第二轮动作证据'}</span></div>
    <Controls clock={clock} label={['第一轮定位', '宽范围观察', '发现证据缺口', '反馈收缩观察范围', '放大并细看动作', '新证据加入累计结果'][step]}/>
  </div>;
}

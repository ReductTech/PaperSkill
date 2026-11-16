import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, ScanSearch } from 'lucide-react';
import './s10-limits.css';

type Props = { onComplete: () => void };

function Court({ shot, close }: { shot: boolean; close: boolean }) {
  return <div className={`s10-screen ${close ? 'is-close' : ''}`} role="img" aria-label={close ? '回放约 00:20：球员从三分线外投篮，篮球沿轨迹入筐' : shot ? '篮球比赛画面：一次已记录的三分投篮' : '篮球比赛画面：球员在场上移动'}>
    <div className="s10-broadcast"><b>HAWAII · UCSB</b><span>{close ? '约 00:20 · 局部回看' : '比赛片段 · 粗略扫描'}</span></div>
    <svg className="s10-court" viewBox="0 0 800 410" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><linearGradient id="s10Floor" x2="0" y2="1"><stop stopColor="#eab975"/><stop offset="1" stopColor="#ce8651"/></linearGradient></defs>
      <rect width="800" height="410" fill="#183047"/><rect x="18" y="46" width="764" height="340" rx="10" fill="url(#s10Floor)"/>
      <path d="M18 215H782 M400 46V386 M400 159a56 56 0 1 0 0 112a56 56 0 1 0 0-112 M18 135h112v160H18 M782 135H670v160h112 M18 79a172 172 0 0 1 0 272 M782 79a172 172 0 0 0 0 272" fill="none" stroke="#fff3df" strokeWidth="3" opacity=".85"/>
      <rect x="677" y="178" width="8" height="75" fill="#f1f7f9"/><path d="M675 213h-30" stroke="#f1f7f9" strokeWidth="6"/><ellipse cx="637" cy="215" rx="17" ry="5" fill="none" stroke="#f56f42" strokeWidth="5"/><path d="M621 218q16 38 32 0" fill="none" stroke="#f1f7f9" strokeWidth="2"/>
      <g fill="#224d85"><circle cx="240" cy="214" r="15"/><path d="M227 232h26l13 67h-52z"/><path d="M230 293l-23 58m42-58l25 58M228 246l-27 33m50-33l28 32" fill="none" stroke="#173659" strokeWidth="12" strokeLinecap="round"/></g>
      <g fill="#f4f8f9"><circle cx="412" cy="283" r="14"/><path d="M398 300h29l10 63h-49z"/><path d="M400 352l-15 31m28-31l18 31M397 309l-23 27m52-27l24 26" fill="none" stroke="#dfebee" strokeWidth="11" strokeLinecap="round"/></g>
      <g fill="#f4f8f9"><circle cx="537" cy="144" r="13"/><path d="M526 160h24l9 54h-42z"/><path d="M528 205l-17 35m32-35l18 35" fill="none" stroke="#dfebee" strokeWidth="10" strokeLinecap="round"/></g>
      <g fill="#244f86"><circle cx="330" cy="104" r="13"/><path d="M318 120h25l10 59h-44z"/><path d="M320 168l-15 38m33-38l18 38" fill="none" stroke="#173659" strokeWidth="10" strokeLinecap="round"/></g>
      {(shot || close) && <g className="s10-shot"><path d="M275 174 Q460 8 634 204" fill="none" stroke={close ? '#ff7448' : '#f7f0b4'} strokeWidth="6" strokeDasharray="12 10"/><circle cx="634" cy="203" r="13" fill="#ea713a" stroke="#6c3a22" strokeWidth="3"/><path d="M622 203h24m-12-12v24" stroke="#783b21" strokeWidth="2"/></g>}
      {close && <circle cx="637" cy="214" r="54" fill="none" stroke="#ff764a" strokeWidth="5" className="s10-hoop-ring"/>}
    </svg>
    <div className="s10-scorebar"><span>HAWAII</span><b>vs</b><span>UCSB</span><i>{close ? '三分线外 → 命中' : shot ? '三分球 · 进球画面' : '寻找三分球事件'}</i></div>
  </div>;
}

export function S10Replay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [inspecting, setInspecting] = useState(false);
  const [replayBeat, setReplayBeat] = useState(0);
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
    if (!playing || inspecting || step >= 6) return;
    const timer = window.setTimeout(() => setStep(value => value + 1), 1150);
    return () => window.clearTimeout(timer);
  }, [playing, inspecting, step]);
  useEffect(() => { if (step === 6) onComplete(); }, [step, onComplete]);
  const count = inspecting ? 2 : step < 2 ? 0 : step < 4 ? 1 : 2;
  const inspect = () => { setInspecting(true); setPlaying(false); setReplayBeat(value => value + 1); onComplete(); };
  const restart = () => { setStep(0); setInspecting(false); setPlaying(true); };
  return <div className="s10-replay" ref={root}>
    <p className="s10-query"><span>计数问题</span>在第二段 Hawaii 对 UCSB 的比赛片段出现之前，一共投进了多少个三分球？</p>
    <div className="s10-video-layout">
      <div className="s10-video-main" key={inspecting ? replayBeat : 'scan'}><Court shot={step === 2 || step === 4} close={inspecting}/></div>
      <div className="s10-observer" aria-live="polite"><div className="s10-observer-head"><span>Observer 已记录</span><strong>{count}<small>次</small></strong></div><div className="s10-observer-list"><div className={count >= 1 ? 'seen' : ''}><b>01</b><span>{count >= 1 ? '三分球事件 · 片段证据' : '等待观察'}</span></div><div className={count >= 2 ? 'seen' : ''}><b>02</b><span>{count >= 2 ? '三分球事件 · 片段证据' : '等待观察'}</span></div></div><div className="s10-observer-end">{inspecting ? '局部回看发现：还有一次投篮未进入这份证据。' : step >= 6 ? 'Reflector 接收两条证据 → Confidence 0.8 → 回答 2' : step >= 5 ? '两条证据已送交 Reflector' : '整段视频 · 0.5 FPS · Low'}</div></div>
    </div>
    <div className="s10-timeline" aria-label={inspecting ? '事件时间轴：两次已记录，一次约 00:20 遗漏，随后进入第二段比赛片段' : 'Observer 视角时间轴：两次已记录，随后进入第二段比赛片段'}><div className="s10-track"><span className="s10-track-fill" style={{ width: inspecting ? '100%' : `${Math.min(100, step * 17)}%` }}/><i className={`s10-mark first ${count >= 1 ? 'visible' : ''}`} title="已记录事件 1"/><i className={`s10-mark second ${count >= 2 ? 'visible' : ''}`} title="已记录事件 2"/>{inspecting && <i className="s10-mark missing" title="约 00:20 遗漏的三分球"/>}<i className="s10-boundary" title="第二段 Hawaii–UCSB 比赛片段起点"/></div><div className="s10-track-labels"><span>开始</span><span>{inspecting ? '约 00:20 · 漏掉的三分球' : '粗略扫描中'}</span><span>第二段 Hawaii–UCSB 起点</span></div></div>
    <div className="s10-controls"><div><button type="button" onClick={() => { if (inspecting || step >= 6) { restart(); return; } setPlaying(value => !value); }} aria-label={playing && step < 6 ? '暂停自动演示' : inspecting || step >= 6 ? '重新播放自动演示' : '继续自动演示'}>{playing && step < 6 ? <Pause size={18}/> : <Play size={18}/>}<span>{playing && step < 6 ? '暂停' : inspecting || step >= 6 ? '重新播放' : '继续'}</span></button><button type="button" onClick={restart} aria-label="重播粗略扫描"><RotateCcw size={18}/><span>重播</span></button></div><button className="s10-inspect-btn" type="button" onClick={inspect}><ScanSearch size={19}/>{inspecting ? '再次回看约 00:20' : '检查遗漏事件'}</button></div>
    {inspecting && <p className="s10-discovery" aria-live="polite">局部回放显示约 00:20 的短暂三分球。完整记录为 <strong>3 次</strong>；原来的 Observer 证据仍只有 2 次。</p>}
  </div>;
}

export function S10Evidence({ onComplete }: Props) {
  const [view, setView] = useState<'model' | 'full'>('model');
  const showFull = view === 'full';
  return <div className="s10-evidence">
    <div className="s10-view-toggle" role="group" aria-label="证据视角"><button type="button" className={!showFull ? 'active' : ''} aria-pressed={!showFull} onClick={() => setView('model')}>模型视角</button><button type="button" className={showFull ? 'active' : ''} aria-pressed={showFull} onClick={() => { setView('full'); onComplete(); }}>完整事件视角</button></div>
    <div className="s10-evidence-panes"><section className={`s10-evidence-pane model ${showFull ? 'dimmed' : 'focused'}`}><h5>模型看到的证据</h5><div className="s10-event-row"><b>01</b><span>Observer 记录的三分球</span><i>已获得</i></div><div className="s10-event-row"><b>02</b><span>Observer 记录的三分球</span><i>已获得</i></div><div className="s10-gap" aria-hidden="true">证据列表到此结束</div><div className="s10-result"><span>Reflector · Confidence 0.8</span><strong>AVP Answer = 2</strong></div></section><section className={`s10-evidence-pane full ${showFull ? 'focused' : 'dimmed'}`}><h5>完整事件记录</h5><div className="s10-event-row"><b>01</b><span>三分球事件</span><i>命中</i></div><div className={`s10-event-row missed ${showFull ? 'revealed' : ''}`}><b>{showFull ? '02' : '·'}</b><span>{showFull ? '约 00:20 · 粗略观察遗漏' : '切换视角，检查证据空白'}</span><i>{showFull ? '命中' : '未展开'}</i></div><div className="s10-event-row"><b>{showFull ? '03' : '02'}</b><span>三分球事件</span><i>命中</i></div><div className="s10-result"><span>第二段比赛片段出现之前</span><strong>{showFull ? 'Ground Truth = 3' : '完整计数待查看'}</strong></div></section></div>
    <div className="s10-causal"><span>粗略观察遗漏事件</span><b>→</b><span>Observer 证据不完整</span><b>→</b><span>Reflector 高置信度停止</span><b>→</b><span>答案错误</span></div>
    <p className="s10-principle">模型可以对已获得的证据进行合理推理，却不一定知道还有哪些关键事件没有被观察到。</p>
    {showFull && <button className="s10-revisit" type="button" onClick={() => { document.querySelector('.s10-replay')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); onComplete(); }}>↑ 回看约 00:20 的投篮画面</button>}
  </div>;
}

export function S10Research({ onComplete }: Props) {
  useEffect(() => { onComplete(); }, [onComplete]);
  return <div className="s10-research"><div className="s10-research-columns"><section><h5>AVP 做到了什么</h5><ul><li>根据问题主动决定观察目标、时间与粒度</li><li>从视频像素累积带时间戳的证据</li><li>反思证据是否足够，并动态重新规划</li><li>在长视频问答基准上提升效率与准确率</li></ul></section><section><h5>还需解决什么</h5><ul><li>短暂事件和细微画面可能在稀疏观察中遗漏</li><li>证据缺口可能让一致的推理产生高置信度错误</li><li>当前规划与观察由提示词驱动，学习型策略值得探索</li><li>主要评估于完整视频可用的离线问答；在线、具身实时感知仍待扩展</li></ul></section></div><div className="s10-final-line">AVP 的关键，不是一次处理更多视频，而是根据问题主动决定何时、何处、以何种方式继续观察。</div></div>;
}

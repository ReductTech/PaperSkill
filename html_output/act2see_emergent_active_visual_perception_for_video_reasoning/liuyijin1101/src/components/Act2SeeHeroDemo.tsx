import { useEffect, useRef, useState } from 'react';
import '../styles/act2see-hero-demo.css';

// One clock drives both sides. The scenes illustrate the paper's question, not a model log.
const PHASE_STARTS = [0, 2500, 5200, 7600, 10200, 13200, 16000, 19700, 20400] as const;
const CYCLE_MS = PHASE_STARTS[PHASE_STARTS.length - 1];
const FRAME_TIMES = ['0:01', '0:04', '0:06'] as const;
type SceneVariant = 'arrival' | 'window' | 'platform' | 'booth';
type Side = 'old' | 'new';

function phaseAt(time: number) {
  const phase = PHASE_STARTS.findIndex((start, index) => index < PHASE_STARTS.length - 1 && time >= start && time < PHASE_STARTS[index + 1]);
  const index = phase < 0 ? 0 : phase;
  return { index, progress: (time - PHASE_STARTS[index]) / (PHASE_STARTS[index + 1] - PHASE_STARTS[index]) };
}

function StationScene({ variant }: { variant: SceneVariant }) {
  const evening = variant === 'platform' || variant === 'booth';
  const booth = variant === 'booth';
  const arrival = variant === 'arrival';
  return <svg className="a2s-scene-svg" viewBox="0 0 320 164" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect width="320" height="164" fill={evening ? '#e7e3df' : '#dcecf2'}/>
    <rect y="70" width="320" height="94" fill="#d8dce1"/>
    <path d="M0 39H320V55H0Z" fill="#607282"/>
    <path d="M0 56H320V62H0Z" fill="#aeb9c3"/>
    <path d="M0 62H320" stroke="#718599" strokeWidth="2"/>
    <path d="M31 55V120M154 55V119M305 55V120" stroke="#758697" strokeWidth="5"/>
    <path d="M0 125H320V164H0Z" fill="#bfc7ca"/>
    <path d="M0 131H320" stroke="#f9f0bf" strokeWidth="4"/>
    <path d="M0 153H320" stroke="#697783" strokeWidth="3"/>
    <path d="M0 161H320" stroke="#697783" strokeWidth="2"/>
    <rect x="83" y="61" width="55" height="16" rx="2" fill="#fbfcf8" stroke="#9aabb7"/>
    <text x="110" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill="#415466">站台</text>
    <circle cx="274" cy="69" r="9" fill="#fbfbf6" stroke="#8798a7" strokeWidth="2"/>
    <path d="M274 69V64M274 69L278 71" stroke="#52677b" strokeWidth="1.5"/>
    {arrival ? <g>
      <path d="M-8 80H225Q246 80 252 100V132H-8Z" fill="#eff3f5" stroke="#788c9e" strokeWidth="2"/>
      <path d="M0 90H212Q228 90 233 108V113H0Z" fill="#7fa3b9"/>
      <path d="M69 89V130M146 89V130" stroke="#7890a0" strokeWidth="3"/>
      <rect x="234" y="119" width="8" height="5" rx="2" fill="#f1ad6d"/>
      <path d="M17 132H240" stroke="#56718a" strokeWidth="4"/>
    </g> : <g>
      <rect x="0" y="82" width={booth ? '142' : '194'} height="48" rx="3" fill="#edf2f3" stroke="#8396a6" strokeWidth="2"/>
      <rect x="0" y="88" width={booth ? '142' : '194'} height="22" fill="#83a5b9"/>
      <path d="M42 84V130M91 84V130M139 84V130" stroke="#748c9f" strokeWidth="3"/>
      <path d="M0 126H194" stroke="#4c718e" strokeWidth="4"/>
      <rect x="172" y="106" width="7" height="4" rx="1" fill="#f0b46d"/>
    </g>}
    {variant === 'window' && <g>
      <path d="M0 0H26V164H0ZM294 0H320V164H294Z" fill="#526577"/>
      <path d="M0 0H320V16H0Z" fill="#526577"/>
      <path d="M18 144H302V164H18Z" fill="#607486"/>
      <path d="M27 136H294" stroke="#d3dce0" strokeWidth="3"/>
    </g>}
    {!booth && <g>
      <circle cx={arrival ? '284' : '244'} cy="100" r="7" fill="#e7b58b"/>
      <path d={arrival ? 'M278 108H290L295 130H274Z' : 'M238 108H250L254 130H234Z'} fill="#607c93"/>
      <path d={arrival ? 'M279 130L276 145M288 130L291 145' : 'M240 130L237 145M249 130L252 145'} stroke="#495a6d" strokeWidth="4"/>
      <rect x={arrival ? '296' : '258'} y="117" width="12" height="15" rx="2" fill="#a77855"/>
    </g>}
    {booth && <g>
      <circle cx="146" cy="104" r="6" fill="#e4b48f"/>
      <path d="M141 110H151L155 131H137Z" fill="#617b92"/>
      <path d="M142 131L139 146M151 131L154 146" stroke="#47596c" strokeWidth="3"/>
      <rect x="163" y="107" width="51" height="9" rx="2" fill="#8d684d"/>
      <path d="M168 116L174 140H207L212 116" fill="#a78260" stroke="#7d604c" strokeWidth="2"/>
      <path d="M175 108L174 94M184 109L183 91M193 108L197 92M205 108L207 97" stroke="#548765" strokeWidth="2"/>
      <circle cx="174" cy="93" r="5" fill="#ec8d9a"/><circle cx="182" cy="89" r="5" fill="#f2be59"/>
      <circle cx="196" cy="92" r="5" fill="#e9929e"/><circle cx="207" cy="96" r="5" fill="#f6c26d"/>
      <circle cx="186" cy="98" r="4" fill="#f2b1bd"/><circle cx="200" cy="101" r="4" fill="#f1b75f"/>
      <rect x="224" y="72" width="65" height="72" rx="3" fill="#222b33" stroke="#141d27" strokeWidth="3"/>
      <rect x="230" y="81" width="53" height="40" fill="#c9d5d7" stroke="#64727b" strokeWidth="2"/>
      <path d="M256 81V121" stroke="#34414d" strokeWidth="3"/>
      <path d="M239 89H249V105H239Z" fill="#414f59"/>
      <path d="M239 86Q244 82 249 86" stroke="#414f59" strokeWidth="2" fill="none"/>
      <rect x="228" y="126" width="57" height="12" fill="#303d48"/>
      <text x="256" y="79" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f5f3e9">电话亭</text>
    </g>}
  </svg>;
}

function Panel({ side, time, reducedMotion }: {
  side: Side;
  time: number;
  reducedMotion: boolean;
}) {
  const { index: phase, progress } = phaseAt(time);
  const isNew = side === 'new';
  const videoProgress = phase < 2 ? progress : 1;
  const scene: SceneVariant = isNew && phase >= 5 ? 'booth' : videoProgress < .34 ? 'arrival' : videoProgress < .68 ? 'window' : 'platform';
  const sampled = phase === 0 ? 0 : phase === 1 ? Math.min(3, Math.floor(progress * 4)) : 3;
  const readingFrame = phase === 2 ? Math.min(2, Math.floor(progress * 3)) : -1;
  const newFrame = isNew && phase >= 5;
  const playhead = phase < 2 ? 12 + videoProgress * 56 : phase === 4 ? 68 + progress * 17 : phase >= 5 ? 85 : 68;
  const fade = reducedMotion ? 1 : phase === 7 ? 1 - progress : phase === 0 ? Math.min(1, time / 420) : 1;
  const state = phase === 0 ? ['视频开始', '列车驶入同一座车站']
    : phase === 1 ? ['固定取帧', '两边同时抽取 0:01、0:04、0:06']
      : phase === 2 ? ['同一问题', '先查看已经取出的画面']
        : phase === 3 ? ['发现缺口', '三张帧里看不到黑色电话亭']
          : !isNew ? phase === 5 ? ['没有补帧', '视频到 0:08，模型仍只有三张帧'] : ['证据不足', '无法可靠确定电话亭左侧的物体']
            : phase === 4 ? ['主动检索', '<retrieve> 晚间站台 · 黑色电话亭']
              : phase === 5 ? ['返回画面', '0:08 的新帧补入已有证据']
                : ['继续回答', '电话亭左侧是花卉陈列架'];

  return <div className={`bg-side ${side}`}>
    <div className="bg-side-head">{isNew ? '本文方法' : '传统方法'}</div>
    <div className="bg-side-canvas">
      <div className="a2s-demo" data-side={side} data-phase={phase}>
        <div className="a2s-animated" style={{ opacity: fade }}>
          <div className={`a2s-scene ${newFrame ? 'a2s-scene-found' : ''}`} aria-label={newFrame ? '新画面：黑色电话亭左侧有花卉陈列架' : '车站视频画面，尚未出现电话亭'}>
            <StationScene variant={scene}/>
            <span className="a2s-scene-caption">{newFrame ? '新画面 · 0:08' : !isNew && phase >= 5 ? '模型仍见 0:06' : phase === 0 ? '原视频播放中' : '初始视频片段'}</span>
          </div>
          <div className="a2s-timeline" aria-label={isNew && phase >= 4 ? '同一原视频时间轴；Act2See 检索至 0:08' : '同一原视频时间轴；固定取帧位置为 0:01、0:04、0:06'}>
            <div className="a2s-timeline-track">
              {[12, 40, 68].map(position => <span className="a2s-timeline-mark" style={{ left: `${position}%` }} key={position}/>)}
              <span className={`a2s-timeline-target ${isNew && phase >= 4 ? 'is-targeted' : ''}`} style={{ left: '85%' }}/>
              <span className={`a2s-playhead ${isNew && phase >= 4 ? 'is-seeking' : ''}`} style={{ left: `${playhead}%` }}/>
            </div>
            <div className="a2s-time-labels"><span>0:01</span><span>0:04</span><span>0:06</span><span>0:08</span></div>
          </div>
          <div className="a2s-frames" aria-label={`初始固定取帧 ${sampled} 张${newFrame ? '，另补入 0:08 新帧' : ''}`}>
            {FRAME_TIMES.map((label, index) => <div className={`a2s-frame ${index < sampled ? 'is-sampled' : ''} ${index === readingFrame ? 'is-being-read' : ''}`} key={label} aria-label={`${label} 初始取帧`}>
              <StationScene variant={(['arrival', 'window', 'platform'] as const)[index]}/><span>{label}</span>
            </div>)}
            <div className={`a2s-frame a2s-extra-frame ${newFrame ? 'is-found' : ''}`} aria-label={newFrame ? '0:08 新增的关键帧' : '0:08 尚未取帧'}>
              {newFrame ? <StationScene variant="booth"/> : <span className="a2s-frame-empty">＋</span>}<span>{newFrame ? '新帧 0:08' : '未取帧'}</span>
            </div>
          </div>
          <div className={`a2s-question ${phase >= 2 ? 'is-visible' : ''}`}>晚间列车停靠时，黑色电话亭左侧是什么？</div>
          <div className={`a2s-result ${isNew && phase === 4 ? 'is-action' : ''} ${isNew && phase >= 6 ? 'is-answer' : ''}`} aria-live={isNew ? 'polite' : 'off'}>
            <strong>{state[0]}</strong><span>{state[1]}</span>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

export function Act2SeeHeroDemo() {
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [time, setTime] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? PHASE_STARTS[6] + 100 : 0);
  const timeRef = useRef(time);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      const reduced = media.matches;
      setReducedMotion(reduced);
      const nextTime = reduced ? PHASE_STARTS[6] + 100 : 0;
      timeRef.current = nextTime;
      setTime(nextTime);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let timer = 0;
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      timeRef.current = (timeRef.current + now - lastTick) % CYCLE_MS;
      lastTick = now;
      setTime(timeRef.current);
    };
    const onVisibility = () => {
      window.clearInterval(timer);
      if (!document.hidden) {
        lastTick = performance.now();
        timer = window.setInterval(tick, 50);
      }
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [reducedMotion]);

  return <div className="hero-compare" aria-label="同一车站视频中，固定帧与主动视觉获取的教学对照">
    <Panel side="old" time={time} reducedMotion={reducedMotion}/><Panel side="new" time={time} reducedMotion={reducedMotion}/>
  </div>;
}

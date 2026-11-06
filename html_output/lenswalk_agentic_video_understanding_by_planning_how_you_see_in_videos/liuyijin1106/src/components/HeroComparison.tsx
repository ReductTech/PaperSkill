import { useEffect, useState } from 'react';

const CYCLE_MS = 7400;
const FIXED_PREVIEW = [.25, .75, .95];
const DETAIL = [.46, .52, .60];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, p: number) => a + (b - a) * clamp(p);
const stamp = (t: number) => `00:${(t * 10).toFixed(1).padStart(4, '0')}`;

// Full video and thumbnails use the same deterministic scene.
function Scene({ time, label, compact = false }: { time: number; label: string; compact?: boolean | 'detail' }) {
  const depart = clamp((time - .62) / .33);
  const x = time < .62 ? mix(32, 123, time / .38) : mix(123, 193, depart);
  const reach = clamp((time - .38) / .08);
  const handX = x + mix(18, 42, reach) - 18 * depart;
  const handY = time < .54 ? mix(69, 66, reach) : mix(66, 45, (time - .54) / .08);
  const holding = time >= .52;
  return <svg className="lw-scene" viewBox={compact === 'detail' ? '95 20 135 88' : compact ? '70 19 170 89' : '0 0 240 116'} role="img" aria-label={label}>
    <rect width="240" height="116" fill="#f7f9fc"/>
    <path d="M0 94H240" stroke="#c8d4e2" strokeWidth="2"/>
    <rect x="134" y="73" width="92" height="8" rx="2" fill="#b78259"/>
    <path d="M143 81v14m75-14v14" stroke="#9a6846" strokeWidth="5" strokeLinecap="round"/>
    <circle cx={x} cy="42" r="10" fill="#e9b995" stroke="#735f58" strokeWidth="1.5"/>
    <path d={`M${x} 52v27m0-15-14 13m0 2-11 17m11-17 11 17`} fill="none" stroke="#385a7c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d={`M${x + 2} 60L${handX} ${handY}`} fill="none" stroke="#385a7c" strokeWidth="7" strokeLinecap="round"/>
    <circle cx={handX} cy={handY} r="3.8" fill="#e9b995"/>
    <g transform={`translate(${holding ? handX : 165} ${holding ? handY : 66}) rotate(${holding ? -20 : 0})`}>
      <circle cx="0" cy="0" r="4" fill="none" stroke="#c48b26" strokeWidth="2.5"/>
      <path d="M4 0h15m-5 0v4m4-4v3" stroke="#c48b26" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  </svg>;
}

function Frames({ times, count, detailed }: { times: number[]; count: number; detailed: boolean }) {
  return <div className={`lw-frames ${detailed ? 'lw-detail-frames' : ''}`} aria-label={detailed ? '重新观察原视频得到的接触、抓握和抬起帧' : '预先固定采样的动作前后帧'}>
    {times.map((time, i) => <div className={`lw-frame ${i < count ? 'shown' : ''}`} key={time}>
      <Scene time={time} compact={detailed ? 'detail' : true} label={`原视频 ${stamp(time)} 的画面`}/><span>{stamp(time)}</span>
    </div>)}
  </div>;
}

export function HeroComparison() {
  const [reduced, setReduced] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      setReduced(media.matches);
      setElapsed(0);
      if (!media.matches) {
        const start = performance.now();
        const tick = (now: number) => {
          setElapsed((now - start) % CYCLE_MS);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }
    };
    update();
    media.addEventListener('change', update);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', update); };
  }, []);
  const sec = elapsed / 1000;
  const playing = !reduced && sec < 3.45;
  const videoTime = reduced ? .52 : playing ? clamp(sec / 3.45) : .25;
  const sampling = reduced || sec >= 3.45;
  const focused = reduced || sec >= 4.75;
  const detailed = reduced || sec >= 5.35;
  const detailCount = reduced ? 3 : Math.min(3, Math.floor((sec - 5.35) / .32) + 1);
  const result = reduced || sec >= 6.35;
  return <>
    <div className="hero-compare lw-compare" aria-label="同一原始视频的固定采样与主动重新观察教学对比">
      {(['fixed', 'active'] as const).map(method => {
        const active = method === 'active';
        return <div className={`bg-side ${active ? 'new' : 'old'}`} key={method}>
          <div className="bg-side-head">{active ? '本文方法' : '传统方法'}</div>
          <div className="bg-side-canvas lw-demo-canvas">
            <div className="lw-video">
              <Scene time={videoTime} label={`同一原始视频 ${stamp(videoTime)} 的画面`}/>
              <span className="lw-video-label">同一原始视频</span>
              {sampling && <Frames times={active && detailed ? DETAIL : FIXED_PREVIEW} count={active && detailed ? detailCount : 3} detailed={active && detailed}/>}
            </div>
            <div className="lw-timeline"><span>00:00</span><div className="lw-track">
              {active && focused && <i className="lw-window"/>}
              {sampling && FIXED_PREVIEW.map(time => <i className="lw-tick" style={{ left: `${time * 100}%` }} key={time}/>)}
              {active && detailed && DETAIL.map(time => <i className="lw-tick lw-new-tick" style={{ left: `${time * 100}%` }} key={time}/>)}
              {playing && <i className="lw-playhead" style={{ left: `${videoTime * 100}%` }}/>}
            </div><span>00:10</span></div>
          </div>
          <div className={`bg-side-tag lw-result ${result ? 'visible' : ''}`} aria-live="off">{active ? '重新观察，补充关键证据' : '关键动作未被采样覆盖'}</div>
        </div>;
      })}
    </div>
  </>;
}

import React, { useEffect, useId, useRef, useState } from 'react';

const patterns = [[16, 30, 21, 36], [31, 18, 35, 24], [24, 36, 15, 29]];

/** The cards show prompt connectivity, never feature geometry or predicted accuracy. */
export function MapleCoverScene() {
  const [coupled, setCoupled] = useState(true);
  const [edition, setEdition] = useState(0);
  const [running, setRunning] = useState(false);
  const [reduced, setReduced] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  const id = (part: string) => `maple-cover-${uid}-${part}`;

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let visible = false;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const refresh = () => { setReduced(preference.matches); setRunning(visible && !document.hidden && !preference.matches); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); }, { threshold: 0.08 });
    observer.observe(element);
    preference.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
    refresh();
    return () => { observer.disconnect(); preference.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const values = patterns[edition];
  return (
    <div className="maple-cover-exhibit" ref={host} data-running={running} data-coupled={coupled} data-reduced={reduced}>
      <div className="maple-cover-exhibit-head"><span>THE PROMPT STUDIO</span><span className="maple-cover-live"><i /> 可交互结构示意</span></div>
      <svg className="maple-cover-scene" viewBox="0 0 720 535" role="img" aria-label={coupled ? 'MaPLe：文字提示 P 经映射 F 派生视觉提示，照片像素保持不变' : 'CoOp：仅有文字侧可学习提示，未加入视觉提示'}>
        <defs>
          <linearGradient id={id('photo')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5e3e7"/><stop offset=".5" stopColor="#ecd1d9"/><stop offset="1" stopColor="#d5b7c6"/></linearGradient>
          <linearGradient id={id('leaf')} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#b45c73"/><stop offset=".5" stopColor="#9d3f60"/><stop offset="1" stopColor="#632d4d"/></linearGradient>
          <linearGradient id={id('card')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#fff7fa"/></linearGradient>
          <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".94"/><stop offset="1" stopColor="#f4e4ee" stopOpacity=".88"/></linearGradient>
          <radialGradient id={id('glow')}><stop stopColor="#edcedb" stopOpacity=".7"/><stop offset="1" stopColor="#edcedb" stopOpacity="0"/></radialGradient>
          <filter id={id('shadow')} x="-45%" y="-35%" width="200%" height="210%"><feDropShadow dx="0" dy="19" stdDeviation="18" floodColor="#79435d" floodOpacity=".12"/><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#79435d" floodOpacity=".05"/></filter>
          <filter id={id('leafshadow')} x="-40%" y="-30%" width="180%" height="190%"><feDropShadow dx="4" dy="10" stdDeviation="6" floodColor="#57223c" floodOpacity=".15"/></filter>
          <pattern id={id('grain')} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="#fff" opacity=".38"/><circle cx="5" cy="4" r=".45" fill="#79435d" opacity=".09"/></pattern>
          <marker id={id('arrow')} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L8 5 L1 9" fill="none" stroke="#9b74b4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></marker>
        </defs>

        <ellipse cx="363" cy="270" rx="316" ry="250" fill={`url(#${id('glow')})`}/>
        <ellipse cx="351" cy="290" rx="262" ry="183" transform="rotate(-20 351 290)" fill="none" stroke="#e9d6e0" strokeWidth="1" strokeDasharray="3 7"/>
        <path d="M65 454 H650" stroke="#e7d7df" strokeWidth="1"/>
        <text x="71" y="484" className="maple-cover-svg-micro">IMAGE × LANGUAGE</text>
        <text x="647" y="484" textAnchor="end" className="maple-cover-svg-micro">A CONNECTED WAY TO ADAPT</text>

        <g className="maple-cover-photo-float"><g transform="rotate(-8 211 238)">
          <rect x="70" y="70" width="282" height="336" rx="11" fill={`url(#${id('card')})`} stroke="#fff" strokeWidth="2" filter={`url(#${id('shadow')})`}/>
          <rect x="85" y="85" width="252" height="238" rx="5" fill={`url(#${id('photo')})`}/>
          <rect x="85" y="85" width="252" height="238" rx="5" fill={`url(#${id('grain')})`}/>
          <path d="M94 310 C154 225 249 206 324 103" fill="none" stroke="#ffffff" strokeWidth="1" opacity=".33"/>
          <g transform="translate(210 207) rotate(-12)" filter={`url(#${id('leafshadow')})`}>
            <path d="M0 -107 L18 -62 L41 -81 L37 -34 L87 -49 L70 -9 L100 3 L56 26 L66 51 L17 43 L1 67 L-17 43 L-67 51 L-57 25 L-101 4 L-73 -11 L-89 -49 L-38 -34 L-41 -81 L-18 -62 Z" fill={`url(#${id('leaf')})`} stroke="#8b405b" strokeWidth=".7"/>
            <path d="M0 -100 L1 68 C3 84 9 95 17 109 M0 35 L-70 -38 M0 35 L70 -38 M0 15 L-34 -65 M0 15 L34 -65 M0 40 L-58 43 M0 40 L58 43 M-29 5 L-69 6 M29 5 L69 6" fill="none" stroke="#e8b0b4" strokeWidth="1.35" strokeLinecap="round" opacity=".8"/>
            <path d="M-14 -43 L-29 -44 M15 -43 L30 -44 M-44 -10 L-65 -17 M43 -10 L64 -17 M-36 41 L-47 30 M35 41 L46 30" fill="none" stroke="#d894a2" strokeWidth=".7" opacity=".8"/>
          </g>
          <text x="91" y="348" className="maple-cover-svg-micro">SPECIMEN No. 001</text>
          <text x="91" y="376" className="maple-cover-svg-cardtitle">同一张图片</text>
          <g transform="translate(306 354)"><rect x="-6" y="7" width="14" height="12" rx="3" fill="none" stroke="#aa8595" strokeWidth="1.5"/><path d="M-3 7 V3 A4 4 0 0 1 5 3 V7" fill="none" stroke="#aa8595" strokeWidth="1.5"/></g>
        </g></g>

        <g className="maple-cover-type-float"><g transform="rotate(6 512 323)">
          <rect x="390" y="210" width="268" height="233" rx="12" fill={`url(#${id('card')})`} stroke="#fff" strokeWidth="2" filter={`url(#${id('shadow')})`}/>
          <text x="414" y="240" className="maple-cover-svg-micro">LANGUAGE / 文字侧</text>
          <text x="414" y="276" className="maple-cover-svg-cardtitle">Prompt, then a name.</text>
          <rect x="414" y="294" width="220" height="61" rx="8" fill="#f7ebf1" stroke="#ecd6e1"/>
          <text x="429" y="332" fill="#9e456a" fontSize="22" fontFamily="Georgia,serif" fontStyle="italic">P</text>
          {values.map((v, i) => <rect key={i} className="maple-cover-vector-bar" x={460+i*35} y={341-v} width="23" height={v} rx="3" fill={['#9e456a','#bd718e','#a95879','#d098ae'][i]}/>)}
          <line x1="414" y1="376" x2="634" y2="376" stroke="#ebdce3"/>
          <text x="414" y="401" className="maple-cover-svg-micro">类别名称</text>
          <text x="634" y="402" textAnchor="end" fill="#624353" fontSize="16" fontFamily="Georgia,serif" fontStyle="italic">maple leaf</text>
        </g></g>

        <g className="maple-cover-coupling" opacity={coupled ? 1 : 0}>
          <path d="M428 306 C398 288 417 190 382 179" fill="none" stroke="#9b74b4" strokeWidth="1.7" markerEnd={`url(#${id('arrow')})`}/>
          <path d="M325 185 C298 229 383 350 320 388" fill="none" stroke="#9b74b4" strokeWidth="1.7" markerEnd={`url(#${id('arrow')})`}/>
          {coupled && running && <><circle r="3.3" fill="#9b74b4"><animateMotion dur="3.2s" repeatCount="indefinite" path="M428 306 C398 288 417 190 382 179"/></circle><circle r="3.3" fill="#9b74b4"><animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" path="M325 185 C298 229 383 350 320 388"/></circle></>}
          <circle cx="352" cy="173" r="34" fill={`url(#${id('glass')})`} stroke="#d4bddd" filter={`url(#${id('shadow')})`}/>
          <circle cx="352" cy="173" r="26" fill="none" stroke="#e4d4ea"/>
          <text x="352" y="183" textAnchor="middle" fontFamily="Georgia,serif" fontStyle="italic" fontSize="30" fill="#8a60a3">F</text>
          <text x="352" y="123" textAnchor="middle" className="maple-cover-svg-micro">学习到的耦合映射</text>
        </g>

        <g className="maple-cover-prompt-float">
          <rect x="145" y="390" width="224" height="76" rx="11" fill={coupled ? '#f3faf6' : '#faf6f8'} stroke={coupled ? '#c7ddd2' : '#e4d8df'} filter={`url(#${id('shadow')})`}/>
          <text x="162" y="414" className="maple-cover-svg-micro" fill={coupled ? '#5d8679' : '#a08693'}>{coupled ? '视觉侧提示 · F(P)' : 'CoOp · 未加入视觉提示'}</text>
          {coupled ? values.map((v, i) => <rect key={i} className="maple-cover-vector-bar" x={164+i*47} y={429} width={21+v*.42} height="14" rx="3" fill={['#4f8c7c','#7cac9e','#699d8c','#97bdaf'][i]}/>) : <path d="M164 438 H345" stroke="#d4c2cc" strokeWidth="2" strokeDasharray="4 7"/>}
        </g>
        <g transform="translate(551 112)"><path d="M0 -14 V14 M-14 0 H14 M-10 -10 L10 10 M-10 10 L10 -10" stroke="#b57694" strokeWidth="1.3"/><circle r="25" fill="none" stroke="#e8d4df"/></g>
      </svg>
      <div className="maple-cover-control-panel">
        <div className="maple-cover-mode" role="group" aria-label="选择封面方法"><button type="button" aria-pressed={!coupled} onClick={() => setCoupled(false)}>CoOp<span>单侧提示</span></button><button type="button" aria-pressed={coupled} onClick={() => setCoupled(true)}>MaPLe<span>双侧耦合</span></button></div>
        <button type="button" className="maple-cover-edit" onClick={() => setEdition((v) => (v+1)%patterns.length)}><span aria-hidden="true">↻</span> 换一组提示</button>
      </div>
      <p className="maple-cover-feedback" role="status">{coupled ? '改变 P，派生的视觉提示 F(P) 也随之改变。' : '改变 P，仅影响文字侧；视觉侧没有提示。'}<br /><span>色条仅示意依赖关系；照片像素始终不变。</span></p>
    </div>
  );
}

import React, { useEffect, useId, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import './MountainJourney.css';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const fmt = (value: number) => Number(value.toFixed(1)).toString();
type Point = [number, number];

function pathPoint(points: Point[], progress: number): Point {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = clamp(progress, 0, 1) * total;
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const fraction = lengths[index] ? remaining / lengths[index] : 0;
      return [points[index][0] + (points[index + 1][0] - points[index][0]) * fraction,
        points[index][1] + (points[index + 1][1] - points[index][1]) * fraction];
    }
    remaining -= lengths[index];
  }
  return points[points.length - 1];
}

function Hiker({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
    <ellipse cy="7" rx="25" ry="6" fill="#294b56" opacity=".16"/>
    <path d="M-7 -58 L-19 -29 L-11 -13 M10 -58 L18 -29 L26 -12" fill="none" stroke="#233f4d" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M-6 -82 L10 -82 L15 -52 L-9 -52 Z" fill="#d9734d" stroke="#9a4d3e" strokeWidth="3"/>
    <rect x="-27" y="-79" width="21" height="28" rx="7" fill="#416d79"/>
    <path d="M-5 -75 L-25 -52 M10 -73 L31 -53" stroke="#c3875c" strokeWidth="7" strokeLinecap="round"/>
    <path d="M30 -53 L38 0" stroke="#775b42" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="2" cy="-96" r="13" fill="#e5ae78"/>
    <path d="M-15 -100 Q2 -118 17 -102 L18 -97 H-15 Z" fill="#325968"/>
  </g>;
}

function MountainBackdrop({ summitX = 690, summitY = 126, sunset = false }: { summitX?: number; summitY?: number; sunset?: boolean }) {
  const uid = useId().replace(/:/g, '');
  return <g aria-hidden="true">
    <defs><linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={sunset ? '#fee0b6' : '#d7edf2'}/><stop offset="1" stopColor="#f5f8eb"/></linearGradient></defs>
    <path d="M0 0 H900 V560 H0 Z" fill={`url(#${uid}-sky)`}/>
    <circle cx="780" cy="86" r="40" fill={sunset ? '#f0a163' : '#f9dc8f'} opacity=".85"/>
    <path d="M0 340 L185 165 L330 320 L530 105 L740 325 L900 205 V560 H0 Z" fill="#b9ced0"/>
    <path d="M0 395 L225 235 L370 390 L610 150 L900 405 V560 H0 Z" fill="#82a9a6"/>
    <path d="M0 485 L190 355 L350 455 L${summitX} ${summitY} L900 445 V560 H0 Z" fill="#628e83"/>
    <path d="M0 510 Q245 445 390 515 Q610 425 900 505 V560 H0 Z" fill="#4f7e70"/>
    <path d={`M${summitX} ${summitY} V${summitY - 70} M${summitX} ${summitY - 70} l50 15 -50 16`} fill="#e48454" stroke="#995642" strokeWidth="4" strokeLinejoin="round"/>
  </g>;
}

const shortCover: Point[] = [[90, 258], [180, 233], [285, 230], [390, 190], [500, 169], [600, 105]];
const longCover: Point[] = [[90, 258], [170, 235], [250, 274], [335, 238], [390, 260]];

export function MountainCover({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const planned = moduleId === 'newMethod';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const move = reduced && !playing ? 1 : clamp((progress - .08) / .72, 0, 1);
  const [x, y] = pathPoint(planned ? shortCover : longCover, move);
  return <div className="mountain-cover-scene">
    <svg viewBox="0 0 700 320" role="img" aria-label={planned ? '先看地图选择短路，登山者到达山顶' : '凭感觉绕远，登山者在日落前仍停在山腰'}>
      <g transform="scale(.78 .57)"><MountainBackdrop summitX={770} summitY={184} sunset /></g>
      <path d={planned ? 'M90 258 L180 233 L285 230 L390 190 L500 169 L600 105' : 'M90 258 L170 235 L250 274 L335 238 L390 260'}
        fill="none" stroke={planned ? '#f8eac7' : '#e9d6b5'} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18 9"/>
      <Hiker x={x} y={y} scale={.52}/>
      <circle cx="600" cy="105" r="10" fill="#e48454"/>
    </svg>
    <div className={`mountain-cover-result ${planned ? 'is-success' : ''}`}>
      {move < 1 ? '沿山路前进……' : planned ? '日落前抵达山顶' : '绕远路，还在山腰'}
    </div>
  </div>;
}

const routes = {
  short: { distance: 4, label: '山脊小径', points: [[150, 465], [270, 405], [370, 345], [500, 265], [690, 126]] as Point[] },
  long: { distance: 6, label: '林间绕行', points: [[150, 465], [295, 465], [390, 420], [350, 345], [535, 370], [600, 245], [690, 126]] as Point[] },
};
type Route = keyof typeof routes;
const routeStorage = 'paper-skill-mountain-demo-route';

export function MountainMap() {
  const [route, setRoute] = useState<Route>('long');
  const [progress, setProgress] = useState(0);
  const [runSeed, setRunSeed] = useState(0);
  useEffect(() => {
    if (!runSeed) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = clamp((now - start) / 1700, 0, 1);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [runSeed]);
  const choose = (next: Route) => { setRoute(next); setProgress(0); setRunSeed(seed => seed + 1); sessionStorage.setItem(routeStorage, next); };
  const selected = routes[route];
  const eta = selected.distance / 2 + .5;
  const [x, y] = pathPoint(selected.points, progress);
  const routeLine = (kind: Route) => {
    const item = routes[kind];
    const d = item.points.map(([px, py], index) => `${index ? 'L' : 'M'}${px} ${py}`).join(' ');
    return <g key={kind} role="button" tabIndex={0} aria-label={`选择${item.label}，${item.distance}公里`}
      onClick={() => choose(kind)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(kind); } }}
      className={`mountain-route ${route === kind ? 'is-selected' : ''}`}>
      <path d={d} fill="none" stroke="transparent" strokeWidth="52"/>
      <path d={d} fill="none" stroke={kind === 'short' ? '#f5d68d' : '#eac09d'} strokeWidth={route === kind ? 12 : 8}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={kind === 'long' ? '22 11' : undefined}/>
    </g>;
  };
  return <div className="ppt-layout mountain-map-page">
    <div className="mountain-map-scene">
      <svg viewBox="0 0 900 560" role="group" aria-label={`登山者正在${selected.label}上行走，路线${selected.distance}公里`}>
        <MountainBackdrop />
        {routeLine('long')}{routeLine('short')}
        <Hiker x={x} y={y} scale={.85}/>
      </svg>
      <button className="mountain-route-label is-short" onClick={() => choose('short')}>山脊小径 · 4 km</button>
      <button className="mountain-route-label is-long" onClick={() => choose('long')}>林间绕行 · 6 km</button>
      <div className="mountain-map-hint">点地图上的山路，看看日落前走到哪里</div>
    </div>
    <aside className="mountain-principle">
      <strong>{selected.label}</strong>
      <div className="mountain-principle-equation"><i>T</i> = <i>D</i> / <i>v</i> + <i>R</i></div>
      <p>用路程、步速和休息时间估算到顶时间。</p>
      <div className="mountain-time-track" aria-label={`行走 ${fmt(selected.distance / 2)} 小时，休息 0.5 小时`}>
        <span style={{ flex: selected.distance / 2 }} /><span style={{ flex: .5 }} />
      </div>
      <div className="mountain-time-legend"><b>行走 {fmt(selected.distance / 2)} h</b><b>休息 0.5 h</b></div>
      <div className="mountain-principle-number">{fmt(eta)} <small>小时</small></div>
      <div className="mountain-principle-detail">{selected.distance} km ÷ 2 km/h + 0.5 h 休息</div>
      <div className={`mountain-principle-feedback ${eta <= 3 ? 'is-success' : ''}`}>{eta <= 3 ? '可在 3 小时内抵达' : '超过 3 小时，日落前赶不到'}</div>
    </aside>
  </div>;
}

const gear = [
  { id: 'water', name: '饮水', weight: 1.4, x: 135, color: '#51a6bd' },
  { id: 'coat', name: '雨衣', weight: .8, x: 345, color: '#e3a15c' },
  { id: 'lamp', name: '头灯', weight: .5, x: 555, color: '#7c88bd' },
] as const;
type GearId = typeof gear[number]['id'];

function GearIcon({ id, color }: { id: GearId; color: string }) {
  return id === 'water' ? <g><rect x="-18" y="-44" width="36" height="78" rx="10" fill={color}/><rect x="-11" y="-54" width="22" height="16" rx="4" fill="#356a7c"/></g> :
    id === 'coat' ? <path d="M-42 -20 L-15 -41 H15 L42 -20 L29 9 L19 1 V40 H-19 V1 L-29 9 Z" fill={color}/> :
      <g><path d="M-38 -5 Q0 -35 38 -5" fill="none" stroke="#454e68" strokeWidth="11"/><rect x="-25" y="-17" width="50" height="38" rx="12" fill={color}/><circle cy="2" r="13" fill="#f9e1a0"/></g>;
}

export function MountainPack() {
  const [packed, setPacked] = useState<GearId[]>(['water']);
  const toggle = (id: GearId) => setPacked(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  const weight = gear.filter(item => packed.includes(item.id)).reduce((sum, item) => sum + item.weight, 0);
  return <div className="ppt-layout mountain-pack-page">
    <div className="mountain-pack-scene">
      <svg viewBox="0 0 900 560" role="group" aria-label={`登山背包，已装入${packed.map(id => gear.find(item => item.id === id)?.name).join('、') || '无'}，总重${fmt(weight)}公斤`}>
        <MountainBackdrop summitX={690} summitY={126}/>
        <path d="M60 478 H850" stroke="#d8c6a6" strokeWidth="14" strokeLinecap="round"/>
        <rect x="624" y="226" width="184" height="270" rx="48" fill="#356c78" stroke="#214955" strokeWidth="10"/>
        <path d="M655 230 Q710 175 770 230" fill="none" stroke="#204b55" strokeWidth="18"/>
        <rect x="644" y="353" width="145" height="105" rx="21" fill="#4d8790" stroke="#214955" strokeWidth="6"/>
        <path d="M664 377 H769" stroke="#c5d8cf" strokeWidth="7" strokeLinecap="round"/>
        {gear.map(item => {
          const selected = packed.includes(item.id);
          return <g key={item.id} className="mountain-gear" role="button" tabIndex={0} aria-label={`${selected ? '取出' : '装入'}${item.name}，${item.weight}公斤`}
            onClick={() => toggle(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(item.id); } }}>
            <rect x={item.x - 65} y="285" width="130" height="136" rx="23" fill={selected ? '#e4eee9' : '#ffffffdd'} stroke={selected ? '#368766' : '#bccdcc'} strokeWidth="5"/>
            {item.id === 'water' ? <g><rect x={item.x - 18} y="306" width="36" height="78" rx="10" fill={item.color}/><rect x={item.x - 11} y="296" width="22" height="16" rx="4" fill="#356a7c"/></g> :
              item.id === 'coat' ? <path d={`M${item.x - 42} 325 L${item.x - 15} 304 H${item.x + 15} L${item.x + 42} 325 L${item.x + 29} 354 L${item.x + 19} 346 V385 H${item.x - 19} V346 L${item.x - 29} 354 Z`} fill={item.color}/> :
                <g><path d={`M${item.x - 38} 340 Q${item.x} 310 ${item.x + 38} 340`} fill="none" stroke="#454e68" strokeWidth="11"/><rect x={item.x - 25} y="328" width="50" height="38" rx="12" fill={item.color}/><circle cx={item.x} cy="347" r="13" fill="#f9e1a0"/></g>}
            <text x={item.x} y="403" textAnchor="middle" fill="#31515c" fontSize="28" fontWeight="700">{item.name}</text>
            {selected && <circle cx={item.x + 48} cy="302" r="14" fill="#328866"/>}
          </g>;
        })}
        {gear.filter(item => packed.includes(item.id)).map((item, index) =>
          <g key={item.id} transform={`translate(${670 + index * 45} 417) scale(.55)`}>
            <g className="mountain-packed-item"><GearIcon id={item.id} color={item.color}/></g>
          </g>)}
      </svg>
      <div className="mountain-pack-hint">点装备，装进或取出背包</div>
    </div>
    <aside className="mountain-pack-overlay" aria-live="polite">
      <strong><i>W</i> ≤ <i>W</i><sub>max</sub></strong>
      <div><b>{fmt(weight)} kg</b><small> / 2.5 kg</small></div>
      <p className={weight > 2.5 ? 'is-warning' : ''}>
        {weight > 2.5 ? '超出上限，重新取舍装备' : packed.length ? '重量合适，再核对天气与路线' : '点装备，观察重量变化'}
      </p>
    </aside>
  </div>;
}

const climbPath: Point[] = [[130, 460], [245, 420], [365, 365], [460, 305], [575, 255], [690, 126]];
export function MountainClimb() {
  const [distance, setDistance] = useState(() => sessionStorage.getItem(routeStorage) === 'long' ? 6 : 4);
  const [pace, setPace] = useState(2);
  const [rest, setRest] = useState(.5);
  const total = distance / pace + rest;
  const destination = clamp(3 / total, 0, 1);
  const [progress, setProgress] = useState(destination);
  const progressRef = useRef(destination);
  useEffect(() => {
    const startValue = progressRef.current;
    if (Math.abs(startValue - destination) < .001) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { progressRef.current = destination; setProgress(destination); return; }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = clamp((now - startedAt) / 650, 0, 1);
      const next = startValue + (destination - startValue) * (1 - (1 - t) ** 3);
      progressRef.current = next; setProgress(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [destination]);
  const [x, y] = pathPoint(climbPath, progress);
  const feedback = total <= 3 ? '日落前抵达山顶，可以看风景了。' : `还差 ${fmt(total - 3)} 小时：换短路、加快步速或缩短休息。`;
  return <div className="ppt-layout mountain-climb-page">
    <div className="mountain-climb-scene">
      <svg viewBox="0 0 900 560" role="img" aria-label={`山路${distance}公里，步速${fmt(pace)}公里每小时，休息${fmt(rest)}小时，预计${fmt(total)}小时到顶`}>
        <MountainBackdrop sunset />
        <path d="M130 460 L245 420 L365 365 L460 305 L575 255 L690 126" fill="none" stroke="#f0d9a8" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20 10"/>
        <Hiker x={x} y={y} scale={.9}/>
      </svg>
      <div className="mountain-climb-kicker">日落倒计时 · 还剩 3 小时</div>
      <div className={`mountain-climb-feedback ${total <= 3 ? 'is-success' : ''}`} aria-live="polite">{feedback}</div>
    </div>
    <aside className="mountain-climb-controls">
      <div className="mountain-climb-control-title">行进参数</div>
      <label><span><strong>路线长度 <i>D</i></strong><b>{distance} km</b></span><input type="range" min="3" max="7" step="1" value={distance} onChange={event => setDistance(Number(event.target.value))}/></label>
      <label><span><strong>行走速度 <i>v</i></strong><b>{fmt(pace)} km/h</b></span><input type="range" min="1.5" max="3.5" step="0.5" value={pace} onChange={event => setPace(Number(event.target.value))}/></label>
      <label><span><strong>休息时间 <i>R</i></strong><b>{fmt(rest)} h</b></span><input type="range" min="0" max="1" step="0.25" value={rest} onChange={event => setRest(Number(event.target.value))}/></label>
      <div className="mountain-climb-formula"><strong><SymbolHint meaning="T：总耗时，单位为小时；由行进时间和休息时间组成。"><i>T</i></SymbolHint> = <SymbolHint meaning="D：路程，单位为千米。"><i>D</i></SymbolHint>/<SymbolHint meaning="v：平均行进速度，单位为千米/小时。"><i>v</i></SymbolHint> + <SymbolHint meaning="R：休息时间，单位为小时。"><i>R</i></SymbolHint></strong><b>{fmt(total)} = {distance} / {fmt(pace)} + {fmt(rest)} 小时</b></div>
    </aside>
  </div>;
}

export function MountainSummit() {
  return <div className="ppt-layout mountain-summit-page">
    <svg viewBox="0 0 900 560" role="img" aria-label="登山者站在山顶，眺望夕阳下的群山">
      <MountainBackdrop summitX={645} summitY={155} sunset/>
      <path d="M0 500 Q330 440 645 155 L900 445 V560 H0 Z" fill="#648e83"/>
      <Hiker x={630} y={180} scale={1.1}/>
    </svg>
    <div className="mountain-summit-principle">
      <div><strong><SymbolHint meaning="T：总耗时，单位为小时；由行进时间和休息时间组成。"><i>T</i></SymbolHint> = <SymbolHint meaning="D：路程，单位为千米。"><i>D</i></SymbolHint>/<SymbolHint meaning="v：平均行进速度，单位为千米/小时。"><i>v</i></SymbolHint> + <SymbolHint meaning="R：休息时间，单位为小时。"><i>R</i></SymbolHint></strong></div>
      <p>整理装备、选择路线、调整步速，最后核对能否在日落前抵达。</p>
      <small>这是教学演示；真实论文结果须由论文证据支持。</small>
    </div>
  </div>;
}

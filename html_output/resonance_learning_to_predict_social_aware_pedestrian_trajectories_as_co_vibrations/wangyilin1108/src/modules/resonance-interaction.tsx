import React, { useState } from 'react';
import { number, sector } from './resonance-model';
import type { Point } from './resonance-model';
import { Choice, color, Note, Panel, Slider, Split, Walker } from './resonance-ui';

const ego = [1, 2, 3, 4];
const shiftToEnd = (track: number[]) => track.map(x => x - track[3]);
const signed = (value: number) => value > 0 ? `+${value}` : String(value);
const haarPair = (track: number[]) => [(track[2] + track[3]) / Math.SQRT2, (track[2] - track[3]) / Math.SQRT2];

function WalkTape({ tracks, range }: { tracks: number[][]; range: [number, number] }) {
  const xAt = (x: number) => 85 + (x - range[0]) / (range[1] - range[0]) * 1190;
  return <div className="re-walk-visual">
    <svg viewBox="0 0 1440 74" role="img" aria-label={`同一把位置尺。A 的四帧是 ${tracks[0].join('、')} 米；B 的四帧是 ${tracks[1].join('、')} 米。圆点编号对应帧号。`}>
      <rect x="1" y="1" width="1438" height="72" rx="11" fill="#f3f7fb" stroke="#d8e4ef" />
      <path d={`M${xAt(0)} 4 V70`} stroke="#657f9b" strokeWidth="2" strokeDasharray="4 4" />
      <text x="1310" y="32" fontSize="20" fill="#435976">圆点 = 帧号</text>
      <text x="1310" y="56" fontSize="20" fill="#435976">虚线 = 0 米</text>
      {tracks.map((track, i) => {
        const y = 21 + i * 32;
        const hue = i ? color.social : color.history;
        return <g key={i}>
          <text x="24" y={y + 7} fontSize="22" fontWeight="700" fill={hue}>{i ? 'B' : 'A'}</text>
          <path d={`M61 ${y} H1295`} stroke="#d4e0eb" strokeWidth="2" />
          {track.map((x, j) => <g key={j}>
            <circle cx={xAt(x)} cy={y} r="13" fill={j >= 2 ? hue : '#fff'} stroke={hue} strokeWidth="2" />
            <text x={xAt(x)} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill={j >= 2 ? '#fff' : hue}>{j + 1}</text>
          </g>)}
        </g>;
      })}
    </svg>
    <div className="re-walk-tape" role="table" aria-label="两人在四个时刻的位置，单位为米">
    <div role="row"><span role="columnheader">位置（米）</span>{[1, 2, 3, 4].map(t => <span key={t} role="columnheader">第 {t} 帧</span>)}<span role="columnheader">最后一步</span></div>
    {tracks.map((track, i) => <div role="row" key={i} className={i ? 're-tone-social' : 're-tone-blue'}>
      <b role="rowheader">{i ? '邻居 B' : '目标 A'}</b>
      {track.map((x, j) => <strong key={j} role="cell" className={j >= 2 ? 're-walk-picked' : ''}>{x}</strong>)}
      <strong role="cell" className="re-walk-direction">{track[3] > track[2] ? '→' : '←'} {signed(track[3] - track[2])} 米</strong>
    </div>)}
    </div>
  </div>;
}

export function Haar() {
  const [aligned, setAligned] = useState(0);
  const [gap, setGap] = useState(5);
  const raw = [ego, ego.map(x => x + gap)];
  const tracks = aligned ? raw.map(shiftToEnd) : raw;
  const [[aSum, aDiff], [bSum, bDiff]] = tracks.map(haarPair);
  return <Panel>
    <div className="re-lesson">
      <p className="re-lesson-lead">两人都每帧向右走 1 米，B 只是在更靠右的地方。怎样让模型先看出他们走得一样？</p>
      <div className="re-controls re-lesson-controls">
        <Choice labels={['原始位置', '各自末点归零']} value={aligned} change={setAligned} label="轨迹对齐" />
        <Slider label="B 整段右移（米）" value={gap} min={0} max={9} change={setGap} />
      </div>
      <WalkTape tracks={tracks} range={[-3, 13]} />
      <div className="re-lesson-grid">
        <div className="re-lesson-card"><b>① 对齐：每个位置减去自己的末点</b>
          <p>{aligned ? `A 减 ${raw[0][3]}，B 减 ${raw[1][3]}。两行的圆点对齐了；现在拖动滑块，结果也不变。` :
            '拖动滑块，B 的四个圆点一起移动，间隔不变。再点「各自末点归零」，看看圆点会不会对齐。'}</p></div>
        <div className="re-lesson-card"><b>② Haar：把高亮的两帧拆成和与差</b>
          <p>以 B 为例：和项（{tracks[1][2]} + {tracks[1][3]}）÷ √2 = {number(bSum)}；差项（{tracks[1][2]} − {tracks[1][3]}）÷ √2 = {number(bDiff)}。</p>
          <p>A 的和项 {number(aSum)}，差项 {number(aDiff)}。差项只随这一步怎么走而变。</p></div>
      </div>
      <Note>式 (9) 先去掉整体位置平移，再用 Haar 表示运动。这里只算四帧的横坐标；邻居的相对方位和距离会在第 8 页另行加入。</Note>
    </div>
  </Panel>;
}

export function Pairing() {
  const [view, setView] = useState(0);
  const stride = [1, 2, -1][view];
  const neighbor = ego.map((_, i) => 9 + (i - 3) * stride);
  const tracks = [shiftToEnd(ego), shiftToEnd(neighbor)];
  const a = haarPair(tracks[0])[1], b = haarPair(tracks[1])[1];
  return <Panel>
    <div className="re-lesson">
      <p className="re-lesson-lead">接着看上页的两个人：A 照常向右走，B 固定在 9 米处结束。现在只改变 B 怎么走到那里。</p>
      <Choice labels={['同向同速', '同向更快', '反向同速']} value={view} change={setView} label="改变 B 的走法" />
      <WalkTape tracks={tracks} range={[-6, 3]} />
      <div className="re-lesson-products" aria-live="polite">
        <div className="re-lesson-card re-tone-blue"><b>A 的差项</b><span>（{tracks[0][2]} − 0）÷ √2 ≈ {number(a)}</span></div>
        <span aria-hidden="true">×</span>
        <div className="re-lesson-card re-tone-social"><b>B 的差项</b><span>（{tracks[1][2]} − 0）÷ √2 ≈ {number(b)}</span></div>
        <span aria-hidden="true">=</span>
        <div className="re-lesson-card re-tone-purple"><b>单个分量的乘积</b><span>{number(a * b)}（用未四舍五入的值）</span></div>
      </div>
      <p className="re-lesson-line">{['同向同速时，两个差项同号、大小相同。试试只改 B 的速度或方向。', 'B 走得更快，差项的绝对值变大，乘积随之变大。', 'B 改成向左走，差项翻转，乘积随之变成负数。'][view]}</p>
      <Note>式 (9)–(10) 的实际流程：两人分别做 Haar 和学习嵌入 → 对应分量相乘 → 用 MLP 生成两人的共振特征。上面的乘积只解释运算，正负与大小不能直接当成交互强度。</Note>
    </div>
  </Panel>;
}

const anglePoint = (angle: number, radius: number): Point =>
  [Math.cos(angle * Math.PI / 180) * radius, Math.sin(angle * Math.PI / 180) * radius];

export function Sectors() {
  const [angle, setAngle] = useState(28);
  const [distance, setDistance] = useState(2.65);
  const points = [anglePoint(angle, distance), anglePoint(18, 1.58), anglePoint(138, 2.38)];
  const values = [1.2, .6, -.3];
  const active = sector(points[0]).index;
  const rows = Array.from({ length: 8 }, (_, i) => points.map((point, j) => ({ point, j })).filter(({ point }) => sector(point).index === i));
  const current = rows[active];
  const meanFeature = current.reduce((sum, row) => sum + values[row.j], 0) / current.length;
  const meanDistance = current.reduce((sum, row) => sum + Math.hypot(...row.point), 0) / current.length;
  const radius = 174;
  const draw = (degree: number, length = radius) => {
    const [x, y] = anglePoint(degree, length);
    return [310 + x, 223 - y] as const;
  };
  const start = draw(active * 45), end = draw((active + 1) * 45);
  return <Panel>
    <Split visual={<div className="re-wheel">
      <svg viewBox="0 0 620 445" role="img" aria-label="邻居按相对角度分入八个扇区">
        <circle cx="310" cy="223" r={radius} fill="#f6f9fa" stroke="#aebdc9" strokeWidth="2"/>
        <circle cx="310" cy="223" r={radius * .62} fill="none" stroke="#dbe4e9" strokeWidth="2"/>
        <path d={`M310 223 L${start.join(' ')} A${radius} ${radius} 0 0 0 ${end.join(' ')}Z`} fill="#f6dac5"/>
        {Array.from({ length: 8 }, (_, i) => {
          const [x, y] = draw(i * 45);
          return <line key={i} x1="310" y1="223" x2={x} y2={y} stroke="#9aacbb" strokeWidth="2"/>;
        })}
        <Walker x={310} y={223} fill={color.history}/>
        {points.map((point, i) => <g key={i}>
          <line x1="310" y1="223" x2={310 + point[0] * 45} y2={223 - point[1] * 45} stroke={i === 0 ? color.social : '#bac6cf'} strokeWidth="2" strokeDasharray="5 5"/>
          <Walker x={310 + point[0] * 45} y={223 - point[1] * 45} fill={i === 0 ? color.social : color.baseline}/>
        </g>)}
      </svg>
    </div>}>
      <div className="re-tag">式 (11)–(12)</div>
      <h3>运动特征跟着邻居走，矩阵行按方位变</h3>
      <div className="re-sectors" aria-label="八个扇区中的邻居数">
        {rows.map((row, i) => <div key={i} className={active === i ? 're-selected' : ''}><b>{i + 1} 区</b><span>{row.length} 人</span></div>)}
      </div>
      <p>第 {active + 1} 区的特征均值 {number(meanFeature)}，邻居平均距离 {number(meanDistance)} 米。</p>
      <p>橙衣邻居的运动特征固定为 1.20。论文将共振特征和位置嵌入拼接，在各扇区内平均。</p>
    </Split>
    <div className="re-controls">
      <Slider label="橙衣邻居方位（度）" value={angle} min={0} max={359} change={setAngle} />
      <Slider label="橙衣邻居距离（米）" value={distance} min={1.25} max={3.3} step={.05} change={setDistance} />
    </div>
    <Note>跨过扇区边界会换矩阵行；留在同一扇区时，距离仍可改变位置嵌入。上方均值只展示一个固定的教学分量。</Note>
  </Panel>;
}

export function Decoder() {
  const [branch, setBranch] = useState(0);
  const [step, setStep] = useState(5);
  const anchors = [0, .30, .90, 1.20, 1.50];
  const dense = [.02, .04, .05, .12, .32, .52, .65, .52, .34, .19, .10, .04];
  const interp = (t: number) => {
    const i = Math.floor((t - 1) / 3);
    return anchors[i] + (t - i * 3) / 3 * (anchors[i + 1] - anchors[i]);
  };
  const from = Math.floor((step - 1) / 3) * 3;
  const exact = step % 3 === 0;
  return <Panel>
    <div className="re-lesson">
      <p className="re-lesson-lead">最后两条分支都要给出 12 个偏移。点任一时刻，看这一格是直接得到的，还是由相邻路标补出来的。</p>
      <Choice labels={['自身：4 个路标补成 12 步', '交互：逆变换得到 12 步']} value={branch} change={setBranch} label="解码分支" />
      <div className={`re-lesson-timeline ${branch ? 're-tone-social' : 're-tone-own'}`} role="group" aria-label="选择未来时刻">
        {dense.map((value, i) => {
          const t = i + 1;
          const direct = !!branch || t % 3 === 0;
          const anchor = !branch && !exact && (t === from || t === from + 3);
          return <button key={t} type="button" className={`${direct ? 're-direct' : ''} ${anchor ? 're-support' : ''}`}
            aria-pressed={step === t} onClick={() => setStep(t)}>
            <span>第 {t} 步</span><b>{number(branch ? value : interp(t))}</b><small>{branch ? '输出' : direct ? '路标' : '插值'}</small>
          </button>;
        })}
      </div>
      <div className="re-lesson-grid">
        <div className="re-lesson-card"><b>第 {step} 步 · 横向偏移（米）</b>
          <p>{branch ? `逆变换后的序列第 ${step} 项就是 ${number(dense[step - 1])} 米，不需要借相邻时刻插值。` : exact ?
            `第 ${step} 步正好是路标，直接使用逆变换得到的 ${number(interp(step))} 米。` :
            `从第 ${from} 步到第 ${from + 3} 步，已过 ${step - from}/3：${number(anchors[from / 3])} + ${step - from}/3 ×（${number(anchors[from / 3 + 1])} − ${number(anchors[from / 3])}）= ${number(interp(step))} 米。`}</p></div>
        <div className="re-lesson-card"><b>{branch ? '交互分支依赖什么？' : '自身分支依赖什么？'}</b>
          <p>{branch ? '历史运动偏差和邻居共振矩阵，再加一份采样噪声。逆变换一次给出整段偏移。' :
            '历史运动偏差和线性参考，再加一份采样噪声。逆变换先给出稀疏偏移。'}</p></div>
      </div>
      <Note>式 (8)、(14) 的教学示例只展示一个坐标，第 0 步用 0 作示例起点。两条分支输出的是偏移，同一时刻还要加上参考轨迹的位置。</Note>
    </div>
  </Panel>;
}

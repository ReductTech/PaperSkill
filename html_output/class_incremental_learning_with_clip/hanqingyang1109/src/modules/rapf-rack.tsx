import React, { useRef, useState } from 'react';
import { C, Garment, Hanger, Rail, Tag, clamp } from './tailorKit';
import './tailor.css';

const MIN_X = 600;
const MAX_X = 850;

/** p1：把新到的款式推向衣架，只有相邻那件老款被大量抢走。 */
export function RapfRack() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(800);
  const dragging = useRef(false);

  const toSvg = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return x;
    return (clientX - rect.left) * (900 / rect.width);
  };
  const move = (clientX: number) => setX(clamp(toSvg(clientX), MIN_X, MAX_X));

  const t = clamp((MAX_X - x) / (MAX_X - MIN_X), 0, 1);
  const nearRate = Math.round(3 + 59 * t);
  const farRate = Math.round(3 + 2 * t);
  const tone = t > 0.7 ? 'bad' : t > 0.3 ? 'warn' : 'ok';
  const feedback =
    t > 0.7
      ? '越像越先被抢走：相邻那件老款的边界已经被新类切进去了。'
      : t > 0.3
      ? '还在靠近。被波及的只有挨着的那一件，远处那件几乎不动。'
      : '离得远，边界没被切到；但真实增量里新类总会挨着某个老类。';

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg
          ref={svgRef}
          viewBox="0 0 900 560"
          role="img"
          aria-label={`新款衣架距老款 ${Math.round((1 - t) * 100)}，相邻老款被抢 ${nearRate} 成`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) move(e.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          style={{ touchAction: 'none', cursor: 'grab' }}
        >
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="430" width="900" height="130" fill={C.light} opacity="0.5" />
          <path d="M0 430 H900" stroke={C.wood} strokeWidth="5" opacity="0.55" />
          <Rail x1={30} x2={870} y={104} />

          <Hanger x={230} y={104} s={0.95} />
          <Garment x={230} y={136} s={0.95} color={C.red} collar="round" />
          <Tag x={230} y={272} text="箱龟" size={22} fill="#fff" stroke={C.red} />

          <Hanger x={470} y={104} s={0.95} />
          <Garment x={470} y={136} s={0.95} color={C.dark} collar="point" />
          <Tag x={470} y={272} text="黑琴鸡" size={22} />

          {/* 错判比例条 */}
          <g>
            <text x={230} y={330} textAnchor="middle" fontSize={20} fill={C.muted}>
              被抢走
            </text>
            <rect x={140} y={342} width={180} height={22} rx={8} fill="#eef1f6" />
            <rect x={140} y={342} width={(180 * nearRate) / 100} height={22} rx={8} fill={C.red} />
            <text x={230} y={392} textAnchor="middle" fontSize={26} fontWeight={700} fill={C.red}>
              {nearRate}/100
            </text>
          </g>
          <g>
            <text x={470} y={330} textAnchor="middle" fontSize={20} fill={C.muted}>
              被抢走
            </text>
            <rect x={380} y={342} width={180} height={22} rx={8} fill="#eef1f6" />
            <rect x={380} y={342} width={(180 * farRate) / 100} height={22} rx={8} fill={C.dark} />
            <text x={470} y={392} textAnchor="middle" fontSize={26} fontWeight={700} fill={C.dark}>
              {farRate}/100
            </text>
          </g>

          {/* 可拖动的新款 */}
          <g>
            <path d={`M${x - 40} 430 L${x - 26} 316 M${x + 40} 430 L${x + 26} 316`} stroke={C.wood} strokeWidth={5} strokeLinecap="round" />
            <Hanger x={x} y={268} s={0.85} color={C.blue} />
            <Garment x={x} y={298} s={0.85} color={C.blue} collar="point" />
            <Tag x={x} y={412} text="泥龟（新）" size={22} fill="#eaf0f9" color={C.blue} stroke={C.blue} />
          </g>

          <text x={24} y={524} fontSize={21} fill={C.muted}>
            左右拖动新款，把它推向衣架
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>错判的流向</h4>
          <p style={{ margin: 0 }}>新类和谁最像，谁就先塌；远处的老类几乎不受影响。</p>
        </div>
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <label className="tailor-muted" htmlFor="rack-range">
          新款位置（键盘可调）
        </label>
        <input
          id="rack-range"
          className="tailor-slider"
          type="range"
          min={MIN_X}
          max={MAX_X}
          step={5}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
        />
        <div className="tailor-src">
          原文另一例（Table 6）：kingsnake 50 张，判对数 25→35，准确率 0.50→0.70；25 张错判中 23 张流向相邻新类。
          <br />
          此页比例条为示意，不是实测值。
        </div>
      </aside>
    </div>
  );
}

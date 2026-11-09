import React, { useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import { C, clamp, fmt } from './tailorKit';
import './tailor.css';

const X0 = 150;
const X1 = 790;
const OLD = 0.15;
const NEW = 0.85;
const px = (v: number) => X0 + v * (X1 - X0);

/** p5：单个邻居对的铰链损失——把老类样本推到自己这一侧，留出 margin m。 */
export function RapfHinge() {
  const [pos, setPos] = useState(0.62);
  const [m, setM] = useState(0.2);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const dC = Math.abs(pos - OLD);
  const dOther = Math.abs(NEW - pos);
  const hinge = Math.max(dC - dOther + m, 0);
  // hinge 归零条件：dC ≤ dOther − m，即 pos ≤ (1 − m) / 2
  const boundary = (1 - m) / 2;

  const setFromClient = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) * (900 / rect.width);
    setPos(clamp((x - X0) / (X1 - X0), 0.02, 0.98));
  };

  const tone = hinge > 0.001 ? 'bad' : 'ok';
  const feedback =
    hinge > 0.001
      ? `还差 ${fmt(hinge)}：样本离新款名更近，铰链还在推它。`
      : '已经拉开 m 的余量，铰链归零、不再施加惩罚。';

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg
          ref={svgRef}
          viewBox="0 0 900 560"
          role="img"
          aria-label={`样本位置 ${pos.toFixed(2)}，铰链损失 ${hinge.toFixed(2)}`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setFromClient(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) setFromClient(e.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          style={{ touchAction: 'none', cursor: 'ew-resize' }}
        >
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="404" width="900" height="156" fill={C.light} opacity="0.45" />
          <path d="M0 404 H900" stroke={C.wood} strokeWidth="4" opacity="0.5" />

          {/* 卷尺 */}
          <path d={`M${X0} 300 H${X1}`} stroke={C.wood} strokeWidth={8} strokeLinecap="round" />
          {Array.from({ length: 21 }, (_, i) => (
            <path key={i} d={`M${X0 + (i * (X1 - X0)) / 20} 300 V${i % 5 === 0 ? 286 : 292}`} stroke={C.wood} strokeWidth={2} opacity="0.7" />
          ))}

          {/* 两个类锚点 */}
          <g>
            <circle cx={px(OLD)} cy={300} r={12} fill={C.red} />
            <text x={px(OLD)} y={252} textAnchor="middle" fontSize={22} fill={C.red} fontWeight={700}>
              箱龟（老类 c）
            </text>
            <circle cx={px(NEW)} cy={300} r={12} fill={C.blue} />
            <text x={px(NEW)} y={252} textAnchor="middle" fontSize={22} fill={C.blue} fontWeight={700}>
              泥龟（相邻新类）
            </text>
          </g>

          {/* 分界（hinge 归零处） */}
          <path d={`M${px(boundary)} 240 V360`} stroke={C.green} strokeWidth={2} strokeDasharray="7 6" />
          <text x={px(boundary)} y={232} textAnchor="middle" fontSize={19} fill={C.green}>
            归零线
          </text>

          {/* 距离区间 */}
          <path d={`M${px(OLD)} 330 H${px(pos)}`} stroke={C.red} strokeWidth={5} />
          <path d={`M${px(pos)} 330 H${px(NEW)}`} stroke={C.blue} strokeWidth={5} />
          <text x={(px(OLD) + px(pos)) / 2} y={360} textAnchor="middle" fontSize={20} fill={C.red}>
            d(c) = {fmt(dC)}
          </text>
          <text x={(px(pos) + px(NEW)) / 2} y={360} textAnchor="middle" fontSize={20} fill={C.blue}>
            d(c̄) = {fmt(dOther)}
          </text>

          {/* 样本 */}
          <g>
            <circle cx={px(pos)} cy={300} r={16} fill={C.orange} stroke="#fff" strokeWidth={3} />
            <circle cx={px(pos)} cy={300} r={26} fill="none" stroke={C.orange} strokeWidth={2} opacity={0.5} />
            <text x={px(pos)} y={214} textAnchor="middle" fontSize={21} fill={C.orange} fontWeight={700}>
              采样样本 ê
            </text>
          </g>

          {/* hinge 条 */}
          <g>
            <rect x={310} y={432} width={560} height={26} rx={9} fill="#eef1f6" />
            <rect x={310} y={432} width={Math.min(560, hinge * 700)} height={26} rx={9} fill={tone === 'ok' ? C.green : C.red} />
            <text x={302} y={452} textAnchor="end" fontSize={21} fill={C.muted}>
              L_hinge
            </text>
            <text x={330} y={492} fontSize={22} fill={C.ink} fontWeight={700}>
              {fmt(hinge)} = max( {fmt(dC)} − {fmt(dOther)} + {fmt(m)} , 0 )
            </text>
          </g>

          <text x={24} y={534} fontSize={21} fill={C.muted}>
            左右拖动样本；它越靠近老类那一侧，铰链越小
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>余量 m 决定推多远</h4>
          <p style={{ margin: 0 }}>
            L<sub>hinge</sub> = max( d(c) − d(c̄) + m , 0 )，只在“还没拉开够”时给力。
          </p>
          <p className="tailor-src" style={{ margin: '6px 0 0' }}>
            d(c) = dist(A(ê_c), f_text(t_c))；d(c̄) = dist(A(ê_c), f_text(t_c̄))
          </p>
        </div>
        <div className="tailor-readout">
          <SymbolHint meaning="m：margin 余量，要求老类样本到本类名的距离比到相邻新类名的距离至少小 m。">margin m</SymbolHint>
          {' = '}
          {fmt(m)}
        </div>
        <input
          className="tailor-slider"
          type="range"
          min={0}
          max={0.8}
          step={0.02}
          value={m}
          aria-label="margin 余量"
          onChange={(e) => setM(Number(e.target.value))}
        />
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">
          式 (5)（p.7）。m 是常数余量；论文强调只做“小而有效”的调整。
        </div>
      </aside>
    </div>
  );
}

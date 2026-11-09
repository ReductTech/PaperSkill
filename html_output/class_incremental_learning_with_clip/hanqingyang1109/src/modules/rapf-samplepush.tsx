import React, { useMemo, useRef, useState } from 'react';
import { C, clamp, fmt } from './tailorKit';
import './tailor.css';

const RED_X = 330;
const BLUE_X = 610;
const MID = (RED_X + BLUE_X) / 2;
const MARGIN = 0.2;

function cloud(shift: number) {
  const cx = 544 - 176 * shift;
  const rand = (() => {
    let s = 991;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  })();
  return Array.from({ length: 44 }, () => {
    const u1 = Math.max(1e-9, rand());
    const u2 = rand();
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    return { x: cx + 46 * z1, y: 300 + 58 * z2 };
  });
}

/** p6：把老类替身推过边界，错判点随之消失。 */
export function RapfSamplePush() {
  const [shift, setShift] = useState(0.18);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const pts = useMemo(() => cloud(shift), [shift]);
  const wrong = pts.filter((p) => p.x > MID).length;
  const hingeSum = pts.reduce((sum, p) => {
    const dC = Math.hypot(p.x - RED_X, p.y - 300) / 300;
    const dO = Math.hypot(p.x - BLUE_X, p.y - 300) / 300;
    return sum + Math.max(dC - dO + MARGIN, 0);
  }, 0);

  const setFromClient = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) * (900 / rect.width);
    setShift(clamp((544 - x) / 176, 0, 1));
  };

  const tone = wrong > 12 ? 'bad' : wrong > 4 ? 'warn' : 'ok';
  const feedback =
    wrong > 12
      ? '一大半替身落在新类一侧：它们会被判成泥龟。'
      : wrong > 4
      ? '推开了一点，仍有' + wrong + '个点在边界错误的一侧。'
      : '只推过边界一点点，错判几乎清零，其它类也没被推远。';

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg
          ref={svgRef}
          viewBox="0 0 900 560"
          role="img"
          aria-label={`${wrong} 个替身落在新类一侧`}
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
          <rect x="60" y="110" width="780" height="370" rx="16" fill="#ffffff" stroke={C.line} strokeWidth={2} />

          <path d={`M${MID} 110 V480`} stroke={C.green} strokeWidth={3} strokeDasharray="9 7" />
          <text x={MID} y={100} textAnchor="middle" fontSize={20} fill={C.green}>
            判定分界
          </text>

          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={7} fill={p.x > MID ? C.red : C.purple} opacity={0.8} />
          ))}

          <g>
            <circle cx={RED_X} cy={300} r={16} fill={C.red} />
            <text x={RED_X} y={270} textAnchor="middle" fontSize={21} fill={C.red} fontWeight={700}>
              箱龟
            </text>
            <circle cx={BLUE_X} cy={300} r={16} fill={C.blue} />
            <text x={BLUE_X} y={270} textAnchor="middle" fontSize={21} fill={C.blue} fontWeight={700}>
              泥龟
            </text>
          </g>

          <g>
            <rect x={92} y={132} width={168} height={46} rx={10} fill="#fdecee" stroke={C.red} strokeWidth={2} />
            <text x={176} y={163} textAnchor="middle" fontSize={21} fill={C.red}>
              红点：会被判错
            </text>
          </g>

          <text x={24} y={524} fontSize={21} fill={C.muted}>
            左右拖动紫色替身点云：铰链只把它推过边界，不会推得越远越好
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>推过边界即可</h4>
          <p style={{ margin: 0 }}>替身越过绿色分界就会判错；铰链把它们推回自己一侧。</p>
        </div>
        <div className="tailor-kv">
          <span>错判点</span>
          <b style={{ color: wrong > 4 ? C.red : C.green }}>
            {wrong} / {pts.length}
          </b>
          <span>铰链总和</span>
          <b>{fmt(hingeSum)}</b>
        </div>
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">
          对应 Fig.5c：错判到新类的样本减少、正确分类增加、对其它类影响很小。此页为示意；论文未给出 m 取值，此处取 0.2。
        </div>
      </aside>
    </div>
  );
}

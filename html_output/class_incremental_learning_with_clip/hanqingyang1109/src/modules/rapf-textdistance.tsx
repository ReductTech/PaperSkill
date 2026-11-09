import React, { useRef, useState } from 'react';
import { C, clamp, fmt } from './tailorKit';
import './tailor.css';

type Pair = { name: string; d: number };
const OLDS: Pair[] = [
  { name: '箱龟', d: 0.41 },
  { name: '旧类 A', d: 0.52 },
  { name: '旧类 B', d: 0.58 },
  { name: '黑琴鸡', d: 0.79 },
  { name: '旧类 C', d: 0.95 },
  { name: '旧类 D', d: 1.08 },
];
const D_MAX = 1.15;
const X0 = 232;
const X1 = 852;
const toX = (d: number) => X0 + (d / D_MAX) * (X1 - X0);

/** 论文 Fig.6 的定性形状（ImageNet100 B0 Inc10，y 轴 78.4–80.4），仅描点示意 */
const CURVE = [
  { a: 0.5, acc: 78.4 },
  { a: 0.55, acc: 79.1 },
  { a: 0.6, acc: 79.7 },
  { a: 0.65, acc: 80.2 },
  { a: 0.7, acc: 80.35 },
  { a: 0.75, acc: 80.3 },
  { a: 0.8, acc: 80.1 },
];
const curveX = (a: number) => 640 + ((a - 0.5) / 0.3) * 220;
const curveY = (acc: number) => 520 - ((acc - 78.2) / 2.4) * 110;

/** p3：拖动 α，决定“多近才算邻居”。 */
export function RapfTextDistance() {
  const [alpha, setAlpha] = useState(0.65);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const near = OLDS.filter((o) => o.d < alpha);
  const k = near.length;

  const toAlpha = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return alpha;
    const x = (clientX - rect.left) * (900 / rect.width);
    return clamp(((x - X0) / (X1 - X0)) * D_MAX, 0.45, 0.85);
  };

  const tone = k === 0 ? 'bad' : k >= 5 ? 'bad' : k <= 4 ? 'ok' : 'warn';
  const feedback =
    k === 0
      ? '太严：一个邻居都没圈到，铰链损失根本不会触发。'
      : k >= 5
      ? '太松：把不像的款也拉进来了，干扰分类、白算一遍。'
      : '圈住了真正的邻居：只有这几对会被推开。';

  return (
    <div className="tailor-page">
      <div className="tailor-scene">
        <svg
          ref={svgRef}
          viewBox="0 0 900 560"
          role="img"
          aria-label={`阈值 ${alpha.toFixed(2)}，圈中 ${k} 个邻居`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setAlpha(toAlpha(e.clientX));
          }}
          onPointerMove={(e) => {
            if (dragging.current) setAlpha(toAlpha(e.clientX));
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

          <rect x={36} y={138} width={168} height={112} rx={14} fill="#eaf0f9" stroke={C.blue} strokeWidth={3} />
          <text x={120} y={182} textAnchor="middle" fontSize={24} fill={C.blue} fontWeight={700}>
            泥龟
          </text>
          <text x={120} y={216} textAnchor="middle" fontSize={20} fill={C.muted}>
            新到的款
          </text>
          <path d="M206 194 H226" stroke={C.blue} strokeWidth={4} />
          <path d="M216 186 L228 194 L216 202" fill={C.blue} />

          <path d={`M${X0} 262 H${X1}`} stroke={C.line} strokeWidth={3} />
          <path d={`M${X0} 254 V270 M${X1} 254 V270`} stroke={C.line} strokeWidth={3} />
          <text x={X0} y={296} fontSize={20} fill={C.muted} textAnchor="middle">
            0
          </text>
          <text x={X1} y={296} fontSize={20} fill={C.muted} textAnchor="middle">
            1.15
          </text>
          <text x={240} y={244} fontSize={20} fill={C.muted}>
            款名文本距离 D →
          </text>

          {/* 阈值竖线（先画，避免压住标签） */}
          <g>
            <rect x={toX(alpha) - 22} y={200} width={44} height={250} fill="transparent" />
            <path d={`M${toX(alpha)} 190 V444`} stroke={C.orange} strokeWidth={5} strokeDasharray="10 6" strokeLinecap="round" />
            <rect x={toX(alpha) - 58} y={148} width={116} height={40} rx={10} fill={C.orange} />
            <text x={toX(alpha)} y={176} textAnchor="middle" fontSize={22} fill="#fff" fontWeight={700}>
              α = {fmt(alpha)}
            </text>
          </g>

          {OLDS.map((o, i) => {
            const x = toX(o.d);
            const on = o.d < alpha;
            const chipY = i % 2 === 0 ? 352 : 440;
            return (
              <g key={o.name} opacity={on ? 1 : 0.5}>
                <circle cx={x} cy={262} r={on ? 9 : 6} fill={on ? C.orange : C.muted} />
                <path d={`M${x} 272 V${chipY - 30}`} stroke={on ? C.orange : C.line} strokeWidth={2} strokeDasharray="5 4" />
                <rect x={x - 40} y={chipY - 30} width={80} height={58} rx={10}
                  fill={on ? '#fff3ea' : '#ffffff'} stroke={on ? C.orange : C.line} strokeWidth={2} />
                <text x={x} y={chipY - 7} textAnchor="middle" fontSize={19} fill={on ? C.orange : C.muted}>
                  {o.name}
                </text>
                <text x={x} y={chipY + 17} textAnchor="middle" fontSize={18} fill={on ? C.orange : C.muted}>
                  {fmt(o.d)}
                </text>
              </g>
            );
          })}

          <text x={24} y={552} fontSize={21} fill={C.muted}>
            左右拖动阈值线；仅箱龟/黑琴鸡/泥龟出自 Fig.1，其余类名为占位
          </text>
        </svg>
      </div>

      <aside className="tailor-side">
        <div className="tailor-panel">
          <h4>阈值的一松一紧</h4>
          <p style={{ margin: 0 }}>把类名文本特征两两比距离，小于 α 的配对才算要处理。</p>
        </div>
        <div className="tailor-readout">
          邻居对：<span className="tailor-big" style={{ color: C.orange }}>{k}</span> 对
        </div>
        <div className={`tailor-feedback ${tone}`}>{feedback}</div>
        <div className="tailor-src">
          原文默认 α = 0.65；多数类别对的距离大于 0.5。Fig.6 的阈值实验显示：α 从 0.5 增大时精度上升，过大反而下降。
        </div>
      </aside>
    </div>
  );
}

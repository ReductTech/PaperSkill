import { useState } from 'react';

function iou(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

const CENTERED = { x: 70, y: 150, w: 340, h: 320, cn: 0.92, name: '居中的装裱' };
const EDGE = { x: 150, y: 190, w: 340, h: 320, cn: 0.35, name: '偏边的装裱' };
/** RetinaNet 系后处理常用分数阈值；FCOS 写明沿用 RetinaNet 后处理，正文未单独印死该数。 */
const SCORE_THR = 0.05;
const NMS_IOU = 0.5;

export function NmsKeep(_props: { chapterId: string; moduleId: string }) {
  const [clsA, setClsA] = useState(0.8);
  const [clsB, setClsB] = useState(0.8);
  const scoreA = clsA * CENTERED.cn;
  const scoreB = clsB * EDGE.cn;
  const overlap = iou(CENTERED, EDGE);
  const candA = scoreA > SCORE_THR;
  const candB = scoreB > SCORE_THR;
  const suppress = overlap > NMS_IOU && candA && candB;
  const keepA = candA && (!suppress || scoreA >= scoreB);
  const keepB = candB && (!suppress || scoreB > scoreA);
  const tone = keepA && !keepB ? '#228d5c' : keepB && !keepA ? '#c43f52' : '#27446e';
  const feedback = suppress
    ? (keepA
      ? `两框交并比 ${overlap.toFixed(2)}，大于 ${NMS_IOU}。最终分数 ${scoreA.toFixed(2)} 高于 ${scoreB.toFixed(2)}，只留下居中的那张。`
      : `偏边框的分类分被拉得很高，乘上 0.35 之后仍是 ${scoreB.toFixed(2)}，反超居中框的 ${scoreA.toFixed(2)}。中心度会压分，但不是绝对否决。`)
    : `有一张最终分数未过示意阈值 ${SCORE_THR}（沿用 RetinaNet 后处理惯例），先被滤掉，NMS 不必再比。`;
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '860px 572px', gap: 40 }}>
      <svg viewBox="0 0 860 622" width="860" height="622" role="img" aria-label="两张重叠的装裱">
        <rect width="860" height="622" rx="18" fill="#f3ead7" />
        <g opacity={keepB ? 1 : 0.28}>
          <rect x={EDGE.x} y={EDGE.y} width={EDGE.w} height={EDGE.h} fill="#fffdf8" stroke={keepB ? '#c43f52' : '#d7deea'} strokeWidth="8" />
        </g>
        <g opacity={keepA ? 1 : 0.28}>
          <rect x={CENTERED.x} y={CENTERED.y} width={CENTERED.w} height={CENTERED.h} fill="#fffdf8" stroke={keepA ? '#228d5c' : '#d7deea'} strokeWidth="8" />
          <ellipse cx={CENTERED.x + 160} cy={CENTERED.y + 120} rx="28" ry="12" fill="#228d5c" />
          <path d={`M ${CENTERED.x + 140} ${CENTERED.y + 132} Q ${CENTERED.x + 160} ${CENTERED.y + 190} ${CENTERED.x + 180} ${CENTERED.y + 132}`} fill="#27446e" />
        </g>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 800, color: '#21324a' }}>{keepA && !keepB ? '留下居中框' : keepB && !keepA ? '偏边框反超' : '阈值先过滤'}</div>
        <div style={{ fontSize: 44, lineHeight: 1.35, fontWeight: 800, color: tone }}>{Math.max(keepA ? scoreA : 0, keepB ? scoreB : 0).toFixed(2)}</div>
        <label style={{ fontSize: 28, color: '#21324a' }}>居中框分类分 {clsA.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={clsA} aria-valuetext={`居中框分类分 ${clsA.toFixed(2)}`} onChange={(e) => setClsA(Number(e.target.value))} style={{ width: '100%', accentColor: '#228d5c' }} />
        </label>
        <label style={{ fontSize: 28, color: '#21324a' }}>偏边框分类分 {clsB.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={clsB} aria-valuetext={`偏边框分类分 ${clsB.toFixed(2)}`} onChange={(e) => setClsB(Number(e.target.value))} style={{ width: '100%', accentColor: '#c43f52' }} />
        </label>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: tone }}>{feedback}</div>
        <div style={{ fontSize: 24, lineHeight: 1.35, color: '#68778f' }}>论文：后处理与 RetinaNet 相同；表 3 还试过 NMS 阈值 0.5 / 0.6。页面里的 {SCORE_THR} 是演示用惯例阈值，不是正文单独印出的硬数字。</div>
      </div>
    </div>
  );
}

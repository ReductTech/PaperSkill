import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLandmark,
  drawLegend,
  drawPage,
  drawSpeech,
  drawTrail,
  useCanvas,
} from '../lib/trailKit';

// §2 module 2.1 — click a landmark hotspot, then pick an answer type. The image side
// only ever turns into rows of text plus a box of coordinates, which is all GPT-4 sees.
const W = 1080;
const H = 280;

type LandmarkKey = 'tree' | 'bench' | 'fountain' | 'sign';
type AnswerKind = 'conv' | 'detail' | 'reason';

interface Landmark {
  key: LandmarkKey;
  label: string;
  x: number;
  kind: LandmarkKey;
  desc: string[];
  box: [number, number, number, number];
}

const LANDMARKS: Landmark[] = [
  {
    key: 'tree',
    label: '树',
    x: 100,
    kind: 'tree',
    desc: ['左侧一棵大树，树冠很密。', '树干竖直，占画面很高。'],
    box: [58, 158, 148, 226],
  },
  {
    key: 'bench',
    label: '长椅',
    x: 190,
    kind: 'bench',
    desc: ['树下有一张木制长椅。', '长椅在树干右前方。'],
    box: [156, 188, 228, 226],
  },
  {
    key: 'fountain',
    label: '喷泉',
    x: 290,
    kind: 'fountain',
    desc: ['画面中间是一座小喷泉。', '底座是圆形，水柱不高。'],
    box: [252, 172, 326, 228],
  },
  {
    key: 'sign',
    label: '路牌',
    x: 380,
    kind: 'sign',
    desc: ['右侧有一块木制路牌。', '箭头指着湖边小径。'],
    box: [350, 164, 406, 226],
  },
];

const KINDS: Array<{ key: AnswerKind; label: string; lines: number; note: string; cls: string }> = [
  { key: 'conv', label: '对话', lines: 1, note: '对话：问「这是什么车」，答一句事实。', cls: '' },
  { key: 'detail', label: '详细描述', lines: 2, note: '详细描述：把整幅画面讲成一段话。', cls: '' },
  { key: 'reason', label: '复杂推理', lines: 3, note: '复杂推理：问「这些人遇到什么困难」，答需要推理步骤。', cls: 'good' },
];

interface Ch2State {
  sel: LandmarkKey;
  kind: AnswerKind;
}

function findLandmark(key: LandmarkKey): Landmark {
  const found = LANDMARKS.filter((item) => item.key === key)[0];
  return found ?? LANDMARKS[0];
}

function findKind(key: AnswerKind) {
  const found = KINDS.filter((item) => item.key === key)[0];
  return found ?? KINDS[0];
}

function boxText(lm: Landmark): string {
  return `[${lm.box.join(', ')}]`;
}

export const Ch2Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch2State>({ sel: 'tree', kind: 'conv' });
  const [sel, setSel] = useState<LandmarkKey>('tree');
  const [kind, setKind] = useState<AnswerKind>('conv');
  const [feedback, setFeedback] = useState({
    text: '选中「树」：它变成一句描述和一组框坐标，GPT-4 只看得到这些字。',
    cls: '',
  });

  const chooseLandmark = (key: LandmarkKey) => {
    stateRef.current.sel = key;
    setSel(key);
    setFeedback({
      text: `选中「${findLandmark(key).label}」：它变成一句描述和一组框坐标，GPT-4 只看得到这些字。`,
      cls: '',
    });
  };

  const chooseKind = (key: AnswerKind) => {
    const next = findKind(key);
    stateRef.current.kind = key;
    setKind(key);
    setFeedback({ text: next.note, cls: next.cls });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let best: LandmarkKey | null = null;
    let bestDist = 34;
    for (const item of LANDMARKS) {
      const dist = Math.hypot(x - item.x, y - 186);
      if (dist < bestDist) {
        bestDist = dist;
        best = item.key;
      }
    }
    if (best !== null && best !== stateRef.current.sel) chooseLandmark(best);
  };

  const { ref } = useCanvas<Ch2State>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const lm = findLandmark(s.sel);
      const k = findKind(s.kind);

      // image side: the park scene with four clickable landmark hotspots
      drawTrail(ctx, [[28, 226], [420, 222]], { dashed: true });
      for (const item of LANDMARKS) {
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(item.x, 186, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        drawLandmark(ctx, item.x, 205, item.kind, { highlight: item.key === s.sel });
      }

      // the selected landmark's box, drawn at exactly the coordinates the prompt carries
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 3;
      ctx.strokeRect(lm.box[0], lm.box[1], lm.box[2] - lm.box[0], lm.box[3] - lm.box[1]);
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.fader;
      const corners: Array<[number, number]> = [
        [lm.box[0], lm.box[1]],
        [lm.box[2], lm.box[3]],
      ];
      for (const corner of corners) {
        ctx.beginPath();
        ctx.arc(corner[0], corner[1], 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawTrail(ctx, [[440, 26], [440, 248]], { dashed: true });

      // prompt block: two description rows plus one box-coordinate row
      drawLabel(ctx, '提示', 470, 32, { color: COLORS.muted, size: 15 });
      drawPage(ctx, 470, 38, 540, 100, { lines: 0, rows: 3 });
      const rowH = (100 - 14) / 3;
      for (let i = 0; i < 2; i += 1) {
        const ry = 38 + 8 + i * rowH + rowH * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = COLORS.muted;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(486, ry);
        ctx.lineTo(996, ry);
        ctx.stroke();
        ctx.restore();
      }
      const coordY = 38 + 8 + 2 * rowH + rowH * 0.5;
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(500, coordY);
      ctx.lineTo(996, coordY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(478, coordY - 7, 14, 14);
      ctx.restore();

      // answer block: one line for conversation, more for description and reasoning
      drawLabel(ctx, '回答', 470, 146, { color: COLORS.muted, size: 15 });
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = COLORS.good;
      ctx.fillRect(464, 150, 552, 16 + k.lines * 12);
      ctx.restore();
      drawSpeech(ctx, 470, 154, 540, '', { lines: k.lines, active: true });

      drawLegend(ctx, 470, 266, [
        { color: COLORS.fader, text: '选中景物' },
        { color: COLORS.good, text: '回答块' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const current = findLandmark(sel);
  const currentKind = findKind(kind);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} onClick={onCanvasClick} />
      <div className="ctrl">
        <label>景物</label>
        <div className="chip-row">
          {LANDMARKS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === sel ? 'chip selected' : 'chip'}
              onClick={() => chooseLandmark(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>回答</label>
        <div className="chip-row">
          {KINDS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === kind ? 'chip selected' : 'chip'}
              onClick={() => chooseKind(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="ctrl">
        <label>
          描述 <span>{current.desc.join('')}</span>
        </label>
        <label>
          框坐标 <span className="val">{boxText(current)}</span>
        </label>
        <label>
          回答行 <span className="val">{currentKind.lines}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;

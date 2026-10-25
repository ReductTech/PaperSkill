import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const COLORS = {
  field: '#f5f8f0',
  board: '#b8c9a7',
  deep: '#76906a',
  edge: '#d7deea',
  guide: '#27446e',
  ok: '#228d5c',
  pick: '#f07e47',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  face: '#ffffff',
};

type CaseId = 'b0484' | 'vqa91k' | 'case479';

interface CaseDef {
  id: CaseId;
  chip: string;
  site: string;
  size: string;
  ddx: string;
  evidence: string[];
  verdict: string;
  note: string;
}

const CASES: CaseDef[] = [
  {
    id: 'b0484',
    chip: 'TCGA-B0-4824',
    site: '左肾，3.5 cm 肿瘤',
    size: '透明细胞形态待确认',
    ddx: 'ccRCC / chRCC / pRCC',
    evidence: [
      '申请免疫组化：PAX8、CD10、CK7、CK20',
      '复查切片：ccRCC 阳性、chRCC 阴性、pRCC 阴性、核分级 3',
      '附加结果：PAX8 阳性、CD10 阳性、CK7 阴性、CK20 阴性',
      '第二轮定位：透明细胞形态占优',
    ],
    verdict: '透明细胞肾细胞癌（ccRCC），核分级 3',
    note: '',
  },
  {
    id: 'vqa91k',
    chip: 'TCGA-VQ-A91K',
    site: '胃（胃窦），2.8 cm，幽门区',
    size: '累及十二指肠',
    ddx: '胃腺癌 / 神经内分泌肿瘤 / 淋巴瘤 / 间质瘤',
    evidence: [
      '申请 CK7、CK20、CDX2、Syn、CgA、Ki-67、HER2 与侵袭检测',
      '结果：CK7 阳性、CK20 阳性、CDX2 阳性',
      '结果：Syn 阴性、CgA 阴性、Ki-67 升高、HER2 阴性',
      '侵袭检出；该例无需调用肾或前列腺工具',
    ],
    verdict: '胃腺癌',
    note: '论文指出该例只需侵袭工具。',
  },
  {
    id: 'case479',
    chip: 'Pathology Outlines 479',
    site: '前纵隔（47 岁女性）',
    size: '约 8.3 × 7.1 × 8.2 cm 浸润性肿块',
    ddx: '胸腺癌 / 胸腺瘤 / 淋巴瘤 / 生殖细胞肿瘤 / 神经内分泌肿瘤',
    evidence: [
      '首轮 IHC：TdT 阴性、p63 阳性、CD30 阴性、CD20 阴性、CK 阳性、Syn 阴性、CgA 阴性',
      '第二轮：CD5 阳性、EMA 阳性、D2-40 阴性、WT1 阴性',
      '分子检测：KRAS / NRAS / BRAF 均未检出突变',
      '论文点评：分子检测是冗余的',
    ],
    verdict: '胸腺癌',
    note: '论文点评：分子检测冗余；只凭一份活检下「胸腺癌」结论下得太满。',
  },
];

const STEP_FEEDBACK = [
  { text: '先看初始信息与形态描述，列出鉴别。', cls: '' },
  { text: '这一轮要申请哪些检查？这决定了下一轮能用什么证据。', cls: '' },
  { text: '外部结果回来了：逐条看哪些支持、哪些排除。', cls: '' },
  { text: '再复查一次切片，把关键形态确认或否掉。', cls: '' },
  { text: '证据齐了才定论——注意论文自己对这个病例的点评。', cls: 'good' },
];

const STEP_TAGS = ['列鉴别', '定检查', '读结果', '再复查', '定结论'];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, W, H);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
): void {
  ctx.fillStyle = muted ? COLORS.muted : COLORS.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: string[], x: number, y: number): void {
  const shown = items.slice(0, 3);
  let cx = x;
  shown.forEach((item, i) => {
    const color = i === 0 ? COLORS.guide : i === 1 ? COLORS.aux : COLORS.pick;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 7, y - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, item, cx + 22, y, true);
    cx += 22 + item.length * 18 + 24;
  });
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number,
  color: string,
  border: number
): void {
  ctx.fillStyle = COLORS.face;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = border;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.fillStyle = COLORS.edge;
  ctx.beginPath();
  ctx.moveTo(x + w - 12, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.deep;
  ctx.lineWidth = 1;
  for (let k = 0; k < lines; k++) {
    const yy = y + 12 + k * 10;
    if (yy > y + h - 6) break;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.lineTo(x + w - 8, yy);
    ctx.stroke();
  }
}

// 中文与西文混排的低成本换行：全角字符算 1，西文字符算 0.55
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const raw = Array.from(text);
  const weight = (ch: string) => (ch.charCodeAt(0) > 255 ? 1 : 0.55);
  const lines: string[] = [];
  let cur = '';
  let w = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const cw = weight(ch);
    if (w + cw > maxWidth && cur.length > 0) {
      lines.push(cur);
      cur = '';
      w = 0;
      if (lines.length === maxLines) break;
    }
    cur += ch;
    w += cw;
  }
  if (lines.length < maxLines && cur.length > 0) lines.push(cur);
  return lines;
}

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  maxLines: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  wrapLines(ctx, text, maxWidth / size, maxLines).forEach((ln, i) => {
    ctx.fillText(ln, x, y + i * Math.round(size * 1.25));
  });
}

function drawEvidence(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  drawCard(ctx, x, y, 186, 88, 2, COLORS.edge, 1);
  drawTextLines(ctx, text, x + 10, y + 26, 17, 166, 3, COLORS.text);
}

function drawVerdict(ctx: CanvasRenderingContext2D, c: CaseDef, step: number): void {
  const x = 796;
  const y = 54;
  const w = 244;
  const h = 160;
  if (step < 5) {
    ctx.fillStyle = COLORS.face;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.guide;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    const inner = 216;
    let yy = y + 32;
    wrapLines(ctx, c.ddx, inner / 18, 5).forEach((ln) => {
      drawSceneLabel(ctx, ln, x + 14, yy, true);
      yy += 24;
    });
    ctx.fillStyle = COLORS.face;
  } else {
    ctx.fillStyle = COLORS.ok;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.ok;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 26, y + 28, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 19, y + 28);
    ctx.lineTo(x + 25, y + 35);
    ctx.lineTo(x + 34, y + 20);
    ctx.stroke();
    drawTextLines(ctx, c.verdict, x + 48, y + 35, 18, 186, 2, COLORS.face);
    if (c.note.length > 0) {
      drawTextLines(ctx, c.note, x + 14, y + 96, 15, 216, 4, COLORS.face);
    }
  }
}

export const M92: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const viewRef = useRef({ caseId: 'b0484' as CaseId, step: 1 });
  const [caseId, setCaseId] = useState<CaseId>('b0484');
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(STEP_FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (cid: CaseId, st: number) => {
      void drawLegend;
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 222, 0.35);
      const c = CASES.find((it) => it.id === cid) || CASES[0];

      drawSceneLabel(ctx, '病例', 32, 42);
      drawCard(ctx, 32, 54, 312, 90, 2, COLORS.guide, 2);
      drawTextLines(ctx, c.chip, 44, 86, 22, 288, 1, COLORS.text);
      drawTextLines(ctx, c.site, 44, 110, 18, 288, 1, COLORS.muted);
      drawTextLines(ctx, c.size, 44, 132, 18, 288, 1, COLORS.muted);
      drawSceneLabel(ctx, '初始鉴别', 32, 166, true);
      drawTextLines(ctx, c.ddx, 32, 190, 18, 312, 2, COLORS.text);

      drawSceneLabel(ctx, '证据', 368, 42);
      const shown = Math.min(Math.max(st - 1, 0), 4);
      for (let i = 0; i < shown; i++) {
        const gx = 368 + (i % 2) * 208;
        const gy = 54 + Math.floor(i / 2) * 92;
        drawEvidence(ctx, gx, gy, c.evidence[i]);
      }

      drawVerdict(ctx, c, st);

      const dotY = 264;
      for (let i = 1; i <= 5; i++) {
        const dx = 380 + (i - 1) * 38;
        const cur = i === st;
        ctx.fillStyle = cur ? COLORS.pick : COLORS.face;
        ctx.beginPath();
        ctx.arc(dx, dotY, cur ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cur ? COLORS.pick : COLORS.guide;
        ctx.lineWidth = cur ? 3 : 2;
        ctx.beginPath();
        ctx.arc(dx, dotY, cur ? 9 : 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = cur ? COLORS.pick : COLORS.muted;
        ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(String(i), dx, dotY - 16);
      }

      drawSceneLabel(ctx, '结论', 796, 42);
      drawSceneLabel(ctx, '步骤', 300, 272, true);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(viewRef.current.caseId, viewRef.current.step);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (next: number) => {
    const v = clamp(next, 1, 5);
    viewRef.current.step = v;
    setStep(v);
    setFeedback(STEP_FEEDBACK[v - 1]);
  };

  const pickCase = (id: CaseId) => {
    viewRef.current.caseId = id;
    viewRef.current.step = 1;
    setCaseId(id);
    setStep(1);
    setFeedback(STEP_FEEDBACK[0]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CASES.map((c) => (
          <button
            key={c.id}
            className={`chip ${caseId === c.id ? 'selected' : ''}`}
            onClick={() => pickCase(c.id)}
          >
            {c.chip}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button className="chip" disabled={step === 1} onClick={() => goto(step - 1)}>
          上一步
        </button>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className={`chip ${step === s ? 'selected' : ''}`}
            onClick={() => goto(s)}
          >
            {s}
          </button>
        ))}
        <button className="chip" disabled={step === 5} onClick={() => goto(step + 1)}>
          {step === 5 ? '已完成' : '下一步'}
        </button>
        <button
          className="chip"
          onClick={() => {
            viewRef.current.step = 1;
            setStep(1);
            setFeedback(STEP_FEEDBACK[0]);
          }}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div className="metrics">
        <div className="metric">
          <div>当前步</div>
          <div>{STEP_TAGS[step - 1]}</div>
        </div>
        <div className="metric">
          <div>病例</div>
          <div>{(CASES.find((c) => c.id === caseId) || CASES[0]).chip}</div>
        </div>
      </div>
    </div>
  );
};

export default M92;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawAxisBox,
  drawPage,
  drawBars,
  fillRound,
  roundRect,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// §7 模块 7.2（P5 热点审计，1080×280）：逐条审计跨事件链接。
// 论文没有公布逐链接真值，因此三条链接全部是教学示意（.hotspot-info 明确标注“示意”）；
// Canvas 上的柱只画 Table 7 Overall 的 Constrained 总链接数 982 / 968 / 358，不画任何百分比。

const W = 1080;
const H = 280;

type LinkId = 'L1' | 'L2' | 'L3';
type Verdict = 'grounded' | 'spurious';

interface LinkInfo {
  line: string;
  text: string;
  source: string;
  judges: { gpt: boolean; qwen: boolean; ds: boolean };
}

const ORDER: LinkId[] = ['L1', 'L2', 'L3'];

const AUDIT: Record<LinkId, LinkInfo> = {
  L1: {
    line: '2022年8月一起',
    text: '2022 年 8 月两人一起参加过活动',
    source: 'Table 8 案例（示意，论文未公布逐链接真值）',
    judges: { gpt: true, qwen: true, ds: true },
  },
  L2: {
    line: '同一次活动',
    text: '她提到的那次活动就是同一次',
    source: '示意构造，非论文逐链接真值',
    judges: { gpt: false, qwen: false, ds: true },
  },
  L3: {
    line: '都去过那里',
    text: '他们都去过同一个地方',
    source: '示意构造，非论文逐链接真值',
    judges: { gpt: true, qwen: false, ds: false },
  },
};

// 右下区：三个链接热点的命中中心（1080×280 内部坐标）
const HOTSPOTS: { id: LinkId; x: number; y: number }[] = [
  { id: 'L1', x: 700, y: 220 },
  { id: 'L2', x: 830, y: 220 },
  { id: 'L3', x: 960, y: 220 },
];

// p.10 Table 7 Overall：Constrained 配置下的总链接数
const TOTALS: { name: string; v: number }[] = [
  { name: 'GPT', v: 982 },
  { name: 'Qwen', v: 968 },
  { name: 'DS', v: 358 },
];

const PAGE_LINE_Y: Record<LinkId, number> = { L1: 100, L2: 145, L3: 190 };

function majorityOf(id: LinkId): Verdict {
  const j = AUDIT[id].judges;
  const yes = (j.gpt ? 1 : 0) + (j.qwen ? 1 : 0) + (j.ds ? 1 : 0);
  return yes >= 2 ? 'grounded' : 'spurious';
}

function judgeText(v: boolean): string {
  return v ? '有据' : '臆造';
}

function pickFeedback(link: LinkId | null, verdict: Verdict | null): { text: string; cls: string } {
  if (link === null) {
    return { text: '先在注记页上点一条跨事件链接，再看它是否指得出具体日期。', cls: '' };
  }
  if (verdict === null) {
    return { text: '这条链接已经选中，请判断它是有据还是臆造。', cls: '' };
  }
  if (verdict === majorityOf(link)) {
    return verdict === 'grounded'
      ? { text: '判断一致：这条链接在源对话里有时间戳与具体依赖支撑。', cls: 'good' }
      : { text: '判断一致：这条链接没有源对话支撑，正是无约束合成会多出来的那一类。', cls: 'good' };
  }
  return { text: '判断不一致：对照三裁判给出的依据，再看这句话能不能指到具体日期。', cls: 'bad' };
}

export const C7LinkAudit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ link: LinkId | null; verdict: Verdict | null }>({
    link: null,
    verdict: null,
  });
  const [selected, setSelected] = useState<LinkId | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(pickFeedback(null, null));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { link: LinkId | null; verdict: Verdict | null }) => {
      clearScene(ctx, W, H, true);

      // 左区：注记页 + 三行小结（用色条表示，文字全部放在 DOM 的 .hotspot-info）
      drawPage(ctx, 60, 40, 520, 200, COL.route, 12);
      ORDER.forEach((id) => {
        const isSel = s.link === id;
        const y = PAGE_LINE_Y[id];
        fillRound(ctx, 78, y - 12, 300, 16, 5, isSel ? COL.orange : COL.axis);
        if (isSel) {
          ctx.save();
          ctx.strokeStyle = COL.orange;
          ctx.lineWidth = 3;
          roundRect(ctx, 72, y - 18, 312, 28, 6);
          ctx.stroke();
          ctx.restore();
        }
      });

      legend(
        ctx,
        [
          { c: COL.orange, t: '已选' },
          { c: COL.axis, t: '未选' },
          { c: COL.green, t: '判定一致' },
        ],
        636,
        152
      );

      // 右上块：三裁判在 Constrained 配置下的总链接数（裸数字，无百分比，无中文标签）
      drawAxisBox(ctx, 620, 40, 420, 90);
      drawBars(
        ctx,
        TOTALS.map((it) => ({ v: it.v, c: COL.blue })),
        640,
        55,
        380,
        60,
        1000
      );
      const bw = (380 - 18 * (TOTALS.length - 1)) / TOTALS.length;
      TOTALS.forEach((it, i) => {
        const bx = 640 + i * (bw + 18);
        label(ctx, String(it.v), bx + bw / 2, 128, COL.ink, 'center', 14);
      });

      // 右下块：三个链接热点
      HOTSPOTS.forEach((h) => {
        const isSel = s.link === h.id;
        if (isSel) {
          fillRound(ctx, h.x - 12, h.y - 12, 24, 24, 12, COL.white);
          ctx.save();
          ctx.strokeStyle = COL.orange;
          ctx.lineWidth = 3;
          roundRect(ctx, h.x - 12, h.y - 12, 24, 24, 12);
          ctx.stroke();
          ctx.restore();
        } else {
          fillRound(ctx, h.x - 11, h.y - 11, 22, 22, 11, COL.axis);
        }
        label(
          ctx,
          String(ORDER.indexOf(h.id) + 1),
          h.x,
          h.y + 6,
          isSel ? COL.orange : COL.muted,
          'center',
          16
        );
      });

      // 提交后的对错标记（只标在刚提交的那条链接旁）
      if (s.link !== null && s.verdict !== null) {
        const hit = HOTSPOTS.find((h) => h.id === s.link);
        if (hit) {
          const ok = s.verdict === majorityOf(s.link);
          const mk = ok ? COL.green : COL.red;
          ctx.save();
          ctx.strokeStyle = mk;
          ctx.lineWidth = 3;
          if (ok) {
            ctx.beginPath();
            ctx.arc(hit.x + 26, hit.y, 9, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(hit.x + 18, hit.y - 8);
            ctx.lineTo(hit.x + 34, hit.y + 8);
            ctx.moveTo(hit.x + 34, hit.y - 8);
            ctx.lineTo(hit.x + 18, hit.y + 8);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    const hit = HOTSPOTS.find((h) => {
      const dx = h.x - x;
      const dy = h.y - y;
      return dx * dx + dy * dy <= 30 * 30;
    });
    if (!hit) return;
    stateRef.current.link = hit.id;
    stateRef.current.verdict = null;
    setSelected(hit.id);
    setVerdict(null);
    setFeedback(pickFeedback(hit.id, null));
  };

  const onJudge = (v: Verdict) => {
    const link = stateRef.current.link;
    if (link === null) return;
    stateRef.current.verdict = v;
    setVerdict(v);
    setFeedback(pickFeedback(link, v));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        <button
          className={`chip${verdict === 'grounded' ? ' selected' : ''}`}
          onClick={() => onJudge('grounded')}
          disabled={selected === null}
          aria-pressed={verdict === 'grounded'}
        >
          有据
        </button>
        <button
          className={`chip${verdict === 'spurious' ? ' selected' : ''}`}
          onClick={() => onJudge('spurious')}
          disabled={selected === null}
          aria-pressed={verdict === 'spurious'}
        >
          臆造
        </button>
      </div>
      <div className="metrics">
        {TOTALS.map((it) => (
          <div className="metric" key={it.name}>
            <div className="l">{it.name} 有据链接数</div>
            <div className="v">{it.v}</div>
          </div>
        ))}
      </div>
      <div className="hotspot-info">
        {selected === null ? (
          <span>先在注记页上点一条跨事件链接，再看它是否指得出具体日期。</span>
        ) : (
          <span>
            <b>链接 {selected}（示意）</b>：{AUDIT[selected].text}。来源：{AUDIT[selected].source}；
            三裁判判定：GPT {judgeText(AUDIT[selected].judges.gpt)} / Qwen{' '}
            {judgeText(AUDIT[selected].judges.qwen)} / DS {judgeText(AUDIT[selected].judges.ds)}。
          </span>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C7LinkAudit;

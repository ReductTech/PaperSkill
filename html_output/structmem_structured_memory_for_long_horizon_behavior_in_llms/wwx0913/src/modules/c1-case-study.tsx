import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, drawPage, label } from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 1.2（P8 三方案对照 + 点击切换）：论文附录 A.8 / Table 8 的案例研究。
// 固定同一个问题，读者点按 Flat / Graph / StructMem 看三者各自"看到什么、答出什么、对不对"。
// 内容与 Table 8 一致；页面底部明确标注这是单个示例案例，不代表整体成绩（整体成绩见 Table 1）。

const W = 1080;
const H = 280;

type Key = 'flat' | 'graph' | 'structmem';

interface CaseMethod {
  key: Key;
  chip: string;
  index: number;
  color: string;
  entries: string[];
  relations?: string[];
  summary?: string;
  answer: string;
  verdict: 'wrong' | 'right';
  why: string;
  glyph: { cards: number; purpleFrom: number; links: boolean; nodes: boolean; page: boolean };
}

const QUESTION = 'Caroline 和 Melanie 什么时候一起去过 pride festival？';

const METHODS: CaseMethod[] = [
  {
    key: 'flat',
    chip: 'Flat Memory',
    index: 1,
    color: COL.red,
    entries: [
      'Caroline 在 2023-08-11 参加了 pride parade',
      'Caroline 去年在 Pride fest 玩得很开心（记录于 2023-08-17）',
      'Melanie 和一群人一起在 Pride fest 玩得很开心（记录于 2023-08-17）',
    ],
    answer: '「她们没有一起去过。」',
    verdict: 'wrong',
    why: '三条孤立的事实之间没有任何连接。Caroline 提到"去年"、Melanie 提到"这群人"，但没有任何一条线索能把两次提及绑成同一件事，于是模型只能得出"没一起去过"。',
    glyph: { cards: 3, purpleFrom: -1, links: false, nodes: false, page: false },
  },
  {
    key: 'graph',
    chip: 'Graph Memory',
    index: 2,
    color: COL.purple,
    entries: [
      'Caroline 在 2023-08-11 参加了 pride parade',
      'Caroline 去年在 Pride fest 玩得很开心（记录于 2023-08-17）',
      'Melanie 和一群人一起在 Pride fest 玩得很开心（记录于 2023-08-17）',
    ],
    relations: [
      'caroline → attended → pride_parade',
      'caroline → had_blast_at → pride_fest',
      'melanie → enjoyed_time_at → pride_fest',
      'melanie → expressed_excitement → caroline’s_pride_involvement',
    ],
    answer: '「上个月，2023 年 6 月。」',
    verdict: 'wrong',
    why: '图里有各自的参与边，却没有一条"共同参与"的边；而且实体消解没有把 pride_parade 与 pride_fest 认成同一件事。结构是硬的，但缺的那条边补不上，时间推断就错了。',
    glyph: { cards: 3, purpleFrom: -1, links: true, nodes: true, page: false },
  },
  {
    key: 'structmem',
    chip: 'StructMem',
    index: 3,
    color: COL.green,
    entries: [
      'Caroline 在 2023-08-11 参加了 pride parade',
      'Caroline 去年在 Pride fest 玩得很开心（记录于 2023-08-17）',
      'Melanie 对 Caroline 的 pride parade 经历表现出兴趣',
      'Melanie 和一群人一起在 Pride fest 玩得很开心（记录于 2023-08-17）',
      'Melanie 对 Caroline 参与 LGBTQ+ 社群表达了兴奋',
    ],
    summary:
      '「2023 年 8 月 17 日……她们回忆起去年一起在 Pride fest 的愉快时光，Melanie 提议安排一次家庭出游，而 Caroline 提议今年夏天就她们两个人单独出游……」',
    answer: '「去年，2022 年 8 月。」',
    verdict: 'right',
    why: '两条关系条目（第 3、5 条）说出了普通事实抽取不会产生的内容——她们在谈论同一件事。跨事件合成再把时间相邻的条目并成一页小结，"their（她们的）"这个所属格因此显式出现，2022 年 8 月就被推出来了。',
    glyph: { cards: 5, purpleFrom: 2, links: true, nodes: false, page: true },
  },
];

const LANE_Y = [20, 100, 180];
const LANE_H = 68;
const LANE_X = 24;
const LANE_W = 1032;

function drawGlyph(ctx: CanvasRenderingContext2D, m: CaseMethod, y0: number, active: boolean): void {
  const g = m.glyph;
  const cw = g.cards > 3 ? 34 : 40;
  const step = g.links ? cw + 4 : 66;
  const cy = y0 + 14;
  const ch = 24;
  const x0 = 200;

  for (let i = 0; i < g.cards; i += 1) {
    const x = x0 + i * step;
    const isPurple = g.purpleFrom >= 0 && i >= g.purpleFrom;
    const edge = isPurple ? COL.purple : active ? COL.ink : COL.axis;
    fillRound(ctx, x, cy, cw, ch, 5, COL.white);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    roundRect(ctx, x, cy, cw, ch, 5);
    ctx.stroke();
    // 条目内的两行示意
    ctx.fillStyle = isPurple ? COL.purple : COL.blue;
    ctx.fillRect(x + 6, cy + 7, cw - 16, 3);
    ctx.fillStyle = COL.axis;
    ctx.fillRect(x + 6, cy + 14, cw - 22, 3);
    // 连接
    if (g.links && i > 0) {
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, cy + ch / 2);
      ctx.lineTo(x, cy + ch / 2);
      ctx.stroke();
    }
  }

  if (g.nodes) {
    // 图结构：三个节点与两条边
    const nx = 400;
    const pts = [
      { x: nx, y: cy + 14 },
      { x: nx + 58, y: cy + 2 },
      { x: nx + 58, y: cy + 26 },
    ];
    ctx.strokeStyle = COL.purple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = COL.white;
      ctx.fill();
      ctx.strokeStyle = COL.purple;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  if (g.page) {
    // 跨事件小结：连线 + 一页小结
    drawArrow(ctx, 300, y0 + 42, 300, y0 + 52, COL.purple, 7);
    drawPage(ctx, 236, y0 + 52, 128, 12, COL.route, 1);
    ctx.fillStyle = COL.green;
    ctx.fillRect(236, y0 + 52, 4, 12);
  }
}

export const C1CaseStudy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<number>(0);
  const [sel, setSel] = useState(0);

  const m = METHODS[sel];

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

    const render = () => {
      const activeIdx = stateRef.current;
      clearScene(ctx, W, H, true);

      METHODS.forEach((method, i) => {
        const y0 = LANE_Y[i];
        const active = i === activeIdx;
        // 车道底板
        fillRound(ctx, LANE_X, y0, LANE_W, LANE_H, 10, active ? COL.white : 'rgba(255,255,255,0.55)');
        ctx.strokeStyle = active ? COL.orange : COL.axis;
        ctx.lineWidth = active ? 3 : 1;
        roundRect(ctx, LANE_X, y0, LANE_W, LANE_H, 10);
        ctx.stroke();

        // 序号圆盘
        ctx.beginPath();
        ctx.arc(56, y0 + LANE_H / 2, 14, 0, Math.PI * 2);
        ctx.fillStyle = active ? method.color : COL.axis;
        ctx.fill();

        // 方法名
        label(ctx, method.chip, 80, y0 + LANE_H / 2 + 6, active ? COL.ink : COL.muted, 'left', 16);

        // 记忆内容图示
        drawGlyph(ctx, method, y0, active);

        // 它给出的回答
        label(
          ctx,
          method.answer,
          560,
          y0 + LANE_H / 2 + 6,
          method.verdict === 'right' ? COL.green : COL.red,
          'left',
          16
        );

        // 判定圆环
        const vx = 960;
        const vy = y0 + LANE_H / 2;
        ctx.beginPath();
        ctx.arc(vx, vy, 14, 0, Math.PI * 2);
        ctx.strokeStyle = method.verdict === 'right' ? COL.green : COL.red;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        if (method.verdict === 'right') {
          ctx.moveTo(vx - 6, vy);
          ctx.lineTo(vx - 2, vy + 5);
          ctx.lineTo(vx + 7, vy - 6);
        } else {
          ctx.moveTo(vx - 6, vy - 6);
          ctx.lineTo(vx + 6, vy + 6);
          ctx.moveTo(vx + 6, vy - 6);
          ctx.lineTo(vx - 6, vy + 6);
        }
        ctx.strokeStyle = method.verdict === 'right' ? COL.green : COL.red;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const pick = (i: number): void => {
    stateRef.current = i;
    setSel(i);
  };

  return (
    <div>
      <div className="step-desc">
        <b>问题：</b>
        {QUESTION}
      </div>
      <div className="chip-row">
        {METHODS.map((method, i) => (
          <span
            key={method.key}
            className={`chip${i === sel ? ' selected' : ''}`}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => pick(i)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') pick(i);
            }}
          >
            {method.chip}
          </span>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback" style={{ borderLeftColor: '#27446e' }}>
        <b>它检索到的内容</b>
        <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
          {m.entries.map((e, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {e}
            </li>
          ))}
        </ul>
        {m.relations ? (
          <div style={{ marginTop: 8 }}>
            <b>关系三元组</b>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {m.relations.map((r, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {m.summary ? (
          <div style={{ marginTop: 8 }}>
            <b>合成记忆（跨事件小结）</b>
            <div style={{ marginTop: 4 }}>{m.summary}</div>
          </div>
        ) : null}
      </div>
      <div className={`feedback ${m.verdict === 'right' ? 'good' : 'bad'}`}>
        <b>它的回答：</b>
        {m.answer}
        {m.verdict === 'right'
          ? ' —— 与参考答案（2022）一致：正确。'
          : ' —— 与参考答案（2022）不符：错误。'}
      </div>
      <div className="feedback">
        <b>为什么</b>：{m.why}
      </div>
      <div className="feedback">
        说明：本模块是论文附录 A.8 / Table 8 的<b>单个示例案例</b>，用于看清三种机制在同一问题上的差别；它不代表整体成绩（整体对比见论文 Table 1）。
      </div>
    </div>
  );
};

export default C1CaseStudy;

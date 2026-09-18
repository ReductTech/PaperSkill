import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawBars } from './lighthouseKit';

// Module 9.1 — compare three harnesses: Claude Code / OpenClaw / CheetahClaws.
// P4 mode chips; the Canvas shows three fully-filled "duty manuals" plus a
// trust-explicitness bar chart. Each card carries its own text so no card reads
// as an empty placeholder.

const W = 1080;
const H = 340;

type Harness = 'Claude Code' | 'OpenClaw' | 'CheetahClaws';
const LIST: Harness[] = ['Claude Code', 'OpenClaw', 'CheetahClaws'];

const DATA: Record<Harness, { lang: string; scene: string; ctx: string; mem: string; src: string }> = {
  'Claude Code': {
    lang: 'TypeScript',
    scene: '厂商级编码智能体',
    ctx: '用户、项目、会话',
    mem: '持久文本记忆，自动抽取',
    src: '闭源',
  },
  OpenClaw: {
    lang: 'TypeScript',
    scene: '个人助手',
    ctx: '用户、频道对端、会话',
    mem: '对话历史 + 向量检索',
    src: '开源',
  },
  CheetahClaws: {
    lang: 'Python',
    scene: '研究参考实现',
    ctx: '用户、项目、会话',
    mem: '带置信度与近期性的结构化条目',
    src: '开源',
  },
};

// How explicitly the harness represents trust in memory (illustrative ordering).
const TRUST: Record<Harness, number> = { 'Claude Code': 0.35, OpenClaw: 0.3, CheetahClaws: 0.9 };
const BAR_COLOR: Record<Harness, string> = {
  'Claude Code': C.beam,
  OpenClaw: C.aux,
  CheetahClaws: C.mark,
};

const CARD_W = 316;
const CARD_H = 180;
const CARD_GAP = 26;
const CARD_X = 46;
const CARD_Y = 24;
const HEAD_H = 38;

export const Mod91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ selected: 'Claude Code' as Harness });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelectedState] = useState<Harness>('Claude Code');
  const [feedback, setFeedback] = useState({
    text: '面向可靠使用：持久项目上下文 + 即时检索。',
    cls: '' as '' | 'good' | 'bad',
  });

  const choose = (h: Harness) => {
    stateRef.current.selected = h;
    setSelectedState(h);
    if (h === 'Claude Code')
      setFeedback({ text: '面向可靠使用：持久项目上下文 + 即时检索。', cls: '' });
    else if (h === 'OpenClaw')
      setFeedback({ text: '面向多渠道入口：以会话历史与向量检索为主。', cls: '' });
    else
      setFeedback({ text: '面向透明与可复现：把置信度与近期性写成一等字段。', cls: 'good' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { selected: Harness }) => {
      clearScene(ctx, W, H);

      LIST.forEach((h, i) => {
        const x = CARD_X + i * (CARD_W + CARD_GAP);
        const y = CARD_Y;
        const on = s.selected === h;
        const d = DATA[h];

        // card body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, CARD_W, CARD_H);

        // header band
        ctx.fillStyle = on ? 'rgba(39,68,110,0.14)' : 'rgba(215,222,234,0.45)';
        ctx.fillRect(x, y, CARD_W, HEAD_H);
        ctx.strokeStyle = on ? C.beam : C.line;
        ctx.lineWidth = on ? 2.6 : 1.5;
        ctx.strokeRect(x, y, CARD_W, CARD_H);
        ctx.beginPath();
        ctx.moveTo(x, y + HEAD_H);
        ctx.lineTo(x + CARD_W, y + HEAD_H);
        ctx.stroke();

        // header text
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 16px "Segoe UI","Microsoft YaHei",sans-serif';
        ctx.fillText(h, x + 14, y + HEAD_H / 2 - 1);
        const nameW = ctx.measureText(h).width;
        ctx.fillStyle = C.inkMuted;
        ctx.font = '13px "Segoe UI","Microsoft YaHei",sans-serif';
        ctx.fillText(d.scene, x + 14 + nameW + 12, y + HEAD_H / 2);

        // body rows
        const rows: [string, string][] = [
          ['实现语言', d.lang],
          ['上下文治理', d.ctx],
          ['记忆', d.mem],
          ['源码可得性', d.src],
        ];
        rows.forEach(([k, v], ri) => {
          const ry = y + HEAD_H + 24 + ri * 27;
          ctx.fillStyle = C.inkMuted;
          ctx.font = '13px "Segoe UI","Microsoft YaHei",sans-serif';
          ctx.fillText(k, x + 14, ry);
          ctx.fillStyle = C.ink;
          ctx.font = '14px "Segoe UI","Microsoft YaHei",sans-serif';
          ctx.fillText(v, x + 92, ry);
        });
      });

      // trust-explicitness comparison
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      ctx.font = '14px "Segoe UI","Microsoft YaHei",sans-serif';
      ctx.fillText('信任表示方式的显式程度（示意，非论文实测）', CARD_X, 232);
      drawBars(
        ctx,
        CARD_X,
        256,
        1000,
        LIST.map((h) => ({ label: h, value: TRUST[h], color: BAR_COLOR[h] }))
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const d = DATA[selected];
  const rows: [string, string][] = [
    ['实现语言', d.lang],
    ['主要场景', d.scene],
    ['上下文治理', d.ctx],
    ['记忆', d.mem],
    ['源码可得性', d.src],
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {LIST.map((h) => (
          <button key={h} className={`chip ${selected === h ? 'on' : ''}`} onClick={() => choose(h)}>
            {h}
          </button>
        ))}
      </div>
      <table
        className="cmp"
        style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 14 }}
      >
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: `1px solid ${C.line}` }}>
              <td style={{ padding: '6px 10px', color: C.inkMuted, width: '30%' }}>{k}</td>
              <td style={{ padding: '6px 10px', color: C.ink }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 13, color: C.inkMuted, margin: '4px 0 8px' }}>
        三个系统不作排名；CheetahClaws 由本文作者开发，因此这里不是独立背书。
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod91;

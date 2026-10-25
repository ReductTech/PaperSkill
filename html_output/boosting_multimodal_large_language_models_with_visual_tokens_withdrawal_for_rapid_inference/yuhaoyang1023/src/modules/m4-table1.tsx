import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, ripple, easeOut } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Feedback, Tags, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { TABLE1 } from '../data/tables';

// 4.2 表 1 消融（论文实测，LLaVA-1.5-7B，MME 总分，单次运行）。
// 横向条形图：方法名在条形上方，条形占满整行（手机友好）。

type Key = (typeof TABLE1)[number]['key'];
const COLORS: Record<Key, string> = { base: C.base, a: C.ink3, b: '#C9C9DD', c: C.vis };

const CH: { id: string; ask: string; answer: Key; options: Key[] }[] = [
  { id: 'q1', ask: '(a) 完全不给图 和 (b) 前 16 层给一张白图，哪个得分更低？', answer: 'b', options: ['a', 'b'] },
  { id: 'q2', ask: '(c) 只在前 16 层给原图，得分最接近哪一行？', answer: 'base', options: ['base', 'a', 'b'] },
];

export const M4Table1: React.FC<WidgetProps> = () => {
  const ch = useChallenge(CH.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<Key | null>(null);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.7)).current;
  const rows = useRef<{ key: Key; y0: number; y1: number }[]>([]);
  const cur = CH[ci];
  const hidden = ch.guessing && picked === null;

  const s = useStage(
    {
      heightOf: (w) => clamp(56 * 4 + 20, 220, 260) + (w < 420 ? 10 : 0),
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const rowH = (h - 10) / 4;
        const max = 2000;
        rows.current = [];
        TABLE1.forEach((r, i) => {
          const y = 6 + i * rowH;
          rows.current.push({ key: r.key, y0: y, y1: y + rowH });
          // 挑战：第 1 题隐藏 (a)(b)；第 2 题只隐藏 (c)
          const hideThis = hidden && (cur.id === 'q1' ? r.key === 'a' || r.key === 'b' : r.key === 'c');
          txt(ctx, r.label, 2, y + 10, { size: 11, color: C.ink2, weight: 600 });
          const bw = w - 70;
          const target = hideThis ? 0 : r.score / max;
          const v = anim.to(`b${r.key}-${hideThis}`, target, dt, final, 7 - i);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          rr(ctx, 2, y + 20, bw, rowH - 28, 5);
          ctx.fill();
          if (!hideThis) {
            ctx.fillStyle = rgba(COLORS[r.key], 0.9);
            rr(ctx, 2, y + 20, bw * v, rowH - 28, 5);
            ctx.fill();
            txt(ctx, (r.score * (v / Math.max(1e-6, target))).toFixed(2), 2 + bw * v + 6, y + 20 + (rowH - 28) / 2, { size: 11, color: C.ink, weight: 700 });
          } else {
            txt(ctx, '?', 2 + bw / 2, y + 20 + (rowH - 28) / 2, { size: 13, color: C.ink3, align: 'center', weight: 700 });
          }
          if (ch.guessing && picked === r.key) {
            ctx.strokeStyle = picked === cur.answer ? C.ok : C.warn;
            ctx.lineWidth = 2;
            rr(ctx, 0, y + 2, w - 2, rowH - 6, 6);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        });
        // 原模型参考线
        const bw = w - 70;
        const xr = 2 + bw * (1866.1 / max);
        ctx.strokeStyle = rgba(C.moon, 0.5);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xr, 20);
        ctx.lineTo(xr, h - 6);
        ctx.stroke();
        ctx.setLineDash([]);
        const pp = pulse.p(t, final);
        if (pp >= 0 && picked) {
          const r = rows.current.find((x) => x.key === picked);
          if (r) ripple(ctx, w / 2, (r.y0 + r.y1) / 2, easeOut(pp), C.moon, 40);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [hidden, picked, ci, ch.guessing]
  );

  const pick = (k: Key) => {
    if (picked !== null || !cur.options.includes(k)) return;
    setPicked(k);
    pulse.fire(performance.now() / 1000);
    ch.record(cur.id, k === cur.answer);
  };
  const onTap = (_x: number, y: number) => {
    if (!ch.guessing) return;
    const r = rows.current.find((x) => y >= x.y0 && y <= x.y1);
    if (r) pick(r.key);
  };

  const lab = (k: Key) => TABLE1.find((r) => r.key === k)!.short;

  return (
    <div className="mod-stack">
      <div className="mod-toolbar">
        <ModeSwitch
          ch={{
            ...ch,
            setMode: (m) => {
              ch.setMode(m);
              setCi(0);
              setPicked(null);
            },
          }}
        />
        <Tags kinds={['paper']} />
        <EvChip id="tab1" />
      </div>
      <StageBox
        s={s}
        onTap={onTap}
        label={hidden ? `挑战：${cur.ask}` : '表 1：原模型 1866.10，(a) 不给图 970.89，(b) 前 16 层给白图 845.39，(c) 前 16 层给原图 1872.43'}
      />
      {ch.guessing ? (
        <>
          <Guess
            q={cur.ask}
            options={cur.options.map((k) => ({ value: k, label: lab(k) }))}
            answer={cur.answer}
            picked={picked}
            onPick={pick}
            explain={
              cur.id === 'q1' ? (
                <p>白图 845.39，比完全不给图的 970.89 还低 125.50 分。论文的解释：前 16 层里“错误的视觉信息”已经迁移进了文字 token，撤掉视觉 token 也消除不了。</p>
              ) : (
                <p>(c) 1872.43，与原模型 1866.10 只差 6.33 分（满分 2800）。论文是单次运行、没有置信区间，这个差值无法判断是否超出评测波动。</p>
              )
            }
            canvasHint="点画布上的一行条形，或点下面的选项"
          />
          <div className="ctrl-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={picked === null || ci >= CH.length - 1}
              onClick={() => {
                setCi((i) => i + 1);
                setPicked(null);
              }}
            >
              下一题（{Math.min(ci + 2, CH.length)}/{CH.length}）
            </button>
          </div>
          <ScoreBar
            ch={ch}
            onRestart={() => {
              setCi(0);
              setPicked(null);
            }}
          />
        </>
      ) : (
        <Feedback
          tone="info"
          lead={
            <>
              给错图（845.39）比不给图（970.89）还差；前 16 层给原图（1872.43）与原模型（1866.10）几乎相同。
            </>
          }
          more={
            <p>
              (b)(c) 都在第 16 层之后去掉视觉 token（表注写作 “last 16-th layer”）。这组消融只在 LLaVA-1.5-7B、MME 上做了一次；白图同时是“错误信息”和“分布外输入”，论文的“信息迁移”解释与结果相符，但没有把两种因素分开。
            </p>
          }
        />
      )}
    </div>
  );
};

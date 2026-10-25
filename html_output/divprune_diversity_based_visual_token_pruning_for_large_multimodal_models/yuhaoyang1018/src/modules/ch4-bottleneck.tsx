import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useTween } from '../lib/hooks';
import { C, FONT_SANS, FONT_MONO } from '../lib/palette';
import { Btn, Feedback } from '../ui/kit';
import { bruteBest, euclidOf, minPair, type Pt } from '../lib/maxmin';

// 4.2 找短板：在 10 个点中选 4 个，Eq. (3) 方括号内的值 = 子集内最近一对的距离。

const K = 4;
const LABELS = 'ABCDEFGHIJ'.split('');
const PTS: Pt[] = [
  { x: 0.1, y: 0.28, c: 0 },
  { x: 0.22, y: 0.78, c: 0 },
  { x: 0.33, y: 0.45, c: 0 },
  { x: 0.42, y: 0.16, c: 0 },
  { x: 0.5, y: 0.62, c: 0 },
  { x: 0.6, y: 0.88, c: 0 },
  { x: 0.66, y: 0.38, c: 0 },
  { x: 0.78, y: 0.12, c: 0 },
  { x: 0.84, y: 0.66, c: 0 },
  { x: 0.93, y: 0.4, c: 0 },
];

export const Ch4Bottleneck: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<number[]>([1, 2, 4, 5]);
  const [showBest, setShowBest] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => Math.min(340, Math.max(230, W * 0.52)));

  // 距离在固定纵横比（1.6 : 1）的坐标中计算，绘制时用统一比例，画面上的远近与数值一致
  const AR = 1.6;
  const d = useMemo(() => euclidOf(PTS.map((p) => ({ ...p, x: p.x * AR }))), []);
  const best = useMemo(() => bruteBest(PTS.length, K, d), [d]);
  const mp = minPair(sel, d);
  const cur = sel.length >= 2 ? mp.v : 0;
  const curT = useTween(cur, 320);

  const sc = Math.max(1, Math.min((w - 44) / AR, h - 44));
  const ox = (w - sc * AR) / 2;
  const oy = (h - sc) / 2;
  const pos = (i: number) => ({ x: ox + PTS[i].x * AR * sc, y: oy + PTS[i].y * sc });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    // 已选点两两连线
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(59, 91, 255, 0.35)';
    for (let a = 0; a < sel.length; a++) {
      for (let b = a + 1; b < sel.length; b++) {
        const p = pos(sel[a]);
        const q = pos(sel[b]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    // 最优解（虚线圈）
    if (showBest) {
      best.set.forEach((i) => {
        const p = pos(i);
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
    // 短板
    if (sel.length >= 2 && mp.a >= 0) {
      const p = pos(mp.a);
      const q = pos(mp.b);
      ctx.strokeStyle = C.verm;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      ctx.font = `600 12px ${FONT_MONO}`;
      ctx.fillStyle = C.vermD;
      ctx.fillText(mp.v.toFixed(3), (p.x + q.x) / 2 + 6, (p.y + q.y) / 2 - 6);
    }
    // 点
    PTS.forEach((_, i) => {
      const p = pos(i);
      const on = sel.includes(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, on ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = on ? C.verm : C.paper;
      ctx.strokeStyle = on ? C.vermD : C.ink2;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.font = `700 11px ${FONT_SANS}`;
      ctx.fillStyle = on ? '#fff' : C.ink2;
      ctx.textAlign = 'center';
      ctx.fillText(LABELS[i], p.x, p.y + 4);
      ctx.textAlign = 'left';
    });
  }, [w, h, sel, showBest, best, mp.a, mp.b, mp.v, canvasRef, sc, ox, oy]);

  const toggle = (i: number) => {
    if (sel.includes(i)) {
      setMsg(null);
      setSel(sel.filter((x) => x !== i));
    } else if (sel.length >= K) {
      setMsg(`已经选满 ${K} 个了：先点一个已选的点把它取消，再选新的。`);
    } else {
      setMsg(null);
      setSel([...sel, i]);
    }
  };

  const onCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let bi = -1;
    let bd = 26;
    PTS.forEach((_, i) => {
      const p = pos(i);
      const dd = Math.hypot(p.x - x, p.y - y);
      if (dd < bd) {
        bd = dd;
        bi = i;
      }
    });
    if (bi >= 0) toggle(bi);
  };

  const full = sel.length === K;
  const ratio = full ? cur / best.v : 0;
  let tone: 'info' | 'good' | 'warn' = 'info';
  let fb = `已选 ${sel.length} / ${K} 个。选满 4 个后，红线标出子集里最近的一对——它的长度就是这个子集的得分。`;
  if (full) {
    if (ratio > 0.999) {
      tone = 'good';
      fb = `得分 ${cur.toFixed(3)}，已经等于穷举的最优值 ${best.v.toFixed(3)}。注意：最优子集里没有任何两点挤在一起。`;
    } else {
      tone = 'warn';
      fb = `得分 ${cur.toFixed(3)}，是最优值 ${best.v.toFixed(3)} 的 ${(ratio * 100).toFixed(0)}%。短板是 ${LABELS[mp.a]}–${LABELS[mp.b]} 这一对：换掉其中一个，往更空的地方挪。`;
    }
  }

  return (
    <div className="w">
      <div ref={wrapRef} className="cv cv-tap">
        <canvas ref={canvasRef} onClick={onCanvas} role="img" aria-label={`点选画布：已选 ${sel.map((i) => LABELS[i]).join('、') || '无'}`} />
      </div>
      <div className="chip-row" role="group" aria-label="用按钮选择点（键盘可用）">
        {PTS.map((_, i) => (
          <button key={i} type="button" className={`pchip ${sel.includes(i) ? 'is-on' : ''}`} aria-pressed={sel.includes(i)} onClick={() => toggle(i)}>
            {LABELS[i]}
          </button>
        ))}
      </div>
      <div className="readouts">
        <div className="ro ro-verm">
          <span>你的子集得分（最近一对）</span>
          <b>{sel.length >= 2 ? curT.toFixed(3) : '—'}</b>
        </div>
        <div className="ro ro-green">
          <span>穷举最优（C(10,4) = 210 种）</span>
          <b>{showBest ? best.v.toFixed(3) : '？'}</b>
        </div>
      </div>
      <div className="ctl-row">
        <Btn onClick={() => setShowBest((v) => !v)}>{showBest ? '隐藏最优解' : '显示最优解'}</Btn>
        <Btn onClick={() => { setSel([]); setMsg(null); }}>清空</Btn>
        {showBest ? <span className="w-note inline">最优解：{best.set.map((i) => LABELS[i]).join('、')}</span> : null}
      </div>
      <Feedback tone={msg ? 'warn' : tone}>{msg ?? fb}</Feedback>
    </div>
  );
};

export default Ch4Bottleneck;

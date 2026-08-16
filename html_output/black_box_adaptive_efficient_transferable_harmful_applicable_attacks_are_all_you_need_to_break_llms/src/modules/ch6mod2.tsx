import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Tab = 'asr' | 'evus';

const C = {
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  bg: '#fbfcfe',
};

const DISTS = {
  D1: { scores: [0.49, 0.49, 0.49, 0.49], asr: 0, evus: 0.49, color: C.orange, label: '全是 0.49' },
  D2: { scores: [0.51, 0, 0, 0], asr: 1, evus: 0.319, color: C.red, label: '一个 0.51，其余 0' },
  D3: { scores: [0.99, 0.99, 0.99, 0.99], asr: 1, evus: 0.99, color: C.green, label: '全是 0.99' },
} as const;

type DistId = keyof typeof DISTS;

function asrAtTau(scores: readonly number[], tau: number): number {
  return scores.some((s) => s > tau) ? 1 : 0;
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: { l: number; r: number; t: number; b: number },
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  xLabel: string,
  yLabel: string
) {
  const L = pad.l;
  const T = pad.t;
  const W = w - pad.l - pad.r;
  const H = h - pad.t - pad.b;
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L, T);
  ctx.lineTo(L, T + H);
  ctx.lineTo(L + W, T + H);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(xLabel, L + W - 28, T + H + 18);
  ctx.fillText(yLabel, 8, T + 8);
  ctx.fillText(String(x0), L - 2, T + H + 14);
  ctx.fillText(String(x1), L + W - 8, T + H + 14);
  ctx.fillText(String(y1), 8, T + H);
  return {
    mapX: (x: number) => L + ((x - x0) / (x1 - x0)) * W,
    mapY: (y: number) => T + H - ((y - y0) / (y1 - y0)) * H,
  };
}

function CompareBars({
  items,
}: {
  items: { label: string; value: number; color: string; caption?: string }[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 520, 180);
    } catch {
      return;
    }
    const n = items.length;
    const { mapX, mapY } = drawAxes(
      ctx,
      520,
      180,
      { l: 40, r: 16, t: 16, b: 36 },
      0,
      n,
      0,
      1,
      '',
      '值'
    );
    items.forEach((it, i) => {
      const x0 = mapX(i + 0.22);
      const x1 = mapX(i + 0.78);
      const y0 = mapY(0);
      const y1 = mapY(it.value);
      ctx.fillStyle = it.color;
      ctx.fillRect(x0, y1, x1 - x0, y0 - y1);
      ctx.fillStyle = C.text;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(it.label, x0, y0 + 16);
      ctx.fillText(it.value.toFixed(2), x0 + 4, y1 - 4);
      if (it.caption) {
        ctx.fillStyle = C.muted;
        ctx.fillText(it.caption, x0, y0 + 30);
      }
    });
    canvas.classList.add('is-ready');
  }, [items]);
  return <canvas ref={ref} width={520} height={180} style={{ width: '100%', maxWidth: 520 }} />;
}

function ScoreAxis({
  scores,
  tau,
  color,
}: {
  scores: readonly number[];
  tau: number;
  color: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 520, 86);
    } catch {
      return;
    }
    const { mapX, mapY } = drawAxes(
      ctx,
      520,
      86,
      { l: 36, r: 16, t: 10, b: 22 },
      0,
      1,
      0,
      1,
      'h(y)',
      ''
    );
    ctx.strokeStyle = C.blue;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mapX(tau), mapY(0));
    ctx.lineTo(mapX(tau), mapY(1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.blue;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText(`τ=${tau.toFixed(2)}`, mapX(tau) + 4, 14);
    scores.forEach((s, i) => {
      ctx.beginPath();
      ctx.arc(mapX(s), mapY(0.45), 6, 0, Math.PI * 2);
      ctx.fillStyle = s > tau ? color : C.muted;
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.font = '10px sans-serif';
      ctx.fillText(`s${i + 1}`, mapX(s) - 8, mapY(0.45) - 10);
    });
    canvas.classList.add('is-ready');
  }, [scores, tau, color]);
  return <canvas ref={ref} width={520} height={86} style={{ width: '100%', maxWidth: 520 }} />;
}

function GroupedBars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 520, 200);
    } catch {
      return;
    }
    const ids: DistId[] = ['D1', 'D2', 'D3'];
    const { mapX, mapY } = drawAxes(
      ctx,
      520,
      200,
      { l: 40, r: 16, t: 18, b: 32 },
      0,
      3,
      0,
      1,
      '',
      '指标'
    );
    ids.forEach((id, i) => {
      const d = DISTS[id];
      const xAsr = mapX(i + 0.18);
      const xEv = mapX(i + 0.48);
      const w = mapX(i + 0.42) - mapX(i + 0.18);
      ctx.fillStyle = C.red;
      ctx.fillRect(xAsr, mapY(d.asr), w, mapY(0) - mapY(d.asr));
      ctx.fillStyle = C.green;
      ctx.fillRect(xEv, mapY(d.evus), w, mapY(0) - mapY(d.evus));
      ctx.fillStyle = C.text;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(id, mapX(i + 0.32), mapY(0) + 16);
    });
    ctx.fillStyle = C.red;
    ctx.fillText('ASR(4, 0.5)', 48, 14);
    ctx.fillStyle = C.green;
    ctx.fillText('EVUS(N=4)', 160, 14);
    canvas.classList.add('is-ready');
  }, []);
  return <canvas ref={ref} width={520} height={200} style={{ width: '100%', maxWidth: 520 }} />;
}

function FprCurve({ eps }: { eps: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const xs = useMemo(() => Array.from({ length: 41 }, (_, i) => 1 + i * 8), []);
  const ys = useMemo(() => xs.map((n) => 1 - Math.pow(1 - eps, n)), [xs, eps]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 520, 180);
    } catch {
      return;
    }
    const { mapX, mapY } = drawAxes(
      ctx,
      520,
      180,
      { l: 40, r: 12, t: 16, b: 26 },
      1,
      321,
      0,
      1,
      'n',
      'ASR'
    );
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const px = mapX(x);
      const py = mapY(ys[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    canvas.classList.add('is-ready');
  }, [eps, xs, ys]);
  return <canvas ref={ref} width={520} height={180} style={{ width: '100%', maxWidth: 520 }} />;
}

function BinomFrac({ top, bot }: { top: React.ReactNode; bot: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.15,
        margin: '0 4px',
        fontSize: '0.82em',
      }}
    >
      <span style={{ borderBottom: '1.5px solid currentColor', padding: '0 7px' }}>{top}</span>
      <span style={{ padding: '0 7px' }}>{bot}</span>
    </span>
  );
}

const FLAWS: { id: DistId | 'fpr'; title: string; text: string }[] = [
  {
    id: 'D1',
    title: '阈值敏感',
    text: '四个分数全是 0.49：τ=0.5 时 ASR=0；只要有一个 0.51，ASR 立刻变成 1。分数差一点，指标可以从 0 跳到 1。',
  },
  {
    id: 'D2',
    title: '严重度盲目',
    text: '「一个勉强过线」和「四个都是 0.99」的 ASR 都是 1.00，威胁完全不同。EVUS 则是 0.319 vs 0.99。',
  },
  {
    id: 'D2',
    title: '样本效率盲目',
    text: 'ASR 只问这 n=4 次里有没有成功，不问多快成功。立刻打穿和几乎用尽预算，被算成同一分。',
  },
  {
    id: 'fpr',
    title: '假阳性塌缩',
    text: '评判器哪怕只有很小的假阳性率 ε，抽的样本一多，ASR 也会被顶到 1。这时量到的是噪声，不是攻击有多强。',
  },
];

export const Ch6Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [tab, setTab] = useState<Tab>('asr');
  const [flaw, setFlaw] = useState(0);
  const [tau, setTau] = useState(0.5);
  const [eps, setEps] = useState(0.02);

  const distId: DistId = FLAWS[flaw].id === 'fpr' ? 'D2' : FLAWS[flaw].id;
  const d = DISTS[distId];
  const liveAsr = asrAtTau(d.scores, tau);

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        <button type="button" className={`chip${tab === 'asr' ? ' selected' : ''}`} onClick={() => setTab('asr')}>
          ASR 的四类缺陷
        </button>
        <button type="button" className={`chip${tab === 'evus' ? ' selected' : ''}`} onClick={() => setTab('evus')}>
          EVUS 公式及其有效性
        </button>
      </div>

      {tab === 'asr' ? (
        <>
          <p style={{ margin: '10px 0 8px', fontSize: 14, lineHeight: 1.65 }}>
            先前常用 h(y) &gt; τ 得到 ASR。下面用每行为 4 个分数的三个例子说明它为什么不可靠。
          </p>
          <div className="chip-row">
            {FLAWS.map((f, i) => (
              <button
                key={f.title}
                type="button"
                className={`chip${flaw === i ? ' selected' : ''}`}
                onClick={() => setFlaw(i)}
              >
                {f.title}
              </button>
            ))}
          </div>
          <div className="opt-card bad" style={{ marginTop: 12 }}>
            <div className="opt-kicker">{FLAWS[flaw].title}</div>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65 }}>{FLAWS[flaw].text}</p>
          </div>
          {FLAWS[flaw].id === 'fpr' ? (
            <>
              <div className="ctrl">
                <label>
                  假阳性率 ε <span className="val">{eps.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={Math.round(eps * 1000)}
                  onChange={(e) => setEps(Number(e.target.value) / 1000)}
                />
              </div>
              <FprCurve eps={eps} />
              <div className="feedback bad">
                ASR(n) = 1 − (1 − ε)<sup>n</sup>。n 一大，即使用户完全无害，ASR 也会趋向 1。
              </div>
            </>
          ) : flaw === 0 ? (
            <>
              <CompareBars
                items={[
                  { label: '全是 0.49', value: asrAtTau(DISTS.D1.scores, tau), color: C.orange, caption: 'ASR' },
                  { label: '一个 0.51', value: asrAtTau(DISTS.D2.scores, tau), color: C.red, caption: 'ASR' },
                ]}
              />
              <div className="ctrl">
                <label>
                  阈值 τ <span className="val">{tau.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(tau * 100)}
                  onChange={(e) => setTau(Number(e.target.value) / 100)}
                />
              </div>
              <div className="feedback bad">
                τ=0.50 时左柱为 0、右柱为 1。拖动阈值会看到 ASR 在 0.49 附近突然翻转。
              </div>
            </>
          ) : flaw === 1 ? (
            <>
              <CompareBars
                items={[
                  { label: 'D2 ASR', value: 1, color: C.red },
                  { label: 'D3 ASR', value: 1, color: C.red },
                  { label: 'D2 EVUS', value: 0.319, color: C.green },
                  { label: 'D3 EVUS', value: 0.99, color: C.green },
                ]}
              />
              <div className="feedback bad">
                两根红柱一样高（ASR 都是 1），两根绿柱差很多（0.32 vs 0.99）：ASR 看不见严重度，EVUS 看得见。
              </div>
            </>
          ) : (
            <>
              <div className="ctrl">
                <label>
                  阈值 τ <span className="val">{tau.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(tau * 100)}
                  onChange={(e) => setTau(Number(e.target.value) / 100)}
                />
              </div>
              <ScoreAxis scores={d.scores} tau={tau} color={d.color} />
              <div className="feedback bad">
                {d.label}。τ={tau.toFixed(2)} 时 ASR={liveAsr.toFixed(0)}，论文在 τ=0.5、n=4 下报告 ASR={d.asr.toFixed(2)}、EVUS={d.evus.toFixed(3)}。
              </div>
            </>
          )}
        </>
      ) : null}

      {tab === 'evus' ? (
        <>
          <div className="opt-card good" style={{ marginTop: 12 }}>
            <div className="opt-kicker">EVUS：对阈值积分，对样本量平均</div>
            <div
              style={{
                margin: '10px 0 12px',
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid #d7deea',
                borderRadius: 8,
                color: '#27446e',
                fontFamily: '"Cambria Math", Georgia, serif',
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.8,
                overflowX: 'auto',
              }}
            >
              EASR<sub>b</sub>(n, τ) = 1 −
              <BinomFrac top={<>m<sub>b</sub> − k<sub>b</sub>(τ)</>} bot="n" />
              /
              <BinomFrac top={<>m<sub>b</sub></>} bot="n" />
              <div style={{ marginTop: 10 }}>
                EVUS = (1 / |ℬ|) ∑<sub>b</sub> (1 / m<sub>b</sub>) ∑<sub>n=1</sub>
                <sup>m<sub>b</sub></sup> ∫<sub>0</sub>
                <sup>1</sup> EASR<sub>b</sub>(n, τ) dτ
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>
              先算「从完成池里抽 n 条、至少一条过线」的期望，再对 n 平均、对 τ 积分。这样同时看严重度、看样本效率，也不被单一阈值卡住。
            </p>
          </div>
          <p style={{ margin: '12px 0 6px', fontSize: 14 }}>
            同一组四个分数、n=4：ASR 分不开 D2 和 D3，EVUS 可以。
          </p>
          <GroupedBars />
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420, fontSize: 13 }}>
              <thead>
                <tr>
                  {['分布', '四个分数', 'ASR(4, 0.5)', 'EVUS(N=4)'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'center',
                        padding: 6,
                        borderBottom: '1px solid #d7deea',
                        color: '#27446e',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(DISTS) as DistId[]).map((id) => (
                  <tr key={id}>
                    <td style={{ textAlign: 'center', padding: 6, fontWeight: 700 }}>{id}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>[{DISTS[id].scores.join(', ')}]</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>{DISTS[id].asr.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: 6, color: '#228d5c', fontWeight: 700 }}>
                      {DISTS[id].evus.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="feedback good">
            D1 全在阈值下一点，ASR=0 但 EVUS=0.49；D2 与 D3 的 ASR 同为 1，EVUS 却是 0.319 vs 0.99。积分把「过线没有」换成「整张成功曲面有多大」。
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Ch6Mod2;

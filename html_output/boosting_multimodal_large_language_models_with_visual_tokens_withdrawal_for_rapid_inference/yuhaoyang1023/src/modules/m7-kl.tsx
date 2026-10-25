import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Controls, Feedback, Slider, Tags, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { TABLE5 } from '../data/tables';

// 7.1 KL 扫描器。曲线是教学示意：形状参照图 8(b)，并刻意与表 5 的 η → K 对应关系一致
// （η = 0.006/0.005/0.004/0.003/0.002/0.001 → K = 12/13/14/15/15/15）。纵轴用对数刻度，便于看清阈值附近。
// 候选 K 为 5…31，对应代码的 drop_layer_idx（前 K 层带视觉 token）。

const KS = Array.from({ length: 27 }, (_, i) => i + 5);
const KL: Record<number, number> = {
  5: 0.45, 6: 0.44, 7: 0.36, 8: 0.28, 9: 0.18, 10: 0.09, 11: 0.03, 12: 0.0055, 13: 0.0045, 14: 0.0035, 15: 0.0008,
  16: 0.0007, 17: 0.0009, 18: 0.0006, 19: 0.0007, 20: 0.0006, 21: 0.0005, 22: 0.0006, 23: 0.0005, 24: 0.0005, 25: 0.0004,
  26: 0.0005, 27: 0.0004, 28: 0.0004, 29: 0.0003, 30: 0.0003, 31: 0.0003,
};
const ETAS = [0.0001, 0.0005, 0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.01, 0.05];
const firstK = (eta: number) => KS.find((k) => KL[k] <= eta) ?? null;

const CH = [
  { id: 'a', eta: 0.004 },
  { id: 'b', eta: 0.001 },
  { id: 'c', eta: 0.006 },
];

export const M7Kl: React.FC<WidgetProps> = () => {
  const [ei, setEi] = useState(4); // 0.003
  const ch = useChallenge(CH.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const anim = useRef(new Anim()).current;
  const scan = useRef(new Pulse(2.4)).current;
  const geo = useRef<{ x: number; y: number; k: number }[]>([]);

  const eta = ch.guessing ? CH[ci].eta : ETAS[ei];
  const K = firstK(eta);
  const hidden = ch.guessing && picked === null;
  const t5 = TABLE5.find((r) => Math.abs(r.eta - eta) < 1e-9);

  // η 变化时重新扫描
  const scanKey = `${eta}-${hidden}`;
  const lastKey = useRef('');
  if (lastKey.current !== scanKey) {
    lastKey.current = scanKey;
    scan.fire(performance.now() / 1000);
  }

  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.5, 260, 360),
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = 46;
        const right = w - 12;
        const top = 18;
        const bottom = h - 34;
        const lo = Math.log10(0.0002);
        const hi = Math.log10(1);
        const X = (k: number) => left + ((k - 5) / 26) * (right - left);
        const Y = (v: number) => bottom - ((Math.log10(Math.max(v, 0.0002)) - lo) / (hi - lo)) * (bottom - top);
        // 网格
        [0.0001, 0.001, 0.01, 0.1, 1].forEach((v) => {
          if (v < 0.0002) return;
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.beginPath();
          ctx.moveTo(left, Y(v));
          ctx.lineTo(right, Y(v));
          ctx.stroke();
          txt(ctx, String(v), left - 4, Y(v), { size: 9, color: C.ink3, align: 'right' });
        });
        txt(ctx, 'KL（对数刻度）', left, 8, { size: 9, color: C.ink3 });
        [5, 10, 15, 20, 25, 31].forEach((k) => txt(ctx, String(k), X(k), bottom + 12, { size: 9, color: C.ink3, align: 'center' }));
        txt(ctx, '候选 K（前 K 层带视觉 token）', (left + right) / 2, bottom + 26, { size: 9, color: C.ink3, align: 'center' });
        // 阈值线
        const ey = anim.to('eta', Y(eta), dt, final, 9, 2);
        ctx.strokeStyle = C.warn;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(left, ey);
        ctx.lineTo(right, ey);
        ctx.stroke();
        ctx.setLineDash([]);
        txt(ctx, `η = ${eta}`, right, ey - 9, { size: 10, color: C.warn, align: 'right', weight: 700 });
        // 曲线
        ctx.strokeStyle = rgba(C.vis, 0.7);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        KS.forEach((k, i) => (i === 0 ? ctx.moveTo(X(k), Y(KL[k])) : ctx.lineTo(X(k), Y(KL[k]))));
        ctx.stroke();
        ctx.lineWidth = 1;
        // 扫描：从 K = 5 往后逐个检查，停在第一个 ≤ η 的点
        const sp = hidden ? -1 : scan.p(performance.now() / 1000, final);
        const stopIdx = K === null ? KS.length - 1 : KS.indexOf(K);
        const scanned = sp < 0 ? stopIdx : Math.min(stopIdx, Math.floor(easeOut(sp) * (stopIdx + 1.2)));
        geo.current = [];
        KS.forEach((k, i) => {
          const x = X(k);
          const y = Y(KL[k]);
          geo.current.push({ x, y, k });
          const checked = !hidden && i <= scanned;
          const isK = !hidden && k === K && i <= scanned;
          const r = isK ? 6 : 3.4;
          ctx.fillStyle = isK ? C.ok : checked ? rgba(C.ink2, 0.9) : rgba(C.vis, 0.45);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          if (isK) {
            glow(ctx, x, y, 22, C.ok, 0.7);
            txt(ctx, `K = ${k}`, x, y - 16, { size: 11, color: C.ok, align: 'center', weight: 800 });
          }
          if (ch.guessing && picked === k) {
            ctx.strokeStyle = k === K ? C.ok : C.warn;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        });
        // 扫描光柱
        if (!hidden && sp >= 0) {
          const x = X(KS[Math.min(scanned, KS.length - 1)]);
          const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
          g.addColorStop(0, rgba(C.moon, 0));
          g.addColorStop(0.5, rgba(C.moon, 0.22));
          g.addColorStop(1, rgba(C.moon, 0));
          ctx.fillStyle = g;
          ctx.fillRect(x - 14, top, 28, bottom - top);
          anim.moving = true;
        }
        if (!hidden && K !== null && sp >= 0 && scanned >= stopIdx) {
          ripple(ctx, X(K), Y(KL[K]), easeOut(clamp((sp - 0.6) / 0.4, 0, 0.99)), C.ok, 26);
        }
        return anim.moving;
      },
      live: false,
    },
    [eta, hidden, picked, ci]
  );

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    ch.record(CH[ci].id, k === K);
  };
  const onTap = (x: number, y: number) => {
    if (!ch.guessing || picked !== null) return;
    let best: { k: number; d: number } | null = null;
    for (const g of geo.current) {
      const d = Math.hypot(g.x - x, (g.y - y) * 0.5);
      if (!best || d < best.d) best = { k: g.k, d };
    }
    if (best && best.d < 30) pick(best.k);
  };

  const options = useMemo(() => [11, 12, 13, 14, 15, 16].map((k) => ({ value: String(k), label: `K = ${k}` })), []);

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
        <Tags kinds={['demo', 'paper', 'code']} />
      </div>
      <StageBox
        s={s}
        onTap={onTap}
        label={
          hidden
            ? `挑战：阈值 η = ${eta}，扫描会停在哪个 K？点曲线上的候选点。`
            : `η = ${eta}：从 K = 5 起扫描，第一个 KL ≤ η 的候选是 K = ${K ?? '无'}（示意曲线）`
        }
      />
      {ch.guessing ? (
        <>
          <Guess
            q={`阈值 η = ${eta} 时，扫描会停在哪个 K？`}
            options={options}
            answer={String(K)}
            picked={picked === null ? null : String(picked)}
            onPick={(v) => pick(Number(v))}
            explain={
              <p>
                从 K = 5 往后，第一个落到阈值线以下的点是 K = {K}，它前一个点还在线上方。表 5 中 η = {eta} 对应 K = {K}、准确率{' '}
                {TABLE5.find((r) => r.eta === eta)?.acc.toFixed(2)}（论文实测）。曲线本身是按表 5 与图 8(b) 设定的示意，点的具体高度不是测量值。
              </p>
            }
            canvasHint="点曲线上的候选点，或点下面的选项"
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
        <>
          <Controls>
            <Slider label="阈值 η" value={ei} min={0} max={ETAS.length - 1} onChange={setEi} display={`η = ${ETAS[ei]}`} hint="0.003 为论文设定；代码中 13B 为 0.0005、NeXT 为 0.0001" />
            <div className="ctrl-row">
              <Btn onClick={() => setEi(4)} disabled={ei === 4}>
                恢复论文默认 η = 0.003
              </Btn>
            </div>
          </Controls>
          <div className="t5">
            <div className="t5-head">
              表 5（LLaVA-1.5-7B，SQA_Image）<EvChip id="tab5" />
            </div>
            <div className="t5-row" role="list">
              {TABLE5.map((r) => (
                <button
                  type="button"
                  role="listitem"
                  key={r.eta}
                  className={`t5-cell ${Math.abs(r.eta - eta) < 1e-9 ? 'is-sel' : ''}`}
                  onClick={() => setEi(ETAS.indexOf(r.eta))}
                  aria-pressed={Math.abs(r.eta - eta) < 1e-9}
                >
                  <span>η {r.eta}</span>
                  <b>K = {r.K}</b>
                  <span>{r.acc.toFixed(2)}</span>
                </button>
              ))}
            </div>
            <p className="note">原模型 69.61（表 2）。表 5 的准确率随 K 增大接近原模型；本页不判断 69.01 → 69.70 的差值是否超出评测波动。</p>
          </div>
          <Feedback
            tone="info"
            k={`eta-${eta}`}
            lead={
              K === null ? (
                <>阈值太严，没有候选层满足条件。</>
              ) : (
                <>
                  η = {eta}：扫描停在 <b>K = {K}</b>，即前 {K} 层带视觉 token。
                  {t5 ? `论文实测准确率 ${t5.acc.toFixed(2)}。` : '这个 η 论文没有测，准确率未知。'}
                </>
              )
            }
            more={
              <p>
                代码：对 20 个样本取平均 KL，取第一个 ≤ η 的候选（论文写 &lt; η）；KL 只比较第一个输出 token，方向为 KL(P_VTW ‖ P_原模型) <EvChip id="cKL" /> <EvChip id="cEta" />。曲线是示意，真实曲线因模型和任务而异；表 2 中的 K = 16 / 20 / 16 是为对齐 FastV 的 FLOPs 手动设定的。
              </p>
            }
          />
        </>
      )}
    </div>
  );
};

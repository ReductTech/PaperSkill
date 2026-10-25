import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, glow, ripple, easeOut } from '../lib/stage';
import { C, rgba, TYPE_COLOR, TYPE_NAME, type TokType } from '../lib/palette';
import { Controls, Feedback, Seg, Slider, Tags } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { StageSplit, fitStageH } from '../ui/StageSplit';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';
import { LAYERS, layerShares, type ModelKey } from './attnCurves';

// 3.1 逐层看注意力流向。左边是“正要预测下一个词”的输出位置，右边是四类输入 token；
// 光束粗细 = 注意力比例（按图 4 形状的示意曲线）。下方小图是整条曲线与当前层游标。

const TYPES: TokType[] = ['sys', 'vis', 'ins', 'out'];
const COUNT: Partial<Record<TokType, number>> = { sys: 35, vis: 576 };

const CH = [
  { id: 'a', layer: 0, ask: '第 0 层（最浅），输出位置的注意力最多给了哪类 token？' },
  { id: 'b', layer: 3, ask: '到第 3 层，最多的注意力给了哪类 token？' },
  { id: 'c', layer: 22, ask: '第 22 层（深层），最多的注意力给了哪类 token？' },
];

export const M3Layers: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState<ModelKey>('7b');
  const [layer, setLayer] = useState(20);
  const [per, setPer] = useState<'total' | 'per'>('total');
  const ch = useChallenge(CH.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<TokType | null>(null);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.7)).current;
  const geo = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});

  const N = LAYERS[model];
  const L = ch.guessing ? CH[ci].layer : Math.min(layer, N - 1);
  const sh = layerShares(model, L);
  const answer = (Object.entries(sh) as [TokType, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const hidden = ch.guessing && picked === null;

  const s = useStage(
    {
      heightOf: (w) => fitStageH(w, clamp(w * 0.62, 280, 400), 260),
      live: !hidden,
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const chartH = Math.max(70, h * 0.26);
        const mainH = h - chartH - 16;
        const ox = Math.max(40, w * 0.12);
        const oy = mainH / 2 + 6;
        // 输出位置（光源）
        glow(ctx, ox, oy, 34, C.out, 0.9);
        ctx.fillStyle = C.out;
        rr(ctx, ox - 10, oy - 10, 20, 20, 5);
        ctx.fill();
        txt(ctx, '最后一个位置', ox, oy + 24, { size: 10, color: C.ink2, align: 'center' });
        // 四个目标组
        const gx = w * 0.46;
        const gw = w - gx - 10;
        const gh = (mainH - 24) / 4;
        geo.current = {};
        TYPES.forEach((ty, i) => {
          const share = sh[ty];
          const y = 10 + i * gh;
          const shown = hidden ? 0.25 : share;
          const v = anim.to(`v-${ty}`, shown, dt, final, 8, 0.06);
          // 光束：从光源长到目标组
          const grow = anim.to(`g-${ty}-${L}-${model}`, 1, dt, final, 6 + i);
          const ty0 = y + gh / 2;
          const thick = 1 + v * 26;
          const bx = ox + 12 + (gx - ox - 12) * easeOut(grow);
          const grd = ctx.createLinearGradient(ox, 0, gx, 0);
          grd.addColorStop(0, rgba(C.out, hidden ? 0.15 : 0.5));
          grd.addColorStop(1, rgba(TYPE_COLOR[ty], hidden ? 0.15 : 0.75));
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(ox + 10, oy - 2);
          ctx.lineTo(bx, ty0 - thick / 2);
          ctx.lineTo(bx, ty0 + thick / 2);
          ctx.lineTo(ox + 10, oy + 2);
          ctx.closePath();
          ctx.fill();
          // 光点：注意力越大，从这一组流回“最后一个位置”的光点越多（读取方向：信息从被读的 token 流向正在预测的位置）
          if (!hidden) {
            const nDots = Math.round(v * 26);
            for (let k = 0; k < nDots; k++) {
              const q = (t * 0.55 + k / Math.max(1, nDots) + i * 0.17) % 1;
              const x = gx - (gx - ox - 12) * q;
              const y = ty0 + (oy - ty0) * q + Math.sin(q * 9 + k) * thick * 0.25;
              glow(ctx, x, y, 3 + v * 4, TYPE_COLOR[ty], 0.85 * (1 - q * 0.5));
            }
          }
          // 目标组框；按“每个 token 平均”时，亮度 = 单个 token 拿到的注意力
          const perTok = COUNT[ty] ? share / COUNT[ty]! : null;
          const glowA = per === 'per' && perTok !== null && !hidden ? clamp(Math.log10(perTok * 1e5) / 3.5, 0.05, 1) : 0.15 + 0.85 * v;
          ctx.fillStyle = rgba(TYPE_COLOR[ty], 0.1 + 0.32 * glowA);
          ctx.strokeStyle = rgba(TYPE_COLOR[ty], 0.7);
          rr(ctx, gx, y + 4, gw, gh - 8, 8);
          ctx.stroke();
          rr(ctx, gx, y + 4, gw, gh - 8, 8);
          ctx.fill();
          if (ch.guessing && picked === ty) {
            ctx.strokeStyle = picked === answer ? C.ok : C.warn;
            ctx.lineWidth = 2;
            rr(ctx, gx - 2, y + 2, gw + 4, gh - 4, 9);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
          geo.current[ty] = { x: gx, y: y + 4, w: gw, h: gh - 8 };
          const name = `${TYPE_NAME[ty]} token${COUNT[ty] ? ` ×${COUNT[ty]}` : ''}`;
          txt(ctx, name, gx + 10, y + gh / 2, { size: 11, color: C.ink, weight: 700 });
          // 曲线是手绘示意，读数只给到“约 5%”的精度
          let val = hidden ? '?' : `约 ${Math.max(5, Math.round((share * 100) / 5) * 5)}%`;
          if (share < 0.075 && !hidden) val = '约 5%';
          if (per === 'per' && !hidden) val = ty === 'sys' ? '单个最亮' : ty === 'vis' ? '单个最暗' : '—';
          txt(ctx, val, gx + gw - 10, y + gh / 2, { size: 12, color: C.moon, align: 'right', weight: 800 });
        });
        // 下方：整条曲线（系统 / 视觉），游标 = 当前层
        const cy0 = h - chartH;
        const cx0 = 28;
        const cw = w - cx0 - 10;
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        rr(ctx, cx0, cy0, cw, chartH - 18, 6);
        ctx.fill();
        // 挑战模式下先隐藏曲线（它会泄露答案）
        if (hidden) txt(ctx, '曲线在作答后显示', cx0 + cw / 2, cy0 + (chartH - 18) / 2, { size: 10, color: C.ink3, align: 'center' });
        (hidden ? [] : (['sys', 'vis'] as TokType[])).forEach((ty) => {
          ctx.strokeStyle = TYPE_COLOR[ty];
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            const v = layerShares(model, i)[ty];
            const x = cx0 + (i / (N - 1)) * cw;
            const y = cy0 + (chartH - 22) * (1 - v) + 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
        const cur = anim.to('cursor', L, dt, final, 10, 1.01);
        const curX = cx0 + (cur / (N - 1)) * cw;
        ctx.strokeStyle = rgba(C.moon, 0.85);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(curX, cy0);
        ctx.lineTo(curX, h - 18);
        ctx.stroke();
        ctx.setLineDash([]);
        txt(ctx, '0', cx0, h - 8, { size: 9, color: C.ink3, align: 'center' });
        txt(ctx, String(N - 1), cx0 + cw, h - 8, { size: 9, color: C.ink3, align: 'center' });
        txt(ctx, `层索引 ${L}`, clamp(curX, cx0 + 30, cx0 + cw - 30), h - 8, { size: 9, color: C.moon, align: 'center' });
        txt(ctx, '系统', cx0 + 6, cy0 + 10, { size: 9, color: C.sys });
        txt(ctx, '视觉', cx0 + 34, cy0 + 10, { size: 9, color: C.vis });
        const pp = pulse.p(t, final);
        if (pp >= 0 && picked) {
          const g = geo.current[picked];
          if (g) ripple(ctx, g.x + g.w / 2, g.y + g.h / 2, easeOut(pp), C.moon, 40);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [model, L, per, hidden, picked, ci]
  );

  const pick = (ty: TokType) => {
    if (picked !== null) return;
    setPicked(ty);
    pulse.fire(performance.now() / 1000);
    ch.record(CH[ci].id, ty === answer);
  };
  const onTap = (x: number, y: number) => {
    if (!ch.guessing) return;
    const hit = (Object.entries(geo.current) as [TokType, { x: number; y: number; w: number; h: number }][]).find(
      ([, g]) => x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h
    );
    if (hit) pick(hit[0]);
  };


  return (
    <StageSplit
      stage={
        <StageBox
          s={s}
          onTap={onTap}
          label={
            hidden
              ? `挑战：${CH[ci].ask}点画布右侧的四个组之一作答。`
              : `第 ${L} 层（示意曲线）：最粗的光束指向${TYPE_NAME[answer]} token`
          }
        />
      }
      side={
        <>
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
            <Tags kinds={['demo']} />
          </div>
          {ch.guessing ? (
            <>
              <Guess
                q={CH[ci].ask}
                options={TYPES.map((t) => ({ value: t, label: `${TYPE_NAME[t]} token` }))}
                answer={answer}
                picked={picked}
                onPick={pick}
                explain={
                  <p>
                    示意曲线在第 {L} 层，最粗的光束是“{TYPE_NAME[answer]}”。
                    {L === 0 ? '最浅一层还在“看图”；' : '第 2 层起对系统 token 的注意力急升，视觉 token 只剩约 5%；'}这与正文对图 4 的描述一致。
                  </p>
                }
                canvasHint="点画布右侧的四个组之一，或点下面的选项"
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
                <Seg
                  small
                  label="模型"
                  value={model}
                  onChange={(m) => {
                    setModel(m);
                    setLayer((l) => Math.min(l, LAYERS[m] - 1));
                  }}
                  options={[
                    { value: '7b', label: '7B（32 层）' },
                    { value: '13b', label: '13B（40 层）' },
                  ]}
                />
                <Seg
                  small
                  label="计量"
                  value={per}
                  onChange={setPer}
                  options={[
                    { value: 'total', label: '按类型总量' },
                    { value: 'per', label: '按每个 token 平均' },
                  ]}
                />
                <Slider label="层索引（0 起，图 4 横轴）" value={L} min={0} max={N - 1} onChange={setLayer} display={`第 ${L} 层`} />
              </Controls>
              <Feedback
                tone="info"
                k={`${model}-${L}-${per}`}
                lead={
                  per === 'per' ? (
                    <>
                      按每个 token 平均：用正文的约数（80% 分给 35 个系统 token、5% 分给 576 个视觉 token）算，单个系统 token 约是单个视觉 token 的 <b>260 倍</b>（公式外推）。
                    </>
                  ) : L <= 1 ? (
                    <>
                      浅层还在看图：视觉 token 拿到不少注意力（光束很粗）。
                    </>
                  ) : (
                    <>
                      这一层大部分注意力落在 35 个系统 token 上，576 个视觉 token 只分到很细的一束（正文：中深层视觉 token 约 5%）。
                    </>
                  )
                }
                more={
                  <p>
                    曲线按图 4 的形状手绘，数值仅作示意；正文给出的数字是“中深层 80% 以上给系统 token，视觉 token 只有 5%”。按这两个约数，单个系统 token
                    约是单个视觉 token 的 260 倍（公式外推）。注意力是相对权重：它小，不等于信息不重要。
                  </p>
                }
              />
            </>
          )}
        </>
      }
    />
  );
};

import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp, glow, pill } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Btn, Controls, Feedback, Seg, Slider, Tag, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { StageSplit, fitStageH } from '../ui/StageSplit';
import type { ContentTag } from '../types';

// 10.1 反例实验台。格子 = 第几个输出词（列）× 第几层（行，32 层）。
// 亮起的格子：这个词在这一层还需要“直接读取视觉 token”（教学设定：迁移尚未完成的部分）。
// 潮线（K）以上的视觉 token 已撤出：需要它的格子变红 = 失败。
// 每个场景标明来源：论文实测 / 相关论文实测 / arXiv 附录 / 本页设定。

const N = 32;
const T = 12;

interface Scene {
  id: string;
  name: string;
  /** 每个输出词需要直接读取视觉 token 的最深层（1 起计；0 表示不需要） */
  need: number[];
  /** 场景固定的 K；undefined 表示用滑块 */
  K?: number;
  random?: [number, number];
  tags: ContentTag[];
  ev?: string;
  paper: string;
}

const SCENES: Scene[] = [
  {
    id: 'yes',
    name: '简单是非题',
    need: [12, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tags: ['demo', 'paper'],
    ev: 'tab2',
    paper: '论文实测：POPE 上 VTW 85.96，原模型 85.83（7B，K = 16）。',
  },
  {
    id: 'early',
    name: '撤得太早（K = 4）',
    need: [12, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    K: 4,
    tags: ['demo', 'paper'],
    ev: 'dpT1',
    paper: '相关论文实测：DivPrune 中 K = 4 的 VTW，7B 的 MME 感知分 681（原模型 1506）；VTW 原文图 8(a) 也显示 K 小时准确率下降。',
  },
  {
    id: 'random',
    name: '随机层撤出（VTW†）',
    need: [12, 10, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    random: [8, 24],
    tags: ['demo', 'paper'],
    ev: 'tab2',
    paper: '论文实测：7B 的 VTW†（K ∈ [8, 24]）在 MMB 上 55.61（原模型 64.09），POPE 76.05（85.83）。',
  },
  {
    id: 'long',
    name: '长回答后段回看细节',
    need: [10, 8, 6, 4, 0, 0, 22, 24, 22, 0, 0, 0],
    tags: ['demo'],
    paper: '本页设定的教学场景，论文没有测：KL 校准只检查第 1 个词，后段需要深层视觉信息的情况不在检验范围内。',
  },
  {
    id: 'fine',
    name: '细粒度子任务（OCR / 位置）',
    need: [18, 14, 17, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    tags: ['demo', 'paper'],
    ev: 'axT9',
    paper: 'arXiv 附录表 9：NeXT 的“位置”143.33 → 133.33，7B 的 OCR 140.00 → 137.50；子任务题量小，无法区分方法效应与评测波动。',
  },
];

export const M10Cases: React.FC<WidgetProps> = () => {
  const [sid, setSid] = useState('long');
  const [K, setK] = useState(16);
  const [sample, setSample] = useState(0);
  const anim = useRef(new Anim()).current;
  const sc = SCENES.find((x) => x.id === sid)!;

  // 随机层场景：每个“样本”抽一个 K（确定性序列，便于复现画面）
  const randomKs = useMemo(() => [9, 21, 13, 8, 17, 24, 11, 15, 19, 10], []);
  const effK = sc.K ?? (sc.random ? randomKs[sample % randomKs.length] : K);
  const fails = sc.need.map((d) => d > effK);
  const nFail = fails.filter(Boolean).length;
  const firstOk = !fails[0];

  const s = useStage(
    {
      heightOf: (w) => fitStageH(w, clamp(w * 0.66, 280, 420), 260),
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const left = 34;
        const right = w - 10;
        const top = 30;
        const bottom = h - 26;
        const cw = (right - left) / T;
        const rh = (bottom - top) / N;
        const X = (c: number) => left + cw * c;
        const Y = (l: number) => bottom - rh * l; // l：层号（1 起计）的下边界为 Y(l-1)
        // 层号刻度
        [1, 8, 16, 24, 32].forEach((l) => txt(ctx, `L${l}`, left - 4, Y(l - 0.5), { size: 9, color: C.ink4, align: 'right' }));
        for (let c = 0; c < T; c++) txt(ctx, String(c + 1), X(c) + cw / 2, h - 12, { size: 9, color: C.ink3, align: 'center' });
        txt(ctx, '第几个输出词 →', right, h - 12, { size: 9, color: C.ink4, align: 'right' });
        // KL 校准检查范围：只看第 1 个词
        ctx.strokeStyle = rgba(C.moon, 0.55);
        ctx.setLineDash([4, 3]);
        rr(ctx, X(0) + 1, top - 2, cw - 2, bottom - top + 4, 4);
        ctx.stroke();
        ctx.setLineDash([]);
        txt(ctx, 'KL 校准只看这一列', X(0) + 2, top - 14, { size: 10, color: C.moon });
        // 格子
        for (let c = 0; c < T; c++) {
          const d = sc.need[c];
          for (let l = 1; l <= N; l++) {
            const need = l <= d;
            const missing = need && l > effK;
            const key = `${sid}-${c}-${l}`;
            const target = missing ? 2 : need ? 1 : 0;
            const v = anim.to(key, target, dt, final, 10, 0);
            const x = X(c) + 2;
            const y = Y(l) + 0.5;
            const ww = cw - 4;
            const hh = Math.max(1, rh - 1);
            if (v < 0.02) {
              ctx.fillStyle = 'rgba(255,255,255,0.025)';
            } else if (target === 2) {
              const pulse = final ? 1 : 0.75 + 0.25 * Math.sin(t * 5 + c);
              ctx.fillStyle = rgba(C.bad, 0.55 * pulse * Math.min(1, v / 2) + 0.15);
            } else {
              ctx.fillStyle = rgba(C.vis, 0.65 * Math.min(1, v));
            }
            ctx.fillRect(x, y, ww, hh);
          }
          if (fails[c]) txt(ctx, '✕', X(c) + cw / 2, top - 4 + 18, { size: 12, color: C.bad, align: 'center', weight: 800 });
        }
        // 潮线：第 K 层之后撤出
        const kk = anim.to(`K-${sid}`, effK, dt, final, 6, sc.random ? 0 : 1.01);
        const yK = Y(kk);
        ctx.strokeStyle = rgba(C.vis, 0.95);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = left; x <= right; x += 4) {
          const y = yK + Math.sin(x * 0.07 + t * 2.6) * 1.6;
          if (x === left) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        glow(ctx, right - 30, yK, 30, C.vis, 0.35);
        pill(ctx, `K = ${Math.round(kk)}：上方无视觉 token`, right - 4, yK - 13, { size: 10, color: C.vis, align: 'right' });
        return anim.moving || !!sc.random;
      },
      live: !!sc.random,
    },
    [sid, effK]
  );

  // 随机层：自动换样本
  // 只在画布可见、允许动画时换样本；减少动态效果时停在第一个样本
  React.useEffect(() => {
    if (!sc.random || !s.animate) return;
    const id = window.setInterval(() => setSample((x) => x + 1), 1600);
    return () => window.clearInterval(id);
  }, [sc.random, s.animate]);

  const tone = nFail === 0 ? 'info' : 'bad';
  return (
    <StageSplit
      stage={
        <>
          <StageBox
            s={s}
            label={`场景“${sc.name}”，K = ${effK}：12 个输出词中 ${nFail} 个需要的视觉信息已被撤走${firstOk ? '；第 1 个词没有问题' : ''}`}
          />
          <div className="legend-row">
            <span>
              <i className="lc lc-vis" /> 需要且还在
            </span>
            <span>
              <i className="lc lc-bad" /> 需要但已撤出（失败）
            </span>
          </div>
        </>
      }
      side={
        <>
          <Seg small label="场景" value={sid} onChange={setSid} options={SCENES.map((x) => ({ value: x.id, label: x.name }))} />
          <div className="mod-toolbar">
            {sc.tags.map((k) => (
              <Tag key={k} kind={k} />
            ))}
            {sc.ev ? <EvChip id={sc.ev} /> : null}
            <span className="note">格子里“需要视觉 token 的深度”是本页设定的示意。</span>
          </div>
          <Controls>
            {sc.K === undefined && !sc.random ? (
              <Slider label="撤出层 K（前 K 层带视觉）" value={K} min={1} max={N - 1} onChange={setK} display={`K = ${K}`} />
            ) : (
              <p className="note">{sc.random ? `每 1.6 秒换一个“样本”，K 在 [8, 24] 内随机；当前 K = ${effK}。` : `这个场景固定 K = ${sc.K}。`}</p>
            )}
            <div className="ctrl-row">
              <Btn onClick={() => { setK(16); setSid('long'); }} disabled={K === 16 && sid === 'long'}>
                回到起点
              </Btn>
            </div>
          </Controls>
          <Feedback
            tone={tone}
            k={`${sid}-${effK}`}
            lead={
              nFail === 0 ? (
                <>
                  K = {effK} 时，12 个词需要的视觉信息都还在：这个场景下 VTW 安全。
                </>
              ) : firstOk ? (
                <>
                  <b>第 1 个词安全，后面 {nFail} 个词失败</b>——只看第 1 个词的 KL 校准发现不了这种问题。
                </>
              ) : (
                <>
                  <b>{nFail} 个词失败</b>，连第 1 个词都受影响：KL 校准能发现这种情况，前提是 K 真的由校准选出。
                </>
              )
            }
            more={<p>{sc.paper}</p>}
          />
        </>
      }
    />
  );
};

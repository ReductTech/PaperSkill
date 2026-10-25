import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, rr, txt, clamp } from '../lib/stage';
import { C, rgba, METHOD_COLOR } from '../lib/palette';
import { Feedback, Seg, Tag, EvChip } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { TABLE4, README_RUN } from '../data/tables';

// 8.2 五种指标不要混用（论文实测：表 4；代码事实：README 截图）。
// 横向条形：方法名在条形上方，条形占满整行。

type MId = 'tflops' | 'lat' | 'sample' | 'peak' | 'model' | 'readme';

/** 从表 4 取一行的三个数（原模型 / FastV / VTW） */
function t4rows(key: string) {
  const r = TABLE4.rows.find((x) => x.key === key)!;
  return [
    { key: 'base', label: '原模型', v: r.base },
    { key: 'fastv', label: 'FastV', v: r.fastv },
    { key: 'vtw', label: 'VTW (K=16)', v: r.vtw },
  ];
}

const METRICS: Record<MId, { label: string; rows: { key: string; label: string; v: number }[]; unit: string; ratio: string; lead: string; more: string; tag: 'paper' | 'code'; ev: string }> = {
  tflops: {
    label: '理论 TFLOPs',
    rows: t4rows('tflops'),
    unit: '',
    ratio: '0.54×',
    lead: '理论计算量降到 0.54×：这是按公式算出来的，不是计时。',
    more: '表 4 用 SQA 的输入长度计算，所以原模型是 22.9 而不是表 2（MME）的 28.73。理论 FLOPs 只给出速度的上限。',
    tag: 'paper',
    ev: 'tab4',
  },
  lat: {
    label: '每样本延迟',
    rows: t4rows('lat'),
    unit: 's',
    ratio: '0.63×',
    lead: '实测延迟只降到 0.63×，比 TFLOPs 的 0.54× 少省了一截。',
    more: '视觉编码器、前 K 层、逐词解码、数据搬运与调度开销都不会随撤出而等比例减少。论文只报告了每样本总延迟：预填充（首 token）延迟与逐词解码延迟各降了多少，原文未说明。',
    tag: 'paper',
    ev: 'tab4',
  },
  sample: {
    label: '单样本显存',
    rows: t4rows('sample'),
    unit: 'G',
    ratio: '0.65×',
    lead: '峰值减模型权重后的“单样本显存”降到 0.65×（论文正文写“减少 35%”）。',
    more: '论文称 FastV 需在首次前向保存全部图像 token 的 KV Cache，所以单样本显存与原模型相同。这一项包含激活与缓存，不只是 KV Cache。',
    tag: 'paper',
    ev: 'tab4',
  },
  peak: {
    label: '推理峰值显存',
    rows: t4rows('peak'),
    unit: 'G',
    ratio: '0.94×',
    lead: '峰值显存只降到 0.94×：14.1 G 的模型权重一分不少。',
    more: '撤出视觉 token 不改变模型参数，权重显存（表 4 第一行）三者都是 14.1 G，所以总峰值的降幅远小于单样本部分。',
    tag: 'paper',
    ev: 'tab4',
  },
  model: {
    label: '模型权重显存',
    rows: t4rows('model'),
    unit: 'G',
    ratio: '1.00×',
    lead: '模型权重不变（1.00×）：VTW 是推理时的序列裁剪，不是模型压缩。',
    more: '这也是 VTW 能“即插即用”的原因：不改权重、不需要训练。',
    tag: 'paper',
    ev: 'tab4',
  },
  readme: {
    label: 'README 评测总耗时',
    rows: [
      { key: 'base', label: '原模型', v: README_RUN.base.sec },
      { key: 'vtw', label: 'VTW (K=15)', v: README_RUN.vtw.sec },
    ],
    unit: 's',
    ratio: `${(README_RUN.vtw.sec / README_RUN.base.sec).toFixed(2)}×`,
    lead: `官方 README 截图：LLaVA-1.5-7B 跑完 SQA 的 2017 题，08:08 → 05:41（约 ${(README_RUN.vtw.sec / README_RUN.base.sec).toFixed(2)}×）。`,
    more: '这是另一个模型（7B）、另一个 K（15）、整套评测流程（含数据加载与后处理）的墙钟时间；硬件原文未说明。它和表 4 的 0.63× 不是同一个量，不能放在一起比。',
    tag: 'code',
    ev: 'cReadme',
  },
};

export const M8Metrics: React.FC<WidgetProps> = () => {
  const [mid, setMid] = useState<MId>('tflops');
  const anim = useRef(new Anim()).current;
  const M = METRICS[mid];

  const s = useStage(
    {
      heightOf: () => 44 * 3 + 16,
      draw: ({ ctx, w, h, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const max = Math.max(...M.rows.map((r) => r.v)) * 1.12;
        const rowH = (h - 8) / 3;
        ['base', 'fastv', 'vtw'].forEach((key, i) => {
          const r = M.rows.find((x) => x.key === key);
          const y = 4 + i * rowH;
          txt(ctx, r ? r.label : key === 'fastv' ? 'FastV（README 未提供）' : '', 2, y + 9, { size: 11, color: r ? C.ink2 : C.ink4, weight: 600 });
          const target = r ? r.v / max : 0;
          const v = anim.to(`${key}`, target, dt, final, 8 - i * 1.5);
          const bw = w - 80;
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          rr(ctx, 2, y + 18, bw, rowH - 24, 5);
          ctx.fill();
          if (r) {
            ctx.fillStyle = rgba(METHOD_COLOR[key], 0.9);
            rr(ctx, 2, y + 18, bw * v, rowH - 24, 5);
            ctx.fill();
            const shown = (v / Math.max(target, 1e-6)) * r.v;
            txt(ctx, `${shown.toFixed(r.v >= 100 ? 0 : 2)}${M.unit}`, 2 + bw * v + 6, y + 18 + (rowH - 24) / 2, { size: 11, color: C.ink, weight: 700 });
          }
        });
        return anim.moving;
      },
    },
    [mid]
  );

  return (
    <div className="mod-stack">
      <Seg
        small
        label="指标"
        value={mid}
        onChange={setMid}
        options={(Object.keys(METRICS) as MId[]).map((k) => ({ value: k, label: METRICS[k].label }))}
      />
      <div className="mod-toolbar">
        <span className="note">
          {mid === 'readme' ? 'LLaVA-1.5-7B · SQA_Img · 2017 题 · batch 1' : 'LLaVA-NeXT-7B · SQA_Image · 单张 RTX 3090'}
        </span>
        <Tag kind={M.tag} />
        <EvChip id={M.ev} />
      </div>
      <StageBox s={s} label={`${M.label}：${M.rows.map((r) => `${r.label} ${r.v}${M.unit}`).join('，')}；VTW 为原模型的 ${M.ratio}`} />
      <Feedback tone="info" k={mid} lead={<>{M.lead}</>} more={<p>{M.more}</p>} />
      <div className="ratio-strip" aria-label="同一实验中各指标的 VTW / 原模型比值">
        {(['tflops', 'lat', 'sample', 'peak', 'model'] as MId[]).map((k) => (
          <button type="button" key={k} className={`ratio-cell ${k === mid ? 'is-sel' : ''}`} onClick={() => setMid(k)} aria-pressed={k === mid}>
            <b>{METRICS[k].ratio}</b>
            <span>{METRICS[k].label}</span>
          </button>
        ))}
      </div>
      <p className="note">上面五个比值来自同一次实验（表 4），差别正是“理论 FLOPs ≠ 实测加速”的直接证据。</p>
    </div>
  );
};

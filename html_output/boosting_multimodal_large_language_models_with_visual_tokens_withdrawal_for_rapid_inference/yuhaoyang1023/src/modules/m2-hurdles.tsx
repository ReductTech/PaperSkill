import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Rich, Seg, Feedback } from '../ui/kit';

// 2.2 四道坎逐一对照（论文实测 / 代码事实）。旧方法一栏是 VTW 论文的描述，不是本页对 FastV / PruMerge 代码的核对。

const HURDLES = [
  {
    id: 'flex',
    name: '① 灵活性',
    old: '与问题无关的压缩（如 LLaVA-PruMerge）对同一张图的不同问题使用同一组视觉 token。MME、POPE、AI2D 中同一张图常有多个问题，各自关注不同区域；引言称 PruMerge 在 MME 上下降 160.4 [[ev:intro]]。',
    vtw: '前 K 层保留全部视觉 token，每个问题都能在浅层从完整图像中“取”自己需要的信息 [[ev:eq5]]。',
    cost: '代价：浅层没有任何节省。',
  },
  {
    id: 'metric',
    name: '② 重要性指标',
    old: '剪枝方法需要设计重要性指标（如 FastV 用注意力分数，CrossGET 用跨模态引导）。低分不一定不重要，图 1(b) 中 FastV 剪掉了“bottle”却保留了“cake” [[ev:fig1]]。',
    vtw: '不给单个 token 打分；只决定一个层号 K，之后整体撤出 [[ev:cDrop]]。',
    cost: '代价：K 需要校准，或手动设定（第 7 章）。',
  },
  {
    id: 'kv',
    name: '③ KV Cache',
    old: 'VTW 论文称：FastV 每次自回归预测保留的视觉 token 不同，之前的 KV 不能直接复用；要用 KV Cache，就得在首次预测时保存全部视觉 token 的 KV，削弱了显存收益 [[ev:intro]]。',
    vtw: '撤出只在预填充执行一次（代码条件 `seq_length > 1`）；之后每个解码步不再改变，缓存直接复用 [[ev:cDrop]]。表 4 中单样本显存 3.1 → 2.0 G [[ev:tab4]]。',
    cost: '注意：FastV 的实现细节本页没有核对，以上是 VTW 作者的描述。',
  },
  {
    id: 'flash',
    name: '④ FlashAttention',
    old: 'FastV 需要注意力分数来剪枝，而 FlashAttention 不保存注意力分数 [[ev:intro]]；表 4 中 FastV 的 FlashAttention 一栏为 ✗ [[ev:tab4]]。',
    vtw: '不读注意力分数，只做切片；代码可通过 `use_flash_attn` 使用 flash_attention_2 [[ev:cFlash]]。',
    cost: '注意：论文没有单独报告开启 FlashAttention 时的速度。',
  },
] as const;

type HId = (typeof HURDLES)[number]['id'];

export const M2Hurdles: React.FC<WidgetProps> = () => {
  const [id, setId] = useState<HId>('flex');
  const h = HURDLES.find((x) => x.id === id)!;
  return (
    <div className="mod-stack">
      <Seg small label="四道坎" value={id} onChange={setId} options={HURDLES.map((x) => ({ value: x.id, label: x.name }))} />
      <div className="duo" key={id}>
        <div className="duo-col duo-old">
          <div className="duo-k">旧方法（VTW 论文的描述）</div>
          <p>
            <Rich text={h.old} />
          </p>
        </div>
        <div className="duo-arrow" aria-hidden="true">
          →
        </div>
        <div className="duo-col duo-new">
          <div className="duo-k">VTW 怎么绕开</div>
          <p>
            <Rich text={h.vtw} />
          </p>
        </div>
      </div>
      <Feedback tone="warn" k={id} lead={<>{h.cost}</>} />
    </div>
  );
};

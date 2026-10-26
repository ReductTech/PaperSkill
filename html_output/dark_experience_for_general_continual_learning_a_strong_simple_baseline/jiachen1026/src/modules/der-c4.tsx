import React, { useMemo, useState } from 'react';
import { C, useCanvas, drawAlbum, drawPhoto, arrow, Feedback, Source, MathBlock } from './der-kit';

function reservoirRun(count: number) {
  let seed = 17;
  const memory: number[] = [];
  let last = '尚未收到样本。';
  let sampled: number | null = null;
  for (let n = 1; n <= count; n++) {
    if (n <= 3) { memory.push(n); last = `样本 ${n} 填入第 ${n} 个空位。`; sampled = null; }
    else {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = Math.floor((seed / 4294967296) * n); sampled = j;
      if (j < 3) { const old = memory[j]; memory[j] = n; last = `抽到 j=${j}，样本 ${n} 替换样本 ${old}。`; }
      else last = `抽到 j=${j}，不在三个槽位内，本次不保存样本 ${n}。`;
    }
  }
  return { memory, last, sampled };
}
const reservoirCode = `def admit(memory, item, seen, capacity, rng):
    # seen 是插入新 item 之前，已经到达的样本数
    if seen < capacity:
        memory.append(item)
    else:
        j = rng.randrange(seen + 1)  # 含 0，不含 seen+1
        if j < capacity:
            memory[j] = item
    return seen + 1

# 对 batch 中每一个 item 分别调用，不能每个 batch 只加 1
# DER item=(raw_x, detached_z)
# DER++ item=(raw_x, detached_z, y)`;

export function DerC4() {
  const [n, setN] = useState(0);
  const run = useMemo(() => reservoirRun(n), [n]);
  const probability = n === 0 ? 1 : Math.min(1, 3 / n);
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    drawAlbum(ctx, 40, 52, 620, 178, run.memory, 3);
    ctx.font = '18px sans-serif'; ctx.fillStyle = C.ink; ctx.fillText('固定相册', 42, 32);
    if (n > 0) {
      drawPhoto(ctx, 850, 64, 145, 158, [((n * 3) % 9 + 1) / 10, ((n * 7) % 9 + 1) / 10, .6], C.orange);
      arrow(ctx, 833, 144, 695, 144, run.sampled === null || run.sampled < 3 ? C.green : C.red);
      ctx.fillStyle = C.ink; ctx.fillText('当前来片', 850, 42);
    }
  }, [n]);
  return <div className="der-widget" data-widget="der-c4">
    <canvas ref={ref} className="der-canvas" aria-label={`三个固定记忆槽，当前保存样本 ${run.memory.join('、') || '为空'}`} />
    <div className="der-controls">
      <button onClick={() => setN(v => Math.min(12, v + 1))} disabled={n === 12}>下一张样本</button>
      <button onClick={() => setN(0)} disabled={n === 0}>重置水库</button>
      <output>已见 n={n} · 容量 K=3 · 历史保留概率 {n ? `${(100 * probability).toFixed(1)}%` : '—'}</output>
    </div>
    <Feedback tone={n > 3 && (run.sampled ?? 0) >= 3 ? 'blue' : 'green'}>{run.last} 当前槽位：{run.memory.join('、') || '空'}。这是固定种子的采样演示，单次结果不能代替概率证明。</Feedback>
    <div className="der-prose">
      <h4>原算法：固定空间，不需要预知流的长度</h4>
      <p>Reservoir Sampling（水库采样）令每个历史到达项拥有相同的入选概率。记容量为 K，刚到达的是第 n 个样本：前 K 项依次填满；此后在整数 0,…,n−1 中均匀抽取 j，仅当 j&lt;K 时替换槽位 j。DER 存储原始输入 x 与历史输出 z；DER++ 额外存储真实标签 y。输入并没有被 logits 取代。</p>
      <h4>归纳证明：为什么是 K/n</h4>
      <MathBlock title="基例与新样本">n≤K 时每项都保存，概率为 1。n=K 时，K 个旧项都在库中。若 n&gt;K，新项仅在 j∈{'{0,…,K−1}'} 时入库，因此 P(新项保留)=K/n。</MathBlock>
      <MathBlock title="任意旧样本">假设第 n−1 步旧样本 i 在库中的概率为 K/(n−1)。给定它在库中，它占据某一个确定槽位；n 种等概率的 j 中，恰好一种会替换该槽位，因此条件存活概率为 1−1/n。于是 P(i 在第 n 步保留)=[K/(n−1)]·[1−1/n]=K/n。新旧项相同，归纳完成。</MathBlock>
      <p>这里的“公平”指<strong>历史到达项均匀</strong>，不是每类恰好一样多，也不是偏爱最近的数据。少数类可能完全不在小缓存中；出现频率高的类往往保留更多。在多轮训练协议里，同一原始图像的再次呈现也算新的到达项，不能把 n 偷换成独立图像总数。MNIST-360 才明确保证每张训练图像出现一次。</p>
      <details><summary>可直接实现的边界索引</summary><pre><code>{reservoirCode}</code></pre><p>代码的 seen 是插入前计数，所以随机范围长度是 seen+1；正文证明的 n 则包含本次到达。两种写法一致。真实采样应使用合适的随机数生成器；上图固定种子只用于可复核的教学。</p></details>
      <Source>依据：正文第 3 页 §3；补充材料第 4 页 Algorithm 3。概率归纳为教程展开。</Source>
    </div>
  </div>;
}

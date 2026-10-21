import { useState } from 'react';
import { C, Scene, line, number, Chips, Feedback } from './gd-kit';

const conditions = [
  { label: '未加入 RefC', data: 'O365 + GoldG', fineTune: '无 REC 专项微调', value: 50.41 },
  { label: '加入 RefC', data: 'O365 + GoldG + RefC', fineTune: '无 REC 专项微调', value: 73.98 },
  { label: 'RefC + REC 微调', data: 'O365 + GoldG + RefC', fineTune: '另做 REC 专项微调', value: 89.19 },
];

export function RecBoundary() {
  const [condition, setCondition] = useState(0);
  const selected = conditions[condition];
  return <div>
    <Chips label="切换训练条件" items={conditions.map(c => c.label)} value={condition} onChange={setCondition} />
    <Scene label={`RefCOCO 验证集 top-1 定位准确率 ${selected.value.toFixed(2)}%，选择训练条件将改变报告值。`} draw={ctx => {
      const x = 78, w = 900;
      for (let t = 0; t <= 100; t += 20) { const px = x + t / 100 * w; line(ctx, px, 54, px, 208, C.border, 1); number(ctx, String(t), px - 8, 237, C.muted); }
      ctx.fillStyle = C.border; ctx.beginPath(); ctx.roundRect(x, 104, w, 54, 8); ctx.fill();
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.roundRect(x, 104, selected.value / 100 * w, 54, 8); ctx.fill();
      number(ctx, selected.value.toFixed(2), x + selected.value / 100 * w + 40, 139, C.blue);
      line(ctx, x, 208, x + w, 208, C.muted, 2);
    }} />
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: '#f7f9fc', padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}><strong>RefCOCO val · top-1 准确率 ↑</strong><strong style={{ color: C.blue, fontSize: 26 }}>{selected.value.toFixed(2)}%</strong></div>
      <p style={{ margin: '8px 0 0', fontSize: 14 }}>Grounding DINO-T / Swin-T · 预训练：{selected.data} · {selected.fineTune}</p>
    </div>
    <Feedback tone="info">{condition === 0 ? '能找到类别相关目标，还不等于能选中描述所指的唯一实例。此配置未加入 RefC 指代数据。' : condition === 1 ? '加入 RefC 后，报告准确率为 73.98%。改变的是预训练数据条件，不能把 23.57 个百分点归因于架构变化。' : '在含 RefC 的配置上再做 REC 微调，报告准确率为 89.19%。这是有专项训练的结果，不能称作同一零样本设置。'}</Feedback>
    <p style={{ fontSize: 13, color: C.muted, marginBottom: 0 }}>来源：Table 5，p.12。REC 对每条表达选最高分框，与“框出所有相关物体”不同。更多指代数据也未必普遍受益：Table 6 中加入 RefC，COCO AP 48.1 → 48.5，LVIS 25.6 → 21.9，ODinW 20.0 → 17.7。</p>
    <div style={{ marginTop: 14, padding: 14, background: '#f5f8f0', borderRadius: 10, fontSize: 14 }}><strong>接回本周实验</strong><p style={{ margin: '6px 0 0' }}>固定检查点、输入尺寸与评测协议；分别测试类别、属性、空间关系提示。用真值框统计定位错误、语义混淆和漏检，再判断 Grounding DINO 是否解决了上周 YOLOE 的失败案例。</p></div>
  </div>;
}

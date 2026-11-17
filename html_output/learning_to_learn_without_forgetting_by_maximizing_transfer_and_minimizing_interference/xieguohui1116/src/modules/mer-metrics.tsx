import React from 'react';

const INK = '#21324a';
const MUTED = '#68778f';
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';

function Card({ tag, name, formula, def, color }: { tag: string; name: string; formula: string; def: string; color: string }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid #d7deea', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{name}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: INK, fontFamily: 'Consolas, monospace' }}>{formula}</div>
      <div style={{ fontSize: 26, color: MUTED, lineHeight: 1.45 }}>{def}</div>
      <div style={{ fontSize: 22, color: BLUE }}>{tag}</div>
    </div>
  );
}

export function MerMetrics() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ fontSize: 28, color: MUTED, margin: 0, lineHeight: 1.45 }}>
        论文用三个指标比较方法（本节无交互，留给你对照后面的实验图）。跑步类比：<b style={{ color: INK }}>RA</b> 是赛季末对全部项目测的总成绩，<b style={{ color: INK }}>LA</b> 是每项刚练完当天的成绩，<b style={{ color: INK }}>BTI</b> 是「练完当天 → 赛季末」掉了多少。
      </p>
      <div style={{ display: 'flex', gap: 18, flex: 1 }}>
        <Card tag="主指标 · 越高越好" name="RA 最终保留准确率" formula="meanᵗ accₜ" def="20 个任务全部学完后，对每个任务测准确率再取平均。衡量「最后还记着多少」。表格里 MER 用它跟所有基线比。" color={GREEN} />
        <Card tag="辅助 · 越高越好" name="LA 学习准确率" formula="acc after learn" def="每个任务「刚学完立刻」测的平均准确率。衡量「新任务学得够不够快、够不够好」。" color={BLUE} />
        <Card tag="辅助 · 越负遗忘越重" name="BTI 反向迁移干扰" formula="Δ acc (→ end)" def="每个任务从「刚学完」到「训练结束」的准确率变化。负数表示发生了遗忘，越负越严重。" color={ORANGE} />
      </div>
      <p style={{ fontSize: 26, color: RED, margin: 0 }}>注意方向：RA、LA 越高越好；BTI 为负是遗忘、为正才是「后续训练反而帮到了旧任务」。</p>
    </div>
  );
}

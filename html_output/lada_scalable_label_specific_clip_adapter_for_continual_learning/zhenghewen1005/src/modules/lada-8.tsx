import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, arrow, line, roundRect, text } from './lada-kit';

const nodes = [
  { name: '图像编码器', xy: [.14, .21], color: C.blue, output: 'i ∈ ℝᵈ', train: '视觉骨干冻结', infer: '提取图像特征', detail: '图像经冻结的 CLIP 视觉骨干得到 d 维特征；当前图像与历史压缩特征在同一视觉坐标中参与训练。', inference: '测试图像经同一视觉骨干编码，得到文本匹配与记忆匹配共同使用的特征。' },
  { name: '新类记忆', xy: [.50, .21], color: C.green, output: 'Wₖi', train: '当前 Wₖ 接收梯度', infer: '固定记忆参与得分', detail: '当前任务的 Wₖ 由各类 k-means 中心初始化。联合交叉熵更新 Wₖ，新样本与旧类增强特征都约束这些新增参数。', inference: '当前任务训练结束后的记忆与全部历史记忆一起提供已见类分数。' },
  { name: '旧类记忆', xy: [.50, .53], color: C.blue, output: 'W₁i … Wₖ₋₁i', train: '历史 W 固定', infer: '固定记忆参与得分', detail: '历史任务的记忆块冻结，其响应继续进入全部已见类别的竞争。当前训练优化新增记忆，历史记忆值保持固定。', inference: '全部已见类别的记忆共同响应测试图像，按类别聚合指数激活。' },
  { name: '文本适配器', xy: [.14, .85], color: C.green, output: 'z_text', train: 'AdaptFormer 可训练', infer: '缓存与原始文本向量', detail: '文本骨干冻结，AdaptFormer 参数学习当前类别的文本表示；历史类别文本特征从缓存读取并保持固定。', inference: '已见类读取缓存文本向量，未见类由原始 CLIP 生成文本向量；统一文本候选先进行预测。' },
  { name: '旧类原型', xy: [.14, .53], color: C.purple, output: 'p̃ₗ 与旧类标签', train: '采样特征提供监督', infer: '此分支停用', detail: 'GMM 记录的中心、尺度与混合权重生成旧类增强特征。它们直接进入冻结视觉骨干之后的分类计算，标签约束新类竞争。', inference: '测试阶段通过图像特征、记忆与文本向量完成预测，DPT 采样分支停止。' },
  { name: '融合分数', xy: [.84, .53], color: C.orange, output: 'CE(z_text + z_LADA, y)', train: '两路 logits 共同监督', infer: '按已见/未见候选分支', detail: '当前图像特征和旧类增强特征得到文本及 LADA 两路 logits，相加后计算交叉熵。梯度更新当前 Wₖ 与文本适配参数。', inference: '统一文本候选预测为未见类时直接输出；预测为已见类时融合文本和 LADA 分数，在已见候选中输出结果。' },
];
const edges = [[0, 1], [0, 2], [4, 1], [4, 2], [1, 5], [2, 5], [3, 5]];

export function Lada8() {
  const [mode, setMode] = useState('train');
  const [selected, setSelected] = useState(0);
  const training = mode === 'train';
  const node = nodes[selected];
  return <div className="lada-eight" onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-eight .lada-eight-nodes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:14px 0}.lada-eight .lada-eight-nodes button{padding:9px 7px;border:1px solid #c6d0bf;background:#fff;border-radius:8px;font:inherit;font-size:13px;color:#27446e;cursor:pointer}.lada-eight .lada-eight-nodes button[aria-pressed=true]{border:2px solid #228d5c;background:#e7f1e4}.lada-eight .lada-eight-key{font-size:13px;line-height:1.8;color:#586354}.lada-eight details{margin-top:16px}.lada-eight summary{cursor:pointer;color:#27446e}.lada-eight p{line-height:1.8}@media(max-width:480px){.lada-eight .lada-eight-nodes{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
    <Chips label="结构状态" value={mode} onChange={setMode} options={[{ value: 'train', label: '训练' }, { value: 'infer', label: '推理' }]} />
    <div className="lada-eight-nodes" aria-label="选择结构组件">{nodes.map((n, i) => <button key={n.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>{i + 1} {n.name}</button>)}</div>
    <Scene label={`LADA ${training ? '训练' : '推理'}结构，已选${node.name}；图形节点可点击，六个同名按钮提供键盘操作`} onPoint={(x, y, w, h) => {
      const nearest = nodes.map((n, i) => ({ i, d: Math.hypot((x - n.xy[0] * w) / (w * .10), (y - n.xy[1] * h) / 28) })).sort((a, b) => a.d - b.d)[0];
      if (nearest.d < 1.7) setSelected(nearest.i);
    }} draw={(ctx, w, h) => {
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const nw = Math.min(80, w * .18), nh = 44;
      edges.forEach(([a, b]) => {
        const enabled = training || a !== 4;
        const active = enabled && (a === selected || b === selected);
        const p = nodes[a].xy, q = nodes[b].xy;
        ctx.save(); if (!enabled) { ctx.setLineDash([4, 5]); ctx.globalAlpha = .4; }
        arrow(ctx, p[0] * w + nw / 2, p[1] * h, q[0] * w - nw / 2, q[1] * h, active ? nodes[selected].color : C.line, active ? 3 : 1.5); ctx.restore();
      });
      if (training) [1, 3].forEach(i => {
        const p = nodes[5].xy, q = nodes[i].xy;
        ctx.save(); ctx.setLineDash([5, 4]);
        arrow(ctx, p[0] * w - nw / 2, p[1] * h + 10, q[0] * w + nw / 2, q[1] * h + 10, (selected === i || selected === 5) ? C.green : '#bdd0b6', selected === i || selected === 5 ? 2.7 : 1.3); ctx.restore();
      });
      nodes.forEach((n, i) => {
        const x = n.xy[0] * w, y = n.xy[1] * h, active = selected === i;
        ctx.save(); if (!training && i === 4) ctx.globalAlpha = .35;
        roundRect(ctx, x - nw / 2, y - nh / 2, nw, nh, 9, active ? '#e4eee0' : '#fff', active ? n.color : C.line);
        text(ctx, String(i + 1), x - nw / 2 + 8, y - nh / 2 + 9, 10, C.muted, 'center');
        ctx.lineWidth = active ? 2.5 : 1.5; ctx.strokeStyle = n.color;
        if (i === 0) { ctx.strokeRect(x - 11, y - 10, 22, 20); line(ctx, x - 8, y + 6, x, y - 3, n.color); line(ctx, x, y - 3, x + 8, y + 6, n.color); }
        else if (i === 1 || i === 2) { for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) { ctx.fillStyle = n.color; ctx.fillRect(x - 13 + j * 10, y - 8 + k * 10, 6, 6); } }
        else if (i === 3) { [-7, 0, 7].forEach((dy, j) => line(ctx, x - 13, y + dy, x + 13 - j * 4, y + dy, n.color, 2)); }
        else if (i === 4) { [[-10, -4], [1, 7], [10, -8], [-2, -11]].forEach(([dx, dy]) => { ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2); ctx.fill(); }); }
        else { line(ctx, x - 11, y, x + 11, y, n.color, 3); line(ctx, x, y - 11, x, y + 11, n.color, 3); }
        if (training && (i === 0 || i === 2)) { ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.arc(x + nw / 2 - 9, y - 13, 3, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.strokeRect(x + nw / 2 - 13, y - 13, 8, 6); }
        ctx.restore();
      });
      text(ctx, training ? '训练' : '推理', w * .85, h * .13, 13, C.muted, 'center');
      text(ctx, node.name, w * .66, h * .93, 13, node.color, 'center');
    }} />
    <p className="lada-eight-key">位置对应：左上 1 图像编码器，中央上 2 新类记忆，中央 3 旧类记忆，左下 4 文本适配器，左中 5 旧类原型，右中 6 融合分数。实线为前向计算；训练时绿色虚线返回可训练部分。</p>
    <Readout items={[{ label: '当前组件', value: node.name }, { label: training ? '训练状态' : '推理状态', value: training ? node.train : node.infer }, { label: '计算输出', value: !training && selected === 4 ? '停用' : !training && selected === 5 ? '类别预测' : node.output }]} />
    <Feedback>{training ? node.detail : node.inference}</Feedback>
    <details><summary>查看联合训练与默认设置</summary><p>训练样本由当前任务图像特征和 DPT 产生的旧类增强特征组成。对全部已见候选类计算 L_train = CE(z_text + z_LADA, y)。新类记忆与文本侧适配参数接收梯度，视觉骨干、历史记忆和历史缓存文本向量固定。</p><p>论文使用 CLIP ViT-B/16，d=512；默认 λ₁=16、λ₂=4，AdamW 学习率 0.001，batch size 64，单张 RTX 4090。</p></details>
    <Source page={5} label="Overall Framework；p. 6 Implementation Details；p. 12 Appendix B" />
  </div>;
}

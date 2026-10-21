import { useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { clearScene, roundRect, arrow, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

export const specs = {
  B16: { label: 'ViT-B/16', patch: 16, width: 768, depth: 12, heads: 12, mlp: 3072, params: '约86M' },
  L16: { label: 'ViT-L/16', patch: 16, width: 1024, depth: 24, heads: 16, mlp: 4096, params: '约307M' },
  H14: { label: 'ViT-H/14', patch: 14, width: 1280, depth: 32, heads: 16, mlp: 5120, params: '约632M' },
};
type Variant = keyof typeof specs;
const names = ['切块投影', 'CLS与位置', '编码器', '最终归一化', '取出CLS', '分类头'];
const centers = [100, 275, 450, 625, 800, 975];

export function Widget8() {
  const [variant, setVariant] = useState<Variant>('B16');
  const [resolution, setResolution] = useState(224);
  const [node, setNode] = useState(0);
  const [notice, setNotice] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const model = specs[variant];
  const grid = resolution / model.patch;
  const patches = grid * grid;
  const tokens = patches + 1;
  const shape = node === 0 ? patches + '×' + model.width : node <= 3 ? tokens + '×' + model.width : node === 4 ? String(model.width) : '1000';
  const inputs = [resolution + '×' + resolution + '×3', patches + '×' + model.width, tokens + '×' + model.width, tokens + '×' + model.width, tokens + '×' + model.width, String(model.width)];
  const count = model.heads * tokens * tokens;
  const nodeDetails = [
    '每块展平为' + model.patch * model.patch * 3 + '维，用共享E投影；E形状为' + model.patch * model.patch * 3 + '×' + model.width + '。',
    resolution === 224
      ? '当前位置表图块网格为' + grid + '×' + grid + '，加上CLS共' + tokens + '行；CLS也有自己的一行位置向量。'
      : '图块位置表从' + 224 / model.patch + '×' + 224 / model.patch + '插值到' + grid + '×' + grid + '；CLS那一行单独保留。分辨率变大不等于patch变小，也不保证准确率自动提高。',
    '编码器重复' + model.depth + '层；每头宽度为D/h=' + model.width / model.heads + '，MLP宽度为' + model.width + '→' + model.mlp + '→' + model.width + '。每一层保持S×D。',
    'LN逐标记按特征维归一。此图先对所有标记LN再取CLS，与论文先取CLS再LN对最终输出等价；它不跨标记混合。',
    '只取归一化后的分类标记，得到一张图的D维表示；不是把序列的所有值摊平。',
    '此处展示迁移线性头，W形状为' + model.width + '×1000；论文预训练使用含一个tanh隐藏层的两层头。',
  ];
  const chooseVariant = (next: Variant) => {
    setVariant(next);
    if (resolution % specs[next].patch !== 0) {
      setResolution(224);
      setNotice('原分辨率不能被新图块边长整除，已回到224×224；未做隐式裁剪或填充。');
    } else setNotice('');
  };
  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    centers.forEach((x, index) => {
      roundRect(ctx, x - 65, 65, 130, 75, 14, index === node ? '#e6edf7' : '#fff', index === node ? palette.blue : palette.border);
    });
    for (let i = 0; i < centers.length - 1; i += 1) {
      arrow(ctx, centers[i] + 69, 102, centers[i + 1] - 71, 102, i >= node ? palette.blue : palette.border);
    }
    centers.forEach((x, index) => {
      const color = index === node ? palette.blue : palette.muted;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(index + 1), x, 113);
      ctx.restore();
    });
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.orange;
    ctx.strokeRect(centers[node] - 69, 61, 138, 83);
    ctx.restore();
    const visibleRows = Math.max(2, Math.min(15, Math.round(tokens / 100)));
    const width = 165 + (model.width - 768) / 512 * 85;
    for (let i = 0; i < visibleRows; i += 1) {
      roundRect(ctx, 45 + i * 3, 220 - i * 3, width, 12, 3, i === visibleRows - 1 ? palette.blue : '#dce5f1', palette.border);
    }
    arrow(ctx, 385, 207, 535, 207, palette.blue);
    roundRect(ctx, 585, 182, 415, 60, 10, '#fff', palette.border);
    ctx.save();
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = palette.blue;
    ctx.textAlign = 'center';
    ctx.fillText(shape, 792, 220);
    ctx.restore();
    drawLabel(ctx, '当前节点', 35, 30, palette.blue);
    drawLabel(ctx, '输出形状', 585, 173, palette.blue);
  });
  const selectCanvasNode = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * 1080 / rect.width;
    const y = (event.clientY - rect.top) * 280 / rect.height;
    if (y < 61 || y > 144) return;
    const selected = centers.findIndex((center) => Math.abs(x - center) <= 69);
    if (selected >= 0) setNode(selected);
  };
  return (
    <div>
      <div className="ctrl" aria-label="模型规格">
        {(Object.keys(specs) as Variant[]).map((key) => <button type="button" key={key} className={'chip' + (variant === key ? ' selected' : '')} aria-pressed={variant === key} onClick={() => chooseVariant(key)}>{specs[key].label}</button>)}
      </div>
      <div className="ctrl" aria-label="输入分辨率">
        {[224, 384, 518].map((value) => <button type="button" key={value} className={'chip' + (resolution === value ? ' selected' : '')} disabled={value % model.patch !== 0} aria-pressed={resolution === value} onClick={() => { setResolution(value); setNotice(''); }}>{value}×{value}</button>)}
      </div>
      <p className="step-desc">{model.patch === 14 ? '384不能被14整除，故禁用384×384。' : '518不能被16整除，故禁用518×518。'}当前示例不裁剪、不填充。</p>
      {notice && <Feedback>{notice}</Feedback>}
      <canvas ref={canvasRef} onClick={selectCanvasNode} aria-label={'六个节点可点选；当前' + names[node] + '，输出形状' + shape + '。下方按钮提供等价键盘操作。'} />
      <div className="ctrl" aria-label="选择架构节点">
        {names.map((name, index) => <button type="button" key={name} className={'chip' + (node === index ? ' selected' : '')} aria-pressed={node === index} onClick={() => setNode(index)}>{index + 1}. {name}</button>)}
      </div>
      <Feedback>
        {model.label}，输入{resolution}×{resolution}，P={model.patch}：N={patches}，含CLS后S={tokens}；D={model.width}、L={model.depth}、h={model.heads}。
        当前“{names[node]}”输入为{inputs[node]}，输出为{shape}。{nodeDetails[node]}
        单层每图全部头的注意力权重元素为hS²={count.toLocaleString('en-US')}，不是总FLOPs、显存或实测延迟。
      </Feedback>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="论文Table1模型近似规格">
          <thead><tr><th scope="col">当前模型</th><th scope="col">层数</th><th scope="col">向量宽度</th><th scope="col">MLP宽度</th><th scope="col">头数</th><th scope="col">Table1近似参数</th></tr></thead>
          <tbody><tr><th scope="row">{model.label}</th><td>{model.depth}</td><td>{model.width}</td><td>{model.mlp}</td><td>{model.heads}</td><td>{model.params}（M为百万）</td></tr></tbody>
        </table>
      </div>
      <p className="step-desc">参数量引用原表的近似规格，不是当前任意图块/分类头配置的精确计数；384是论文默认微调分辨率，H/14的518配置用于Table2 ImageNet结果。</p>
    </div>
  );
}

import { useRef, useState } from 'react';
import results from '../../experiments/results.json';
import { clearScene, drawPaper, drawGuide, roundRect, arrow, drawLabel, palette, useDrawing, Feedback } from './vit-kit';

type Check = 'roundtrip' | 'conv' | 'position' | 'resolution';
const options: { id: Check; label: string }[] = [
  { id: 'roundtrip', label: '切块可还原' },
  { id: 'conv', label: '线性层等价卷积' },
  { id: 'position', label: '位置交换' },
  { id: 'resolution', label: '分辨率账单' },
];
const checks = results.numerical_checks;
const scientific = (value: number) => value.toExponential(3);
const patchColors = [palette.red, palette.blue, palette.light, palette.purple];

function tilePaper(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, order = [0, 1, 2, 3], showSlots = false) {
  drawPaper(ctx, x - 10, y - 10, side + 20, side + 20);
  order.forEach((content, index) => {
    const left = x + index % 2 * side / 2;
    const top = y + Math.floor(index / 2) * side / 2;
    roundRect(ctx, left + 4, top + 4, side / 2 - 8, side / 2 - 8, 5, patchColors[content], '#fff');
    if (showSlots) drawGuide(ctx, left, top, side / 2, side / 2, index % 2 ? palette.purple : palette.orange);
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const cx = left + side / 4;
    const cy = top + side / 4;
    if (content === 0) { ctx.moveTo(cx - 12, cy + 9); ctx.lineTo(cx, cy - 12); ctx.lineTo(cx + 12, cy + 9); ctx.closePath(); }
    else if (content === 1) ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    else if (content === 2) { ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); }
    else { ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy + 10); ctx.moveTo(cx - 10, cy + 10); ctx.lineTo(cx + 10, cy - 10); }
    ctx.stroke();
    ctx.restore();
  });
}

export function Widget9() {
  const [check, setCheck] = useState<Check>('roundtrip');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstResolution = results.resolution_checks[0];
  const secondResolution = results.resolution_checks[1];
  const feedback: Record<Check, string> = {
    roundtrip: '切块再还原的最大绝对误差=' + checks.patch_roundtrip_max_abs_error + '。验证展平和还原只是重排，没有丢像素；不代表后续投影无损。',
    conv: '共享线性投影与无重叠步长卷积最大误差=' + scientific(checks.projection_vs_stride_conv_max_abs_error) + '，小于10⁻¹⁰。两种实现算同一线性映射，不等于增添CNN骨干。',
    position: '无位置：CLS置换误差' + scientific(checks.no_position_cls_permutation_max_abs_error) + '，图块输出等变误差' + scientific(checks.no_position_patch_equivariance_max_abs_error) + '；加入固定位置后CLS最大差' + checks.fixed_position_cls_permutation_max_abs_difference.toFixed(6) + '。注意力行和误差' + scientific(checks.attention_row_sum_max_abs_error) + '。前两项检验结构对称性，后一项是该随机实例的敏感性，不能证明任意权重都利用位置。',
    resolution: 'P=16：224输入有' + firstResolution.tokens + '个标记、每头' + firstResolution.per_head_attention_elements.toLocaleString('en-US') + '个权重元素；384输入有' + secondResolution.tokens + '个标记、每头' + secondResolution.per_head_attention_elements.toLocaleString('en-US') + '个。此项核对整数账单，不测准确率或运行时间。',
  };
  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    if (check === 'roundtrip') {
      tilePaper(ctx, 85, 65, 155);
      for (let i = 0; i < 4; i += 1) roundRect(ctx, 337 + i * 42, 118, 33, 33, 4, patchColors[i], '#fff');
      arrow(ctx, 265, 135, 315, 135, palette.blue);
      arrow(ctx, 522, 135, 652, 135, palette.green);
      tilePaper(ctx, 700, 65, 155);
      drawLabel(ctx, '原图', 85, 35, palette.blue);
      drawLabel(ctx, '重排后还原', 700, 35, palette.green);
    } else if (check === 'conv') {
      drawPaper(ctx, 45, 45, 390, 190);
      drawPaper(ctx, 625, 45, 390, 190);
      for (let i = 0; i < 6; i += 1) {
        roundRect(ctx, 80 + i * 37, 70, 26, 24, 4, i % 2 ? palette.light : palette.orange);
        roundRect(ctx, 750 + i % 3 * 33, 65 + Math.floor(i / 3) * 32, 27, 27, 3, i % 2 ? palette.light : palette.orange);
      }
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 7; col += 1) roundRect(ctx, 95 + col * 31, 126 + row * 21, 24, 14, 3, row === col % 3 ? palette.blue : '#dce5f1');
      }
      arrow(ctx, 495, 140, 570, 140, palette.green);
      for (let i = 0; i < 7; i += 1) roundRect(ctx, 690 + i * 35, 185, 28, 20, 3, i % 3 ? palette.green : palette.blue);
      drawLabel(ctx, '共享线性投影', 65, 30, palette.blue);
      drawLabel(ctx, '步长卷积', 645, 30, palette.green);
    } else if (check === 'position') {
      tilePaper(ctx, 105, 58, 172, [0, 1, 2, 3], true);
      arrow(ctx, 390, 145, 575, 145, palette.orange);
      tilePaper(ctx, 710, 58, 172, [1, 0, 3, 2], true);
      drawLabel(ctx, '原顺序', 105, 30, palette.blue);
      drawLabel(ctx, '交换内容', 710, 30, palette.orange);
    } else {
      const smallSide = 185 * firstResolution.tokens / secondResolution.tokens;
      roundRect(ctx, 105, 232 - smallSide, smallSide, smallSide, 4, '#dce5f1', palette.blue);
      roundRect(ctx, 670, 47, 185, 185, 4, '#e0efe8', palette.green);
      ctx.save();
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i += 1) {
        const fraction = i / 8;
        ctx.beginPath();
        ctx.moveTo(105 + smallSide * fraction, 232 - smallSide); ctx.lineTo(105 + smallSide * fraction, 232);
        ctx.moveTo(105, 232 - smallSide + smallSide * fraction); ctx.lineTo(105 + smallSide, 232 - smallSide + smallSide * fraction);
        ctx.moveTo(670 + 185 * fraction, 47); ctx.lineTo(670 + 185 * fraction, 232);
        ctx.moveTo(670, 47 + 185 * fraction); ctx.lineTo(855, 47 + 185 * fraction);
        ctx.stroke();
      }
      ctx.restore();
      drawLabel(ctx, '单头权重表', 85, 30, palette.blue);
      drawLabel(ctx, '统一面积尺度', 670, 30, palette.green);
    }
  });
  return (
    <div>
      <div className="ctrl" aria-label="选择代码验证">
        {options.map((option) => <button type="button" key={option.id} className={'chip' + (check === option.id ? ' selected' : '')} aria-pressed={check === option.id} onClick={() => setCheck(option.id)}>{option.label}</button>)}
      </div>
      <canvas ref={canvasRef} aria-label={options.find((option) => option.id === check)?.label + '示意；实际数值与边界见下方完整文本。'} />
      <Feedback tone="neutral">{feedback[check]}</Feedback>
      <p className="step-desc">这些是已执行记录，不是点击后在浏览器里重新计算Python实验。误差的e−14表示乘以10的−14次方；误差为浮点精度量级不等于数学上完全精确。</p>
      {check === 'position' && <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="位置验证原始数值">
          <thead><tr><th scope="col">检查</th><th scope="col">最大绝对误差或差值</th><th scope="col">判断</th></tr></thead>
          <tbody>
            <tr><th scope="row">无位置CLS置换</th><td>{scientific(checks.no_position_cls_permutation_max_abs_error)}</td><td>误差小于10⁻¹⁰</td></tr>
            <tr><th scope="row">无位置图块等变</th><td>{scientific(checks.no_position_patch_equivariance_max_abs_error)}</td><td>误差小于10⁻¹⁰</td></tr>
            <tr><th scope="row">固定位置CLS差值</th><td>{checks.fixed_position_cls_permutation_max_abs_difference.toFixed(6)}</td><td>此实例对交换产生响应</td></tr>
            <tr><th scope="row">注意力每行和为1</th><td>{scientific(checks.attention_row_sum_max_abs_error)}</td><td>误差小于10⁻¹⁰</td></tr>
          </tbody>
        </table>
      </div>}
      {check === 'resolution' && <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="paper" aria-label="不同合法分辨率的注意力整数账单">
          <thead><tr><th scope="col">输入边长</th><th scope="col">P</th><th scope="col">N / S</th><th scope="col">每头S²</th></tr></thead>
          <tbody>{results.resolution_checks.map((row) => <tr key={row.resolution + '-' + row.patch}><th scope="row">{row.resolution}</th><td>{row.patch}</td><td>{row.patches} / {row.tokens}</td><td>{row.per_head_attention_elements.toLocaleString('en-US')}</td></tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

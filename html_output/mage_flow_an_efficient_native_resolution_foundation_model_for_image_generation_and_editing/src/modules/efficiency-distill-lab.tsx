import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Focus = 'tokenizer' | 'fusion' | 'distill' | 'adversarial';
const W = 900;
const H = 390;
const colors = { bg: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', blue: '#cc785c', green: '#5db872', red: '#c64545', orange: '#e8a55a', purple: '#5db8a6', text: '#252523', muted: '#6c6a64', axis: '#e6dfd8' };
const rows = [
  ['FLUX.2-VAE，无融合', '175.45', '13.88%', '1.9285', '1.00×'],
  ['Mage-VAE，无融合', '175.47', '17.44%', '1.3647', '1.41×'],
  ['+ VAE Fuse', '175.47', '17.41%', '1.3609', '1.42×'],
  ['+ Text Fuse', '175.47', '17.88%', '1.3258', '1.45×'],
  ['+ DiT Fuse', '141.44', '29.28%', '0.7775', '2.48×'],
];

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string) {
  ctx.fillStyle = colors.paper; ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
}

export const EfficiencyDistillLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [focus, setFocus] = useState<Focus>('tokenizer');
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = colors.grid; ctx.globalAlpha = 0.24;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.textBaseline = 'middle';
    box(ctx, 24, 54, 350, 264, colors.red); box(ctx, 526, 54, 350, 264, colors.blue);
    ctx.fillStyle = colors.red; ctx.font = '700 15px "Segoe UI", sans-serif'; ctx.fillText('旧 / 无优化项', 48, 80);
    ctx.fillStyle = colors.blue; ctx.fillText('新 / 应用优化项', 550, 80);
    ctx.fillStyle = colors.muted; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(focus === 'tokenizer' || focus === 'fusion' ? '8-GPU B200 训练每步协议' : focus === 'distill' ? '四步学生的训练方向' : 'Table 6 四步消融，指标越高越好', 450, 32);
    ctx.textAlign = 'left';

    if (focus === 'tokenizer') {
      const draw = (x: number, title: string, time: number, memory: string, mfu: string, color: string) => {
        ctx.fillStyle = colors.text; ctx.font = '700 15px "Segoe UI", sans-serif'; ctx.fillText(title, x, 120);
        ctx.fillStyle = colors.axis; ctx.fillRect(x, 150, 270, 24);
        ctx.fillStyle = color; ctx.fillRect(x, 150, 270 * time / 2, 24);
        ctx.fillStyle = colors.text; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(`${time.toFixed(4)} 秒/步 ↓`, x, 202);
        ctx.fillText(`${memory} GB/每 GPU · MFU ${mfu}`, x, 232);
      };
      draw(60, 'FLUX.2-VAE', 1.9285, '175.45', '13.88%', colors.red);
      draw(562, 'Mage-VAE', 1.3647, '175.47', '17.44%', colors.green);
      ctx.fillStyle = colors.purple; ctx.fillText('显存近似未降：不能把分词器替换说成显存优化', 562, 274);
    } else if (focus === 'fusion') {
      ctx.fillStyle = colors.text; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('基线 1.9285 秒/步', 60, 122); ctx.fillText('MFU 13.88%', 60, 154); ctx.fillText('175.45 GB/每 GPU', 60, 186);
      rows.forEach((row, i) => {
        const y = 112 + i * 38;
        ctx.fillStyle = i === rows.length - 1 ? colors.green : colors.blue; ctx.fillRect(562, y, 32 + (i * 48), 13);
        ctx.fillStyle = colors.text; ctx.fillText(`${i + 1}. ${row[0]} · ${row[3]}s`, 562, y + 25);
      });
    } else if (focus === 'distill') {
      ctx.fillStyle = colors.text; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('多步对齐教师', 60, 122);
      ctx.strokeStyle = colors.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(70, 166); ctx.lineTo(326, 166); ctx.stroke();
      for (let i = 0; i < 9; i += 1) { ctx.fillStyle = colors.red; ctx.beginPath(); ctx.arc(70 + i * 32, 166, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = colors.text; ctx.fillText('四步 Turbo 学生', 562, 122);
      for (let i = 0; i < 4; i += 1) { ctx.fillStyle = i === 3 ? colors.green : colors.orange; ctx.beginPath(); ctx.arc(580 + i * 80, 166, 12, 0, Math.PI * 2); ctx.fill(); }
      ['ΔCA', 'ΔDM', 'λGAN∇LGAN'].forEach((label, i) => { ctx.fillStyle = [colors.blue, colors.purple, colors.orange][i]; ctx.fillText(label, 578, 220 + i * 28); });
      ctx.fillStyle = colors.text; ctx.fillText('w = 7.5 · λGAN = 0.13', 578, 304);
    } else {
      ctx.fillStyle = colors.text; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('无对抗项', 60, 122); ctx.fillText('GenEval 0.89', 60, 166); ctx.fillText('ImgEdit 4.29', 60, 198); ctx.fillText('GEdit-EN/CN 8.003 / 8.025', 60, 230);
      ctx.fillText('有对抗项', 562, 122); ctx.fillStyle = colors.purple; ctx.fillText('GenEval 0.88（下降）', 562, 166);
      ctx.fillStyle = colors.green; ctx.fillText('ImgEdit 4.38', 562, 198); ctx.fillText('GEdit-EN/CN 8.271 / 8.264', 562, 230);
      ctx.fillStyle = colors.purple; ctx.fillText('多数其他文生图与文本编辑指标提高', 562, 274);
    }
    ctx.fillStyle = colors.muted; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText(`同步对比已重放 ${replay + 1} 次`, 24, 360);
    canvas.classList.add('is-ready');
  }, [focus, replay]);

  const feedback: Record<Focus, string> = {
    tokenizer: '在 Table 4 的 B200 条件下，仅替换 Mage-VAE 把每步时间从 1.9285s 降到 1.3647s；峰值显存没有随之下降。',
    fusion: '完整融合后每步 0.7775s、MFU 29.28%、每 GPU 峰值显存 141.44 GB；相对基线为 2.48×。',
    distill: 'Turbo 学生用四个去噪步；ΔCA 提供 CFG 增强方向，ΔDM 做分布匹配，特征判别器提供对抗梯度。',
    adversarial: '对抗项改善多数报告的文生图与文本编辑指标，但 GenEval 从 0.89 变为 0.88；不能称为所有基准一致提升。',
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="效率焦点">
        {([['tokenizer', '替换分词器'], ['fusion', '融合全栈'], ['distill', '四步蒸馏'], ['adversarial', '对抗感知项']] as Array<[Focus, string]>).map(([id, label]) =>
          <button key={id} className={`chip ${focus === id ? 'selected' : ''}`} aria-pressed={focus === id} onClick={() => setFocus(id)}>{label}</button>)}
        <button className="tiny ghost" onClick={() => setReplay((value) => value + 1)}>重放对比</button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-describedby={`eff-${chapterId}-${moduleId}`} />
      <div className="feedback good" id={`eff-${chapterId}-${moduleId}`} aria-live="polite">{feedback[focus]}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper">
          <caption style={{ textAlign: 'left', padding: '10px 0', color: colors.muted }}>Table 4 条件：单个 8-GPU NVIDIA B200 节点，全局 batch 8，每 GPU 一个 50,000 token 打包样本，FlashAttention-4。</caption>
          <thead><tr><th>配置</th><th>显存 GB/每 GPU ↓</th><th>MFU ↑</th><th>秒/步 ↓</th><th>相对速度 ↑</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="step-desc">训练 Table 4 的 2.48× 不能用于声称 A100 推理也快 2.48×。编辑蒸馏混入文生图数据时，Turbo ImgEdit 4.20 → 4.38，但 GEdit 变化不支持普遍一致性结论。</p>
    </div>
  );
};

export default EfficiencyDistillLab;

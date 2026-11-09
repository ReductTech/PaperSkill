import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 900;
const H = 265;
const C = { ink: '#21324a', muted: '#68778f', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', sage: '#b8c9a7', pale: '#f5f8f0', line: '#d7deea', white: '#ffffff' };

type Mode = 'benchmark' | 'scale-input' | 'residual' | 'bn' | 'loss' | 'capacity' | 'stability' | 'transfer' | 'mdsr' | 'sharing' | 'ensemble' | 'div2k' | 'challenge';

export const ExampleSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(2);
  const [choice, setChoice] = useState(0);
  const [flag, setFlag] = useState(false);

  const mode: Mode = moduleId === '1.1' ? 'benchmark'
    : moduleId === '2.1' ? 'scale-input'
    : moduleId === '3.1' ? 'residual'
    : moduleId === '4.1' ? 'bn'
    : moduleId === '4.2' ? 'loss'
    : moduleId === '5.1' ? 'capacity'
    : moduleId === '6.1' ? 'stability'
    : moduleId === '7.1' ? 'transfer'
    : moduleId === '8.1' ? 'mdsr'
    : moduleId === '8.2' ? 'sharing'
    : moduleId === '9.1' ? 'loss'
    : moduleId === '9.2' ? 'ensemble'
    : moduleId === '10.1' ? 'div2k' : 'challenge';

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    let ctx: CanvasRenderingContext2D | null = null;
    let factor = 1;
    const resize = () => {
      const cssW = Math.max(1, Math.min(W, parent.clientWidth || W));
      factor = cssW / W;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${H * factor}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(H * factor * dpr);
      ctx = canvas.getContext('2d');
      ctx?.setTransform(dpr * factor, 0, 0, dpr * factor, 0, 0);
      draw();
    };
    const text = (s: string, x: number, y: number, size = 20, color = C.ink, weight = 600) => {
      if (!ctx) return;
      ctx.fillStyle = color; ctx.font = `${weight} ${size}px Segoe UI, sans-serif`; ctx.fillText(s, x, y);
    };
    const box = (x: number, y: number, w: number, h: number, fill: string, label: string, color = C.white) => {
      if (!ctx) return;
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      text(label, x + 13, y + h / 2 + 8, 20, color, 700);
    };
    const drawBars = (title: string, rows: Array<[string, number]>, unit: string, caption = '', selected = rows.length - 1) => {
      text(title, 28, 36, 24, C.ink, 700);
      const max = Math.max(...rows.map((r) => r[1]));
      rows.forEach(([name, value], i) => {
        const barH = Math.max(10, (value / max) * 110);
        const x = 90 + i * 195;
        ctx!.fillStyle = i === selected ? C.green : C.sage;
        ctx!.fillRect(x, 188 - barH, 94, barH);
        text(`${value.toFixed(2)} ${unit}`, x - 3, 188 - barH - 10, 16, C.ink, 600);
        text(name, x - 8, 218, 16, C.ink, 600);
      });
      text(caption, 90, 250, 16, C.muted, 500);
    };
    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.pale; ctx.fillRect(0, 0, W, H);
      if (mode === 'benchmark') {
        const rows = [['Bicubic', 30.80], ['VDSR', 32.82], ['SRResNet', 34.00], ['EDSR+', 34.78]] as Array<[string, number]>;
        drawBars('论文图1 · DIV2K 图像0853 · ×4', rows, 'dB', 'PSNR / SSIM：30.80/0.9537、32.82/0.9623、34.00/0.9679、34.78/0.9708', choice);
      } else if (mode === 'scale-input') {
        text(`RGB 输入与 ×${scale} 输出尺寸`, 28, 36, 24, C.ink, 700);
        ['R', 'G', 'B'].forEach((ch, i) => {
          text(ch, 76 + i * 64, 77, 18, [C.red, C.green, C.blue][i], 700);
        ctx!.fillStyle = [C.red, C.green, C.blue][i]; ctx!.fillRect(62 + i * 64, 88, 50, 50);
        });
        text('三个同位通道', 55, 164, 17, C.ink, 600);
        box(305, 96, 230, 66, C.blue, '网络特征');
        text(`${scale} × ${scale} 个输出位置 / 输入像素`, 580, 91, 17, C.ink, 600);
        const cell = scale === 2 ? 44 : scale === 3 ? 31 : 23;
        for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) {
          ctx.fillStyle = (x + y) % 2 ? C.sage : C.green;
          ctx.fillRect(675 + x * (cell + 4), 105 + y * (cell + 4), cell, cell);
        }
        text(`×${scale}`, 704, 234, 18, C.ink, 700);
      } else if (mode === 'residual') {
        text('残差块路径：输出 = 输入 + F(输入)', 28, 36, 24, C.ink, 700);
        box(80, 88, 150, 66, C.sage, '输入特征', C.ink);
        box(365, 88, 160, 66, C.orange, '残差 F(x)', C.ink);
        box(680, 88, 150, 66, C.green, '相加输出');
        ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(230, 121); ctx.lineTo(365, 121); ctx.moveTo(525, 121); ctx.lineTo(680, 121); ctx.stroke();
        ctx.strokeStyle = flag ? C.green : C.red; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(155, 155); ctx.lineTo(155, 205); ctx.lineTo(755, 205); ctx.lineTo(755, 155); if (flag) ctx.stroke();
        text(flag ? '跳接开启：输入沿旁路参与相加' : '跳接关闭：旁路断开', 225, 242, 19, flag ? C.green : C.red, 700);
      } else if (mode === 'bn') {
        text(`EDSR残差块 · BN ${flag ? '开启' : '移除'}`, 28, 36, 24, C.ink, 700);
        ['卷积', ...(flag ? ['BN'] : []), 'ReLU', '卷积'].forEach((label, i, all) => {
          const x = 45 + i * (800 / all.length);
          box(x, 92, 150, 66, label === 'BN' ? C.red : C.blue, label);
        });
        text(flag ? '开启BN：特征被归一化' : '移除BN：保留特征范围；基线训练显存约省40%', 55, 220, 19, flag ? C.red : C.green, 700);
      } else if (mode === 'loss') {
        const factor = [2, 3, 4][choice];
        const l2 = [[34.40, .9662], [30.82, .9288], [28.92, .8960]][choice];
        const l1 = [[34.44, .9665], [30.85, .9292], [28.92, .8961]][choice];
        text(`SRResNet · DIV2K验证 ×${factor} · 表2`, 28, 36, 24, C.ink, 700);
        box(105, 76, 250, 92, C.blue, `L2  ${l2[0].toFixed(2)} dB / ${l2[1].toFixed(4)}`);
        box(470, 76, 250, 92, C.green, `L1  ${l1[0].toFixed(2)} dB / ${l1[1].toFixed(4)}`);
        text('PSNR / SSIM · 同一训练步数与验证协议', 105, 210, 18, C.muted, 600);
      } else if (mode === 'capacity') {
        const blocks = choice === 0 ? 16 : 32;
        text(`模型容量：${blocks} 个残差块`, 28, 36, 24, C.ink, 700);
        for (let i = 0; i < blocks; i++) {
          const x = 55 + (i % 16) * 49;
          const y = 82 + Math.floor(i / 16) * 58;
          ctx!.fillStyle = i < 16 ? C.blue : C.green; ctx!.fillRect(x, y, 34, 34);
        }
        text(choice === 0 ? 'B=16 · F=64 · 1.5M 参数' : 'B=32 · F=256 · 43M 参数', 55, 220, 21, C.ink, 700);
        text('每个小块代表一个残差块；切换按钮会改变实际绘制数量。', 55, 248, 16, C.muted, 500);
      } else if (mode === 'stability') {
        text('残差缩放配置对照（论文第3.2节）', 28, 36, 24, C.ink, 700);
        const settings = choice === 0 ? ['基线：F=64', '不使用残差缩放'] : ['EDSR：F=256', '残差缩放系数 0.1'];
        box(95, 85, 310, 74, choice ? C.green : C.blue, settings[0]);
        box(495, 85, 310, 74, C.sage, settings[1], C.ink);
        text('按钮切换论文配置；不绘制虚构训练曲线。', 95, 215, 19, C.muted, 600);
      } else if (mode === 'transfer') {
        text(`×4训练收敛趋势：${flag ? '预训练×2' : '随机初始化'}`, 28, 36, 24, C.ink, 700);
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(90, 205); ctx.lineTo(835, 205); ctx.moveTo(90, 62); ctx.lineTo(90, 205); ctx.stroke();
        text('PSNR', 38, 66, 16, C.muted, 600); text('更新次数', 748, 238, 16, C.muted, 600);
        const curve = (pretrained: boolean) => {
          ctx!.strokeStyle = pretrained ? C.green : C.red; ctx!.lineWidth = pretrained === flag ? 6 : 3; ctx!.beginPath();
          for (let i = 0; i <= 10; i++) {
            const x = 100 + i * 70;
            const y = 188 - (pretrained ? (1 - Math.exp(-i / 2.2)) * 105 : (1 - Math.exp(-i / 4.2)) * 105);
            if (i === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        };
        curve(false); curve(true);
        ctx!.fillStyle = C.red; ctx!.fillRect(630, 72, 18, 4); text('随机初始化', 656, 80, 16, C.ink, 600);
        ctx!.fillStyle = C.green; ctx!.fillRect(630, 96, 18, 4); text('预训练 ×2', 656, 104, 16, C.ink, 600);
        text('论文图4：预训练×2曲线更快进入高PSNR区间；曲线按原图趋势重绘，非原始逐点数据。', 100, 255, 15, C.muted, 500);
      } else if (mode === 'mdsr') {
        text(`MDSR结构 · 当前倍率 ×${scale}`, 28, 36, 24, C.ink, 700);
        box(40, 95, 220, 72, C.sage, `×${scale}专属预处理`, C.ink);
        box(315, 95, 240, 72, C.blue, '共享主干');
        box(615, 70, 240, 54, C.green, `×${scale}上采样`);
        box(615, 137, 240, 54, '#7c3aed', '其他倍率分支关闭');
      } else if (mode === 'sharing') {
        const params = choice === 0 ? ['三个单尺度基线', '1.5M × 3 = 4.5M'] : ['多尺度基线 MDSR', '3.2M 参数'];
        text('多尺度参数共享比较（论文第3.3节）', 28, 36, 24, C.ink, 700);
        box(90, 83, 720, 74, choice ? C.green : C.blue, params[0]);
        text(params[1], 90, 211, 24, C.ink, 700);
        text('论文报告性能可比；此处不将不同评测指标混画。', 90, 242, 17, C.muted, 500);
      } else if (mode === 'ensemble') {
        text(`下采样条件：${flag ? '未知退化' : '双三次对称退化'}`, 28, 36, 24, C.ink, 700);
        if (!flag) {
          box(40, 91, 190, 62, C.blue, '输入变换×8'); box(350, 91, 190, 62, C.green, '逆变换对齐'); box(660, 91, 190, 62, C.orange, '结果平均', C.ink);
          ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(230,122);ctx.lineTo(350,122);ctx.moveTo(540,122);ctx.lineTo(660,122);ctx.stroke();
          text('论文说明：几何自集成适用于对称下采样（如双三次）。', 40, 218, 18, C.green, 600);
        } else {
          box(105, 91, 690, 62, C.red, '不启用几何自集成');
          text('NTIRE 未知退化赛道未使用自集成。', 105, 218, 19, C.red, 700);
        }
      } else if (mode === 'div2k') {
        const rows = choice === 0
          ? [['SRResNet',34.40],['EDSR',35.03],['MDSR',34.96],['EDSR+',35.12]] as Array<[string,number]>
          : [['SRResNet',28.92],['EDSR',29.25],['MDSR',29.26],['EDSR+',29.38]] as Array<[string,number]>;
        drawBars(`DIV2K验证 ×${choice === 0 ? 2 : 4} · 表2 · PSNR(dB)`, rows, '');
      } else {
        const track1 = [[34.93,31.13,29.09],[34.83,31.04,29.04],[34.47,30.77,28.82]];
        const track2 = [[34.00,30.78,28.77],[33.86,30.67,28.62],[33.67,30.51,28.54]];
        const table = choice === 0 ? track1 : track2;
        const scaleIndex = scale - 2;
        const values: Array<[string,number]> = [['EDSR+',table[0][scaleIndex]],['MDSR+',table[1][scaleIndex]],['第3名',table[2][scaleIndex]]];
        drawBars(`NTIRE${choice === 0 ? '双三次' : '未知退化'}赛道 ×${scale} · PSNR(dB)`, values, '', `挑战赛表4${choice === 1 ? '；未知退化赛道未使用自集成' : ''}`);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const observer = new ResizeObserver(resize);
    observer.observe(parent); resize();
    const disconnect = observeCanvas(canvas, draw, () => {});
    return () => { observer.disconnect(); disconnect(); };
  }, [mode, scale, choice, flag]);

  const feedback = mode === 'benchmark' ? `已选方法：${['Bicubic','VDSR','SRResNet','EDSR+'][choice]}。图1为DIV2K图0853、×4原文PSNR/SSIM。`
    : mode === 'scale-input' ? `倍率×${scale}：网格尺寸随倍率变化，RGB通道标签保持在图层上方。`
    : mode === 'residual' ? (flag ? '跳接开启：输入沿旁路参与残差相加。' : '跳接关闭：旁路断开，输出仅经过残差支路。')
    : mode === 'bn' ? (flag ? 'BN开启会归一化特征；EDSR设计移除BN以保留特征范围。' : 'BN移除；论文基线训练显存约减少40%。')
    : mode === 'loss' ? `DIV2K验证×${[2,3,4][choice]}：SRResNet L1与L2结果按同一协议并列。`
    : mode === 'capacity' ? (choice ? 'EDSR最终单尺度模型：B=32、F=256、43M参数。' : '单尺度基线：B=16、F=64、1.5M参数。')
    : mode === 'stability' ? (choice ? 'EDSR大模型使用0.1残差缩放；这是论文模型配置。' : '基线F=64时不使用残差缩放。')
    : mode === 'transfer' ? (flag ? '绿色曲线高亮：论文图4显示预训练×2初始化的×4模型更快进入高PSNR区间。' : '红色曲线高亮：随机初始化作为论文图4的对照；验证使用10张DIV2K图。')
    : mode === 'mdsr' ? `已选择×${scale}：仅该倍率专属预处理/上采样分支启用，共享主干复用。`
    : mode === 'sharing' ? (choice ? '多尺度基线MDSR为3.2M参数，性能与单尺度模型可比。' : '三个单尺度基线各1.5M，总计4.5M参数。')
    : mode === 'ensemble' ? (flag ? '未知退化条件：不使用几何自集成。' : '对称下采样条件下，将8种变换的输出逆变换后平均。')
    : mode === 'div2k' ? `DIV2K验证×${choice === 0 ? 2 : 4}：只比较同数据集、同倍率结果。`
    : `NTIRE ${choice === 0 ? '双三次' : '未知退化'}赛道：按表4所列倍率与协议读取成绩。`;

  return <div>
    <canvas ref={canvasRef} width={W} height={H} aria-label="论文数据或可操作结构视图" />
    <div className="ctrl">
      {mode === 'benchmark' ? ['Bicubic','VDSR','SRResNet','EDSR+'].map((v,i) => <button key={v} aria-pressed={choice===i} onClick={() => setChoice(i)}>{v}</button>)
        : mode === 'scale-input' || mode === 'mdsr' ? [2,3,4].map((v) => <button key={v} aria-pressed={scale===v} onClick={() => setScale(v)}>×{v}</button>)
        : mode === 'residual' ? <button aria-pressed={flag} onClick={() => setFlag(!flag)}>{flag ? '关闭跳接' : '开启跳接'}</button>
        : mode === 'bn' || mode === 'transfer' || mode === 'ensemble' ? <button aria-pressed={flag} onClick={() => setFlag(!flag)}>{mode === 'bn' ? (flag ? '移除 BN' : '启用 BN') : mode === 'transfer' ? (flag ? '改为随机初始化' : '改用预训练×2') : (flag ? '查看双三次条件' : '查看未知退化')}</button>
        : mode === 'loss' ? [2,3,4].map((v,i) => <button key={v} aria-pressed={choice===i} onClick={() => setChoice(i)}>×{v}</button>)
        : mode === 'capacity' ? <button aria-pressed={choice===1} onClick={() => setChoice(1-choice)}>{choice ? '减少到 16 个残差块' : '扩展到 32 个残差块'}</button>
        : mode === 'stability' ? <button aria-pressed={choice===1} onClick={() => setChoice(1-choice)}>{choice ? '关闭 0.1 残差缩放' : '启用 0.1 残差缩放'}</button>
        : mode === 'sharing' ? <button aria-pressed={choice===1} onClick={() => setChoice(1-choice)}>{choice ? '拆成 3 个单尺度模型' : '合并为 MDSR 主干'}</button>
        : mode === 'div2k' ? <button aria-pressed={choice===1} onClick={() => setChoice(1-choice)}>{choice ? '查看 ×2' : '查看 ×4'}</button>
        : mode === 'challenge' ? <><select aria-label="挑战赛倍率" value={scale} onChange={(e) => setScale(Number(e.target.value))}><option value={2}>×2</option><option value={3}>×3</option><option value={4}>×4</option></select><button aria-pressed={choice===1} onClick={() => setChoice(1-choice)}>{choice ? '查看双三次赛道' : '查看未知退化赛道'}</button></>
        : null}
    </div>
    <div className="feedback">{feedback}</div>
  </div>;
};

export default ExampleSlider;

import { useState } from 'react';
import { Stage, colors } from './paper-canvas';

type Rgb = [number, number, number];
const side = 12;
const phases = ['含噪马赛克', '去噪马赛克', '补色预览'];
const lastPhase = phases.length - 1;

function integer(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function channelAt(row: number, col: number) {
  return row % 2 === 0 ? (col % 2 === 0 ? 1 : 0) : (col % 2 === 0 ? 2 : 1);
}

function makeScene() {
  const colorGrid: Rgb[] = [];
  const original: number[] = [];
  const noisy: number[] = [];
  let seed = 14937;
  const noise = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let row = 0; row < side; row += 1) {
    for (let col = 0; col < side; col += 1) {
      const band = Math.sin((col - row * 0.65) * 0.65) * 16;
      const illumination = col * 1.6 + row * 2.2;
      const rgb: Rgb = [integer(139 + band + illumination), integer(165 + band * 0.85 + illumination), integer(128 - band + illumination)];
      const raw = rgb[channelAt(row, col)];
      colorGrid.push(rgb);
      original.push(raw);
      noisy.push(integer(raw + (noise() + noise() + noise() - 1.5) * 53));
    }
  }

  const denoised = noisy.map((value, index) => {
    const row = Math.floor(index / side);
    const col = index % side;
    const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    let sum = value * 2;
    let count = 2;
    for (const [dy, dx] of offsets) {
      const yy = row + dy;
      const xx = col + dx;
      if (yy >= 0 && yy < side && xx >= 0 && xx < side) {
        sum += noisy[yy * side + xx];
        count += 1;
      }
    }
    return integer(sum / count);
  });

  const demosaicked = denoised.map((value, index): Rgb => {
    const row = Math.floor(index / side);
    const col = index % side;
    const channels: Rgb = [0, 0, 0];
    for (let channel = 0; channel < 3; channel += 1) {
      if (channelAt(row, col) === channel) {
        channels[channel] = value;
        continue;
      }
      let sum = 0;
      let count = 0;
      for (let y = Math.max(0, row - 1); y <= Math.min(side - 1, row + 1); y += 1) {
        for (let x = Math.max(0, col - 1); x <= Math.min(side - 1, col + 1); x += 1) {
          if (channelAt(y, x) !== channel) continue;
          sum += denoised[y * side + x];
          count += 1;
        }
      }
      channels[channel] = integer(sum / count);
    }
    return channels;
  });

  const rmse = (values: number[]) => Math.sqrt(values.reduce((sum, value, index) => sum + (value - original[index]) ** 2, 0) / values.length);
  return { colorGrid, noisy, denoised, demosaicked, errors: [rmse(noisy), rmse(denoised)] };
}

const scene = makeScene();

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 14, color = colors.ink, weight = 500) {
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

export function RawPipeline() {
  const [step, setStep] = useState(0);
  const feedback = [
    '这里仍有噪点，每个采样点只有一个实测颜色分量。',
    '此时仍是马赛克，先在实测颜色上压低噪声。',
    '在去噪马赛克基础上补齐颜色。此处是简化插值的教学预览。',
  ][step];

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, width, height);
    text(ctx, '教学模拟', 220, 31, 16, colors.ink, 700);

    ctx.beginPath();
    ctx.roundRect(20, 47, 168, 160, 12);
    ctx.fillStyle = colors.light;
    ctx.fill();
    ctx.fillStyle = '#eaddba';
    ctx.fillRect(40, 62, 126, 130);
    const tileSize = 10.5;
    scene.colorGrid.forEach(([red, green, blue], index) => {
      const x = 40 + (index % side) * tileSize;
      const y = 64 + Math.floor(index / side) * tileSize;
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(x, y, tileSize + 0.1, tileSize + 0.1);
    });
    const paperX = [67, 112, 145][step];
    ctx.fillStyle = '#fff5e9';
    ctx.fillRect(paperX, 63, 166 - paperX, 128);
    ctx.strokeStyle = colors.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paperX, 63);
    ctx.lineTo(paperX, 191);
    ctx.stroke();

    const drawColors = step === 0 ? scene.noisy : scene.denoised;
    const unit = 13;
    for (let row = 0; row < side; row += 1) {
      for (let col = 0; col < side; col += 1) {
        const index = row * side + col;
        const channel = channelAt(row, col);
        const active: Rgb = [34, 34, 34];
        active[channel] = drawColors[index];
        const rgb = step === lastPhase ? scene.demosaicked[index] : active;
        const x = 220 + col * unit;
        const y = 45 + row * unit;
        ctx.fillStyle = `rgb(${rgb.join(',')})`;
        ctx.fillRect(x, y, step === lastPhase ? unit + 0.1 : unit - 0.6, step === lastPhase ? unit + 0.1 : unit - 0.6);
      }
    }

    const timeline = ['提取并缩放', '马赛克去噪', '去马赛克'];
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(429, 60);
    ctx.lineTo(429, 130);
    ctx.stroke();
    timeline.forEach((stage, index) => {
      const y = 60 + index * 35;
      const isActive = index === step;
      const accent = index === 0 ? colors.red : index === 1 ? colors.blue : colors.green;
      ctx.beginPath();
      ctx.arc(429, y, isActive ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? accent : colors.line;
      ctx.fill();
      text(ctx, stage, 446, y + 5, 15, isActive ? accent : colors.muted, isActive ? 700 : 500);
    });

    const measurement = step === lastPhase ? '每像素 3 个颜色分量' : `采样位 RMSE  ${scene.errors[step].toFixed(1)}`;
    text(ctx, measurement, 424, 187, 15, colors.ink, 700);
  }

  return (
    <Stage label="教学模拟的 RAW 处理次序与真实论文流程" draw={draw} feedback={feedback} tone={step === 0 ? 'bad' : step === lastPhase ? 'good' : 'neutral'}>
      <button type="button" className="chip" disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</button>
      <span aria-live="polite">{step + 1} / {phases.length} · {phases[step]}</span>
      <button type="button" className="chip" disabled={step === lastPhase} onClick={() => setStep(step + 1)}>下一步</button>
    </Stage>
  );
}

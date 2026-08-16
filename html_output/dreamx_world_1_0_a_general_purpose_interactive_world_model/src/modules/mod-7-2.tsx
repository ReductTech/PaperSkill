import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 236;

type StageId = 's1' | 's2' | 's3' | 's4' | 's5';

const STAGES: Record<StageId, { x: number; y: number; w: number; h: number; label: string; color: string; detail: string }> = {
  s1: {
    x: 14, y: 40, w: 160, h: 56, label: '① 少步自回归基座', color: '#d97706',
    detail: '先用<b>因果强制</b>（Huang et al., 2025；Zhu et al., 2026）在大规模高质量视频上训练少步自回归模型：训练时的条件就是模型自己生成的历史，并保持在双向模型的原始视觉分布附近（§3.4）。',
  },
  s2: {
    x: 200, y: 40, w: 160, h: 56, label: '② 长视频适配', color: '#d97706',
    detail: '跟随 LongLive（Yang et al., 2025）在<b>长序列</b>上继续适配：长展开 rollout + 局部时间窗口训练，用 <b>Infinity-RoPE</b> 支撑扩展的自回归上下文，压住长视频的身份漂移、背景突变与提示/运动控制变弱（§3.4）。',
  },
  s3: {
    x: 386, y: 40, w: 160, h: 56, label: '③ 插上相机分支', color: '#d97706',
    detail: '在长视频 T2V 学生中加入 <b>E-PRoPE 相机分支（LoRA）</b>，得到可控相机的少步自回归学生；它保留流式采样接口，逐块从生成历史往下生成（§3.4）。',
  },
  s4: {
    x: 104, y: 140, w: 210, h: 56, label: '④ DMD-forcing 蒸馏', color: '#228d5c',
    detail: '<b>核心一步</b>（Figure 7）：从长视频中采样<b>局部 DMD 窗口</b>，让学生的 rollout 在窗口上接受<b>冻结双向 E-PRoPE 教师 ❄</b>的分布匹配监督——教师不需变成自回归，只需在学生样本上打分。分块推理导致运镜平滑度与相机可控性退化时，<b>重复一遍长视频 DMD 训练</b>把行为拉回（§3.4）。',
  },
  s5: {
    x: 360, y: 140, w: 186, h: 56, label: '⑤ I2V 变体', color: '#7c3aed',
    detail: '为保住 I2V 质量：把每个 DMD 窗口的<b>首帧潜变量经 VAE 解码</b>后作为<b>图像条件</b>喂给教师，教师便能在首帧约束下监督相机可控的学生（§3.4）。',
  },
};

const ORDER: StageId[] = ['s1', 's2', 's3', 's4', 's5'];

export const Mod72: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<StageId>('s4');
  const selRef = useRef<StageId>('s4');
  selRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, active: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 3 : 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 7 * Math.cos(ang - 0.42), y2 - 7 * Math.sin(ang - 0.42));
      ctx.lineTo(x2 - 7 * Math.cos(ang + 0.42), y2 - 7 * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const frame = (now: number) => {
      const sel = selRef.current;
      const pulse = 0.5 + 0.5 * Math.sin((now - t0) / 260);
      K.clearScene(ctx, W, H);
      const S1 = STAGES.s1, S2 = STAGES.s2, S3 = STAGES.s3, S4 = STAGES.s4, S5 = STAGES.s5;
      const on = (...ids: StageId[]) => ids.includes(sel);

      // pipeline arrows: ①→②→③ →(snake down) ④→⑤
      arrow(S1.x + S1.w, S1.y + S1.h / 2, S2.x - 4, S2.y + S2.h / 2, K.C.emph, on('s1', 's2'));
      arrow(S2.x + S2.w, S2.y + S2.h / 2, S3.x - 4, S3.y + S3.h / 2, K.C.emph, on('s2', 's3'));
      arrow(S3.x + S3.w / 2, S3.y + S3.h + 4, S4.x + S4.w - 30, S4.y - 4, K.C.good, on('s3', 's4'));
      arrow(S4.x + S4.w, S4.y + S4.h / 2, S5.x - 4, S5.y + S5.h / 2, K.C.aux, on('s4', 's5'));

      // stage boxes
      (Object.keys(STAGES) as StageId[]).forEach((id) => {
        const s = STAGES[id];
        const isSel = id === sel;
        ctx.fillStyle = isSel ? `rgba(39,68,110,${0.12 + 0.1 * pulse})` : '#fff';
        ctx.strokeStyle = isSel ? K.C.guide : s.color;
        ctx.lineWidth = isSel ? 3 : 1.8;
        ctx.beginPath();
        ctx.roundRect(s.x, s.y, s.w, s.h, 7);
        ctx.fill();
        ctx.stroke();
        K.drawLabel(ctx, s.label, s.x + 10, s.y + s.h / 2 + 4, K.C.ink, 12);
      });
      // annotations
      K.drawLabel(ctx, '学生 🔥 全程可训练；教师 ❄ 冻结', S4.x, S4.y - 12, K.C.muted, 10);
      K.drawLabel(ctx, '依据论文 §3.4 / Figure 7 整理', 14, 226, K.C.muted, 9);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      for (const id of ORDER) {
        const s = STAGES[id];
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
          setSelected(id);
          return;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        {ORDER.map((id) => (
          <button
            key={id}
            className={`chip ${selected === id ? 'active' : ''}`}
            onClick={() => setSelected(id)}
          >
            {STAGES[id].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${selected === 's4' ? 'good' : ''}`} dangerouslySetInnerHTML={{ __html: STAGES[selected].detail }} />
    </div>
  );
};

export default Mod72;

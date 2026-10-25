import { useState } from 'react';
import { C, SceneCanvas, clearScene, drawLeaf, drawSceneLabel, drawTarget, Feedback } from './kit-anchor';

const steps = ['输入', '三尺度编码', '对齐融合', '层级解码', '像素概率'];
const details = ['主尺度 RGB 输入：3×384×384', '整图缩放：192×192、384×384、576×576；共享编码器提取五级特征', '各级辅助尺度对齐到主尺度特征，SIU 逐位置融合', '五级 HMU 自顶向下整合多层信息，逐步恢复空间细节', '单通道 logits 经 sigmoid，形成 1×384×384 的前景概率图（主尺度示意）'];
const comments = ['先固定主尺度与输入内容，再生成两种辅助尺度。', '三路运行共享参数；共享权重不意味着只计算一遍。', '此后辅助尺度的线索已被融合到主尺度分支。', '自顶向下跨层融合，与 HMU 内部的逐组交互是两种不同关系。', '一次前向结束：每个像素得到属于伪装目标的概率；灰度值不是边框坐标。'];
export function Zoom6() {
  const [step, setStep] = useState(0);
  return <div>
    <SceneCanvas aria-label={`一次前向的第 ${step + 1} 步：${steps[step]}。${details[step]}。教学示意。`} draw={ctx => {
      clearScene(ctx, 1080, 280);
      drawLeaf(ctx, 175, 140, 1.3);
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(72, 48, 220, 180, 10); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(835, 52, 172, 176, 10); ctx.stroke();
      ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(318, 140); ctx.lineTo(802, 140); ctx.stroke(); ctx.setLineDash([]);
      if (step === 1) {
        [0.4, 0.65, .9].forEach((scale, i) => {
          const x = 430 + 135 * i;
          ctx.fillStyle = C.bg; ctx.fillRect(x - 56, 50, 112, 180); drawLeaf(ctx, x, 139, scale);
          ctx.strokeStyle = C.blue; ctx.strokeRect(x - 45 * scale, 139 - 45 * scale, 90 * scale, 90 * scale);
        });
        ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(407, 240); ctx.lineTo(720, 240); ctx.stroke();
      } else if (step === 2) {
        [C.blue, C.dark, C.orange].forEach((color, i) => { ctx.fillStyle = color; ctx.globalAlpha = .24; ctx.fillRect(455 + i * 38, 75 + i * 20, 130, 115); });
        ctx.globalAlpha = 1; ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(675, 95, 98, 98);
        drawTarget(ctx, 724, 144, 34, C.green);
      } else if (step === 3) {
        for (let i = 0; i < 5; i++) {
          const x = 430 + i * 64, y = 60 + i * 34, width = 55 + i * 9;
          ctx.fillStyle = C.dark; ctx.globalAlpha = .4 + i * .1; ctx.fillRect(x, y, width, 27); ctx.globalAlpha = 1;
          if (i < 4) { ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(x + width, y + 13); ctx.lineTo(x + width + 14, y + 13); ctx.lineTo(x + width + 14, y + 47); ctx.stroke(); }
        }
      } else if (step === 4) {
        ctx.fillStyle = '#252525'; ctx.fillRect(837, 54, 168, 172);
        ctx.fillStyle = '#f1f1f1'; ctx.beginPath(); ctx.ellipse(920, 142, 34, 60, -.35, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.stroke();
        drawTarget(ctx, 587, 140, 52, C.green);
      }
      drawSceneLabel(ctx, steps[step], 475, 30); drawSceneLabel(ctx, '教学示意', 868, 252);
    }} />
    <div className="ctrl"><button type="button" className="chip" disabled={step === 0} style={{ opacity: step === 0 ? .4 : 1 }} onClick={() => setStep(s => Math.max(0, s - 1))}>上一步</button><strong aria-live="polite">第 {step + 1} / 5 步：{steps[step]}</strong><button type="button" className="chip" disabled={step === 4} style={{ opacity: step === 4 ? .4 : 1 }} onClick={() => setStep(s => Math.min(4, s + 1))}>下一步</button></div>
    <div className="ctrl" aria-live="polite" style={{ color: C.muted }}>{details[step]}</div>
    <Feedback tone={step === 4 ? 'good' : 'neutral'}>{comments[step]}</Feedback>
  </div>;
}

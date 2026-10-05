import { useState } from 'react';
import { C, Scene, Feedback, Readout, Source, drawCard, drawAlbum, arrow, roundRect, text } from './lada-kit';

const classNames = ['猫', '狗', '鸟', '蝶', '花', '树'];
const taskNames = ['猫、狗', '鸟、蝶', '花、树'];

function memoryLock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y - 2, 3.4, Math.PI, 0); ctx.stroke();
  roundRect(ctx, x - 5, y - 2, 10, 8, 2, color); ctx.restore();
}

export function LadaThree() {
  const [step, setStep] = useState(1);
  const classes = step * 2;
  const vectors = classes * 2;
  const parameters = vectors * 512;
  const frozenClasses = classes - 2;
  const frozenVectors = frozenClasses * 2;
  const number = (value: number) => value.toLocaleString('zh-CN');

  return <div className="lada-three" onKeyDown={event => event.stopPropagation()}>
    <style>{`
      .lada-three .lada-three-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 14px}
      .lada-three .lada-three-button{font:inherit;font-size:14px;min-height:44px;padding:10px 14px;border-radius:8px;cursor:pointer;border:1px solid #c7d4bf;background:#fff;color:#27446e}
      .lada-three .lada-three-button-primary{background:#228d5c;border-color:#228d5c;color:#fff;font-weight:600}
      .lada-three .lada-three-button:disabled{opacity:.42;cursor:default}
      .lada-three .lada-three-button:focus-visible{outline:3px solid #f07e47;outline-offset:3px}
      .lada-three .lada-three-stage{color:#526357;font-size:14px;padding:4px 2px;font-variant-numeric:tabular-nums}
      .lada-three .lada-three-legend{display:flex;flex-wrap:wrap;gap:12px 18px;font-size:13px;margin:12px 0 14px;color:#526357}
      .lada-three .lada-three-legend span{padding-left:8px;border-left:4px solid #cbd5c5}
      .lada-three .lada-three-legend .lada-three-current{border-color:#228d5c}
      .lada-three .lada-three-legend .lada-three-frozen{border-color:#27446e}
      .lada-three .lada-three-tasks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:16px 0}
      .lada-three .lada-three-task{padding:12px;border:1px solid #dbe3d5;border-radius:9px;background:#f8faf5;color:#677660;min-width:0}
      .lada-three .lada-three-task[data-status="current"]{border-color:#228d5c;background:#eef7ee;color:#1d6b46}
      .lada-three .lada-three-task[data-status="frozen"]{border-color:#879eba;background:#edf2f8;color:#27446e}
      .lada-three .lada-three-task strong{display:block;font-size:14px;margin-bottom:5px}
      .lada-three .lada-three-task p{font-size:13px;margin:4px 0;line-height:1.65}
      .lada-three .lada-three-equation{font-size:14px;line-height:1.8;color:#526357;margin:12px 0;overflow-wrap:anywhere}
      @media(max-width:540px){.lada-three .lada-three-tasks{grid-template-columns:1fr}.lada-three .lada-three-task{display:grid;grid-template-columns:1fr 1fr;gap:2px 8px}.lada-three .lada-three-task strong{grid-column:1/-1}}
    `}</style>
    <div className="lada-three-actions">
      <button type="button" className="lada-three-button lada-three-button-primary" onClick={() => setStep(value => Math.min(3, value + 1))} disabled={step === 3}>加入下一任务</button>
      <button type="button" className="lada-three-button" onClick={() => setStep(value => Math.max(1, value - 1))} disabled={step === 1}>上一任务</button>
      <button type="button" className="lada-three-button" onClick={() => setStep(1)} disabled={step === 1}>重置</button>
      <span className="lada-three-stage">任务 {step} / 3：{taskNames[step - 1]}</span>
    </div>
    <Scene label={`教学示例：第${step}个任务，${classes}个已见类；每类2个记忆向量，每个向量512维。前${frozenClasses}类冻结，当前2类可训练。拼接响应${vectors}维。`} draw={(ctx, w, h) => {
      const bookX = w * 0.035, bookY = h * 0.19, bookW = w * 0.36, bookH = h * 0.65;
      const matrixX = w * 0.54, matrixY = h * 0.19, matrixW = w * 0.405, rowH = h * 0.102;
      drawAlbum(ctx, bookX, bookY, bookW, bookH);
      for (let index = 0; index < 6; index++) {
        const active = index < classes;
        const frozen = index < frozenClasses;
        const color = frozen ? C.blue : active ? C.green : '#ced7c7';
        const x = bookX + bookW * (index % 2 === 0 ? 0.26 : 0.74);
        const y = bookY + bookH * (0.18 + Math.floor(index / 2) * 0.30);
        const cardSize = Math.min(bookW * 0.32, h * 0.155);
        if (active) {
          drawCard(ctx, x, y, cardSize, index, color, 0);
          if (frozen) memoryLock(ctx, x + cardSize * 0.31, y + cardSize * 0.35, C.blue);
        } else {
          ctx.save(); ctx.setLineDash([4, 4]); roundRect(ctx, x - cardSize / 2, y - cardSize / 2, cardSize, cardSize, 4, 'transparent', '#ccd6c6'); ctx.restore();
        }
        const top = matrixY + index * rowH;
        roundRect(ctx, matrixX, top, matrixW, rowH * 0.86, 4, active ? (frozen ? '#edf2f7' : '#eaf6eb') : '#eff2e9', active ? color : '#dce3d4');
        for (let memory = 0; memory < 2; memory++) {
          const vectorY = top + rowH * (0.19 + memory * 0.33);
          for (let component = 0; component < 12; component++) {
            const segmentX = matrixX + matrixW * 0.06 + component * matrixW * 0.064;
            ctx.save();
            ctx.globalAlpha = active ? 0.24 + ((index * 7 + memory * 3 + component * 5) % 10) * 0.065 : 0.35;
            ctx.fillStyle = color; ctx.fillRect(segmentX, vectorY, Math.max(2, matrixW * 0.047), Math.max(3, rowH * 0.14)); ctx.restore();
          }
        }
        if (frozen) memoryLock(ctx, matrixX + matrixW * 0.91, top + rowH * 0.41, C.blue);
        else if (active) {
          ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 1.8; const cx = matrixX + matrixW * 0.91, cy = top + rowH * 0.42;
          ctx.beginPath(); ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4); ctx.stroke(); ctx.restore();
        }
      }
      arrow(ctx, bookX + bookW + 7, h * 0.51, matrixX - 10, h * 0.51, C.green, 2.5);
      text(ctx, '类别索引', bookX + bookW / 2, h * 0.105, 13, C.muted, 'center');
      text(ctx, '记忆矩阵', matrixX + matrixW / 2, h * 0.105, 13, C.muted, 'center');
    }} />
    <div className="lada-three-legend"><span className="lada-three-frozen">蓝色锁：历史记忆冻结</span><span className="lada-three-current">绿色：当前记忆可训练</span><span>浅色：后续类别槽位</span></div>
    <Readout items={[{ label: '已见类别 M', value: `${classes} 类` }, { label: '拼接响应 φ(i)', value: `${vectors} 维` }, { label: '总记忆参数', value: number(parameters) }, { label: '当前可训练记忆参数', value: '2,048' }]} />
    <Feedback tone="good">{step === 1
      ? '第一个任务加入2类、4个记忆向量，标签专属特征为4维。当前两类记忆参与训练。'
      : `已学习${classes}类，标签专属特征为${vectors}维。本任务加入4个记忆向量，先前${frozenVectors}个向量保持冻结。${step === 3 ? '全部6类共同响应当前图像。' : ''}`}</Feedback>
    <p className="lada-three-equation">教学示例：λ₁ = 2，d = 512；总记忆矩阵为 {vectors} × 512，参数数为 {classes} × 2 × 512 = {number(parameters)}。旧区冻结参数为 {number(frozenVectors * 512)}。</p>
    <div className="lada-three-tasks" aria-label="各任务的记忆状态">
      {taskNames.map((names, index) => {
        const status = index === step - 1 ? 'current' : index < step - 1 ? 'frozen' : 'pending';
        return <div className="lada-three-task" data-status={status} key={names}>
          <strong>任务 {index + 1}：{names}</strong>
          <p>{status === 'current' ? '当前可训练' : status === 'frozen' ? '历史记忆冻结' : '等待加入'}</p>
          <p>{status === 'pending' ? '预留2个类别槽位' : '4个向量，2,048个参数'}</p>
        </div>;
      })}
    </div>
    <p className="lada-three-equation">矩阵从上到下依次对应{classNames.join('、')}，每类两行；新增任务后，已有行的位置与内部条纹保持不变。</p>
    <Source page={4} label="公式(5)：按类聚类初始化、增量记忆与标签专属特征" />
  </div>;
}

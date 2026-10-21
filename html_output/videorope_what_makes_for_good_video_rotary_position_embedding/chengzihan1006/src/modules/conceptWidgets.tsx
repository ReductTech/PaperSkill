import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import {
  CH,
  COLORS,
  CW,
  TECH_H,
  chipClass,
  clear,
  clearSized,
  feedbackClass,
  label,
  panel,
  useSizedStaticCanvas,
  useStaticCanvas,
} from './canvasUtils';

export const DimensionExplorer: React.FC<WidgetProps> = () => {
  const [axis, setAxis] = useState<'t' | 'x' | 'y'>('t');
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 55, 32, 970, 214);
    const ox = 540;
    const oy = 190;
    const axes = [
      { id: 't', x: 760, y: 78, color: COLORS.orange },
      { id: 'x', x: 790, y: 190, color: COLORS.blue },
      { id: 'y', x: 410, y: 58, color: COLORS.green },
    ] as const;
    axes.forEach((a) => {
      const active = a.id === axis;
      ctx.strokeStyle = active ? a.color : COLORS.line;
      ctx.lineWidth = active ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();
      ctx.fillStyle = active ? a.color : COLORS.light;
      ctx.beginPath();
      ctx.arc(a.x, a.y, active ? 13 : 9, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let f = 0; f < 4; f++) {
      ctx.strokeStyle = axis === 't' && f === 3 ? COLORS.orange : COLORS.line;
      ctx.lineWidth = axis === 't' && f === 3 ? 4 : 2;
      ctx.strokeRect(120 + f * 76, 88 + f * 16, 110, 86);
    }
    label(ctx, axis.toUpperCase(), 520, 228, axis === 't' ? COLORS.orange : axis === 'x' ? COLORS.blue : COLORS.green, 24);
  }, [axis]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        {(['t', 'x', 'y'] as const).map((item) => (
          <button key={item} className={chipClass(axis === item)} onClick={() => setAxis(item)}>
            {item === 't' ? '时间 t' : item === 'x' ? '水平 x' : '垂直 y'}
          </button>
        ))}
      </div>
      <div className={feedbackClass('neutral')}>
        {axis === 't' ? '时间轴连接不同帧；它需要跨越远距离仍保持可辨识。' : '空间轴描述同一帧中的补丁位置，范围受图像分辨率限制。'}
      </div>
    </div>
  );
};

export const RopeRotation: React.FC<WidgetProps> = () => {
  const [position, setPosition] = useState(12);
  const highAngle = (position * 0.42) % (Math.PI * 2);
  const lowAngle = (position * 0.055) % (Math.PI * 2);
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    [310, 770].forEach((cx, index) => {
      panel(ctx, cx - 185, 34, 370, 210);
      const angle = index === 0 ? highAngle : lowAngle;
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, 142, 72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = index === 0 ? COLORS.red : COLORS.green;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, 142);
      ctx.lineTo(cx + Math.cos(angle) * 68, 142 + Math.sin(angle) * 68);
      ctx.stroke();
      ctx.fillStyle = COLORS.orange;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 68, 142 + Math.sin(angle) * 68, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    label(ctx, '高频', 280, 68, COLORS.red, 20);
    label(ctx, '低频', 740, 68, COLORS.green, 20);
  }, [position]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        <label>位置索引 <span className="val">{position}</span></label>
        <input type="range" min="0" max="128" value={position} onChange={(e) => setPosition(Number(e.target.value))} />
      </div>
      <div className={feedbackClass(position > 80 ? 'bad' : 'neutral')}>
        {position > 80 ? '高频向量已经多次绕圈，远处位置更容易出现相似相位；低频仍在缓慢转动。' : '同一位置增量在高频维度产生更快旋转，在低频维度产生更慢旋转。'}
      </div>
    </div>
  );
};

type Method = 'Vanilla' | 'TAD-RoPE' | 'RoPE-Tie' | 'M-RoPE' | 'VideoRoPE';
const criteria: Record<Method, [boolean, boolean, boolean, boolean]> = {
  Vanilla: [false, false, false, false],
  'TAD-RoPE': [false, false, false, true],
  'RoPE-Tie': [true, false, true, false],
  'M-RoPE': [true, false, false, false],
  VideoRoPE: [true, true, true, true],
};

export const CriteriaMatrix: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Method>('M-RoPE');
  const values = criteria[method];
  const names = ['3D', '频率', '前后对称', '缩放'];
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 100, 38, 880, 198);
    values.forEach((ok, index) => {
      const x = 210 + index * 215;
      ctx.fillStyle = ok ? COLORS.green : COLORS.red;
      ctx.strokeStyle = ok ? COLORS.green : COLORS.red;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(x - 56, 95, 112, 86, 18);
      ctx.globalAlpha = ok ? 0.2 : 0.13;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      label(ctx, ok ? '✓' : '×', x - 9, 148, ok ? COLORS.green : COLORS.red, 30);
      label(ctx, names[index], x - 30, 215, COLORS.text, 17);
    });
  }, [method]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        {(Object.keys(criteria) as Method[]).map((item) => (
          <button key={item} className={chipClass(method === item)} onClick={() => setMethod(item)}>{item}</button>
        ))}
      </div>
      <div className={feedbackClass(method === 'VideoRoPE' ? 'good' : 'bad')}>
        {method === 'VideoRoPE' ? 'VideoRoPE 是表 1 中唯一同时满足四项要求的方法。' : `${method} 仍缺少 ${names.filter((_, i) => !values[i]).join('、')}。`}
      </div>
    </div>
  );
};

export const VNIAHDistractor: React.FC<WidgetProps> = () => {
  const [difficulty, setDifficulty] = useState<'V-NIAH' | 'V-NIAH-D'>('V-NIAH-D');
  const [selected, setSelected] = useState<number | null>(null);
  const needle = 6;
  const distractors = difficulty === 'V-NIAH-D' ? [2, 4, 8, 10] : [];
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 45, 28, 990, 365);
    ctx.fillStyle = COLORS.blue;
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.roundRect(76, 58, 928, 64, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    label(ctx, '问题：气球颜色？', 102, 98, COLORS.text, 18);
    for (let i = 0; i < 12; i++) {
      const x = 75 + i * 78;
      const isNeedle = i === needle;
      const isDistractor = distractors.includes(i);
      const isSelected = selected === i;
      ctx.fillStyle = COLORS.white;
      ctx.globalAlpha = isSelected ? 1 : 0.92;
      ctx.fillRect(x, 158, 62, 112);
      ctx.fillStyle = isNeedle ? COLORS.green : isDistractor ? COLORS.red : i % 2 ? COLORS.light : COLORS.dark;
      ctx.globalAlpha = isSelected ? 0.95 : 0.55;
      ctx.fillRect(x + 6, 166, 50, 74);
      ctx.fillStyle = isNeedle || isDistractor ? COLORS.orange : COLORS.blue;
      ctx.beginPath();
      ctx.arc(x + 31, 192 + (i % 3) * 6, isNeedle || isDistractor ? 12 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isSelected ? COLORS.orange : isNeedle && selected !== null ? COLORS.green : COLORS.line;
      ctx.lineWidth = isSelected ? 6 : 2;
      ctx.strokeRect(x, 158, 62, 112);
      label(ctx, `${900 + i * 100}`, x + 12, 260, COLORS.muted, 13);
    }
    label(ctx, difficulty, 456, 145, COLORS.blue, 20);
    label(ctx, '每格 100 帧；干扰示例间隔 200 帧', 555, 145, COLORS.muted, 15);
    if (selected !== null) {
      const result = selected === needle ? '命中真正针帧' : distractors.includes(selected) ? '选中了相似干扰帧' : '选中了背景帧';
      label(ctx, result, 395, 355, selected === needle ? COLORS.green : COLORS.red, 18);
    } else {
      label(ctx, '点击候选帧', 458, 350, COLORS.muted, 18);
    }
  }, [difficulty, selected]);
  const correct = selected === needle;
  return (
    <div>
      <canvas
        ref={ref}
        width={CW}
        height={TECH_H}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * CW;
          setSelected(Math.max(0, Math.min(11, Math.floor((x - 75) / 78))));
        }}
      />
      <div className="ctrl">
        {(['V-NIAH', 'V-NIAH-D'] as const).map((item) => (
          <button key={item} className={chipClass(difficulty === item)} onClick={() => { setDifficulty(item); setSelected(null); }}>{item}</button>
        ))}
        <label>候选帧 {selected == null ? '未选择' : 900 + selected * 100}
          <input type="range" min="0" max="11" value={selected ?? 0} onChange={(e) => setSelected(Number(e.target.value))} />
        </label>
      </div>
      <div className={feedbackClass(selected == null ? 'neutral' : correct ? 'good' : 'bad')}>
        {selected == null ? '点击一帧寻找真正的针。示意图每格代表 100 帧；论文评测的草堆长度最高为 3,000 帧，干扰帧按 200 帧周期插入。' : correct ? '命中真正的针：语义和时间位置都对齐。' : distractors.includes(selected) ? '这是语义相似的干扰帧；V-NIAH-D 正是用它暴露周期碰撞。' : '这不是目标帧，继续比较。'}
      </div>
    </div>
  );
};

export const VNIAHPath: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const stages = ['问题', '候选帧', '时间通道', '答案'];
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 80, 45, 920, 190);
    stages.forEach((_, index) => {
      const x = 190 + index * 235;
      ctx.fillStyle = index < step ? COLORS.green : index === step ? COLORS.blue : COLORS.light;
      ctx.beginPath();
      ctx.arc(x, 140, 30, 0, Math.PI * 2);
      ctx.fill();
      if (index < stages.length - 1) {
        ctx.strokeStyle = index < step ? COLORS.green : COLORS.line;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 34, 140);
        ctx.lineTo(x + 200, 140);
        ctx.stroke();
      }
      label(ctx, stages[index], x - 35, 205, COLORS.text, 16);
    });
  }, [step]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</button>
        <span className="val">{step + 1} / 4</span>
        <button onClick={() => setStep(Math.min(3, step + 1))} disabled={step === 3}>下一步</button>
      </div>
      <div className={feedbackClass(step === 3 ? 'good' : 'neutral')}>
        {['先读问题，确定要找的视觉事实。', '在长视频中形成候选帧集合。', '关键检验：时间维是否能跨远距离定位，而不是依赖空间维。', '定位与语义一致时，才能稳定回答。'][step]}
      </div>
    </div>
  );
};

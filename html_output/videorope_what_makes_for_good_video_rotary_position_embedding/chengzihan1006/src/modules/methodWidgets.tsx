import React, { useMemo, useState } from 'react';
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

type Allocation = 'M-RoPE' | 'VideoRoPE';
const ROPE_BASE = 1_000_000;

function axisForPair(method: Allocation, n: number) {
  if (method === 'M-RoPE') return n < 16 ? 't' : n < 40 ? 'x' : 'y';
  if (n >= 48) return 't';
  return n % 2 === 0 ? 'x' : 'y';
}

function axisColor(axis: 't' | 'x' | 'y') {
  return axis === 't' ? COLORS.orange : axis === 'x' ? COLORS.blue : COLORS.green;
}

export const FrequencyAllocation: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Allocation>('VideoRoPE');
  const [selected, setSelected] = useState(48);
  const axis = axisForPair(method, selected);
  const frequency = Math.pow(ROPE_BASE, (-2 * selected) / 128);
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 38, 26, 1004, 368);
    const methods: Allocation[] = ['M-RoPE', 'VideoRoPE'];
    const startX = 155;
    const cellW = 12.8;
    methods.forEach((rowMethod, row) => {
      const y = 86 + row * 104;
      label(ctx, rowMethod, 58, y + 31, rowMethod === method ? COLORS.blue : COLORS.muted, 18);
      for (let n = 0; n < 64; n++) {
        const a = axisForPair(rowMethod, n);
        const x = startX + n * cellW;
        ctx.fillStyle = axisColor(a);
        ctx.globalAlpha = rowMethod === method ? 0.82 : 0.38;
        ctx.fillRect(x, y, cellW - 1.5, 54);
        if (rowMethod === method && n === selected) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = COLORS.text;
          ctx.lineWidth = 4;
          ctx.strokeRect(x - 3, y - 5, cellW + 4.5, 64);
        }
      }
    });
    ctx.globalAlpha = 1;
    label(ctx, '高频', 150, 62, COLORS.red, 16);
    label(ctx, '低频', 918, 62, COLORS.green, 16);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(155, 292);
    ctx.lineTo(974, 292);
    ctx.stroke();
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let n = 0; n < 64; n++) {
      const x = startX + n * cellW;
      const f = Math.pow(ROPE_BASE, (-2 * n) / 128);
      const y = 360 - Math.log10(f + 1e-9) * -17;
      if (n === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const markerX = startX + selected * cellW;
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(markerX, 278);
    ctx.lineTo(markerX, 372);
    ctx.stroke();
    label(ctx, `θ${selected}`, 58, 336, COLORS.orange, 22);
    label(ctx, frequency.toExponential(2), 58, 368, axisColor(axis), 17);
  }, [method, selected]);
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
          const y = ((e.clientY - rect.top) / rect.height) * TECH_H;
          const rowMethod: Allocation | null = y >= 80 && y <= 150 ? 'M-RoPE' : y >= 184 && y <= 254 ? 'VideoRoPE' : null;
          const n = Math.round((x - 155) / 12.8);
          if (rowMethod && n >= 0 && n < 64) {
            setMethod(rowMethod);
            setSelected(n);
          }
        }}
      />
      <div className="ctrl">
        {(['M-RoPE', 'VideoRoPE'] as const).map((item) => (
          <button key={item} className={chipClass(method === item)} onClick={() => { setMethod(item); setSelected(item === 'M-RoPE' ? 0 : 48); }}>{item}</button>
        ))}
        <label>角度索引 n = {selected}
          <input type="range" min="0" max="63" value={selected} onChange={(e) => setSelected(Number(e.target.value))} />
        </label>
        <span className="val">{axis} · θ={frequency.toExponential(2)}</span>
      </div>
      <div className={feedbackClass(method === 'VideoRoPE' ? 'good' : 'bad')}>
        {method === 'M-RoPE'
          ? 'M-RoPE 把时间放在 θ₀–θ₁₅：低索引意味着高频、较短单调区间。'
          : 'VideoRoPE 把时间移到 θ₄₈–θ₆₃，并交错分配 θ₀–θ₄₇ 给 x/y；基础频率公式没有改变。'}
      </div>
    </div>
  );
};

export const PhaseCollision: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Allocation>('M-RoPE');
  const [distance, setDistance] = useState(180);
  const indices = useMemo(() => method === 'M-RoPE' ? Array.from({ length: 16 }, (_, i) => i) : Array.from({ length: 16 }, (_, i) => 48 + i), [method]);
  const similarity = indices.reduce((sum, n) => sum + Math.cos(distance * Math.pow(ROPE_BASE, (-2 * n) / 128)), 0) / indices.length;
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    const groups: { name: Allocation; x: number; color: string; start: number }[] = [
      { name: 'M-RoPE', x: 55, color: COLORS.red, start: 0 },
      { name: 'VideoRoPE', x: 555, color: COLORS.green, start: 48 },
    ];
    groups.forEach((group) => {
      panel(ctx, group.x, 34, 470, 300);
      label(ctx, group.name, group.x + 24, 68, group.name === method ? COLORS.blue : COLORS.muted, 19);
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(group.x + 30, 192);
      ctx.lineTo(group.x + 440, 192);
      ctx.stroke();
      [0, 1, 2, 3].forEach((offset) => {
        const n = group.start + offset;
        ctx.strokeStyle = [group.color, COLORS.orange, COLORS.blue, COLORS.purple][offset];
        ctx.lineWidth = group.name === method ? 3 : 2;
        ctx.globalAlpha = group.name === method ? 0.95 : 0.42;
        ctx.beginPath();
        for (let px = 0; px <= 390; px += 3) {
          const delta = (px / 390) * 400;
          const y = 192 - Math.cos(delta * Math.pow(ROPE_BASE, (-2 * n) / 128)) * 88;
          if (px === 0) ctx.moveTo(group.x + 40 + px, y);
          else ctx.lineTo(group.x + 40 + px, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      const markerX = group.x + 40 + (distance / 400) * 390;
      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = group.name === method ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(markerX, 88);
      ctx.lineTo(markerX, 288);
      ctx.stroke();
    });
    const gauge = Math.max(0, Math.min(1, (similarity + 1) / 2));
    ctx.fillStyle = COLORS.line;
    ctx.fillRect(185, 365, 710, 18);
    ctx.fillStyle = Math.abs(similarity) > 0.65 ? COLORS.red : COLORS.green;
    ctx.fillRect(185, 365, 710 * gauge, 18);
    label(ctx, '相位相似度', 58, 382, COLORS.text, 17);
    label(ctx, similarity.toFixed(2), 922, 382, Math.abs(similarity) > 0.65 ? COLORS.red : COLORS.green, 18);
  }, [method, distance, similarity]);
  const risk = method === 'M-RoPE' && Math.abs(similarity) > 0.35;
  return (
    <div>
      <canvas ref={ref} width={CW} height={TECH_H} />
      <div className="ctrl">
        {(['M-RoPE', 'VideoRoPE'] as const).map((item) => <button key={item} className={chipClass(method === item)} onClick={() => setMethod(item)}>{item}</button>)}
        <label>距离 <span className="val">{distance}</span></label>
        <input type="range" min="0" max="400" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
      </div>
      <div className={feedbackClass(risk ? 'bad' : method === 'VideoRoPE' ? 'good' : 'neutral')}>
        {method === 'M-RoPE' ? '高频时间角在长距离内反复振荡，某些远位置会重新获得相似相位。' : '后 16 个低频时间角变化更慢，在同一距离范围内保持更宽的单调区间。'}
      </div>
    </div>
  );
};

export const DiagonalLayout: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'M-RoPE' | 'VideoRoPE'>('M-RoPE');
  const [corner, setCorner] = useState(0);
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 45, 28, 990, 365);
    const centered = mode === 'VideoRoPE';
    const ox = 450;
    const oy = 82;
    const step = 52;
    const cell = 44;
    const anchorX = ox + (centered ? 2 * step : 0) + cell / 2;
    const anchorY = oy + (centered ? 2 * step : 0) + cell / 2;

    ctx.strokeStyle = centered ? COLORS.green : COLORS.red;
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(anchorX - 58, anchorY - 58);
    ctx.lineTo(anchorX + 58, anchorY + 58);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = ox + c * step;
        const y = oy + r * step;
        const selected = corner === 0 ? c === 0 && r === 0 : c === 4 && r === 4;
        const middle = c === 2 && r === 2;
        ctx.fillStyle = selected ? COLORS.orange : middle ? COLORS.green : COLORS.blue;
        ctx.globalAlpha = selected || middle ? 0.95 : 0.42;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = selected ? COLORS.text : COLORS.line;
        ctx.lineWidth = selected ? 4 : 1;
        ctx.strokeRect(x, y, cell, cell);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = centered ? COLORS.green : COLORS.red;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 9, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, centered ? 'VideoRoPE：对角居中' : 'M-RoPE：角点堆叠', 72, 88, centered ? COLORS.green : COLORS.red, 24);
    label(ctx, centered ? '帧中心约在 (t,t,t)' : '帧左上角从 (t,t,t) 起', 72, 137, COLORS.text, 19);
    label(ctx, centered ? '补丁沿 x/y 两侧展开' : '补丁沿 x/y 正方向铺开', 72, 178, COLORS.text, 18);
    label(ctx, corner === 0 ? '观察：左上角' : '观察：右下角', 72, 225, COLORS.orange, 18);
    label(ctx, '虚线：当前帧对应的文字对角线', 72, 282, COLORS.muted, 16);
    label(ctx, '绿色：帧中心　橙色：观察角点', 72, 320, COLORS.muted, 16);
  }, [mode, corner]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={TECH_H} />
      <div className="ctrl">
        {(['M-RoPE', 'VideoRoPE'] as const).map((item) => <button key={item} className={chipClass(mode === item)} onClick={() => setMode(item)}>{item === 'M-RoPE' ? 'M-RoPE 角点布局' : 'VideoRoPE 对角布局'}</button>)}
        <button onClick={() => setCorner(corner === 0 ? 1 : 0)}>切换观察角点</button>
      </div>
      <div className={feedbackClass(mode === 'VideoRoPE' ? 'good' : 'bad')}>
        {mode === 'VideoRoPE' ? 'VideoRoPE 让视觉补丁围绕帧中心展开，文本位置的对角轨迹经过帧中心，改善视觉区域与前后文本的相对位置对称性。' : 'M-RoPE 从帧角点向同一方向铺开补丁，文本位置的对角轨迹靠近角点，视觉区域与前后文本的位置关系不平衡。'}
      </div>
    </div>
  );
};

export const TemporalSpacing: React.FC<WidgetProps> = () => {
  const [delta, setDelta] = useState(2);
  const ref = useSizedStaticCanvas(CW, TECH_H, (ctx) => {
    clearSized(ctx, CW, TECH_H);
    panel(ctx, 45, 28, 990, 365);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(75, 265);
    ctx.lineTo(1005, 265);
    ctx.stroke();
    const start = 300;
    [0, 1, 2, 3].forEach((frame) => {
      const x = start + frame * 52 * delta;
      ctx.fillStyle = COLORS.white;
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      ctx.fillRect(x, 112, 70, 104);
      ctx.strokeRect(x, 112, 70, 104);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = row === 1 && col === 1 ? COLORS.orange : COLORS.light;
          ctx.fillRect(x + 9 + col * 18, 128 + row * 21, 14, 16);
        }
      }
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 35, 218);
      ctx.lineTo(x + 35, 276);
      ctx.stroke();
      label(ctx, `${(frame * delta).toFixed(delta % 1 ? 1 : 0)}`, x + 25, 305, COLORS.orange, 16);
    });
    ctx.fillStyle = COLORS.light;
    ctx.fillRect(72, 130, 145, 58);
    ctx.fillRect(865, 130, 140, 58);
    label(ctx, '前置文本', 95, 166, COLORS.text, 17);
    label(ctx, '后置文本', 884, 166, COLORS.text, 17);
    label(ctx, `δ=${delta}`, 500, 78, COLORS.orange, 24);
    label(ctx, '时间索引', 72, 305, COLORS.muted, 16);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(335, 345);
    ctx.lineTo(635, 345);
    ctx.stroke();
    label(ctx, 'w/h不变', 830, 352, COLORS.green, 16);
  }, [delta]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={TECH_H} />
      <div className="ctrl">
        {[0.5, 1, 2, 3].map((item) => <button key={item} className={chipClass(delta === item)} onClick={() => setDelta(item)}>δ = {item}</button>)}
      </div>
      <div className={feedbackClass(delta === 2 ? 'good' : 'neutral')}>
        ATS 用 δ 缩放相邻视觉时间索引；空间补丁仍由 w、h 定位。论文附录 Table 6 比较 δ=0.5、1、2、3，其中 δ=2 的三项基准平均分最高，为 60.92。
      </div>
    </div>
  );
};

export const VideoRopeAssembler: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState({ lta: false, dl: false, ats: false });
  const count = Number(active.lta) + Number(active.dl) + Number(active.ats);
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 55, 35, 970, 205);
    const items = [
      { key: 'lta', x: 235, color: COLORS.orange },
      { key: 'dl', x: 540, color: COLORS.green },
      { key: 'ats', x: 845, color: COLORS.purple },
    ] as const;
    items.forEach((item, index) => {
      const on = active[item.key];
      ctx.fillStyle = on ? item.color : COLORS.light;
      ctx.strokeStyle = on ? COLORS.text : COLORS.line;
      ctx.lineWidth = on ? 5 : 2;
      ctx.beginPath();
      ctx.arc(item.x, 128, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (index < 2) {
        ctx.strokeStyle = active[items[index + 1].key] && on ? COLORS.green : COLORS.line;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(item.x + 62, 128);
        ctx.lineTo(items[index + 1].x - 62, 128);
        ctx.stroke();
      }
      label(ctx, item.key.toUpperCase(), item.x - 22, 136, on ? COLORS.white : COLORS.muted, 18);
    });
  }, [active]);
  const toggle = (key: keyof typeof active) => setActive({ ...active, [key]: !active[key] });
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        {(['lta', 'dl', 'ats'] as const).map((key) => <button key={key} className={chipClass(active[key])} onClick={() => toggle(key)}>{key.toUpperCase()}</button>)}
      </div>
      <div className={feedbackClass(count === 3 ? 'good' : count === 0 ? 'bad' : 'neutral')}>
        {count === 3 ? '完整 VideoRoPE：LTA 分配低频时间与交错空间维，DL 让补丁围绕帧中心对角布局，ATS 调整时间尺度。' : `已启用 ${count}/3 个机制；仍有性质没有被满足。`}
      </div>
    </div>
  );
};

export const ConfigGuard: React.FC<WidgetProps> = () => {
  const [temporal, setTemporal] = useState<'高频' | '低频'>('低频');
  const [layout, setLayout] = useState<'角点堆叠' | '对角居中'>('对角居中');
  const [spacing, setSpacing] = useState<'固定' | '可调'>('可调');
  const score = Number(temporal === '低频') + Number(layout === '对角居中') + Number(spacing === '可调');
  const ref = useStaticCanvas((ctx) => {
    clear(ctx);
    panel(ctx, 55, 35, 970, 205);
    [temporal === '低频' ? '低频+交错' : '高频时间', layout, spacing === '可调' ? '可调间隔' : '固定间隔'].forEach((value, index) => {
      const good = [temporal === '低频', layout === '对角居中', spacing === '可调'][index];
      const x = 220 + index * 320;
      ctx.fillStyle = good ? COLORS.green : COLORS.red;
      ctx.beginPath();
      ctx.roundRect(x - 94, 88, 188, 92, 18);
      ctx.fill();
      label(ctx, value, x - 30, 143, COLORS.white, 22);
    });
    label(ctx, `${score}/3`, 505, 220, score === 3 ? COLORS.green : COLORS.red, 22);
  }, [temporal, layout, spacing, score]);
  return (
    <div>
      <canvas ref={ref} width={CW} height={CH} />
      <div className="ctrl">
        <button onClick={() => setTemporal(temporal === '低频' ? '高频' : '低频')}>LTA：{temporal === '低频' ? '低频时间与交错空间维' : '高频时间'}</button>
        <button onClick={() => setLayout(layout === '对角居中' ? '角点堆叠' : '对角居中')}>DL：{layout}</button>
        <button onClick={() => setSpacing(spacing === '可调' ? '固定' : '可调')}>ATS：{spacing}间隔</button>
      </div>
      <div className={feedbackClass(score === 3 ? 'good' : 'bad')}>
        {score === 3 ? '这是论文的完整组合：LTA 分配低频时间与交错空间维，DL 对角居中，ATS 调节时间间隔。' : '当前组合缺少低频时间与交错空间维、对角居中布局或可调时间间隔中的至少一项。'}
      </div>
    </div>
  );
};

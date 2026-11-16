import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 800;
const H = 560;
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';

type Method = 'ewc' | 'gem' | 'er';

const OLD = { x: 0, y: -1 }; // 旧任务梯度：朝上
const NEW = { x: Math.cos((205 * Math.PI) / 180), y: Math.sin((205 * Math.PI) / 180) }; // 冲突的新梯度

function vec(m: Method) {
  if (m === 'ewc') return { x: NEW.x, y: 0 }; // 去掉向上的分量
  if (m === 'gem') return { x: NEW.x, y: 0 }; // 投影到 dot=0
  const nx = NEW.x + OLD.x, ny = NEW.y + OLD.y; // 回放：新旧平均
  const n = Math.hypot(nx, ny);
  return { x: nx / n, y: ny / n };
}

const INFO: Record<Method, { name: string; color: string; title: string; desc: string; dot: string }> = {
  ewc: { name: 'EWC', color: PURPLE, title: '钉住旧任务重要的参数', desc: '按 Fisher 信息给参数加惩罚，把新梯度里指向旧任务的分量压掉。本质是「减少共享」——只防向后干扰，不留未来迁移。', dot: '0.00' },
  gem: { name: 'GEM', color: BLUE, title: '投影掉冲突分量', desc: '解二次规划，找离原梯度最近、且与旧记忆点积 ≥ 0 的方向（Eq.8）。逐样本临时修正，没学到可泛化的「怎么改」。', dot: '0.00' },
  er: { name: '经验回放', color: GREEN, title: '补旧样本，新旧一起平均', desc: '不改梯度，而是把旧样本穿插进来，等效更新接近新旧梯度平均——已经带出一点迁移，这正是消融里 ER 强于 GEM 的原因。', dot: '0.58' },
};

export function MerBaselines() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Method>('ewc');

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    const cx = 300, cy = 290, r = 150;

    ctx.strokeStyle = '#eef2f7';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(cx - r - 30, cy);
    ctx.lineTo(cx + r + 30, cy);
    ctx.moveTo(cx, cy - r - 30);
    ctx.lineTo(cx, cy + r + 30);
    ctx.stroke();

    const drawArrow = (v: { x: number; y: number }, color: string, label: string, dash: boolean) => {
      const px = cx + v.x * r, py = cy + v.y * r;
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.setLineDash(dash ? [10, 8] : []);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(v.y, v.x);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 16 * Math.cos(ang - 0.4), py - 16 * Math.sin(ang - 0.4));
      ctx.lineTo(px - 16 * Math.cos(ang + 0.4), py - 16 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 20px "Segoe UI", "PingFang SC", sans-serif';
      // 根据角度调整标签位置，避免重叠
      const labelDist = dash ? r + 50 : r + 30; // 虚线箭头标签更远
      const labelOffsetY = dash ? 20 : 8; // 虚线箭头标签往下偏移
      ctx.fillText(label, cx + labelDist * Math.cos(ang) - 16, cy + labelDist * Math.sin(ang) + labelOffsetY);
    };

    drawArrow(OLD, RED, '旧任务 ∂L_old', false);
    drawArrow(NEW, ORANGE, '新任务 ∂L_new', true);

    const v = vec(m);
    drawArrow(v, INFO[m].color, INFO[m].name, false);

    // padlock for EWC
    if (m === 'ewc') {
      ctx.fillStyle = PURPLE;
      ctx.font = '26px "Segoe UI", sans-serif';
      ctx.fillText('🔒 锁住', cx + r * 0.2, cy - r - 22);
    }
    if (m === 'gem') {
      // right-angle projection marker
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(cx + NEW.x * r, cy + NEW.y * r);
      ctx.lineTo(cx + NEW.x * r, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (m === 'er') {
      ctx.fillStyle = GREEN;
      ctx.font = '26px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('旧样本也在场', cx - 90, cy + r + 40);
    }
  }, [m]);

  const info = INFO[m];

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {(Object.keys(INFO) as Method[]).map(k => (
            <button key={k} onClick={() => setM(k)}
              style={{ fontSize: 24, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${INFO[k].color}`, background: m === k ? INFO[k].color : '#fff', color: m === k ? '#fff' : INK, fontWeight: 700 }}>
              {INFO[k].name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 34, color: info.color, fontWeight: 700 }}>{info.title}</div>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, lineHeight: 1.5 }}>{info.desc}</p>
        <div style={{ fontSize: 26, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 12 }}>
          改造后与旧任务梯度点积 = <b style={{ color: info.dot === '0.00' ? BLUE : GREEN, fontFamily: 'Consolas, monospace' }}>{info.dot}</b>：{info.dot === '0.00' ? '不再干扰，但也没有迁移。' : '已经带出迁移。'}
        </div>
        <div style={{ fontSize: 24, color: RED }}>共同局限：三者都只盯着「向后干扰」，没有学会「以后何时共享参数」——这是 MER 要补上的。</div>
      </div>
    </div>
  );
}

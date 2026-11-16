import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Pill } from './kit';

// A deliberately simple latency budget: one observation -> one inference ->
// one action. It is a teaching model, not a benchmark of the paper's cluster.
export const LatencyBudget: React.FC<WidgetProps> = () => {
  const [size, setSize] = useState<'5B' | '55B'>('55B');
  const [rtt, setRtt] = useState(40);
  const [infer, setInfer] = useState(360);
  const [overhead, setOverhead] = useState(30);

  const total = rtt + infer + overhead;
  const hz = 1000 / total;
  const color = hz < 1 ? PAL.red : hz < 3 ? PAL.orange : hz < 5 ? PAL.green : PAL.blue;
  const advises = useMemo(() => {
    if (hz < 1) return '低于 1 Hz：一次动作要等一秒以上，闭环会明显滞后。';
    if (hz < 3) return '1–3 Hz：接近论文中 55B 云端多 TPU 的区间，适合慢速桌面任务。';
    if (hz < 5) return '3–5 Hz：已经好于 55B 的常见区间，接近 5B 的响应水平。';
    return '5 Hz 以上：接近论文中 5B 模型的量级，但真实系统还受感知与执行器限制。';
  }, [hz]);

  const segs = [
    { label: '网络往返', value: rtt, color: PAL.purple },
    { label: '模型推理', value: infer, color: PAL.blue },
    { label: '控制开销', value: overhead, color: PAL.orange },
  ];
  const barX = 40;
  const barW = 700;
  const scale = barW / total;
  let cursor = barX + 314;

  return (
    <div>
      <Svg w={1080} h={292} label="模型规模、网络延迟与推理时间如何决定控制频率">
        <Card x={18} y={12} w={300} h={126} color={color} title="控制回路频率" active>
          <T x={36} y={72} size={11} color={PAL.muted}>一次“看 → 想 → 动”的总周期</T>
          <T x={36} y={116} size={38} color={color} weight={700}>{hz.toFixed(1)}</T>
          <T x={128} y={116} size={15} color={color} weight={600}>Hz</T>
          <T x={36} y={132} size={11} color={PAL.muted}>每拍 {(total / 1000).toFixed(2)} 秒</T>
        </Card>

        <Card x={336} y={12} w={726} h={126} color={PAL.purple} title="延迟预算">
          <T x={354} y={64} size={11} color={PAL.muted}>把 1000 ms 切成三段：网络 + 推理 + 控制</T>
          <rect x={barX + 314} y={76} width={barW} height={22} rx={6} fill="#f4f7fc" stroke={PAL.line} />
          {segs.map((s) => {
            const w = Math.max(2, s.value * scale);
            const x = cursor;
            cursor += w;
            return (
              <g key={s.label}>
                <rect x={x} y={82} width={w} height={22} rx={4} fill={s.color} opacity={0.88} />
                {w > 58 && <T x={x + w / 2} y={98} size={10} color="#fff" anchor="middle" weight={600}>{s.value} ms</T>}
              </g>
            );
          })}
          <T x={barX + 314} y={116} size={11} color={PAL.muted}>0 ms</T>
          <T x={barX + 1014} y={116} size={11} color={PAL.muted} anchor="end">{total} ms</T>
        </Card>

        <Card x={18} y={152} w={504} h={124} color={PAL.blue} title="论文里的两个锚点">
          <Pill x={36} y={188} w={110} h={24} label="55B · 1–3 Hz" color={PAL.orange} size={10} />
          <Pill x={156} y={188} w={102} h={24} label="5B · 约 5 Hz" color={PAL.green} size={10} />
          <T x={36} y={238} size={11} color={PAL.ink}>55B 需要多 TPU 云端服务；5B 可在本地或单机运行。</T>
          <T x={36} y={258} size={11} color={PAL.muted}>频率越低，单步动作幅度通常要越小，否则闭环会抖。</T>
        </Card>

        <Card x={540} y={152} w={522} h={124} color={color} title="现在的设置">
          <T x={558} y={194} size={12} color={PAL.ink}>网络 {rtt} ms + 推理 {infer} ms + 开销 {overhead} ms</T>
          <T x={558} y={224} size={12} color={color} weight={600}>{advises}</T>
          <T x={558} y={258} size={11} color={PAL.muted}>拖动下面的滑杆，观察频率如何被最慢的一段拖住。</T>
        </Card>
      </Svg>

      <div className="rt2-controls" style={{ gap: 6 }}>
        <button className={`rt2-btn ${size === '5B' ? 'is-active' : ''}`} onClick={() => { setSize('5B'); setInfer(150); }}>5B 模型</button>
        <button className={`rt2-btn is-green ${size === '55B' ? 'is-active' : ''}`} onClick={() => { setSize('55B'); setInfer(360); }}>55B 模型</button>
        <span style={{ width: 12 }} />
        <span style={{ fontSize: 12, color: 'var(--rt2-muted)' }}>当前：{size}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 26px', maxWidth: 900, margin: '10px auto 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--rt2-muted)' }}>
          网络往返
          <input aria-label="网络往返延迟" type="range" min={5} max={220} step={5} value={rtt} onChange={(e) => setRtt(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--rt2-purple)' }} />
          <b style={{ width: 54, textAlign: 'right', color: 'var(--rt2-ink)' }}>{rtt} ms</b>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--rt2-muted)' }}>
          模型推理
          <input aria-label="模型推理时间" type="range" min={80} max={800} step={10} value={infer} onChange={(e) => setInfer(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--rt2-blue)' }} />
          <b style={{ width: 54, textAlign: 'right', color: 'var(--rt2-ink)' }}>{infer} ms</b>
        </label>
      </div>
      <div style={{ maxWidth: 900, margin: '6px auto 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--rt2-muted)' }}>
          控制与通信开销
          <input aria-label="控制开销" type="range" min={5} max={120} step={5} value={overhead} onChange={(e) => setOverhead(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--rt2-orange)' }} />
          <b style={{ width: 54, textAlign: 'right', color: 'var(--rt2-ink)' }}>{overhead} ms</b>
        </label>
      </div>
      <p className="rt2-note">
        <b>为什么强调频率：</b>机器人每一步都要“看到结果再改下一步”。延迟越长，单步越要保守，任务耗时也越长。
      </p>
    </div>
  );
};

export default LatencyBudget;

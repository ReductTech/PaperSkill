import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useReducedMotion, useTween } from '../lib/hooks';
import { Btn, Feedback, Seg } from '../ui/kit';
import { EFFICIENCY } from '../data/tutorial';
import { METHOD_COLOR } from '../lib/palette';

// 9.2 四种指标：理论 TFLOPs / 预填充 / 端到端 / 显存（Table 2 实测）。
// 时间类指标可“开跑”：跑道进度与实测时间成正比；深色段为预填充。

type Metric = 'e2e' | 'prefill' | 'tflop' | 'mem';
const LABEL: Record<Metric, string> = { e2e: '端到端延迟（s）', prefill: '预填充时间（s）', tflop: '理论 TFLOPs', mem: '显存峰值（GB）' };
const RACE_MS = 3200;

function Val({ v, d }: { v: number; d: number }) {
  const t = useTween(v, 360);
  return <>{t.toFixed(d)}</>;
}

export const Ch9Race: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<Metric>('e2e');
  const [t, setT] = useState(1); // 0..1 比赛进度（以最慢者为 1）
  const [running, setRunning] = useState(false);
  const reduced = useReducedMotion();
  const raf = useRef(0);
  const timed = metric === 'e2e' || metric === 'prefill';
  const vals = EFFICIENCY.map((e) => e[metric]);
  const max = Math.max(...vals);
  const orig = EFFICIENCY[0][metric];

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setT(1);
  }, [metric]);

  const run = () => {
    if (reduced) {
      setT(1);
      return;
    }
    cancelAnimationFrame(raf.current);
    setRunning(true);
    const t0 = performance.now();
    const loop = (now: number) => {
      const k = Math.min(1, (now - t0) / RACE_MS);
      setT(k);
      if (k < 1) raf.current = requestAnimationFrame(loop);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(loop);
  };

  const d = metric === 'tflop' ? 3 : metric === 'mem' ? 2 : metric === 'prefill' ? 3 : 2;
  const ours = EFFICIENCY[3];
  const fb: Record<Metric, string> = {
    e2e: `DivPrune ${ours.e2e} s，比原模型 ${orig} s 快约 ${(orig / ours.e2e).toFixed(2)}×（少 ${((1 - ours.e2e / orig) * 100).toFixed(1)}%）；比 VTW、FastV 分别快 ${((1 - ours.e2e / 3.43) * 100).toFixed(1)}% 和 ${((1 - ours.e2e / 3.63) * 100).toFixed(1)}%。可它的理论 TFLOPs 只剩 14.10%——端到端时间里还有视觉编码、逐词解码、调度开销，而且受答案长度影响（论文未报告各方法的输出长度）。`,
    prefill: `预填充：原模型 ${orig} s → DivPrune ${ours.prefill} s，约 ${(orig / ours.prefill).toFixed(2)}×（少 ${((1 - ours.prefill / orig) * 100).toFixed(1)}%；正文写“约 55%”，与表不符）。FastV、VTW 都是 0.150 s，比 DivPrune 快约 11 ms——这是 DivPrune 自身的距离计算与 56 轮串行贪心的开销。`,
    tflop: `理论 TFLOPs：DivPrune 0.937，只有原模型 6.539 的 14.10%（理论上约 7.0×）。这是 Eq. (5) 的估算，只覆盖 LLM 解码层的预填充，不能直接当作速度。`,
    mem: `显存峰值：14.06 → 13.51 GB，只少 0.55 GB（约 3.9%；正文写“约 400MB”，与表不符）。batch = 1 时，7B 模型的权重本身就占了 13–14 GB（本页估算），视觉 token 的 KV cache 只是很小一部分。`,
  };

  return (
    <div className="w">
      <div className="ctl-row">
        <Seg label="指标" options={(Object.keys(LABEL) as Metric[]).map((m) => ({ value: m, label: LABEL[m] }))} value={metric} onChange={setMetric} />
        {timed ? (
          <Btn primary onClick={run} disabled={running}>
            {running ? '比赛中…' : '▶ 开跑'}
          </Btn>
        ) : null}
      </div>
      <div className="race" role="img" aria-label={`${LABEL[metric]}：${EFFICIENCY.map((e) => `${e.method} ${e[metric]}`).join('，')}`}>
        {EFFICIENCY.map((e) => {
          const v = e[metric];
          const frac = v / max;
          let fill = frac;
          if (timed) fill = Math.min(frac, t); // 每条跑道以同样速度前进，用时越短越早到终点
          const done = timed ? t >= frac - 1e-6 : true;
          const pre = metric === 'e2e' ? e.prefill / max : 0;
          return (
            <div className={`lane ${e.method === 'DivPrune' ? 'is-ours' : ''}`} key={e.method}>
              <span className="lane-k">
                <i className="dot" style={{ background: METHOD_COLOR[e.method] }} />
                {e.method}
              </span>
              <div className="lane-track">
                <div className="lane-fill" style={{ transform: `scaleX(${fill})`, background: METHOD_COLOR[e.method] }} />
                {metric === 'e2e' ? <div className="lane-pre" style={{ transform: `scaleX(${Math.min(pre, fill)})` }} /> : null}
                {timed ? <div className="lane-goal" style={{ left: `${frac * 100}%` }} aria-hidden="true" /> : null}
              </div>
              <span className="lane-v">
                {done ? <Val v={v} d={d} /> : '…'}
                {done && e.method !== '原模型' ? (
                  <em>{metric === 'e2e' || metric === 'prefill' ? ` ${(orig / v).toFixed(2)}×` : metric === 'tflop' ? ` ${e.ratio}%` : ` −${(orig - v).toFixed(2)}`}</em>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
      {metric === 'e2e' ? <p className="w-note">跑道中较深的一段 = 预填充时间；其余是逐词解码等时间。所有数值取自 Table 2（LLaVA-NeXT-Video-7B，VideoChatGPT 499 个样本平均，8 × V100，batch = 1）。</p> : null}
      <Feedback tone={metric === 'tflop' ? 'warn' : 'info'}>{fb[metric]}</Feedback>
    </div>
  );
};

export default Ch9Race;

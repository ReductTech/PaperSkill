import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch10.1 — evaluation results AND protocols in one module (P4 chips).
// Selecting a task shows its dataset / dimensions / metric / direction AND a
// result bar comparing MOSS-Audio with a baseline (paper §6).
const W = 1080;
const H = 280;

type Key = 'mmau' | 'caption' | 'asr' | 'tsasr';

const M: Record<Key, {
  name: string; datasets: string; dims: string; metric: string; dir: string;
  moss: number; base: number; baseName: string; unit: string; lower: boolean;
}> = {
  mmau: {
    name: '通用音频理解', datasets: 'MMAU · MMAU-Pro · MMAR · MMSU', dims: '4 个基准取算术平均',
    metric: '得分', dir: '越高越好', moss: 71.08, base: 67.91, baseName: 'Qwen3-Omni-30B', unit: '', lower: false,
  },
  caption: {
    name: '语音描述', datasets: '自建基准 · 2000 条语音', dims: '13 个评判维度',
    metric: 'LLM 评判分', dir: '越高越好', moss: 3.7252, base: 3.577, baseName: 'Gemini-3.1-Pro', unit: '', lower: false,
  },
  asr: {
    name: 'ASR', datasets: '12 个维度的数据集', dims: '健康/方言/歌唱/噪声/耳语/多人/年龄 等',
    metric: '字符错误率 CER', dir: '越低越好', moss: 11.3, base: 11.39, baseName: 'Qwen3-Omni', unit: '%', lower: true,
  },
  tsasr: {
    name: '时间戳 ASR', datasets: 'AISHELL-1（中）· LibriSpeech（英）', dims: 'CTC 对齐生成参考时间戳',
    metric: '累积平均偏移 AAS', dir: '越低越好', moss: 35.77, base: 833.66, baseName: 'Qwen3-Omni', unit: 'ms', lower: true,
  },
};

const ORDER: Key[] = ['mmau', 'caption', 'asr', 'tsasr'];

export const C10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ key: Key; t0: number }>({ key: 'mmau', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<Key>('mmau');
  const [fb, setFb] = useState({ text: '选择任务，查看协议与结果对比。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { key: Key; t0: number }, now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const g = M[s.key];
      const p = easeInOutQuad(Math.min(1, (now - s.t0) / 900));

      // protocol (left)
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText(g.name, 50, 46);
      const rows: [string, string][] = [
        ['数据集', g.datasets],
        ['维度', g.dims],
        ['指标', g.metric + ' · ' + g.dir],
      ];
      rows.forEach(([k, v], i) => {
        const y = 74 + i * 40;
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(k, 50, y + 18);
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(v, 130, y + 18);
      });

      // result bars (right)
      const bx = 560;
      const bw = 460;
      const maxV = Math.max(g.moss, g.base);
      const norm = (v: number) => Math.min(1, (g.lower ? maxV / v : v / maxV));
      // baseline
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(bx, 90, bw * norm(g.base) * p, 34);
      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(g.baseName, bx, 82);
      ctx.fillText(g.base.toFixed(2) + g.unit, bx + bw * norm(g.base) * p + 8, 112);
      // moss
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(bx, 160, bw * norm(g.moss) * p, 34);
      ctx.fillStyle = '#21324a';
      ctx.fillText('MOSS-Audio', bx, 152);
      ctx.fillText(g.moss.toFixed(2) + g.unit, bx + bw * norm(g.moss) * p + 8, 182);
    };
    const tick = () => {
      render(stateRef.current, performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (k: Key) => {
    stateRef.current = { key: k, t0: performance.now() };
    setSel(k);
    const g = M[k];
    setFb({ text: `${g.name}：${g.metric}（${g.dir}），MOSS-Audio ${g.moss}${g.unit} vs ${g.baseName} ${g.base}${g.unit}。`, cls: g.lower ? '' : 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ORDER.map((k) => (
          <button key={k} type="button" className={sel === k ? 'chip active' : 'chip'} onClick={() => pick(k)}>
            {M[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C10Mod1;

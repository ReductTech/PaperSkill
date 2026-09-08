import React, { useEffect, useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

type View = 'benchmark' | 'media';
type BenchmarkId = 'vbr' | 'oxford' | 'kitti';

type BenchmarkRow = {
  method: string;
  value: number;
  tone: 'ours' | 'baseline' | 'ours-base';
  detail?: string;
};

const BENCHMARKS: Record<BenchmarkId, {
  label: string;
  title: string;
  note: string;
  image: string;
  imageAlt: string;
  rows: BenchmarkRow[];
}> = {
  vbr: {
    label: 'VBR',
    title: '超长序列：VBR 平均 ATE',
    note: 'VBR 包含超长序列与回环；18.84 是 HorizonStream + 可选 Loop Closure，基础模型为 25.30。',
    image: assetPath('images/table-3-vbr.png'),
    imageAlt: '原论文 Table 3 VBR 定量对比',
    rows: [
      { method: 'HorizonStream + LC', value: 18.84, tone: 'ours', detail: '可选回环' },
      { method: 'HorizonStream', value: 25.30, tone: 'ours-base', detail: '基础模型' },
      { method: 'LingBot-map', value: 27.53, tone: 'baseline' },
      { method: 'LongStream', value: 77.93, tone: 'baseline' },
    ],
  },
  oxford: {
    label: 'Oxford Spires',
    title: '复杂室内外：Oxford Spires 平均 ATE',
    note: '暗光、楼梯和室内外过渡都在完整序列中评测；数值越低表示轨迹误差越小。',
    image: assetPath('images/fig-4-long-sequence-comparison.png'),
    imageAlt: '原论文 Figure 4 长序列定性对比',
    rows: [
      { method: 'HorizonStream + LC', value: 8.71, tone: 'ours', detail: '可选回环' },
      { method: 'HorizonStream', value: 9.38, tone: 'ours-base', detail: '基础模型' },
      { method: 'LingBot-map', value: 15.46, tone: 'baseline' },
      { method: 'LongStream', value: 51.90, tone: 'baseline' },
    ],
  },
  kitti: {
    label: 'KITTI',
    title: '长距离驾驶：KITTI 平均 ATE',
    note: '基础 HorizonStream 为 19.75；启用可选 Loop Closure 后为 16.44，LingBot-map 为 25.29。',
    image: assetPath('images/fig-5-reconstruction-comparison.png'),
    imageAlt: '原论文 Figure 5 三维重建定性对比',
    rows: [
      { method: 'HorizonStream + LC', value: 16.44, tone: 'ours', detail: '可选回环' },
      { method: 'HorizonStream', value: 19.75, tone: 'ours-base', detail: '基础模型' },
      { method: 'LingBot-map', value: 25.29, tone: 'baseline' },
    ],
  },
};

const BENCHMARK_ORDER: BenchmarkId[] = ['vbr', 'oxford', 'kitti'];

export const Chap09StreamingEvidence: React.FC<WidgetProps> = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('benchmark');
  const [benchmark, setBenchmark] = useState<BenchmarkId>('vbr');
  const [playing, setPlaying] = useState(false);
  const [autoDemo, setAutoDemo] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isVisible, setIsVisible] = useState(true);
  const [mediaNote, setMediaNote] = useState('两段官方 KITTI 07 片段保持同步；这是定性证据，不直接等同于 ATE。');
  const leftRef = useRef<HTMLVideoElement>(null);
  const rightRef = useRef<HTMLVideoElement>(null);
  const activeBenchmark = BENCHMARKS[benchmark];
  const maxValue = Math.max(...activeBenchmark.rows.map((row) => row.value));

  const startPlayback = async () => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    try {
      await Promise.all([left.play(), right.play()]);
      setPlaying(true);
      setMediaNote('正在同步播放官方片段；重点观察长序列中的抖动、漂移和点云碎片化。');
    } catch {
      setMediaNote('浏览器暂未允许媒体播放；静态画面仍来自官方片段。');
    }
  };

  const togglePlay = async () => {
    setAutoDemo(false);
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    if (playing) {
      left.pause();
      right.pause();
      setPlaying(false);
      setMediaNote('已暂停在同一相对时刻；这是定性观察，不直接等同于 ATE。');
      return;
    }
    await startPlayback();
  };

  const restart = () => {
    [leftRef.current, rightRef.current].forEach((video) => {
      if (video) video.currentTime = 0;
    });
    setPlaying(false);
    leftRef.current?.pause();
    rightRef.current?.pause();
    setMediaNote('已回到片段起点。');
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (!entry.isIntersecting) {
        leftRef.current?.pause();
        rightRef.current?.pause();
        setPlaying(false);
      }
    }, { threshold: 0.08 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoDemo || !isVisible || view !== 'benchmark') return;
    const timer = window.setInterval(() => {
      setBenchmark((current) => BENCHMARK_ORDER[(BENCHMARK_ORDER.indexOf(current) + 1) % BENCHMARK_ORDER.length]);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [autoDemo, isVisible, view]);

  useEffect(() => {
    if (!autoDemo || !isVisible || view !== 'media' || playing) return;
    const timer = window.setTimeout(() => { void startPlayback(); }, 260);
    return () => window.clearTimeout(timer);
  }, [autoDemo, isVisible, view, playing]);

  const syncFollower = () => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right || !Number.isFinite(left.duration) || !Number.isFinite(right.duration)) return;
    const target = (left.currentTime / left.duration) * right.duration;
    if (Math.abs(right.currentTime - target) > 0.12) right.currentTime = target;
  };

  const chooseView = (next: View) => {
    setAutoDemo(false);
    setView(next);
  };

  return (
    <div className="hs-evidence-lab" ref={rootRef}>
      <div className="chip-row" role="tablist" aria-label="实验视图">
        <button type="button" role="tab" aria-selected={view === 'benchmark'} className={`chip ${view === 'benchmark' ? 'selected' : ''}`} onClick={() => chooseView('benchmark')}>定量性能对比</button>
        <button type="button" role="tab" aria-selected={view === 'media'} className={`chip ${view === 'media' ? 'selected' : ''}`} onClick={() => chooseView('media')}>定性长序列</button>
      </div>

      {view === 'benchmark' ? (
        <div className="hs-benchmark-panel" role="tabpanel">
          <div className="hs-benchmark-heading">
            <div>
              <div className="hs-benchmark-eyebrow">定量性能总览 · ATE ↓</div>
              <h3>{activeBenchmark.title}</h3>
              <p>先看 HorizonStream 与现有流式方法的整体差距，再回到后面的 Table 6 追问模块贡献。</p>
            </div>
            <button type="button" className={`tiny ${autoDemo ? '' : 'ghost'}`} aria-pressed={autoDemo} onClick={() => setAutoDemo((value) => !value)}>
              {autoDemo ? '暂停自动演示' : '自动演示'}
            </button>
          </div>

          <div className="chip-row" role="group" aria-label="选择评测基准">
            {BENCHMARK_ORDER.map((id) => (
              <button key={id} type="button" className={`chip ${benchmark === id ? 'selected' : ''}`} aria-pressed={benchmark === id} onClick={() => { setAutoDemo(false); setBenchmark(id); }}>{BENCHMARKS[id].label}</button>
            ))}
          </div>

          <div className="hs-benchmark-layout">
            <div className="hs-benchmark-bars">
              {activeBenchmark.rows.map((row) => (
                <div className="hs-benchmark-row" key={`${benchmark}-${row.method}`}>
                  <div className="hs-benchmark-row-head">
                    <span>{row.method}</span>
                    <strong>{row.value.toFixed(2)}</strong>
                  </div>
                  <div className="hs-benchmark-track" aria-hidden="true">
                    <span className={`hs-benchmark-fill is-${row.tone}`} style={{ width: `${clamp((row.value / maxValue) * 100, 10, 100)}%` }} />
                  </div>
                  {row.detail ? <small>{row.detail}</small> : null}
                </div>
              ))}
            </div>
            <div className="hs-benchmark-source">
              <img src={activeBenchmark.image} alt={activeBenchmark.imageAlt} />
              <p>{activeBenchmark.note}</p>
              <span>交互条形图是原始结果的讲解摘要，右侧保留论文原图作为证据。</span>
            </div>
          </div>
          <div className="feedback good">同一 benchmark 内 ATE 越低越好；不同 benchmark 的绝对数值不要直接横向比较。</div>
        </div>
      ) : (
        <div role="tabpanel">
          <div className="hs-video-grid">
            <figure>
              <figcaption>LingBot-map · 官方片段</figcaption>
              <video ref={leftRef} muted playsInline preload="metadata" poster={assetPath('images/kitti07-lingbot.webp')} onTimeUpdate={syncFollower} onEnded={() => setPlaying(false)}>
                <source src={assetPath('images/kitti07-lingbot-preview.mp4')} type="video/mp4" />
              </video>
            </figure>
            <figure>
              <figcaption>HorizonStream · 官方片段</figcaption>
              <video ref={rightRef} muted playsInline preload="metadata" poster={assetPath('images/kitti07-horizon.webp')} onEnded={() => setPlaying(false)}>
                <source src={assetPath('images/kitti07-horizon-preview.mp4')} type="video/mp4" />
              </video>
            </figure>
          </div>
          <div className="step-ctrl">
            <button type="button" className="tiny" onClick={togglePlay}>{playing ? '暂停' : '播放'}</button>
            <button type="button" className="tiny ghost" onClick={restart}>从头重播</button>
          </div>
          <div className="feedback" aria-live="polite">{mediaNote}</div>
          <div className="hs-qualitative-figures">
            <figure><img src={assetPath('images/fig-4-long-sequence-comparison.png')} alt="原论文 Figure 4 长序列定性轨迹对比" /><figcaption>Figure 4 · 长序列轨迹</figcaption></figure>
            <figure><img src={assetPath('images/fig-5-reconstruction-comparison.png')} alt="原论文 Figure 5 三维重建定性对比" /><figcaption>Figure 5 · 轨迹与三维重建</figcaption></figure>
          </div>
          <div className="hs-source-note">来源：官方 KITTI 07 媒体；原论文 Figure 4/5。这里展示定性现象，不把画面差异直接当作 ATE。</div>
        </div>
      )}

      <style>{`
        .hs-evidence-lab{display:grid;gap:12px}.hs-benchmark-panel{display:grid;gap:14px}.hs-benchmark-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.hs-benchmark-eyebrow{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.hs-benchmark-heading h3{margin:4px 0 6px;color:var(--ink);font-size:22px;line-height:1.3}.hs-benchmark-heading p{margin:0;color:var(--ink-2);font-size:14px;line-height:1.6}.hs-benchmark-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:16px;align-items:start}.hs-benchmark-bars{display:grid;gap:12px;padding:16px;border:1px solid var(--line);border-radius:8px;background:var(--paper-2)}.hs-benchmark-row-head{display:flex;justify-content:space-between;gap:12px;color:var(--ink);font-size:14px;font-weight:750}.hs-benchmark-row-head strong{font-family:"Cascadia Code",monospace;color:var(--blue)}.hs-benchmark-track{height:10px;margin-top:7px;overflow:hidden;border-radius:999px;background:#e7ebf1}.hs-benchmark-fill{display:block;height:100%;border-radius:inherit;transition:width 280ms var(--ease-out)}.hs-benchmark-fill.is-ours{background:var(--blue)}.hs-benchmark-fill.is-ours-base{background:#5790e8}.hs-benchmark-fill.is-baseline{background:#aab4c2}.hs-benchmark-row small{display:block;margin-top:4px;color:var(--slate);font-size:12px}.hs-benchmark-source{display:grid;gap:9px;padding:12px;border:1px solid var(--line);border-radius:8px;background:#fff}.hs-benchmark-source img{display:block;width:100%;max-height:250px;object-fit:contain;background:#fff}.hs-benchmark-source p{margin:0;color:var(--ink-2);font-size:13px;line-height:1.55}.hs-benchmark-source span{color:var(--slate);font-size:12px;line-height:1.45}.hs-video-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hs-video-grid figure,.hs-qualitative-figures figure{margin:0;min-width:0}.hs-video-grid figcaption{padding:7px 10px;background:var(--paper-2);border:1px solid var(--line);border-bottom:0;border-radius:8px 8px 0 0;color:var(--ink);font-size:13px;font-weight:800}.hs-video-grid video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#10151d;border:1px solid var(--line);border-radius:0 0 8px 8px}.hs-qualitative-figures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hs-qualitative-figures img{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#fff}.hs-qualitative-figures figcaption{margin-top:6px;color:var(--slate);font-size:12px}.hs-source-note{padding:10px 12px;border-top:1px solid var(--line);color:var(--slate);font-size:13px;line-height:1.5}@media(max-width:720px){.hs-benchmark-heading{flex-direction:column}.hs-benchmark-layout,.hs-video-grid,.hs-qualitative-figures{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.hs-benchmark-fill{transition:none}}
      `}</style>
    </div>
  );
};

export default Chap09StreamingEvidence;

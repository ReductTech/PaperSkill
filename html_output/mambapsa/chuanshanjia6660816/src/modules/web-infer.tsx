import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

/**
 * 真实推理体验：在浏览器里直接加载 MambaPSA 与 C2PSA 基线的 ONNX 权重，
 * 用 onnxruntime-web (WASM) 跑检测。权重来自官方仓库 voc_mambapsa /
 * voc_baseline-3 训练结果，Mamba 扫描以 400 步展开的标准算子图运行。
 * 检测结果绘制在离屏 canvas 上，再以 <img> 展示——避免浏览器对大幅面
 * <canvas> 元素偶发的合成不绘制问题。
 */
const BASE = import.meta.env.BASE_URL; // './' —— 任意子路径部署都安全

// 与作者训练数据（ultralytics VOC.yaml）一致的 20 类顺序
const VOC_LABELS = [
  'aeroplane', 'bicycle', 'bird', 'boat', 'bottle', 'bus', 'car', 'cat', 'chair',
  'cow', 'diningtable', 'dog', 'horse', 'motorbike', 'person', 'pottedplant',
  'sheep', 'sofa', 'train', 'tvmonitor',
];

const COLOR = {
  mamba: '#228d5c', // 绿 = 本文方法
  base: '#27446e',  // 蓝 = C2PSA 基线
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

interface Det {
  x1: number; y1: number; x2: number; y2: number;
  conf: number; cls: number;
}

interface RawOut {
  mamba: Float32Array;
  base: Float32Array;
  ms: { mamba: number; base: number };
  r: number; padX: number; padY: number;
  ow: number; oh: number;
}

type OrtModule = typeof import('onnxruntime-web');

let ortPromise: Promise<OrtModule> | null = null;
function getOrt(): Promise<OrtModule> {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web').then((m) => {
      // onnxruntime-web 1.27 的 wasm EP 是「jsep 模块」：ep 包装(mjs) + wasm 二进制分开加载。
      // 用页面相对的绝对 URL 指向 public/wasm/ 下的拷贝，保证任意 base 部署都找得到。
      const abs = (rel: string) => new URL(rel, window.location.href).href;
      m.env.wasm.wasmPaths = {
        mjs: abs(`${BASE}wasm/ort-wasm-simd-threaded.jsep.mjs`),
        wasm: abs(`${BASE}wasm/ort-wasm-simd-threaded.jsep.wasm`),
      };
      m.env.wasm.numThreads = 1; // GitHub Pages 无跨源隔离头，用单线程 WASM
      return m;
    });
  }
  return ortPromise;
}

const PRESETS = [
  { name: '公交车（person/bus/car）', src: `${BASE}images/demo-bus.jpg` },
  { name: '足球场（person）', src: `${BASE}images/demo-zidane.jpg` },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

function letterbox(img: HTMLImageElement, ort: OrtModule, target = 640) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const r = Math.min(target / iw, target / ih);
  const nw = Math.round(iw * r), nh = Math.round(ih * r);
  const padX = Math.round((target - nw) / 2), padY = Math.round((target - nh) / 2);
  const c = document.createElement('canvas');
  c.width = target; c.height = target;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, target, target);
  ctx.drawImage(img, padX, padY, nw, nh);
  const px = ctx.getImageData(0, 0, target, target).data; // RGBA
  const arr = new Float32Array(3 * target * target);
  const n = target * target;
  for (let i = 0; i < n; i++) {
    arr[i] = px[i * 4] / 255;
    arr[n + i] = px[i * 4 + 1] / 255;
    arr[2 * n + i] = px[i * 4 + 2] / 255;
  }
  return { tensor: new ort.Tensor('float32', arr, [1, 3, target, target]), r, padX, padY };
}

function postprocess(data: Float32Array, confTh: number, raw: Pick<RawOut, 'r' | 'padX' | 'padY' | 'ow' | 'oh'>): Det[] {
  const out: Det[] = [];
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  for (let i = 0; i < 300; i++) {
    const conf = data[i * 6 + 4];
    if (conf < confTh) continue;
    out.push({
      x1: clamp((data[i * 6 + 0] - raw.padX) / raw.r, 0, raw.ow),
      y1: clamp((data[i * 6 + 1] - raw.padY) / raw.r, 0, raw.oh),
      x2: clamp((data[i * 6 + 2] - raw.padX) / raw.r, 0, raw.ow),
      y2: clamp((data[i * 6 + 3] - raw.padY) / raw.r, 0, raw.oh),
      conf,
      cls: Math.round(data[i * 6 + 5]),
    });
  }
  out.sort((a, b) => b.conf - a.conf);
  return out;
}

/** 把图片 + 检测框画到离屏 canvas，返回 dataURL 供 <img> 展示。 */
function renderResult(img: HTMLImageElement, dets: Det[], color: string): string {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const lw = Math.max(2, c.width / 300);
  const fs = Math.max(13, c.width / 42);
  for (const d of dets) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(d.x1, d.y1, d.x2 - d.x1, d.y2 - d.y1);
    const label = `${VOC_LABELS[d.cls] ?? d.cls} ${d.conf.toFixed(2)}`;
    ctx.font = `${fs}px system-ui, sans-serif`;
    const tw = ctx.measureText(label).width;
    const ty = Math.max(0, d.y1 - fs - 4);
    ctx.fillStyle = color;
    ctx.fillRect(d.x1, ty, tw + 8, fs + 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, d.x1 + 4, ty + fs - 1);
  }
  return c.toDataURL('image/jpeg', 0.85);
}

export const WebInfer: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState('正在加载推理引擎…');
  const [sessions, setSessions] = useState<{ mamba: Awaited<ReturnType<OrtModule['InferenceSession']['create']>>; base: Awaited<ReturnType<OrtModule['InferenceSession']['create']>> } | null>(null);
  const [image, setImage] = useState<{ img: HTMLImageElement; name: string } | null>(null);
  const [result, setResult] = useState<{ mamba: Det[]; base: Det[]; ms: { mamba: number; base: number } } | null>(null);
  const [shots, setShots] = useState<{ mamba: string | null; base: string | null } | null>(null);
  const [conf, setConf] = useState(0.35);
  const [running, setRunning] = useState(false);
  const rawRef = useRef<RawOut | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const runIdRef = useRef(0);

  // 加载引擎 + 两个模型（懒加载，模块出现时才发生）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setProgress('加载推理引擎 onnxruntime-web…');
        const ort = await getOrt();
        if (!alive) return;
        setProgress('下载 MambaPSA 模型（约 10 MB）…');
        const mamba = await ort.InferenceSession.create(`${BASE}models/mambapsa.onnx`, {
          executionProviders: ['wasm'],
        });
        if (!alive) return;
        setProgress('下载 C2PSA 基线模型（约 10 MB）…');
        const base = await ort.InferenceSession.create(`${BASE}models/baseline.onnx`, {
          executionProviders: ['wasm'],
        });
        if (!alive) return;
        setSessions({ mamba, base });
        setPhase('ready');
        // 就绪后自动用预置图跑一次
        const img = await loadImage(`${BASE}images/demo-bus.jpg`);
        if (!alive) return;
        setImage({ img, name: '公交车' });
      } catch (e) {
        console.error(e);
        if (alive) setPhase('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 只用缓存的原始输出重新后处理（置信度滑块移动时调用，不重跑推理）
  const apply = useCallback(() => {
    const raw = rawRef.current;
    const img = imageRef.current;
    if (!raw || !img) return;
    const res = {
      mamba: postprocess(raw.mamba, conf, raw),
      base: postprocess(raw.base, conf, raw),
      ms: raw.ms,
    };
    setResult(res);
    setShots({
      mamba: renderResult(img, res.mamba, COLOR.mamba),
      base: renderResult(img, res.base, COLOR.base),
    });
  }, [conf]);

  const run = useCallback(
    async (img: HTMLImageElement) => {
      if (!sessions) return;
      const id = ++runIdRef.current;
      setRunning(true);
      const ort = await getOrt();
      try {
        const { tensor, r, padX, padY } = letterbox(img, ort);
        const feeds = { images: tensor };
        let t0 = performance.now();
        const om = await sessions.mamba.run(feeds);
        const msMamba = performance.now() - t0;
        t0 = performance.now();
        const ob = await sessions.base.run(feeds);
        const msBase = performance.now() - t0;
        if (id !== runIdRef.current) return;
        rawRef.current = {
          mamba: om.output0.data as Float32Array,
          base: ob.output0.data as Float32Array,
          ms: { mamba: msMamba, base: msBase },
          r, padX, padY,
          ow: img.naturalWidth, oh: img.naturalHeight,
        };
        imageRef.current = img;
        apply();
      } catch (e) {
        console.error(e);
      } finally {
        if (id === runIdRef.current) setRunning(false);
      }
    },
    [sessions, apply],
  );

  // image 变化时自动推理（注意：不把 run 放进依赖，避免滑块移动误触发重跑）
  useEffect(() => {
    if (image) void run(image.img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, sessions]);

  const pickPreset = useCallback(async (src: string) => {
    const img = await loadImage(src);
    setImage({ img, name: src.split('/').pop() ?? '图片' });
  }, []);

  const onUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => setImage({ img, name: file.name });
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  if (phase === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '18px 0' }}>
        <div style={{ fontSize: 14, color: COLOR.muted }}>{progress}</div>
        <div style={{ margin: '10px auto', width: 200, height: 4, background: COLOR.line, borderRadius: 2 }}>
          <div style={{ width: '55%', height: '100%', background: COLOR.mamba, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 6 }}>
          首次加载需下载约 30 MB（推理引擎 + 两个权重），之后秒开
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '18px 0', color: '#b6484f' }}>
        模型加载失败，请检查网络后刷新重试。
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        {PRESETS.map((p) => (
          <button
            key={p.src}
            className="chip-btn"
            onClick={() => void pickPreset(p.src)}
            disabled={running}
          >
            {p.name}
          </button>
        ))}
        <label className="chip-btn" style={{ cursor: 'pointer' }}>
          上传自己的图片
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLOR.muted }}>
          置信度
          <input
            type="range" min={0.1} max={0.7} step={0.05}
            value={conf}
            onChange={(e) => setConf(parseFloat(e.target.value))}
          />
          <b style={{ color: COLOR.ink, minWidth: 28 }}>{conf.toFixed(2)}</b>
        </label>
        {image && (
          <button
            className="chip-btn chip-btn-acc"
            onClick={() => void run(image.img)}
            disabled={running}
          >
            {running ? '推理中…' : '重新推理'}
          </button>
        )}
      </div>

      {image && sessions && (
        <div className="web-infer-grid">
          <div className="web-infer-card">
            <div className="web-infer-card-head">
              <span className="web-infer-dot" style={{ background: COLOR.mamba }} />
              MambaPSA（本文）<b>{result ? `${result.mamba.length} 个检测` : '—'}</b>
              <span className="web-infer-time">{result ? `${result.ms.mamba.toFixed(0)} ms` : ''}</span>
            </div>
            {shots?.mamba
              ? <img src={shots.mamba} alt="MambaPSA 推理结果" className="web-infer-img" />
              : <div className="web-infer-empty">推理中…</div>}
          </div>
          <div className="web-infer-card">
            <div className="web-infer-card-head">
              <span className="web-infer-dot" style={{ background: COLOR.base }} />
              C2PSA 基线<b>{result ? `${result.base.length} 个检测` : '—'}</b>
              <span className="web-infer-time">{result ? `${result.ms.base.toFixed(0)} ms` : ''}</span>
            </div>
            {shots?.base
              ? <img src={shots.base} alt="C2PSA 基线推理结果" className="web-infer-img" />
              : <div className="web-infer-empty">推理中…</div>}
          </div>
        </div>
      )}

      {result && (
        <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 10, lineHeight: 1.7 }}>
          同一张图、同一个输入张量，在浏览器里（WASM 单线程）分别加载两个真实权重推理，两张图检测结果高度一致。
          这里的耗时是<b style={{ color: COLOR.ink }}>浏览器 WASM</b>上的数值——Mamba 扫描以 400 步展开的算子图串行执行，
          所以 MambaPSA 在浏览器里<b style={{ color: COLOR.ink }}>偏慢</b>（约 {result.ms.mamba.toFixed(0)} ms vs 基线 {result.ms.base.toFixed(0)} ms），
          这<b style={{ color: COLOR.ink }}>不代表</b>论文里原生 CPU 的推理性能（论文：17 → 20 FPS，MambaPSA 更快）——
          展开图的串行开销只在浏览器这种受限环境里出现。
        </div>
      )}
      <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 6 }}>
        模型：<code>voc_mambapsa</code> 与 <code>voc_baseline-3</code> 的 best.pt → ONNX（fp32，约 10 MB×2），
        由 onnxruntime-web WASM 在浏览器内运行，无任何后端服务。VOC 20 类。
      </div>
    </div>
  );
};

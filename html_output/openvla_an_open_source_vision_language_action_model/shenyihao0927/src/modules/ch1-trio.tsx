import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawBox,
  drawCheckMark,
  drawSceneLabel,
  drawLegend,
} from './flatKit';
import type { WidgetProps } from './registry';

// Module 1.2 「开源三件套开箱」 — click through the three open-source
// deliverables: model weights (HuggingFace), fine-tuning notebooks (LoRA +
// quantization), and the PyTorch codebase. Each card lists what you actually
// get, all marked free to download.
const W = 1080;
const H = 280;

type Item = {
  key: string;
  chip: string;
  title: string;
  lines: string[];
};

const ITEMS: Item[] = [
  {
    key: 'weights',
    chip: '模型权重',
    title: '① 模型权重（HuggingFace）',
    lines: ['7B 完整检查点，一行代码下载', 'HF AutoModel 直接加载', 'bf16 / int4 版本可用'],
  },
  {
    key: 'notebooks',
    chip: '微调笔记本',
    title: '② 微调笔记本',
    lines: ['LoRA 微调全流程 notebook', '量化推理示例（int4 7GB）', '消费级 GPU 即可跑'],
  },
  {
    key: 'code',
    chip: '代码库',
    title: '③ PyTorch 代码库',
    lines: ['OpenX 数据全支持', 'FSDP / FlashAttention / AMP 内置', '单卡微调 → 多机集群'],
  },
];

export const Ch1Trio: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ idx: number }>({ idx: 0 });
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '点选三件套中的任意一件，看盒子里到底装了什么。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const cur = stateRef.current.idx;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // three flat-pack boxes in the LEFT half; selected one grows and rings
      ITEMS.forEach((it, i) => {
        const cx = 130 + i * 175;
        const sel = i === cur;
        // box
        ctx.save();
        ctx.translate(cx, 214);
        ctx.scale(sel ? 1.08 : 0.88, sel ? 1.08 : 0.88);
        ctx.globalAlpha = sel ? 1 : 0.75;
        drawBox(ctx, 0, 0, 1);
        ctx.restore();
        // selection ring + check
        if (sel) {
          ctx.save();
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(cx - 36, 152, 72, 76, 10);
          ctx.stroke();
          ctx.restore();
          drawCheckMark(ctx, cx + 22, 168, 9);
        }
        // chip label above box
        drawSceneLabel(ctx, it.chip, cx, 132, { color: sel ? C.green : C.muted, align: 'center' });
      });

      // detail card in the RIGHT half, fully clear of the box column
      const it = ITEMS[cur];
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = sel_border(cur);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(600, 60, 456, 168, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.title, 624, 92);
      ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.muted;
      it.lines.forEach((ln, k) => {
        ctx.fillText('· ' + ln, 624, 126 + k * 26);
      });
      ctx.restore();

      drawSceneLabel(ctx, '全部免费下载', 30, 40, { color: C.green });
      drawLegend(
        ctx,
        [
          ['三件套', C.green],
          ['点击切换', C.muted],
        ],
        30,
        H - 16
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const sel_border = (i: number) => [C.green, C.orange, C.blue][i % 3];

  const pick = (i: number) => {
    stateRef.current.idx = i;
    setIdx(i);
    setFeedback({
      text: [
        '权重只是起点：7B 检查点在 HuggingFace，一行代码拉下来就能推理。',
        '微调才是重头戏：LoRA + 量化的完整 notebook 跟手把手教程没区别——消费级显卡就能改出你自己的版本。',
        '代码库兜底：从 OpenX 数据处理到多机集群训练全流程代码，想改架构也随便改。',
      ][i],
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {ITEMS.map((it, i) => (
          <button
            key={it.key}
            type="button"
            className={`chip ${idx === i ? 'selected' : ''}`}
            onClick={() => pick(i)}
          >
            {it.chip}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Trio;

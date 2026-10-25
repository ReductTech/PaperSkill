import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  drawField,
  drawSheet,
  drawTag,
  drawLabel,
  drawLegend,
} from './letterpressKit';

// ── 第 10 章 10.2「争议面板」 · 主导操作 P6：逐张展开三张卡片 ──
// 画面：排字台上并排三张争议卡。每张卡回答同一个结果表的三个问题之一：
// 哪个尺子（论文自己 §5.3 的话，附带代码侧事实）、谁的参照系、谁的基准（后两条都是后续工作）。
// 面板从不改写论文的任何数字，只把「论文说的」「代码侧读到的」「别人说的」分开摆放。

const W_NORMAL = 1080;
const H_NORMAL = 560;
const W_ANA = 560;
const H_ANA = 140;

const SLOT_X = 40;
const SLOT_W = (1040 - SLOT_X * 2 - 40) / 3;
const SLOT_TOP = 106;

type Tone = 'paper' | 'later';

interface CardDef {
  id: 'diff' | 'coda' | 'slca';
  title: string;
  question: string;
  tag: string;
  tone: Tone;
  lines: number;
  evidence: string;
  feedback: string;
  cls: string;
}

const CARDS: CardDef[] = [
  {
    id: 'diff',
    title: '尺子换了',
    question: '拿谁的尺子在量？',
    tag: '论文原话',
    tone: 'paper',
    lines: 4,
    evidence:
      '<b>§5.3 的说法：</b>“Instead of absolute performance in average accuracy, we use difference to upper-bound (Diff) to measure the performance of each method given a specific architecture.” 对主干只说 “based on a pre-trained ViT-B/16”，没写预训练数据、检查点名或参数量。<b>代码侧：</b>ImageNet-21k 预训练的 <code>ViT-B_16.npz</code>，约 86M 参数。表 2 的对照：ResNet18 上界 80.41，SupSup 28.34（Diff <b>52.07</b>）；ViT-B/16 上界 90.85，L2P 83.83（Diff <b>7.02</b>）。',
    feedback:
      'Diff 把不同主干放到了同一把尺子上：SupSup 主干 ResNet18（上界 80.41）Diff <b>52.07</b>；L2P 主干 ViT-B/16（上界 90.85）Diff <b>7.02</b>。',
    cls: 'good',
  },
  {
    id: 'coda',
    title: '检索是瓶颈',
    question: '谁的参照系？',
    tag: '后续工作',
    tone: 'later',
    lines: 4,
    evidence:
      '<b>后续工作：</b>CODA-Prompt，CVPR 2023，arXiv:2211.13218。原文说 key 的选择依赖 “a second, localized optimization”，并指出这类方法 “reduce forgetting by sacrificing new task accuracy”（缺少 plasticity）。',
    feedback:
      'key 的选择依赖 a second, localized optimization；这类方法 reduce forgetting by sacrificing new task accuracy（缺少 plasticity）。这是后续工作的说法。',
    cls: '',
  },
  {
    id: 'slca',
    title: 'SimpleCIL 更便宜',
    question: '谁的基准？',
    tag: '后续工作',
    tone: 'later',
    lines: 4,
    evidence:
      '<b>后续工作：</b>SLCA / APER，IJCV，arXiv:2303.07338。原文说 “current state-of-the-art (i.e., L2P and DualPrompt) still show inferior performance than the baseline method SimpleCIL”，且 SimpleCIL “outperforms the current SOTA by 5% even without any tuning”。<b>它的评测基准与 L2P 不同。</b>',
    feedback:
      'current state-of-the-art (i.e., L2P and DualPrompt) still show inferior performance than the baseline method SimpleCIL，且 SimpleCIL outperforms the current SOTA by 5% even without any tuning。<b>注意：这是后续工作，且评测基准与 L2P 不同。</b>',
    cls: '',
  },
];

const OPENERS = ['diff', 'coda', 'slca'] as const;
type OpenId = (typeof OPENERS)[number];

function cardOf(id: string): CardDef {
  return CARDS.filter((c) => c.id === id)[0] ?? CARDS[0];
}

function toneColor(t: Tone): string {
  return t === 'paper' ? LP.success : LP.aux;
}

export const DisputePanel: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_NORMAL;
  const H = isAna ? H_ANA : H_NORMAL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef<OpenId[]>([]);
  const animRef = useRef<number[]>([0, 0, 0]);
  const anaRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [open, setOpen] = useState<OpenId[]>([]);
  const [note, setNote] = useState<{ text: string; cls: string }>({
    text: '三张卡片，逐张展开。',
    cls: '',
  });

  useEffect(() => {
    if (isAna) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;

      if (isAna) {
        // 类比卡：三张卡轮流展开、合上，展开时露出签条与压出的正文行。
        anaRef.current += dt;
        const cyc = anaRef.current % 6.6;
        const idx = Math.floor(cyc / 2.2);
        const phase = (cyc % 2.2) / 2.2;
        const k = phase < 0.25 ? phase / 0.25 : phase < 0.62 ? 1 : phase < 0.85 ? (0.85 - phase) / 0.23 : 0;
        drawField(ctx, 0, 0, W, H);
        for (let i = 0; i < 3; i += 1) {
          const lit = i === idx ? clamp(k, 0, 1) : 0;
          const x = 24 + i * 174;
          const h = lerp(56, 108, lit);
          drawSheet(ctx, x, 18, 156, h, {
            tone: i === 0 ? 'good' : 'neutral',
            lines: lit > 0.4 ? 5 : 2,
          });
          drawTag(ctx, x + 10, 26, 74, 18, {
            text: i === 0 ? '论文原话' : '后续工作',
            fill: i === 0 ? LP.success : LP.aux,
            hit: lit > 0.5,
          });
          drawLabel(ctx, CARDS[i].title, x + 10, 62, {
            size: 13,
            color: LP.ink,
            weight: 600,
          });
        }
      } else {
        drawField(ctx, 0, 0, W, H);

        // 台面：三张争议卡的槽位
        drawLabel(ctx, '三张卡片，同一个结果表', 40, 52, {
          size: 14,
          color: LP.muted,
        });

        for (let i = 0; i < CARDS.length; i += 1) {
          const c = CARDS[i];
          const want = openRef.current.indexOf(c.id) >= 0 ? 1 : 0;
          animRef.current[i] = lerp(
            animRef.current[i],
            want,
            1 - Math.exp(-dt * 8)
          );
          const e = clamp(animRef.current[i], 0, 1);
          const x = SLOT_X + i * (SLOT_W + 20);
          const full = H - SLOT_TOP - 132;
          const h = lerp(158, Math.max(158, full), e);
          const color = toneColor(c.tone);

          drawSheet(ctx, x, SLOT_TOP, SLOT_W, h, {
            tone: c.tone === 'paper' ? 'good' : 'neutral',
            lines: Math.max(2, Math.round(c.lines * e) + 2),
          });

          // 签条：论文原话 vs 后续工作
          drawTag(ctx, x + 16, SLOT_TOP + 14, 92, 22, {
            text: c.tag,
            fill: color,
            hit: e > 0.5,
          });

          drawLabel(ctx, c.title, x + 16, SLOT_TOP + 62, {
            size: 16,
            color: LP.ink,
            weight: 600,
          });
          drawLabel(ctx, c.question, x + 16, SLOT_TOP + 86, {
            size: 13,
            color: LP.muted,
          });

          if (e > 0.05 && c.tone === 'paper') {
            ctx.save();
            ctx.strokeStyle = LP.success;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 2, SLOT_TOP - 2, SLOT_W + 4, h + 4);
            ctx.restore();
          }
        }

        // 收尾红注：面板只摆放说法，不改写论文的数字
        if (openRef.current.length > 0) {
          drawLabel(ctx, '只摆放说法，不改数字', 40, H - 58, {
            size: 13,
            color: LP.failure,
            weight: 600,
          });
        }

        drawLegend(
          ctx,
          [
            { label: '论文原话', color: LP.success },
            { label: '后续工作', color: LP.aux },
          ],
          40,
          H - 24
        );
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      last = 0;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [isAna, W, H]);

  const toggle = (id: OpenId) => {
    const cur = openRef.current;
    const isOpen = cur.indexOf(id) >= 0;
    const next = isOpen ? cur.filter((x) => x !== id) : cur.concat([id]);
    openRef.current = next;
    setOpen(next);
    if (isOpen) {
      setNote({ text: '三张卡片，逐张展开。', cls: '' });
      return;
    }
    const c = cardOf(id);
    setNote({ text: c.feedback, cls: c.cls });
  };

  const reset = () => {
    openRef.current = [];
    setOpen([]);
    animRef.current = [0, 0, 0];
    setNote({ text: '三张卡片，逐张展开。', cls: '' });
  };

  if (isAna) {
    return (
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    );
  }

  return (
    <div>
      <div className="ctrl">
        <label>争议卡</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-expanded={open.indexOf(c.id) >= 0}
              className={open.indexOf(c.id) >= 0 ? 'chip selected' : 'chip'}
              onClick={() => toggle(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>
        <button type="button" className="tiny ghost" onClick={reset}>
          重置
        </button>
      </div>

      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      <div className="metrics">
        <div className="metric">
          <div className="l">已展开</div>
          <div className="v">{open.length} / 3</div>
        </div>
        <div className="metric">
          <div className="l">证据等级</div>
          <div className="v">论文 1 · 后续 2</div>
        </div>
        <div className="metric">
          <div className="l">面板改写数字</div>
          <div className="v">0</div>
        </div>
      </div>

      <div className="step-desc">
        三张卡问同一张结果表三件事：<b>拿谁的尺子在量</b>、<b>谁的参照系</b>、<b>谁的基准</b>。
        绿色调料是正文的说法，紫色调料是后续工作——两者不混放。
        <br />
        <b>核对（正文与它自己的表格不一致）：</b>§5.3 写「L2P outperforms all comparing
        methods consistently…」，但同一篇的 Table 1 里每类 50 张的 DER++ <b>83.94</b> 已经超过 L2P 的
        83.83；另一处写「L2P remains the best performance」，Table 3 里 ER 80.10、BiC 79.28、DER++
        79.70、Co2L 79.75、L2P-R 81.07 都高过 L2P 78.33。这里按表格印出的数字说话。
      </div>

      <div className={`feedback ${note.cls}`} dangerouslySetInnerHTML={{ __html: note.text }} />

      <div style={{ width: '100%', textAlign: 'left' }}>
        {CARDS.map((c) => (
          <details key={c.id} open={open.indexOf(c.id) >= 0} style={{ marginBottom: 8 }}>
            <summary
              className="step-desc"
              style={{ textAlign: 'left', cursor: 'pointer', color: toneColor(c.tone) }}
            >
              <b>{c.title}</b> · {c.question} · {c.tag}
            </summary>
            <div
              className="step-desc"
              style={{ textAlign: 'left' }}
              dangerouslySetInnerHTML={{ __html: c.evidence }}
            />
          </details>
        ))}
      </div>
    </div>
  );
};

export default DisputePanel;

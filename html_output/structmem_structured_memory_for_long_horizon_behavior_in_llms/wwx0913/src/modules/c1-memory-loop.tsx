import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  fillRound,
  roundRect,
  drawArrow,
  drawPhoto,
  drawAxisBox,
  label,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 1.2（P2 分步走 + 模式切换）：一次对话轮在「对话轮 / 记忆库 / 模型 API」三点之间怎么流动。
// 三种方案各自按「写笔记 / 翻笔记」两阶段展开，逐步展示每一步在做什么。
// 事实口径：论文正文 + LightMem 参考实现。

const W = 1080;
const H = 280;

type Arrow = 'chat2mem' | 'mem2api' | 'api2mem' | 'api2chat';
type Phase = 'write' | 'read';

interface StepDef {
  phase: Phase;
  desc: string;
  feedback: string;
  cls: '' | 'good' | 'bad';
  arrows: Arrow[];
  layers: number[];
  tag?: string;
  trigger?: string;
  cost: 'free' | 'cond' | 'offline';
}

interface ModeDef {
  key: string;
  chip: string;
  steps: StepDef[];
}

const CHAT = { x: 40, y: 96, w: 170, h: 88 };
const MEM = { x: 390, y: 96, w: 300, h: 88 };
const API = { x: 870, y: 96, w: 170, h: 88 };
const LAYERS = [112, 136, 160];

// 不按"每轮必做 / 条件触发 / 离线整理"分色：统一蓝色强调，只有离线整理步骤用紫色区分，
// 其"离线"性质由该步文字与触发原因行交代。
const COST_COLOR: Record<StepDef['cost'], string> = {
  free: COL.blue,
  cond: COL.blue,
  offline: COL.purple,
};

const PHASE_LABEL: Record<Phase, string> = { write: '写笔记', read: '翻笔记' };

const MODES: ModeDef[] = [
  {
    key: 'flat',
    chip: '扁平记忆',
    steps: [
      {
        phase: 'write',
        desc: '把长对话切成片段。',
        feedback: '片段是扁平记忆的处理单位。',
        cls: '',
        arrows: ['chat2mem'],
        layers: [0],
        tag: '切分对话',
        trigger: '缓冲累计到阈值才处理（LightMem 取 512 token）',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '片段发给模型，抽取事实。',
        feedback: '只问「发生了什么」，不问「谁和谁有关」。',
        cls: '',
        arrows: ['mem2api'],
        layers: [0],
        tag: '抽取事实',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '每条事实变成「意思向量」。',
        feedback: '语义相近的句子，向量夹角就小。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1],
        tag: '事实转向量',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '存进向量库。',
        feedback: '写笔记结束：条目彼此独立，关系在存储那一刻就丢了。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1],
        tag: '存入向量库',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '问题用同一个嵌入模型转向量。',
        feedback: '读笔记起点。',
        cls: '',
        arrows: [],
        layers: [1],
        tag: '问题转向量',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '取回余弦相似度最高的一批条目。',
        feedback: '条数不是越多越好：论文实测有效性在 60 条处达到峰值，此后进入平台。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '取 top-k',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '拼进提示，模型作答。',
        feedback: '问到「他们一起去过吗」就会答错——这源于写笔记时没有留下任何关系，只能靠问答模型现场自己推断。',
        cls: 'bad',
        arrows: ['api2chat'],
        layers: [1],
        tag: '一次作答',
        cost: 'cond',
      },
    ],
  },
  {
    key: 'graph',
    chip: '图记忆',
    steps: [
      {
        phase: 'write',
        desc: '第 1 次调用：抽取实体。',
        feedback: '级联调用的第 1 级。',
        cls: '',
        arrows: ['mem2api'],
        layers: [0],
        tag: '抽实体',
        trigger: '一个事件块到达即触发，之后四次调用级联执行',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '第 2 次调用：实体去重。',
        feedback: '级联调用的第 2 级。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1],
        tag: '实体去重',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '第 3 次调用：抽取关系，写成三元组。',
        feedback: '级联调用的第 3 级。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '抽关系',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '第 4 次调用：关系去重与矛盾检测。',
        feedback: '级联调用的第 4 级——每个事件块四次调用。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1],
        tag: '关系去重',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '写入图结构。',
        feedback: '写笔记结束：关系是显式的，但也是固化的。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1],
        tag: '写入图',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '从问题里定位实体，向外走 1~2 跳。',
        feedback: '读笔记起点：先找节点，再走路。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '走 1~2 跳',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '把子图翻译回文本。',
        feedback: '图的结构优势，最后还是要降维成文本。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '子图转文本',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '子图文本 + 条目 + 问题一起作答。',
        feedback: '这就是图记忆读得准、也错得久的原因。',
        cls: 'bad',
        arrows: ['api2chat'],
        layers: [1],
        tag: '一次作答',
        cost: 'cond',
      },
    ],
  },
  {
    key: 'structmem',
    chip: 'StructMem',
    steps: [
      {
        phase: 'write',
        desc: '一轮发言先归一化：写入来源时间戳，追加进感知缓冲。',
        feedback: '每轮都做，且不调用模型——真正的开销在后面。',
        cls: '',
        arrows: ['chat2mem'],
        layers: [0],
        tag: '每轮写入',
        cost: 'free',
      },
      {
        phase: 'write',
        desc: '感知缓冲累计超过 512 token，触发压缩与主题切分。',
        feedback: '先用 LLMLingua-2 压缩，再切成话题段。',
        cls: '',
        arrows: ['mem2api'],
        layers: [0],
        tag: '压缩并切段',
        trigger: '缓冲区满时触发',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '切出的段落进入短期缓冲；再累计满 512 token 才触发抽取。',
        feedback: '两道阈值串联，绝大多数轮次到不了模型。',
        cls: '',
        arrows: [],
        layers: [0],
        tag: '短期缓冲',
        cost: 'free',
      },
      {
        phase: 'write',
        desc: '双视角抽取：同一段内容发两次，一次要事实、一次要关系。',
        feedback: '两次调用分别取「发生了什么」与「谁和谁有关」。',
        cls: '',
        arrows: ['mem2api'],
        layers: [0],
        tag: '两次抽取',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '条目绑上来源时间戳，向量化后写入记忆库。',
        feedback: '时间戳让同一刻的两类条目能被重新拼成一个事件。',
        cls: 'good',
        arrows: ['api2mem'],
        layers: [1],
        tag: '条目入库',
        cost: 'cond',
      },
      {
        phase: 'write',
        desc: '跨事件巩固：按时间窗口取出一批待整理的条目。',
        feedback: '第二层「跨事件巩固」开始，它是离线的批处理。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '窗口取批',
        trigger: '从这步起画布转为紫色：以下步骤都在离线阶段成批跑，不在对话进行时发生',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '构造检索查询——注意这里用的不是用户问题。',
        feedback: '用「这一批的集体内容」去问记忆库，而不是用某一句话。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '整批编码',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '取回 top-15 语义种子。',
        feedback: '种子是「和这批内容最像的历史时刻」。',
        cls: '',
        arrows: [],
        layers: [1],
        tag: 'top-15 种子',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '按时间戳重建完整事件。',
        feedback: '这一步是时间锚定真正兑现的地方。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1],
        tag: '同刻重建',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '合成一段跨事件小结。',
        feedback: '小结里会出现单条条目里根本不存在的信息。',
        cls: 'good',
        arrows: ['api2mem'],
        layers: [1, 2],
        tag: '一次合成',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '小结单独入库。',
        feedback: '两套记忆并存：原始条目 + 更高层的小结。',
        cls: '',
        arrows: ['api2mem'],
        layers: [1, 2],
        tag: '摘要入库',
        cost: 'offline',
      },
      {
        phase: 'write',
        desc: '离线更新：去重与合并。',
        feedback: '写笔记到这里才真正收尾。',
        cls: 'good',
        arrows: ['api2mem'],
        layers: [1, 2],
        tag: '离线更新',
        cost: 'offline',
      },
      {
        phase: 'read',
        desc: '双线路检索。',
        feedback: '读笔记 = 捞碎片 + 捞一段已经写好的叙事。',
        cls: '',
        arrows: ['mem2api'],
        layers: [1, 2],
        tag: '60 条 + 5 段',
        trigger: '用户提问触发',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '小结按向量检索取回。',
        feedback: '把问题转成向量，在小结集合里做余弦相似度排序取前 5——与条目检索是同一套机制。',
        cls: '',
        arrows: [],
        layers: [2],
        tag: '向量检索',
        cost: 'cond',
      },
      {
        phase: 'read',
        desc: '拼提示并作答。',
        feedback: '读笔记结束。',
        cls: 'good',
        arrows: ['api2chat'],
        layers: [1, 2],
        tag: '一次作答',
        cost: 'cond',
      },
    ],
  },
];

// 不画横向图例：改为在确实存在触发的步骤上单独标注「触发原因」。

export const C1MemoryLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: number; step: number }>({ mode: 0, step: 0 });
  const [mode, setMode] = useState(0);
  const [step, setStep] = useState(0);

  const current = MODES[mode];
  const total = current.steps.length;
  const cur = current.steps[Math.min(step, total - 1)];
  const writeCount = current.steps.filter((s: StepDef) => s.phase === 'write').length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      const modeDef = MODES[s.mode];
      const st = Math.min(s.step, modeDef.steps.length - 1);
      const curStep = modeDef.steps[st];
      const accent = COST_COLOR[curStep.cost];
      clearScene(ctx, W, H, true);

      // 三个节点框
      fillRound(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 10, COL.white);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      roundRect(ctx, CHAT.x, CHAT.y, CHAT.w, CHAT.h, 10);
      ctx.stroke();

      fillRound(ctx, MEM.x, MEM.y, MEM.w, MEM.h, 10, COL.white);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      roundRect(ctx, MEM.x, MEM.y, MEM.w, MEM.h, 10);
      ctx.stroke();

      fillRound(ctx, API.x, API.y, API.w, API.h, 10, COL.white);
      ctx.strokeStyle = curStep.arrows.length > 0 ? COL.blue : COL.axis;
      ctx.lineWidth = 2;
      roundRect(ctx, API.x, API.y, API.w, API.h, 10);
      ctx.stroke();

      // 对话：一张照片卡代表这一轮发言
      drawPhoto(ctx, CHAT.x + 35, CHAT.y + 20, 100, 48, -0.02, COL.blue);

      // 记忆库内部：三层存储条
      const layerNames = ['缓冲', '条目', '小结'];
      LAYERS.forEach((ly, i) => {
        const on = curStep.layers.indexOf(i) >= 0;
        fillRound(ctx, MEM.x + 20, ly, MEM.w - 40, 16, 6, on ? accent : COL.axis);
        label(ctx, layerNames[i], MEM.x + 30, ly + 13, on ? COL.white : COL.muted, 'left', 13);
      });

      // 模型 API：表示 JSON 返回的内嵌白框
      drawAxisBox(ctx, API.x + 26, API.y + 22, API.w - 52, 44);
      label(ctx, '{ }', API.x + API.w / 2, API.y + 52, COL.blue, 'center', 20);

      // 四条通路
      const isOn = (a: Arrow) => curStep.arrows.indexOf(a) >= 0;
      drawArrow(ctx, 214, 128, 386, 128, isOn('chat2mem') ? accent : COL.axis, 7);
      drawArrow(ctx, 694, 124, 866, 124, isOn('mem2api') ? accent : COL.axis, 7);
      drawArrow(ctx, 866, 156, 694, 156, isOn('api2mem') ? accent : COL.axis, 7);
      drawArrow(ctx, 955, 236, 125, 236, isOn('api2chat') ? accent : COL.axis, 7);

      // 两个阶段条：写笔记（左）/ 翻笔记（右），无文字，只表状态
      ctx.save();
      const barY = 62;
      ctx.fillStyle = curStep.phase === 'write' ? accent : COL.axis;
      ctx.fillRect(300, barY, 96, 7);
      ctx.fillStyle = curStep.phase === 'read' ? accent : COL.axis;
      ctx.fillRect(668, barY, 96, 7);
      ctx.restore();

      // 节点名
      label(ctx, '对话轮', CHAT.x + CHAT.w / 2, 84, COL.ink, 'center', 18);
      label(ctx, '记忆库', MEM.x + MEM.w / 2, 84, COL.ink, 'center', 18);
      label(ctx, '模型 API', API.x + API.w / 2, 84, COL.ink, 'center', 18);

      // 当前通路上的 1 个短标签
      if (curStep.tag) {
        if (isOn('chat2mem')) label(ctx, curStep.tag, 300, 118, accent, 'center', 15);
        else if (isOn('mem2api')) label(ctx, curStep.tag, 780, 114, accent, 'center', 15);
        else if (isOn('api2mem')) label(ctx, curStep.tag, 780, 178, accent, 'center', 15);
        else label(ctx, curStep.tag, 540, 208, accent, 'center', 15);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickMode = (m: number): void => {
    stateRef.current.mode = m;
    stateRef.current.step = 0;
    setMode(m);
    setStep(0);
  };

  const go = (next: number): void => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    stateRef.current.step = clamped;
    setStep(clamped);
  };

  const jumpPhase = (p: Phase): void => {
    const idx = current.steps.findIndex((s: StepDef) => s.phase === p);
    if (idx >= 0) go(idx);
  };

  return (
    <div>
      <div className="chip-row">
        {MODES.map((m: ModeDef, i: number) => (
          <span
            key={m.key}
            className={`chip${i === mode ? ' selected' : ''}`}
            role="button"
            tabIndex={0}
            style={{ cursor: 'pointer' }}
            onClick={() => pickMode(i)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') pickMode(i);
            }}
          >
            {m.chip}
          </span>
        ))}
      </div>
      <div className="chip-row">
        <span
          className={`chip${cur.phase === 'write' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => jumpPhase('write')}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') jumpPhase('write');
          }}
        >
          写笔记（{writeCount} 步）
        </span>
        <span
          className={`chip${cur.phase === 'read' ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => jumpPhase('read')}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') jumpPhase('read');
          }}
        >
          翻笔记（{total - writeCount} 步）
        </span>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="step-label">
          {PHASE_LABEL[cur.phase]} · 第 {step + 1} 步 / 共 {total} 步
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === total - 1}
          onClick={() => go(step + 1)}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="step-desc" aria-live="polite">
        {cur.desc}
      </div>
      {cur.trigger ? (
        <div className="feedback" style={{ borderLeftColor: '#d97706' }}>
          <b>触发原因：</b>
          {cur.trigger}
        </div>
      ) : null}
      <div className={`feedback ${cur.cls}`}>{cur.feedback}</div>
    </div>
  );
};

export default C1MemoryLoop;

import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, C } from './studioKit';
import type { WidgetProps } from './registry';

// §8 模块 8.1：画室流程墙（P5 热点 + P2 播放步进；技术视图）
// 紧凑版：逻辑宽 760 贴合正文栏，画布内不再画详情面板（下方 feedback 已展示），自适应缩放。
const W = 760, H = 244;

type NodeId = 's1' | 's2' | 's3' | 's4' | 's5' | 'prompter' | 'diffuser' | 'judge';
const NODES: Record<NodeId, { x: number; y: number; label: string; detail: string }> = {
  s1: { x: 22, y: 42, label: '①全局语义', detail: 'Seed-VL 读全图：意图、场景、氛围、风格、光照；建立带 bbox 的元素清单' },
  s2: { x: 162, y: 42, label: '②逐元素细读', detail: '逐裁剪读属性与动作；Sapiens 的 133 个姿态关键点渲染成叠加图，帮 VLM 判定左右侧与关节' },
  s3: { x: 302, y: 42, label: '③几何专家', detail: 'DepthAnything V2 估计相对深度；SAM 2.1 提供掩码与遮挡线索' },
  s4: { x: 442, y: 42, label: '④汇编', detail: 'VLM 汇编语义与几何证据为完整 L10 SP；专家输出是约束而非照抄' },
  s5: { x: 582, y: 42, label: '⑤字段降级', detail: '按字段组确定性掩码 L10，得到 L5–L9 训练对' },
  prompter: { x: 162, y: 152, label: '提示器 π', detail: '用户请求 → 完整 SP；需在不违背明确请求的前提下合理补全' },
  diffuser: { x: 302, y: 152, label: '扩散器', detail: 'SP → 图像；骨干不变（BAGEL 校准 / Qwen-Image 系统）' },
  judge: { x: 442, y: 152, label: '评审', detail: '只看请求与渲染图，输出字段级意见；PASS 阈值 6/10（Figure 14）' },
};
const NW = 118, NH = 46;

export const M811: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<NodeId>('s1');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    // 自适应：显示宽度跟随栏宽收缩（逻辑坐标系不变，等比缩小）
    canvas.style.width = '100%';
    canvas.style.maxWidth = W + 'px';
    canvas.style.height = 'auto';
    clearScene(ctx, W, H);
    // 行标签
    ctx.fillStyle = C.muted; ctx.font = '600 12px "Microsoft YaHei", sans-serif';
    ctx.fillText('标注流水线（图像 → SP）', 22, 26);
    ctx.fillText('推理路径（请求 → 图像）', 22, 136);
    // 边
    const edges: [NodeId, NodeId][] = [
      ['s1', 's2'], ['s2', 's3'], ['s3', 's4'], ['s4', 's5'],
      ['prompter', 'diffuser'], ['diffuser', 'judge'],
    ];
    ctx.strokeStyle = C.border; ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
      const A = NODES[a], B = NODES[b];
      ctx.beginPath();
      ctx.moveTo(A.x + NW, A.y + NH / 2);
      ctx.lineTo(B.x - 2, B.y + NH / 2);
      ctx.stroke();
      // 箭头
      ctx.beginPath();
      ctx.moveTo(B.x - 2, B.y + NH / 2);
      ctx.lineTo(B.x - 9, B.y + NH / 2 - 4);
      ctx.lineTo(B.x - 9, B.y + NH / 2 + 4);
      ctx.closePath();
      ctx.fillStyle = C.border; ctx.fill();
    });
    // 评审 → 提示器 回环
    ctx.strokeStyle = C.border; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(NODES.judge.x + NW / 2, NODES.judge.y + NH);
    ctx.quadraticCurveTo(378, 236, NODES.prompter.x + NW / 2, NODES.prompter.y + NH);
    ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.fillText('字段级修改意见', 330, 226);
    // 节点
    (Object.keys(NODES) as NodeId[]).forEach((id) => {
      const n = NODES[id];
      const on = sel === id;
      ctx.fillStyle = on ? 'rgba(39,68,110,0.12)' : C.sheet;
      ctx.fillRect(n.x, n.y, NW, NH);
      ctx.strokeStyle = on ? C.blue : C.border;
      ctx.lineWidth = on ? 2.5 : 1.5;
      ctx.strokeRect(n.x, n.y, NW, NH);
      ctx.fillStyle = C.text;
      ctx.font = (on ? '700 ' : '') + '13px "Microsoft YaHei", sans-serif';
      ctx.fillText(n.label, n.x + (NW - ctx.measureText(n.label).width) / 2, n.y + 28);
    });
  }, [sel, playing]);

  useEffect(() => {
    if (!playing) return;
    const seq: NodeId[] = ['s1', 's2', 's3', 's4', 's5'];
    let i = 0;
    setSel('s1');
    const timer = setInterval(() => {
      i += 1;
      if (i >= seq.length) { setPlaying(false); clearInterval(timer); return; }
      setSel(seq[i]);
    }, 900);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="widget">
      <canvas ref={ref} />
      <div className="ctrl-row">
        {(Object.keys(NODES) as NodeId[]).map((id) => (
          <button key={id} className={sel === id ? 'chip chip-on' : 'chip'} onClick={() => setSel(id)}>
            {NODES[id].label}
          </button>
        ))}
        <button className="chip chip-on" onClick={() => setPlaying(true)}>播放流程</button>
      </div>
      <div className="feedback fb-blue">{NODES[sel].detail}</div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 390;
type View = 'budget' | 'table1' | 'protocol';
type ToolId = 'code' | 'js' | 'scan' | 'html' | 'read';

const TOOLS = [
  { id: 'code' as const, label: 'code_run', limit: 10000, method: '首尾各保留一半，中段替换为省略号', color: C.blue },
  { id: 'js' as const, label: 'web_execute_js', limit: 8000, method: '完整结果可落盘；历史只保留短预览', color: C.green },
  { id: 'scan' as const, label: 'web_scan 文本', limit: 10000, method: '文本观察进入消息前先限长', color: C.orange },
  { id: 'html' as const, label: 'web_scan HTML', limit: 35000, method: '按 DOM 子树裁剪，不是简单首尾截断', color: C.purple },
  { id: 'read' as const, label: 'file_read', limit: 20000, method: '约 1,280 字符/行，单次总量不超过 20,000', color: C.red },
];

export const ModThresholds: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View; id: ToolId }>({ view: 'budget', id: 'code' });
  const [view, setView] = useState<View>('budget');
  const [id, setId] = useState<ToolId>('code');
  const current = TOOLS.find((tool) => tool.id === id)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const state = stateRef.current;
      const tool = TOOLS.find((item) => item.id === state.id)!;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);

      if (state.view === 'budget') {
        drawLabel(ctx, '字符域预算：C_H = Σ len(m)，B = α · W_tokens', 22, 34, C.text, 14);
        fillRR(ctx, 22, 58, 516, 92, 9, '#fffef8');
        strokeRR(ctx, 22, 58, 516, 92, 9, C.orange, 2.4);
        drawLabel(ctx, '触发条件  C_H > B', 42, 88, C.orange, 15);
        drawLabel(ctx, 'α ≈ 3 字符/token；W_tokens 的紧凑目标约为 30k，而不是依赖 1M 标称窗口。', 42, 118, C.muted, 11);

        fillRR(ctx, 22, 172, 248, 150, 10, '#fffef8');
        strokeRR(ctx, 22, 172, 248, 150, 10, C.green, 2.3);
        drawLabel(ctx, 'ASCII 主导内容', 48, 206, C.green, 14);
        drawLabel(ctx, '每 token 约 4 字符', 48, 236, C.text, 12);
        drawLabel(ctx, 'α=3 略低估字符效率', 48, 262, C.muted, 11);
        drawLabel(ctx, '结果：偏早淘汰，更保守', 48, 288, C.green, 11);

        fillRR(ctx, 290, 172, 248, 150, 10, '#fffef8');
        strokeRR(ctx, 290, 172, 248, 150, 10, C.red, 2.3);
        drawLabel(ctx, 'CJK 内容', 316, 206, C.red, 14);
        drawLabel(ctx, '每字符约消耗 1–2 token', 316, 236, C.text, 12);
        drawLabel(ctx, 'α=3 低估真实 token 占用', 316, 262, C.muted, 11);
        drawLabel(ctx, '结果：可能延迟淘汰并溢出', 316, 288, C.red, 11);
      } else if (state.view === 'table1') {
        drawLabel(ctx, 'Table 1 · 进入 LLM 历史的单条输出上限', 22, 34, C.text, 14);
        TOOLS.forEach((item, i) => {
          const y = 62 + i * 46;
          const on = item.id === tool.id;
          drawLabel(ctx, item.label, 22, y + 14, on ? item.color : C.muted, 12);
          bar(ctx, 168, y, 286, 16, item.limit / 35000, on ? item.color : C.axis);
          drawLabel(ctx, item.limit.toLocaleString(), 468, y + 14, on ? item.color : C.muted, 11);
        });
        fillRR(ctx, 22, 304, 516, 50, 8, '#fffef8');
        strokeRR(ctx, 22, 304, 516, 50, 8, tool.color, 2);
        drawLabel(ctx, tool.method, 38, 335, tool.color, 12);
      } else {
        drawLabel(ctx, '协议边界：不是所有路径都压缩工具 schema', 22, 34, C.text, 14);
        fillRR(ctx, 22, 64, 248, 196, 10, '#fffef8');
        strokeRR(ctx, 22, 64, 248, 196, 10, C.green, 2.5);
        drawLabel(ctx, '文本协议路径', 70, 100, C.green, 15);
        drawLabel(ctx, '若工具定义相对上轮未变', 48, 136, C.text, 12);
        drawLabel(ctx, '完整 schema 可替换为短提醒', 48, 164, C.muted, 11);
        drawLabel(ctx, '固定轮次或提示过长时重发', 48, 192, C.muted, 11);
        drawLabel(ctx, '防止模型遗忘精确格式', 48, 220, C.muted, 11);

        fillRR(ctx, 290, 64, 248, 196, 10, '#fffef8');
        strokeRR(ctx, 290, 64, 248, 196, 10, C.red, 2.5);
        drawLabel(ctx, 'Native API 路径', 338, 100, C.red, 15);
        drawLabel(ctx, '每次调用需发送完整工具定义', 316, 136, C.text, 12);
        drawLabel(ctx, 'schema elision 不适用于该路径', 316, 164, C.muted, 11);
        drawLabel(ctx, '优化只作用于文本协议', 316, 192, C.muted, 11);
        drawLabel(ctx, '不得把它说成全局默认行为', 316, 220, C.red, 11);

        fillRR(ctx, 22, 286, 516, 64, 9, C.leather);
        drawLabel(ctx, '落盘 vs 进上下文', 214, 310, '#fff', 13);
        drawLabel(ctx, 'web_execute_js 在 save_to_file 时完整结果写磁盘，历史只保留短预览。', 52, 334, '#e2e8f0', 11);
      }
    });
  }, []);

  const setActiveView = (next: View) => {
    stateRef.current.view = next;
    setView(next);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${view === 'budget' ? 'selected' : ''}`} onClick={() => setActiveView('budget')}>字符预算</button>
        <button className={`chip ${view === 'table1' ? 'selected' : ''}`} onClick={() => setActiveView('table1')}>Table 1 阈值</button>
        <button className={`chip ${view === 'protocol' ? 'selected' : ''}`} onClick={() => setActiveView('protocol')}>协议边界</button>
      </div>
      {view === 'table1' ? (
        <div className="chip-row">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`chip ${id === tool.id ? 'selected' : ''}`}
              onClick={() => {
                stateRef.current.id = tool.id;
                setId(tool.id);
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className={`feedback ${view === 'budget' ? '' : 'good'}`}>
        {view === 'budget'
          ? 'α≈3 是启发式：ASCII 下偏早淘汰更安全；CJK 下可能延迟淘汰。这是论文明确写出的误差模式，不是实现细节省略。'
          : view === 'table1'
            ? `${current.method}。这些阈值约束的是进入模型上下文的内容，不是磁盘上的完整产物。`
            : 'tool-schema elision 只用于文本协议；native API 每次仍需完整工具定义。不能把这一优化说成所有后端都生效。'}
      </div>
    </div>
  );
};

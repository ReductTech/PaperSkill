import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawFlow, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 340;
type View = 'prompt' | 'policy' | 'evidence';
const SYSTEMS = [
  { label: 'Claude Code', count: 53, color: C.red },
  { label: 'OpenClaw', count: 18, color: C.orange },
  { label: 'GenericAgent', count: 9, color: C.green },
] as const;
const COPY: Record<View, string> = {
  prompt: 'Prompt 层成本：工具名、描述和参数 schema 在任务开始前就占据上下文。Table 3 只报告源码层数量，不能换算为精确 token。',
  policy: 'Policy 层成本：更大的动作空间增加近似工具之间的选择歧义，规划更脆弱，并可能引发无效调用与重试。',
  evidence: 'Table 4（五个长程任务，Claude Sonnet 4.6）：GA 与 Claude Code 都是 100% 成功，但 GA 使用更少 token、请求和工具调用。',
};

export const ModToolOverhead: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View }>({ view: 'prompt' });
  const [view, setView] = useState<View>('prompt');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const current = stateRef.current.view;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawLabel(ctx, current === 'evidence' ? '实现结果：成功率不降，交互开销下降' : '工具膨胀的两层系统成本', 24, 34, C.text, 15);

      if (current === 'prompt') {
        SYSTEMS.forEach((system, i) => {
          const y = 66 + i * 62;
          drawLabel(ctx, system.label, 24, y + 16, system.color, 12);
          bar(ctx, 142, y, 350, 22, system.count / 53, system.color);
          drawLabel(ctx, `${system.count}`, 506, y + 16, system.color, 13);
        });
        fillRR(ctx, 24, 258, 512, 46, 7, '#fffef8');
        strokeRR(ctx, 24, 258, 512, 46, 7, C.blue, 2);
        drawLabel(ctx, '图示为源码层接口规模：53 个内置工具 / 18 个工具工厂 / 9 个完整原子工具', 38, 279, C.blue, 11);
        drawLabel(ctx, '运行时 schema 长度受配置、权限、插件与 native API 行为影响，论文未给出精确 token。', 38, 296, C.muted, 10);
      } else if (current === 'policy') {
        const items = [
          { title: '接口数量', sub: 'schema 与说明增加', color: C.red },
          { title: '动作空间', sub: '候选工具更多', color: C.orange },
          { title: '选择歧义', sub: '重叠功能难区分', color: C.purple },
          { title: '无效交互', sub: '错误调用与重试', color: C.red },
        ];
        items.forEach((item, i) => {
          const x = 20 + i * 136;
          fillRR(ctx, x, 92, 116, 76, 9, '#fffef8');
          strokeRR(ctx, x, 92, 116, 76, 9, item.color, 2);
          drawLabel(ctx, item.title, x + 20, 121, item.color, 13);
          drawLabel(ctx, item.sub, x + 16, 148, C.muted, 11);
          if (i < items.length - 1) drawFlow(ctx, { x: x + 116, y: 130 }, { x: x + 136, y: 130 }, now, item.color, 2.8, 4);
        });
        fillRR(ctx, 74, 220, 412, 64, 9, C.leather);
        drawLabel(ctx, 'GA 的设计条件', 220, 244, '#fff', 13);
        drawLabel(ctx, '原子性：每个工具不可再分且不重叠', 100, 266, '#e2e8f0', 11);
        drawLabel(ctx, '组合泛化：复杂能力来自原语序列，而非接口枚举', 282, 266, '#e2e8f0', 11);
      } else {
        const rows = [
          { label: 'Total Tokens', ga: 188829, cc: 537413, suffix: '' },
          { label: 'Requests', ga: 11.0, cc: 32.6, suffix: '' },
          { label: 'Tool Calls', ga: 12.8, cc: 22.6, suffix: '' },
        ];
        rows.forEach((row, i) => {
          const y = 70 + i * 72;
          drawLabel(ctx, row.label, 24, y + 14, C.text, 12);
          bar(ctx, 132, y, 320, 16, row.ga / row.cc, C.green);
          drawLabel(ctx, `GA ${row.ga.toLocaleString()}`, 462, y + 13, C.green, 11);
          bar(ctx, 132, y + 26, 320, 16, 1, C.axis);
          drawLabel(ctx, `CC ${row.cc.toLocaleString()}`, 462, y + 39, C.muted, 11);
        });
        drawLabel(ctx, 'Success：GA 100% · Claude Code 100% · OpenClaw 80%', 132, 298, C.blue, 12);
      }
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {([
          ['prompt', 'Prompt 层'],
          ['policy', 'Policy 层'],
          ['evidence', 'Table 4 证据'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`chip ${view === key ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current.view = key;
              setView(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${view === 'evidence' ? 'good' : ''}`}>{COPY[view]}</div>
    </div>
  );
};

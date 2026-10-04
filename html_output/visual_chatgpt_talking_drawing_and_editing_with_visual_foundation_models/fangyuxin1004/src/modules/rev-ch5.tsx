import React, { useState } from 'react';
import { Scene, colors, photo, panel, line, dot, label } from './vc-visual-kit';

const modes = [
  { name: '纯文字问题', query: '解释深度图有什么作用', tool: '无需视觉工具', note: '已有文字足够回答时，直接组织文字回复；不凭空启动视觉处理。' },
  { name: '询问图片', query: '这朵花是什么颜色？', tool: '视觉问答 / 图像描述', note: '先让视觉工具观察图片，再把“黄色花朵”等文字观察交给语言控制器组织回答。' },
  { name: '编辑图片', query: '把黄色花朵改成红色', tool: '图像编辑工具', note: '把图片与编辑要求交给视觉工具；语言控制器读取执行反馈，再向用户返回编辑结果。' },
];
function arrow(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, t: number) {
  line(c, x1, y1, x2, y2, color, 2);
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(c, x2, y2, x2 - 10 * Math.cos(a - .5), y2 - 10 * Math.sin(a - .5), color, 2);
  line(c, x2, y2, x2 - 10 * Math.cos(a + .5), y2 - 10 * Math.sin(a + .5), color, 2);
  const p = ((t * .38) % 1 + 1) % 1;
  dot(c, x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, 4, color);
}
export default function QueryManagement() {
  const [mode, setMode] = useState(1);
  const selected = modes[mode];
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
      {modes.map((item, i) => <button key={item.name} type="button" aria-pressed={mode === i} onClick={() => setMode(i)} style={{ padding: '10px 18px', borderRadius: 8, border: `1px solid ${mode === i ? colors.blue : colors.border}`, background: mode === i ? colors.blue : '#fff', color: mode === i ? '#fff' : colors.ink, cursor: 'pointer' }}>{item.name}</button>)}
    </div>
    <Scene height={360} animate label={`用户查询管理：${selected.name}，图片流向视觉工具，文字观察返回语言控制器`} draw={(c, t) => {
      panel(c, 24, 22, 280, 92); label(c, '用户文字', 42, 51, colors.blue, 19); label(c, selected.query, 42, 84, colors.ink, 17);
      panel(c, 372, 22, 270, 92, '#fff', colors.purple); label(c, 'Prompt Manager', 390, 51, colors.purple, 21); label(c, mode ? '整理要求 + 提醒使用视觉工具' : '整理文字问题', 390, 84, colors.ink, 16);
      panel(c, 752, 22, 300, 92, '#fff', colors.blue); label(c, '语言控制器', 773, 51, colors.blue, 21); label(c, mode ? '读文字 · 选择下一步工具' : '根据文字上下文组织回复', 773, 84, colors.ink, 17);
      arrow(c, 304, 68, 370, 68, colors.purple, t); arrow(c, 642, 68, 750, 68, colors.purple, t - .3);
      if (mode) {
        panel(c, 24, 177, 280, 139); photo(c, 44, 189, 112, 113); label(c, '用户图片', 174, 220, colors.blue, 18); label(c, '视觉输入', 174, 250, colors.muted, 16);
        const scan = 194 + ((t * 25) % 96); line(c, 53, scan, 147, scan, colors.green, 2);
        panel(c, 372, 177, 270, 139, '#fff', colors.green); label(c, selected.tool, 390, 211, colors.green, 20); label(c, '实际读取 / 处理图片', 390, 245, colors.ink, 18); label(c, mode === 1 ? '产生文字观察' : '产生新图像与执行反馈', 390, 281, colors.muted, 17);
        panel(c, 752, 205, 300, 111, '#fff', colors.orange); label(c, '整理工具输出', 773, 237, colors.support, 20); label(c, mode === 1 ? '观察：“黄色花朵”' : '反馈：“编辑工具已返回结果”', 773, 270, colors.ink, 16);
        arrow(c, 304, 257, 370, 257, colors.green, t);
        arrow(c, 779, 116, 644, 176, colors.blue, t - .5); label(c, '工具调用指令', 646, 148, colors.blue, 15);
        arrow(c, 642, 260, 750, 260, colors.orange, t - 1);
        arrow(c, 988, 203, 988, 116, colors.orange, t - 1.4); label(c, '文字反馈', 912, 161, colors.support, 15);
      } else {
        panel(c, 372, 199, 680, 108); label(c, '文字回复', 394, 233, colors.green, 20); label(c, '深度图用灰度或数值表达远近结构，可用作图像生成的条件。', 394, 272, colors.ink, 18);
        arrow(c, 894, 116, 894, 197, colors.green, t);
        label(c, '本次没有图片输入', 48, 244, colors.muted, 20);
      }
    }} />
    <p aria-live="polite" style={{ margin: '12px 0 0', lineHeight: 1.8 }}>{selected.note}</p>
  </div>;
}

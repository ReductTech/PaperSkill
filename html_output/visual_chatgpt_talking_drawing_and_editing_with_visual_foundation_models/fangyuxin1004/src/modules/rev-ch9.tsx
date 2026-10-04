import React, { useState } from 'react';
import { Scene, colors, panel, line, dot, label } from './vc-visual-kit';

const cases = [
  { name: '完整约束', removed: '', stop: 4, title: '工具链有可理解、可执行的约定', detail: '控制器能根据能力说明选工具，按约定格式调用，再使用实际观察形成回答。完整提示也不保证每次成功。', steps: ['识别所需能力', '选择视觉工具', '构造合法调用', '读取真实观察'], outcome: '具备形成有依据回答的条件' },
  { name: '弱化能力说明', removed: '工具名称 / 用途', stop: 1, title: '能力相近时，选择可能偏离意图', detail: '若无法区分“预测深度”与“按深度生成”，控制器可能把分析工具当作生成工具；后续步骤就得不到需要的结果。', steps: ['理解红花请求', '深度分析？生成？', '等待正确工具', '等待有效观察'], outcome: '可能选错工具，任务无法正确衔接' },
  { name: '移除输入输出约定', removed: '输入 / 输出说明', stop: 2, title: '选对工具，也可能传错参数', detail: '条件生成需要深度条件与文字描述。如果输入输出语义不清，控制器可能遗漏条件，或把上一步输出传到错误的位置。', steps: ['识别生成需求', '选择条件生成', '深度条件缺失？', '等待有效观察'], outcome: '可能出现参数错误或工具衔接失败' },
  { name: '弱化严格格式', removed: '结构化调用要求', stop: 2, title: '自然语言意图不等于可执行调用', detail: '工具执行层需要解析调用。即使意图正确，混入解释文字或缺少必需字段，也可能导致调用无法执行。', steps: ['识别所需能力', '选择视觉工具', '调用格式不合法？', '没有执行结果'], outcome: '可能卡在解析与执行之间' },
  { name: '弱化观察忠实性', removed: '忠实于工具观察', stop: 3, title: '流畅的回答可能超出视觉证据', detail: '当观察只支持“黄色花朵”时，回答不应自行断言具体品种或其他未观察到的细节。已有语言知识不能替代这次工具观察。', steps: ['提出识别请求', '调用视觉问答', '观察：黄色花朵', '回答增添细节？'], outcome: '可能把推测表述成已观察到的事实' },
];
export default function RevisionChapter9() {
  const [active, setActive] = useState(0);
  const item = cases[active];
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} aria-label="对照提示约束">{cases.map((it, i) => <button key={it.name} type="button" aria-pressed={active === i} onClick={() => setActive(i)} style={{ padding: '9px 13px', borderRadius: 8, border: `1px solid ${active === i ? colors.blue : colors.border}`, background: active === i ? '#e5ecf4' : '#fff', color: colors.ink }}>{it.name}</button>)}</div>
    <Scene height={300} animate label={`提示约束对照：${item.name}`} draw={(c, time) => {
      label(c, '观察哪一个环节失去约束', 25, 32, colors.blue, 20);
      label(c, active ? `当前弱化：${item.removed}` : '当前保留：能力说明、输入输出、调用格式与观察约束', 25, 62, colors.ink, 16);
      const p = (time * .24) % 1;
      item.steps.forEach((step, i) => {
        const x = 25 + i * 267;
        const warning = active > 0 && i === item.stop;
        const waiting = active > 0 && i > item.stop;
        const color = warning ? colors.orange : waiting ? colors.muted : colors.blue;
        panel(c, x, 108, 226, 90, warning ? '#fff0df' : waiting ? '#f0f2f1' : '#fff', color);
        label(c, ['意图', '工具', '执行', '回答'][i], x + 15, 137, color, 16);
        label(c, step, x + 15, 172, color, 17);
        if (warning) {
          const radius = 10 + 4 * (Math.sin(time * 3) + 1) / 2;
          c.beginPath(); c.arc(x + 205, 128, radius, 0, Math.PI * 2); c.strokeStyle = colors.orange; c.lineWidth = 2; c.stroke();
          label(c, '?', x + 201, 134, colors.orange, 18);
        }
        if (i < 3) {
          line(c, x + 227, 153, x + 265, 153, waiting || warning ? colors.border : colors.blue, 2);
          if (!waiting && !warning) dot(c, x + 230 + 31 * p, 153, 5, colors.blue);
        }
      });
      label(c, item.outcome, 25, 248, active ? colors.orange : colors.green, 20);
    }} />
    <p role="status" style={{ margin: '12px 0 0', lineHeight: 1.8 }}><strong>{item.title}。</strong>{item.detail}</p>
    <p style={{ color: colors.muted, lineHeight: 1.7, margin: '8px 0 0' }}>视觉问答、图像编辑与多步骤生成展示了可完成的任务类型；移除提示约束的案例对照帮助定位失败原因。少量案例不能推出通用性能排名。</p>
  </div>;
}

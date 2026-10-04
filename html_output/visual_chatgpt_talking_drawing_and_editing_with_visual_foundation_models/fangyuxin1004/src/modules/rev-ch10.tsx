import React, { useState } from 'react';
import { Scene, colors, photo, panel, line, dot, label } from './vc-visual-kit';

const limits = [
  { name: '误差会传递', title: '协作系统继承每个组件的能力边界', body: '视觉模型看错内容，或语言控制器选错步骤，都可能把错误传给后续工具。多工具组合本身并不自动纠正错误。', boundary: '一次顺畅的工具链不等于一次正确的工具链。' },
  { name: '提示维护成本', title: '增加工具，也增加区分能力的工作', body: '工具名称、用途、输入输出与调用约束需要人工设计。能力相近的工具尤其需要清晰描述；描述与真实能力不一致会影响选择和执行。', boundary: '接入新能力需要持续维护提示与接口约定。' },
  { name: '串行调用延迟', title: '下一步依赖上一步，就必须等待', body: '深度预测完成后才能进行深度条件生成，生成完成后才能继续风格转换。多次模型调用与结果传递会积累等待时间。', boundary: '多次串行调用会累积等待时间。' },
  { name: '有限上下文', title: '工具目录与对话历史共享有限容量', body: '当候选工具不断增加，工具描述与历史记录会竞争语言模型的上下文容量。先筛选候选工具是一种可探索的扩展方向，不是这里已经实现的保证。', boundary: '更多工具并不意味着可以无限扩展完整提示。' },
  { name: '隐私与外部 API', title: '调用远程视觉服务可能传出图像', body: '图像可能随远程 API 调用离开本地环境。是否适合处理敏感内容，需要结合实际服务的数据流、访问控制与数据处理规则判断。', boundary: '工具可调用，不等于数据天然私密或已获妥善保护。' },
];
export default function RevisionChapter10() {
  const [active, setActive] = useState(0);
  const item = limits[active];
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} aria-label="探索五类局限">{limits.map((it, i) => <button key={it.name} type="button" aria-pressed={active === i} onClick={() => setActive(i)} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${active === i ? colors.blue : colors.border}`, background: active === i ? '#e5ecf4' : '#fff', color: colors.ink }}>{it.name}</button>)}</div>
    <Scene height={345} animate label={`局限性可视化：${item.name}`} draw={(c, time) => {
      const p = (time * .17) % 1;
      label(c, item.title, 25, 33, colors.blue, 22);
      if (active === 0) {
        const nodes = [{ x: 35, title: '视觉观察', desc: '识别内容可能有误' }, { x: 382, title: '语言决策', desc: '根据观察选择动作' }, { x: 729, title: '后续生成', desc: '可能沿用错误前提' }];
        nodes.forEach((n, i) => {
          const affected = p * 3 >= i;
          panel(c, n.x, 104, 292, 100, affected ? '#fff0ea' : '#fff', affected ? colors.orange : colors.border);
          label(c, n.title, n.x + 24, 141, affected ? colors.orange : colors.blue, 22);
          label(c, n.desc, n.x + 24, 178, colors.ink, 18);
          if (i < 2) line(c, n.x + 292, 153, n.x + 347, 153, colors.orange, 3);
        });
        dot(c, 50 + p * 951, 228, 7, colors.orange);
        line(c, 50, 228, 1001, 228, '#e6cabc', 1);
        label(c, '错误前提可以沿调用链继续传播', 344, 270, colors.orange, 19);
      }
      if (active === 1) {
        const titles = ['描述画面', '预测深度', '按深度生成'];
        titles.forEach((name, i) => {
          const x = 40 + i * 348;
          panel(c, x, 87, 304, 152, '#fff', colors.border);
          label(c, name, x + 18, 119, colors.blue, 20);
          ['用途必须清楚', '输入与输出可衔接', '格式与真实接口一致'].forEach((v, j) => {
            const done = (time * .45 + i * .6) % 4 > j;
            dot(c, x + 21, 147 + j * 31, 4, done ? colors.green : colors.border);
            label(c, v, x + 35, 152 + j * 31, done ? colors.ink : colors.muted, 16);
          });
        });
        label(c, '分析图像与生成图像是不同能力，需要分别说明', 263, 277, colors.orange, 18);
      }
      if (active === 2) {
        const stage = Math.min(2, Math.floor(p * 3));
        const fraction = p * 3 - stage;
        const names = ['深度预测', '条件生成', '风格转换'];
        names.forEach((name, i) => {
          const x = 45 + i * 347;
          panel(c, x, 88, 298, 132, '#fff', i === stage ? colors.blue : colors.border);
          label(c, name, x + 25, 124, colors.blue, 21);
          label(c, i < stage ? '结果已就绪' : i === stage ? '正在执行' : '等待上一步结果', x + 25, 158, i < stage ? colors.green : colors.muted, 17);
          panel(c, x + 22, 181, 254, 13, '#e5e9e1', '#e5e9e1');
          const fill = i < stage ? 1 : i === stage ? fraction : 0;
          if (fill > 0) { c.fillStyle = i < stage ? colors.green : colors.blue; c.fillRect(x + 22, 181, 254 * fill, 13); }
          if (i < 2) line(c, x + 299, 145, x + 342, 145, colors.blue, 2);
        });
        line(c, 47, 261, 1035, 261, colors.border, 3);
        line(c, 47, 261, 47 + 988 * p, 261, colors.orange, 4);
        dot(c, 47 + 988 * p, 261, 6, colors.orange);
        label(c, '等待逐步累积', 460, 293, colors.orange, 17);
      }
      if (active === 3) {
        panel(c, 43, 84, 682, 176, '#fff', colors.blue);
        label(c, '有限的文本上下文', 61, 112, colors.blue, 19);
        panel(c, 62, 132, 248, 39, '#e1eaf4', '#e1eaf4');
        label(c, '系统原则 · 当前请求 · 历史', 73, 157, colors.blue, 15);
        const count = 2 + Math.floor(p * 10);
        for (let i = 0; i < Math.min(count, 8); i++) {
          const x = 63 + (i % 4) * 157, y = 187 + Math.floor(i / 4) * 36;
          panel(c, x, y, 143, 28, '#e5edda', '#b5c8a5');
          label(c, '工具能力说明', x + 15, y + 20, colors.dark, 15);
        }
        line(c, 727, 174, 786, 174, colors.orange, 2);
        label(c, count > 8 ? '目录继续增长' : '逐渐加入工具', 800, 148, colors.orange, 21);
        label(c, count > 8 ? '完整描述超出容量' : '可用空间逐渐减少', 800, 182, colors.ink, 18);
        if (count > 8) {
          const wave = (Math.sin(time * 3) + 1) / 2;
          panel(c, 796, 208, 235, 41, '#fff0df', colors.orange);
          label(c, '需要取舍与扩展策略', 811, 235, colors.orange, 17);
          dot(c, 772, 225, 5 + wave * 3, colors.orange);
        }
        label(c, '候选工具预筛选：可探索的扩展方向', 285, 297, colors.ink, 18);
      }
      if (active === 4) {
        panel(c, 35, 80, 345, 188, '#fff', colors.border);
        label(c, '本地使用环境', 122, 110, colors.blue, 20);
        photo(c, 145, 125, 118, 121, 'yellow');
        panel(c, 719, 80, 325, 188, '#e9eef4', colors.blue);
        label(c, '远程视觉 API', 807, 119, colors.blue, 21);
        label(c, '外部服务接收并处理输入', 754, 171, colors.ink, 18);
        label(c, '处理规则取决于实际服务', 754, 207, colors.muted, 17);
        c.setLineDash([7, 6]); line(c, 550, 65, 550, 288, colors.orange, 2); c.setLineDash([]);
        line(c, 381, 166, 718, 166, colors.blue, 2);
        for (let i = 0; i < 3; i++) { const q = (time * .25 + i / 3) % 1; panel(c, 383 + q * 311, 156, 19, 19, '#e4bb62', '#e4bb62'); }
        line(c, 718, 217, 381, 217, colors.green, 2);
        dot(c, 710 - 320 * ((time * .25) % 1), 217, 5, colors.green);
        label(c, '图像输入', 474, 144, colors.blue, 17);
        label(c, '结果返回', 474, 247, colors.green, 17);
        label(c, '图像可能跨越本地边界', 414, 311, colors.orange, 19);
      }
      if (active !== 4) label(c, item.boundary, 25, 330, colors.muted, 15);
    }} />
    <p role="status" style={{ margin: '12px 0 0', lineHeight: 1.8 }}><strong>{item.name}：</strong>{item.body} <strong>{item.boundary}</strong></p>
    <p style={{ padding: '12px 16px', margin: '14px 0 0', borderLeft: `3px solid ${colors.orange}`, background: '#fff7ec', lineHeight: 1.8 }}><strong>进一步的方向：</strong>让系统主动核对“用户意图”和“输出结果”是否一致，再决定是否修正。这属于待探索的自纠正能力；额外检查和重试也会增加调用次数与等待时间。</p>
  </div>;
}

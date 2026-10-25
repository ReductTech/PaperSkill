import { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Feedback, Frame } from './pvKit';
import { RetrievalDiagram } from './flow-diagrams';

type ObjectId = 'core' | 'semantic' | 'episodic' | 'procedural' | 'profile' | 'history';
type MemoryObject = { id: ObjectId; label: string; definition: string; format: string; timing: string; usage: string; sample: string; read: string; write: string; feedback: string };
const objects: MemoryObject[] = [
  { id: 'core', label: 'Core', definition: 'Human block 保存事实属性（包含姓名）；Persona block 保存用户身份、角色，以及对模型交互风格与行为的明确要求。', format: '可变的键值资料；此处 Persona block 与单独的 Big Five P 不是同一个对象。', timing: '会话级整合，保留最新版本；离线实现遇到跨 60 分钟的新输入时触发上一会话更新。', usage: '每轮回答都可使用。', sample: 'Human block：姓名=小林；正在练习绘画。此句只是保存格式的教学例子。', read: 'Core → 当前生成上下文', write: '会话整合 → 更新 Core 当前版本 → 后续回答', feedback: 'Core 是每轮可用的资料；更新用户资料不等于训练模型权重。' },
  { id: 'semantic', label: 'Semantic', definition: '从交互中提取的事实与视觉概念等语义信息。', format: '提取文本，或描述与图像 crop；同时记录关键词和时间戳，抽象视觉偏好可用文本表示。', timing: '每轮判断是否新增；追加保存，保留已有条目。', usage: '按需检索相关事实或概念，默认 top-k=4。', sample: '教学样例：“用户在练习水彩”；具体图像对象可附裁剪图。', read: '检索条件 → Semantic → 相关事实 / 视觉概念 → 回答', write: '逐轮信息抽取 → 判断是否追加 Semantic 条目', feedback: 'Semantic 保存提取的信息。图像 crop 与描述是表示方式，不是新增的模型融合层。' },
  { id: 'episodic', label: 'Episodic', definition: '围绕话题组织具体交互事件，并指向有关的原始对话。', format: '话题摘要、关键词与轮次索引 → 原始图文；完整原图仍由 History 保留。', timing: '会话级话题切分后追加条目；当前方法尚未解决跨时间事件的关联与合并。', usage: '按需找到有关轮次，再访问相应原始图文，默认 top-k=2。', sample: '教学样例：“湖边绘画讨论” → 第 18–20 轮 → 当时文本与完整图片。', read: '检索条件 → 话题摘要 → 轮次索引 → History 原始图文 → 回答', write: '会话话题切分 → 摘要与轮次索引 → 追加 Episodic 条目', feedback: 'Episodic 的关键关系是“摘要—索引—原始图文”。它不把整段历史替换成一条摘要。' },
  { id: 'procedural', label: 'Procedural', definition: '用户长期目标与反复出现的日常习惯，用来指导持续的个性化交互。', format: '可变的键值资料；这里不是程序代码或 Agent 操作工具。', timing: '会话级整合，保留最新版本；离线实现遇到跨 60 分钟的新输入时触发上一会话更新。', usage: '按需检索相关目标与习惯，默认 top-k=2。', sample: '教学样例：“这段时间希望放慢绘画练习节奏”。', read: '检索条件 → Procedural → 相关目标 / 习惯 → 回答', write: '会话整合 → 更新 Procedural 当前版本 → 后续回答', feedback: '这里的 Procedural 指用户目标与习惯等资料，不应借名称扩展成通用 Agent 执行记忆。' },
  { id: 'profile', label: '人格 P', definition: '单独保存的 Big Five 人格状态，由模型推断并通过 PEM 平滑更新。', format: '五维浮点状态；本轮推断为 1–5 整数向量；更新后的数值转为文本化人格描述。', timing: '每轮回答后根据 PEM 更新；全中性向量跳过。', usage: '与 Core 一起通过结构化 prompt 提供；Fig.16 列出用户资料、五维分数、近期对话和当前输入。', sample: '教学样例：p=(3.2, 3.4, 2.8, 3.6, 2.9)，并非真实用户人格测量。', read: '已有状态 → 文本化人格 P + Core → 结构化 prompt / 当前上下文 → 回答', write: '交互 → 本轮人格推断 → PEM → 数值状态与文本化 P', feedback: 'P 不是第五类 memory，也不是 Core 中的 Persona block。这里平滑模型估计，不验证心理测量准确性。' },
  { id: 'history', label: '原始 History', definition: '保留原始交互文本及完整图片的历史记录。', format: '按轮次组织的原始图文；与提取出来的 memory 区分。', timing: '新交互继续留下原始记录；更新当前资料不意味着删除旧对话。', usage: 'Episodic 的轮次索引可取回相关原始图文。', sample: '教学样例：第 18 轮的用户文字、当时上传的完整图片及对话。', read: 'Episodic 轮次索引 → History 原始图文 → 回答', write: '新交互 → History 保留原始图文', feedback: 'History 不是第六类 memory。原始记录与可变的当前资料分别承担证据保存和当前条件的角色。' },
];

export function MemoryMap({ chapterId, moduleId }: WidgetProps) {
  const [selected, setSelected] = useState<ObjectId>(chapterId === 'chap-3' ? 'episodic' : 'core');
  const item = objects.find(x => x.id === selected)!;
  return <Frame id="memory-map" evidence="结构依据 Fig.2、Appendix A / Algorithm 1；所有保存内容例句为教学样例。">
    <div data-context={`${chapterId}/${moduleId}`}>
      <strong>查看资料对象及其读取路径</strong>
      <div className="pv-controls" aria-label="查看memory对象">{objects.map(x => <Chip key={x.id} active={selected === x.id} onClick={() => setSelected(x.id)}>{x.label}</Chip>)}</div>
      <p className="pv-muted">按钮仅切换讲解对象。本文文本检索：时间过滤 → Procedural / Semantic / Episodic 三类并行 → 各自 top-k 结果回填上下文。</p>
      <Feedback><strong>{item.label}：</strong>{item.read}。{item.feedback}</Feedback>
      <RetrievalDiagram focus={selected} />
      <div className="pv-write-route" data-write-object={selected}><strong>Update / 记录：供后续交互使用</strong><p>{item.write}</p></div>
    </div>
    <details className="pv-record-details"><summary>查看 {item.label} 的保存内容与更新规则</summary><div className="pv-detail"><h5>{item.label} · 选中对象</h5><p><strong>保存什么：</strong>{item.definition}</p><p><strong>怎样表示：</strong>{item.format}</p><p><strong>更新策略：</strong>{item.timing}</p><p><strong>怎样使用：</strong>{item.usage}</p><p className="pv-muted">{item.sample}</p></div></details>
  </Frame>;
}

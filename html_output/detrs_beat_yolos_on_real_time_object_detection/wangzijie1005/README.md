# RT-DETR：计算效率与查询质量

基于论文 *DETRs Beat YOLOs on Real-time Object Detection* 的中文交互式导读，采用 React + TypeScript + Vite。

采用 PaperSkill 1.4.0 模板，包含十章、十二个主动教学模块。所有 AP、FPS、延迟均为论文作者报告；手绘图形、候选框和训练对照为教学示意。

贡献者：Zijie Wang（GitHub：mathlover0728）。内容整理、交互实现与核查使用 AI 辅助；贡献者负责内容审阅和投稿。本次修订补充质量监督中的梯度边界、解码层数比较范围和主表统计解释，并移除页面中的个人学习进度提示。

正文以 [CVPR 正式论文](https://openaccess.thecvf.com/content/CVPR2024/papers/Zhao_DETRs_Beat_YOLOs_on_Real-time_Object_Detection_CVPR_2024_paper.pdf) 和[补充材料](https://openaccess.thecvf.com/content/CVPR2024/supplemental/Zhao_DETRs_Beat_YOLOs_CVPR_2024_supplemental.pdf) 为依据，每章提供定位。公式未补造未明确的范数；查询选择严格区分训练与推理，解码器消融固定同一训练六层模型。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

PaperSkill 投稿保留完整源码工程，由官方导入脚本生成 `paper.json` 和版本目录。构建产物仅用于预览。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

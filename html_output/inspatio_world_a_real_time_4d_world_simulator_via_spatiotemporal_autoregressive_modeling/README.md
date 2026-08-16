# InSpatio-World：基于时空自回归建模的实时 4D 世界模拟器 交互式教程

基于论文 *InSpatio-World: A Real-Time 4D World Simulator via Spatiotemporal Autoregressive Modeling*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / 渐进加载 / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 素材来源

本项目使用的全部外部素材及其出处如下，均用于学术学习与教学说明目的。

### 论文

- **InSpatio-World: A Real-Time 4D World Simulator via Spatiotemporal Autoregressive Modeling**，InSpatio Team，arXiv:2604.07209（2026）
- 论文页面：https://arxiv.org/abs/2604.07209
- 项目主页：https://inspatio.github.io/inspatio-world/
- 代码与权重：https://github.com/inspatio/inspatio-world （Apache-2.0）

页面中的全部结论、公式、实验数值与局限均来自该论文，正文已标注对应章节、表格与协议。

### 演示视频 `public/demo/`

第 1 章「4D 世界漫游 Demo」使用了论文官方项目主页公开发布的演示片段，未作任何修改，仅按论文 Fig.1 的能力分类重新组织展示：

| 文件 | 对应能力 | 原始出处 |
| ---- | ---- | ---- |
| `roaming.mp4` | 自由空间漫游 | inspatio.github.io/inspatio-world `static/videos/133653.mp4` |
| `temporal.mp4` | 时间控制 | inspatio.github.io/inspatio-world `static/videos/11b51aeb_rewind.mp4` |
| `realism.mp4` | 物理真实感 | inspatio.github.io/inspatio-world `static/videos/output10.mp4` |
| `longhorizon.mp4` | 长时程稳定性 | inspatio.github.io/inspatio-world `static/videos/output4.mp4` |

页面内已在演示模块下方标注「演示片段来自论文项目主页」。如原作者要求移除，可删除 `public/demo/` 并移除 `src/data/tutorial.ts` 中第 1 章的 `m1-demo` 模块，其余章节不受影响。

### B 站视频

第 10 章后的延伸阅读通过 BVID 以外链形式引用，不在本仓库中存放任何视频文件，封面图与播放量为生成时从公开接口读取的静态值。

### 其他

- 全部插图与动画均为本项目用 Canvas 代码实时绘制，未使用论文原图。
- 项目不含任何密钥、个人隐私信息或本地绝对路径。

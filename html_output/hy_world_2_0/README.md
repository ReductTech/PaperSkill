# HY-World 2.0：多模态三维世界模型 交互式教程

基于论文 *HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 论文与素材来源

- 论文：[HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds](https://arxiv.org/abs/2604.14268)
- `public/images/figure-2-architecture.png`：摘自论文 Figure 2，用于讲解整体系统架构。
- `public/images/figure-12-worldmirror.png`：摘自论文 Figure 12，用于讲解 WorldMirror 2.0 的多模态重建流程。
- `public/images/official-reconstruction.gif`：来自腾讯混元官方 GitHub 的 `assets/recon_en.gif`，用于展示多图/视频重建流程。
- `public/images/official-mesh.gif`：来自腾讯混元官方 GitHub 的 `assets/mesh_en.gif`，用于展示可漫游 Mesh 资产。
- `public/images/official-interactive.gif`：来自腾讯混元官方 GitHub 的 `assets/interactive.gif`，用于展示角色交互与物理反馈。
- `public/images/official-stage-pano.webp`：来自腾讯混元 HY-World 2.0 项目主页，用于解释 HY-Pano 2.0 的全景生成、Circle Padding 与 Pixel Blending。
- `public/images/official-stage-nav.webp`：来自腾讯混元 HY-World 2.0 项目主页，用于解释 WorldNav 的五类互补相机轨迹。
- `public/images/official-stage-stereo.webp`：来自腾讯混元 HY-World 2.0 项目主页，用于解释 WorldStereo 2.0 的记忆检索、关键帧扩散与相机控制。
- `public/images/official-stage-mirror.webp`：来自腾讯混元 HY-World 2.0 项目主页，用于解释 WorldMirror 2.0 的 Any-Modal 输入、共享聚合与几何输出。

三个 GIF 均做了降分辨率、降帧率和调色板压缩，未改变演示内容；四张阶段图按项目主页原图落库，仅将文件扩展名修正为实际 WebP 格式。论文图片与官方素材仅用于本教程的论文解读和教学展示，版权归原作者及腾讯混元团队所有；官方说明图与演示素材不替代论文定量证据。公开复用前请同时核对官方仓库当前的 [Community License](https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt)。

## 审查资料

- [参考资料导航](REFERENCES.md)：官方论文、项目主页、GitHub 开放进度、模型平台、许可证、体验页及已核验中文解读。
- [教程修改记录](TUTORIAL_CHANGELOG.md)：按版本记录每次人工优化、依据和验证结果。

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

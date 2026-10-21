# GEM：持续学习中的梯度情景记忆 交互式教程

基于论文 *Gradient Episodic Memory for Continual Learning*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 阅读与交互

封面和十章内容在同一页面连续呈现，向下滚动即可阅读后续章节。目录跟随滚动高亮当前章节，也可以点击目录定位；交互状态在滚动和定位时保留。方向键保留浏览器滚动和控件操作行为，底部无需翻页。

本版本按使用者要求调整了 `src/App.tsx` 和布局样式，将默认幻灯片导航改为连续阅读。视口跟随设备宽度，手机使用窄屏布局与抽屉目录。

## 论文与素材来源

- 原论文：[Gradient Episodic Memory for Continual Learning](https://papers.neurips.cc/paper/2017/file/f87522788a2be2d171666752f97ddebb-Paper.pdf)，David Lopez-Paz、Marc’Aurelio Ranzato，NeurIPS 2017。
- 实现核对：[官方参考代码](https://github.com/facebookresearch/GradientEpisodicMemory)。教程提供自行编写的二维投影教学实现；未打包官方代码或论文全文。
- Canvas 插图由程序绘制，未使用论文截图、外部图片、外部字体或视频素材。教学示例、原论文实验结果和教程提出的研究扩展分别标明。

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
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

# FSPNet：从相邻线索拼出伪装目标 交互式教程

基于论文 *Feature Shrinkage Pyramid for Camouflaged Object Detection with Transformers*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5185
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

## 论文与导读

Zhou Huang、Hang Dai、Tian-Zhu Xiang、Shuo Wang、Huai-Xin Chen、Jie Qin、Huan Xiong，CVPR 2023。[论文与附录](https://arxiv.org/abs/2303.14816) · [作者代码](https://github.com/ZhouHuang23/FSPNet)。

第 1–4 章从图像分块和局部线索走到图推理，第 5–7 章追踪逐层收缩解码与训练监督，第 8–10 章用主表、消融和失败案例检验结论。图 1、2、3 与附录图 10 截自作者公开论文，数值比较使用论文报告的预测结果。拼布动画和可调数值是教学示意。
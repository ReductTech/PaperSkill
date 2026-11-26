# AgentVLN：我认可什么，又想改什么？

默认打开23页交互式演示。已删除reading长文界面，原理演示、可拖动几何图、目录、讲稿、缩放与放映保留。

## 启动

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

打开 http://127.0.0.1:5173/ 。直接查看重点：

- `?slide=stage-switch-critique`：同一展厅中，看见目标与定位可靠、路线可达的区别。
- `?slide=waypoint-critique`：论文图3原图、拖动预测点、候选偏差；另可切换候选生成与校验。
- `?slide=global-query-proposal`：深度、拐角观测、连通性查询改变视锥、地图和路线。
- `?slide=modular-skills-proposal`：固定大脑与工具插拔；跨楼层设想仍待验证。
- `?slide=deployment-boundary`：论文室内外实机照片和待补充的跨楼层验证。

## 内容与依据

用户《批判和创新想法》中的原句放在相应图上，以“我的肯定 / 我的批判 / 我的设想”标明。图内区分论文做法和新增提案；长来源解释位于每页讲稿。

英文原文为2603.17670v1.pdf。`public/images`中的论文图是原PDF提取或裁剪，不是生成照片。其余交互SVG为按读者观点重画的教学场景，合成距离和路线不代表实测。表3的SR与SPL柱为固定论文结果；假设查询比例不能改写实测结果。

`src/App.tsx`为交互演示入口，`src/data/tutorial.ts`管理内容和讲稿，`src/modules/`实现交互图，`src/authorQuotes.ts`保留Word摘句。

## 构建

```powershell
npm run build
```

构建输出位于`dist/`，使用相对资源路径，可部署到子路径。

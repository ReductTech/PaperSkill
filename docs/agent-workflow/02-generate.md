# 功能二：调用 paper-skill 生成网页

1. 让参与者确认论文；
2. 在仓库外创建独立工作目录，不把论文或临时文件写入 `html_output/`；
3. 调用已安装的 `paper-skill`；
4. 让 Skill 连续完成论文读取、教学规划、React + TypeScript 项目生成和结构验证；
5. 获得唯一的 `<paper-short-name>_output/` 初版项目；
6. 保留论文来源、生成项目路径，以及核心论断对应的章节、公式、表格或页码证据，供后续核查和导入使用。

不要把初版直接当作最终作品，也不要在生成阶段停止 Paper Skill 的连续两阶段流程。

> 生成完成后，进入生成项目目录运行以下命令进行构建与预览即可：

```powershell
npm install
npm run build
npm run dev
```

`npm run dev` 用于本地预览首页、章节展开和主要交互；如预览中发现明显问题，记录后进入功能三与参与者确认修改。

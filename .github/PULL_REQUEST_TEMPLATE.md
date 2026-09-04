## 论文信息

- 论文：
- 目录：`html_output/<paper-name>/`
- 分支：

## 本次工作

- [ ] 新增一个论文教程实现
- [ ] 修改已有论文实现
- [ ] 仅修改了本实现目录，未提交自动生成的 `catalog/papers.json`
- [ ] 已由人工对照原论文核验网页内容与信息准确性
- [ ] 创建 Pull Request 前已提供可运行的网页预览，并由使用者确认页面显示与主要交互正常

## Agent 自动检查

- [ ] Agent 已针对最终待提交源码运行 `npm run validate`
- [ ] Agent 已运行 `npm run catalog` 验证目录可生成，并恢复了 `catalog/papers.json`
- [ ] Agent 已运行 `npm run validate:pr -- main`
- [ ] Agent 已运行 `npm run build:paper -- <paper-name>`
- [ ] Agent 已运行 `git diff --check main...HEAD`，并检查最终差异与 `git status --short`
- [ ] 上述自动检查全部通过，项目格式、目录结构、分支范围和构建结果正确
- [ ] 页面交互、移动端布局和资源路径已由使用者通过提交前预览确认
- [ ] 论文事实、公式、模型结构、实验数字、结论和局限已由人工对照原文核对
- [ ] 未提交 `node_modules/`、`dist/`、密钥或本地绝对路径
- [ ] 图片与外部素材具有可追溯来源，并记录在项目 `README.md`
- [ ] 所有创建者已知晓姓名或展示名及 GitHub 信息会公开显示并表示同意
## 预览与说明

请填写提交前使用的预览地址或预览方式、使用者确认结论，并附关键页面截图、主要交互说明，以及仍需审核者重点确认的内容。截图不能替代使用者实际打开和操作网页。

提交前请阅读 `docs/SUBMISSION.md`，并按 `docs/QUALITY_CHECK.md` 完成质量复核。

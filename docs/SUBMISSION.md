# 提交说明

## 1. 提交内容

GitHub 仓库接收可以运行和构建的完整 React + TypeScript 最终教程项目，统一提交到：

```text
html_output/<paper-name>/
```

`paperName` 为论文名称（论文全称小写加下划线，例如：attention_is_all_you_need）

作品目录应包含 `package.json`、`src/`、`public/`、`paper.json` 等完整项目文件，不能只提交单独的 HTML 文件。项目不得放在仓库根目录、`docs/` 或其他位置。

汇报 PPT 不放入 GitHub 仓库，由同学按照考核通知通过飞书提交。

分支、导入、目录和检查命令统一见 [PARTICIPATING.md](PARTICIPATING.md)。Pull Request 应附关键页面截图、主要交互说明和需要审核者重点确认的问题。

项目不得包含未获授权的素材、密钥、个人隐私或本地绝对路径；使用论文图片或其他外部素材时，应在项目 `README.md` 中注明来源。

## 2. 提交检查

- [ ] Agent 已针对最终待提交源码自动完成仓库校验、目录生成、PR 范围、单篇构建、差异格式和禁止提交文件检查，且全部通过；
- [ ] 已由人工对照原论文核验网页内容与信息准确性；
- [ ] 创建 Pull Request 前已提供可运行的网页预览，并由使用者确认页面显示、资源加载与主要交互正常；
- [ ] 项目已按参与指南通过检查并创建 Pull Request；
- [ ] Pull Request 已附截图和交互说明；
- [ ] 汇报 PPT 已按照考核通知通过飞书提交；
- [ ] 素材来源已注明，仓库中不含个人隐私、密钥或本地绝对路径。

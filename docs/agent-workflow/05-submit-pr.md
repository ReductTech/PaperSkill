# 功能五：准备提交 PR

## 0. 提交内容由使用者确认

以下内容最终须由使用者本人理解并确认，Agent 可以先生成草稿供参考：

**整合进 Pull Request（公开）：**

- Pull Request 标题和说明；
- 主要交互说明及其他；

Agent 可以在仓库外部新建 `PR_MATERIALS/` 目录，生成以下草稿：

- `PR_MATERIALS/01-pr-title-and-description.md` — PR 标题和说明
- `PR_MATERIALS/02-interactions.md` — 主要交互说明及其他

使用者确认后，Agent 整合进 Pull Request 的说明；`PR_MATERIALS/` 不提交到仓库。

## 1. Agent 提交前自动检查（必须全部通过）

Agent 必须针对最终待提交源码亲自运行检查，不得把命令交给使用者代为执行：

```powershell
npm run validate
npm run catalog
git restore catalog/papers.json
npm run validate:pr -- main
npm run build:paper -- <paper-name>
git diff --check main...HEAD
git status --short
```

Agent 还必须检查最终差异，确认目录名称、项目结构、`paper.json`、分支范围和提交格式正确，且不包含 `node_modules/`、`dist/`、自动生成的 `catalog/papers.json`、密钥、个人隐私或本地绝对路径。

任一命令失败或发现格式问题时，必须先定位、修复并重新运行全部相关检查。所有自动检查通过前，不得进入网页预览、推送分支或创建 Pull Request。

## 2. 提交前网页预览（必须由使用者确认）

- 使用最终待提交源码完成构建并启动可运行的本地网页预览；
- 将可直接打开的预览地址提供给使用者，请使用者实际查看关键页面并操作主要交互；
- 请使用者确认桌面端和移动端页面显示、文字、图片、图表、资源加载与主要交互正常；
- 截图可以作为辅助记录，但不能代替使用者打开网页进行预览；
- 未获得使用者明确确认前，不得推送分支或创建 Pull Request。

## 3. 技术步骤（Agent 自动执行）

- 获得网页预览确认后，向使用者展示最终改动范围、验证结果和待提交内容，并再次确认；
- 确认后可以协助推送个人分支和创建 Pull Request，不得直接推送 `main`。

## 4. 检查失败处理

Pull Request 检查失败时必须先读日志：如果失败发生在仓库校验、构建或范围检查步骤，修复项目后再推送；如果失败发生在获取运行器、下载官方 Action 或访问 GitHub 服务阶段，先查看 GitHub Status，待服务恢复后使用 `Re-run jobs`，不得把平台故障误判为作品错误。

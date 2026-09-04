# 功能四：将最终修改后的项目导入主仓库

人工修改完成后，Agent 应直接执行以下导入与校验：

1. 比较当前 `package.json` 和依赖锁文件与首次安装后的内容指纹：如果文件集合和内容均未变化且 `node_modules/` 仍可用，跳过依赖安装；如果任一文件新增、删除或改变，或者 `node_modules/` 缺失，则重新执行 `npm install`；
2. 无论是否跳过安装，都必须重新执行 `npm run build` 和页面测试。若跳过安装后构建因依赖缺失或损坏失败，应自动执行一次 `npm install` 后重新构建；
3. 再次让使用者确认公开展示名、GitHub 用户名和 `paperName`（论文名称：论文全称小写加下划线，例如：attention_is_all_you_need）；
4. 在作品仓库中创建 `paper/<paper-name>` 分支；
5. 按 `docs/PARTICIPATING.md` 运行 `npm run import -- ...`；
6. 确认项目进入 `html_output/<paper-name>/`，并保持 `html_output/` 和作品目录名称不变；
7. 检查 `paper.json`、论文链接、公开展示信息和内部追踪字段；
8. 在仓库根目录运行：

   ```powershell
   npm run validate
   npm run catalog
   npm run validate:pr -- main
   npm run build:paper -- <paper-name>
   ```

   普通教程贡献只构建本次作品。`npm run build:site` 仅用于管理员完整验收、共享构建逻辑修改和正式 Pages 部署；`npm run catalog` 用于本地验证全部作品的总索引可以生成，运行后必须执行 `git restore catalog/papers.json`，不得在教程 PR 中提交该文件。

9. 检查本次分支只修改目标作品目录，且不包含 `catalog/papers.json`；
10. 确认仓库中没有密钥、隐私、本地绝对路径或未授权素材。

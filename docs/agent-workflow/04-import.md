# 功能四：将最终修改后的项目导入主仓库

Agent 应：

1. 再次让参与者确认公开展示名、GitHub 用户名、`paperSlug` 和 `source`；
2. 在作品仓库中创建 `paper/<paper-slug>-<github-user>` 分支；
3. 按 `docs/PARTICIPATING.md` 运行 `npm run import -- ...`；
4. 确认项目进入 `html_output/<paper-slug>_<source>/`；
5. 检查 `paper.json`、论文链接、参与者信息、来源分支和 Skill 版本；
6. 在仓库根目录运行：

   ```powershell
   npm run validate
   npm run catalog
   npm run validate:pr -- main
   npm run build:site
   ```

7. 检查本次分支原则上只修改目标作品目录和 `catalog/papers.json`；
8. 禁止上传 `node_modules/`、`dist/`、论文 PDF、密钥、隐私、本地绝对路径或未授权素材。

# HTML Output

所有论文教程统一放在这里，按「论文目录 / 版本目录」两级组织：

```text
html_output/<paper-name>/<version>/
```

- `<paper-name>`：论文名称（论文全称小写加下划线），例如 `deep_residual_learning_for_image_recognition`；
- `<version>`：姓名拼音小写 + 修改日期 MMDD（例如 `liming0903`），同一篇论文的多个版本并列保留，互不覆盖。

请不要直接把 `<paper-short-name>_output/` 随意拖入本目录；优先使用仓库根目录的 `npm run import -- ...`，它会排除 `node_modules/` 和 `dist/`，并生成标准的 `paper.json`（含 `version` 与 `versionDate`）。

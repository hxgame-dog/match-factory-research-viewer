# `.lvl` 格式速记（由 `scripts/pipeline.py` 抽样生成）

## `ud.lvl` / `gd.lvl`

- 文件头为 **SQLite 3**（`SQLite format 3\0`）；管道输出字段 `looksLikeSqlite3: true`。
- 当前包内实例为 **几乎空库**（`sqlite_master` 无用户表），可能仅作运行时占位或版本占位。

## `Levels/*.lvl` / `DLCFallbackLevels/*.lvl`

- 抽样头部 **非 zlib**；十六进制以 `08 xx` 等开头，符合 **Protobuf wire** 特征；管道输出含 `maybeProtobufWire` 启发式标记。
- 使用 Google **`protoc --decode_raw`**（无 `.proto` schema）可还原字段编号与嵌套结构；`npm run ingest` 会在 `lvl_format_notes.json` 的 `protocDecodeRaw` 节点写入若干样例（需本机存在 `protoc`，常见路径含 `/opt/anaconda3/bin/protoc`）。
- 部分带 `_01` 等变体的关卡文件中出现可读 ASCII 片段（如 `M_1_1`），疑似 **模板/元数据字段**（与 `Editor/level_templates_*.csv` 的模板体系对照需进一步用 Il2CppDumper 对齐消息定义）。

## 建议下一步

- 使用 **Il2CppDumper** + 主包内 `global-metadata.dat` 生成 `dump.cs`，检索 `Level`、`Deserialize`、`Proto`、`Sqlite` 相关类型。
- 对单一 `LevelXXXX_YY.lvl` 做 Protobuf `protoc --decode_raw` 试验（需切出有效 payload）。

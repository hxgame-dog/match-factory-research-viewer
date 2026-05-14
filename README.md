# Match Factory 本地包体研究视图

**零基础详细说明（每一页在干什么、数据从哪来）**：在浏览器打开本站的 **`/guide`**，或阅读仓库内 [`USER_GUIDE.zh-CN.md`](./USER_GUIDE.zh-CN.md)。**各页模块旁的灰色「说明」框**文案在 [`src/content/inlineHelp.zh.ts`](./src/content/inlineHelp.zh.ts)，可与手册对照修改。

## 用法

### 一键跑通（推荐顺序）

1. 进入目录并安装依赖：`cd match-factory-research-viewer` 后执行 `npm install`（可选：`pip install UnityPy`，用于 bundle 枚举）。
2. 配置包体路径：环境变量 `MATCH_FACTORY_ROOT` 指向含 `net.peakgames.match`、`UnityDataAssetPack` 等的解压目录（与 `scripts/pipeline.py` 内默认路径一致亦可）。
3. `npm run ingest`（不访问外网可用 `SKIP_REMOTE_INGEST=1 npm run ingest`）。
4. `npm run dev`，浏览器打开 **`/`**、**`/guide`（使用说明）** 与 **`/analysis`**（专题可视化）。

仅当已跑过 ingest、只想**重新聚合** `topic_analysis.json`（含关卡 ID×变体热力图）时：

```bash
npm run ingest:topic
```

## 补充说明

若不想在 ingest 时访问外网，可设置：

```bash
SKIP_REMOTE_INGEST=1 npm run ingest
```

远程 `catalog_main.hash` / `catalog_main.json` 可能被 CDN 拒绝（常见 **403**），属正常；需带发行端鉴权或从真机抓包时才能拉全量。可通过环境变量收紧超时（默认 **12 秒**）：

```bash
REMOTE_CATALOG_TIMEOUT_SEC=8 REMOTE_CATALOG_MAX_BASES=1 npm run ingest
```


若终端里执行 `dotnet --version` 提示找不到命令，多半是 **PATH 未包含安装目录**。常见位置：

```bash
export PATH="/usr/local/share/dotnet:$PATH"   # Intel / 部分安装
export PATH="/opt/homebrew/share/dotnet:$PATH"  # 部分 Homebrew 布局
export PATH="$HOME/.dotnet:$PATH"            # install 脚本默认
```

可写入 `~/.zshrc` 后 `source ~/.zshrc`。

仅安装 **.NET 11 等更高版本**、而 Il2CppDumper 目标为 **net7** 时，脚本已设置 `DOTNET_ROLL_FORWARD=LatestMajor` 以允许向前滚动运行。

`ingest_il2cpp.sh` 在非交互环境用管道避免 Il2CppDumper 末尾 `ReadKey` 崩溃。

安装 SDK（若尚未安装）：

```bash
brew install --cask dotnet-sdk
# 若 Microsoft CDN 下载失败，可重试或从官网安装 pkg 后再执行：
cd match-factory-research-viewer
npm run ingest:il2cpp
```

`ingest:il2cpp` 会：自动下载 Il2CppDumper（net7）到 `tools/il2cppdumper-net7/`（已 gitignore）、对 `libil2cpp.so` + `global-metadata.dat` 导出到 `extracted/il2cpp_out/`，并生成 `public/data/il2cpp_hints.json` 供「Il2Cpp」页浏览。

`ingest:il2cpp-hints` 会解析 `dump.cs` 与 `stringliteral.json`，生成带**类名分组**、**可搜索字符串字面量**的 `il2cpp_hints.json`（「Il2Cpp」页）。

若已安装 **protobuf 编译器**（`protoc`），执行 `npm run ingest` 会对若干样例关卡运行 `protoc --decode_raw`，结果写入 `lvl_format_notes.json` → 页面「.lvl 说明」。

## 产出

- `extracted/`：原始抽取 JSON（与 `public/data` 同步一份供前端静态读取）。
- `extracted/research.db` / `public/data/research.db`：SQLite 汇总（物品、模板、关卡索引、catalog 键与 bundle URL）。
- `lvl_protobuf_schema.json`、`catalog_blob_strings.json`、`datapack_scan.json`、`remote_catalog_meta.json`：研究辅助数据（见「数据研究」页）。
- `topic_analysis.json`：五类专题聚合（关卡 / 关卡数值 / 物品 / 计费 / 广告），由 `scripts/build_topic_analysis.py` 在 `npm run ingest` 末尾生成；前端 **`/analysis`（专题分析）** 读取该文件做 KPI、图表与热力图。
- `INVENTORY.md`、`LVL_NOTES.md`、`ADDRESSABLES.md`、`VISUALIZATION_DESIGN.md`：说明与可视化迭代方案。

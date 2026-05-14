# Match Factory 专题逆向：可视化与迭代方案

本文档对应站点 **`/analysis`**（`topic_analysis.json` + `TopicAnalysisView`），说明五类主题的**逆向结论边界**与**推荐可视化**（含二期可落地方案）。

---

## 1. 关卡（`.lvl` 文件层）

### 逆向已确定

- 文件命名：`Level{id}_{variant}.lvl`；`Levels` 与 `DLCFallbackLevels` 两套池。
- 二进制为 **Protobuf**；变体 `00` 多为 **LevelBaseData**，`01+` 多为 **LevelData**（字段编号见 `lvl_protobuf_schema.json`）。

### 当前页面

- KPI 卡片、**Recharts** 目录/变体横向条形图、体积直方图。
- **关卡 ID 等宽分桶 × 变体** 热力图（`topic_analysis.json` 内 `levelIdVariantHeatmap`，由 ingest 聚合 `levels_index.json`，无需浏览器加载全量索引）。

### 推荐增强（二期）

| 可视化 | 数据源 | 说明 |
|--------|--------|------|
| 千分位 / 自定义 ID 分桶 × 变体 | `levels_index.json` | 当前为等宽 ID 段；可改为按千关或策划分段 |
| 体积 vs levelId 散点 | `levels` 表 | 发现异常大/小关 |
| 与模板 ID 关联 | `.lvl` decode 后 `Name` 字段 + `level_templates` | 需批量 `protoc --decode_raw` 或 C# Parser |

---

## 2. 关卡数值（模板 CSV）

### 逆向已确定

- 源文件 **无表头**；ingest 后列为 `col_0..`；`col_0` = 模板 ID；`col_1` 在样本中多为整型「时长类」字段（具体语义需对照 `LevelDataParserUtil` / 策划工具链）。
- 其余列含尺寸、布尔标记等（与 `level_templates_*.csv` 原始列对齐）。

### 当前页面

- **normal / ease** 并列对照表（min / median / max + 中位刻度条）；原始 JSON 折叠在「调试用」。

### 推荐增强

| 可视化 | 说明 |
|--------|------|
| normal vs ease **并列箱线图** | 对 `col_1` 等关键列 |
| **列相关性矩阵**（抽样行） | 发现与难度相关的列簇 |
| 模板 ID → 关联关卡列表 | 依赖 `.lvl` 内 Name 与模板 ID 映射 |

---

## 3. 物品（`items.csv`）

### 逆向已确定

- 维度：`Name`、`Category1/2`、`Color`、`Shape`、`Size` 等，适合当「元素词典」。

### 当前页面

- Category1、Category2（Top）、Shape 的 **Recharts** 横向条形图。

### 推荐增强

| 可视化 | 说明 |
|--------|------|
| 旭日图 / 树图 | Category1 → Category2 → Shape |
| 与 **LevelItemData.ItemType** 枚举映射表 | 需 Il2Cpp 枚举或运行时表导出 |

---

## 4. 计费点

### 逆向边界

- 仅 **DEX + il2cpp 字符串** 分桶（Google Play Billing、AppsFlyer、Facebook、Unity/Zynga 等关键字）。
- **非** SKU 全量、**非** 价格、**非** 服务端 offer。

### 当前页面

- 分桶条数条形图 + 原文列表（**可关键字筛选**）。

### 推荐增强

| 可视化 | 数据源 |
|--------|--------|
| 从 `dump.cs` 提取 `Sku`/`Product` 相关 **类字段** | 结构化表格 |
| 与 `stringliteral.json` 交叉 | 疑似 SKU 字符串词云 |
| 与远程 IAP 配置 diff | 需合法抓取或真机流量 |

---

## 5. 广告

### 逆向边界

- 字符串级：MAX / AdMob / UnityAds / IronSource / placement 等。
- **非** 真实水位、**非** 瀑布配置 JSON（多在 SDK 初始化与远程）。

### 当前页面

- 分桶条数条形图 + 原文列表（**可关键字筛选**）。

### 推荐增强

| 可视化 | 说明 |
|--------|------|
| SDK × placement 矩阵（计数） | 对字符串再做正则归类 |
| 时间线（若接入日志） | 需运行时埋点或抓包 |

---

## 6. 技术栈建议（二期）

- **图表**：站点已用 **recharts**（`/analysis`）；可再引入 `@nivo/sunburst` / ECharts（热力、箱线、相关矩阵）。
- **大表**：`@tanstack/react-table` 虚拟滚动 + 与 `research.db` SQL 查询页。
- **拓扑**：关卡 → 模板 → 物品类型 可用 `react-flow` 轻量示意。

---

## 7. 数据刷新

```bash
cd match-factory-research-viewer
npm run ingest
```

生成/更新 `public/data/topic_analysis.json` 后刷新 `/analysis` 即可。若已具备 `levels_index.json` 等前置 JSON、仅需重算专题文件，可用 `npm run ingest:topic`。

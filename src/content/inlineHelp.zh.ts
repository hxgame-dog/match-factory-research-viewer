/**
 * 各页面「模块旁说明」文案。用 \n\n 分段。
 * 与 USER_GUIDE.zh-CN.md 互补：此处紧贴界面模块，手册页为全文。
 */

export const homeHelp = {
  topicShortcuts: `从这里进入「专题分析」可看关卡、模板数值、物品、计费与广告的图表汇总；「使用说明」打开全文手册 /guide。

本区块只提供链接，不加载大 JSON。`,
  dataSource: `这里显示的是「包体根目录」路径，以及 Unity 资源包、主包 assets 的规模统计。

数据来自最近一次 npm run ingest：若路径或包体换了，请重新 ingest 再刷新本页。`,
  lvlDistribution: `按 UnityDataAssetPack 顶层文件夹统计 .lvl 文件数量，用来确认关卡资源落在哪个目录（例如 Editor 下等）。

条形越长表示该目录下 .lvl 越多；不等于「游戏关卡总数」。`,
  extensions: `按扩展名汇总文件数量与体积，快速了解包里主要是图片、音频、bundle 还是其它。

用于判断下一步该去哪个页面深挖（如 .bundle 去资源分包页）。`,
};

export const itemsHelp = {
  header: `本表来自包内 items.csv 经 ingest 转成 items.json。每一行对应策划表里的一个「物品/元素」词条。

第一列 ItemId（ID）为行号从 0 起，与 .lvl 里 field 6/7 的子字段 1 相同。`,
  controls: `筛选框会在所有列里做子串匹配（不区分大小写）。导出 CSV 只导出当前筛选结果，方便放进 Excel。

勾选「贴图预览」时从 public/sprites 静态路径加载（已随仓库部署，线上 Vercel 可用）。`,
  table: `列名与 CSV 一致，并增加 ItemId。贴图列按 Name 匹配 sprites/{Name}.png。

在「关卡配置说明」页可输入 ItemId 查看关卡目标与贴图对照。`,
};

export const levelGuideHelp = {
  header: `用 ingest 样例关卡的 protoc --decode_raw 文本，解析 field 6（收集目标）与 field 7（棋盘投放），并按 ItemId 显示物品表字段与贴图。

ItemId 不是关卡号：Level0852 是第 852 关，而 decode 里的 852 才是道具 ID。`,
  fieldLegend: `对照说明见 docs/LEVEL_CONFIG_GUIDE.zh-CN.md。_00.lvl 管棋盘编码，_01.lvl 管时长与目标。`,
  samplePicker: `下拉为 lvl_format_notes.json 里已 decode 的样例。也可自行粘贴 decode_raw 结果做实验。`,
  goalsPreview: `每张卡片：ItemId、策划名、分类、数量，以及 public/sprites 中的 PNG（线上可直接加载）。`,
  rawBlock: `原始 decode_raw 便于与仓库脚本 decode_lvl_goals.py 对照。`,
  idLookup: `输入任意 ItemId（逗号分隔）快速查物品与贴图，无需完整 .lvl 文件。`,
};

export const levelPreviewHelp = {
  header: `每关一张卡片：从 *_01.lvl 解析收集目标（field 6）与棋盘投放（field 7），用 ItemId 关联物品表与 public/sprites 贴图。

关卡模板表（normal）只补充时长、难度标记与 col_4+ 数量列——数量列不能单独推出是哪种道具，道具种类以 .lvl 为准。`,
  filters: `默认显示关卡 1–100，可改范围或搜索关卡号、模板名、道具名。每页 24 关，避免一次渲染数千卡片。

全量索引需本地执行 python3 scripts/build_level_goals_index.py（约数千关，耗时数分钟）。`,
};

export const templatesHelp = {
  header: `数据来自 level_templates_normal.csv 与 ease.csv。原始文件没有表头行，ingest 时自动命名为 col_0、col_1…

col_0 在样本中多为模板 ID；col_1 等列的具体含义需对照游戏代码或策划工具，本页只展示原始格子。`,
  table: `normal / ease 两套表可切换对比。此处只展示前 24 列，避免表格过宽。

若需全列，请用 SQLite research.db 或打开原始 CSV。`,
};

export const levelsHelp = {
  header: `每一条记录对应磁盘上的一个 .lvl 文件（同一 levelId + variant 可能在 Levels 与 DLCFallbackLevels 各出现一次）。

本页不是关卡编辑器，不能改棋盘；只能查路径、体积与分布。`,
  histogram: `千分位桶统计「关卡 ID 落在哪个区间」的文件条数，用来粗看关卡进度在包体里是否均匀。

与专题分析里的「ID 段 × 变体热力图」同源思路，但这里列表更细、可筛选。`,
  filtersTable: `用最小/最大 levelId 与目录下拉缩小范围。表格分页展示，避免一次渲染数万行卡死浏览器。

bytes 是文件大小；variant 一般 0 为基底、1+ 为具体关卡数据变体（详见 .lvl 说明页）。`,
};

export const bundlesHelp = {
  header: `数据来自 aa/catalog.json 等抽取结果。Locator、Build hash、InternalId 数量反映 Addressables 目录规模。

完整「键 → 文件」解析通常要在 Unity 或专用工具里做，这里给的是离线能拿到的子集。`,
  localFiles: `列出在本地包体里已经落盘的 bundle 文件名与字节数；若显示「缺失」表示 catalog 里有条目但本机未下载到对应文件。`,
  keys: `资源键（Addressable key）示例，可用来搜皮肤、道具、场景等资源命名习惯。

仅展示前 200 条样本，全量请用 research.db 或自写脚本扫 catalog。`,
};

export const sdkHelp = {
  header: `字符串来自对 DEX 与 libil2cpp.so 做过滤后的「候选行」，以及 il2cpp_hints 中的类名/字面量子集；用于证明客户端里出现过哪些 SDK、商城与广告关键字。

这不是 Google Play 商品列表，也不是广告瀑布流配置；价格、placement 全量多在服务端或加密配置。`,
  mall: `本 Tab 只展示<strong>商城、礼包、Offer、内购、通行证</strong>相关证据：来自 il2cpp_hints 的字符串字面量 + 类名命中，并叠加 DEX 中与商城信号相关的行；已过滤大部分纯广告版位与裸 HTTP。

默认从「可见商品命名」「ABTest_Shop」「Datasets/StarterOffer」等桶下钻；完整 SKU 仍以服务端为准。`,
  dex: `classes.dex / classes2.dex 中的命中行，偏 Java/Kotlin 层集成（如 BillingClient）。

左侧为自动分桶（与专题页思路一致），右侧表格去掉 \`[classes.dex]\` 前缀后展示正文，支持全文搜索，便于逐条下钻。`,
  il2cpp: `native 层 Il2Cpp 编译进 so 的字符串，常与 C# 类名、资源路径、广告 mediation 相关。

本页同样提供分桶 + 搜索 + 表格；专题分析页侧重聚合图表，此处侧重可读浏览。`,
};

export const lvlHelp = {
  header: `说明 .lvl 二进制格式、魔数、ud.lvl / gd.lvl 等特殊文件。详细长文仍见仓库 LVL_NOTES.md。

本页数据来自 lvl_format_notes.json（ingest 时生成）。`,
  protoc: `protoc --decode_raw 可在没有 .proto 文件时打印 Protobuf 的字段编号与 wire 结构，便于和 dump.cs 里 LevelData 等类型对照。

若本机未安装 protoc，会显示提示；安装后重新 ingest 可生成样本。`,
  rawJson: `指纹与特殊文件列表的原始 JSON，供调试 ingest 或核对路径。

一般读者可略过，除非你在改 pipeline。`,
};

export const il2cppHelp = {
  header: `数据来自 il2cpp_hints.json：由 dump.cs 与 stringliteral.json 启发式抽取，需先跑 npm run ingest:il2cpp 或相关脚本。

用于「搜类名、搜字符串」找和关卡、计费、广告相关的符号。`,
  dumpStatus: `若尚未生成 dump.cs，会显示黄色提示。生成后这里列出路径、大小、扫描上限等元信息。

行上限是为控制 JSON 体积，不代表 dump 里只有这么多内容。`,
  classGroups: `按关键字把类名粗分成几组，方便浏览。每组只显示部分条目，更多请用下方搜索框。`,
  search: `类名搜索与字符串字面量搜索都是前端过滤已下载的 JSON 数组，不会访问网络。

字符串里常混有策划表 key、路径、广告 placement 片段等。`,
  lineSample: `dump.cs 原始行片段，用来确认文件可读、编码正常。

不适合当结构化数据源，仅抽样展示。`,
};

export const researchHelp = {
  header: `聚合「研究用」JSON 与 SQLite 下载链接。适合已经会用数据库或想复制 JSON 做二次脚本的人。

与顶部各专题页不同：这里偏原始导出。`,
  schema: `lvl_protobuf_schema.json：从 Il2Cpp 类型推断的 Protobuf 字段编号，和 .lvl 说明页的 decode_raw 一起看。

字段「叫什么」以 dump 为准，语义仍需游戏内验证。`,
  remote: `远程 catalog 探测结果（HTTP 状态、URL 等）。若全是 403 之类，多半是 CDN 需要发行端鉴权，属正常现象。`,
  blobs: `从 catalog 二进制里启发式挖出的高频 ASCII 串，用来猜 key 或路径片段，不是官方解析结果。`,
  datapack: `UnityPy 等对 datapack / resources 的扫描摘要，取决于本机是否安装 UnityPy 以及 ingest 是否跑通相关步骤。`,
};

export const analysisPageHelp = {
  header: `本页数据全部来自 public/data/topic_analysis.json。完整管线用 npm run ingest；只重算专题用 npm run ingest:topic。

下方各 Tab 右侧会随 Tab 切换显示对应说明；图表与热力图在左侧。`,
};

export const analysisTabHelp: Record<string, string> = {
  levels: `汇总 levels_index：目录占比、变体号分布、文件体积直方图。

「关卡 ID 段 × 变体」热力图：每个格子是索引里该 ID 区间、该变体的文件条数（同一关可能在两个目录各一行）。颜色越深数量越多。`,
  levelNumerics: `来自 level_templates_*.csv 转成 JSON。列为 col_*，因为源 CSV 无表头。

表格对比 normal 与 ease 各列的 min / median / max（数值列抽样统计）。具体列含义需对照 LevelDataParserUtil 等代码；折叠区为原始 JSON 调试用。`,
  items: `对 items.json 做 Category1、Category2、Shape 的计数条形图，相当于「策划词典」的分布概览。

与关卡内 ItemType 的映射不在此页，需查 Il2Cpp。`,
  monetization: `左侧：按关键字规则把 DEX+il2cpp 字符串分桶后的条数。右侧：每桶内原文，可用搜索框过滤。

这是客户端里出现过的计费相关片段，不是商店 SKU 全表。`,
  ads: `与计费 Tab 类似，但分桶规则偏向 MAX、AdMob、UnityAds、IronSource、版位关键字等。

同样不是线上真实瀑布流或 eCPM 数据。`,
  researchReport: `本 Tab 为「逆向研究专题报告」：汇总关卡模板与 .lvl 组合、商城/Offer/礼包客户端线索、广告版位命名、动态难度与 AB 调节等结论。

正文与证据列表由 ingest 写入 topic_analysis.json（version≥3）；展开灰色折叠块可看 Il2Cpp 类名与字符串节选。`,
  dataDiagnostics: `由 ingest 脚本扫描 public/data 下关键 JSON 是否存在及体积，并列出「静态包体无法覆盖」的研究盲区（服务端定价、遥测、模板列语义等）。

若某文件显示缺失，请按页面底部建议执行 npm run ingest 或 npm run ingest:topic。`,
};

# Addressables 深扫说明

- 本地 `catalog.json` 的 **`m_InternalIds`** 已抽取为 `extracted/catalog_extract.json` / `public/data/catalog_extract.json`。
- 包内 **`assets/aa/Android/*.bundle` 共 3 个**，已用 **UnityPy** 枚举对象；当前构建中 **未发现 `TextAsset`**（输出见 `addressables_unitypy.json`），内容可能以 Sprite/Prefab/其他序列化类型为主。
- 更完整导出可使用 **AssetStudio** 图形工具对本目录 bundle 做人工检视（本仓库未内置 GUI 自动化）。

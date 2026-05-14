# Match Factory! 本地包体盘点（自动生成摘要见 `extracted/inventory_summary.json`）

## 三分包职责

| 组件 | 路径 | 说明 |
|------|------|------|
| 主模块 APK | `net.peakgames.match/` | DEX、Unity `data.unity3d`、广告 WebView 资源、`global-metadata.dat`（IL2CPP） |
| ABI 分包 | `config.arm64_v8a/` | `libil2cpp.so`、`libunity.so`、Firebase/Billing 等原生库 |
| Unity 资源包 | `UnityDataAssetPack/` | `datapack.unity3d`、Addressables、`Levels` / `DLCFallbackLevels`、明文 CSV |

## 可解析性分级（L0–L3）

- **L0 明文**：`assets/Editor/*.csv`、`aa/settings.json`、`badwords.txt`、`google-services-desktop.json` 等。
- **L1 半结构化**：`aa/catalog.json`（`m_InternalIds` 可直接读取为资源地址列表；条目/桶为二进制串需 Unity 运行时解码）。
- **L2 Unity 二进制**：`*.bundle`、`datapack.unity3d`、`resources.resource` — 可用 UnityPy / AssetStudio 尝试导出 TextAsset。
- **L3 自定义**：`*.lvl`（关卡二进制）、`ud.lvl` / `gd.lvl` — 需结合 IL2CPP 反序列化逻辑或格式逆向。

## 远程内容

`aa/settings.json` 中 Addressables 远程基址：`https://match-prod-client-dlc.matchfactory.com/Android/v6/`。活动与热更资源可能仅在线上下发，本地包不等同于线上全集。

## 关卡文件分布

- `assets/Levels/`：主关卡池（约 3.7 万 `.lvl`）。
- `assets/DLCFallbackLevels/`：DLC 回退关卡池（约 5 千 `.lvl`，命名规则与 `Levels` 相同）。
- 根目录 `ud.lvl`、`gd.lvl`：全局/用户相关二进制（待结合 IL2CPP 确认）。

运行 `npm run ingest`（或 `python3 scripts/pipeline.py`）可刷新 `extracted/` 下统计与索引。

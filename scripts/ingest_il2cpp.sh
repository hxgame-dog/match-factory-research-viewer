#!/usr/bin/env bash
# 下载 Il2CppDumper（net7）并针对本机 Match Factory 分包运行；依赖 dotnet 7+。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MATCH_ROOT="${MATCH_FACTORY_ROOT:-/Users/fulei/Downloads/match-factory-1-64-246}"

IL2CPP="$MATCH_ROOT/config.arm64_v8a/lib/arm64-v8a/libil2cpp.so"
META="$MATCH_ROOT/net.peakgames.match/assets/bin/Data/Managed/Metadata/global-metadata.dat"
TOOLS="$PROJECT_ROOT/tools/il2cppdumper-net7"
OUT_DIR="$PROJECT_ROOT/extracted/il2cpp_out"
ZIP_URL="https://github.com/Perfare/Il2CppDumper/releases/download/v6.7.46/Il2CppDumper-net7-v6.7.46.zip"

if ! command -v dotnet >/dev/null 2>&1; then
  for _d in "/usr/local/share/dotnet" "/opt/homebrew/share/dotnet" "$HOME/.dotnet"; do
    if [[ -x "$_d/dotnet" ]]; then
      export PATH="$_d:$PATH"
      break
    fi
  done
fi

if ! command -v dotnet >/dev/null 2>&1; then
  echo "错误: 未找到 dotnet。请先安装: brew install --cask dotnet-sdk" >&2
  exit 1
fi

if [[ ! -f "$IL2CPP" || ! -f "$META" ]]; then
  echo "错误: 找不到 libil2cpp.so 或 global-metadata.dat" >&2
  echo "  IL2CPP=$IL2CPP" >&2
  echo "  META=$META" >&2
  exit 1
fi

mkdir -p "$TOOLS" "$OUT_DIR"

if [[ ! -f "$TOOLS/Il2CppDumper.dll" ]]; then
  echo "下载 Il2CppDumper 到 $TOOLS ..."
  tmp_zip="$(mktemp -t il2cppdumper.XXXXXX.zip)"
  curl -fsSL "$ZIP_URL" -o "$tmp_zip"
  unzip -o -q "$tmp_zip" -d "$TOOLS"
  rm -f "$tmp_zip"
fi

echo "运行 Il2CppDumper -> $OUT_DIR"
# Il2CppDumper 目标 net7，本机若仅有更高版本 SDK，允许向前滚动运行
export DOTNET_ROLL_FORWARD="${DOTNET_ROLL_FORWARD:-LatestMajor}"
# 非交互终端会卡在 Console.ReadKey，管道送入换行以正常退出
printf '\n' | dotnet "$TOOLS/Il2CppDumper.dll" "$IL2CPP" "$META" "$OUT_DIR"

echo "完成。主要输出: $OUT_DIR/dump.cs"

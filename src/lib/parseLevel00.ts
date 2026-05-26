/** 解析 *_00.lvl（LevelBaseData）的 protoc --decode_raw 文本 */
export type ParsedLevel00 = {
  levelId: number | null;
  goalCounts: number[];
  boardSlotBytes: number[];
};

export function parseLevel00DecodeRaw(text: string): ParsedLevel00 {
  const levelId = /^1:\s*(\d+)/m.exec(text)?.[1];
  const goalCounts: number[] = [];
  const boardSlotBytes: number[] = [];

  const f2 = /^2:\s*"([^"]*)"/m.exec(text)?.[1];
  if (f2) {
    for (const ch of f2) {
      const code = ch.charCodeAt(0);
      if (code > 0 && code < 256) goalCounts.push(code);
    }
  }

  const f3 = /^3:\s*"([^"]*)"/m.exec(text)?.[1];
  if (f3) {
    for (const ch of f3) {
      const code = ch.charCodeAt(0);
      if (code > 0 && code < 256) boardSlotBytes.push(code);
    }
  }

  return {
    levelId: levelId != null ? Number(levelId) : null,
    goalCounts,
    boardSlotBytes,
  };
}

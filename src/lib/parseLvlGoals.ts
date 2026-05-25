export type LvlGoal = { itemId: number; count: number };

export type ParsedLvlData = {
  levelId: number | null;
  template: string | null;
  duration: number | null;
  field5: number | null;
  collectGoals: LvlGoal[];
  boardGoals: LvlGoal[];
};

/** 解析 protoc --decode_raw 文本中的 field 6/7 目标块 */
export function parseDecodeRaw(text: string): ParsedLvlData {
  const levelId = /^1:\s*(\d+)/m.exec(text)?.[1];
  const template = /^2:\s*"([^"]*)"/m.exec(text)?.[1] ?? null;
  const duration = /^3:\s*(\d+)/m.exec(text)?.[1];
  const field5 = /^5:\s*(\d+)/m.exec(text)?.[1];

  const collectGoals: LvlGoal[] = [];
  const boardGoals: LvlGoal[] = [];
  const re = /(6|7)\s*\{\s*1:\s*(\d+)\s*2:\s*(\d+)\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const goal = { itemId: Number(m[2]), count: Number(m[3]) };
    if (m[1] === "6") collectGoals.push(goal);
    else boardGoals.push(goal);
  }

  return {
    levelId: levelId != null ? Number(levelId) : null,
    template,
    duration: duration != null ? Number(duration) : null,
    field5: field5 != null ? Number(field5) : null,
    collectGoals,
    boardGoals,
  };
}

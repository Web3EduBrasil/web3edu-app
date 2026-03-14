/** 100 XP por nível. */
const XP_PER_LEVEL = 100;

/** Retorna o nível a partir do XP total. */
export const levelFromXp = (xp: number): number =>
  Math.floor(xp / XP_PER_LEVEL) + 1;

/** XP acumulado no início de um determinado nível. */
export const xpBaseForLevel = (level: number): number =>
  (level - 1) * XP_PER_LEVEL;

/** Percentual de progresso dentro do nível atual (0–100). */
export const xpProgressPercent = (xp: number): number => {
  const level = levelFromXp(xp);
  const base = xpBaseForLevel(level);
  return Math.min(100, Math.round(((xp - base) / XP_PER_LEVEL) * 100));
};

/** Quantos XP faltam para o próximo nível. */
export const xpToNextLevel = (xp: number): number => {
  const level = levelFromXp(xp);
  return xpBaseForLevel(level + 1) - xp;
};

/** XP ganho por eventos. */
export const XP_REWARDS = {
  SECTION_COMPLETE: 10,
  TRAIL_COMPLETE: 50,
  PROGRAM_COMPLETE: 100,
} as const;

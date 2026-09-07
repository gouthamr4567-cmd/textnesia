import { ROASTS, SYMPATHY, type RoastCategory } from "../data/roasts";

const recent: Record<string, string[]> = {};

function pickNoRepeat(key: string, pool: string[]): string {
  const used = recent[key] ?? [];
  const fresh = pool.filter((p) => !used.includes(p));
  const list = fresh.length ? fresh : pool;
  const choice = list[Math.floor(Math.random() * list.length)] as string;
  recent[key] = [...used, choice].slice(-Math.max(1, pool.length - 1));
  return choice;
}

export const roastEngine = {
  roast(category: RoastCategory) {
    return pickNoRepeat(`roast:${category}`, ROASTS[category]);
  },
  sympathy() {
    return pickNoRepeat("sympathy", SYMPATHY);
  },
};

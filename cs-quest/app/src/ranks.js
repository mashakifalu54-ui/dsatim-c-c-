// The rank ladder (the server decides your rank; this list is only for showing the ladder).
export const RANK_LADDER = [
  { title: 'Rookie', icon: '🌱', minLevels: 0 },
  { title: 'Apprentice', icon: '🔧', minLevels: 3 },
  { title: 'Coder', icon: '💻', minLevels: 8 },
  { title: 'Debugger', icon: '🐞', minLevels: 15 },
  { title: 'Developer', icon: '🚀', minLevels: 25 },
  { title: 'Engineer', icon: '⚙️', minLevels: 38 },
  { title: 'Architect', icon: '🏛️', minLevels: 52 },
  { title: 'Grandmaster', icon: '👑', minLevels: 68 },
];

// 0 to 1: how far the player is from their current rank to the next one.
export function progressToNextRank(levelsCompleted, rank) {
  if (!rank || !rank.next) return 1;
  const levelsNeeded = rank.next.minLevels - rank.minLevels;
  return Math.min(1, (levelsCompleted - rank.minLevels) / levelsNeeded);
}

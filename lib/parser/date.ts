export function isChristmasSeason(date: Date = new Date()): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return month === 11 && day >= 1 && day <= 26;
}

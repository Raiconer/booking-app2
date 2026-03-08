export function slotToIso(dateKey: string, hourMinute: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = hourMinute.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  return date.toISOString();
}
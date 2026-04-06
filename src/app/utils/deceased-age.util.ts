/**
 * Age of the deceased at date of death (fixed), from yyyy-MM-dd strings.
 * Uses local calendar dates to avoid UTC off-by-one on date-only values.
 */
export function parseYmdLocal(ymd: string | null | undefined): Date | null {
  if (!ymd) return null;
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  const date = new Date(y, mo - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

export function deceasedAgeAtDeath(
  dateOfBirth: string | null | undefined,
  dateOfDeath: string | null | undefined
): number | null {
  const birth = parseYmdLocal(dateOfBirth ?? null);
  const death = parseYmdLocal(dateOfDeath ?? null);
  if (!birth || !death) return null;

  let age = death.getFullYear() - birth.getFullYear();
  const monthDiff = death.getMonth() - birth.getMonth();
  const dayDiff = death.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return Math.max(0, age);
}

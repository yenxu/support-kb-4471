// What #4471 holds once each report sits with the bug that made it.
// The tenant decides (causes.ts), never intake's tag. The desk's oneDayMove reading is kept as a
// footnote, not a problem: those reports come from the same tenants through the same parser.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'Shared date parser reads day-first dates month first',
    what: 'A day-first tenant books 7 April; the invite goes out for 4 July.',
  },
  hint: {
    title: 'booking-v3 form hints MM/DD/YYYY to day-first tenants',
    what: 'People type what the hint says, month first; the form reads it day first.',
  },
  unplaced: {
    title: 'Not placed: tenant unknown or month-first',
    what: 'No tenant on file, or a tenant that writes the month first.',
  },
};

export function problemOf(r: Report, t: Tenant | undefined): Problem {
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // How many of these the desk read as a one-day move.
  readAsOneDay: number;
};

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of uniqueById(all).filter((r) => r.mergedInto === ticket)) {
    const p = problemOf(r, tenantOf(r));
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        readAsOneDay: rs.filter((r) => oneDayMove.includes(r.id)).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

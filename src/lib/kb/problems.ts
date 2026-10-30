// What #4471 holds once each report sits with the bug that made it.
// causes.ts places a report by tenant; that is right for flips, and blind to a date that moved by
// one day. A day/month flip can't move a date by one day, so the desk's oneDayMove reading wins over
// the tenant here.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'Shared date parser reads day-first dates month first',
    what: 'A day-first tenant books 7 April; the invite goes out for 4 July.',
  },
  hint: {
    title: 'booking-v3 form hints MM/DD/YYYY to day-first tenants',
    what: 'People type what the hint says, month first; the form reads it day first.',
  },
  shift: {
    title: 'Invite dates move by one day (time zone, not the parser)',
    what: 'Same month, one day off: Tuesday 12 May shows as Monday 11 May.',
  },
  unplaced: {
    title: 'Not placed: tenant unknown or month-first',
    what: 'No tenant on file, or a tenant that writes the month first.',
  },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of uniqueById(all).filter((r) => r.mergedInto === ticket)) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

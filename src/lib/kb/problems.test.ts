import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { problemOf, problemsIn } from './problems';
import type { Report, Tenant } from './causes';

const dir = 'src/lib/data';
const reports: Report[] = JSON.parse(readFileSync(`${dir}/reports-4471.json`, 'utf8'));
const notes: { oneDayMove: string[] } = JSON.parse(readFileSync(`${dir}/desk-notes.json`, 'utf8'));
const tenants: Tenant[] = readdirSync(`${dir}/tenants`).map((f) => JSON.parse(readFileSync(`${dir}/tenants/${f}`, 'utf8')));
const tenantOf = (r: Report) => tenants.find((t) => t.handle === r.tenant);

const base: Report = {
  id: 'R-1', receivedAt: '2026-05-01T09:00:00+02:00', tenant: 'alder.physio', channel: 'form', subject: 's', body: 'b',
  meta: { browserLocale: 'de-DE', intakeTag: 'parser' }, mergedInto: 4471, mergedAt: null,
};

describe('problemOf', () => {
  it('a booking-v3 form report is the hint bug, whatever intake tagged', () => {
    expect(problemOf(base, tenantOf(base))).toBe('hint');
  });
  it('the same tenant by email goes through the parser', () => {
    expect(problemOf({ ...base, channel: 'email' }, tenantOf(base))).toBe('parser');
  });
  it('no tenant on file stays unplaced', () => {
    expect(problemOf({ ...base, tenant: 'nobody' }, undefined)).toBe('unplaced');
  });
});

describe('#4471 export', () => {
  const rows = problemsIn(reports, 4471, tenantOf, notes.oneDayMove);
  const count = Object.fromEntries(rows.map((r) => [r.problem, r.reports.length]));

  it('counts each report once, though the export repeats rows', () => {
    expect(reports.length).toBeGreaterThan(412);
    expect(rows.reduce((n, r) => n + r.reports.length, 0)).toBe(412);
  });
  it('splits into two problems', () => {
    expect(count).toEqual({ parser: 379, hint: 33 });
  });
  it('keeps the desk\'s one-day readings inside parser, as a footnote', () => {
    expect(rows.find((r) => r.problem === 'parser')?.readAsOneDay).toBe(5);
  });
});

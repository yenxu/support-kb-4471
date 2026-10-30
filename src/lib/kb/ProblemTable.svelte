<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import issues from '#lib/data/issues-4471.json';
  import { problemsIn, PROBLEMS, type Problem } from '#lib/kb/problems';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const rows = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const rowsInExport = (reports as Report[]).filter((r) => r.mergedInto === ticket).length;
  const total = $derived(rows.reduce((n, r) => n + r.reports.length, 0));
  // Issue links are filled in once each ticket exists; until then the row says so.
  const link = (p: Problem): string | undefined => (issues as Record<string, string>)[p];
</script>

<p class="sum">
  <strong>{total}</strong> reports in #{ticket} ·
  <strong>{rows.length}</strong> problems ·
  {rowsInExport - total} duplicate rows in the export dropped
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.problem)}
      <tr>
        <td><code>{r.problem}</code> {PROBLEMS[r.problem].title}<br /><small>{PROBLEMS[r.problem].what}</small></td>
        <td>{r.reports.length}</td>
        <td>{r.tenants}</td>
        <td>{r.firstSeen} → {r.lastSeen}</td>
        <td>{#if link(r.problem)}<a href={link(r.problem)}>{link(r.problem)?.replace(/^.*\/issues\//, '#')}</a>{:else}none yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each rows as r (r.problem)}
  {#if r.readAsOneDay}
    <p class="note">{r.readAsOneDay} of the <code>{r.problem}</code> reports were read by the desk as a one-day move; counted here, with their tenant.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  small, .note { color: var(--muted); }
  .note { font-size: 0.85em; }
</style>

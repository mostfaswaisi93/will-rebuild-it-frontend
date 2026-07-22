import { MonitoringReport } from '@core/models';
import { MockHandler, ok } from '../mock-types';

function summarise(reports: MonitoringReport[]) {
  const count = reports.length;
  const averageScore =
    count > 0 ? reports.reduce((sum, report) => sum + report.score, 0) / count : 0;
  return { count, averageScore };
}

export const handleMonitoring: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'monitoring' || ctx.method !== 'GET' || ctx.segments.length !== 1) {
    return undefined;
  }

  let items = [...ctx.store.monitoringReports];
  const source = ctx.query.get('source');
  if (source) {
    items = items.filter((report) => report.source === source);
  }
  const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
  if (searchKey) {
    items = items.filter(
      (report) =>
        report.projectTitle.toLowerCase().includes(searchKey) ||
        report.teamName.toLowerCase().includes(searchKey),
    );
  }

  const summary = summarise(items);
  items.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const pageNo = Number(ctx.query.get('pageNo') ?? '1') || 1;
  const pageSize = Number(ctx.query.get('pageSize') ?? '10') || 10;
  const start = (pageNo - 1) * pageSize;
  return ok({
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    pageNo,
    pageSize,
    summary,
  });
};

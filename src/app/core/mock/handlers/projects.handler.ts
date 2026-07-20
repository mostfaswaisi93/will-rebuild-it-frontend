import { Project } from '@core/models';
import { MockHandler, notFound, ok, paginate } from '../mock-types';

export const handleProjects: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'projects' || ctx.method !== 'GET') {
    return undefined;
  }

  if (ctx.segments.length === 1) {
    let items: Project[] = ctx.store.projects;

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((project) => project.status === status);
    }

    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (project) =>
          project.projectNumber.toLowerCase().includes(searchKey) ||
          project.title.toLowerCase().includes(searchKey),
      );
    }

    return ok(paginate(items, ctx));
  }

  if (ctx.segments.length === 2) {
    const project = ctx.store.projects.find((candidate) => candidate.id === ctx.segments[1]);
    return project ? ok(project) : notFound(`Project ${ctx.segments[1]} not found.`);
  }

  return undefined;
};

import { Inspection, InspectionKind, WorkOrder, WorkOrderStatus } from '@core/models';
import { inspectionTemplate } from '../fixtures/work-orders.fixture';
import { MockHandler, badRequest, notFound, ok } from '../mock-types';

/** Allowed status transitions. Anything not listed is rejected. */
const TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['dispatched', 'onHold', 'cancelled'],
  dispatched: ['inProgress', 'onHold', 'cancelled'],
  inProgress: ['completed', 'onHold', 'cancelled'],
  onHold: ['dispatched', 'inProgress', 'cancelled'],
  completed: ['inspected'],
  inspected: ['closed'],
  closed: [],
  cancelled: [],
};

interface TransitionBody {
  status?: WorkOrderStatus;
}

interface SubmitInspectionBody {
  items?: { id: string; response: string; photoUrls?: string[] }[];
  notes?: string;
  inspectorName?: string;
  signatureUrl?: string;
}

function summarise(orders: WorkOrder[]) {
  return {
    total: orders.length,
    scheduled: orders.filter((order) => order.status === 'scheduled').length,
    inProgress: orders.filter((order) => order.status === 'inProgress').length,
    completed: orders.filter((order) => order.status === 'completed' || order.status === 'inspected')
      .length,
  };
}

function inspectionField(kind: InspectionKind): 'preWorkInspection' | 'postWorkInspection' {
  return kind === 'preWork' ? 'preWorkInspection' : 'postWorkInspection';
}

export const handleWorkOrders: MockHandler = (ctx) => {
  if (ctx.segments[0] !== 'work-orders') {
    return undefined;
  }

  const order = ctx.segments[1]
    ? ctx.store.workOrders.find((candidate) => candidate.id === ctx.segments[1])
    : undefined;

  // POST /work-orders/:id/transition
  if (ctx.method === 'POST' && ctx.segments.length === 3 && ctx.segments[2] === 'transition') {
    if (!order) {
      return notFound(`Work order ${ctx.segments[1]} not found.`);
    }
    const { status } = (ctx.body ?? {}) as TransitionBody;
    if (!status || !TRANSITIONS[order.status].includes(status)) {
      return badRequest(`Cannot move a ${order.status} work order to ${status}.`);
    }
    // Completing needs the pre-work inspection on record; a post-work
    // inspection is what moves it on to `inspected`.
    if (status === 'completed' && !order.preWorkInspection?.completedAt) {
      return badRequest('The pre-work inspection must be completed first.');
    }
    if (status === 'inspected' && !order.postWorkInspection?.completedAt) {
      return badRequest('The post-work inspection must be completed first.');
    }

    order.status = status;
    if (status === 'completed') {
      order.completedAt = new Date().toISOString();
    }
    return ok(order);
  }

  // GET/POST /work-orders/:id/inspection/:kind
  if (ctx.segments.length === 4 && ctx.segments[2] === 'inspection') {
    if (!order) {
      return notFound(`Work order ${ctx.segments[1]} not found.`);
    }
    const kind = ctx.segments[3] as InspectionKind;
    if (kind !== 'preWork' && kind !== 'postWork') {
      return badRequest('Unknown inspection kind.');
    }
    const field = inspectionField(kind);

    if (ctx.method === 'GET') {
      // Resume an in-progress inspection, or hand back a blank template.
      const existing = order[field];
      const inspection: Inspection = existing ?? {
        kind,
        items: inspectionTemplate(kind),
        notes: '',
        inspectorName: order.primaryStaffName,
        signatureUrl: '',
      };
      return ok(inspection);
    }

    if (ctx.method === 'POST') {
      const body = (ctx.body ?? {}) as SubmitInspectionBody;
      const template = inspectionTemplate(kind);
      const responses = new Map((body.items ?? []).map((item) => [item.id, item]));

      const inspection: Inspection = {
        kind,
        items: template.map((item) => {
          const submitted = responses.get(item.id);
          return {
            ...item,
            response: submitted?.response ?? '',
            photoUrls: submitted?.photoUrls ?? [],
          };
        }),
        notes: body.notes ?? '',
        inspectorName: body.inspectorName?.trim() || order.primaryStaffName,
        signatureUrl: body.signatureUrl ?? '',
        completedAt: new Date().toISOString(),
      };

      order[field] = inspection;
      return ok(order);
    }
  }

  if (ctx.method === 'GET' && ctx.segments.length === 2) {
    return order ? ok(order) : notFound(`Work order ${ctx.segments[1]} not found.`);
  }

  if (ctx.method === 'GET' && ctx.segments.length === 1) {
    let items = [...ctx.store.workOrders];

    const status = ctx.query.get('status');
    if (status) {
      items = items.filter((wo) => wo.status === status);
    }
    const priority = ctx.query.get('priority');
    if (priority) {
      items = items.filter((wo) => wo.priority === priority);
    }
    const governorate = ctx.query.get('governorate');
    if (governorate) {
      items = items.filter((wo) => wo.address.governorate === governorate);
    }
    const searchKey = ctx.query.get('searchKey')?.trim().toLowerCase();
    if (searchKey) {
      items = items.filter(
        (wo) =>
          wo.workOrderNumber.toLowerCase().includes(searchKey) ||
          wo.title.toLowerCase().includes(searchKey) ||
          wo.contactName.toLowerCase().includes(searchKey),
      );
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const summary = summarise(items);
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
  }

  return undefined;
};

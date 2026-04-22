export type AuditFilters = {
  entityTable: string;
  action: string;
};

export type AuditLogRecord = {
  id: string;
  actorUserId: string | null;
  actorDisplay: string;
  entityTable: string;
  entityId: string | null;
  action: string;
  beforeJson: Record<string, unknown>;
  afterJson: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditPageData = {
  logs: AuditLogRecord[];
  filters: AuditFilters;
  entityTables: string[];
  actions: string[];
};

export interface QueueItem {
  uniqueId: string;
  name: string;
  entityName: string;
  entityId: string;
  status: string;
  calledAt?: string;
}

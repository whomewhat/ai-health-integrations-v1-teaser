export type QueueItem = { id: string; type: string; payload: unknown };

const seen = new Set<string>();
const q: QueueItem[] = [];

export const enqueue = (item: QueueItem) => {
  if (seen.has(item.id)) return false; // idempotency
  seen.add(item.id);
  q.push(item);
  return true;
};

export const dequeue = () => q.shift();
export const size = () => q.length;

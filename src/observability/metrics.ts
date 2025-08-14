export type Counters = Record<string, number>;
const counters: Counters = {};

export const inc = (key: string) => {
  counters[key] = (counters[key] || 0) + 1;
};

export const snapshot = (): Counters => ({ ...counters });

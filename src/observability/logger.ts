export const log = (...args: unknown[]) => {
  const ts = new Date().toISOString();
  console.log(ts, "-", ...args);
};

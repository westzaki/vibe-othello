export function getWorkerScope(): Worker {
  return self as unknown as Worker;
}

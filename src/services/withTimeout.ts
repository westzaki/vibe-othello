export type WithTimeoutOptions = {
  onTimeout: () => void;
  timeoutMessage: string;
  timeoutMs: number;
};

export function withTimeout<T>(
  promise: Promise<T>,
  { onTimeout, timeoutMessage, timeoutMs }: WithTimeoutOptions,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onTimeout();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

/**
 * Serialize work per room so read-modify-write updates cannot clobber each other.
 * Not reentrant — callers must not nest `run` for the same key on the same instance.
 */
export class ExclusiveLock {
  private tails = new Map<string, Promise<unknown>>();

  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const k = key.toUpperCase();
    const prev = this.tails.get(k) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.tails.set(
      k,
      next.then(
        () => undefined,
        () => undefined
      )
    );
    return next;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

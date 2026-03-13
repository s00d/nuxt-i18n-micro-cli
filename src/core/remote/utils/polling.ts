export async function waitForProcess<T>(
  check: () => Promise<T>,
  isDone: (value: T) => boolean,
  options?: { intervalMs?: number, maxAttempts?: number },
): Promise<T> {
  const intervalMs = options?.intervalMs ?? 1500
  const maxAttempts = options?.maxAttempts ?? 80

  let last: T | undefined
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await check()
    if (isDone(last)) {
      return last
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Remote process polling timed out')
}

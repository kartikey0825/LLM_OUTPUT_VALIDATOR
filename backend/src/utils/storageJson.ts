export function toJsonString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return JSON.stringify(value);
}

export function fromJsonString<T = unknown>(value: string | null | undefined, fallback?: T): T | undefined {
  if (value === null || value === undefined || value === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

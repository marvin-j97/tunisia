export type HashMap<T> = Record<string, T>;

export function resolveExpressionNames(str: string): string {
  return str
    .split(".")
    .filter((s) => s.length)
    .map((s) => `#${s}`)
    .join(".");
}

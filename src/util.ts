export interface HashMap<T> {
  [key: string]: T;
}

export function resolveExpressionNames(str: string) {
  return str
    .split(".")
    .filter(s => s.length)
    .map(s => `#${s}`)
    .join(".");
}
